---
sidebar_position: 2
title: Handling Incoming Activities
description: Processing activities received in your inbox
---

# Handling Incoming Activities

When other servers send activities to your inbox, you need to verify them and process them appropriately. This guide covers the complete inbox handling flow.

## Inbox Processing Flow

```
Activity arrives at inbox
         ↓
Verify HTTP Signature
         ↓
Validate Activity
         ↓
Check Blocks/Spam
         ↓
Process by Type
         ↓
Return 202 Accepted
```

## Setting Up the Inbox

```javascript
app.post('/users/:username/inbox',
  express.json({ type: ['application/activity+json', 'application/ld+json'] }),
  verifySignature,
  async (req, res) => {
    try {
      await processActivity(req.body, req.params.username);
      res.status(202).send('Accepted');
    } catch (error) {
      console.error('Inbox error:', error);
      res.status(500).json({ error: 'Processing failed' });
    }
  }
);
```

## Activity Validation

```javascript
function validateActivity(activity) {
  // Required fields
  if (!activity.type) throw new Error('Missing type');
  if (!activity.actor) throw new Error('Missing actor');
  if (!activity.id) throw new Error('Missing id');

  // Actor must be a URL
  if (typeof activity.actor !== 'string' ||
      !activity.actor.startsWith('https://')) {
    throw new Error('Invalid actor');
  }

  // Check size limits
  const size = JSON.stringify(activity).length;
  if (size > 1024 * 1024) { // 1MB
    throw new Error('Activity too large');
  }

  return true;
}
```

## Processing by Type

```javascript
async function processActivity(activity, targetUsername) {
  validateActivity(activity);

  switch (activity.type) {
    case 'Create':
      return handleCreate(activity, targetUsername);
    case 'Update':
      return handleUpdate(activity, targetUsername);
    case 'Delete':
      return handleDelete(activity, targetUsername);
    case 'Follow':
      return handleFollow(activity, targetUsername);
    case 'Accept':
      return handleAccept(activity, targetUsername);
    case 'Reject':
      return handleReject(activity, targetUsername);
    case 'Like':
      return handleLike(activity, targetUsername);
    case 'Announce':
      return handleAnnounce(activity, targetUsername);
    case 'Undo':
      return handleUndo(activity, targetUsername);
    case 'Block':
      return handleBlock(activity, targetUsername);
    case 'Flag':
      return handleFlag(activity, targetUsername);
    default:
      console.log('Unknown activity type:', activity.type);
  }
}
```

## Handling Create

```javascript
async function handleCreate(activity, targetUsername) {
  const object = activity.object;

  // Verify attribution
  const attributedTo = typeof object.attributedTo === 'string'
    ? object.attributedTo
    : object.attributedTo?.id;

  if (attributedTo !== activity.actor) {
    throw new Error('Attribution mismatch');
  }

  // Check if we should receive this
  const isAddressedToUs = isRecipient(activity, targetUsername);
  if (!isAddressedToUs) {
    return; // Not for us
  }

  // Store the object
  await db.objects.upsert({
    id: object.id,
    type: object.type,
    actor: activity.actor,
    data: object,
    receivedAt: new Date()
  });

  // Create notification for mentions
  if (object.tag) {
    const ourActorUrl = `https://${DOMAIN}/users/${targetUsername}`;
    const mention = object.tag.find(t =>
      t.type === 'Mention' && t.href === ourActorUrl
    );

    if (mention) {
      await createNotification(targetUsername, 'mention', {
        actor: activity.actor,
        object: object.id
      });
    }
  }

  // If it's a reply to our content, notify
  if (object.inReplyTo) {
    const parent = await db.objects.findOne({ id: object.inReplyTo });
    if (parent && parent.actor === `https://${DOMAIN}/users/${targetUsername}`) {
      await createNotification(targetUsername, 'reply', {
        actor: activity.actor,
        object: object.id,
        parent: object.inReplyTo
      });
    }
  }
}
```

## Handling Follow

```javascript
async function handleFollow(activity, targetUsername) {
  const targetActor = `https://${DOMAIN}/users/${targetUsername}`;

  // Verify the follow is for this user
  if (activity.object !== targetActor) {
    return;
  }

  const followerActor = activity.actor;

  // Check if already following
  const existing = await db.followers.findOne({
    actor: targetActor,
    follower: followerActor
  });

  if (existing) {
    // Already following, just send Accept again
    await sendAccept(targetUsername, activity);
    return;
  }

  // Check if manually approving
  const user = await db.users.findOne({ username: targetUsername });

  if (user.manuallyApprovesFollowers) {
    // Queue for approval
    await db.followRequests.insert({
      actor: targetActor,
      follower: followerActor,
      activity: activity,
      createdAt: new Date()
    });

    await createNotification(targetUsername, 'follow_request', {
      actor: followerActor
    });
  } else {
    // Auto-accept
    await db.followers.insert({
      actor: targetActor,
      follower: followerActor,
      createdAt: new Date()
    });

    await sendAccept(targetUsername, activity);

    await createNotification(targetUsername, 'follow', {
      actor: followerActor
    });
  }
}

