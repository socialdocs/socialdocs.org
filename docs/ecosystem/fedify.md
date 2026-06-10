---
sidebar_position: 10
title: Fedify
description: TypeScript framework for building ActivityPub servers
---

# Fedify

Fedify is a comprehensive TypeScript framework for building federated server applications powered by ActivityPub.

## Overview

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Runtimes | Deno, Node.js, Bun |
| License | MIT |
| Website | [fedify.dev](https://fedify.dev/) |
| Repository | [github.com/dahlia/fedify](https://github.com/dahlia/fedify) |
| npm | `@fedify/fedify` |
| Status | Active, Production Ready |

## Key Features

### Protocol Support

- **ActivityPub** — Full server-to-server and client-to-server implementation
- **WebFinger** — Built-in discovery
- **NodeInfo** — Server metadata
- **HTTP Signatures** — Request signing and verification
- **Linked Data Signatures** — Document signing
- **Object Integrity Proofs** — FEP-8b32 support

### Developer Experience

- **Type-safe vocabulary** — Full TypeScript types for Activity Vocabulary
- **Vendor extensions** — Support for Mastodon, Misskey, and other extensions
- **Multiple runtimes** — Deno, Node.js, and Bun
- **Framework adapters** — Express, Fastify, Hono, Koa, SvelteKit
- **CLI toolchain** — Development and testing utilities

### Infrastructure

- **Database adapters** — PostgreSQL, SQLite
- **Caching** — Redis integration
- **Message queues** — AMQP support for async delivery
- **Cloud deployment** — Cloudflare Workers support
- **Observability** — OpenTelemetry integration

## Installation

### Deno

```typescript
import { createFederation } from "jsr:@fedify/fedify";
```

### Node.js / Bun

```bash
npm install @fedify/fedify
```

```typescript
import { createFederation } from "@fedify/fedify";
```

## Quick Start

### Basic Federation Setup

```typescript
import { createFederation, Person, MemoryKvStore } from "@fedify/fedify";

const federation = createFederation({
  kv: new MemoryKvStore(),
});

// Define actor dispatcher
federation.setActorDispatcher("/users/{handle}", async (ctx, handle) => {
  // Fetch user from your database
  const user = await db.getUserByHandle(handle);
  if (!user) return null;

  return new Person({
    id: ctx.getActorUri(handle),
    preferredUsername: handle,
    name: user.displayName,
    inbox: ctx.getInboxUri(handle),
    outbox: ctx.getOutboxUri(handle),
    followers: ctx.getFollowersUri(handle),
    following: ctx.getFollowingUri(handle),
  });
});
```

### Handling Inbox Activities

```typescript
federation.setInboxListeners("/users/{handle}/inbox")
  .on(Follow, async (ctx, follow) => {
    const follower = follow.actorId;
    const followed = ctx.getActorUri(ctx.handle);

    // Store follow relationship
    await db.addFollower(ctx.handle, follower);

    // Send Accept activity
    await ctx.sendActivity(
      { handle: ctx.handle },
      follower,
      new Accept({ actor: followed, object: follow }),
    );
  })
  .on(Undo, async (ctx, undo) => {
    if (undo.object instanceof Follow) {
      await db.removeFollower(ctx.handle, undo.actorId);
    }
  });
```

### Sending Activities

```typescript
import { Create, Note } from "@fedify/fedify";

// Create a post
const note = new Note({
  id: ctx.getObjectUri(Note, { id: postId }),
  attributedTo: ctx.getActorUri(handle),
  content: "Hello, Fediverse!",
  published: Temporal.Now.instant(),
  to: new URL("https://www.w3.org/ns/activitystreams#Public"),
});

// Send to followers
await ctx.sendActivity(
  { handle },
  "followers",
  new Create({ actor: ctx.getActorUri(handle), object: note }),
);
```

## Framework Integration

### Express

```typescript
import express from "express";
import { integrateFederation } from "@fedify/express";

const app = express();
integrateFederation(app, federation);
```

### Hono

```typescript
import { Hono } from "hono";
import { federation as fedifyMiddleware } from "@fedify/hono";

const app = new Hono();
app.use(fedifyMiddleware(federation));
```

### Fastify

```typescript
import Fastify from "fastify";
import { integrateFederation } from "@fedify/fastify";

const app = Fastify();
await integrateFederation(app, federation);
```

## Database Integration

### PostgreSQL

```typescript
import { PostgresKvStore } from "@fedify/postgres";
import postgres from "postgres";

const sql = postgres("postgres://localhost/myapp");
const kv = new PostgresKvStore(sql);

const federation = createFederation({ kv });
```

### Redis (Caching)

```typescript
import { RedisKvStore } from "@fedify/redis";
import Redis from "ioredis";

const redis = new Redis();
const kv = new RedisKvStore(redis);
```

## Activity Vocabulary

Fedify provides type-safe classes for the full Activity Vocabulary:

### Core Types

```typescript
import {
  // Actors
  Person, Group, Organization, Application, Service,
  // Objects
  Note, Article, Image, Video, Audio, Document,
  // Activities
  Create, Update, Delete,
  Follow, Accept, Reject,
  Like, Announce, Undo,
  // Collections
  Collection, OrderedCollection,
  CollectionPage, OrderedCollectionPage,
} from "@fedify/fedify";
```

### Vendor Extensions

```typescript
import {
  // Mastodon extensions
  Emoji, PropertyValue, IdentityProof,
  // Misskey extensions
  MisskeyEmoji,
} from "@fedify/fedify";
```

## Testing

Fedify includes testing utilities:

```typescript
import { createFederatedServer } from "@fedify/fedify/testing";

// Spin up a test server
const server = await createFederatedServer(federation);

// Make test requests
const response = await server.handle(
  new Request("https://example.com/users/alice"),
);
```

## CLI Tools

```bash
# Install CLI
npm install -g @fedify/cli

# Lookup an actor
fedify lookup @user@example.com

# Validate an activity
fedify validate activity.json

# Start development server with live reload
fedify dev
```

## Comparison with Other Libraries

| Feature | Fedify | activitypub-express | microfed |
|---------|--------|---------------------|----------|
| TypeScript | ✅ Native | ❌ | ❌ |
| Runtime | Deno/Node/Bun | Node only | Node only |
| Framework | Multiple | Express only | None |
| LD Signatures | ✅ | ❌ | ❌ |
| Object Integrity | ✅ FEP-8b32 | ❌ | ❌ |
| Type-safe vocab | ✅ | ❌ | ❌ |
| Complexity | Higher | Medium | Low |

## When to Use Fedify

**Good for:**
- Production applications requiring full AP compliance
- TypeScript projects wanting type safety
- Apps needing multiple framework options
- Projects requiring advanced signatures (LD Signatures, Object Integrity)

**Consider alternatives if:**
- Building a minimal single-user server → [Fedbox](/docs/ecosystem/fedbox)
- Need simpler Express integration → [@fedify/express](https://github.com/fedify-dev/express), or activitypub-express (unmaintained)
- Want zero dependencies → [microfed](/docs/ecosystem/javascript-libraries#microfed)

## Resources

- **[Documentation](https://fedify.dev/)** — Full manual and API reference
- **[Tutorial](https://fedify.dev/tutorial)** — Step-by-step microblog tutorial
- **[Examples](https://github.com/dahlia/fedify/tree/main/examples)** — Sample applications
- **[Matrix Chat](https://matrix.to/#/#fedify:matrix.org)** — Community support
- **[Discord](https://discord.gg/fedify)** — Developer community

## See Also

- **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)** — Other JS/TS options
- **[Building an Actor](/docs/guides/building-an-actor)** — Actor implementation guide
- **[HTTP Signatures](/docs/specs/http-signatures/overview)** — Signature details
