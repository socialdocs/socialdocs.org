---
sidebar_position: 6
title: Likes and Shares
description: Implementing Like (favourite) and Announce (boost/reblog) activities in ActivityPub
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (activity/like.rb, activity/announce.rb, activity/undo.rb, tag_manager.rb, status_policy.rb, likes_controller.rb, shares_controller.rb), ActivityPub REC §5.7-5.8, §7.8-7.11"
---

# Likes and Shares

Engagement activities allow users to interact with content beyond just viewing it. In ActivityPub, **Like** represents favouriting/liking content, while **Announce** represents sharing/boosting/reblogging. This guide covers implementing both.

## Like Activity

The Like activity indicates appreciation for content without sharing it.

### Like Format

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/like-123",
  "type": "Like",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/notes/456"
}
```

### Sending a Like

```javascript
async function sendLike(actor, objectId) {
  // Check if already liked
  const existing = await db.likes.findOne({
    actor: actor.id,
    object: objectId
  });

  if (existing) {
    return existing; // Already liked
  }

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Like',
    actor: actor.id,
    object: objectId
  };

  // Store locally
  await db.likes.insert({
    id: activity.id,
    actor: actor.id,
    object: objectId,
    createdAt: new Date()
  });

  // Fetch the object to get the author's inbox
  const object = await fetchObject(objectId);
  const author = await fetchActor(object.attributedTo);

  // Deliver to the object's author
  await deliverActivity(activity, author.inbox, actor);

  return activity;
}
```

### Receiving a Like

```javascript
async function processLike(activity, signer) {
  // Validate actor matches signer
  if (activity.actor !== signer.id) {
    throw new Error('Actor mismatch');
  }

  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  // Find the local object
  const object = await db.notes.findOne({ id: objectId });
  if (!object) {
    return; // Not our object
  }

  // Check if already liked
  const existing = await db.likes.findOne({
    actor: activity.actor,
    object: objectId
  });

  if (existing) {
    return; // Already recorded
  }

  // Record the like
  await db.likes.insert({
    id: activity.id,
    actor: activity.actor,
    object: objectId,
    createdAt: new Date()
  });

  // Mastodon treats every Like as a plain favourite — it ignores any
  // emoji `content`/`_misskey_reaction` (see Custom Emoji)
  await createNotification(object.attributedTo, 'favourite', {
    actor: activity.actor,
    object: objectId
  });
}
```

## Announce Activity (Boost/Share)

The Announce activity shares content to your followers—known as "boosting" or "reblogging."

### Announce Format

Mastodon sends a public boost to `as:Public`, with the boosted post's author and the booster's followers in `cc` ([`tag_manager.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/tag_manager.rb)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/announce-123",
  "type": "Announce",
  "actor": "https://example.com/users/alice",
  "published": "2024-01-15T10:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://other.example/users/bob",
    "https://example.com/users/alice/followers"
  ],
  "object": "https://other.example/notes/456"
}
```

### Sending an Announce

```javascript
async function sendAnnounce(actor, objectId) {
  // Check if already announced
  const existing = await db.announces.findOne({
    actor: actor.id,
    object: objectId
  });

  if (existing) {
    return existing;
  }

  // Fetch the original object
  const object = await fetchObject(objectId);

  if (!canBoost(object, actor)) {
    throw new Error('This post cannot be boosted');
  }

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Announce',
    actor: actor.id,
    published: new Date().toISOString(),
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [
      object.attributedTo, // Notify the original author
      actor.followers
    ],
    object: objectId
  };

  // Store locally
  await db.announces.insert({
    id: activity.id,
    actor: actor.id,
    object: objectId,
    createdAt: new Date()
  });

  // Add to actor's outbox
  await db.outbox.insert({
    actor: actor.id,
    activity: activity,
    createdAt: new Date()
  });

  // Deliver to followers and original author
  await deliverToRecipients(activity, actor);

  return activity;
}
```

### Receiving an Announce

The announced object usually belongs to a *third* server, so an embedded copy proves nothing: fetch it from its own origin. Mastodon also drops boosts nobody local cares about (the booster isn't followed locally, it didn't arrive via a relay, and the post isn't local) and only accepts boosts of public/unlisted posts, or of the booster's own posts ([`announce.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/announce.rb)):

