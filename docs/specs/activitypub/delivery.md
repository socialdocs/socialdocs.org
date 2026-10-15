---
sidebar_position: 8
title: Delivery
description: How ActivityPub servers deliver activities to recipients
---

# Activity Delivery

Delivery is the process of sending activities from your server to remote inboxes. Reliable delivery is crucial for federation to work properly.

## Delivery Overview

<svg viewBox="0 0 440 320" style={{maxWidth: '440px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="delGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="430" height="310" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="430" height="32" rx="12" fill="url(#delGrad)"/>
  <text x="220" y="26" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">DELIVERY PIPELINE</text>

  {/* Step 1 */}
  <circle cx="30" cy="60" r="12" fill="#6364FF"/><text x="30" y="64" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">1</text>
  <text x="50" y="64" fill="currentColor" fontSize="12" fontWeight="600">Activity Created</text>

  {/* Arrow */}
  <line x1="30" y1="75" x2="30" y2="95" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,92 30,100 33,92" fill="#6364FF"/>

  {/* Step 2 */}
  <circle cx="30" cy="115" r="12" fill="#6364FF"/><text x="30" y="119" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">2</text>
  <text x="50" y="112" fill="currentColor" fontSize="12" fontWeight="600">Resolve Recipients</text>
  <text x="50" y="128" fill="currentColor" fontSize="10" opacity="0.7">Expand Public, followers, mentions</text>

  {/* Arrow */}
  <line x1="30" y1="135" x2="30" y2="155" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,152 30,160 33,152" fill="#6364FF"/>

  {/* Step 3 */}
  <circle cx="30" cy="175" r="12" fill="#6364FF"/><text x="30" y="179" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">3</text>
  <text x="50" y="172" fill="currentColor" fontSize="12" fontWeight="600">Deduplicate Inboxes</text>
  <text x="50" y="188" fill="currentColor" fontSize="10" opacity="0.7">Use shared inbox, remove duplicates</text>

  {/* Arrow */}
  <line x1="30" y1="195" x2="30" y2="215" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,212 30,220 33,212" fill="#6364FF"/>

  {/* Step 4 */}
  <circle cx="30" cy="235" r="12" fill="#6364FF"/><text x="30" y="239" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">4</text>
  <text x="50" y="232" fill="currentColor" fontSize="12" fontWeight="600">Sign and Send</text>
  <text x="50" y="248" fill="currentColor" fontSize="10" opacity="0.7">Create HTTP Signature, POST to inboxes</text>

  {/* Arrow */}
  <line x1="30" y1="255" x2="30" y2="275" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,272 30,280 33,272" fill="#6364FF"/>

  {/* Step 5 */}
  <circle cx="30" cy="295" r="12" fill="#6364FF"/><text x="30" y="299" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">5</text>
  <text x="50" y="292" fill="currentColor" fontSize="12" fontWeight="600">Handle Failures</text>
  <text x="50" y="308" fill="currentColor" fontSize="10" opacity="0.7">Retry with backoff, track dead servers</text>
</svg>

## Step 1: Resolve Recipients

Extract all recipients from the activity:

```javascript
function getRecipients(activity) {
  const recipients = new Set();

  // Explicit recipients
  for (const field of ['to', 'cc', 'bto', 'bcc', 'audience']) {
    const values = activity[field] || [];
    const list = Array.isArray(values) ? values : [values];
    list.forEach(r => recipients.add(r));
  }

  // The spec says servers MUST exclude the activity's own actor
  // from the recipient list (AP §7.1)
  recipients.delete(activity.actor);

  return recipients;
}
```

### Expand Collections

Resolve recipient URLs to actual actor inboxes.

:::warning IRI Opacity
Don't assume URL patterns like `/followers`. IRIs are opaque — always dereference and check the `type`. See [URIs, IRIs & Linked Data](/docs/concepts/uris-iris-linked-data) for details.
:::

```javascript
const PUBLIC = [
  'https://www.w3.org/ns/activitystreams#Public',
  'as:Public',
  'Public'
];

async function expandRecipients(recipients, sender) {
  const inboxes = new Set();

  for (const recipient of recipients) {
    // Skip the Public collection in all its spellings (never deliver to it)
    if (PUBLIC.includes(recipient)) {
      continue;
    }

    // Your own followers collection: read members from your database,
    // don't fetch it over HTTP
    if (recipient === sender.followers) {
      for (const inbox of await db.getFollowerInboxes(sender.id)) {
        inboxes.add(inbox);
      }
      continue;
    }

    // Anything else: dereference it to determine what it is
    // (use a signed, SSRF-safe fetch in production)
    const data = await fetchActivityPubObject(recipient);
    if (!data) continue;

    const type = Array.isArray(data.type) ? data.type[0] : data.type;

    if (type === 'OrderedCollection' || type === 'Collection') {
      // It's a collection (e.g., followers) — expand its members
      const members = await expandCollection(data);
      for (const memberUrl of members) {
        const actor = await fetchActor(memberUrl);
        if (actor) {
          inboxes.add(getInbox(actor));
        }
      }
    } else if (isActorType(type)) {
      // It's an actor — use their inbox directly
      inboxes.add(getInbox(data));
    }
  }

  return inboxes;
}

// Check if a type is an Actor type
function isActorType(type) {
  return ['Person', 'Service', 'Application', 'Group', 'Organization'].includes(type);
}

// Expand a collection to get member URLs
async function expandCollection(collection) {
  const members = [];

  // Handle inline items
  if (collection.orderedItems) {
    members.push(...collection.orderedItems);
  } else if (collection.items) {
    members.push(...collection.items);
  }

  // Handle paginated collections (fetch first page)
  if (collection.first) {
    const pageUrl = typeof collection.first === 'string'
      ? collection.first
      : collection.first.id;
    const page = await fetchActivityPubObject(pageUrl);
    if (page?.orderedItems) members.push(...page.orderedItems);
    if (page?.items) members.push(...page.items);
  }

  // Normalize to URLs
  return members.map(m => typeof m === 'string' ? m : m.id);
}

// Fetch an ActivityPub object with proper headers
async function fetchActivityPubObject(url) {
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/activity+json' }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
```

## Step 2: Deduplicate Inboxes

Use shared inboxes when multiple users are on the same server:

```javascript
function getInbox(actor) {
  // Prefer shared inbox for efficiency
  if (actor.endpoints?.sharedInbox) {
    return actor.endpoints.sharedInbox;
  }
  return actor.inbox;
}

function deduplicateInboxes(inboxes) {
  return [...new Set(inboxes)];
}
```

## Step 3: Prepare Request

### Remove Private Addressing

Strip `bto` and `bcc` before sending:

```javascript
function prepareActivityForDelivery(activity) {
  const prepared = { ...activity };
  delete prepared.bto;
  delete prepared.bcc;
  return prepared;
}
```

### Sign the Request

```javascript
const crypto = require('crypto');

function signRequest(privateKey, keyId, method, url, body) {
  const urlObj = new URL(url);
  const date = new Date().toUTCString();

  // Create digest
  const digest = `SHA-256=${crypto
    .createHash('sha256')
    .update(body)
    .digest('base64')}`;

  // Build signing string
  const signedHeaders = '(request-target) host date digest';
  const signingString = [
    `(request-target): ${method.toLowerCase()} ${urlObj.pathname}`,
    `host: ${urlObj.host}`,
    `date: ${date}`,
    `digest: ${digest}`
  ].join('\n');

  // Create signature
  const signature = crypto
    .sign('RSA-SHA256', Buffer.from(signingString), privateKey)
    .toString('base64');

  return {
    date,
    digest,
    signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="${signedHeaders}",signature="${signature}"`
  };
}
```

## Step 4: Send Activity

### Single Delivery

Inbox URLs come from remote actor documents, so treat them as untrusted: require `https` and refuse hosts that resolve to private or loopback addresses before you POST (see `assertDeliverable` in [Delivery at scale](/docs/guides/delivery-at-scale#a-delivery-job)).

```javascript
async function deliverToInbox(inbox, activity, privateKey, keyId) {
  const body = JSON.stringify(activity);
  const headers = signRequest(privateKey, keyId, 'POST', inbox, body);

  const response = await fetch(inbox, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/activity+json',
      'Date': headers.date,
      'Digest': headers.digest,
      'Signature': headers.signature
    },
    body
  });

  if (!response.ok) {
    const error = new Error(`Delivery failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response;
}
```

### Parallel Delivery

```javascript
async function deliverActivity(activity, actor) {
  const recipients = getRecipients(activity);
  const inboxes = await expandRecipients(recipients, actor);
  const uniqueInboxes = deduplicateInboxes(inboxes);
  const prepared = prepareActivityForDelivery(activity);

  // For large audiences, cap concurrency (e.g. with p-limit) instead of
  // firing every request at once.
  const results = await Promise.allSettled(
    uniqueInboxes.map(inbox =>
      deliverToInbox(inbox, prepared, actor.privateKey, actor.keyId)
    )
  );

  // Handle failures
  const failures = results
    .map((result, i) => ({ result, inbox: uniqueInboxes[i] }))
    .filter(({ result }) => result.status === 'rejected');

  for (const { result, inbox } of failures) {
    // Most 4xx won't succeed on retry, but 401 (key not fetched yet,
    // wrong signature scheme), 408 and 429 can. This mirrors Mastodon;
    // see the Delivery at scale guide.
    const status = result.reason?.status;
    if (status === 501 || (status >= 400 && status < 500 && ![401, 408, 429].includes(status))) {
      if (status === 410) await removeFollowersBehind(inbox); // that inbox is gone
      continue;
    }
    await queueRetry(inbox, activity, actor, 0);
  }
}
```

## Step 5: Handle Failures

The spec leaves retries to implementations. What matters for interoperability:

- **Retry transient failures with growing delays, for days, not minutes.** Servers go down for maintenance and come back. Mastodon retries one delivery 16 times with a delay of n⁴ + 15 seconds plus jitter, about 2–3 days in total ([delivery_worker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/delivery_worker.rb)).
- **Don't retry what can't succeed.** Mastodon gives up on 4xx other than 401, 408 and 429, and on 501; it retries 401, 408, 429, other 5xx and network errors ([json_ld_helper.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb)).
- **Stop delivering to servers that are gone, and notice when they come back.** Mastodon marks a host unavailable after failures on 7 distinct days, and clears it on any successful delivery or any signed request from that host ([delivery_failure_tracker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/delivery_failure_tracker.rb)). A rule like "dead after one bad day" drops servers that were only briefly down.

```javascript
// Mastodon's schedule: n⁴ + 15 s plus up to 50% jitter, 16 retries
const MAX_RETRIES = 16;
const retryDelayMs = (n) => (n ** 4 + 15 + Math.random() * 0.5 * n ** 4) * 1000;

async function queueRetry(inbox, activity, actor, attempt = 0) {
  if (attempt >= MAX_RETRIES) {
    await recordFailedDay(inbox); // feeds unavailable-domain tracking
    return;
  }
  await db.deliveryQueue.insert({
    inbox,
    activityId: activity.id,
    actorId: actor.id,
    attempt,
    scheduledAt: new Date(Date.now() + retryDelayMs(attempt)),
  });
}
```

The full design — unavailable domains, circuit breakers, per-host concurrency, followers synchronization (FEP-8fcf) and why not to batch — is in **[Delivery at scale](/docs/guides/delivery-at-scale)**.

## Delivery Best Practices

### 1. Use Background Jobs

Don't block user requests on delivery:

```javascript
// In request handler
app.post('/api/posts', async (req, res) => {
  const post = await createPost(req.body);
  const activity = await createActivityFor(post); // the Create wrapping the post

  // Queue delivery, don't await
  deliveryQueue.add({ activityId: activity.id });

  res.status(201).json(post);
});

// Background worker
deliveryQueue.process(async (job) => {
  const activity = await db.activities.findOne({ id: job.data.activityId });
  await deliverActivity(activity);
});
```

### 2. Batch Deliveries

Group activities going to the same server:

```javascript
// Bad: One request per activity
activities.forEach(a => deliverToInbox(inbox, a));

// Better: queue them and let workers deliver one activity per request
const queue = activities.map(a => ({ inbox, activity: a }));
await processDeliveryQueue(queue);
```

:::note
Don't POST a `Collection` of activities to an inbox. Mastodon 4.7 removed support for processing collections of activities in the inbox ([v4.7.0 release notes](https://github.com/mastodon/mastodon/releases/tag/v4.7.0)). Batched delivery is being explored in [FEP-49eb](https://codeberg.org/fediverse/fep/src/branch/main/fep/49eb/fep-49eb.md) (DRAFT), but nothing widely deployed supports it.
:::

### 3. Respect Rate Limits

Handle 429 responses:

```javascript
async function deliverToInbox(inbox, activity, privateKey, keyId) {
  const response = await fetch(inbox, { ... });

  if (response.status === 429) {
    // Retry-After is either seconds or an HTTP date. Don't retry inline
    // (that can recurse forever) — hand it back to the retry queue.
    const header = response.headers.get('Retry-After');
    const seconds = Number(header);
    const delayMs = Number.isFinite(seconds)
      ? seconds * 1000
      : Math.max(0, Date.parse(header) - Date.now()) || 60_000;
    const error = new Error('Rate limited');
    error.status = 429;
    error.retryAfterMs = delayMs;
    throw error;
  }

  // ...
}
```

### 4. Set Timeouts

Don't wait forever for slow servers:

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const response = await fetch(inbox, {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeout);
}
```

### 5. Log Delivery Status

Track delivery success rates:

```javascript
async function deliverToInbox(inbox, activity, privateKey, keyId) {
  const start = Date.now();

  try {
    const response = await fetch(inbox, { ... });

    await db.deliveryLogs.insert({
      inbox,
      activityId: activity.id,
      status: response.status,
      duration: Date.now() - start,
      success: response.ok,
      timestamp: new Date()
    });

    return response;
  } catch (error) {
    await db.deliveryLogs.insert({
      inbox,
      activityId: activity.id,
      error: error.message,
      duration: Date.now() - start,
      success: false,
      timestamp: new Date()
    });

    throw error;
  }
}
```

## Delivery Metrics

Track these metrics:

| Metric | Description |
|--------|-------------|
| Delivery rate | % of successful deliveries |
| Latency | Time to deliver |
| Queue depth | Pending deliveries |
| Retry rate | % requiring retries |
| Unavailable domains | Hosts you've stopped delivering to |

## Next Steps

- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Signing in detail
- **[Server-to-Server](/docs/specs/activitypub/server-to-server)** - Receiving activities
- **[Sending Activities](/docs/guides/sending-activities)** - Implementation guide
- **[Delivery at scale](/docs/guides/delivery-at-scale)** - Retries, unavailable domains, circuit breakers
- **[Deletion](/docs/guides/deletion)** - Delete fan-out and tombstones
