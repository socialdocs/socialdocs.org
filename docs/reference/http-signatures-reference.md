---
sidebar_position: 7
title: HTTP Signatures
description: Reference for HTTP Signatures in ActivityPub
---

# HTTP Signatures Reference

HTTP Signatures authenticate requests between servers.

## Header Format

```http
Signature: keyId="https://example.com/users/alice#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest",
           signature="base64..."
```

## Components

| Component | Description |
|-----------|-------------|
| keyId | Public key URL |
| algorithm | `rsa-sha256` |
| headers | Signed headers list |
| signature | Base64 signature |

## Signing String

```
(request-target): post /inbox
host: remote.example.com
date: Sun, 15 Jan 2024 10:00:00 GMT
digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=
```

## Required Headers

**POST requests:**
- `(request-target)`
- `host`
- `date`
- `digest`

**GET requests:**
- `(request-target)`
- `host`
- `date`

## Signing

```javascript
const crypto = require('crypto');

function sign(privateKey, signingString) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingString);
  return sign.sign(privateKey, 'base64');
}
```

## Verification

```javascript
function verify(publicKey, signingString, signature) {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(signingString);
  return verify.verify(publicKey, signature, 'base64');
}
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Clock skew | Allow ±30 seconds |
| Header order | Match `headers` param order |
| Line endings | Use `\n` not `\r\n` |

## See Also

- **[Signature Tester](/docs/tools/signature-tester)**
- **[Authentication Guide](/docs/getting-started/authentication-and-security)**
