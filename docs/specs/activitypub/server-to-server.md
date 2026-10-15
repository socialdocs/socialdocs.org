---
sidebar_position: 7
title: Server-to-Server
description: The ActivityPub Server-to-Server federation protocol
---

# Server-to-Server (S2S)

:::danger Not safe for production
The code on this page is illustrative and **has known security flaws**: incomplete signature verification (signed headers, key-owner ↔ actor binding, Digest over the raw body), missing origin checks, and/or missing SSRF and output-escaping guards. Do not copy it into a real server. Use a maintained library such as [Fedify](https://fedify.dev/) or [activitypub-federation-rust](https://github.com/LemmyNet/activitypub-federation-rust) for request verification. Tracking: [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).
:::

The Server-to-Server protocol is how ActivityPub servers federate with each other. This is the heart of the Fediverse — enabling communication across independent servers.

## Overview

<svg viewBox="0 0 480 120" style={{maxWidth: '480px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="s2sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.15}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.15}}/>
    </linearGradient>
  </defs>
  {/* Server A */}
  <rect x="10" y="15" width="140" height="90" rx="10" fill="url(#s2sGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="80" y="45" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Server A</text>
  <text x="80" y="65" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">(Sender)</text>
  <text x="80" y="90" textAnchor="middle" fill="#6364FF" fontSize="10">alice@a.com</text>

  {/* Server B */}
  <rect x="330" y="15" width="140" height="90" rx="10" fill="url(#s2sGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="400" y="45" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Server B</text>
  <text x="400" y="65" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">(Receiver)</text>
  <text x="400" y="90" textAnchor="middle" fill="#6364FF" fontSize="10">bob@b.com</text>

  {/* Arrow */}
  <line x1="150" y1="60" x2="320" y2="60" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="320,56 332,60 320,64" fill="#6364FF"/>
  <text x="240" y="50" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">POST to inbox</text>
  <text x="240" y="75" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">with HTTP Signature</text>
</svg>

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

The ActivityPub spec leaves authentication open ([AP §B.1](https://www.w3.org/TR/activitypub/#authorization)), but in practice every major server requires inbox POSTs to be signed with HTTP Signatures — draft-cavage today, with [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) increasingly supported (Mastodon verifies it since 4.5):

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
  // Actor must match signer. (Forwarded activities — AP §7.1.2 — are
  // signed by the forwarding server, not the actor: don't trust their
  // body; re-fetch the activity from its origin by id instead.)
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

  // Origin check: the object must live on the actor's server. Without
  // this, evil.example can overwrite objects "owned" by victim.example
  // (the bug class behind Mastodon CVE-2024-23832).
  if (new URL(object.id).origin !== new URL(activity.actor).origin) {
    throw new Error('Object id is not on the actor\'s origin');
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

  // Verify actor owns the object: same origin, and the stored copy
  // (if any) is attributed to them
  if (new URL(objectId).origin !== new URL(activity.actor).origin) {
    throw new Error('Cannot delete: object is on another origin');
  }
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

const asArray = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

async function resolveLocalRecipients(activity) {
  const addresses = ['to', 'cc', 'bto', 'bcc'].flatMap(f => asArray(activity[f]));

  const localUsers = new Map();

  for (const address of addresses) {
    // A local user addressed directly? Look the IRI up — don't
    // pattern-match URLs (IRIs are opaque).
    const user = await db.users.findOne({ actorId: address });
    if (user) localUsers.set(user.id, user);

    // A remote actor's followers collection? Look up which remote actor
    // has this IRI as its `followers`, then find our local users who
    // follow that actor.
    const remote = await db.remoteActors.findOne({ followers: address });
    if (remote) {
      for (const u of await db.users.find({ following: remote.id })) {
        localUsers.set(u.id, u);
      }
    }
  }

  return [...localUsers.values()];
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
  // Key on the client IP here. The keyId in the Signature header is
  // attacker-chosen until verified, so keying on it lets an attacker
  // rotate keyIds to dodge the limit. Apply per-actor/per-domain limits
  // *after* signature verification.
  keyGenerator: (req) => req.ip
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
7. **Check origins**: an activity's `object.id` must be on the same origin as its `actor` for Create/Update/Delete; for `Announce`, fetch the boosted object from its own origin instead of trusting an embedded copy
8. **Handle inbox forwarding**: when a reply arrives signed by a server other than the actor's (AP [§7.1.2](https://www.w3.org/TR/activitypub/#inbox-forwarding)), re-fetch it from its origin rather than rejecting or trusting it blindly

```javascript
// Payload size limit. Note express.json() only parses application/json
// by default — list the ActivityPub types, and keep the raw bytes for
// Digest verification.
app.use('/inbox', express.json({
  limit: '1mb',
  type: ['application/activity+json', 'application/ld+json'],
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

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
