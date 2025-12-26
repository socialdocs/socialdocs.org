---
sidebar_position: 1
title: HTTP Signatures
description: Request authentication for ActivityPub federation
---

# HTTP Signatures

HTTP Signatures provide authentication for ActivityPub federation. When a server sends an activity to another server's inbox, it signs the request to prove authenticity.

## Specification

- **Draft**: [draft-cavage-http-signatures](https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12)
- **Note**: This is a draft spec, but widely implemented in the Fediverse

## How It Works

<svg viewBox="0 0 480 200" style={{maxWidth: '480px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="sigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="470" height="190" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>

  {/* Step 1 */}
  <circle cx="30" cy="35" r="14" fill="#6364FF"/>
  <text x="30" y="40" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">1</text>
  <text x="52" y="40" fill="currentColor" fontSize="11" fontWeight="500">Sender creates signature with private key</text>

  {/* Arrow */}
  <line x1="30" y1="52" x2="30" y2="65" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,62 30,70 33,62" fill="#6364FF"/>

  {/* Step 2 */}
  <circle cx="30" cy="85" r="14" fill="#6364FF"/>
  <text x="30" y="90" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">2</text>
  <text x="52" y="90" fill="currentColor" fontSize="11" fontWeight="500">Signature included in HTTP Signature header</text>

  {/* Arrow */}
  <line x1="30" y1="102" x2="30" y2="115" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="27,112 30,120 33,112" fill="#6364FF"/>

  {/* Step 3 */}
  <circle cx="30" cy="135" r="14" fill="#6364FF"/>
  <text x="30" y="140" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">3</text>
  <text x="52" y="140" fill="currentColor" fontSize="11" fontWeight="500">Receiver fetches sender's public key from actor</text>

  {/* Step 4-5 on right */}
  <circle cx="280" cy="85" r="14" fill="#6364FF"/>
  <text x="280" y="90" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">4</text>
  <text x="302" y="90" fill="currentColor" fontSize="11" fontWeight="500">Receiver verifies signature</text>

  <line x1="280" y1="102" x2="280" y2="115" stroke="#6364FF" strokeWidth="2" strokeDasharray="3,2"/>
  <polygon points="277,112 280,120 283,112" fill="#6364FF"/>

  <circle cx="280" cy="135" r="14" fill="#6364FF"/>
  <text x="280" y="140" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">5</text>
  <text x="302" y="140" fill="currentColor" fontSize="11" fontWeight="500">If valid, process request</text>

  {/* Connection line */}
  <line x1="120" y1="135" x2="265" y2="85" stroke="#6364FF" strokeWidth="1.5" strokeDasharray="5,3"/>

  {/* Result indicator */}
  <rect x="350" y="155" width="110" height="30" rx="6" fill="url(#sigGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="405" y="175" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="500">✓ Authenticated</text>
</svg>

## Signature Header Format

```http
Signature: keyId="https://example.com/users/alice#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest",
           signature="base64EncodedSignature..."
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `keyId` | URL of the public key |
| `algorithm` | Signing algorithm (usually `rsa-sha256`) |
| `headers` | Space-separated list of signed headers |
| `signature` | Base64-encoded signature |

## Signed Headers

### Minimum Required

```
(request-target) host date
```

### Recommended

```
(request-target) host date digest
```

### Header Meanings

| Header | Description |
|--------|-------------|
| `(request-target)` | Method + path (e.g., `post /inbox`) |
| `host` | Target hostname |
| `date` | Request timestamp |
| `digest` | SHA-256 hash of body |

## Creating a Signature

### Step 1: Build Signing String

```javascript
function buildSigningString(method, path, headers) {
  const lines = [];

  for (const header of headers) {
    if (header === '(request-target)') {
      lines.push(`(request-target): ${method.toLowerCase()} ${path}`);
    } else {
      lines.push(`${header}: ${headers[header]}`);
    }
  }

  return lines.join('\n');
}
```

Example signing string:

```
(request-target): post /users/bob/inbox
host: server-b.com
date: Sun, 15 Jan 2024 10:30:00 GMT
digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=
```

### Step 2: Create Signature

```javascript
const crypto = require('crypto');

function createSignature(signingString, privateKey) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingString);
  return signer.sign(privateKey, 'base64');
}
```

### Step 3: Build Signature Header

```javascript
function buildSignatureHeader(keyId, signedHeaders, signature) {
  return [
    `keyId="${keyId}"`,
    'algorithm="rsa-sha256"',
    `headers="${signedHeaders.join(' ')}"`,
    `signature="${signature}"`
  ].join(',');
}
```

### Complete Signing Function

```javascript
const crypto = require('crypto');

