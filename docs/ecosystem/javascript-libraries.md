---
sidebar_position: 11
title: JavaScript Libraries
description: ActivityPub libraries for JavaScript and TypeScript
---

# JavaScript Libraries

JavaScript/TypeScript libraries for implementing ActivityPub.

## Fedify

Comprehensive TypeScript framework for ActivityPub servers.

| Property | Value |
|----------|-------|
| Repository | [github.com/dahlia/fedify](https://github.com/dahlia/fedify) |
| Documentation | [fedify.dev](https://fedify.dev/) |
| License | MIT |
| Status | Active, Production Ready |

### Features

- Full TypeScript support with type-safe Activity Vocabulary
- Deno, Node.js, and Bun compatible
- Framework adapters (Express, Fastify, Hono, Koa, SvelteKit)
- HTTP Signatures, LD Signatures, Object Integrity Proofs
- Database integrations (PostgreSQL, SQLite, Redis)
- Built-in WebFinger, NodeInfo

**See [dedicated Fedify page](/docs/ecosystem/fedify) for full documentation.**

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

## microfed

Minimal, modular ActivityPub microservices library.

| Property | Value |
|----------|-------|
| Repository | [github.com/micro-fed/microfed.org](https://github.com/micro-fed/microfed.org) |
| npm | `microfed` |
| License | MIT |
| Status | Active |

### Features

- Zero dependencies (uses Node.js crypto)
- Modular exports (profile, auth, webfinger, inbox, outbox)
- HTTP Signature signing and verification
- WebFinger resolution
- Activity creation and delivery

### Example

```javascript
import { profile, auth, webfinger, outbox } from 'microfed';

// Generate keypair
const { publicKey, privateKey } = auth.generateKeypair();

// Create actor
const actor = profile.createActor({
  id: 'https://example.com/alice#me',
  username: 'alice',
  name: 'Alice',
  publicKey
});

// Create and sign a post
const note = outbox.createNote({
  actor: actor.id,
  content: '<p>Hello!</p>'
});

// Sign HTTP request
const headers = auth.sign({
  privateKey,
  keyId: 'https://example.com/alice#main-key',
  method: 'POST',
  url: 'https://remote.example/inbox',
  body: JSON.stringify(note)
});
```

### Modular Imports

```javascript
// Import only what you need
import { sign, verify } from 'microfed/auth';
import { createActor } from 'microfed/profile';
import { resolve } from 'microfed/webfinger';
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
| microfed | Minimal server | Low | Modular primitives |
| as2 | Types only | Low | Vocabulary |
| http-signature | Signing | Low | HTTP Signatures |

## Quick Start Recommendation

**For new projects**: Use Fedify for comprehensive TypeScript support.

**For existing Express apps**: Use activitypub-express.

**For minimal/single-user**: Use microfed with Fedbox.

**For manual implementation**: Combine http-signature + jsonld + custom code.

## See Also

- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
- **[Building an Actor](/docs/guides/building-an-actor)**

