---
sidebar_position: 4
title: Following and Followers
description: Implementing the Follow, Accept, and Reject activity flow in ActivityPub
last_verified: 2026-10-15
verified_against: "ActivityPub REC §7.5–7.7; Mastodon v4.7.3 source (activity/follow.rb, activity/accept.rb, activity/undo.rb, follow_request.rb, tag_manager.rb, context_helper.rb)"
---

# Following and Followers

The follow mechanism is fundamental to ActivityPub. It establishes relationships between actors and determines how content flows through the network. This guide covers implementing Follow, Accept, Reject, and managing follower collections.

## The Follow Flow

<svg viewBox="0 0 500 280" style={{maxWidth: '500px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="followGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="490" height="270" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="490" height="28" rx="12" fill="url(#followGrad)"/>
  <text x="250" y="24" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">FOLLOW FLOW</text>

  {/* Step 1 */}
  <circle cx="30" cy="55" r="12" fill="#6364FF"/>
  <text x="30" y="59" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">1</text>
  <text x="50" y="59" fill="currentColor" fontSize="11" fontWeight="500">Alice sends Follow to Bob's inbox</text>

  {/* Arrow */}
  <line x1="30" y1="70" x2="30" y2="85" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,82 30,92 33,82" fill="#6364FF"/>

  {/* Step 2 */}
  <circle cx="30" cy="105" r="12" fill="#6364FF"/>
  <text x="30" y="109" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">2</text>
  <text x="50" y="109" fill="currentColor" fontSize="11" fontWeight="500">Bob's server validates the request</text>

  {/* Arrow */}
  <line x1="30" y1="120" x2="30" y2="135" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,132 30,142 33,132" fill="#6364FF"/>

  {/* Step 3 */}
  <circle cx="30" cy="155" r="12" fill="#6364FF"/>
  <text x="30" y="159" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">3</text>
  <text x="50" y="159" fill="currentColor" fontSize="11" fontWeight="500">Bob's server decides: Accept or Reject</text>

  {/* Right column */}
  {/* Step 4 */}
  <circle cx="280" cy="55" r="12" fill="#6364FF"/>
  <text x="280" y="59" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">4</text>
  <text x="300" y="59" fill="currentColor" fontSize="11" fontWeight="500">Bob sends Accept/Reject</text>

  <line x1="280" y1="70" x2="280" y2="85" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="277,82 280,92 283,82" fill="#6364FF"/>

  {/* Step 5 */}
  <circle cx="280" cy="105" r="12" fill="#6364FF"/>
  <text x="280" y="109" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">5</text>
  <text x="300" y="109" fill="currentColor" fontSize="11" fontWeight="500">Alice updates following list</text>

  <line x1="280" y1="120" x2="280" y2="135" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="277,132 280,142 283,132" fill="#6364FF"/>

  {/* Step 6 */}
  <circle cx="280" cy="155" r="12" fill="#6364FF"/>
  <text x="280" y="159" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">6</text>
  <text x="300" y="159" fill="currentColor" fontSize="11" fontWeight="500">Posts now delivered to Alice</text>

  {/* Result */}
  <rect x="130" y="195" width="240" height="65" rx="8" fill="url(#followGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="250" y="218" textAnchor="middle" fill="#6364FF" fontSize="12" fontWeight="600">Follow Relationship Established</text>
  <text x="250" y="238" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.8">Alice now receives Bob's public posts</text>
  <text x="250" y="252" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.8">and followers-only content</text>
</svg>

## Sending a Follow Request

### The Follow Activity

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://alice.example/activities/follow-123",
  "type": "Follow",
  "actor": "https://alice.example/users/alice",
  "object": "https://bob.example/users/bob"
}
```

### Implementation

```javascript
import crypto from 'node:crypto';
const idOf = (v) => (typeof v === 'string' ? v : v?.id);

async function sendFollow(follower, followee) {
  // followee: the actor document, fetched SSRF-safely, whose id you checked
  const follow = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${crypto.randomUUID()}`,
    type: 'Follow',
    actor: follower.id,
    object: followee.id
  };

  // Store the pending request BEFORE delivering: the Accept can arrive
  // before the delivery call returns.
  await db.followRequests.insert({
    id: follow.id,
    follower: follower.id,
    followee: followee.id,
    followeeFollowers: followee.followers, // to recognise their followers-only posts
    status: 'pending',
    createdAt: new Date()
  });

  await deliver(followee.inbox, follow); // signed delivery, see Sending Activities

  return follow;
}
```

## Receiving a Follow Request

When your server receives a Follow activity, you must decide whether to accept or reject it.

### Processing the Follow

```javascript
async function processFollow(activity, signer) {
  // Validate: actor must match signer (parseActivityFrom already enforces this)
  if (activity.actor !== signer.id) {
    throw new Error('Actor does not match signer');
  }

  // Find the local user being followed (object may be a URL or an embedded actor)
  const followee = await db.actors.findOne({ id: idOf(activity.object) });
  if (!followee) {
    return; // Not our user, ignore
  }

  // Keep the Follow: an Undo may later reference it only by id
  await db.receivedFollows.upsert({ id: activity.id, actor: activity.actor, object: followee.id });

  // Check if already following
  const existing = await db.followers.findOne({
    actor: activity.object,
    follower: activity.actor
  });
  if (existing) {
    // Already following, send Accept anyway (idempotent)
    return acceptFollow(activity, followee);
  }

  // Blocked follower (or blocked domain): reject
  const blocked = await isBlocked(activity.actor, followee.id);
  if (blocked) {
    return rejectFollow(activity, followee);
  }

  // Auto-accept or queue for manual approval
  if (followee.manuallyApprovesFollowers) {
    await queueFollowRequest(activity, followee);
  } else {
    await acceptFollow(activity, followee);
  }
}
```

Mastodon does the same: a repeated Follow from an existing follower gets another Accept, and a Follow from an account or domain the target blocks (or to an account that has moved) gets a `Reject` ([`follow.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/follow.rb)).

### Manual Approval Flow

```javascript
async function queueFollowRequest(activity, followee) {
  await db.pendingFollows.insert({
    activityId: activity.id,
    follower: activity.actor,
    followee: followee.id,
    createdAt: new Date()
  });

  // Notify the user they have a pending follow request
  await createNotification(followee.id, 'follow_request', {
    from: activity.actor
  });
}

// Called when user approves
async function approveFollowRequest(requestId) {
  const request = await db.pendingFollows.findOne({ _id: requestId });
  const followee = await db.actors.findOne({ id: request.followee });

  // Reconstruct the original Follow activity
  const followActivity = {
    id: request.activityId,
    type: 'Follow',
    actor: request.follower,
    object: request.followee
  };

  await acceptFollow(followActivity, followee);
  await db.pendingFollows.remove({ _id: requestId });
}
```

## Sending Accept

The Accept activity tells the follower that their request was approved.

### Accept Activity Format

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://bob.example/activities/accept-456",
  "type": "Accept",
  "actor": "https://bob.example/users/bob",
  "object": {
    "id": "https://alice.example/activities/follow-123",
    "type": "Follow",
    "actor": "https://alice.example/users/alice",
    "object": "https://bob.example/users/bob"
  }
}
```

### Implementation

```javascript
async function acceptFollow(followActivity, followee) {
  // Fetch the follower ourselves (SSRF-safe) and check its id: never take
  // an inbox URL from the activity.
  const { json: followerActor } = await safeFetchJson(followActivity.actor);
  if (followerActor.id !== followActivity.actor || !followerActor.inbox) return;

  // Add to followers (upsert: a repeated Follow is re-accepted), keeping
  // the inboxes we'll deliver to
  await db.followers.upsert({
    actor: followee.id,
    follower: followerActor.id,
    inbox: followerActor.inbox,
    sharedInbox: followerActor.endpoints?.sharedInbox,
    createdAt: new Date()
  });

  const accept = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${crypto.randomUUID()}`,
    type: 'Accept',
    actor: followee.id,
    object: followActivity
  };
  await deliver(followerActor.inbox, accept);

  return accept;
}
```

:::tip Object Identifiers
Some implementations include the full Follow activity as the `object`, while others only include the Follow activity's `id`. Both are valid, but embed the full activity: Mastodon first matches the Accept's object `id` against its pending requests, and only falls back to the embedded Follow's `object` when that fails ([`accept.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/accept.rb)).
:::

