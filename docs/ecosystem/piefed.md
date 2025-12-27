---
sidebar_position: 8
title: PieFed
description: ActivityPub implementation details for PieFed
---

# PieFed

PieFed is a link aggregator for the Fediverse, similar to Reddit.

## Overview

| Property | Value |
|----------|-------|
| Language | Python |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [codeberg.org/rimu/pyfedi](https://codeberg.org/rimu/pyfedi) |
| Documentation | [join.piefed.social/docs](https://join.piefed.social/docs/) |

## ActivityPub Implementation

### Actor Types

PieFed uses multiple actor types:

**Person (User)**:
```json
{
  "type": "Person",
  "id": "https://piefed.social/u/alice",
  "preferredUsername": "alice",
  "inbox": "https://piefed.social/u/alice/inbox"
}
```

**Group (Community)**:
```json
{
  "type": "Group",
  "id": "https://piefed.social/c/programming",
  "name": "!programming@piefed.social",
  "preferredUsername": "programming",
  "inbox": "https://piefed.social/c/programming/inbox",
  "followers": "https://piefed.social/c/programming/followers",
  "attributedTo": ["https://piefed.social/u/moderator"],
  "publicKey": { ... }
}
```

### Content Types

**Page (Post)**:
```json
{
  "type": "Page",
  "id": "https://piefed.social/post/12345",
  "attributedTo": "https://piefed.social/u/alice",
  "to": ["https://piefed.social/c/programming"],
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
  "id": "https://piefed.social/comment/67890",
  "attributedTo": "https://piefed.social/u/bob",
  "inReplyTo": "https://piefed.social/post/12345",
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
│ piefed.social     │◀────────────────│ lemmy.world  │
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

Unlike Mastodon's Like-only system, PieFed supports both upvotes and downvotes:

**Upvote**:
```json
{
  "type": "Like",
  "actor": "https://piefed.social/u/alice",
  "object": "https://piefed.social/post/12345"
}
```

**Downvote**:
```json
{
  "type": "Dislike",
  "actor": "https://piefed.social/u/alice",
  "object": "https://piefed.social/post/12345"
}
```

## Compatibility Notes

### Interoperability

- Posts from Mastodon appear as top-level posts
- PieFed comments federate as Notes
- Groups work with platforms supporting Group actors

### Known Limitations

- Images hosted on PieFed, not embedded in AP
- Markdown converted to HTML for federation
- Some vote synchronization delays

## See Also

- **[PieFed Documentation](https://join.piefed.social/docs/)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

