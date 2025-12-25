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

Always use a fixed, trusted context:

```javascript
const TRUSTED_CONTEXT = {
  "@context": "https://www.w3.org/ns/activitystreams"
};

function processActivity(activity) {
  // Strip remote context, use trusted one
  const safe = {
    ...TRUSTED_CONTEXT,
    ...activity,
    "@context": TRUSTED_CONTEXT["@context"]
  };
  return safe;
}
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
// Cache known contexts locally
const CONTEXT_CACHE = {
  'https://www.w3.org/ns/activitystreams': require('./contexts/activitystreams.json'),
  'https://w3id.org/security/v1': require('./contexts/security.json')
};

function getContext(url) {
  if (CONTEXT_CACHE[url]) {
    return CONTEXT_CACHE[url];
  }
  throw new Error(`Unknown context: ${url}`);
}
```

## SSRF Prevention

Block requests to internal networks:

```javascript
const BLOCKED_RANGES = [
  '127.0.0.0/8',      // Loopback
  '10.0.0.0/8',       // Private
  '172.16.0.0/12',    // Private
  '192.168.0.0/16',   // Private
  '169.254.0.0/16',   // Link-local
  '::1/128',          // IPv6 loopback
  'fc00::/7'          // IPv6 private
];

async function safeFetch(url) {
  const parsed = new URL(url);
  const ip = await dns.resolve(parsed.hostname);

  if (isBlockedIP(ip)) {
    throw new Error('Blocked IP range');
  }

  return fetch(url, { timeout: 5000 });
}
```

## Recursive Expansion

### The Risk

Deeply nested JSON-LD can cause stack overflow:

```json
{
  "@context": { "a": { "@id": "a", "@context": { "a": { "@id": "a" } } } }
}
```

### Prevention

```javascript
function processJsonLd(doc, depth = 0) {
  if (depth > 10) {
    throw new Error('Max depth exceeded');
  }

  // Process with depth limit
  return expand(doc, { maxDepth: 10 });
}
```

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
    return {
      ...doc,
      "@context": "https://www.w3.org/ns/activitystreams"
    };
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

