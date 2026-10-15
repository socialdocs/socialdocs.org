---
sidebar_position: 8
title: PieFed
description: ActivityPub implementation details for PieFed
last_verified: 2026-10-15
verified_against: "PieFed 1.8.5 (live JSON from piefed.social), FEDERATION.md, docs/activitypub_examples, app/activitypub/routes.py (main), Codeberg API"
---

# PieFed

PieFed is a link aggregator for the Fediverse, similar to Reddit, written in Python. It federates with Lemmy and Mbin using the same [FEP-1b12](https://codeberg.org/fediverse/fep/src/branch/main/fep/1b12/fep-1b12.md) group model.

## Overview

| Property | Value |
|----------|-------|
| Language | Python (Flask) |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [codeberg.org/rimu/pyfedi](https://codeberg.org/rimu/pyfedi) |
| Documentation | [join.piefed.social/docs](https://join.piefed.social/docs/), [FEDERATION.md](https://codeberg.org/rimu/pyfedi/src/branch/main/FEDERATION.md) |
| Latest release | [v1.8.5](https://codeberg.org/rimu/pyfedi/releases/tag/v1.8.5) (2026-10-15; releases are frequent) |

## ActivityPub Implementation

Per [FEDERATION.md](https://codeberg.org/rimu/pyfedi/src/branch/main/FEDERATION.md): communities are `Group` actors, users are `Person` actors, and posts are `Page`, `Article`, `Link`, `Note` or `Question` objects. Supported FEPs include 1b12 (groups), 7888 (`context`), c0e0 (emoji reactions), 3b86 (Activity Intents), 2677 (application actor), 5feb (search consent) and 2345 (`fediverse:creator`). PieFed's [ActivityPub examples](https://codeberg.org/rimu/pyfedi/src/branch/main/docs/activitypub_examples) show full JSON for communities, users and each post type.

### Group (Community)

Trimmed from piefed.social:

```json
{
  "type": "Group",
  "id": "https://piefed.social/c/piefed_meta",
  "preferredUsername": "piefed_meta",
  "name": "PieFed Meta",
  "attributedTo": "https://piefed.social/c/piefed_meta/moderators",
  "moderators": "https://piefed.social/c/piefed_meta/moderators",
  "featured": "https://piefed.social/c/piefed_meta/featured",
  "postingRestrictedToMods": false,
  "inbox": "https://piefed.social/c/piefed_meta/inbox",
  "followers": "https://piefed.social/c/piefed_meta/followers",
  "outbox": "https://piefed.social/c/piefed_meta/outbox"
}
```

As with Lemmy, `name` is the display title and moderators are in a collection (published both as `attributedTo` and `moderators`).

### Page (Post)

Trimmed from piefed.social; a link post carries its link as an `attachment` of type `Link`:

```json
{
  "type": "Page",
  "id": "https://piefed.social/post/123",
  "attributedTo": "https://piefed.social/u/alice",
  "audience": "https://piefed.social/c/piefed_meta",
  "name": "Reducing PieFed storage usage",
  "content": "<p>…</p>",
  "contentMap": { "en": "<p>…</p>" },
  "mediaType": "text/html",
  "attachment": [{ "type": "Link", "href": "https://join.piefed.social/2026/10/11/reducing-piefed-storage-usage/" }],
  "language": { "identifier": "en", "name": "English" },
  "commentsEnabled": true,
  "stickied": true,
  "sensitive": false,
  "context": "…",
  "interactionPolicy": { "…": "…" }
}
```

Unlike Lemmy 0.19, PieFed still publishes `commentsEnabled` and `stickied` on posts.

### Supported Activities

Inbound handling in [`app/activitypub/routes.py`](https://codeberg.org/rimu/pyfedi/src/branch/main/app/activitypub/routes.py) covers Create, Update, Delete, Undo, Follow, Accept, Reject, Announce (communities re-broadcast activities, as in Lemmy), Like, Dislike, EmojiReact, Add, Remove, Lock, Block, Flag, Move, QuoteRequest, and PieFed-specific `PollVote` and `ChooseAnswer`.

### Community Federation

```
┌─────────────────┐                  ┌─────────────────┐
│  piefed.social  │◄──── Follow ─────│   lemmy.world   │
│ /c/programming  │                  │  (subscriber)   │
└────────┬────────┘                  └────────▲────────┘
         │                                    │
         └──── Announce(Create(Page)) ────────┘
```

## API Endpoints

```
GET /u/{username}       # Person
GET /c/{community}      # Group
GET /post/{id}          # Page and other post types
GET /comment/{id}       # Note
GET /c/{community}/outbox
GET /c/{community}/followers
GET /c/{community}/moderators
GET /c/{community}/featured
```

## Voting

Upvotes are `Like` and downvotes `Dislike`, as in Lemmy; Mastodon only understands `Like`. PieFed also accepts `EmojiReact` (FEP-c0e0).

## See Also

- **[Lemmy](/docs/ecosystem/lemmy)** and the **[Lemmy Compatibility Guide](/docs/guides/lemmy-compatibility)** — the same group model
- **[PieFed Documentation](https://join.piefed.social/docs/)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