```javascript
async function processAnnounce(activity, signer) {
  if (activity.actor !== signer.id) {
    throw new Error('Actor mismatch');
  }

  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object?.id;
  if (!objectId) return;

  let object = await db.notes.findOne({ id: objectId });
  if (!object) {
    if (!(await isFollowedLocally(activity.actor))) return; // nobody here cares

    try {
      // Ignore any embedded copy; fetch from the object's origin and make
      // sure the document really lives there (see the Origin Model page)
      object = await safeFetchObject(objectId);
      if (new URL(object.id).origin !== new URL(objectId).origin) return;
    } catch (error) {
      console.log('Could not fetch announced object:', objectId);
      return;
    }
    if (!canBoost(object, { id: activity.actor })) return;
    await db.notes.insert(object);
  }

  // Record the announce
  await db.announces.insert({
    id: activity.id,
    actor: activity.actor,
    object: objectId,
    createdAt: new Date()
  });

  // If the announced object is ours, notify the author
  // (compare origins — a startsWith() prefix check also matches example.com.evil)
  if (new URL(object.id).origin === `https://${config.domain}`) {
    await createNotification(object.attributedTo, 'reblog', {
      actor: activity.actor,
      object: objectId
    });
  }

  // Add to timelines for followers of the announcer
  await addToFollowerTimelines(activity.actor, activity);
}
```

## Undo Like

To unlike, send an Undo wrapping the Like:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/undo-like-123",
  "type": "Undo",
  "actor": "https://example.com/users/alice",
  "object": {
    "id": "https://example.com/activities/like-123",
    "type": "Like",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/notes/456"
  }
}
```

### Implementation

```javascript
async function sendUndoLike(actor, objectId) {
  const like = await db.likes.findOne({
    actor: actor.id,
    object: objectId
  });

  if (!like) {
    return; // Nothing to undo
  }

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Undo',
    actor: actor.id,
    object: {
      id: like.id,
      type: 'Like',
      actor: actor.id,
      object: objectId
    }
  };

  // Remove local record
  await db.likes.remove({ _id: like._id });

  // Notify the object's author
  const object = await fetchObject(objectId);
  const author = await fetchActor(object.attributedTo);
  await deliverActivity(activity, author.inbox, actor);
}
```

### Receiving Undo Like

The wrapped Like may be embedded or just its `id`, so look it up by id when you can, and only ever remove the signer's own likes:

```javascript
async function processUndoLike(activity, signer) {
  if (activity.actor !== signer.id) {
    throw new Error('Actor mismatch');
  }

  const likeActivity = activity.object;
  const likeId = typeof likeActivity === 'string' ? likeActivity : likeActivity?.id;

  // Prefer the stored Like (works when only the id is sent)
  const stored = likeId && await db.likes.findOne({ id: likeId, actor: signer.id });
  if (stored) {
    await db.likes.remove({ id: stored.id });
    return;
  }

  // Fall back to the embedded Like's object
  const objectId = typeof likeActivity?.object === 'string'
    ? likeActivity.object
    : likeActivity?.object?.id;
  if (objectId) {
    await db.likes.remove({ actor: signer.id, object: objectId });
  }
}
```

## Undo Announce

