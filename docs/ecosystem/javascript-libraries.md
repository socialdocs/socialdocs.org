---
sidebar_position: 11
title: JavaScript Libraries
description: ActivityPub libraries for JavaScript and TypeScript
---

# JavaScript Libraries

JavaScript/TypeScript libraries for implementing ActivityPub.

## Fedify

Modern TypeScript framework for ActivityPub servers.

| Property | Value |
|----------|-------|
| Repository | [github.com/dahlia/fedify](https://github.com/dahlia/fedify) |
| Documentation | [fedify.dev](https://fedify.dev/) |
| License | MIT |
| Status | Active, Production Ready |

### Features

- Full TypeScript support
- Deno, Node.js, and Bun compatible
- Built-in WebFinger, NodeInfo
- HTTP Signature handling
- Actor and activity management

### Example

```typescript
import { createFederation, Person } from "@fedify/fedify";

const federation = createFederation({
  kv: new MemoryKvStore(),
});

federation.setActorDispatcher("/users/{handle}", async (ctx, handle) => {
  return new Person({
    id: ctx.getActorUri(handle),
    preferredUsername: handle,
    inbox: ctx.getInboxUri(handle),
    outbox: ctx.getOutboxUri(handle),
  });
});
```

## activitypub-express

Express.js middleware for ActivityPub.

| Property | Value |
|----------|-------|
| Repository | [github.com/immers-space/activitypub-express](https://github.com/immers-space/activitypub-express) |
| License | MIT |
| Status | Active |

### Features

- Express.js integration
- MongoDB storage
- WebFinger support
- Activity delivery

### Example

```javascript
const express = require('express');
const ActivitypubExpress = require('activitypub-express');

const app = express();
const apex = ActivitypubExpress({
  domain: 'example.com',
  actorParam: 'actor',
  objectParam: 'id',
});

app.use(apex);

app.route(apex.routes.actor)
  .get(apex.net.actor.get)
  .post(apex.net.actor.post);

app.route(apex.routes.inbox)
  .get(apex.net.inbox.get)
  .post(apex.net.inbox.post);
```

## as2

ActivityStreams 2.0 vocabulary library.

| Property | Value |
|----------|-------|
| Repository | [github.com/jasnell/activitystrea.ms](https://github.com/jasnell/activitystrea.ms) |
| npm | `activitystrea.ms` |
| Status | Maintenance |

### Example

```javascript
const as2 = require('activitystrea.ms');

const note = as2.note()
  .name('My Note')
  .content('Hello, World!')
  .get();

console.log(JSON.stringify(note, null, 2));
```

## http-signature

HTTP Signature implementation.

| Property | Value |
|----------|-------|
| Repository | [github.com/joyent/node-http-signature](https://github.com/joyent/node-http-signature) |
| npm | `http-signature` |
| Status | Stable |

### Signing

```javascript
const httpSignature = require('http-signature');
const https = require('https');

const options = {
  host: 'remote.example',
  path: '/inbox',
  method: 'POST',
  headers: { 'Content-Type': 'application/activity+json' }
};

const req = https.request(options);

httpSignature.sign(req, {
  key: privateKey,
  keyId: 'https://example.com/users/alice#main-key',
  headers: ['(request-target)', 'host', 'date', 'digest']
});
```

### Verification

```javascript
httpSignature.parseRequest(req);
httpSignature.verifySignature(parsed, publicKey);
```

## jsonld

JSON-LD processor.

| Property | Value |
|----------|-------|
| Repository | [github.com/digitalbazaar/jsonld.js](https://github.com/digitalbazaar/jsonld.js) |
| npm | `jsonld` |
| Status | Active |

### Example

```javascript
const jsonld = require('jsonld');

// Expand a document
const expanded = await jsonld.expand(activity);

// Compact with context
const compacted = await jsonld.compact(expanded, {
  "@context": "https://www.w3.org/ns/activitystreams"
});
```

## Comparison

| Library | Use Case | Complexity | Features |
|---------|----------|------------|----------|
| Fedify | Full server | High | Complete framework |
| activitypub-express | Express apps | Medium | Middleware |
| as2 | Types only | Low | Vocabulary |
| http-signature | Signing | Low | HTTP Signatures |

## Quick Start Recommendation

**For new projects**: Use Fedify for comprehensive TypeScript support.

**For existing Express apps**: Use activitypub-express.

**For manual implementation**: Combine http-signature + jsonld + custom code.

## See Also

- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
- **[Building an Actor](/docs/guides/building-an-actor)**

