---
sidebar_position: 6
title: Misskey
description: ActivityPub implementation details for Misskey
last_verified: 2026-10-15
verified_against: "Misskey 2026.10.0 source (ApRendererService.ts, ApInboxService.ts, type.ts, misc/contexts.ts), FediDB, forge APIs for forks"
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
| Latest release | [2026.10.0](https://github.com/misskey-dev/misskey/releases/tag/2026.10.0) (2026-10-01) |
| Documentation | [misskey-hub.net](https://misskey-hub.net/) |

## Forks

| Fork | Status (October 2026) |
|------|------------------------|
| [Sharkey](https://activitypub.software/TransFem-org/Sharkey) | Actively maintained; ~25K accounts on ~500 servers (FediDB) |
| [FoundKey](https://akkoma.dev/FoundKeyGang/FoundKey) | Occasional commits (latest September 2026), no tagged releases |
| Firefish (formerly Calckey) | Its source host (git.joinfirefish.org) was unreachable on 2026-10-15; ~20 servers remain on FediDB |

## ActivityPub Implementation

The JSON below follows Misskey's renderer ([`ApRendererService.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/core/activitypub/ApRendererService.ts)) and JSON-LD context ([`misc/contexts.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/core/activitypub/misc/contexts.ts)); values are illustrative.

### Actor

```json
{
  "type": "Person",
  "id": "https://misskey.example/users/9abc",
  "preferredUsername": "alice",
  "name": "Alice",
  "inbox": "https://misskey.example/users/9abc/inbox",
  "outbox": "https://misskey.example/users/9abc/outbox",
  "featured": "https://misskey.example/users/9abc/collections/featured",
  "sharedInbox": "https://misskey.example/inbox",
  "endpoints": { "sharedInbox": "https://misskey.example/inbox" },
  "isCat": true,
  "_misskey_summary": "Profile text in MFM"
}
```

`isCat` maps to `misskey:isCat` in Misskey's context, so it appears as a plain `isCat` key. Misskey also publishes `sharedInbox` at the top level as well as in `endpoints`.

### Note (Post)

```json
{
  "type": "Note",
  "id": "https://misskey.example/notes/9xyz",
  "attributedTo": "https://misskey.example/users/9abc",
  "content": "<p>Hello from Misskey! :blobcat:</p>",
  "_misskey_content": "Hello from Misskey! :blobcat:",
  "source": {
    "content": "Hello from Misskey! :blobcat:",
    "mediaType": "text/x.misskeymarkdown"
  },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://misskey.example/users/9abc/followers"],
  "tag": [
    {
      "type": "Emoji",
      "name": ":blobcat:",
      "icon": { "type": "Image", "url": "https://misskey.example/files/blobcat.png" }
    }
  ]
}
```

### Quote Posts

A quote sets both `_misskey_quote` and `quoteUrl` to the quoted note, and appends an `RE:` link inside a `quote-inline` span to `content` for software that doesn't understand either property:

```json
{
  "type": "Note",
  "content": "<p>This is important!<br><br><span class=\"quote-inline\">RE: <a href=\"https://other.example/notes/1\">https://other.example/notes/1</a></span></p>",
  "_misskey_quote": "https://other.example/notes/1",
  "quoteUrl": "https://other.example/notes/1"
}
```

On receipt Misskey reads `_misskey_quote` or `quoteUrl` ([`ApNoteService.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/core/activitypub/models/ApNoteService.ts)). It does not implement Mastodon's consent-based [FEP-044f](/docs/guides/quote-posts-and-interaction-policies) flow.

## Supported Activities

Inbound handlers in [`ApInboxService.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/core/activitypub/ApInboxService.ts):

| Activity | Notes |
|----------|-------|
| Create / Update / Delete | Notes (incl. polls as `Question`) |
| Follow / Accept / Reject | Follow requests |
| Like | Also accepts `EmojiReact` and `EmojiReaction` as reactions ([`type.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/core/activitypub/type.ts)) |
| Announce | Renotes |
| Undo | Follow, Block, Like, Announce, Accept |
| Add / Remove | Pinned notes |
| Block, Flag, Move | Blocks, reports, account migration |

### Emoji Reactions

Misskey sends reactions as a `Like` carrying the emoji in both `content` and `_misskey_reaction`, plus an `Emoji` tag for custom emoji ([`renderLike`](https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/core/activitypub/ApRendererService.ts)):

```json
{
  "type": "Like",
  "id": "https://misskey.example/likes/9r1",
  "actor": "https://misskey.example/users/9abc",
  "object": "https://mastodon.example/users/bob/statuses/456",
  "content": ":blobcat:",
  "_misskey_reaction": ":blobcat:",
  "tag": [
    {
      "type": "Emoji",
      "name": ":blobcat:",
      "icon": { "type": "Image", "url": "https://misskey.example/files/blobcat.png" }
    }
  ]
}
```

Servers that only understand `Like` (such as Mastodon) count it as a plain favourite.

## Custom Extensions

| Property | Description |
|----------|-------------|
| `_misskey_content` | Original MFM text (also in `source` as `text/x.misskeymarkdown`) |
| `_misskey_quote`, `quoteUrl` | Quoted note |
| `_misskey_reaction` | Reaction emoji on a `Like` |
| `_misskey_votes` | Vote counts on poll options |
| `_misskey_summary` | Profile text in MFM |
| `isCat` | Cat mode |

## MFM (Misskey Flavored Markdown)

Misskey uses its own markup, [MFM](https://misskey-hub.net/en/docs/for-users/features/mfm/):

```
$[x2 Large text]
$[sparkle ✨ Sparkle ✨]
$[spin Spinning text]
$[flip Flipped text]
```

The MFM source is federated in `_misskey_content` and `source`; `content` carries an HTML rendering.

## API Endpoints

```
GET /.well-known/webfinger
GET /.well-known/nodeinfo
GET /users/{id}
GET /notes/{id}
POST /inbox        # shared inbox
```

## See Also

- **[Misskey Hub](https://misskey-hub.net/)**
- **[Quote Posts and Interaction Policies](/docs/guides/quote-posts-and-interaction-policies)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