async function sendAccept(username, followActivity) {
  const accept = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Accept',
    id: `https://${DOMAIN}/activities/${uuid()}`,
    actor: `https://${DOMAIN}/users/${username}`,
    object: followActivity
  };

  const followerInfo = await fetchActor(followActivity.actor);
  await sendActivity(followerInfo.inbox, accept, username);
}
```

## Handling Accept

```javascript
async function handleAccept(activity, targetUsername) {
  const accepted = activity.object;

  // Check if it's accepting our Follow
  if (accepted.type === 'Follow' &&
      accepted.actor === `https://${DOMAIN}/users/${targetUsername}`) {

    // Add to our following list
    await db.following.upsert({
      actor: `https://${DOMAIN}/users/${targetUsername}`,
      following: activity.actor,
      createdAt: new Date()
    });

    // Update pending follows
    await db.pendingFollows.remove({
      actor: `https://${DOMAIN}/users/${targetUsername}`,
      target: activity.actor
    });
  }
}
```

## Handling Like

```javascript
async function handleLike(activity, targetUsername) {
  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  // Check if it's our content
  const object = await db.objects.findOne({ id: objectId });
  if (!object) return;

  if (object.actor !== `https://${DOMAIN}/users/${targetUsername}`) {
    return; // Not our content
  }

  // Store the like
  await db.likes.upsert({
    actor: activity.actor,
    object: objectId,
    activityId: activity.id,
    createdAt: new Date()
  });

  // Create notification
  await createNotification(targetUsername, 'like', {
    actor: activity.actor,
    object: objectId
  });
}
```

## Handling Announce (Boost)

```javascript
async function handleAnnounce(activity, targetUsername) {
  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  // Check if it's our content
  const object = await db.objects.findOne({ id: objectId });
  if (!object) return;

  if (object.actor !== `https://${DOMAIN}/users/${targetUsername}`) {
    return;
  }

  // Store the boost
  await db.announces.upsert({
    actor: activity.actor,
    object: objectId,
    activityId: activity.id,
    createdAt: new Date()
  });

  // Create notification
  await createNotification(targetUsername, 'boost', {
    actor: activity.actor,
    object: objectId
  });
}
```

## Handling Undo

```javascript
async function handleUndo(activity, targetUsername) {
  const undone = activity.object;

  // Verify the actor owns the original activity
  if (typeof undone === 'object' && undone.actor !== activity.actor) {
    throw new Error('Cannot undo activity you do not own');
  }

  const undoneType = typeof undone === 'string'
    ? (await db.activities.findOne({ id: undone }))?.type
    : undone.type;

  switch (undoneType) {
    case 'Follow':
      await db.followers.remove({
        follower: activity.actor,
        actor: `https://${DOMAIN}/users/${targetUsername}`
      });
      break;

    case 'Like':
      await db.likes.remove({
        actor: activity.actor,
        object: undone.object
      });
      break;

    case 'Announce':
      await db.announces.remove({
        actor: activity.actor,
        object: undone.object
      });
      break;
  }
}
```

## Handling Delete

```javascript
async function handleDelete(activity, targetUsername) {
  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  // Verify actor owns the object
  const object = await db.objects.findOne({ id: objectId });
  if (object && object.actor !== activity.actor) {
    throw new Error('Cannot delete object you do not own');
  }

  // Mark as deleted (Tombstone)
  await db.objects.update(
    { id: objectId },
    {
      $set: {
        type: 'Tombstone',
        formerType: object?.type,
        deleted: new Date()
      }
    }
  );

  // Clean up related data
  await db.likes.remove({ object: objectId });
  await db.announces.remove({ object: objectId });
}
```

## Helper Functions

```javascript
function isRecipient(activity, username) {
  const ourActor = `https://${DOMAIN}/users/${username}`;
  const ourFollowers = `${ourActor}/followers`;
  const publicAddress = 'https://www.w3.org/ns/activitystreams#Public';

  const recipients = [
    ...(activity.to || []),
    ...(activity.cc || []),
    ...(activity.audience || [])
  ];

  return recipients.some(r =>
    r === ourActor ||
    r === ourFollowers ||
    r === publicAddress
  );
}

async function createNotification(username, type, data) {
  await db.notifications.insert({
    username,
    type,
    data,
    read: false,
    createdAt: new Date()
  });
}
```

## Idempotency

Make sure processing is idempotent:

```javascript
async function handleActivityIdempotent(activity) {
  // Check if already processed
  const existing = await db.processedActivities.findOne({
    id: activity.id
  });

  if (existing) {
    return; // Already processed
  }

  // Process activity
  await processActivity(activity);

  // Mark as processed
  await db.processedActivities.insert({
    id: activity.id,
    processedAt: new Date()
  });
}
```

## Next Steps

- **[Sending Activities](/docs/guides/sending-activities)** - Send activities out
- **[Following and Followers](/docs/guides/following-and-followers)** - Manage relationships
