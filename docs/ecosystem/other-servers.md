---
sidebar_position: 9
title: Other Servers
description: Additional ActivityPub server implementations
last_verified: 2026-10-15
verified_against: "Forge APIs (GitHub, GitLab, Codeberg, Framagit, akkoma.dev, iceshrimp.dev, activitypub.software, git.asonix.dog), PyPI, project READMEs/source (WriteFreely, BookWyrm, Loops, Akkoma), Owncast docs"
---

# Other Servers

Beyond the major platforms, many other ActivityPub servers exist for various use cases.

## Microblogging

### Akkoma

The most active fork of [Pleroma](/docs/ecosystem/pleroma).

| Property | Value |
|----------|-------|
| Language | Elixir |
| License | AGPL-3.0 |
| Repository | [akkoma.dev/AkkomaGang/akkoma](https://akkoma.dev/AkkomaGang/akkoma) |
| Latest release | v3.20.1 (2026-09-27) |

Inherits Pleroma's emoji reactions, quote posts, multiple post formats and MRF (Message Rewrite Facility). It has [disabled the ActivityPub C2S write endpoints](https://akkoma.dev/AkkomaGang/akkoma/src/branch/develop/CHANGELOG.md).

### Rebased (Soapbox)

Pleroma-based backend with a Mastodon-compatible API; ["the recommended backend for Soapbox"](https://gitlab.com/soapbox-pub/rebased) (a React web frontend).

| Property | Value |
|----------|-------|
| Language | Elixir |
| License | AGPL-3.0 |
| Website | [soapbox.pub](https://soapbox.pub/) |
| Repository | [gitlab.com/soapbox-pub/rebased](https://gitlab.com/soapbox-pub/rebased) (last activity September 2026) |

### Honk

Minimalist ActivityPub server.

| Property | Value |
|----------|-------|
| Language | Go |
| License | ISC |
| Repository | humungus.tedunangst.com/r/honk (unreachable as of October 2026) |

A minimal Go server with SQLite. Its project site was unreachable when this page was verified.

### Takahē

Multi-domain ActivityPub server (several domains on one instance). **Dormant:** no commits since August 2024.

| Property | Value |
|----------|-------|
| Language | Python (Django) |
| License | BSD-3-Clause |
| Repository | [github.com/jointakahe/takahe](https://github.com/jointakahe/takahe) |

### Sharkey

The main actively maintained Misskey fork.

| Property | Value |
|----------|-------|
| Language | TypeScript |
| License | AGPL-3.0 |
| Website | [joinsharkey.org](https://joinsharkey.org/) |
| Repository | [activitypub.software/TransFem-org/Sharkey](https://activitypub.software/TransFem-org/Sharkey) |

Builds on [Misskey](/docs/ecosystem/misskey) (reactions, quotes, MFM) and adds a Mastodon-compatible client API. ~25K accounts on ~500 servers (FediDB, October 2026).

### Iceshrimp.NET

Ground-up .NET rewrite continuing the Iceshrimp project (Misskey lineage).

| Property | Value |
|----------|-------|
| Language | C# (.NET) |
| License | EUPL-1.2 |
| Repository | [iceshrimp.dev/iceshrimp/Iceshrimp.NET](https://iceshrimp.dev/iceshrimp/Iceshrimp.NET) |

Beta software (latest: v2026.1.2-beta, July 2026), with a Mastodon-compatible client API tested against many apps ([README](https://iceshrimp.dev/iceshrimp/Iceshrimp.NET)).

## Blogging

### WriteFreely

Federated blogging platform.

| Property | Value |
|----------|-------|
| Language | Go |
| License | AGPL-3.0 |
| Repository | [github.com/writefreely/writefreely](https://github.com/writefreely/writefreely) |

Federation: each blog is an actor that can be followed. Multi-paragraph posts federate as `Article` and single-paragraph posts as `Note` (or always `Note` with the `notes_only` setting) — see [`posts.go`](https://github.com/writefreely/writefreely/blob/develop/posts.go). Latest release v0.17.2 (August 2026).

### Plume

Federated blogging engine.

| Property | Value |
|----------|-------|
| Language | Rust |
| License | AGPL-3.0 |
| Repository | [github.com/Plume-org/Plume](https://github.com/Plume-org/Plume) |

**Dormant:** no commits since April 2025.

### Ghost

Open-source publishing platform with ActivityPub built in since [Ghost 6.0](https://github.com/TryGhost/Ghost/releases/tag/v6.0.0) (August 2025). Interop details are on [Big Platforms](/docs/ecosystem/big-platforms#ghost).

| Property | Value |
|----------|-------|
| Language | JavaScript (AP service: TypeScript, built with Fedify) |
| License | MIT |
| Website | [ghost.org](https://ghost.org/) |
| AP service | [github.com/TryGhost/ActivityPub](https://github.com/TryGhost/ActivityPub) |

ActivityPub runs as a separate service ([TryGhost/ActivityPub](https://github.com/TryGhost/ActivityPub)).

### WordPress (ActivityPub plugin)

Automattic-maintained plugin that federates WordPress sites.

| Property | Value |
|----------|-------|
| Language | PHP |
| License | MIT |
| Repository | [github.com/Automattic/wordpress-activitypub](https://github.com/Automattic/wordpress-activitypub) |

Federation: author and blog actors; posts federate to followers and fediverse replies arrive as comments. Latest release 9.3.1 (September 2026). See [Big Platforms](/docs/ecosystem/big-platforms#wordpress-activitypub-plugin) and the plugin's [FEDERATION.md](https://github.com/Automattic/wordpress-activitypub/blob/trunk/FEDERATION.md).

## Books & Media

### BookWyrm

Federated book tracking (Goodreads alternative).

| Property | Value |
|----------|-------|
| Language | Python (Django) |
| License | Anti-Capitalist Software License |
| Repository | [github.com/bookwyrm-social/bookwyrm](https://github.com/bookwyrm-social/bookwyrm) |

Federation: BookWyrm sends its own types (`Review`, `Comment`, `Quotation`, …) to other BookWyrm servers and plain types to everyone else — a review becomes an `Article`, other statuses a `Note` ([`models/status.py`](https://github.com/bookwyrm-social/bookwyrm/blob/main/bookwyrm/models/status.py)). Latest release v0.9.3 (September 2026).

### Funkwhale

Federated music streaming.

| Property | Value |
|----------|-------|
| Language | Python (Django) |
| License | AGPL-3.0 |
| Repository | [dev.funkwhale.audio](https://dev.funkwhale.audio/funkwhale/funkwhale) |

Federation ([docs](https://docs.funkwhale.audio/developer/federation/index.html)): libraries and channels can be followed; music is modelled with custom `Artist`, `Album`, `Track`, `Library` and `Audio` objects, and listening history federates as `Listen`. Latest release 2.0.12 (October 2026).

### Owncast

Federated live streaming.

| Property | Value |
|----------|-------|
| Language | Go |
| License | MIT |
| Repository | [github.com/owncast/owncast](https://github.com/owncast/owncast) |

Federation ([docs](https://owncast.online/docs/social/)): fediverse users can follow a stream, followers are notified when it goes live and can share that, the admin can send posts to followers, and follows, likes and shares show up in the stream chat. Latest release v0.3.0 (September 2026).

### Loops

Federated short-form video (TikTok-style), by the Pixelfed team. In beta (latest v1.0.0-beta.14, August 2026).

| Property | Value |
|----------|-------|
| Language | PHP (Laravel) + Vue |
| License | AGPL-3.0 |
| Website | [joinloops.org](https://joinloops.org/) |
| Repository | [github.com/joinloops/loops-server](https://github.com/joinloops/loops-server) |

Federation (beta since October 2025):
- Videos federate as `Note` objects ([`CreateActivityBuilder.php`](https://github.com/joinloops/loops-server/blob/main/app/Federation/ActivityBuilders/CreateActivityBuilder.php))
- Follows, replies, likes, and shares with Mastodon, Pixelfed, PeerTube
- WebFinger, HTTP Signatures, shared inboxes

## Link Aggregation

### Mbin

A [fork and continuation of /kbin](https://github.com/MbinOrg/mbin) (no /kbin commits since December 2024), combining link aggregation and microblogging. Latest release v1.11.0 (October 2026).

| Property | Value |
|----------|-------|
| Language | PHP |
| License | AGPL-3.0 |
| Repository | [github.com/MbinOrg/mbin](https://github.com/MbinOrg/mbin) |

Features:
- Magazines (communities) federate with Lemmy and PieFed
- Microblog posts federate with Mastodon

## Events

### Mobilizon

Federated event organizing.

| Property | Value |
|----------|-------|
| Language | Elixir |
| License | AGPL-3.0 |
| Repository | [framagit.org/kaihuri/mobilizon](https://framagit.org/kaihuri/mobilizon) — developed by Kaihuri since 2025 (previously Framasoft) |

Federation:
- Event objects
- Group organizing
- RSVP activities

## Social Networks

### Friendica

Full-featured social network.

| Property | Value |
|----------|-------|
| Language | PHP |
| License | AGPL-3.0 |
| Repository | [github.com/friendica/friendica](https://github.com/friendica/friendica) |

Facebook-like social network that federates over ActivityPub and Diaspora. Latest release 2026.05-1.

### Hubzilla

Decentralized publishing platform.

| Property | Value |
|----------|-------|
| Language | PHP |
| License | MIT |
| Repository | [framagit.org/hubzilla/core](https://framagit.org/hubzilla/core) |

Channels with nomadic identity over its own Zot/Nomad protocol, plus ActivityPub. Latest release 11.4.1 (September 2026).

## Commercial Platforms

### Threads (Meta)

Threads federates for opted-in users, but only partially — notably, Threads users could not reply to fediverse posts as of Meta's last public update (June 2025). See [Big Platforms](/docs/ecosystem/big-platforms#threads-meta) for what is and isn't verified.

## Relays

### Activity Relay

A relay re-shares public posts between the servers subscribed to it, which helps small servers discover content.

| Property | Value |
|----------|-------|
| Language | Python |
| Repository | [git.pleroma.social/pleroma/relay](https://git.pleroma.social/pleroma/relay) |
| Latest release | [activityrelay 0.3.5](https://pypi.org/project/activityrelay/) (April 2025) |

### Aode Relay

Relay implementation in Rust (last updated July 2026).

| Property | Value |
|----------|-------|
| Language | Rust |
| Repository | [git.asonix.dog/asonix/relay](https://git.asonix.dog/asonix/relay) |

## See Also

- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Big Platforms](/docs/ecosystem/big-platforms)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**

