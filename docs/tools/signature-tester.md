---
sidebar_position: 4
title: Signature Tester
description: Tools for testing HTTP Signatures in ActivityPub
---

# Signature Tester

HTTP Signatures authenticate ActivityPub requests. This guide covers tools and techniques for testing signature generation and verification.

## Understanding HTTP Signatures

```
┌────────────────────────────────────────────────────────────┐
│                HTTP SIGNATURE FLOW                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Sender                              Receiver              │
│    │                                    │                  │
│    │  1. Build signing string           │                  │
│    │  2. Sign with private key          │                  │
│    │  3. Add Signature header           │                  │
│    │                                    │                  │
│    │──────── POST /inbox ──────────────▶│                  │
│    │         + Signature header         │                  │
│    │                                    │                  │
│    │                    4. Parse header │                  │
│    │                    5. Fetch pubkey │                  │
│    │                    6. Verify sig   │                  │
│    │                                    │                  │
└────────────────────────────────────────────────────────────┘
```

## Signature Header Format

```http
Signature: keyId="https://example.com/users/alice#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest content-type",
           signature="base64-encoded-signature..."
```

## Testing Tools

### Generate Test Signatures

```javascript
const crypto = require('crypto');

function createSignature(privateKey, method, path, headers) {
  // Build signing string
  const signedHeaders = ['(request-target)', 'host', 'date', 'digest'];

  const signingString = signedHeaders.map(header => {
    if (header === '(request-target)') {
      return `(request-target): ${method.toLowerCase()} ${path}`;
    }
    return `${header}: ${headers[header]}`;
  }).join('\n');

  console.log('Signing string:');
  console.log(signingString);
  console.log('---');

  // Sign
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingString);
  const signature = sign.sign(privateKey, 'base64');

  // Build header
  return `keyId="${headers.keyId}",` +
         `algorithm="rsa-sha256",` +
         `headers="${signedHeaders.join(' ')}",` +
         `signature="${signature}"`;
}

// Example usage
const privateKey = `-----BEGIN PRIVATE KEY-----
...your private key...
-----END PRIVATE KEY-----`;

const headers = {
  keyId: 'https://example.com/users/alice#main-key',
  host: 'remote.example.com',
  date: new Date().toUTCString(),
  digest: 'SHA-256=...',
  'content-type': 'application/activity+json'
};

const sig = createSignature(privateKey, 'POST', '/inbox', headers);
console.log('Signature:', sig);
```

### Verify Signatures

```javascript
const crypto = require('crypto');

async function verifySignature(req) {
  // Parse Signature header
  const sigHeader = req.headers.signature;
  const params = parseSignatureHeader(sigHeader);

  // Fetch public key
  const keyResponse = await fetch(params.keyId, {
    headers: { 'Accept': 'application/activity+json' }
  });
  const actor = await keyResponse.json();
  const publicKeyPem = actor.publicKey.publicKeyPem;

  // Rebuild signing string
  const signedHeaders = params.headers.split(' ');
  const signingString = signedHeaders.map(header => {
    if (header === '(request-target)') {
      return `(request-target): ${req.method.toLowerCase()} ${req.path}`;
    }
    return `${header}: ${req.headers[header.toLowerCase()]}`;
  }).join('\n');

  // Verify
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(signingString);

  const isValid = verify.verify(
    publicKeyPem,
    params.signature,
    'base64'
  );

  return isValid;
}

function parseSignatureHeader(header) {
  const params = {};
  header.split(',').forEach(part => {
    const [key, ...valueParts] = part.trim().split('=');
    let value = valueParts.join('=');
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    params[key] = value;
  });
  return params;
}
```

## Command Line Testing

### Generate Digest

```bash
# SHA-256 digest of request body
echo -n '{"type":"Create",...}' | openssl dgst -sha256 -binary | base64
# Output: X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=

# Format for header
echo "SHA-256=$(echo -n '{"type":"Create",...}' | openssl dgst -sha256 -binary | base64)"
```

### Generate Signature with OpenSSL

```bash
# Create signing string
SIGNING_STRING="(request-target): post /inbox
host: example.com
date: $(date -u '+%a, %d %b %Y %H:%M:%S GMT')
digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE="

# Sign with private key
echo -n "$SIGNING_STRING" | openssl dgst -sha256 -sign private.pem | base64 -w0
```

### Test Request with curl

