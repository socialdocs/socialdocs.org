---
sidebar_position: 2
title: Mastodon
description: ActivityPub implementation details for Mastodon
---

# Mastodon

Mastodon is the most widely deployed ActivityPub server, serving as the de facto reference implementation.

## Overview

| Property | Value |
|----------|-------|
| Language | Ruby on Rails |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/mastodon/mastodon](https://github.com/mastodon/mastodon) |
| Documentation | [docs.joinmastodon.org](https://docs.joinmastodon.org/) |

## ActivityPub Implementation

### Actor Type

Mastodon uses `Person` for all user accounts:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://mastodon.social/users/username",
  "preferredUsername": "username",
  "inbox": "https://mastodon.social/users/username/inbox",
  "outbox": "https://mastodon.social/users/username/outbox",
  "followers": "https://mastodon.social/users/username/followers",
  "following": "https://mastodon.social/users/username/following"
}
```

### Custom Extensions

Mastodon adds several non-standard properties:

| Property | Type | Description |
|----------|------|-------------|
| `manuallyApprovesFollowers` | Boolean | Locked account |
| `discoverable` | Boolean | Public directory |
| `indexable` | Boolean | Search indexing |
| `memorial` | Boolean | Memorial account |
| `featured` | URL | Pinned posts |
| `featuredTags` | URL | Pinned hashtags |

### Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Notes, polls |
| Delete | ✅ | With Tombstone |
| Update | ✅ | Edits |
| Follow | ✅ | Accept/Reject |
| Like | ✅ | Favorites |
| Announce | ✅ | Boosts |
| Undo | ✅ | All reversible |
| Block | ✅ | Server-side |
| Flag | ✅ | Reports |
| Move | ✅ | Account migration |

### Object Types

**Note (Toot/Post)**:
```json
{
  "type": "Note",
  "id": "https://mastodon.social/users/alice/statuses/123",
  "attributedTo": "https://mastodon.social/users/alice",
  "content": "<p>Hello world!</p>",
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://mastodon.social/users/alice/followers"],
  "attachment": [],
  "tag": [],
  "sensitive": false,
  "inReplyTo": null
}
```

**Poll (Question)**:
```json
{
  "type": "Question",
  "content": "What's your favorite color?",
  "endTime": "2024-01-16T10:00:00Z",
  "oneOf": [
    { "type": "Note", "name": "Red", "replies": { "totalItems": 10 } },
    { "type": "Note", "name": "Blue", "replies": { "totalItems": 15 } }
  ]
}
```

## API Endpoints

### WebFinger

```
GET /.well-known/webfinger?resource=acct:user@domain
```

### NodeInfo

```
GET /.well-known/nodeinfo
GET /nodeinfo/2.0
```

### Actor

```
GET /users/{username}
Accept: application/activity+json
```

### Collections

```
GET /users/{username}/outbox
GET /users/{username}/followers
GET /users/{username}/following
```

## Compatibility Notes

### Quirks

1. **Signature Algorithm**: Uses `rsa-sha256` (not RS256)
2. **Date Header**: Strict validation, ±30 seconds
3. **Digest Header**: Required for POST requests
4. **Content-Type**: Prefers `application/activity+json`

### Known Issues

- Quote posts supported since v4.5 — quoting requires author approval, federated via `QuoteAuthorization`
- Reactions not supported (only Like)
- Local-only posts not federated

## Testing Against Mastodon

### Verify Actor Fetching

```bash
curl -H "Accept: application/activity+json" \
  https://mastodon.social/users/Gargron
```

### Test WebFinger

```bash
curl "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social"
```

## See Also

- **[Mastodon API Docs](https://docs.joinmastodon.org/)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Ruby Libraries](/docs/ecosystem/ruby-libraries)**

