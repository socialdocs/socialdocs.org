---
sidebar_position: 10
title: Fedify
description: TypeScript framework for building ActivityPub servers
---

# Fedify

Fedify is a TypeScript framework for building federated server applications powered by ActivityPub. It is the most actively developed ActivityPub framework as of October 2026.

## Overview

| Property | Value |
|----------|-------|
| Language | TypeScript |
| Runtimes | Deno, Node.js, Bun |
| License | MIT |
| Website | [fedify.dev](https://fedify.dev/) |
| Repository | [github.com/fedify-dev/fedify](https://github.com/fedify-dev/fedify) |
| Packages | `@fedify/fedify` (core), `@fedify/vocab` (Activity Vocabulary classes), plus adapters |
| Latest release | 2.4.4 (2026-10-12) |
| Status | Active |

:::info Version note
The examples below target **Fedify 2.x**. Two changes trip up people coming from 1.x tutorials:

- Vocabulary classes (`Person`, `Note`, `Follow`, …) are imported from **`@fedify/vocab`**, not `@fedify/fedify`.
- Route templates use **`{identifier}`** (e.g. `/users/{identifier}`), and the sender passed to `sendActivity` is `{ identifier }`.

Always check the [Fedify manual](https://fedify.dev/) for the version you install.
:::

## Key Features

### Protocol Support

- **ActivityPub** server-to-server federation
- **WebFinger** and **NodeInfo** built in
- **HTTP Signatures** — both draft-cavage and [RFC 9421 HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421)
- **Object Integrity Proofs** ([FEP-8b32](https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md)) and Linked Data Signatures
- **Portable objects** ([FEP-ef61](https://codeberg.org/fediverse/fep/src/branch/main/fep/ef61/fep-ef61.md)) via `verifyPortableObject`

Inbound activities are verified before your inbox listeners see them; unverified deliveries go to an opt-in `onUnverifiedActivity` hook.

### Developer Experience

- **Type-safe vocabulary** — TypeScript classes for the Activity Vocabulary and common extensions (e.g. Mastodon's `Emoji`, `PropertyValue`)
- **Framework adapters** — Express, Fastify, Hono, Koa, Elysia, h3, NestJS, Next.js, SvelteKit, Astro, Cloudflare Workers
- **CLI** — `lookup`, `inbox`, `tunnel`, `webfinger`, `nodeinfo`, `init`, `bench` and more

### Infrastructure

- **Key–value stores and queues** — PostgreSQL, MySQL, SQLite, Redis, AMQP, Deno KV
- **Delivery** — retries with exponential backoff and a per-host circuit breaker
- **Observability** — OpenTelemetry tracing and metrics

## Installation

### Node.js / Bun

```bash
npm install @fedify/fedify @fedify/vocab
```

### Deno

```typescript
import { createFederation } from "jsr:@fedify/fedify";
import { Person } from "jsr:@fedify/vocab";
```

## Quick Start

The snippets below were typechecked against `@fedify/fedify` and `@fedify/vocab` 2.4.4 (strict mode). `db` stands for your own data layer.

### Basic Federation Setup

```typescript
import { createFederation, MemoryKvStore } from "@fedify/fedify";
import { Person } from "@fedify/vocab";

const federation = createFederation<void>({
  kv: new MemoryKvStore(), // use a persistent store in production
});

federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
  const user = await db.getUser(identifier); // your own data layer
  if (!user) return null;

  return new Person({
    id: ctx.getActorUri(identifier),
    preferredUsername: identifier,
    name: user.displayName,
    inbox: ctx.getInboxUri(identifier),
    outbox: ctx.getOutboxUri(identifier),
    followers: ctx.getFollowersUri(identifier),
    following: ctx.getFollowingUri(identifier),
  });
});
```

A real actor also needs key pairs so it can sign outgoing requests: chain `.setKeyPairsDispatcher(...)` onto `setActorDispatcher(...)` — see the [actor manual](https://fedify.dev/manual/actor).

### Handling Inbox Activities

```typescript
import { Accept, Follow, Undo } from "@fedify/vocab";

federation
  .setInboxListeners("/users/{identifier}/inbox", "/inbox")
  .on(Follow, async (ctx, follow) => {
    if (ctx.recipient == null || follow.actorId == null) return; // shared inbox / malformed
    const follower = await follow.getActor(ctx);
    if (follower == null) return;

    await db.addFollower(ctx.recipient, follow.actorId);

    await ctx.sendActivity(
      { identifier: ctx.recipient },
      follower,
      new Accept({ actor: ctx.getActorUri(ctx.recipient), object: follow }),
    );
  })
  .on(Undo, async (ctx, undo) => {
    const object = await undo.getObject(ctx);
    if (object instanceof Follow && ctx.recipient != null && undo.actorId != null) {
      await db.removeFollower(ctx.recipient, undo.actorId);
    }
  });
```

`ctx.recipient` is the identifier of the addressed actor, or `null` when the activity arrived at the shared inbox. Signature verification has already happened by the time a listener runs.

### Sending Activities

```typescript
import { Create, Note, PUBLIC_COLLECTION } from "@fedify/vocab";
import { Temporal } from "temporal-polyfill"; // built in on Deno

// `ctx` comes from federation.createContext(request, contextData),
// or from inside a dispatcher/listener.
const note = new Note({
  id: ctx.getObjectUri(Note, { identifier, id: postId }), // requires setObjectDispatcher
  attribution: ctx.getActorUri(identifier),
  content: "Hello, Fediverse!",
  published: Temporal.Now.instant(),
  to: PUBLIC_COLLECTION,
  cc: ctx.getFollowersUri(identifier),
});

await ctx.sendActivity(
  { identifier },
  "followers",
  new Create({
    id: new URL(`${note.id}#create`),
    actor: ctx.getActorUri(identifier),
    object: note,
    to: PUBLIC_COLLECTION,
    cc: ctx.getFollowersUri(identifier),
  }),
);
```

Sending to `"followers"` requires a followers collection dispatcher. See [Sending activities](https://fedify.dev/manual/send).

## Framework Integration

### Express

```typescript
import express from "express";
import { integrateFederation } from "@fedify/express";

const app = express();
app.set("trust proxy", true);
app.use(integrateFederation(federation, (req) => undefined));
```

### Hono

```typescript
import { Hono } from "hono";
import { federation as fedifyMiddleware } from "@fedify/hono";

const app = new Hono();
app.use(fedifyMiddleware(federation, (c) => undefined));
```

### Fastify

```typescript
import Fastify from "fastify";
import { fedifyPlugin } from "@fedify/fastify";

const fastify = Fastify();
await fastify.register(fedifyPlugin, {
  federation,
  contextDataFactory: () => undefined,
});
```

Other adapters are listed in the [integration manual](https://fedify.dev/manual/integration).

## Persistent Storage and Queues

### PostgreSQL

```typescript
import { PostgresKvStore, PostgresMessageQueue } from "@fedify/postgres";
import postgres from "postgres";

const sql = postgres("postgres://localhost/myapp");

const federation = createFederation<void>({
  kv: new PostgresKvStore(sql),
  queue: new PostgresMessageQueue(sql),
});
```

### Redis

```typescript
import { RedisKvStore, RedisMessageQueue } from "@fedify/redis";
import { Redis } from "ioredis";

const federation = createFederation<void>({
  kv: new RedisKvStore(new Redis()),
  queue: new RedisMessageQueue(() => new Redis()),
});
```

## Activity Vocabulary

```typescript
import {
  // Actors
  Person, Group, Organization, Application, Service,
  // Objects
  Note, Article, Image, Video, Audio, Document,
  // Activities
  Create, Update, Delete, Follow, Accept, Reject, Like, Announce, Undo,
  // Collections
  Collection, OrderedCollection, CollectionPage, OrderedCollectionPage,
  // Common extensions
  Emoji, PropertyValue,
} from "@fedify/vocab";
```

## CLI Tools

```bash
npm install -g @fedify/cli

fedify lookup @user@example.com   # fetch and pretty-print an actor or object
fedify inbox                      # ephemeral inbox that logs incoming activities
fedify tunnel 3000                # expose a local server over public HTTPS
fedify webfinger @user@example.com
fedify nodeinfo example.com
```

See the [CLI documentation](https://fedify.dev/cli) for all commands.

## Comparison with Other JavaScript Options

| Feature | Fedify | microfed | activitypub-express |
|---------|--------|----------|---------------------|
| Status (Oct 2026) | Active | Experimental (0.0.x) | Dormant since Feb 2024 |
| TypeScript | ✅ Native | ❌ | ❌ |
| Runtimes | Deno/Node/Bun | Node | Node |
| RFC 9421 signatures | ✅ | ❌ (draft-cavage) | ❌ |
| Object Integrity Proofs | ✅ | ❌ | ❌ |
| Type-safe vocabulary | ✅ | ❌ | ❌ |
| Complexity | Higher | Low | Medium |

## When to Use Fedify

**Good for:**
- Production servers that need to interoperate with Mastodon and the wider fediverse
- TypeScript projects that want type safety and built-in request verification
- Apps on any of the supported web frameworks

**Consider alternatives if:**
- You only need a bot → [BotKit](https://botkit.fedify.dev/) (built on Fedify)
- You want to study or self-host a complete single-user server → [Hollo](https://github.com/fedify-dev/hollo) (built on Fedify)

## Resources

- **[Documentation](https://fedify.dev/)** — Manual and API reference
- **[Tutorial](https://fedify.dev/tutorial)** — Step-by-step microblog tutorial
- **[Examples](https://github.com/fedify-dev/fedify/tree/main/examples)** — Sample applications
- **[Matrix](https://matrix.to/#/#fedify:matrix.org)** and **[GitHub Discussions](https://github.com/fedify-dev/fedify/discussions)** — Community support
- **[Security advisories](https://github.com/fedify-dev/fedify/security/advisories)** — Keep your version current

## See Also

- **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)** — Other JS/TS options
- **[Building an Actor](/docs/guides/building-an-actor)** — Actor implementation guide
- **[HTTP Signatures](/docs/specs/http-signatures/overview)** — Signature details
