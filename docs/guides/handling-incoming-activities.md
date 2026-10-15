---
sidebar_position: 2
title: Handling Incoming Activities
description: Processing activities received in your inbox
last_verified: 2026-10-15
verified_against: "ActivityPub REC §7; FEP-fe34; Mastodon v4.7.3 source (status_parser.rb, accept.rb, follow.rb, tag_manager.rb); code paths match examples/verify-requests and examples/first-server/src/inbox.js"
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

The order matters: verify the signature over the **raw** body, require that the signer **is** `activity.actor`, apply the origin rules, answer, and only then do the work. This is the same sequence as the tested inbox in [`examples/first-server/src/inbox.js`](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/examples/first-server/src/inbox.js), written for Express:

```javascript
import express from 'express';
import {
  verifyRequest, parseActivityFrom, authorizeActivity,
  SignatureError, KeyResolutionError, AuthorizationError, UnsafeUrlError,
} from './verify-requests/src/index.js';
// keyStore: see /docs/security/verifying-requests

// Don't let a global express.json() parse the inbox first: the digest is
// over the raw bytes, so this route needs express.raw().
app.post('/users/:username/inbox',
  express.raw({ type: '*/*', limit: '1mb' }),
  async (req, res) => {
    let activity, decision;
    try {
      const signer = await verifyRequest({
        method: req.method,
        url: `https://${DOMAIN}${req.originalUrl}`, // full URL, query string included
        headers: req.headers,
        rawBody: req.body,
      }, { keyStore });
      activity = parseActivityFrom(signer, req.body); // the signer MUST be activity.actor
      decision = authorizeActivity(activity);         // FEP-fe34 origin rules
    } catch (error) {
      if (error instanceof SignatureError || error instanceof KeyResolutionError ||
          error instanceof UnsafeUrlError || error instanceof SyntaxError) {
        return res.status(401).json({ error: error.message });
      }
      if (error instanceof AuthorizationError) {
        return res.status(403).json({ error: error.message });
      }
      // Couldn't reach the sender's key (network, 5xx): ask them to retry later.
      return res.status(503).json({ error: 'Temporarily unable to verify' });
    }

    // Answer first, then process. A slow or failing handler must not make the
    // sender retry (and re-deliver) an activity you already accepted.
    res.status(202).end();
    queue.add({ activity, trustEmbedded: decision.trustEmbedded, username: req.params.username });
  }
);
```

`authorizeActivity` returns `{ trustEmbedded }`. When it is `false`, the embedded object came from another origin (or wasn't embedded at all): **fetch the object from its own `id`** with an SSRF-safe fetcher instead of trusting the copy in the activity. Mastodon also processes inbox deliveries in a background job after answering `202` ([Troubleshooting](/docs/guides/troubleshooting)).

:::tip Use the tested verifier
Request verification has its own page with tested code: **[Verifying incoming requests](/docs/security/verifying-requests)**. It covers draft-cavage and RFC 9421, the digest over the raw body, the required signed headers, binding the key owner to `activity.actor`, and SSRF-safe key fetching.
:::

Activities that were **forwarded** by another server are signed by the forwarder, not by `activity.actor`, so `parseActivityFrom` rejects them. To accept them, refetch the object from its origin instead (see [inbox forwarding](/docs/security/origin-model#inbox-forwarding)).

## Activity Validation

Properties in ActivityStreams can be a single value **or** an array, and references can be a URL string **or** an embedded object. Normalise before you look at them:

```javascript
const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const idOf = (v) => (typeof v === 'string' ? v : v?.id);

