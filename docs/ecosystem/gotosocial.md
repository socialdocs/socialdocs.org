---
sidebar_position: 8
title: GoToSocial
description: ActivityPub implementation details for GoToSocial
last_verified: 2026-10-15
verified_against: "GoToSocial v0.22.2 source and docs (docs/federation/*, getting_started, example/config.yaml), Codeberg API"
---

# GoToSocial

GoToSocial is a lightweight, safety-focused ActivityPub server written in Go, aimed at small servers. It is still [beta software](https://codeberg.org/superseriousbusiness/gotosocial#readme).

## Overview

| Property | Value |
|----------|-------|
| Language | Go |
| Database | SQLite or PostgreSQL |
| License | AGPL-3.0 |
| Repository | [codeberg.org/superseriousbusiness/gotosocial](https://codeberg.org/superseriousbusiness/gotosocial) (moved from GitHub) |
| Documentation | [docs.gotosocial.org](https://docs.gotosocial.org/) |
| Latest release | [v0.22.2](https://codeberg.org/superseriousbusiness/gotosocial/releases/tag/v0.22.2) (2026-10-09) |

## Key Features

- **Single binary** with an embedded `ffmpeg` for media processing
- **Small footprint** — about 250–350 MB RAM for a small instance; ~1 GB of system RAM recommended ([getting started](https://docs.gotosocial.org/en/latest/getting_started/))
- **Signed requests everywhere** — every `GET` and `POST` to its ActivityPub endpoints must carry a valid HTTP signature, the equivalent of Mastodon's secure mode ([HTTP signatures](https://docs.gotosocial.org/en/latest/federation/http_signatures/))
- **Per-user privacy controls** — users can hide their followers/following collections, and [interaction policies](/docs/guides/quote-posts-and-interaction-policies) restrict who may reply, like or boost
- **Stats privacy** — by default it asks crawlers not to collect instance stats (`instance-stats-mode`)

## ActivityPub Implementation

### Actor Types

Most accounts are `Person`; accounts marked as bots are `Service`; the instance actor is `Application` ([actors](https://docs.gotosocial.org/en/latest/federation/actors/)).

```json
{
  "type": "Person",
  "id": "https://gts.example/users/alice",
  "preferredUsername": "alice",
  "inbox": "https://gts.example/users/alice/inbox",
  "outbox": "https://gts.example/users/alice/outbox",
  "followers": "https://gts.example/users/alice/followers",
  "following": "https://gts.example/users/alice/following",
  "featured": "https://gts.example/users/alice/collections/featured",
  "manuallyApprovesFollowers": false,
  "discoverable": true,
  "publicKey": {
    "id": "https://gts.example/users/alice/main-key",
    "owner": "https://gts.example/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

### Keys

The key id is `…/main-key` (a path, not a `#fragment`). Dereferencing it returns only a **stub** of the actor, not the full actor, so verifiers must fetch the `owner` actor to confirm the key belongs to it ([HTTP signatures](https://docs.gotosocial.org/en/latest/federation/http_signatures/)). See [Verifying Requests](/docs/security/verifying-requests).

### Collections

Followers and following are `OrderedCollection`s paged via `first`. If a user hides their collections, only a stub with `totalItems` is returned:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://gts.example/users/alice/following",
  "type": "OrderedCollection",
  "totalItems": 397
}
```

### Posts

See GoToSocial's [posts federation doc](https://docs.gotosocial.org/en/latest/federation/posts/) for attachments, hashtags, emoji, mentions, `contentMap`, interaction policies, polls, deletes and threads.

## Supported Activities

| Activity | Notes |
|----------|-------|
| Create / Update / Delete | Posts (incl. polls), edits, deletes |
| Follow / Accept / Reject, Undo | Follows |
| Like / Announce, Undo | Faves and boosts |
| Block / Undo(Block) | Blocks |
| Flag | Reports |
| Move | Account migration |
| `LikeRequest`, `ReplyRequest`, … | Interaction-policy approvals |

## Known Differences

- **No quote posts** — it publishes a self-only `canQuote` and its source says quotes aren't supported yet (v0.22.2)
- **No emoji reactions** — there is no `EmojiReact` handling
- **Unsigned fetches fail** — always sign `GET`s (use an [instance actor](/docs/security/authorized-fetch))
- **Local-only posts** exist (API `local_only`) and are simply never federated

## API Endpoints

```
GET /.well-known/webfinger?resource=acct:alice@gts.example
GET /.well-known/nodeinfo
GET /.well-known/host-meta
GET /users/{username}
GET /users/{username}/main-key
GET /users/{username}/outbox
GET /users/{username}/followers
GET /users/{username}/following
GET /users/{username}/statuses/{id}
POST /users/{username}/inbox
POST /inbox            # shared inbox
```

IDs are [ULIDs](https://github.com/ulid/spec), e.g. `01HQX5N2F0KQHG1XBWQH2K3Z4T`.

## Deployment

```bash
./gotosocial --config-path ./config.yaml server start
```

Or with Docker, following the [official compose file](https://codeberg.org/superseriousbusiness/gotosocial/src/branch/main/example/docker-compose/docker-compose.yaml):

```bash
docker run -d \
  -p 443:8080 \
  -v ./data:/gotosocial/storage \
  docker.io/superseriousbusiness/gotosocial:latest
```

The tutorial on this site is tested against GoToSocial in CI — see [Your First ActivityPub Server](/docs/getting-started/your-first-activitypub-server).

## See Also

- **[GoToSocial Docs](https://docs.gotosocial.org/)**
- **[Go Libraries](/docs/ecosystem/go-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
