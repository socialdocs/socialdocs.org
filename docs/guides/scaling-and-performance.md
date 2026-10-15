---
sidebar_position: 14
title: Scaling and Performance
description: Best practices for scaling ActivityPub servers and optimizing federation performance
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 delivery behaviour (via Delivery at Scale), BullMQ and Bull READMEs, undici README, Mastodon 4.7.0 release notes (inbox collections)"
---

# Scaling and Performance

Federation presents unique scaling challenges: every post fans out to one HTTP request per receiving inbox, and every incoming activity may trigger fetches. This page covers the server-side architecture; for retry schedules, terminal errors, dead-server tracking and circuit breakers see **[Delivery at Scale](/docs/guides/delivery-at-scale)**, which documents what Mastodon actually does.

## The Scaling Challenge

```
┌────────────────────────────────────────────────────────┐
│              FEDERATION SCALING PROBLEM                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1 post × 1000 followers across 500 servers            │
│  = 500 outgoing HTTP requests                          │
│                                                        │
│  Each request needs:                                   │
│  - DNS resolution                                      │
│  - TLS handshake                                       │
│  - HTTP signature generation                           │
│  - Response handling                                   │
│  - Retry logic for failures                            │
│                                                        │
│  Popular accounts can generate massive fan-out         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Delivery Queue Architecture

### Basic Queue Implementation

```javascript
// Don't deliver synchronously!
// BAD:
async function createPost(author, content) {
  const note = await saveNote(author, content);
  for (const follower of await getFollowers(author)) {
    await deliverActivity(note, follower.inbox); // Blocks!
  }
  return note;
}

// GOOD:
async function createPost(author, content) {
  const note = await saveNote(author, content);
  const activity = wrapInCreate(note);

  // Queue delivery for async processing
  await queue.add('delivery', {
    activity,
    actor: author.id
  });

  return note;
}
```

### Queue Worker

Fan out in two steps: one job resolves the recipients, then **one job per inbox** does the delivery, so a slow or dead server only delays its own job and a retry resends to one server. The example uses [BullMQ](https://github.com/taskforcesh/bullmq) (the older `bull` package is in maintenance mode):

```javascript
import { Queue, Worker } from 'bullmq';

const connection = { host: 'localhost', port: 6379 };
const fanoutQueue = new Queue('fanout', { connection });
const deliveryQueue = new Queue('delivery', { connection });

// Step 1: resolve recipients once, enqueue one job per unique inbox
new Worker('fanout', async (job) => {
  const { activity, actorId } = job.data;
  const recipients = await resolveRecipients(activity); // actor documents
  for (const inbox of deduplicateInboxes(recipients)) {
    await deliveryQueue.add('deliver', { activity, actorId, inbox }, {
      attempts: 17,                 // first try + 16 retries, like Mastodon
      backoff: { type: 'custom' },
    });
  }
}, { connection });

