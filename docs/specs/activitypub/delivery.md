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

  return recipients;
}
```

### Expand Collections

Resolve recipient URLs to actual actor inboxes.

:::warning IRI Opacity
Don't assume URL patterns like `/followers`. IRIs are opaque — always dereference and check the `type`. See [URIs, IRIs & Linked Data](/docs/concepts/uris-iris-linked-data) for details.
:::

```javascript
async function expandRecipients(recipients) {
  const inboxes = new Set();

  for (const recipient of recipients) {
    // Skip public address (not a real recipient)
    if (recipient === 'https://www.w3.org/ns/activitystreams#Public') {
      continue;
    }

    // Dereference the recipient to determine what it is
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
    throw new Error(`Delivery failed: ${response.status}`);
  }

  return response;
}
```

### Parallel Delivery

```javascript
async function deliverActivity(activity, actor) {
  const recipients = getRecipients(activity);
  const inboxes = await expandRecipients(recipients);
  const uniqueInboxes = deduplicateInboxes(inboxes);
  const prepared = prepareActivityForDelivery(activity);

  const results = await Promise.allSettled(
    uniqueInboxes.map(inbox =>
      deliverToInbox(inbox, prepared, actor.privateKey, actor.keyId)
    )
  );

  // Handle failures
  const failures = results
    .map((result, i) => ({ result, inbox: uniqueInboxes[i] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failures.length > 0) {
    await queueRetries(failures, activity, actor);
  }
}
```

## Step 5: Handle Failures

### Retry Strategy

Use exponential backoff for failed deliveries:

```javascript
const RETRY_DELAYS = [
  1 * 60 * 1000,      // 1 minute
  5 * 60 * 1000,      // 5 minutes
  30 * 60 * 1000,     // 30 minutes
  2 * 60 * 60 * 1000, // 2 hours
  12 * 60 * 60 * 1000, // 12 hours
  24 * 60 * 60 * 1000  // 24 hours
];

async function queueRetry(inbox, activity, actor, attempt = 0) {
  if (attempt >= RETRY_DELAYS.length) {
    await markServerDead(inbox);
    return;
  }

  await db.deliveryQueue.insert({
    inbox,
    activity,
    actorId: actor.id,
    attempt,
    scheduledAt: new Date(Date.now() + RETRY_DELAYS[attempt])
  });
}
```

### Retry Worker

```javascript
async function processRetryQueue() {
  const due = await db.deliveryQueue.find({
    scheduledAt: { $lte: new Date() }
  });

  for (const job of due) {
    try {
      const actor = await db.actors.findOne({ id: job.actorId });
      await deliverToInbox(job.inbox, job.activity, actor.privateKey, actor.keyId);

      // Success - remove from queue
      await db.deliveryQueue.remove({ _id: job._id });

      // Server recovered
      await markServerAlive(job.inbox);
    } catch (error) {
      // Reschedule with increased attempt
      await db.deliveryQueue.remove({ _id: job._id });
      await queueRetry(job.inbox, job.activity, actor, job.attempt + 1);
    }
  }
}

// Run every minute
setInterval(processRetryQueue, 60 * 1000);
```

### Dead Server Tracking

```javascript
async function markServerDead(inbox) {
  const domain = new URL(inbox).hostname;

  await db.deadServers.upsert({
    domain,
    deadSince: new Date(),
    failureCount: { $inc: 1 }
  });
}

async function isServerDead(inbox) {
  const domain = new URL(inbox).hostname;
  const record = await db.deadServers.findOne({ domain });

  if (!record) return false;

  // Consider dead if failed in last 24 hours
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return record.deadSince > dayAgo;
}

async function markServerAlive(inbox) {
  const domain = new URL(inbox).hostname;
  await db.deadServers.remove({ domain });
}
```

## Delivery Best Practices

### 1. Use Background Jobs

Don't block user requests on delivery:

```javascript
// In request handler
app.post('/api/posts', async (req, res) => {
  const post = await createPost(req.body);

  // Queue delivery, don't await
  deliveryQueue.add({ activityId: activity.id });

  res.json(post);
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

// Better: Consider batching or at least queuing
const queue = activities.map(a => ({ inbox, activity: a }));
await processDeliveryQueue(queue);
```

### 3. Respect Rate Limits

Handle 429 responses:

```javascript
async function deliverToInbox(inbox, activity, privateKey, keyId) {
  const response = await fetch(inbox, { ... });

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 60;
    await sleep(retryAfter * 1000);
    return deliverToInbox(inbox, activity, privateKey, keyId);
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
| Dead servers | Servers not responding |

## Next Steps

- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Signing in detail
- **[Server-to-Server](/docs/specs/activitypub/server-to-server)** - Receiving activities
- **[Sending Activities](/docs/guides/sending-activities)** - Implementation guide
