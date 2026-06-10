---
sidebar_position: 9
title: Other Servers
description: Additional ActivityPub server implementations
---

# Other Servers

Beyond the major platforms, many other ActivityPub servers exist for various use cases.

## Microblogging

### Akkoma

Fork of Pleroma with additional features.

| Property | Value |
|----------|-------|
| Language | Elixir |
| License | AGPL-3.0 |
| Repository | [akkoma.dev/AkkomaGang/akkoma](https://akkoma.dev/AkkomaGang/akkoma) |

Features:
- Emoji reactions
- Quote posts
- Markdown/BBCode
- MRF (Message Rewrite Facility)

### Rebased (Soapbox)

Pleroma fork with Soapbox frontend and enhanced features.

| Property | Value |
|----------|-------|
| Language | Elixir |
| License | AGPL-3.0 |
| Website | [soapbox.pub](https://soapbox.pub/) |
| Repository | [gitlab.com/soapbox-pub/rebased](https://gitlab.com/soapbox-pub/rebased) |

Features:
- Modern React frontend (Soapbox FE)
- Quote posts and reactions
- Improved moderation tools
- Nostr integration via Mostr

### Ditto

Nostr-native server with ActivityPub support.

| Property | Value |
|----------|-------|
| Language | TypeScript (Deno) |
| License | AGPL-3.0 |
| Repository | [gitlab.com/soapbox-pub/ditto](https://gitlab.com/soapbox-pub/ditto) |

Features:
- Nostr as primary protocol
- ActivityPub federation bridge
- Soapbox FE compatible
- Lightweight, single binary

### Honk

Minimalist ActivityPub server.

| Property | Value |
|----------|-------|
| Language | Go |
| License | ISC |
| Repository | [humungus.tedunangst.com/r/honk](https://humungus.tedunangst.com/r/honk) |

Features:
- Single user focus
- Minimal dependencies
- SQLite database
- Simple deployment

### Takahē

Multi-domain ActivityPub server.

| Property | Value |
|----------|-------|
| Language | Python (Django) |
| License | BSD-3 |
| Repository | [github.com/jointakahe/takahe](https://github.com/jointakahe/takahe) |

Features:
- Multiple domains on one instance
- Identity-based federation
- PostgreSQL database

### Sharkey

The main actively maintained Misskey fork.

| Property | Value |
|----------|-------|
| Language | TypeScript |
| License | AGPL-3.0 |
| Website | [joinsharkey.org](https://joinsharkey.org/) |
| Repository | [activitypub.software/TransFem-org/Sharkey](https://activitypub.software/TransFem-org/Sharkey) |

Features:
- All Misskey features (reactions, quotes, MFM)
- Mastodon-compatible client API
- Regular releases

### Iceshrimp.NET

Ground-up .NET rewrite continuing the Iceshrimp project (Misskey lineage).

| Property | Value |
|----------|-------|
| Language | C# (.NET) |
| License | EUPL-1.2 |
| Repository | [iceshrimp.dev/iceshrimp/Iceshrimp.NET](https://iceshrimp.dev/iceshrimp/Iceshrimp.NET) |

Features:
- Lightweight compared to Node-based Misskey lineage
- Mastodon-compatible client API
- In beta as of 2026

## Blogging

### WriteFreely

Federated blogging platform.

| Property | Value |
|----------|-------|
| Language | Go |
| License | AGPL-3.0 |
| Repository | [github.com/writefreely/writefreely](https://github.com/writefreely/writefreely) |

Federation:
- Articles appear as Notes
- Followers can follow blogs
- Comments via replies

### Plume

Federated blogging engine.

| Property | Value |
|----------|-------|
| Language | Rust |
| License | AGPL-3.0 |
| Repository | [github.com/Plume-org/Plume](https://github.com/Plume-org/Plume) |

### Ghost

Major open-source publishing platform with built-in ActivityPub since Ghost 6.0 (August 2025) — free on all sites, both Ghost(Pro) and self-hosted.

| Property | Value |
|----------|-------|
| Language | JavaScript (AP service: TypeScript, built with Fedify) |
| License | MIT |
| Website | [ghost.org](https://ghost.org/) |
| AP service | [github.com/TryGhost/ActivityPub](https://github.com/TryGhost/ActivityPub) |

Federation:
- Long-form posts and short-form notes federate; followers can like and reply
- Reader splits long-form (Inbox) from short-form (Feed)
- ActivityPub runs as a separate multi-tenant service; self-hosted installs default to Ghost's hosted gateway, or fully self-host via the Docker `activitypub` profile

### WordPress (ActivityPub plugin)

Automattic-maintained plugin that federates WordPress sites.

| Property | Value |
|----------|-------|
| Language | PHP |
| License | MIT |
| Repository | [github.com/Automattic/wordpress-activitypub](https://github.com/Automattic/wordpress-activitypub) |

Federation:
- Author and blog-level actors
- Posts federate to followers; comments arrive as replies
- One of the largest fediverse deployments by install base

## Books & Media

### BookWyrm

Federated book tracking (Goodreads alternative).

| Property | Value |
|----------|-------|
| Language | Python (Django) |
| License | Anti-Capitalist License |
| Repository | [github.com/bookwyrm-social/bookwyrm](https://github.com/bookwyrm-social/bookwyrm) |

Federation:
- Book reviews federate as Articles
- Reading status updates
- Shelves as Collections

### Funkwhale

Federated music streaming.

| Property | Value |
|----------|-------|
| Language | Python (Django) |
| License | AGPL-3.0 |
| Repository | [dev.funkwhale.audio](https://dev.funkwhale.audio/funkwhale/funkwhale) |

Federation:
- Audio objects
- Libraries and channels
- Follows and shares

### Owncast

Federated live streaming.

| Property | Value |
|----------|-------|
| Language | Go |
| License | MIT |
| Repository | [github.com/owncast/owncast](https://github.com/owncast/owncast) |

Federation:
- Stream notifications
- Follows
- Chat integration

### Loops

Federated short-form video (TikTok-style), by the Pixelfed team. Open beta.

| Property | Value |
|----------|-------|
| Language | PHP (Laravel) + Vue |
| License | AGPL-3.0 |
| Website | [joinloops.org](https://joinloops.org/) |
| Repository | [github.com/joinloops/loops-server](https://github.com/joinloops/loops-server) |

Federation (beta since October 2025):
- Videos federate as `Note` objects for maximum compatibility
- Follows, replies, likes, and shares with Mastodon, Pixelfed, PeerTube
- WebFinger, HTTP Signatures, shared inboxes

## Link Aggregation

### Mbin

Community-maintained fork of /kbin (now abandoned) — combines link aggregation and microblogging.

| Property | Value |
|----------|-------|
| Language | PHP |
| License | AGPL-3.0 |
| Repository | [github.com/MbinOrg/mbin](https://github.com/MbinOrg/mbin) |

Features:
- Magazines (communities) federate with Lemmy and PieFed
- Microblog posts federate with Mastodon
- Active development

## Events

### Mobilizon

Federated event organizing.

| Property | Value |
|----------|-------|
| Language | Elixir |
| License | AGPL-3.0 |
| Repository | [framagit.org/framasoft/mobilizon](https://framagit.org/framasoft/mobilizon) |

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

Features:
- Multiple protocol support
- Facebook-like interface
- Events, polls, calendar

### Hubzilla

Decentralized publishing platform.

| Property | Value |
|----------|-------|
| Language | PHP |
| License | MIT |
| Repository | [framagit.org/hubzilla/core](https://framagit.org/hubzilla/core) |

Features:
- Nomadic identity
- Zot protocol + ActivityPub
- Channels and permissions

## Commercial Platforms

### Threads (Meta)

Meta's Threads federates over ActivityPub — the largest commercial platform on the protocol. Worth understanding precisely, because federation is partial.

| Property | Value |
|----------|-------|
| Operator | Meta |
| Federation | Opt-in per user (18+, public profiles) |
| Availability | Global except the European Region (as last stated, June 2025) |

**What works (as of mid-2026):**
- Opted-in users' posts federate out; fediverse users can follow, like, reply to, and boost them
- Threads users can follow fediverse accounts, with a dedicated fediverse feed and user search (since June 2025)
- Threads users see fediverse replies on their own posts and can like them

**Limitations:**
- Threads users **cannot reply to fediverse posts** from Threads (stated as a future goal)
- Posts with polls, restricted replies, or quotes of non-federated posts don't federate out
- Meta reports Threads has interacted with over 75% of fediverse servers (June 2025)

:::tip For Implementers
Treat Threads as a large but feature-limited peer: deliveries work like any Mastodon-compatible server, but don't assume bidirectional conversation threads.
:::

## Relays

### Activity Relay

Boost federation between instances.

| Property | Value |
|----------|-------|
| Language | Python |
| Repository | [git.pleroma.social/pleroma/relay](https://git.pleroma.social/pleroma/relay) |

Purpose:
- Connect smaller instances
- Share public content
- Increase discoverability

### Aode Relay

Modern relay implementation.

| Property | Value |
|----------|-------|
| Language | Rust |
| Repository | [git.asonix.dog/asonix/relay](https://git.asonix.dog/asonix/relay) |

## Comparison

| Server | Focus | Language | Resources |
|--------|-------|----------|-----------|
| Akkoma | Microblog | Elixir | Medium |
| Rebased | Microblog | Elixir | Medium |
| Ditto | Nostr+AP | TypeScript | Low |
| Honk | Minimal | Go | Very Low |
| WriteFreely | Blogging | Go | Low |
| BookWyrm | Books | Python | Medium |
| Funkwhale | Music | Python | Medium |
| Mobilizon | Events | Elixir | Medium |

## See Also

- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**

