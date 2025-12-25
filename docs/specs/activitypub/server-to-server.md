---
sidebar_position: 7
title: Server-to-Server
description: The ActivityPub Server-to-Server federation protocol
---

# Server-to-Server (S2S)

The Server-to-Server protocol is how ActivityPub servers federate with each other. This is the heart of the Fediverse — enabling communication across independent servers.

## Overview

```
┌─────────────────┐                    ┌─────────────────┐
│    Server A     │  POST to inbox     │    Server B     │
│   (Sender)      │───────────────────►│   (Receiver)    │
│                 │  with HTTP Sig     │                 │
│                 │                    │                 │
│   alice@a.com   │                    │   bob@b.com     │
└─────────────────┘                    └─────────────────┘
```

## Core Operations

### 1. Deliver Activity

POST an activity to a remote inbox:

```http
POST /users/bob/inbox HTTP/1.1
Host: server-b.com
Date: Sun, 15 Jan 2024 10:30:00 GMT
Digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=
Signature: keyId="https://server-a.com/users/alice#main-key",...
Content-Type: application/activity+json

{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://server-a.com/users/alice",
  "object": {
    "type": "Note",
    "content": "Hello from Server A!"
  }
}
```

### 2. Fetch Actor

GET a remote actor profile:

```http
GET /users/bob HTTP/1.1
Host: server-b.com
Accept: application/activity+json
```

### 3. Fetch Object

GET a remote object:

```http
GET /notes/123 HTTP/1.1
Host: server-b.com
Accept: application/activity+json
```

## Authentication

All inbox POSTs MUST be signed with HTTP Signatures:

```http
Signature: keyId="https://server-a.com/users/alice#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest",
           signature="..."
```

### Verification Process

```
1. Parse Signature header
2. Extract keyId URL
3. Fetch actor from keyId domain
4. Get publicKeyPem from actor
5. Verify signature against request
6. Verify actor domain matches keyId domain
```

```javascript
async function verifyRequest(req) {
  const sig = parseSignatureHeader(req.headers.signature);

  // Fetch the key
  const keyUrl = new URL(sig.keyId);
  const actorUrl = sig.keyId.split('#')[0];
  const actor = await fetchActor(actorUrl);

  // Verify key ownership
  if (actor.publicKey.id !== sig.keyId) {
    throw new Error('Key not found on actor');
  }

  // Verify domains match
  const actorDomain = new URL(actor.id).hostname;
  const keyDomain = keyUrl.hostname;
  if (actorDomain !== keyDomain) {
    throw new Error('Domain mismatch');
  }

  // Verify signature
  const valid = verifySignature(req, actor.publicKey.publicKeyPem, sig);
  if (!valid) {
    throw new Error('Invalid signature');
  }

  return actor;
}
```

## Activity Processing

When receiving an activity:

### 1. Verify Request

```javascript
app.post('/users/:username/inbox', async (req, res) => {
  try {
    const actor = await verifyRequest(req);
    await processActivity(req.body, actor);
    res.status(202).send();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

### 2. Validate Activity

```javascript
function validateActivity(activity, signer) {
  // Actor must match signer
  if (activity.actor !== signer.id) {
    throw new Error('Actor does not match signer');
  }

  // Required fields
  if (!activity.type) throw new Error('Missing type');
  if (!activity.actor) throw new Error('Missing actor');

  // Type-specific validation
  switch (activity.type) {
    case 'Create':
      validateCreate(activity);
      break;
    case 'Delete':
      validateDelete(activity);
      break;
    // ...
  }
}
```

### 3. Process by Type

```javascript
async function processActivity(activity, actor) {
  validateActivity(activity, actor);

  switch (activity.type) {
    case 'Create':
      return processCreate(activity);
    case 'Update':
      return processUpdate(activity);
    case 'Delete':
      return processDelete(activity);
    case 'Follow':
      return processFollow(activity);
    case 'Accept':
      return processAccept(activity);
    case 'Reject':
      return processReject(activity);
    case 'Like':
      return processLike(activity);
    case 'Announce':
      return processAnnounce(activity);
    case 'Undo':
      return processUndo(activity);
    case 'Block':
      return processBlock(activity);
    case 'Flag':
      return processFlag(activity);
    default:
      console.log('Unhandled activity type:', activity.type);
  }
}
```

## Activity-Specific Processing

### Create

```javascript
async function processCreate(activity) {
  const object = activity.object;

  // Verify attribution
  if (object.attributedTo !== activity.actor) {
    throw new Error('Attribution mismatch');
  }

  // Store the object
  await db.objects.upsert({
    id: object.id,
    type: object.type,
    data: object,
    receivedAt: new Date()
  });

  // Process mentions
  if (object.tag) {
    for (const tag of object.tag) {
      if (tag.type === 'Mention') {
        await notifyMention(tag.href, object);
      }
    }
  }
}
```

### Follow

```javascript
async function processFollow(activity) {
  const followee = await db.actors.findOne({ id: activity.object });

  if (!followee) {
    return; // Not our user
  }

  if (followee.manuallyApprovesFollowers) {
    // Queue for approval
    await db.followRequests.insert({
      follower: activity.actor,
      followee: activity.object,
      activityId: activity.id,
      createdAt: new Date()
    });
    // Notify user of pending request
  } else {
    // Auto-accept
    await acceptFollow(activity);
  }
}

