---
sidebar_position: 2
title: Inbox Endpoint
description: Reference for the ActivityPub inbox endpoint
---

# Inbox Endpoint

The inbox receives activities from remote servers.

## Endpoint

```
POST /users/{username}/inbox
POST /inbox (shared inbox)
```

## Request

```http
POST /users/alice/inbox HTTP/1.1
Host: example.com
Content-Type: application/activity+json
Date: Sun, 15 Jan 2024 10:00:00 GMT
Digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=
Signature: keyId="...",algorithm="rsa-sha256",...

{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://sender.example/users/bob",
  "object": { "type": "Note", "content": "Hello!" }
}
```

## Required Headers

| Header | Description |
|--------|-------------|
| Content-Type | `application/activity+json` |
| Date | RFC 2616 timestamp |
| Digest | SHA-256 body hash |
| Signature | HTTP Signature |

## Response Codes

| Code | Meaning |
|------|---------|
| 202 | Accepted |
| 400 | Invalid JSON |
| 401 | Invalid signature |
| 404 | Actor not found |

## Implementation

```javascript
app.post('/users/:username/inbox', async (req, res) => {
  if (!await verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  await processActivity(req.body);
  res.status(202).send('Accepted');
});
```

## See Also

- **[HTTP Signatures](/docs/reference/http-signatures-reference)**
- **[Outbox Endpoint](/docs/reference/outbox-endpoint)**
