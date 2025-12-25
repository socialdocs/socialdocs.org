---
sidebar_position: 14
title: Scaling and Performance
description: Best practices for scaling ActivityPub servers and optimizing federation performance
---

# Scaling and Performance

Federation presents unique scaling challenges. When you have 100 federated servers and a post gets 100 comments with 100 votes each, that's potentially millions of HTTP requests. This guide covers strategies for building performant, scalable ActivityPub implementations.

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

```javascript
const Queue = require('bull');

const deliveryQueue = new Queue('delivery', {
  redis: { host: 'localhost', port: 6379 }
});

// Process deliveries with concurrency control
deliveryQueue.process(10, async (job) => {
  const { activity, actor } = job.data;
  const authorActor = await db.actors.findOne({ id: actor });

  // Get all recipients
  const inboxes = await resolveRecipientInboxes(activity);

  // Deduplicate by shared inbox
  const uniqueInboxes = deduplicateInboxes(inboxes);

  // Deliver to each inbox
  const results = await Promise.allSettled(
    uniqueInboxes.map(inbox =>
      deliverWithRetry(activity, inbox, authorActor)
    )
  );

  // Log failures for retry
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.log(`${failures.length} deliveries failed`);
  }
});
```

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

### Exponential Backoff

```javascript
async function deliverWithRetry(activity, inbox, actor, attempt = 0) {
  const maxAttempts = 5;
  const baseDelay = 1000; // 1 second

  try {
    await deliverActivity(activity, inbox, actor);
  } catch (error) {
    if (attempt >= maxAttempts) {
      // Mark server as potentially dead
      await markServerUnreachable(new URL(inbox).hostname);
      throw error;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = baseDelay * Math.pow(2, attempt);
    await sleep(delay);

    return deliverWithRetry(activity, inbox, actor, attempt + 1);
  }
}
```

### Dead Server Tracking

```javascript
async function markServerUnreachable(hostname) {
  await db.serverStatus.upsert(
    { hostname },
    {
      $set: { lastFailure: new Date() },
      $inc: { failureCount: 1 }
    }
  );
}

async function shouldDeliverTo(hostname) {
  const status = await db.serverStatus.findOne({ hostname });

  if (!status) return true;

  // If failed recently, skip
  if (status.failureCount >= 5) {
    const hoursSinceFailure =
      (Date.now() - status.lastFailure) / (1000 * 60 * 60);

    // Back off exponentially up to 24 hours
    const backoffHours = Math.min(24, Math.pow(2, status.failureCount - 5));

    if (hoursSinceFailure < backoffHours) {
      return false;
    }
  }

  return true;
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

// Invalidate on Update
async function processUpdate(activity) {
  if (activity.object?.type === 'Person') {
    await redis.del(`actor:${activity.object.id}`);
  }
  // Process update...
}
```

## HTTP Optimization

### Connection Keep-Alive

```javascript
const https = require('https');
const http = require('http');

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000
});

async function deliverActivity(activity, inbox, actor) {
  const response = await fetch(inbox, {
    method: 'POST',
    agent: httpsAgent, // Reuse connections
    headers: {
      'Content-Type': 'application/activity+json',
      // ... signature headers
    },
    body: JSON.stringify(activity)
  });

  return response;
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
- [ ] Consider aggregating activities

### Activity Aggregation

Reduce vote/like spam by aggregating:

```javascript
// Instead of sending 100 Like activities immediately
// Batch them into periodic updates

async function recordLike(actor, objectId) {
  // Store locally
  await db.likes.insert({ actor: actor.id, object: objectId });

  // Don't deliver immediately
}

// Periodic job to send aggregated notifications
async function sendLikeAggregates() {
  const recentLikes = await db.likes.aggregate([
    { $match: { notified: false } },
    { $group: { _id: '$object', count: { $sum: 1 } } }
  ]);

  for (const { _id: objectId, count } of recentLikes) {
    // Send single notification: "Your post got 15 new likes"
    // Instead of 15 separate Like activities
  }
}
```

## Next Steps

- **[WebFinger Implementation](/docs/guides/webfinger-implementation)** - User discovery
- **[Testing Your Implementation](/docs/guides/testing-your-implementation)** - Validation
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Interoperability
