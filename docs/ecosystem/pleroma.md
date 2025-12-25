---
sidebar_position: 7
title: Pleroma
description: ActivityPub implementation details for Pleroma
---

# Pleroma

Pleroma is a lightweight, customizable microblogging server.

## Overview

| Property | Value |
|----------|-------|
| Language | Elixir |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [git.pleroma.social/pleroma/pleroma](https://git.pleroma.social/pleroma/pleroma) |
| Documentation | [docs.pleroma.social](https://docs.pleroma.social/) |

## Forks

- **Akkoma** - Most active fork, additional features
- **Rebased** - Mastodon-compatible frontend

## ActivityPub Implementation

### Actor Type

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "litepub": "http://litepub.social/ns#",
      "discoverable": "toot:discoverable"
    }
  ],
  "type": "Person",
  "id": "https://pleroma.example/users/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "inbox": "https://pleroma.example/users/alice/inbox",
  "outbox": "https://pleroma.example/users/alice/outbox",
  "endpoints": {
    "sharedInbox": "https://pleroma.example/inbox"
  },
  "discoverable": true,
  "capabilities": {
    "acceptsChatMessages": true
  }
}
```

### Note

```json
{
  "type": "Note",
  "id": "https://pleroma.example/objects/abc123",
  "attributedTo": "https://pleroma.example/users/alice",
  "content": "<p>Hello from Pleroma!</p>",
  "contentMap": {
    "en": "<p>Hello from Pleroma!</p>"
  },
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://pleroma.example/users/alice/followers"],
  "conversation": "tag:pleroma.example,2024-01-15:objectId=abc123:objectType=Conversation",
  "context": "tag:pleroma.example,2024-01-15:objectId=abc123:objectType=Conversation"
}
```

## Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Notes, polls, chat |
| Update | ✅ | Edits |
| Delete | ✅ | Removal |
| Like | ✅ | Favorites |
| EmojiReact | ✅ | Reactions (Akkoma) |
| Announce | ✅ | Repeats |
| Follow | ✅ | Standard |
| Undo | ✅ | All reversible |
| ChatMessage | ✅ | Direct messages |

### Chat Messages

Pleroma supports federated chat:

```json
{
  "type": "ChatMessage",
  "id": "https://pleroma.example/objects/chat123",
  "actor": "https://pleroma.example/users/alice",
  "to": ["https://other.example/users/bob"],
  "content": "Hey, how are you?"
}
```

## LitePub Extensions

Pleroma uses the LitePub namespace:

| Property | Description |
|----------|-------------|
| `litepub:oauthRegistrationEndpoint` | OAuth registration |
| `litepub:directConversation` | Thread visibility |
| `capabilities` | Server capabilities |

### Capabilities Object

```json
{
  "capabilities": {
    "acceptsChatMessages": true
  }
}
```

## Local-Only Posts

Posts can be restricted to local instance:

```json
{
  "type": "Note",
  "to": ["https://pleroma.example/users/alice/followers"],
  "cc": [],
  "directMessage": false
}
```

## Client-to-Server (C2S) API

Pleroma supports the C2S API:

```http
POST /users/alice/outbox
Authorization: Bearer {token}
Content-Type: application/activity+json

{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "object": {
    "type": "Note",
    "content": "Posted via C2S!"
  }
}
```

## Rich Text

### Markdown Support

```markdown
**bold** *italic* `code`
[link](https://example.com)
```

### HTML in Content

Pleroma allows more HTML than Mastodon:
- `<details>` and `<summary>`
- More formatting options
- Custom CSS classes (instance-dependent)

## API Endpoints

```
GET /.well-known/webfinger
GET /.well-known/nodeinfo
GET /users/{nickname}
GET /objects/{id}
GET /activities/{id}
POST /inbox              # Shared inbox
POST /users/{nickname}/inbox
```

## Compatibility

### Features Beyond Mastodon

- Quote posts via `quoteUrl`
- Emoji reactions
- Markdown content
- C2S API support
- Chat messages
- Local-only posts

### With Mastodon

- Full bidirectional compatibility
- Reactions appear as favorites
- Markdown converted to HTML
- Quotes shown as links

## See Also

- **[Pleroma Documentation](https://docs.pleroma.social/)**
- **[Akkoma](https://akkoma.social/)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

