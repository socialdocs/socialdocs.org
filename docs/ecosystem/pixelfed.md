---
sidebar_position: 4
title: Pixelfed
description: ActivityPub implementation details for Pixelfed
---

# Pixelfed

Pixelfed is a photo sharing platform for the Fediverse, similar to Instagram.

## Overview

| Property | Value |
|----------|-------|
| Language | PHP (Laravel) |
| Database | MySQL/PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/pixelfed/pixelfed](https://github.com/pixelfed/pixelfed) |
| Documentation | [docs.pixelfed.org](https://docs.pixelfed.org/) |

## ActivityPub Implementation

### Actor Type

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://pixelfed.social/users/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "summary": "<p>Photography enthusiast</p>",
  "inbox": "https://pixelfed.social/users/alice/inbox",
  "outbox": "https://pixelfed.social/users/alice/outbox",
  "followers": "https://pixelfed.social/users/alice/followers",
  "following": "https://pixelfed.social/users/alice/following",
  "icon": {
    "type": "Image",
    "url": "https://pixelfed.social/storage/avatars/alice.jpg"
  }
}
```

### Photo Posts

Pixelfed posts are Notes with Image attachments:

```json
{
  "type": "Note",
  "id": "https://pixelfed.social/p/alice/12345",
  "attributedTo": "https://pixelfed.social/users/alice",
  "content": "<p>Beautiful sunset! #photography</p>",
  "published": "2024-01-15T18:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://pixelfed.social/users/alice/followers"],
  "sensitive": false,
  "attachment": [
    {
      "type": "Image",
      "mediaType": "image/jpeg",
      "url": "https://pixelfed.social/storage/m/photo.jpg",
      "name": "A colorful sunset over the ocean",
      "width": 1920,
      "height": 1080,
      "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
    }
  ],
  "tag": [
    {
      "type": "Hashtag",
      "href": "https://pixelfed.social/discover/tags/photography",
      "name": "#photography"
    }
  ]
}
```

### Collections (Albums)

```json
{
  "type": "Collection",
  "id": "https://pixelfed.social/c/alice/vacation",
  "name": "Summer Vacation",
  "attributedTo": "https://pixelfed.social/users/alice",
  "totalItems": 15,
  "items": [
    "https://pixelfed.social/p/alice/12345",
    "https://pixelfed.social/p/alice/12346"
  ]
}
```

### Stories

Pixelfed Stories are ephemeral content (24-hour expiration):

```json
{
  "type": "Note",
  "id": "https://pixelfed.social/stories/alice/98765",
  "attributedTo": "https://pixelfed.social/users/alice",
  "published": "2024-01-15T10:00:00Z",
  "expires": "2024-01-16T10:00:00Z",
  "attachment": [
    {
      "type": "Image",
      "url": "https://pixelfed.social/storage/stories/image.jpg"
    }
  ]
}
```

## Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Photo posts |
| Delete | ✅ | Post removal |
| Like | ✅ | Favorites |
| Announce | ✅ | Shares |
| Follow | ✅ | Standard |
| Undo | ✅ | All reversible |

## Custom Extensions

| Property | Type | Description |
|----------|------|-------------|
| `blurhash` | String | Image placeholder |
| `width` | Integer | Image width |
| `height` | Integer | Image height |
| `expires` | DateTime | Story expiration |

## API Endpoints

### Standard Endpoints

```
GET /.well-known/webfinger
GET /.well-known/nodeinfo
GET /users/{username}
GET /p/{username}/{id}
```

### Collections

```
GET /users/{username}/outbox
GET /users/{username}/followers
GET /users/{username}/following
```

## Compatibility

### Image Handling

- Uses `blurhash` for placeholders
- Includes dimensions in attachment
- Alt text via `name` property

### Federation Behavior

- Photo posts appear as Notes in Mastodon
- Multiple images shown as attachments
- Albums may not fully federate

## See Also

- **[Pixelfed Documentation](https://docs.pixelfed.org/)**
- **[PHP Libraries](/docs/ecosystem/php-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