// Step 2: deliver; throw to retry, return to finish
new Worker('delivery', async (job) => {
  const { activity, actorId, inbox } = job.data;
  if (!(await shouldDeliverTo(new URL(inbox).hostname))) return;

  const outcome = await deliverOnce(activity, inbox, actorId); // 'success' | 'permanent' | 'retry'
  if (outcome === 'retry') throw new Error(`retry ${inbox}`);
}, {
  connection,
  concurrency: 10,
  settings: {
    // Mastodon-like curve: n^4 + 15 s plus jitter (see Delivery at Scale)
    backoffStrategy: (attemptsMade) =>
      ((attemptsMade - 1) ** 4 + 15 + Math.random() * 10) * 1000,
  },
});
```

`deliverOnce` and the success/permanent/retry classification are shown in [Delivery at Scale](/docs/guides/delivery-at-scale#a-delivery-job).

### Shared Inbox Optimization

Use shared inboxes to reduce requests:

```javascript
function deduplicateInboxes(recipients) {
  const inboxMap = new Map();

  for (const recipient of recipients) {
    // Prefer sharedInbox over personal inbox
    const inbox = recipient.endpoints?.sharedInbox || recipient.inbox;

    if (!inboxMap.has(inbox)) {
      inboxMap.set(inbox, []);
    }
    inboxMap.get(inbox).push(recipient.id);
  }

  return Array.from(inboxMap.keys());
}
```

With shared inbox, 1000 followers on 500 servers becomes ~500 requests instead of 1000.

## Retry Strategies

Retry from the **queue**, not with `sleep()` inside a worker — a sleeping worker holds a concurrency slot for nothing. Retry over days, not seconds: Mastodon retries a delivery 16 times over roughly 2–3 days and gives up immediately on most 4xx responses (except 401, 408 and 429). Details and the exact curve: [Delivery at Scale → Retry schedule](/docs/guides/delivery-at-scale#retry-schedule).

### Dead Server Tracking

Count failures by **distinct days**, and clear the record on any success — Mastodon marks a host unavailable after failures on 7 different days, and makes it deliverable again as soon as a delivery succeeds or the host sends a signed request ([Delivery at Scale → Unavailable domains](/docs/guides/delivery-at-scale#unavailable-domains)):

```javascript
async function recordFailure(hostname) {
  const day = new Date().toISOString().slice(0, 10);
  const { days } = await db.serverStatus.upsert(
    { hostname },
    { $addToSet: { days: day } },
    { returnDocument: 'after' }
  );
  if (days.length >= 7) {
    await db.serverStatus.update({ hostname }, { $set: { unavailable: true } });
  }
}

async function recordSuccess(hostname) {
  await db.serverStatus.remove({ hostname });
}

async function shouldDeliverTo(hostname) {
  const status = await db.serverStatus.findOne({ hostname });
  return !status?.unavailable;
}
```

## Database Optimization

### Indexing Strategy

```javascript
// Essential indexes for ActivityPub
db.notes.createIndex({ id: 1 }, { unique: true });
db.notes.createIndex({ attributedTo: 1, published: -1 });
db.notes.createIndex({ inReplyTo: 1 });
db.notes.createIndex({ 'to': 1 });
db.notes.createIndex({ 'tag.name': 1, 'tag.type': 1 });

db.actors.createIndex({ id: 1 }, { unique: true });
db.actors.createIndex({ preferredUsername: 1 });

db.followers.createIndex({ actor: 1 });
db.followers.createIndex({ follower: 1 });
db.followers.createIndex({ actor: 1, follower: 1 }, { unique: true });

