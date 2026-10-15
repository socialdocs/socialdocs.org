---
sidebar_position: 5
title: Authentication and Security
description: HTTP Signatures, key management, and security best practices for ActivityPub
last_verified: 2026-10-15
verified_against: "draft-cavage-http-signatures-12, RFC 9421, FEP-521a, Mastodon v4.7.3 source (signed_request.rb, sanitize_config.rb)"
---

# Authentication and Security

Security is critical in federated systems. This guide covers how ActivityPub handles authentication, the role of HTTP Signatures, and best practices for securing your implementation.

## Security Model Overview

ActivityPub uses a **decentralized trust model**. There's no central authority — servers verify each other using cryptographic signatures.

<svg viewBox="0 0 480 300" style={{maxWidth: '480px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="470" height="290" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="470" height="32" rx="12" fill="url(#secGrad)"/>
  <text x="240" y="26" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">SECURITY LAYERS</text>

  {/* Layer 1 */}
  <rect x="25" y="50" width="430" height="60" rx="8" fill="url(#secGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="45" y="72" fill="currentColor" fontSize="13" fontWeight="600">Transport Security (HTTPS/TLS)</text>
  <text x="45" y="90" fill="currentColor" fontSize="11" opacity="0.7">Encrypts data in transit • Server identity via TLS certificates</text>

  {/* Arrow 1 */}
  <line x1="240" y1="110" x2="240" y2="130" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="237,125 240,135 243,125" fill="#6364FF"/>

  {/* Layer 2 */}
  <rect x="25" y="135" width="430" height="60" rx="8" fill="url(#secGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="45" y="157" fill="currentColor" fontSize="13" fontWeight="600">Message Authentication (HTTP Signatures)</text>
  <text x="45" y="175" fill="currentColor" fontSize="11" opacity="0.7">Proves message origin • Prevents tampering</text>

  {/* Arrow 2 */}
  <line x1="240" y1="195" x2="240" y2="215" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="237,210 240,220 243,210" fill="#6364FF"/>

  {/* Layer 3 */}
  <rect x="25" y="220" width="430" height="60" rx="8" fill="url(#secGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="45" y="242" fill="currentColor" fontSize="13" fontWeight="600">Actor Verification</text>
  <text x="45" y="260" fill="currentColor" fontSize="11" opacity="0.7">Fetch actor to verify keyId • Check actor ownership of content</text>
</svg>

## HTTP Signatures

HTTP Signatures prove that a request came from a specific actor. The ActivityPub spec doesn't mandate them, but every major server requires them on inbox deliveries.

### How Signatures Work

1. **Sign**: Create a signature using your private key
2. **Send**: Include signature in request headers
3. **Verify**: Recipient fetches your public key and verifies

### Signature Header Format

```http
Signature: keyId="https://example.com/users/alice#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest",
           signature="Base64EncodedSignature..."
```

| Parameter | Description |
|-----------|-------------|
| `keyId` | URL of the public key (usually `{actor}#main-key`) |
| `algorithm` | Signing algorithm (`rsa-sha256`) |
| `headers` | Which headers are signed |
| `signature` | Base64-encoded signature |

### Creating a Signature

```javascript
const crypto = require('crypto');

function createSignature(privateKey, method, url, headers, body) {
  const urlObj = new URL(url);

  // Create digest of body (if present)
  let digest = null;
  if (body) {
    const hash = crypto.createHash('sha256').update(body).digest('base64');
    digest = `SHA-256=${hash}`;
  }

  // Build the signing string
  const date = new Date().toUTCString();
  const signedHeaders = body
    ? '(request-target) host date digest'
    : '(request-target) host date';

  const signingString = [
    `(request-target): ${method.toLowerCase()} ${urlObj.pathname}${urlObj.search}`,
    `host: ${urlObj.host}`,
    `date: ${date}`,
    body ? `digest: ${digest}` : null
  ].filter(Boolean).join('\n');

  // Create signature
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingString);
  const signature = signer.sign(privateKey, 'base64');

  return {
    date,
    digest,
    signature: [
      `keyId="${headers.keyId}"`,
      'algorithm="rsa-sha256"',
      `headers="${signedHeaders}"`,
      `signature="${signature}"`
    ].join(',')
  };
}
```

### Verifying a Signature

:::tip Use the tested verifier
Request verification has its own page with tested code: **[Verifying incoming requests](/docs/security/verifying-requests)**. It covers draft-cavage and RFC 9421, the digest over the raw body, the required signed headers, binding the key owner to `activity.actor`, and SSRF-safe key fetching.
:::

## Key Management

### Key Generation

Generate an RSA key pair for each actor:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

Or in Node.js:

```javascript
const { generateKeyPairSync } = require('crypto');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
```

### Key Format in Actor

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg...\n-----END PUBLIC KEY-----"
  }
}
```

### Key Storage

:::warning
Private keys must be stored securely. Never expose them in logs, APIs, or client-side code.
:::

Best practices:
- Store encrypted at rest
- Use environment variables or secrets manager
- Rotate keys when they may be compromised (routine rotation isn't common practice and risks delivery failures with servers that cache keys)
- Backup keys securely

### Key Rotation

A single `publicKey` property can only hold one key, so "keeping the old key available" isn't possible with it. Instead:

1. Generate a new key pair
2. Publish it **alongside** the old one using [FEP-521a](https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md) `assertionMethod` (Multikey) entries; Mastodon 4.6+ accepts multiple keys per remote actor ([details](/docs/security/keys-and-identity))
3. Send an `Update` of your actor to your followers so they refresh their cache
4. Start signing with the new key; remove the old one once deliveries signed with it have drained

Servers that fail to verify a signature refetch the actor's key once before rejecting (Mastodon does this), which is what lets caches recover after a rotation. If you only publish a single `publicKey`, steps 2–3 collapse into replacing it and sending the `Update`; expect a short window of failed verifications.

## Content Verification

### Object Attribution

Verify that activities come from the actor they claim, and that the actor may act on the object:

:::tip Use the tested origin rules
Which actor may create, update, delete or undo which objects is covered, with tested code, on **[Origin-based security](/docs/security/origin-model)**. Compare **origins** (scheme, host and port), not hostnames, and bind the signer to `activity.actor` first. A signer worked out from the keyId string proves nothing.
:::

## Common Attack Vectors

### Spoofed Activities

**Attack**: Malicious server sends activity claiming to be from another actor.

**Defense**:
- Verify the HTTP signature over the raw body ([tested code](/docs/security/verifying-requests))
- Require the signing key's owner to **be** `activity.actor` — a matching domain is not enough
- Fetch the owner's actor document and confirm it lists that key

### Replay Attacks

**Attack**: Attacker captures and re-sends a valid signed request.

**Defense**:
- Check the `Date` header is recent (a tight window like ±5 minutes is fine for your own policy; Mastodon treats a signature without `expires` as valid for 5 minutes after creation, with a 1-hour clock-skew margin, and caps explicit expiries at 12 hours)
- Store activity IDs and reject duplicates

```javascript
function checkFreshness(req) {
  const date = Date.parse(req.headers.date);
  // An unparseable Date gives NaN, and NaN > limit is false — reject it explicitly
  if (Number.isNaN(date)) throw new Error('Invalid Date header');

  // Reject if more than 5 minutes off. Senders sign each attempt afresh,
  // so legitimate deliveries carry a current Date.
  if (Math.abs(Date.now() - date) > 5 * 60 * 1000) {
    throw new Error('Request too old');
  }
}
```

### Activity Injection

**Attack**: Sending activities with forged object IDs.

**Defense**:
- Verify embedded object ids have the same **origin** (scheme, host and port) as the actor, not just a similar domain ([origin rules](/docs/security/origin-model))
- Fetch objects from their own origin when in doubt
- Don't trust embedded objects for deletion/updates

### Content Spoofing

**Attack**: Claiming to delete/update objects you don't own.

**Defense**:
- Only accept Delete/Update from original author
- Verify `attributedTo` matches actor

## Rate Limiting

Protect your server from abuse, but size the limits for real traffic: a large server can deliver bursts of activities to your shared inbox from one IP. Answer `429` when you throttle — Mastodon retries `429` responses instead of dropping them.

```javascript
const rateLimit = require('express-rate-limit');

