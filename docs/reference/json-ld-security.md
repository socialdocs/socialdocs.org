---
sidebar_position: 15
title: JSON-LD Security
description: Security considerations for JSON-LD processing
last_verified: 2026-10-15
verified_against: "AS2 Core, jsonld 9.0.0, request-filtering-agent 3.2.1, Mastodon GHSA-vgm8-frgh-rh2v and json_ld_helper.rb (v4.7.3)"
---

# JSON-LD Security

JSON-LD processing introduces unique security considerations.

## Context Injection

### The Risk

Malicious contexts can redefine terms:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "inbox": "https://evil.example/steal-data"
    }
  ],
  "type": "Person",
  "inbox": "ignored-value"
}
```

### Prevention

Don't overwrite the sender's `@context` with your own. For a JSON-LD processor that silently changes the meaning of every extension term (`publicKey`, `sensitive`, `Hashtag`, `toot:*`…); for a plain-JSON processor it does nothing at all. (AS2 itself forbids documents from overriding the normative context — [AS2 Core §2.1](https://www.w3.org/TR/activitystreams-core/#jsonld) — but a receiver can't rely on senders obeying that.)

Pick one of two sound approaches:

1. **Process as plain JSON** (what most fediverse servers do). Read properties by their compact names, ignore `@context`, and never run JSON-LD algorithms on untrusted input. Context tricks can't change what `inbox` means to you.
2. **Process as JSON-LD, safely.** Expand with a document loader that only serves a **pinned allowlist of preloaded contexts** (below) and refuses anything else, then **compact against your own trusted context**. After compaction, a term the sender redefined (like `inbox` above) no longer maps to `as:inbox`, so it simply won't appear where you look for it.

```javascript
const jsonld = require('jsonld');

const expanded = await jsonld.expand(activity, {
  documentLoader: safeDocumentLoader, // allowlist only, see below
  safe: true                          // jsonld.js "safe mode": throw on lossy/undefined terms
});
const compacted = await jsonld.compact(expanded, MY_TRUSTED_CONTEXT, {
  documentLoader: safeDocumentLoader
});
```

## Remote Context Fetching

### The Risk

```
┌──────────────┐                    ┌──────────────┐
│  Your Server │───fetch context──▶│  Evil Server │
│              │◀──malicious data──│              │
└──────────────┘                    └──────────────┘
```

Risks include:
- SSRF (Server-Side Request Forgery)
- Denial of service (slow responses)
- Context redefinition
- Information disclosure

### Prevention

```javascript
// Pin known contexts locally — never fetch @context URLs at runtime.
// Include the ones real servers send, or you'll reject valid traffic:
const CONTEXT_CACHE = {
  'https://www.w3.org/ns/activitystreams': require('./contexts/activitystreams.json'),
  'https://w3id.org/security/v1': require('./contexts/security-v1.json'),
  'https://w3id.org/security/data-integrity/v1': require('./contexts/data-integrity-v1.json'),
  'https://w3id.org/security/multikey/v1': require('./contexts/multikey-v1.json'),
  // ...plus any others you see in your logs (e.g. Lemmy's, GoToSocial's)
};

async function safeDocumentLoader(url) {
  const document = CONTEXT_CACHE[url];
  if (!document) throw new Error(`Unknown context: ${url}`);
  return { contextUrl: null, documentUrl: url, document };
}
```

## SSRF Prevention

Block requests to internal networks:

Checking the hostname's IP and *then* calling `fetch` is not enough: `fetch` resolves DNS again (so an attacker's DNS can answer differently the second time — DNS rebinding), and a public URL can redirect to an internal one. The check has to happen **on the connection itself**, for every redirect hop.

Use a maintained filtering agent rather than hand-rolling this. For example, with [`request-filtering-agent`](https://www.npmjs.com/package/request-filtering-agent) and node-fetch:

```javascript
const fetch = require('node-fetch'); // v2: timeout/size/follow options
const { useAgent } = require('request-filtering-agent');

