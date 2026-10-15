---
sidebar_position: 2
title: Handling Incoming Activities
description: Processing activities received in your inbox
---

# Handling Incoming Activities

When other servers send activities to your inbox, you need to verify them and process them appropriately. This guide covers the complete inbox handling flow.

## Inbox Processing Flow

<svg viewBox="0 0 400 280" style={{maxWidth: '400px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="inboxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="390" height="270" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>

  {/* Step 1 */}
  <rect x="100" y="15" width="200" height="32" rx="6" fill="url(#inboxGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="200" y="36" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="600">Activity arrives at inbox</text>

  <line x1="200" y1="47" x2="200" y2="60" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="197,57 200,67 203,57" fill="#6364FF"/>

  {/* Step 2 */}
  <rect x="100" y="68" width="200" height="32" rx="6" fill="url(#inboxGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="200" y="89" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="600">Verify HTTP Signature</text>

  <line x1="200" y1="100" x2="200" y2="113" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="197,110 200,120 203,110" fill="#6364FF"/>

  {/* Step 3 */}
  <rect x="100" y="121" width="200" height="32" rx="6" fill="url(#inboxGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="200" y="142" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="600">Validate Activity</text>

  <line x1="200" y1="153" x2="200" y2="166" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="197,163 200,173 203,163" fill="#6364FF"/>

  {/* Step 4 */}
  <rect x="100" y="174" width="200" height="32" rx="6" fill="url(#inboxGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="200" y="195" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="600">Check Blocks/Spam</text>

  <line x1="200" y1="206" x2="200" y2="219" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="197,216 200,226 203,216" fill="#6364FF"/>

  {/* Step 5 */}
  <rect x="100" y="227" width="200" height="32" rx="6" fill="#6364FF"/>
  <text x="200" y="248" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Return 202 Accepted</text>

  {/* Side annotations */}
  <text x="388" y="89" textAnchor="end" fill="currentColor" fontSize="9" opacity="0.7">→ 401 if invalid</text>
  <text x="388" y="142" textAnchor="end" fill="currentColor" fontSize="9" opacity="0.7">→ 400 if malformed</text>
  <text x="388" y="195" textAnchor="end" fill="currentColor" fontSize="9" opacity="0.7">→ 403 if blocked</text>
</svg>

## Setting Up the Inbox

```javascript
import { verifyRequest, parseActivityFrom, authorizeActivity,
         SignatureError, AuthorizationError } from './verify-requests/src/index.js';
// keyStore: see /docs/security/verifying-requests

app.post('/users/:username/inbox',
  express.raw({ type: '*/*', limit: '1mb' }), // keep the raw bytes: the digest is over them
  async (req, res) => {
    let activity;
    try {
      const signer = await verifyRequest({
        method: req.method,
        url: `https://${DOMAIN}${req.originalUrl}`,
        headers: req.headers,
        rawBody: req.body,
      }, { keyStore });
      activity = parseActivityFrom(signer, req.body); // the signer MUST be activity.actor
      authorizeActivity(activity);                    // same-origin rules for Create/Update/Delete/Undo
    } catch (error) {
      const status = error instanceof SignatureError ? 401
        : error instanceof AuthorizationError ? 403 : 503;
      return res.status(status).json({ error: error.message });
    }
    try {
      await processActivity(activity, req.params.username);
      res.status(202).send('Accepted');
    } catch (error) {
      console.error('Inbox error:', error);
      res.status(500).json({ error: 'Processing failed' });
    }
  }
);
```

:::tip Use the tested verifier
Request verification has its own page with tested code: **[Verifying incoming requests](/docs/security/verifying-requests)**. It covers draft-cavage and RFC 9421, the digest over the raw body, the required signed headers, binding the key owner to `activity.actor`, and SSRF-safe key fetching.
:::

Activities that were **forwarded** by another server are signed by the forwarder, not by `activity.actor`, so `parseActivityFrom` rejects them. To accept them, refetch the object from its origin instead (see [inbox forwarding](/docs/security/origin-model#inbox-forwarding)).

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
  // authorizeActivity() (see "Setting Up the Inbox") has already rejected a
  // Create whose object id is on a different origin from the actor. Without
  // that check, the upsert below would let evil.example overwrite objects
  // belonging to other servers (the CVE-2024-23832 bug class).
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
  const localActor = `https://${DOMAIN}/users/${targetUsername}`;

  // The Accept may embed the Follow or just reference it by id. Either way,
  // only trust *our own record* of the Follow: an embedded copy is written by
  // the sender and proves nothing.
  const followId = typeof activity.object === 'string'
    ? activity.object
    : activity.object?.id;
  if (!followId) return;

  // Accept only a Follow we actually sent, from this local actor, to the
  // actor who is now accepting it (activity.actor is the verified signer).
  const pending = await db.pendingFollows.findOne({
    id: followId,
    actor: localActor,
    target: activity.actor
  });
  if (!pending) return; // unsolicited Accept: ignore it

  await db.following.upsert({
    actor: localActor,
    following: activity.actor,
    createdAt: new Date()
  });
  await db.pendingFollows.remove({ id: followId });
}
```

When you send a Follow, store it in `pendingFollows` with its `id`, your actor and the target actor, so the Accept can be matched against it. Mastodon does the same: it matches the Accept's object id against its own pending follow requests, and only when that fails and a `Follow` is embedded does it fall back to the pending request between the local account and the accepting actor ([accept.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/accept.rb)). Either way, a pending Follow must already exist.

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
- **[Deletion](/docs/guides/deletion)** - Receiving Delete safely, tombstones and Delete-before-Create
