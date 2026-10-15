---
sidebar_position: 3
title: Lemmy
description: ActivityPub implementation details for Lemmy
last_verified: 2026-10-15
verified_against: "Lemmy 0.19.20 source and federation fixtures (crates/apub), 1.0.0-beta.2 release, join-lemmy.org"
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
| Latest stable | [0.19.20](https://github.com/LemmyNet/lemmy/releases/tag/0.19.20) (2026-07-21); 1.0.0-beta.2 (2026-09-11) |
| Documentation | [join-lemmy.org/docs](https://join-lemmy.org/docs/) |

## ActivityPub Implementation

The examples below are trimmed from Lemmy's own federation test fixtures ([`crates/apub/assets/lemmy`](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy), 0.19.20). For full interop details see the [Lemmy compatibility guide](/docs/guides/lemmy-compatibility).

### Actor Types

**Person (User)** at `/u/{name}`, and **Group (Community)** at `/c/{name}` ([group.json](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/objects/group.json)):

```json
{
  "id": "https://enterprise.lemmy.ml/c/tenforward",
  "type": "Group",
  "preferredUsername": "tenforward",
  "name": "Ten Forward",
  "inbox": "https://enterprise.lemmy.ml/c/tenforward/inbox",
  "followers": "https://enterprise.lemmy.ml/c/tenforward/followers",
  "attributedTo": "https://enterprise.lemmy.ml/c/tenforward/moderators",
  "featured": "https://enterprise.lemmy.ml/c/tenforward//featured",
  "postingRestrictedToMods": false,
  "endpoints": { "sharedInbox": "https://enterprise.lemmy.ml/inbox" }
}
```

`name` is the display title and `preferredUsername` the slug. Moderators are listed in the collection `attributedTo` points to; pinned posts are in `featured`.

### Content Types

**Page (Post)** ([page.json](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/objects/page.json)) — the link of a link post is an `attachment` of type `Link`, not `url`:

```json
{
  "id": "https://enterprise.lemmy.ml/post/55143",
  "type": "Page",
  "attributedTo": "https://enterprise.lemmy.ml/u/picard",
  "to": [
    "https://enterprise.lemmy.ml/c/tenforward",
    "https://www.w3.org/ns/activitystreams#Public"
  ],
  "audience": "https://enterprise.lemmy.ml/c/tenforward",
  "name": "Post title",
  "content": "<p>This is a post in the /c/tenforward community</p>\n",
  "mediaType": "text/html",
  "source": { "content": "This is a post in the /c/tenforward community", "mediaType": "text/markdown" },
  "attachment": [{ "type": "Link", "href": "https://enterprise.lemmy.ml/pictrs/image/eOtYb9iEiB.png" }],
  "sensitive": false,
  "language": { "identifier": "fr", "name": "Français" }
}
```

**Note (Comment)** — a `Note` whose `inReplyTo` is the post or the parent comment.

### Supported Activities

| Activity | Used for |
|----------|----------|
| Create / Update | Posts (`Page`) and comments (`Note`) |
| Delete / Undo(Delete) | Deleting and restoring content |
| Like / Dislike, Undo | Up- and downvotes (votes carry `audience`) |
| Follow / Accept, Undo(Follow) | Subscribing to a community |
| Announce | The community re-broadcasts every activity in it to its followers |
| Lock / Undo(Lock) | Locking a post |
| Block / Undo(Block) | Moderator bans (with `target`) |
| Add / Remove | Moderators and featured (pinned) posts |
| Flag | Reports |

Sources: [`activities/`](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities) fixtures, e.g. [announce_create_page.json](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/activities/community/announce_create_page.json), [lock_page.json](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/activities/community/lock_page.json), [like_note.json](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/activities/voting/like_note.json).

### Community Federation

A remote user follows the `Group`; the community then wraps every activity posted to it in an `Announce` and sends it to its followers:

```
┌──────────────────┐      Follow       ┌──────────────┐
│ lemmy.ml         │◀──────────────────│ lemmy.world  │
│ /c/programming   │                   │ (subscriber) │
└──────────────────┘                   └──────────────┘
        │                                     ▲
        │  Announce(Create(Page))             │
        └─────────────────────────────────────┘
```

## Custom Extensions

| Property | On | Description |
|----------|----|-------------|
| `audience` | Page, Note, activities | The community the content belongs to |
| `postingRestrictedToMods` | Group | Only moderators can post |
| `featured` | Group | Pinned posts collection |
| `language` | Page, Note, Group | `{identifier, name}` objects |
| `source` | Page, Note, Group | Original Markdown (`text/markdown`) |

Lemmy 0.19.20's `Page` type does not read `commentsEnabled` or `stickied` (older fixtures still show them); locking uses `Lock` and pinning uses the `featured` collection.

## Release Status

As of October 2026 the latest stable release is the 0.19.x series; **Lemmy 1.0** is in beta (1.0.0-beta.2, September 2026) with no release date announced. 1.0 introduces [API v4](https://join-lemmy.org/news/2025-02-03_-_Breaking_Changes_in_Lemmy_1.0) (with a v3 compatibility layer for existing clients) and renames the `actor_id` database column to `ap_id`. No major federation behaviour changes have been announced; check the [releases page](https://github.com/LemmyNet/lemmy/releases) before relying on 1.0 behaviour.

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
GET /c/{community}/moderators
GET /c/{community}/featured
```

## Voting System

Lemmy supports both upvotes (`Like`) and downvotes (`Dislike`), each with the community as `audience` ([like_note.json](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/activities/voting/like_note.json)):

```json
{
  "type": "Like",
  "id": "http://ds9.lemmy.ml/activities/like/fd61d070-7382-46a9-b2b7-6bb253732877",
  "actor": "http://ds9.lemmy.ml/u/lemmy_alpha",
  "object": "http://ds9.lemmy.ml/comment/1",
  "audience": "https://enterprise.lemmy.ml/c/tenforward"
}
```

Mastodon only understands `Like`, so downvotes are invisible there.

## See Also

- **[Lemmy Compatibility Guide](/docs/guides/lemmy-compatibility)** - Interop details and code
- **[Lemmy Documentation](https://join-lemmy.org/docs/)**
- **[Rust Libraries](/docs/ecosystem/rust-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