db.inbox.createIndex({ actor: 1, createdAt: -1 });
```

### Connection Pooling

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  database: 'activitypub',
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Use pool for all queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

### Caching

```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function fetchActor(actorId) {
  // Try cache first
  const cached = await redis.get(`actor:${actorId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from remote
  const actor = await fetchRemoteActor(actorId);

  // Cache for 1 hour
  await redis.setex(`actor:${actorId}`, 3600, JSON.stringify(actor));

  return actor;
}

// Invalidate on Update — any actor type, and only for the signer's own actor
const ACTOR_TYPES = new Set(['Person', 'Service', 'Application', 'Group', 'Organization']);

async function processUpdate(activity, signer) {
  const object = activity.object;
  if (ACTOR_TYPES.has(object?.type) && object.id === signer.id) {
    await redis.del(`actor:${object.id}`);
  }
  // Process update...
}
```

## HTTP Optimization

### Connection Keep-Alive

Node's built-in `fetch` (undici) keeps connections alive by default and ignores the old `agent` option; tune it with an [undici](https://github.com/nodejs/undici) `Agent` passed as `dispatcher`. Capping connections per origin also stops a big fan-out from hammering one server:

```javascript
import { Agent } from 'undici';

const dispatcher = new Agent({
  connections: 8,            // max sockets per origin
  keepAliveTimeout: 30_000,
});

async function deliverActivity(activity, inbox, signedHeaders) {
  return fetch(inbox, {
    method: 'POST',
    dispatcher,
    headers: {
      'Content-Type': 'application/activity+json',
      ...signedHeaders,
    },
    body: JSON.stringify(activity),
    signal: AbortSignal.timeout(10_000),
  });
}
```

### Request Timeouts

```javascript
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
```

## Infrastructure

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRODUCTION SETUP                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Load Balancer]                                        │
│       ↓                                                 │
│  [Web Servers] ←→ [Redis] ←→ [Queue Workers]           │
│       ↓                                                 │
│  [PostgreSQL] (Primary + Read Replicas)                │
│       ↓                                                 │
│  [Object Storage] (Media files)                         │
│       ↓                                                 │
│  [CDN] (Static assets, cached media)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| Load Balancer | Distribute requests, SSL termination |
| Web Servers | Handle HTTP requests, serve API |
| Redis | Session store, cache, job queue |
| Queue Workers | Process deliveries, background jobs |
| PostgreSQL | Primary data store |
| Object Storage | Media files (S3, Minio) |
| CDN | Cache static files, reduce origin load |

### Horizontal Scaling

```yaml
# docker-compose.yml for scaling
services:
  web:
    image: myapp
    deploy:
      replicas: 4
    environment:
      - DATABASE_URL=postgres://...
      - REDIS_URL=redis://...

  worker:
    image: myapp
    command: node worker.js
    deploy:
      replicas: 8  # More workers for delivery
    environment:
      - DATABASE_URL=postgres://...
      - REDIS_URL=redis://...

  redis:
    image: redis:alpine

  postgres:
    image: postgres:15
```

## Monitoring

### Key Metrics

```javascript
const prometheus = require('prom-client');

// Delivery metrics
const deliveryDuration = new prometheus.Histogram({
  name: 'activitypub_delivery_duration_seconds',
  help: 'Time to deliver activities',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const deliveryErrors = new prometheus.Counter({
  name: 'activitypub_delivery_errors_total',
  help: 'Total delivery errors',
  labelNames: ['error_type']
});

const queueSize = new prometheus.Gauge({
  name: 'activitypub_queue_size',
  help: 'Current delivery queue size'
});

// Use in delivery code
async function deliverActivity(activity, inbox, actor) {
  const end = deliveryDuration.startTimer();
  try {
    await doDelivery(activity, inbox, actor);
  } catch (error) {
    deliveryErrors.inc({ error_type: error.code });
    throw error;
  } finally {
    end();
  }
}
```

### Queue Monitoring

```javascript
// Monitor queue health
setInterval(async () => {
  const waiting = await deliveryQueue.getWaitingCount();
  const active = await deliveryQueue.getActiveCount();
  const failed = await deliveryQueue.getFailedCount();

  queueSize.set(waiting + active);

  if (waiting > 10000) {
    console.warn('Delivery queue backing up:', waiting);
  }
}, 10000);
```

## Optimization Checklist

### Before Launch
- [ ] Set up delivery queue (Redis + workers)
- [ ] Configure connection pooling
- [ ] Add database indexes
- [ ] Set up caching layer
- [ ] Configure timeouts on all HTTP requests
- [ ] Set up monitoring and alerting

### For Growth
- [ ] Use shared inboxes where possible
- [ ] Implement dead server tracking
- [ ] Add read replicas for database
- [ ] Use CDN for media
- [ ] Implement rate limiting
- [ ] Debounce count updates (see below)

### Batching and Debouncing

There is no interoperable way to batch several activities into one delivery: Mastodon 4.7 stopped processing collections of activities posted to an inbox, and [FEP-49eb](https://codeberg.org/fediverse/fep/src/branch/main/fep/49eb/fep-49eb.md) (batched delivery) is still a draft — see [Delivery at Scale → Batching](/docs/guides/delivery-at-scale#batching-not-yet). Every Like, vote or Follow is its own activity, and receivers expect it.

What you *can* debounce is your own outgoing `Update`s. Mastodon, for example, sends one `Update` of a poll about 3 minutes after votes arrive rather than one per vote (see [Polls](/docs/guides/polls)).

## Next Steps

- **[WebFinger Implementation](/docs/guides/webfinger-implementation)** - User discovery
- **[Testing Your Implementation](/docs/guides/testing-your-implementation)** - Validation
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Interoperability
