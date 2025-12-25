---
sidebar_position: 8
title: GoToSocial
description: ActivityPub implementation details for GoToSocial
---

# GoToSocial

GoToSocial is a lightweight, privacy-focused ActivityPub server written in Go.

## Overview

| Property | Value |
|----------|-------|
| Language | Go |
| Database | SQLite/PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/superseriousbusiness/gotosocial](https://github.com/superseriousbusiness/gotosocial) |
| Documentation | [docs.gotosocial.org](https://docs.gotosocial.org/) |

## Key Features

- **Single binary deployment**
- **Low resource usage** (~256MB RAM)
- **Privacy-focused** (no public follower lists by default)
- **Clean codebase** (good for learning)

## ActivityPub Implementation

### Actor Type

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://gts.example/users/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "summary": "<p>Hello, I'm Alice!</p>",
  "inbox": "https://gts.example/users/alice/inbox",
  "outbox": "https://gts.example/users/alice/outbox",
  "followers": "https://gts.example/users/alice/followers",
  "following": "https://gts.example/users/alice/following",
  "featured": "https://gts.example/users/alice/collections/featured",
  "manuallyApprovesFollowers": false,
  "discoverable": true,
  "publicKey": {
    "id": "https://gts.example/users/alice/main-key",
    "owner": "https://gts.example/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

### Note

```json
{
  "type": "Note",
  "id": "https://gts.example/users/alice/statuses/01ABC",
  "attributedTo": "https://gts.example/users/alice",
  "content": "<p>Hello from GoToSocial!</p>",
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://gts.example/users/alice/followers"],
  "sensitive": false,
  "summary": null,
  "inReplyTo": null,
  "url": "https://gts.example/@alice/statuses/01ABC"
}
```

## Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Notes |
| Update | ✅ | Note edits |
| Delete | ✅ | With Tombstone |
| Like | ✅ | Faves |
| Announce | ✅ | Boosts |
| Follow | ✅ | Accept/Reject |
| Undo | ✅ | All reversible |
| Block | ✅ | Federation block |
| Flag | ✅ | Reports |

## Privacy Features

### Hidden Collections

By default, follower/following counts are shown but not lists:

```json
{
  "type": "OrderedCollection",
  "id": "https://gts.example/users/alice/followers",
  "totalItems": 42
  // No "first" or items - requires authentication
}
```

### Local-Only Posts

Posts can be restricted from federation:

```json
{
  "type": "Note",
  "to": [],
  "cc": ["https://gts.example/users/alice/followers"]
}
```

## API Endpoints

### Discovery

```
GET /.well-known/webfinger?resource=acct:alice@gts.example
GET /.well-known/nodeinfo
GET /.well-known/host-meta
```

### Actor & Collections

```
GET /users/{username}
GET /users/{username}/inbox
POST /users/{username}/inbox
GET /users/{username}/outbox
GET /users/{username}/followers
GET /users/{username}/following
GET /users/{username}/statuses/{id}
```

### Shared Inbox

```
POST /inbox
```

## Implementation Details

### Request Signing

GoToSocial requires HTTP Signatures:

```http
POST /inbox HTTP/1.1
Host: gts.example
Date: Sun, 15 Jan 2024 10:00:00 GMT
Digest: SHA-256=X48E9qOokqqrvdts...
Signature: keyId="https://sender.example/users/bob#main-key",...
```

### Accept Header

Requires explicit ActivityPub Accept header:

```http
GET /users/alice HTTP/1.1
Accept: application/activity+json
```

### ULID Identifiers

Uses ULIDs instead of UUIDs:
```
01HQX5N2F0KQHG1XBWQH2K3Z4T
```

## Interoperability

### With Mastodon

- Full compatibility
- Respects privacy settings
- Handles all standard activities

### Known Differences

- No quote posts
- No reactions (only Like)
- No polls (yet)
- Stricter signature validation

## Deployment

### Single Binary

```bash
./gotosocial server start
```

### Docker

```bash
docker run -d \
  -p 443:8080 \
  -v ./data:/gotosocial/storage \
  superseriousbusiness/gotosocial:latest
```

### Resource Usage

| Users | RAM | CPU |
|-------|-----|-----|
| 1 | ~100MB | Minimal |
| 10-50 | ~256MB | Low |
| 100+ | ~512MB | Low |

## See Also

- **[GoToSocial Docs](https://docs.gotosocial.org/)**
- **[Go Libraries](/docs/ecosystem/go-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

