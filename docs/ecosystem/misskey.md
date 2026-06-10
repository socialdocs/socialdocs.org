---
sidebar_position: 6
title: Misskey
description: ActivityPub implementation details for Misskey
---

# Misskey

Misskey is a feature-rich microblogging platform originating from Japan.

## Overview

| Property | Value |
|----------|-------|
| Language | TypeScript (Node.js) |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/misskey-dev/misskey](https://github.com/misskey-dev/misskey) |
| Documentation | [misskey-hub.net](https://misskey-hub.net/) |

## Forks

- **Sharkey** — the main actively maintained fork
- **Firefish** (formerly Calckey) — discontinued
- **Foundkey** — discontinued

## ActivityPub Implementation

### Actor Type

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    { "misskey": "https://misskey-hub.net/ns#" }
  ],
  "type": "Person",
  "id": "https://misskey.io/users/abc123",
  "preferredUsername": "alice",
  "name": "Alice",
  "inbox": "https://misskey.io/users/abc123/inbox",
  "outbox": "https://misskey.io/users/abc123/outbox",
  "sharedInbox": "https://misskey.io/inbox",
  "featured": "https://misskey.io/users/abc123/collections/featured",
  "misskey:isCat": true
}
```

### Note (Post)

```json
{
  "type": "Note",
  "id": "https://misskey.io/notes/xyz789",
  "attributedTo": "https://misskey.io/users/abc123",
  "content": "<p>Hello from Misskey! :blobcat:</p>",
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://misskey.io/users/abc123/followers"],
  "tag": [
    {
      "type": "Emoji",
      "name": ":blobcat:",
      "icon": {
        "type": "Image",
        "url": "https://misskey.io/emoji/blobcat.png"
      }
    }
  ],
  "_misskey_content": "Hello from Misskey! :blobcat:",
  "_misskey_quote": null
}
```

### Quote Posts

Misskey supports quote posts:

```json
{
  "type": "Note",
  "id": "https://misskey.io/notes/quote123",
  "content": "<p>This is important!</p>",
  "_misskey_quote": "https://other.server/notes/original",
  "quoteUrl": "https://other.server/notes/original",
  "tag": [
    {
      "type": "Link",
      "href": "https://other.server/notes/original",
      "name": "RE: https://other.server/notes/original"
    }
  ]
}
```

## Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Notes, reactions |
| Update | ✅ | Note edits |
| Delete | ✅ | Removal |
| Like | ✅ | Reactions |
| EmojiReact | ✅ | Custom reactions |
| Announce | ✅ | Renotes |
| Follow | ✅ | Standard |
| Undo | ✅ | All reversible |
| Flag | ✅ | Reports |

### Emoji Reactions

Unlike Mastodon's simple Like, Misskey supports emoji reactions:

```json
{
  "type": "Like",
  "actor": "https://misskey.io/users/abc123",
  "object": "https://mastodon.social/users/bob/statuses/456",
  "_misskey_reaction": ":blobcat:",
  "tag": [
    {
      "type": "Emoji",
      "name": ":blobcat:",
      "icon": { "url": "https://misskey.io/emoji/blobcat.png" }
    }
  ]
}
```

## Custom Extensions

| Property | Description |
|----------|-------------|
| `_misskey_content` | Original MFM content |
| `_misskey_quote` | Quoted post URL |
| `_misskey_reaction` | Reaction emoji |
| `misskey:isCat` | Cat mode (nyaizes text) |
| `quoteUrl` | Alternative quote property |

## MFM (Misskey Flavored Markdown)

Misskey uses its own markup format:

```
$[x2 Large text]
$[sparkle ✨ Sparkle ✨]
$[spin Spinning text]
$[flip Flipped text]
```

This is stored in `_misskey_content` and rendered as HTML in `content`.

## API Endpoints

### Standard

```
GET /.well-known/webfinger
GET /.well-known/nodeinfo
GET /users/{id}
GET /notes/{id}
```

### Shared Inbox

Misskey uses a shared inbox for efficiency:
```
POST /inbox
```

## Compatibility

### With Mastodon

- Quote posts appear as links
- Reactions become Likes
- MFM formatting simplified
- Custom emoji may not display

### Receiving from Mastodon

- Standard Notes work well
- Polls supported
- Content warnings respected

## See Also

- **[Misskey Hub](https://misskey-hub.net/)**
- **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

