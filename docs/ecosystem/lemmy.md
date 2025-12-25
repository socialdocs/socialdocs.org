---
sidebar_position: 3
title: Lemmy
description: ActivityPub implementation details for Lemmy
---

# Lemmy

Lemmy is a link aggregator for the Fediverse, similar to Reddit.

## Overview

| Property | Value |
|----------|-------|
| Language | Rust (backend), TypeScript (frontend) |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/LemmyNet/lemmy](https://github.com/LemmyNet/lemmy) |
| Documentation | [join-lemmy.org/docs](https://join-lemmy.org/docs/) |

## ActivityPub Implementation

### Actor Types

Lemmy uses multiple actor types:

**Person (User)**:
```json
{
  "type": "Person",
  "id": "https://lemmy.ml/u/alice",
  "preferredUsername": "alice",
  "inbox": "https://lemmy.ml/u/alice/inbox"
}
```

**Group (Community)**:
```json
{
  "type": "Group",
  "id": "https://lemmy.ml/c/programming",
  "name": "!programming@lemmy.ml",
  "preferredUsername": "programming",
  "inbox": "https://lemmy.ml/c/programming/inbox",
  "followers": "https://lemmy.ml/c/programming/followers",
  "attributedTo": ["https://lemmy.ml/u/moderator"],
  "publicKey": { ... }
}
```

### Content Types

**Page (Post)**:
```json
{
  "type": "Page",
  "id": "https://lemmy.ml/post/12345",
  "attributedTo": "https://lemmy.ml/u/alice",
  "to": ["https://lemmy.ml/c/programming"],
  "name": "Post Title",
  "content": "<p>Post body</p>",
  "url": "https://external-link.com",
  "commentsEnabled": true,
  "sensitive": false
}
```

**Note (Comment)**:
```json
{
  "type": "Note",
  "id": "https://lemmy.ml/comment/67890",
  "attributedTo": "https://lemmy.ml/u/bob",
  "inReplyTo": "https://lemmy.ml/post/12345",
  "content": "<p>Great post!</p>"
}
```

### Supported Activities

| Activity | Context | Notes |
|----------|---------|-------|
| Create | Page, Note | Posts and comments |
| Update | Page, Note | Editing |
| Delete | Page, Note | Removal |
| Like | Page, Note | Upvotes |
| Dislike | Page, Note | Downvotes |
| Undo | Like, Dislike | Remove vote |
| Follow | Group | Join community |
| Announce | Page | Cross-posting |
| Block | Person | User blocks |
| Add/Remove | Moderator | Mod actions |

### Community Federation

Communities federate when users from other instances:
1. Search for the community
2. Subscribe (Follow the Group)
3. Posts sync to subscribers

```
┌──────────────┐     Follow      ┌──────────────┐
│ lemmy.ml     │◀────────────────│ lemmy.world  │
│ /c/programming│                │ (subscriber) │
└──────────────┘                 └──────────────┘
       │                                ▲
       │ Announce(Create(Page))         │
       └────────────────────────────────┘
```

## Custom Extensions

| Property | Type | Description |
|----------|------|-------------|
| `commentsEnabled` | Boolean | Allow comments |
| `stickied` | Boolean | Pinned post |
| `language` | String | Content language |
| `sensitive` | Boolean | NSFW content |

## API Endpoints

### Actor Endpoints

```
GET /u/{username}          # Person
GET /c/{community}         # Group
GET /post/{id}            # Page
GET /comment/{id}         # Note
```

### Collections

```
GET /c/{community}/followers
GET /c/{community}/outbox
```

## Voting System

Unlike Mastodon's Like-only system, Lemmy supports both upvotes and downvotes:

**Upvote**:
```json
{
  "type": "Like",
  "actor": "https://lemmy.ml/u/alice",
  "object": "https://lemmy.ml/post/12345"
}
```

**Downvote**:
```json
{
  "type": "Dislike",
  "actor": "https://lemmy.ml/u/alice",
  "object": "https://lemmy.ml/post/12345"
}
```

## Compatibility Notes

### Interoperability

- Posts from Mastodon appear as top-level posts
- Lemmy comments federate as Notes
- Groups work with platforms supporting Group actors

### Known Limitations

- Images hosted on Lemmy, not embedded in AP
- Markdown converted to HTML for federation
- Some vote synchronization delays

## See Also

- **[Lemmy Documentation](https://join-lemmy.org/docs/)**
- **[Rust Libraries](/docs/ecosystem/rust-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