async function acceptFollow(followActivity) {
  // Add to followers
  await db.followers.insert({
    actor: followActivity.object,
    follower: followActivity.actor
  });

  // Send Accept
  const accept = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Accept',
    id: `https://example.com/activities/${uuid()}`,
    actor: followActivity.object,
    object: followActivity
  };

  const followerActor = await fetchActor(followActivity.actor);
  await deliverActivity(accept, [followerActor.inbox]);
}
```

### Delete

```javascript
async function processDelete(activity) {
  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  // Verify actor owns the object
  const existing = await db.objects.findOne({ id: objectId });
  if (existing && existing.data.attributedTo !== activity.actor) {
    throw new Error('Cannot delete: not owner');
  }

  // Delete or mark as tombstone
  await db.objects.update(
    { id: objectId },
    {
      $set: {
        type: 'Tombstone',
        formerType: existing?.type,
        deleted: new Date().toISOString()
      }
    }
  );
}
```

### Undo

```javascript
async function processUndo(activity) {
  const undone = activity.object;
  const undoneId = typeof undone === 'string' ? undone : undone.id;

  // Verify the actor owns the activity being undone
  const original = await db.activities.findOne({ id: undoneId });
  if (original && original.actor !== activity.actor) {
    throw new Error('Cannot undo: not owner');
  }

  const undoneType = typeof undone === 'string'
    ? original?.type
    : undone.type;

  switch (undoneType) {
    case 'Follow':
      await db.followers.remove({
        actor: undone.object,
        follower: activity.actor
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

## Shared Inbox

For efficiency, servers can use a shared inbox:

```json
{
  "type": "Person",
  "id": "https://example.com/users/alice",
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

When delivering to multiple users on the same server, send once to the shared inbox.

### Handling Shared Inbox

```javascript
app.post('/inbox', async (req, res) => {
  const actor = await verifyRequest(req);
  const activity = req.body;

  // Determine local recipients
  const recipients = await resolveLocalRecipients(activity);

  for (const recipient of recipients) {
    await processActivityForUser(activity, recipient);
  }

  res.status(202).send();
});

async function resolveLocalRecipients(activity) {
  const addresses = [
    ...(activity.to || []),
    ...(activity.cc || []),
    ...(activity.bto || []),
    ...(activity.bcc || [])
  ];

  const localUsers = [];

  for (const address of addresses) {
    // Check if it's a local user
    if (address.startsWith('https://example.com/users/')) {
      const user = await db.users.findOne({ actorId: address });
      if (user) localUsers.push(user);
    }

    // Check if it's a followers collection we own
    if (address.endsWith('/followers')) {
      const actorId = address.replace('/followers', '');
      const followers = await db.followers.find({ actor: actorId });
      // Filter to local followers
      for (const f of followers) {
        if (f.follower.startsWith('https://example.com/')) {
          localUsers.push(await db.users.findOne({ actorId: f.follower }));
        }
      }
    }
  }

  return localUsers;
}
```

## Error Handling

### Response Codes

| Code | Meaning |
|------|---------|
| 202 Accepted | Activity accepted for processing |
| 400 Bad Request | Invalid activity format |
| 401 Unauthorized | Invalid or missing signature |
| 403 Forbidden | Actor is blocked |
| 404 Not Found | Inbox doesn't exist |
| 410 Gone | Actor deleted |
| 429 Too Many Requests | Rate limited |
| 500 Server Error | Processing failed |

### Error Response

```json
{
  "error": "Invalid signature",
  "message": "Could not verify HTTP signature"
}
```

## Rate Limiting

Protect your inbox:

```javascript
const rateLimit = require('express-rate-limit');

const inboxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (req) => {
    // Rate limit by signing actor
    const sig = parseSignatureHeader(req.headers.signature);
    return sig?.keyId || req.ip;
  }
});

app.post('/inbox', inboxLimiter, handleInbox);
app.post('/users/:username/inbox', inboxLimiter, handleInbox);
```

## Security Considerations

1. **Always verify signatures** before processing
2. **Validate actor owns content** for Create, Update, Delete
3. **Check blocks** before accepting activities
4. **Sanitize HTML content** in objects
5. **Limit payload size** to prevent DoS
6. **Implement rate limiting** per actor/domain

```javascript
// Payload size limit
app.use('/inbox', express.json({ limit: '1mb' }));

// Block check
async function isBlocked(actorUrl) {
  const domain = new URL(actorUrl).hostname;
  return await db.blocks.exists({
    $or: [
      { actor: actorUrl },
      { domain: domain }
    ]
  });
}
```

## Next Steps

- **[Delivery](/docs/specs/activitypub/delivery)** - How to send activities
- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Signing details
- **[Handling Activities](/docs/guides/handling-incoming-activities)** - Implementation
