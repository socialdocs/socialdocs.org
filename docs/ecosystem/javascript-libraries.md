---
sidebar_position: 11
title: JavaScript Libraries
description: ActivityPub libraries for JavaScript and TypeScript
---

# JavaScript Libraries

JavaScript/TypeScript libraries for implementing ActivityPub.

Status and versions below were taken from the npm registry and GitHub on **2026-10-15**. *Active* = a release or commit in the last 12 months; *Dormant* = 12–36 months; *Archived* = the repository is archived.

| Library | Latest release | Status |
|---------|----------------|--------|
| [Fedify](#fedify) | 2.4.4 (2026-10-12) | Active |
| [BotKit](#botkit) | 0.5.7 (2026-10-13) | Active |
| [jsonld](#jsonld) | 9.0.0 (2025-11-21) | Active |
| [activitystrea.ms](#activitystreams) | 4.0.2 (2026-10-05) | Active |
| [http-message-signatures](#http-message-signatures) | 1.0.6 (2026-06-04) | Active |
| [microfed](#microfed) | 0.0.14 (2025-12-26) | Experimental |
| [http-signature](#http-signature) | 1.4.0 (2023-11-15) | Dormant |
| [activitypub-express](#activitypub-express) | 4.4.2 (2024-02-12) | Dormant |

## Fedify

TypeScript framework for ActivityPub servers: vocabulary types, WebFinger, NodeInfo, request signing and verification (draft-cavage and RFC 9421), Object Integrity Proofs, queues, and adapters for most web frameworks.

| Property | Value |
|----------|-------|
| Repository | [github.com/fedify-dev/fedify](https://github.com/fedify-dev/fedify) |
| Documentation | [fedify.dev](https://fedify.dev/) |
| npm | `@fedify/fedify`, `@fedify/vocab` |
| License | MIT |

**See the [dedicated Fedify page](/docs/ecosystem/fedify) for setup and examples.**

## BotKit

A framework for writing standalone ActivityPub bots, built on Fedify by the same team.

| Property | Value |
|----------|-------|
| Repository | [github.com/fedify-dev/botkit](https://github.com/fedify-dev/botkit) |
| Documentation | [botkit.fedify.dev](https://botkit.fedify.dev/) |
| npm | `@fedify/botkit` |

## jsonld

The reference JSON-LD processor for JavaScript (expand, compact, frame, normalize).

| Property | Value |
|----------|-------|
| Repository | [github.com/digitalbazaar/jsonld.js](https://github.com/digitalbazaar/jsonld.js) |
| npm | `jsonld` |

```javascript
import jsonld from 'jsonld';

// Expand a document to absolute IRIs
const expanded = await jsonld.expand(activity);

// Compact with the ActivityStreams context
const compacted = await jsonld.compact(expanded, 'https://www.w3.org/ns/activitystreams');
```

Most servers never run a JSON-LD processor on inbound data; if you do, use a document loader that only serves preloaded contexts, never one that fetches arbitrary URLs.

## activitystrea.ms

Activity Streams 2.0 builder and parser, originally by James Snell and now maintained under the [Social Web Foundation](https://github.com/social-web-foundation/activitystrea.ms) (the old `jasnell/activitystrea.ms` repository is archived).

| Property | Value |
|----------|-------|
| Repository | [github.com/social-web-foundation/activitystrea.ms](https://github.com/social-web-foundation/activitystrea.ms) |
| npm | `activitystrea.ms` |

```javascript
import as from 'activitystrea.ms';

const doc = await as.create()
  .actor('https://example.com/users/alice')
  .object('https://example.com/notes/1')
  .prettyWrite();
```

## http-message-signatures

Signing and verification for **HTTP Message Signatures** (the HTTP WG specification that became [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421)), with a back-port to draft-cavage. Its README states it was last updated against draft revision 13, so check edge cases against the final RFC. Supports RSA, ECDSA and Ed25519 keys.

| Property | Value |
|----------|-------|
| Repository | [github.com/dhensby/node-http-message-signatures](https://github.com/dhensby/node-http-message-signatures) |
| npm | `http-message-signatures` |

See the [README](https://github.com/dhensby/node-http-message-signatures#readme) for signing and verification examples.

## microfed

Minimal, modular ActivityPub building blocks (profile, auth, webfinger, inbox, outbox) with no dependencies beyond Node.js `crypto`.

:::note Disclosure
microfed is written by the maintainer of SocialDocs. It is **experimental** (0.0.x), signs with draft-cavage HTTP Signatures only, and is not a substitute for a maintained framework in production.
:::

| Property | Value |
|----------|-------|
| Repository | [github.com/micro-fed/microfed.org](https://github.com/micro-fed/microfed.org) |
| npm | `microfed` |
| License | MIT |

```javascript
import { profile, auth, outbox } from 'microfed';

const { publicKey, privateKey } = auth.generateKeypair();

const actor = profile.createActor({
  id: 'https://example.com/users/alice',
  username: 'alice',
  name: 'Alice',
  publicKey,
});

const note = outbox.createNote({ actor: actor.id, content: '<p>Hello!</p>' });
const activity = outbox.wrapCreate(actor.id, note);

const headers = auth.sign({
  privateKey,
  keyId: `${actor.id}#main-key`,
  method: 'POST',
  url: 'https://remote.example/inbox',
  body: JSON.stringify(activity),
});
```

## http-signature

Joyent's draft-cavage HTTP Signatures implementation (now under TritonDataCenter). It predates ActivityPub and **does not support RFC 9421**; no release since November 2023.

| Property | Value |
|----------|-------|
| Repository | [github.com/TritonDataCenter/node-http-signature](https://github.com/TritonDataCenter/node-http-signature) |
| npm | `http-signature` |

```javascript
const httpSignature = require('http-signature');

// Verification: parse, then verify against the key you fetched for parsed.keyId.
const parsed = httpSignature.parseRequest(req);
const ok = httpSignature.verifySignature(parsed, publicKeyPem);
```

`verifySignature` only checks the cryptography. You must still require the right signed headers, check `Digest` against the raw body, and confirm the key's owner is the activity's `actor` — see [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).

## activitypub-express

Express.js middleware with MongoDB storage.

:::caution Dormant
No release or commit since February 2024. Avoid it for new projects — see the [discussion on reviving it](https://github.com/socialdocs/socialdocs.org/issues/17).
:::

| Property | Value |
|----------|-------|
| Repository | [github.com/immers-space/activitypub-express](https://github.com/immers-space/activitypub-express) |
| npm | `activitypub-express` |

## Reference Applications

Reading a complete, maintained server is often more useful than a library:

- **[Hollo](https://github.com/fedify-dev/hollo)** — single-user microblog with a Mastodon-compatible API, built on Fedify
- **[Ghost ActivityPub](https://github.com/TryGhost/ActivityPub)** — Ghost's federation service (TypeScript, built on Fedify)

## Quick Start Recommendation

- **New server**: Fedify.
- **A bot**: BotKit.
- **Existing Express/Hono/Fastify app**: Fedify with its framework adapter (`@fedify/express`, `@fedify/hono`, `@fedify/fastify`).
- **Rolling your own**: jsonld + http-message-signatures, and read [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37) before writing any verification code.

## See Also

- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
- **[Fedify](/docs/ecosystem/fedify)**
- **[Building an Actor](/docs/guides/building-an-actor)**