async function safeFetch(url) {
  if (new URL(url).protocol !== 'https:') throw new Error('HTTPS only');

  // The agent checks the address DNS actually returned before connecting
  // (blocking private and reserved ranges), which also defeats DNS rebinding.
  // Passing a function gives every redirect hop its own checked agent.
  return fetch(url, {
    agent: (parsed) => useAgent(parsed.href),
    timeout: 5000,
    size: 1_000_000,       // cap response bytes
    follow: 3              // cap redirects
  });
}
```

If you write your own, block at least: `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.0.0.0/24`, `192.168.0.0/16`, `198.18.0.0/15`, `224.0.0.0/4` and above, `::`, `::1`, `::ffff:0:0/96` (IPv4-mapped), `64:ff9b::/96` (NAT64), `fc00::/7` and `fe80::/10` — and check **every** address DNS returns, on the socket you actually use. The tested [`safe-fetch` module](https://github.com/socialdocs/socialdocs.org/tree/gh-pages/examples/verify-requests) on this site does this.

## Recursive Expansion

### The Risk

Deeply nested or pathological JSON-LD can exhaust CPU or stack. This is not theoretical: Mastodon fixed a "denial of service in JSON-LD processing of pathologic activities" in 4.7.1 (and 4.6.7, 4.5.17, 4.4.24), published 2026-09-10 ([GHSA-vgm8-frgh-rh2v](https://github.com/mastodon/mastodon/security/advisories/GHSA-vgm8-frgh-rh2v)). Example:

```json
{
  "@context": { "a": { "@id": "a", "@context": { "a": { "@id": "a" } } } }
}
```

### Prevention

jsonld.js has no depth option, so bound the input yourself *before* running any JSON-LD algorithm, and never let it fetch remote contexts:

```javascript
function checkDepth(value, depth = 0) {
  if (depth > 32) throw new Error('Document nested too deeply');
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) checkDepth(v, depth + 1);
  }
}

async function processJsonLd(doc, rawBody) {
  if (rawBody.length > 1_000_000) throw new Error('Document too large');
  checkDepth(doc);
  return jsonld.expand(doc, { documentLoader: safeDocumentLoader, safe: true });
}
```

Run expansion with a time budget (e.g. in a worker you can kill) if you process JSON-LD at volume.

## Type Confusion

### The Risk

Type can be an array:

```json
{
  "type": ["Person", "Service"],
  "inbox": "..."
}
```

### Prevention

```javascript
// Always work with the full list; never assume a string
function getTypes(object) {
  const type = object?.type;
  if (Array.isArray(type)) return type.filter((t) => typeof t === 'string');
  return typeof type === 'string' ? [type] : [];
}

// e.g. treat it as an actor if any of its types is an actor type
const isActor = getTypes(doc).some((t) => ACTOR_TYPES.has(t));
```

## Property Overloading

### The Risk

A value you expect to be a string can arrive as an object or array:

```json
{
  "id": {
    "@id": "https://example.com/user",
    "malicious": "data"
  }
}
```

### Prevention

In compacted AS2 an object's own `id` is always a string. Reject anything else rather than unwrapping it — unwrapping `@id` lets a sender smuggle in a value your other checks never saw. For *references* (`actor`, `object`, `inReplyTo`…), accept a string or an embedded object with a string `id`, as Mastodon does ([`value_or_id`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb#L83-L85)).

```javascript
function getOwnId(object) {
  if (typeof object?.id !== 'string') throw new Error('Object id must be a string');
  return new URL(object.id).href; // also rejects non-URLs
}

function refId(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.id === 'string') return value.id;
  return null; // a Link, an array, or garbage: not a usable reference
}
```

## Safe Processing Pattern

For plain-JSON processing (the common case), combine the pieces above: cap the raw body size before parsing, bound nesting depth, then read compact names with strict helpers. `@context` is left untouched.

```javascript
function parseActivity(rawBody) {
  if (rawBody.length > 1_000_000) throw new Error('Document too large');
  const doc = JSON.parse(rawBody);
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    throw new Error('Invalid document');
  }
  checkDepth(doc);

  return {
    id: getOwnId(doc),
    types: getTypes(doc),
    actor: refId(doc.actor),
    object: refId(doc.object) // embedded objects: re-check their origin before trusting
  };
}
```

Then verify the request's signature and origin as described in [Verifying Requests](/docs/security/verifying-requests) and [Origin Model](/docs/security/origin-model).

## Security Checklist

| Check | Priority |
|-------|----------|
| Use fixed/cached contexts | Critical |
| Block private IP ranges | Critical |
| Limit recursion depth | High |
| Set fetch timeouts | High |
| Validate document size | High |
| Handle type arrays | Medium |
| Normalize property access | Medium |

## See Also

- **[Content Security](/docs/reference/content-security)**
- **[JSON-LD Playground](/docs/tools/json-ld-playground)**

