---
sidebar_position: 6
title: Likes and Shares
description: Implementing Like (favourite) and Announce (boost/reblog) activities in ActivityPub
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

  // Create notification for the author
  await createNotification(object.attributedTo, 'favourite', {
    actor: activity.actor,
    object: objectId
  });
}
```

## Announce Activity (Boost/Share)

The Announce activity shares content to your followers—known as "boosting" or "reblogging."

### Announce Format

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

  // Can't boost non-public posts
  const isPublic = object.to?.includes('https://www.w3.org/ns/activitystreams#Public') ||
                   object.cc?.includes('https://www.w3.org/ns/activitystreams#Public');

  if (!isPublic) {
    throw new Error('Cannot boost non-public posts');
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
      `${actor.id}/followers`
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

```javascript
async function processAnnounce(activity, signer) {
  if (activity.actor !== signer.id) {
    throw new Error('Actor mismatch');
  }

  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  // Try to fetch the announced object if we don't have it
  let object = await db.notes.findOne({ id: objectId });

  if (!object) {
    try {
      object = await fetchObject(objectId);
      await db.notes.insert(object);
    } catch (error) {
      console.log('Could not fetch announced object:', objectId);
      return;
    }
  }

  // Record the announce
  await db.announces.insert({
    id: activity.id,
    actor: activity.actor,
    object: objectId,
    createdAt: new Date()
  });

  // If the announced object is ours, notify the author
  if (object.attributedTo?.startsWith(`https://${config.domain}`)) {
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

```javascript
async function processUndoLike(activity, signer) {
  const likeActivity = activity.object;

  // Verify actor owns the Like
  const likeActor = typeof likeActivity.actor === 'string'
    ? likeActivity.actor
    : likeActivity.actor.id;

  if (likeActor !== signer.id) {
    throw new Error('Cannot undo like from another actor');
  }

  const objectId = typeof likeActivity.object === 'string'
    ? likeActivity.object
    : likeActivity.object.id;

  // Remove the like
  await db.likes.remove({
    actor: signer.id,
    object: objectId
  });
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
    cc: [`${actor.id}/followers`],
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

  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Collection',
    id: `${noteId}/likes`,
    totalItems
    // Note: Mastodon doesn't expose individual likes
  });
});
```

## Shares Collection

Expose shares/announces as a Collection:

```javascript
app.get('/notes/:id/shares', async (req, res) => {
  const noteId = `https://${config.domain}/notes/${req.params.id}`;

  const totalItems = await db.announces.count({ object: noteId });

  res.json({
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

Different implementations handle this differently:
- **Mastodon**: Like counts visible, individual likers are not exposed via AP
- **Pleroma**: Full like list available
- **Your choice**: Decide based on your privacy goals

### Boost Restrictions

Only public and unlisted posts should be boostable:

```javascript
function canBoost(object) {
  const publicAddress = 'https://www.w3.org/ns/activitystreams#Public';

  return object.to?.includes(publicAddress) ||
         object.cc?.includes(publicAddress);
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

function getOriginalAuthor(activity) {
  if (isBoost(activity)) {
    // The object's attributedTo is the real author
    return activity.object.attributedTo;
  }
  return activity.actor;
}
```

## Next Steps

- **[Direct Messages](/docs/guides/direct-messages)** - Private messaging
- **[Mentions and Hashtags](/docs/guides/mentions-and-hashtags)** - Tagging
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Implementation details
- **[Announce sequence diagram](https://github.com/boyter/activitypub/blob/main/announce-post.md)** - External reference for the boost exchange