// Global rate limit
app.use('/inbox', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { error: 'Too many requests' }
}));

// Per-actor rate limit
const actorLimits = new Map();

function checkActorLimit(actor) {
  const now = Date.now();
  const limit = actorLimits.get(actor) || { count: 0, reset: now + 60000 };

  if (now > limit.reset) {
    limit.count = 0;
    limit.reset = now + 60000;
  }

  limit.count++;
  actorLimits.set(actor, limit);

  if (limit.count > 50) {
    throw new Error('Actor rate limited');
  }
}
```

## Input Validation

Validate all incoming data:

```javascript
function validateActivity(activity) {
  // Required fields
  if (!activity.type) throw new Error('Missing type');
  if (!activity.actor) throw new Error('Missing actor');

  // Unknown types (Block, Move, Flag, QuoteRequest, EmojiReact, …) are
  // normal: accept the request and ignore what you don't handle, rather
  // than returning an error.

  // URL validation
  if (typeof activity.actor === 'string') {
    const url = new URL(activity.actor);
    if (url.protocol !== 'https:') {
      throw new Error('Actor must be HTTPS URL');
    }
  }

  return true;
}

// Limit the size of the raw body *before* parsing it, e.g. with Express:
// app.use('/inbox', express.raw({ type: '*/*', limit: '1mb' }))
```

## Content Sanitization

Sanitize HTML content to prevent XSS:

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Keep only the class names fediverse markup needs, as Mastodon's
// sanitize_config.rb does; arbitrary classes would pick up your site's CSS.
// https://github.com/mastodon/mastodon/blob/v4.7.3/lib/sanitize_ext/sanitize_config.rb
function allowedClass(c) {
  return /^(h|p|u|dt|e)-/.test(c)            // microformats
      || /^(mention|hashtag)$/.test(c)       // semantic
      || /^(ellipsis|invisible)$/.test(c)    // link formatting
      || c === 'quote-inline';
}

DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName !== 'class') return;
  const kept = data.attrValue.split(/\s+/).filter(allowedClass);
  if (kept.length) data.attrValue = kept.join(' ');
  else data.keepAttr = false;
});

function sanitizeContent(html) {
  return DOMPurify.sanitize(html, {
    // Mastodon's element list
    ALLOWED_TAGS: ['p', 'br', 'span', 'a', 'del', 's', 'pre', 'blockquote', 'code',
                   'b', 'strong', 'u', 'i', 'em', 'ul', 'ol', 'li', 'ruby', 'rt', 'rp'],
    ALLOWED_ATTR: ['href', 'class', 'rel'],
    // http(s) only — stricter than Mastodon, which also allows e.g. gemini: and xmpp:
    ALLOWED_URI_REGEXP: /^https?:/i,
    ALLOW_DATA_ATTR: false
  });
}
```

## Security Checklist

### Before Launch

- [ ] HTTPS only (no HTTP fallback)
- [ ] HTTP Signatures implemented
- [ ] Rate limiting in place
- [ ] Input validation on all endpoints
- [ ] Content sanitization for HTML
- [ ] Private keys stored securely
- [ ] Logging without sensitive data

### Ongoing

- [ ] Monitor for unusual activity patterns
- [ ] Keep dependencies updated
- [ ] Have a key-rotation plan for compromise ([how](/docs/security/keys-and-identity))
- [ ] Test signature verification regularly
- [ ] Maintain block lists for bad actors

## Next Steps

- **[HTTP Signatures Reference](/docs/specs/http-signatures/overview)** - Detailed specification
- **[Building an Actor](/docs/guides/building-an-actor)** - Implement secure actors
- **[Content Moderation](/docs/guides/content-moderation)** - Handle abuse
