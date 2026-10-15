---
sidebar_position: 15
title: JSON-LD Security
description: Security considerations for JSON-LD processing
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

Don't overwrite the sender's `@context` with your own. For a JSON-LD processor that silently changes the meaning of every extension term (`publicKey`, `sensitive`, `Hashtag`, `toot:*`…); for a plain-JSON processor it does nothing at all.

Pick one of two sound approaches:

1. **Process as plain JSON** (what most fediverse servers do). Read properties by their compact names, ignore `@context`, and never run JSON-LD algorithms on untrusted input. Context tricks can't change what `inbox` means to you.
2. **Process as JSON-LD, safely.** Expand with a document loader that only serves a **pinned allowlist of preloaded contexts** (below) and refuses anything else, then **compact against your own trusted context**. After compaction, a term the sender redefined (like `inbox` above) no longer maps to `as:inbox`, so it simply won't appear where you look for it.

```javascript
const jsonld = require('jsonld');

const expanded = await jsonld.expand(activity, {
  documentLoader: safeDocumentLoader, // allowlist only, see below
  safe: true                          // fail on lossy/undefined terms
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

  // The agent validates the IP actually connected to (blocking loopback,
  // private, link-local, CGNAT, 0.0.0.0/8, IPv4-mapped IPv6, ...),
  // including on every redirect.
  return fetch(url, {
    agent: useAgent(url),
    timeout: 5000,
    size: 1_000_000,       // cap response bytes
    follow: 3              // cap redirects
  });
}
```

If you write your own, block at least: `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.168.0.0/16`, `::1`, `::ffff:0:0/96` (IPv4-mapped), `fc00::/7` and `fe80::/10` — and check **every** address DNS returns, on the socket you actually use.

## Recursive Expansion

### The Risk

Deeply nested or pathological JSON-LD can exhaust CPU or stack. This is not theoretical: Mastodon 4.7.1 fixed a denial of service in exactly this area ([GHSA-vgm8-frgh-rh2v](https://github.com/mastodon/mastodon/security/advisories/GHSA-vgm8-frgh-rh2v)). Example:

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
function getType(object) {
  const type = object.type;

  if (Array.isArray(type)) {
    // Use first recognized type
    return type.find(t => KNOWN_TYPES.includes(t));
  }

  return type;
}
```

## Property Overloading

### The Risk

Properties can be objects instead of strings:

```json
{
  "id": {
    "@id": "https://example.com/user",
    "malicious": "data"
  }
}
```

### Prevention

```javascript
function getId(object) {
  const id = object.id || object['@id'];

  if (typeof id === 'object') {
    return id['@id'] || id.id;
  }

  return id;
}
```

## Safe Processing Pattern

```javascript
class SafeJsonLdProcessor {
  constructor() {
    this.contextCache = new Map();
    this.maxDepth = 10;
    this.timeout = 5000;
  }

  async process(document) {
    // 1. Validate structure
    this.validateStructure(document);

    // 2. Normalize context
    const normalized = this.normalizeContext(document);

    // 3. Extract values safely
    return {
      id: this.extractId(normalized),
      type: this.extractType(normalized),
      actor: this.extractId(normalized.actor),
      object: this.extractObject(normalized.object)
    };
  }

  validateStructure(doc) {
    if (typeof doc !== 'object' || doc === null) {
      throw new Error('Invalid document');
    }

    if (JSON.stringify(doc).length > 1000000) {
      throw new Error('Document too large');
    }
  }

  normalizeContext(doc) {
    // Plain-JSON processing: read compact property names and leave
    // @context alone. Overwriting @context would change the meaning of
    // extension terms for any JSON-LD consumer downstream.
    return doc;
  }

  extractId(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value.id || value['@id'];
  }

  extractType(doc) {
    const type = doc.type || doc['@type'];
    if (Array.isArray(type)) return type[0];
    return type;
  }
}
```

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

