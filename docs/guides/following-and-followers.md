---
sidebar_position: 4
title: Following and Followers
description: Implementing the Follow, Accept, and Reject activity flow in ActivityPub
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
async function sendFollow(follower, followee) {
  // Create the Follow activity
  const follow = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Follow',
    actor: follower.id,
    object: followee.id
  };

  // Store the pending follow request
  await db.followRequests.insert({
    id: follow.id,
    follower: follower.id,
    followee: followee.id,
    status: 'pending',
    createdAt: new Date()
  });

  // Deliver to the followee's inbox
  await deliverActivity(follow, followee.inbox, follower);

  return follow;
}
```

## Receiving a Follow Request

When your server receives a Follow activity, you must decide whether to accept or reject it.

### Processing the Follow

```javascript
async function processFollow(activity, signer) {
  // Validate: actor must match signer
  if (activity.actor !== signer.id) {
    throw new Error('Actor does not match signer');
  }

  // Find the local user being followed
  const followee = await db.actors.findOne({ id: activity.object });
  if (!followee) {
    return; // Not our user, ignore
  }

  // Check if already following
  const existing = await db.followers.findOne({
    actor: activity.object,
    follower: activity.actor
  });
  if (existing) {
    // Already following, send Accept anyway (idempotent)
    return sendAccept(followee, activity);
  }

  // Check if follower is blocked
  const blocked = await isBlocked(activity.actor, followee.id);
  if (blocked) {
    return sendReject(followee, activity);
  }

  // Auto-accept or queue for manual approval
  if (followee.manuallyApprovesFollowers) {
    await queueFollowRequest(activity, followee);
  } else {
    await acceptFollow(activity, followee);
  }
}
```

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
  // Add to followers collection
  await db.followers.insert({
    actor: followee.id,
    follower: followActivity.actor,
    createdAt: new Date()
  });

  // Create Accept activity
  const accept = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Accept',
    actor: followee.id,
    object: followActivity
  };

  // Fetch follower's inbox and deliver
  const followerActor = await fetchActor(followActivity.actor);
  await deliverActivity(accept, followerActor.inbox, followee);

  return accept;
}
```

:::tip Object Identifiers
Some implementations include the full Follow activity as the `object`, while others only include the Follow activity's `id`. Both are valid, but including the full activity improves compatibility.
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
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Reject',
    actor: followee.id,
    object: followActivity
  };

  const followerActor = await fetchActor(followActivity.actor);
  await deliverActivity(reject, followerActor.inbox, followee);

  return reject;
}
```

:::note Privacy Consideration
Servers MAY choose not to send a Reject to protect user privacy. The requesting server will be left in a pending state, but this prevents information leakage about blocks.
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
  const undo = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Undo',
    actor: follower.id,
    object: {
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

  // Notify remote server
  const followeeActor = await fetchActor(followee.id);
  await deliverActivity(undo, followeeActor.inbox, follower);
}
```

### Receiving Undo Follow

```javascript
async function processUndoFollow(activity, signer) {
  const followActivity = activity.object;

  // Verify actor owns the original Follow
  const originalActor = typeof followActivity.actor === 'string'
    ? followActivity.actor
    : followActivity.actor.id;

  if (originalActor !== signer.id) {
    throw new Error('Cannot undo follow from another actor');
  }

  // Remove from followers
  await db.followers.remove({
    actor: followActivity.object,
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

    return res.json({
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

  res.json({
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
  return sendAccept(followee, activity);
}
```

### Follow ID Not Dereferenceable

Mastodon uses UUIDs in Follow IDs that aren't dereferenceable URLs. Don't rely on fetching Follow activities by ID.

### Race Conditions

Accept/Reject may arrive before you've stored the Follow request. Handle this by checking the activity content, not just the ID.

## Next Steps

- **[Posts and Replies](/docs/guides/posts-and-replies)** - Creating content
- **[Likes and Shares](/docs/guides/likes-and-shares)** - Engagement activities
- **[Direct Messages](/docs/guides/direct-messages)** - Private messaging
- **[Follow sequence diagram](https://github.com/boyter/activitypub/blob/main/follow-post.md)** - External reference showing the full server-to-server exchange
