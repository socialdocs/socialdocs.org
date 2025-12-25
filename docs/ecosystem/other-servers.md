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
| Honk | Minimal | Go | Very Low |
| WriteFreely | Blogging | Go | Low |
| BookWyrm | Books | Python | Medium |
| Funkwhale | Music | Python | Medium |
| Mobilizon | Events | Elixir | Medium |

## See Also

- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**