## Sending Reject

Use Reject to decline a follow request.

### Reject Activity Format

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://bob.example/activities/reject-789",
  "type": "Reject",
  "actor": "https://bob.example/users/bob",
  "object": {
    "id": "https://alice.example/activities/follow-123",
    "type": "Follow",
    "actor": "https://alice.example/users/alice",
    "object": "https://bob.example/users/bob"
  }
}
```

### Implementation

```javascript
async function rejectFollow(followActivity, followee) {
  const reject = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${crypto.randomUUID()}`,
    type: 'Reject',
    actor: followee.id,
    object: followActivity
  };

  const { json: followerActor } = await safeFetchJson(followActivity.actor);
  if (followerActor.id === followActivity.actor && followerActor.inbox) {
    await deliver(followerActor.inbox, reject);
  }

  return reject;
}
```

:::note Privacy Consideration
The spec doesn't require a Reject. You can leave a request pending instead, so the requester can't tell they were blocked. Mastodon does send a Reject when the follower is blocked.
:::

## Receiving Accept/Reject

When your server receives an Accept or Reject for a Follow you sent:

```javascript
async function processAccept(activity, signer) {
  const followActivity = activity.object;

  // Handle both inline object and ID reference
  const followId = typeof followActivity === 'string'
    ? followActivity
    : followActivity.id;

  // Find the pending follow request
  const pending = await db.followRequests.findOne({
    $or: [
      { id: followId },
      { followee: signer.id, status: 'pending' }
    ]
  });

  if (!pending) {
    return; // Unknown follow request
  }

  // Verify the Accept is from the person we followed
  if (signer.id !== pending.followee) {
    throw new Error('Accept not from followee');
  }

  // Update our following list
  await db.following.insert({
    actor: pending.follower,
    following: pending.followee,
    followersCollection: pending.followeeFollowers,
    createdAt: new Date()
  });

  // Mark request as accepted
  await db.followRequests.update(
    { id: pending.id },
    { $set: { status: 'accepted' } }
  );
}

async function processReject(activity, signer) {
  const followActivity = activity.object;
  const followId = typeof followActivity === 'string'
    ? followActivity
    : followActivity.id;

  // Remove the pending follow request
  await db.followRequests.remove({
    $or: [
      { id: followId },
      { followee: signer.id, status: 'pending' }
    ]
  });
}
```

## Unfollowing (Undo Follow)

To unfollow, send an Undo activity wrapping the original Follow.

### Undo Follow Format

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://alice.example/activities/undo-123",
  "type": "Undo",
  "actor": "https://alice.example/users/alice",
  "object": {
    "id": "https://alice.example/activities/follow-123",
    "type": "Follow",
    "actor": "https://alice.example/users/alice",
    "object": "https://bob.example/users/bob"
  }
}
```

### Sending Undo

```javascript
async function sendUnfollow(follower, followee) {
  // Embed the original Follow, with its id, so the receiver can match it
  const original = await db.followRequests.findOne({ follower: follower.id, followee: followee.id });
  const undo = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${crypto.randomUUID()}`,
    type: 'Undo',
    actor: follower.id,
    object: {
      ...(original && { id: original.id }),
      type: 'Follow',
      actor: follower.id,
      object: followee.id
    }
  };

  // Remove from local following list
  await db.following.remove({
    actor: follower.id,
    following: followee.id
  });

  // Notify the remote server (followee: actor document fetched earlier)
  await deliver(followee.inbox, undo);
}
```

### Receiving Undo Follow

```javascript
async function processUndoFollow(activity, signer) {
  // The Follow may be embedded or just referenced by id
  const followActivity = typeof activity.object === 'string'
    ? await db.receivedFollows.findOne({ id: activity.object })
    : activity.object;
  if (!followActivity) return;

  // Verify actor owns the original Follow
  if (idOf(followActivity.actor) !== signer.id) {
    throw new Error('Cannot undo follow from another actor');
  }

  // Remove from followers
  await db.followers.remove({
    actor: idOf(followActivity.object),
    follower: signer.id
  });
}
```

## Followers Collection

Expose followers as an ActivityPub Collection:

```javascript
app.get('/users/:username/followers', async (req, res) => {
  const actor = await db.actors.findOne({
    preferredUsername: req.params.username
  });

  if (!actor) {
    return res.status(404).send();
  }

  const page = parseInt(req.query.page) || null;
  const pageSize = 20;

  if (page) {
    // Return a page of followers
    const followers = await db.followers
      .find({ actor: actor.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalCount = await db.followers.count({ actor: actor.id });
    const totalPages = Math.ceil(totalCount / pageSize);

    return res.type('application/activity+json').json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollectionPage',
      id: `${actor.id}/followers?page=${page}`,
      partOf: `${actor.id}/followers`,
      orderedItems: followers.map(f => f.follower),
      ...(page < totalPages && {
        next: `${actor.id}/followers?page=${page + 1}`
      }),
      ...(page > 1 && {
        prev: `${actor.id}/followers?page=${page - 1}`
      })
    });
  }

  // Return collection summary
  const totalItems = await db.followers.count({ actor: actor.id });

  res.type('application/activity+json').json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${actor.id}/followers`,
    totalItems,
    first: `${actor.id}/followers?page=1`
  });
});
```

## Locked Accounts

For accounts requiring manual follow approval:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "manuallyApprovesFollowers": "as:manuallyApprovesFollowers"
    }
  ],
  "type": "Person",
  "id": "https://example.com/users/private",
  "manuallyApprovesFollowers": true
}
```

## Common Issues

### Duplicate Follows

Handle duplicate Follow activities gracefully:

```javascript
if (existing) {
  // Already following - send Accept again (idempotent)
  return acceptFollow(activity, followee);
}
```

### Follow ID Not Dereferenceable

Mastodon gives Follow activities ids like `https://mastodon.example/payloads/<uuid>` ([`tag_manager.rb` `generate_uri_for`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/tag_manager.rb)) and has no route that serves them. Store the Follows you receive, and never rely on fetching a Follow by its id.

### Race Conditions

The Accept can arrive before your delivery call has even returned. Store the pending Follow **before** you deliver it (as `sendFollow` above does), so the Accept always finds it.

## Next Steps

- **[Posts and Replies](/docs/guides/posts-and-replies)** - Creating content
- **[Likes and Shares](/docs/guides/likes-and-shares)** - Engagement activities
- **[Direct Messages](/docs/guides/direct-messages)** - Private messaging
- **[Follow sequence diagram](https://github.com/boyter/activitypub/blob/main/follow-post.md)** - External reference showing the full server-to-server exchange
