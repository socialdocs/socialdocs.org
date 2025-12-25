---
sidebar_position: 8
title: Delivery
description: How ActivityPub servers deliver activities to recipients
---

# Activity Delivery

Delivery is the process of sending activities from your server to remote inboxes. Reliable delivery is crucial for federation to work properly.

## Delivery Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     DELIVERY PIPELINE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Activity Created                                           │
│     ↓                                                          │
│  2. Resolve Recipients                                         │
│     - Expand Public address                                    │
│     - Expand followers collection                              │
│     - Resolve mentioned actors                                 │
│     ↓                                                          │
│  3. Deduplicate Inboxes                                        │
│     - Use shared inbox when available                          │
│     - Remove duplicates                                        │
│     ↓                                                          │
│  4. Sign and Send                                              │
│     - Create HTTP Signature                                    │
│     - POST to each inbox                                       │
│     ↓                                                          │
│  5. Handle Failures                                            │
│     - Retry with backoff                                       │
│     - Track dead servers                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

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

Resolve collection URLs to actual actor inboxes:

```javascript
async function expandRecipients(recipients) {
  const inboxes = new Set();

  for (const recipient of recipients) {
    // Skip public address (not a real recipient)
    if (recipient === 'https://www.w3.org/ns/activitystreams#Public') {
      continue;
    }

    // Check if it's a followers collection
    if (recipient.endsWith('/followers')) {
      const actorId = recipient.replace('/followers', '');
      const followers = await db.followers.find({ actor: actorId });

      for (const follow of followers) {
        const actor = await fetchActor(follow.follower);
        if (actor) {
          inboxes.add(getInbox(actor));
        }
      }
      continue;
    }

    // It's an individual actor
    const actor = await fetchActor(recipient);
    if (actor) {
      inboxes.add(getInbox(actor));
    }
  }

  return inboxes;
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