function validateActivity(activity) {
  if (typeof activity.type !== 'string') throw new Error('Missing type');
  if (typeof activity.id !== 'string') throw new Error('Missing id');
  // parseActivityFrom already tied activity.actor to the signer
  return true;
}
```

The body-size limit belongs on the raw request (`express.raw({ limit })`), before parsing.

## Processing by Type

```javascript
async function processActivity(activity, targetUsername, decision) {
  validateActivity(activity);

  switch (activity.type) {
    case 'Create':
      return handleCreate(activity, targetUsername, decision);
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
async function handleCreate(activity, targetUsername, { trustEmbedded }) {
  // authorizeActivity() has already rejected a Create whose embedded object
  // is attributed to someone else or lives on another origin. Without that
  // check, the upsert below would let evil.example overwrite objects
  // belonging to other servers (the CVE-2024-23832 bug class).
  const object = trustEmbedded
    ? activity.object
    : (await safeFetchJson(idOf(activity.object))).json; // only a URL, or not trustworthy: fetch it

  if (idOf(object.attributedTo) !== activity.actor) {
    throw new Error('Attribution mismatch');
  }

  // Check if we should receive this
  if (!(await isRecipient(activity, targetUsername))) {
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

  // Create notification for mentions (tag may be one object or an array)
  if (object.tag) {
    const ourActorUrl = `https://${DOMAIN}/users/${targetUsername}`;
    const mention = asArray(object.tag).find(t =>
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
    const parent = await db.objects.findOne({ id: idOf(object.inReplyTo) });
    if (parent && parent.actor === `https://${DOMAIN}/users/${targetUsername}`) {
      await createNotification(targetUsername, 'reply', {
        actor: activity.actor,
        object: object.id,
        parent: idOf(object.inReplyTo)
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
  if (idOf(activity.object) !== targetActor) {
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

  // Fetch the follower ourselves (SSRF-safe) and check its id: never take an
  // inbox URL from the activity itself.
  const { json: follower } = await safeFetchJson(followActivity.actor);
  if (follower.id !== followActivity.actor || !follower.inbox) return;
  await deliver(follower.inbox, accept); // signed delivery, see Sending Activities
}
```

Mastodon behaves the same way: a repeated Follow from an existing follower is answered with another Accept, and a Follow from an account (or domain) the target blocks, or to an account that has moved, gets a `Reject` ([`follow.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/follow.rb)).

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
    // stored when we sent the Follow; isRecipient() needs it to accept
    // followers-only posts from this account
    followersCollection: pending.targetFollowers,
    createdAt: new Date()
  });
  await db.pendingFollows.remove({ id: followId });
}
```

When you send a Follow, store it in `pendingFollows` with its `id`, your actor, the target actor and the target's `followers` collection URL, so the Accept can be matched against it. Mastodon does the same: it matches the Accept's object id against its own pending follow requests, and only when that fails and a `Follow` is embedded does it fall back to the pending request between the local account and the accepting actor ([accept.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/accept.rb)). Either way, a pending Follow must already exist.

## Handling Like

```javascript
async function handleLike(activity, targetUsername) {
  const objectId = idOf(activity.object);

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
  const objectId = idOf(activity.object);

  // Boosts of our content become notifications. (Boosts by accounts you
  // follow of anyone's content also belong in your home timeline: fetch the
  // boosted object from its own id before showing it.)
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
  // authorizeActivity() already rejected an embedded activity whose actor is
  // someone else. If only an id was sent, look up what we stored for it.
  const stored = typeof activity.object === 'string'
    ? await db.activities.findOne({ id: activity.object, actor: activity.actor })
    : null;
  const undone = stored || activity.object;
  if (!undone || idOf(undone.actor) !== activity.actor) return;

  switch (undone.type) {
    case 'Follow':
      await db.followers.remove({
        follower: activity.actor,
        actor: `https://${DOMAIN}/users/${targetUsername}`
      });
      break;

    case 'Like':
      await db.likes.remove({ actor: activity.actor, object: idOf(undone.object) });
      break;

    case 'Announce':
      await db.announces.remove({ actor: activity.actor, object: idOf(undone.object) });
      break;
  }
}
```

## Handling Delete

See **[Deletion](/docs/guides/deletion)** for account deletion, Delete-before-Create and 404 vs 410. The core of it:

```javascript
async function handleDelete(activity, targetUsername) {
  const objectId = idOf(activity.object);

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
// Mastodon treats all three spellings of the public address as Public
// (TagManager#public_collection?).
const PUBLIC = new Set([
  'https://www.w3.org/ns/activitystreams#Public', 'as:Public', 'Public',
]);

async function isRecipient(activity, username) {
  const ourActor = `https://${DOMAIN}/users/${username}`;
  const recipients = [
    ...asArray(activity.to), ...asArray(activity.cc), ...asArray(activity.audience),
  ].map(idOf);

  if (recipients.some((r) => r === ourActor || PUBLIC.has(r))) return true;

  // Followers-only posts are addressed to the SENDER's followers collection.
  // Accept them if we follow the sender and that collection is addressed.
  const follow = await db.following.findOne({ actor: ourActor, following: activity.actor });
  return Boolean(follow) && recipients.includes(follow.followersCollection);
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

Senders retry, and the same activity can arrive at several of your inboxes. Claim the activity id **atomically** before processing, so two concurrent deliveries can't both pass a "have we seen it?" check:

```javascript
async function handleActivityIdempotent(activity) {
  // Unique index on processedActivities.id: the second insert fails.
  const claimed = await db.processedActivities
    .insertOne({ _id: activity.id, processedAt: new Date() })
    .then(() => true, (err) => (err.code === 11000 ? false : Promise.reject(err)));
  if (!claimed) return; // already processed (or being processed)

  await processActivity(activity);
}
```

## Next Steps

- **[Sending Activities](/docs/guides/sending-activities)** - Send activities out
- **[Following and Followers](/docs/guides/following-and-followers)** - Manage relationships
- **[Deletion](/docs/guides/deletion)** - Receiving Delete safely, tombstones and Delete-before-Create
