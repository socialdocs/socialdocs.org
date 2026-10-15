---
sidebar_position: 4
title: Pixelfed
description: ActivityPub implementation details for Pixelfed
---

# Pixelfed

:::info Verified against
Pixelfed v0.14.4 (released 2026-09-30), checked 2026-10-15 against Pixelfed's [ActivityPub transformers](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub).
:::

Pixelfed is a photo sharing platform for the Fediverse, similar to Instagram. The same team builds [Loops](/docs/ecosystem/other-servers#loops), a short-video platform.

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

### Collections

Pixelfed's curated collections are a UI feature; v0.14.4 has no ActivityPub transformer for them, so they don't federate.

### Stories

Stories are ephemeral (24-hour) and are **not** sent as Notes. Pixelfed sends followers an `Add` of a `Story` that references a bearcap (capability) URL; dereferencing it returns a `Story` object with `expiresAt`, `duration`, `can_reply`, `can_react` and a single `attachment`. See [`CreateStory.php`](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub/Verb/CreateStory.php), [`StoryVerb.php`](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub/Verb/StoryVerb.php) and the [Pixelfed compatibility guide](/docs/guides/pixelfed-compatibility#stories-ephemeral-content).

```json
{
  "type": "Story",
  "id": "https://pixelfed.social/stories/alice/98765",
  "to": ["https://pixelfed.social/users/alice/followers"],
  "attributedTo": "https://pixelfed.social/users/alice",
  "published": "2026-10-15T10:00:00+00:00",
  "expiresAt": "2026-10-16T10:00:00+00:00",
  "duration": 10,
  "can_reply": true,
  "can_react": true,
  "attachment": {
    "type": "Image",
    "url": "https://pixelfed.social/storage/stories/image.jpg",
    "mediaType": "image/jpeg"
  }
}
```

## Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Photo posts (`Note` with `Document` attachments) |
| Add | ✅ | Stories (`Story`, followers only) |
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
| `expiresAt` | DateTime | Story expiration |
| `commentsEnabled` | Boolean | Comments allowed on a post |
| `capabilities` | Object | Who may announce, like and reply |
| `location` | Place | Optional post location |

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
- Collections and stories don't appear on Mastodon (stories use a Pixelfed-specific `Story` type)

## See Also

- **[Pixelfed Documentation](https://docs.pixelfed.org/)**
- **[PHP Libraries](/docs/ecosystem/php-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

