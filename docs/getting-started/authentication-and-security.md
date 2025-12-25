---
sidebar_position: 5
title: Authentication and Security
description: HTTP Signatures, key management, and security best practices for ActivityPub
---

# Authentication and Security

Security is critical in federated systems. This guide covers how ActivityPub handles authentication, the role of HTTP Signatures, and best practices for securing your implementation.

## Security Model Overview

ActivityPub uses a **decentralized trust model**. There's no central authority — servers verify each other using cryptographic signatures.

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Transport Security (HTTPS/TLS)                      │   │
│  │  - Encrypts data in transit                          │   │
│  │  - Server identity via TLS certificates              │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Message Authentication (HTTP Signatures)            │   │
│  │  - Proves message origin                             │   │
│  │  - Prevents tampering                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Actor Verification                                  │   │
│  │  - Fetch actor to verify keyId                       │   │
│  │  - Check actor ownership of content                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## HTTP Signatures

HTTP Signatures prove that a request came from a specific actor. They're required for all inbox deliveries.

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
    `(request-target): ${method.toLowerCase()} ${urlObj.pathname}`,
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

```javascript
async function verifySignature(req) {
  // Parse the Signature header
  const sigHeader = req.headers.signature;
  const params = parseSignatureHeader(sigHeader);

  // Fetch the public key
  const actor = await fetchActor(params.keyId.split('#')[0]);
  const publicKey = actor.publicKey.publicKeyPem;

  // Reconstruct the signing string
  const signingString = params.headers.split(' ').map(header => {
    if (header === '(request-target)') {
      return `(request-target): ${req.method.toLowerCase()} ${req.path}`;
    }
    return `${header}: ${req.headers[header]}`;
  }).join('\n');

  // Verify
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingString);
  return verifier.verify(publicKey, params.signature, 'base64');
}
```

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
- Rotate keys periodically
- Backup keys securely

### Key Rotation

When rotating keys:

1. Generate new key pair
2. Update actor's `publicKey` with new key
3. Keep old key available briefly (for in-flight requests)
4. Remove old key after 24-48 hours

## Content Verification

### Object Attribution

Verify that activities come from the actor they claim:

```javascript
function verifyAttribution(activity) {
  // The activity's actor must match the signing key's owner
  const signerActor = extractActorFromKeyId(req.headers.signature);
  const activityActor = activity.actor;

  if (signerActor !== activityActor) {
    throw new Error('Actor mismatch');
  }

  // For Create activities, the object's attributedTo must match
  if (activity.type === 'Create') {
    const objectAuthor = activity.object.attributedTo;
    if (objectAuthor !== activityActor) {
      throw new Error('Object author mismatch');
    }
  }

  return true;
}
```

### ID Verification

Object IDs must be on the same domain as the actor:

```javascript
function verifyObjectId(activity) {
  const actorDomain = new URL(activity.actor).hostname;

  if (activity.object && activity.object.id) {
    const objectDomain = new URL(activity.object.id).hostname;

    // Object ID must be on same domain as actor (for Creates)
    if (activity.type === 'Create' && objectDomain !== actorDomain) {
      throw new Error('Object ID domain mismatch');
    }
  }

  return true;
}
```

## Common Attack Vectors

### Spoofed Activities

**Attack**: Malicious server sends activity claiming to be from another actor.

**Defense**:
- Verify HTTP Signature
- Check keyId domain matches actor domain
- Fetch actor to confirm key ownership

### Replay Attacks

**Attack**: Attacker captures and re-sends a valid signed request.

**Defense**:
- Check `Date` header is within ±5 minutes
- Store activity IDs and reject duplicates

```javascript
function checkFreshness(req) {
  const date = new Date(req.headers.date);
  const now = new Date();
  const diff = Math.abs(now - date);

  // Reject if older than 5 minutes
  if (diff > 5 * 60 * 1000) {
    throw new Error('Request too old');
  }
}
```

### Activity Injection

**Attack**: Sending activities with forged object IDs.

**Defense**:
- Verify object ID domains match actor domain
- Fetch objects from original source when in doubt
- Don't trust embedded objects for deletion/updates

### Content Spoofing

**Attack**: Claiming to delete/update objects you don't own.

**Defense**:
- Only accept Delete/Update from original author
- Verify `attributedTo` matches actor

## Rate Limiting

Protect your server from abuse:

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

  // Type validation
  const validTypes = ['Create', 'Update', 'Delete', 'Follow', 'Accept', 'Reject', 'Like', 'Announce', 'Undo'];
  if (!validTypes.includes(activity.type)) {
    throw new Error('Invalid activity type');
  }

  // URL validation
  if (typeof activity.actor === 'string') {
    const url = new URL(activity.actor);
    if (url.protocol !== 'https:') {
      throw new Error('Actor must be HTTPS URL');
    }
  }

  // Size limits
  const size = JSON.stringify(activity).length;
  if (size > 1024 * 1024) { // 1MB
    throw new Error('Activity too large');
  }

  return true;
}
```

## Content Sanitization

Sanitize HTML content to prevent XSS:

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeContent(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'a', 'span', 'strong', 'em', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'class', 'rel'],
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
- [ ] Review and rotate keys periodically
- [ ] Test signature verification regularly
- [ ] Maintain block lists for bad actors

## Next Steps

- **[HTTP Signatures Reference](/docs/specs/http-signatures/overview)** - Detailed specification
- **[Building an Actor](/docs/guides/building-an-actor)** - Implement secure actors
- **[Content Moderation](/docs/guides/content-moderation)** - Handle abuse