function signRequest(method, url, body, privateKey, keyId) {
  const urlObj = new URL(url);
  const date = new Date().toUTCString();

  // Create digest of body
  const digestHash = crypto.createHash('sha256').update(body).digest('base64');
  const digest = `SHA-256=${digestHash}`;

  // Headers to sign
  const signedHeaders = ['(request-target)', 'host', 'date', 'digest'];

  // Build signing string
  const signingString = [
    `(request-target): ${method.toLowerCase()} ${urlObj.pathname}`,
    `host: ${urlObj.host}`,
    `date: ${date}`,
    `digest: ${digest}`
  ].join('\n');

  // Create signature
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingString);
  const signature = signer.sign(privateKey, 'base64');

  // Build header
  const signatureHeader = [
    `keyId="${keyId}"`,
    'algorithm="rsa-sha256"',
    `headers="${signedHeaders.join(' ')}"`,
    `signature="${signature}"`
  ].join(',');

  return {
    Date: date,
    Digest: digest,
    Signature: signatureHeader
  };
}
```

## Verifying a Signature

### Step 1: Parse Signature Header

```javascript
function parseSignatureHeader(header) {
  const params = {};
  const regex = /(\w+)="([^"]+)"/g;
  let match;

  while ((match = regex.exec(header)) !== null) {
    params[match[1]] = match[2];
  }

  return params;
}
```

### Step 2: Fetch Public Key

```javascript
async function fetchPublicKey(keyId) {
  // Key ID format: https://example.com/users/alice#main-key
  const actorUrl = keyId.split('#')[0];

  const response = await fetch(actorUrl, {
    headers: { 'Accept': 'application/activity+json' }
  });

  const actor = await response.json();

  // Verify key belongs to actor
  if (actor.publicKey.id !== keyId) {
    throw new Error('Key not found');
  }

  return actor.publicKey.publicKeyPem;
}
```

### Step 3: Verify Signature

```javascript
async function verifySignature(req) {
  const sig = parseSignatureHeader(req.headers.signature);

  // Fetch public key
  const publicKey = await fetchPublicKey(sig.keyId);

  // Rebuild signing string
  const signingString = sig.headers.split(' ').map(header => {
    if (header === '(request-target)') {
      return `(request-target): ${req.method.toLowerCase()} ${req.path}`;
    }
    return `${header}: ${req.headers[header.toLowerCase()]}`;
  }).join('\n');

  // Verify
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingString);

  const valid = verifier.verify(publicKey, sig.signature, 'base64');

  if (!valid) {
    throw new Error('Invalid signature');
  }

  return true;
}
```

### Complete Verification Middleware

```javascript
async function verifyHttpSignature(req, res, next) {
  try {
    // Check required headers
    if (!req.headers.signature) {
      return res.status(401).json({ error: 'Missing Signature header' });
    }

    if (!req.headers.date) {
      return res.status(401).json({ error: 'Missing Date header' });
    }

    // Check date freshness (±5 minutes)
    const date = new Date(req.headers.date);
    const now = new Date();
    const diff = Math.abs(now - date);

    if (diff > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Request too old' });
    }

    // Verify digest if present
    if (req.headers.digest) {
      const body = JSON.stringify(req.body);
      const expectedDigest = `SHA-256=${crypto
        .createHash('sha256')
        .update(body)
        .digest('base64')}`;

      if (req.headers.digest !== expectedDigest) {
        return res.status(401).json({ error: 'Invalid Digest' });
      }
    }

    // Verify signature
    await verifySignature(req);

    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

// Use middleware
app.post('/inbox', verifyHttpSignature, handleInbox);
```

## Key Management

### Generating Keys

```javascript
const { generateKeyPairSync } = require('crypto');

function generateActorKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return { publicKey, privateKey };
}
```

### Including Key in Actor

```json
{
  "type": "Person",
  "id": "https://example.com/users/alice",
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

## Common Issues

### Clock Skew

Servers reject requests with dates too far from current time.

**Solution**: Use NTP to sync server clocks.

### Algorithm Mismatch

Some servers only support specific algorithms.

**Solution**: Use `rsa-sha256` (most compatible).

### Key Format

Keys must be in PEM format.

**Solution**: Verify key encoding is correct.

### Path vs Full URL

The `(request-target)` should use path only, not full URL.

**Correct**: `(request-target): post /inbox`
**Wrong**: `(request-target): post https://example.com/inbox`

## Debugging

### Log Signing String

```javascript
console.log('Signing string:', JSON.stringify(signingString));
console.log('Signature:', signature);
```

### Test with curl

```bash
# Generate signature manually and test
curl -X POST https://example.com/inbox \
  -H "Date: $(date -u +"%a, %d %b %Y %H:%M:%S GMT")" \
  -H "Digest: SHA-256=..." \
  -H "Signature: ..." \
  -H "Content-Type: application/activity+json" \
  -d '{"type": "Follow", ...}'
```

## Next Steps

- **[Server-to-Server](/docs/specs/activitypub/server-to-server)** - Using signatures
- **[Delivery](/docs/specs/activitypub/delivery)** - Signed delivery
- **[Security Guide](/docs/getting-started/authentication-and-security)** - Best practices
