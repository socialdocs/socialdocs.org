---
sidebar_position: 7
title: Server-to-Server
description: The ActivityPub Server-to-Server federation protocol
last_verified: 2026-10-15
verified_against: "ActivityPub REC §7 and Appendix B, Mastodon v4.7.3 source (activity/create.rb, CHANGELOG), GHSA-3fjr-858r-92rw, examples/verify-requests API"
---

# Server-to-Server (S2S)

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

POST an activity to a remote inbox. The REC says inbox POSTs MUST use `Content-Type: application/ld+json; profile="https://www.w3.org/ns/activitystreams"`, and that an activity sent over the network SHOULD have an `id` ([AP §7](https://www.w3.org/TR/activitypub/#server-to-server-interactions)). In practice almost every server sends — and accepts — `application/activity+json`; accept both:

```http
POST /users/bob/inbox HTTP/1.1
Host: server-b.com
Date: Sun, 15 Jan 2024 10:30:00 GMT
Digest: SHA-256=...
Signature: keyId="https://server-a.com/users/alice#main-key",...
Content-Type: application/activity+json

{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://server-a.com/activities/1",
  "type": "Create",
  "actor": "https://server-a.com/users/alice",
  "to": ["https://server-b.com/users/bob"],
  "object": {
    "id": "https://server-a.com/notes/1",
    "type": "Note",
    "attributedTo": "https://server-a.com/users/alice",
    "to": ["https://server-b.com/users/bob"],
    "content": "Hello from Server A!"
  }
}
```

### 2. Fetch Actor

GET a remote actor profile:

```http
GET /users/bob HTTP/1.1
Host: server-b.com
Accept: application/ld+json; profile="https://www.w3.org/ns/activitystreams", application/activity+json
```

### 3. Fetch Object

GET a remote object:

```http
GET /notes/123 HTTP/1.1
Host: server-b.com
Accept: application/ld+json; profile="https://www.w3.org/ns/activitystreams", application/activity+json
```

## Authentication

The ActivityPub spec leaves authentication open ([AP §B.1](https://www.w3.org/TR/activitypub/#authorization)), but in practice every major server requires inbox POSTs to be signed with HTTP Signatures — draft-cavage today, with [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) increasingly supported (Mastodon verifies it by default since 4.5, [CHANGELOG](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md)):

```http
Signature: keyId="https://server-a.com/users/alice#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest",
           signature="..."
```

### Verification Process

```
1. Parse the signature (draft-cavage Signature, or RFC 9421 Signature-Input + Signature)
2. Require the right signed components: target with query, host, date/created, digest
3. Check the digest over the raw body, and the time window
4. Fetch the keyId with an SSRF-safe fetch, then find the key in its owner actor's document
5. Verify the signature; on failure refetch the key once and retry
6. Require key owner == activity.actor, then apply the origin rules
```

:::tip Use the tested verifier
Request verification has its own page with tested code: **[Verifying incoming requests](/docs/security/verifying-requests)**. It covers draft-cavage and RFC 9421, the digest over the raw body, the required signed headers, binding the key owner to `activity.actor`, and SSRF-safe key fetching.
:::

## Activity Processing

When receiving an activity:

### 1. Verify Request

```javascript
// verifyRequest, parseActivityFrom, authorizeActivity, SignatureError, AuthorizationError:
// examples/verify-requests (see /docs/security/verifying-requests)
app.post('/users/:username/inbox', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  let activity;
  try {
    const signer = await verifyRequest({
      method: req.method, url: `https://${DOMAIN}${req.originalUrl}`,
      headers: req.headers, rawBody: req.body,
    }, { keyStore });
    activity = parseActivityFrom(signer, req.body); // signer must be activity.actor
    authorizeActivity(activity);                    // origin rules (see below)
  } catch (error) {
    // 401: bad signature; 403: origin rules; 503: couldn't fetch the key yet,
    // so the sender retries later (as Mastodon does since 4.5.4)
    const status = error instanceof SignatureError ? 401
      : error instanceof AuthorizationError ? 403 : 503;
    return res.status(status).json({ error: error.message });
  }
  await queue.add(activity); // process asynchronously
  res.status(202).send();
});
```

### 2. Validate Activity

```javascript
function validateActivity(activity, signer) {
  // Actor must match signer (parseActivityFrom already enforces this;
  // signer is what verifyRequest returns). Forwarded activities — AP
  // §7.1.2 — are signed by the forwarding server, not the actor: don't
  // trust their body; re-fetch the activity from its origin by id instead.
  if (activity.actor !== signer.actorId) {
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

  // authorizeActivity() already enforces the checks below; see
  // /docs/security/origin-model

  // Origin check: the object must live on the actor's server. Without
  // this, evil.example can overwrite objects "owned" by victim.example
  // (the bug class behind Mastodon CVE-2024-23832; Mastodon now rejects
  // these via non_matching_uri_hosts? in activity/create.rb).
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
    id: `https://example.com/activities/${crypto.randomUUID()}`,
    actor: followActivity.object,
    object: followActivity
  };

  // fetchActor must be SSRF-safe (e.g. safeFetchJson from
  // /docs/security/verifying-requests), and deliverActivity must apply the
  // same public-address check to the inbox URL before POSTing to it: both
  // URLs come from a remote server.
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

  // authorizeActivity() already enforces this; repeated here for clarity.
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
  const undoneId = typeof activity.object === 'string' ? activity.object : activity.object?.id;

  // Prefer our stored copy; an embedded object is only a claim. Either
  // way the activity being undone must belong to the actor undoing it.
  const original = await db.activities.findOne({ id: undoneId });
  const undone = original ?? (typeof activity.object === 'object' ? activity.object : null);
  if (!undone) return; // nothing we know about
  if (undone.actor !== activity.actor) {
    throw new Error('Cannot undo: not owner');
  }

  switch (undone.type) {
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

When delivering public or followers-addressed activities to several users on the same server, send once to the shared inbox ([AP §7.1.3](https://www.w3.org/TR/activitypub/#shared-inbox-delivery)).

### Handling Shared Inbox

```javascript
app.post('/inbox', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  // Same verification as the per-user inbox above
  let activity;
  try {
    const signer = await verifyRequest({
      method: req.method, url: `https://${DOMAIN}${req.originalUrl}`,
      headers: req.headers, rawBody: req.body,
    }, { keyStore });
    activity = parseActivityFrom(signer, req.body);
    authorizeActivity(activity);
  } catch (error) {
    // 401: bad signature; 403: origin rules; 503: couldn't fetch the key yet,
    // so the sender retries later (as Mastodon does since 4.5.4)
    const status = error instanceof SignatureError ? 401
      : error instanceof AuthorizationError ? 403 : 503;
    return res.status(status).json({ error: error.message });
  }

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

    // The sender's own followers collection? Only honour the followers
    // collection of activity.actor itself — otherwise anyone could address
    // someone else's followers and land in their timelines. (Mastodon
    // likewise only compares against the author's own followers URL —
    // app/lib/activitypub/activity/create.rb, create_status.)
    const remote = await db.remoteActors.findOne({ followers: address });
    if (remote && remote.id === activity.actor) {
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
// Payload size limit. Keep the raw bytes (as the inbox handlers above do
// with express.raw) — the digest is checked over them, and the JSON is
// parsed only after verification.
app.use('/inbox', express.raw({ type: '*/*', limit: '1mb' }));

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
- **[Delivery at scale](/docs/guides/delivery-at-scale)** - Retries, unavailable domains, circuit breakers