```bash
DATE=$(date -u '+%a, %d %b %Y %H:%M:%S GMT')
BODY='{"@context":"https://www.w3.org/ns/activitystreams","type":"Follow",...}'
DIGEST="SHA-256=$(echo -n "$BODY" | openssl dgst -sha256 -binary | base64)"

# Build signing string and signature (simplified)
curl -X POST "https://example.com/inbox" \
  -H "Host: example.com" \
  -H "Date: $DATE" \
  -H "Digest: $DIGEST" \
  -H "Content-Type: application/activity+json" \
  -H "Signature: keyId=\"...\",algorithm=\"rsa-sha256\",headers=\"...\",signature=\"...\"" \
  -d "$BODY"
```

## Debugging Signature Issues

### Common Errors

```
┌────────────────────────────────────────────────────────────┐
│              SIGNATURE DEBUGGING                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  "Invalid signature"                                       │
│  └── Signing string doesn't match verification string     │
│  └── Headers in wrong order                                │
│  └── Line endings differ (use \n, not \r\n)               │
│                                                            │
│  "Key not found"                                           │
│  └── keyId URL unreachable                                 │
│  └── Actor doesn't have publicKey                          │
│  └── publicKey.id doesn't match keyId                     │
│                                                            │
│  "Signature expired"                                       │
│  └── Date header too old (>30 seconds typical)            │
│  └── Clock skew between servers                            │
│                                                            │
│  "Missing headers"                                         │
│  └── Required header not in signing string                 │
│  └── Header name case mismatch                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Debug Logging

```javascript
function debugSignature(req) {
  console.log('=== Signature Debug ===');

  // Parse signature header
  const sigHeader = req.headers.signature;
  console.log('Signature header:', sigHeader);

  const params = parseSignatureHeader(sigHeader);
  console.log('Parsed params:', params);

  // Show headers being signed
  console.log('\nHeaders to sign:', params.headers);

  // Rebuild signing string
  const signedHeaders = params.headers.split(' ');
  const lines = signedHeaders.map(header => {
    if (header === '(request-target)') {
      return `(request-target): ${req.method.toLowerCase()} ${req.path}`;
    }
    const value = req.headers[header.toLowerCase()];
    return `${header}: ${value}`;
  });

  console.log('\nSigning string:');
  lines.forEach(line => console.log(`  "${line}"`));

  console.log('\nFull signing string:');
  console.log(lines.join('\n'));
}
```

### Signature Test Server

```javascript
const express = require('express');
const app = express();

app.use(express.json({ type: 'application/activity+json' }));

app.post('/inbox', async (req, res) => {
  console.log('=== Incoming Request ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const valid = await verifySignature(req);
    console.log('Signature valid:', valid);

    if (valid) {
      res.status(202).send('Accepted');
    } else {
      res.status(401).send('Invalid signature');
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send('Verification failed');
  }
});

app.listen(3000, () => {
  console.log('Test server on http://localhost:3000');
});
```

## Validation Checklist

### Signature Generation

- [ ] Date header is current (within 30 seconds)
- [ ] Digest matches request body SHA-256
- [ ] keyId points to valid public key
- [ ] All listed headers are included
- [ ] Headers are lowercase in signing string
- [ ] (request-target) uses lowercase method
- [ ] Line separator is \n (not \r\n)
- [ ] Signature is base64-encoded

### Signature Verification

- [ ] Signature header can be parsed
- [ ] keyId is fetchable
- [ ] Public key is in PEM format
- [ ] Algorithm matches (rsa-sha256)
- [ ] All signed headers are present
- [ ] Signing string is rebuilt correctly
- [ ] Date is recent (allow some clock skew)

## Test Key Generation

```bash
# Generate RSA key pair for testing
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# View public key (for actor's publicKey.publicKeyPem)
cat public.pem
```

## Online Verification Tools

While there aren't many public HTTP Signature testers, you can:

1. **Use Mastodon's debug logs** - Check server logs for signature errors
2. **Set up a test server** - Log all incoming requests
3. **Use ngrok** - Expose local server for federation testing

## Related Tools

- **[WebFinger Lookup](/docs/tools/webfinger-lookup)** - Find actor public keys
- **[Actor Inspector](/docs/tools/actor-inspector)** - Check publicKey format
- **[Debugging Tips](/docs/tools/debugging-tips)** - General debugging
