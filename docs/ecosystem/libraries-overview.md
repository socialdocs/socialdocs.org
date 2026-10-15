---
sidebar_position: 10
title: Libraries & SDKs Overview
description: ActivityPub libraries and SDKs for various programming languages
---

# Libraries & SDKs Overview

ActivityPub libraries by language, with their maintenance status.

:::info How status is measured
Versions and status were taken from package registries (npm, PyPI, crates.io, RubyGems, Packagist, the Go module proxy) and GitHub/Codeberg/GitLab on **2026-10-15**.

- **Active** — a release or commit in the last 12 months
- **Dormant** — last activity 12–36 months ago
- **Unmaintained / Archived** — no activity for over 3 years, or the repository is archived

Libraries change fast; check the repository before you depend on one.
:::

## By Language

### JavaScript / TypeScript

| Library | What it is | Latest | Status |
|---------|-----------|--------|--------|
| [Fedify](/docs/ecosystem/fedify) | Full ActivityPub framework | 2.4.4 (2026-10) | Active |
| [BotKit](https://botkit.fedify.dev/) | Bot framework on Fedify | 0.5.7 (2026-10) | Active |
| [activitystrea.ms](https://github.com/social-web-foundation/activitystrea.ms) | AS2 builder/parser | 4.0.2 (2026-10) | Active |
| [microfed](/docs/ecosystem/javascript-libraries#microfed) | Minimal primitives (by the SocialDocs maintainer) | 0.0.14 (2025-12) | Experimental |
| [activitypub-express](https://github.com/immers-space/activitypub-express) | Express middleware | 4.4.2 (2024-02) | Dormant |

[More JavaScript libraries →](/docs/ecosystem/javascript-libraries)

### Python

| Library | What it is | Latest | Status |
|---------|-----------|--------|--------|
| [federation](https://codeberg.org/socialhome/federation) | Multi-protocol (ActivityPub, Diaspora) | 0.27.0 (2026-03) | Active |
| [http-message-signatures](https://github.com/pyauth/http-message-signatures) | RFC 9421 signatures | 2.0.1 (2026-01) | Active |
| [bovine](https://codeberg.org/bovine/bovine) | Async ActivityPub toolkit | 0.5.19 (2025-09) | Dormant |
| [apkit](https://github.com/fedi-libs/apkit) | ActivityPub toolkit | 0.3.8 (2026-02) | Archived |
| [little-boxes](https://github.com/tsileo/little-boxes) | ActivityPub toolkit | 0.1.0 (2018) | Archived |

[More Python libraries →](/docs/ecosystem/python-libraries)

### Go

| Library | What it is | Latest | Status |
|---------|-----------|--------|--------|
| [go-ap](https://github.com/go-ap) | Modular packages + FedBOX server | commits 2026-10 | Active |
| [GoToSocial's activity fork](https://codeberg.org/superseriousbusiness/activity) | Maintained fork of go-fed/activity | v1.19.0 (2026-01) | Active |
| [GoToSocial's httpsig fork](https://codeberg.org/superseriousbusiness/httpsig) | Maintained fork of go-fed/httpsig | v1.5.0 (2025-10) | Active |
| [go-fed/activity](https://github.com/go-fed/activity) | Original vocabulary + middleware | v1.0.0 (2020) | Unmaintained |

[More Go libraries →](/docs/ecosystem/go-libraries)

### Rust

| Library | What it is | Latest | Status |
|---------|-----------|--------|--------|
| [activitypub_federation](https://github.com/LemmyNet/activitypub-federation-rust) | Lemmy's federation framework | 0.6.6 (2026-10) | Active |
| [http-signature-normalization](https://crates.io/crates/http-signature-normalization) | draft-cavage signatures | 0.7.1 (2026-06) | Active |
| [activitystreams](https://crates.io/crates/activitystreams) | AS2 types | 0.6.2 (2020); 0.7 alpha (2023) | Unmaintained |

[More Rust libraries →](/docs/ecosystem/rust-libraries)

### Ruby

| Library | What it is | Latest | Status |
|---------|-----------|--------|--------|
| [Fedipub](https://gitlab.com/fedipub/fedipub) (formerly Federails) | Rails engine | 0.10.0 (2026-09) | Active |
| [linzer](https://github.com/nomadium/linzer) | RFC 9421 signatures | 0.8.1 (2026-08) | Active |
| [Mastodon](https://github.com/mastodon/mastodon) | Reference server (not a library) | — | Active |

[More Ruby libraries →](/docs/ecosystem/ruby-libraries)

### PHP

| Library | What it is | Latest | Status |
|---------|-----------|--------|--------|
| [ActivityPub for WordPress](https://github.com/Automattic/wordpress-activitypub) | WordPress plugin | 9.3.1 (2026-09) | Active |
| [ActivityPhp](https://github.com/landrok/activitypub) | Types + server toolkit | 0.8.1 (2025-10) | Active |
| [Pixelfed](https://github.com/pixelfed/pixelfed) | Reference server (Laravel) | — | Active |

[More PHP libraries →](/docs/ecosystem/php-libraries)

### Elixir, C# and others

| Library | What it is | Status |
|---------|-----------|--------|
| [activity_pub](https://github.com/bonfire-networks/activity_pub) (Bonfire) | Elixir library | Active (work in progress) |
| [Letterbook](https://github.com/Letterbook/Letterbook) | C# server (reference) | Active |

[More languages →](/docs/ecosystem/other-libraries)

## Choosing a Library

### For Production

- **TypeScript**: Fedify
- **Rust**: activitypub_federation
- **Go**: go-ap, or GoToSocial's forks of the go-fed libraries
- **Ruby on Rails**: Fedipub
- **WordPress**: the ActivityPub plugin

### For Prototypes and Bots

- **Bots**: BotKit
- **Python**: federation, or bovine if you accept its slower pace

### For Learning

Read a maintained server:
- **GoToSocial** (Go)
- **Mastodon** (Ruby) — the de facto interop target
- **Lemmy** (Rust)
- **Hollo** (TypeScript, built on Fedify)

## What Libraries Provide

### Core Features

- ActivityStreams type definitions
- JSON(-LD) serialization and parsing
- WebFinger client/server

### Federation Features

- HTTP signing and **verification** (draft-cavage; increasingly also RFC 9421)
- Inbox handling and delivery queues with retries
- Fetching and caching remote objects

The security-critical parts are request verification and origin checks. A good library does these for you; if you build them yourself, read [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37) first.

## Building Without a Library

If no library fits your needs, you can implement from scratch:

1. **Start simple**: WebFinger + Actor endpoint
2. **Add inbox**: Receive and verify activities
3. **Add signing**: HTTP Signatures
4. **Add delivery**: Queue and retry sends to other servers

See the [implementation guides](/docs/guides/building-an-actor) and [Other Libraries](/docs/ecosystem/other-libraries#building-your-own).

## See Also

- **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)**
- **[Python Libraries](/docs/ecosystem/python-libraries)**
- **[Go Libraries](/docs/ecosystem/go-libraries)**
- **[Choosing Your Stack](/docs/getting-started/choosing-your-stack)**