To unboost, send an Undo wrapping the Announce:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/undo-announce-123",
  "type": "Undo",
  "actor": "https://example.com/users/alice",
  "object": {
    "id": "https://example.com/activities/announce-123",
    "type": "Announce",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/notes/456"
  }
}
```

### Implementation

```javascript
async function sendUndoAnnounce(actor, objectId) {
  const announce = await db.announces.findOne({
    actor: actor.id,
    object: objectId
  });

  if (!announce) {
    return;
  }

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Undo',
    actor: actor.id,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [actor.followers],
    object: {
      id: announce.id,
      type: 'Announce',
      actor: actor.id,
      object: objectId
    }
  };

  // Remove local record
  await db.announces.remove({ _id: announce._id });

  // Deliver to followers
  await deliverToRecipients(activity, actor);
}
```

## Likes Collection

Expose likes as a Collection on objects:

```javascript
app.get('/notes/:id/likes', async (req, res) => {
  const noteId = `https://${config.domain}/notes/${req.params.id}`;

  const totalItems = await db.likes.count({ object: noteId });

  res.type('application/activity+json').json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Collection',
    id: `${noteId}/likes`,
    totalItems
    // Mastodon's likes/shares collections also carry only totalItems
  });
});
```

## Shares Collection

Expose shares/announces as a Collection:

```javascript
app.get('/notes/:id/shares', async (req, res) => {
  const noteId = `https://${config.domain}/notes/${req.params.id}`;

  const totalItems = await db.announces.count({ object: noteId });

  res.type('application/activity+json').json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Collection',
    id: `${noteId}/shares`,
    totalItems
  });
});
```

## Displaying Counts

```javascript
async function getEngagementCounts(noteId) {
  const [likes, announces, replies] = await Promise.all([
    db.likes.count({ object: noteId }),
    db.announces.count({ object: noteId }),
    db.notes.count({ inReplyTo: noteId })
  ]);

  return { likes, announces, replies };
}
```

## Privacy Considerations

### Who Can See Likes?

Mastodon's `likes` and `shares` collections expose only `totalItems`, never who liked or boosted ([`likes_controller.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/likes_controller.rb)). Whether you list individual likers is a privacy decision for your software.

### Boost Restrictions

Mastodon lets anyone boost public and unlisted posts, and lets authors boost their **own** followers-only posts; direct and limited posts can't be boosted ([`status_policy.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/policies/status_policy.rb)). Also respect a post's `interactionPolicy.canAnnounce` where present (see [Quote Posts and Interaction Policies](/docs/guides/quote-posts-and-interaction-policies)).

```javascript
const PUBLIC = new Set(['https://www.w3.org/ns/activitystreams#Public', 'as:Public', 'Public']);

function canBoost(object, booster) {
  const addressed = [].concat(object.to || [], object.cc || []);
  if (addressed.some(a => PUBLIC.has(a))) return true;      // public or unlisted
  return object.attributedTo === booster.id;                // self-boost
}
```

## Common Issues

### Stale Counts

Federation means counts may be outdated. Consider:

```javascript
async function refreshCounts(noteId) {
  // Only refresh periodically
  const note = await db.notes.findOne({ id: noteId });
  const lastRefresh = note.countsRefreshedAt || 0;
  const hourAgo = Date.now() - 60 * 60 * 1000;

  if (lastRefresh > hourAgo) {
    return; // Recently refreshed
  }

  // Fetch fresh data from source
  // This is implementation-specific
}
```

### Duplicate Activities

Handle duplicate Like/Announce gracefully:

```javascript
const existing = await db.likes.findOne({
  actor: activity.actor,
  object: objectId
});

if (existing) {
  return; // Idempotent - just ignore
}
```

### Announce vs Create

Don't confuse boosted content with original content:

```javascript
function isBoost(activity) {
  return activity.type === 'Announce';
}

async function getOriginalAuthor(activity) {
  if (isBoost(activity)) {
    // The real author is the announced object's attributedTo — read it from
    // the copy you fetched from its origin, not from an embedded object
    const object = await db.notes.findOne({ id: activity.object?.id ?? activity.object });
    return object?.attributedTo;
  }
  return activity.actor;
}
```

## Next Steps

- **[Direct Messages](/docs/guides/direct-messages)** - Private messaging
- **[Mentions and Hashtags](/docs/guides/mentions-and-hashtags)** - Tagging
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Implementation details
- **[Announce sequence diagram](https://github.com/boyter/activitypub/blob/main/announce-post.md)** - External reference for the boost exchange
