---
sidebar_position: 1
title: Server Software Overview
description: Fediverse server software comparison and overview
last_verified: 2026-10-15
verified_against: "FediDB per-software API, GitHub/Codeberg/GitLab/Framagit/Akkoma forge APIs, Mastodon v4.7.3, GoToSocial v0.22.2 and Misskey source, Pleroma docs (2026-10-15)"
---

# Server Software Overview

The Fediverse consists of many different server software implementations, each with different features, focuses, and communities.

Account counts below are from [FediDB](https://fedidb.org/)'s per-software API on 2026-10-15. FediDB only counts servers that publish NodeInfo and allow crawling, so treat them as lower bounds. GoToSocial in particular [asks crawlers not to collect stats by default](https://codeberg.org/superseriousbusiness/gotosocial/src/branch/main/example/config.yaml) (`instance-stats-mode`), so its figure is a large undercount.

## Major Platforms

### Microblogging

| Software | Language | Description | Accounts (FediDB) |
|----------|----------|-------------|-------------------|
| [Mastodon](/docs/ecosystem/mastodon) | Ruby | Most widely deployed; Twitter-like | ~8.5M |
| [Misskey](/docs/ecosystem/misskey) | TypeScript | Feature-rich, reactions, MFM formatting | ~1.26M |
| [Pleroma](/docs/ecosystem/pleroma) | Elixir | Lightweight; forks include Akkoma | ~54K (Akkoma ~24K) |
| [GoToSocial](/docs/ecosystem/gotosocial) | Go | Lightweight, safety-focused, small servers | Undercounted (see above) |

### Link Aggregation

| Software | Language | Description |
|----------|----------|-------------|
| [Lemmy](/docs/ecosystem/lemmy) | Rust | Reddit-like communities |
| [PieFed](/docs/ecosystem/piefed) | Python | Reddit-like communities |
| [Mbin](/docs/ecosystem/other-servers#mbin) | PHP | Link aggregation + microblogging; a [fork and continuation of /kbin](https://github.com/MbinOrg/mbin), which has had no commits since December 2024 |

### Media

| Software | Language | Description |
|----------|----------|-------------|
| [Pixelfed](/docs/ecosystem/pixelfed) | PHP | Instagram-like photos |
| [PeerTube](/docs/ecosystem/peertube) | TypeScript | YouTube-like videos |
| [Loops](/docs/ecosystem/other-servers#loops) | PHP | TikTok-like short video (beta: v1.0.0-beta.14, August 2026) |
| [Funkwhale](https://dev.funkwhale.audio/funkwhale/funkwhale) | Python | Music and audio (2.0.12, October 2026) |
| [Owncast](https://github.com/owncast/owncast) | Go | Live streaming (v0.3.0, September 2026) |

### Publishing

| Software | Language | Description |
|----------|----------|-------------|
| [Ghost](/docs/ecosystem/other-servers#ghost) | JavaScript | Publishing platform; ActivityPub built in since [6.0 (August 2025)](https://github.com/TryGhost/Ghost/releases/tag/v6.0.0) |
| [WordPress](/docs/ecosystem/other-servers#wordpress-activitypub-plugin) | PHP | Via the Automattic ActivityPub plugin |
| [WriteFreely](https://github.com/writefreely/writefreely) | Go | Minimal federated blogging (v0.17.2, August 2026) |

### Minimal / Single-User

| Software | Language | Description |
|----------|----------|-------------|
| [Fedbox](/docs/ecosystem/fedbox) | JavaScript | Experimental CLI-first server by the site owner (see the security note on its page) |
| [microfed](https://github.com/micro-fed/microfed.org) | JavaScript | Experimental modular ActivityPub library by the site owner |
| [Ktistec](https://github.com/toddsundsted/ktistec) | Crystal | Single-user, lightweight (v3.13.0, September 2026) |
| [Takahē](https://github.com/jointakahe/takahe) | Python | Multi-domain server; **dormant** — no commits since August 2024 |

### Other

| Software | Language | Description |
|----------|----------|-------------|
| [Friendica](https://github.com/friendica/friendica) | PHP | Facebook-like social network (2026.05-1) |
| [Hubzilla](https://framagit.org/hubzilla/core) | PHP | Decentralized publishing and nomadic identity (11.4.1, September 2026) |
| [BookWyrm](https://github.com/bookwyrm-social/bookwyrm) | Python | Book tracking, Goodreads-like (v0.9.3, September 2026) |
| [Mobilizon](https://framagit.org/kaihuri/mobilizon) | Elixir | Event organizing; now maintained by Kaihuri (5.2.5 release candidates, September 2026) |

## Choosing Software

### For Individual Users

- **Mastodon** — biggest network and the de facto reference for interop
- **GoToSocial** — designed for small servers; its docs suggest ~1 GB of system RAM is enough
- **Pleroma / Akkoma** — lightweight Elixir servers with Mastodon-compatible client APIs

### For Communities

- **Mastodon** — mature moderation tools
- **Lemmy**, **PieFed** or **Mbin** — Reddit-like discussion
- **Pixelfed** — photo communities
- **PeerTube** — video

### For Developers

Reading a mature implementation's federation code is one of the best ways to learn. GoToSocial, Mastodon and Lemmy all publish federation documentation alongside their source:

- [GoToSocial federation docs](https://docs.gotosocial.org/en/latest/federation/)
- [Mastodon ActivityPub spec notes](https://docs.joinmastodon.org/spec/activitypub/)
- [Lemmy federation docs](https://join-lemmy.org/docs/contributors/05-federation.html)

## Feature Comparison

| Feature | Mastodon | Pleroma | Misskey | GoToSocial |
|---------|----------|---------|---------|------------|
| ActivityPub S2S | ✅ | ✅ | ✅ | ✅ |
| ActivityPub C2S | ❌ | ⚠️ partial ¹ | ❌ | ❌ |
| Polls | ✅ | ✅ | ✅ | ✅ |
| Custom Emoji | ✅ | ✅ | ✅ | ✅ |
| Emoji Reactions | ❌ | ✅ | ✅ | ❌ |
| Quote Posts | ✅ (4.5+, FEP-044f) | ✅ ³ | ✅ (`_misskey_quote`) | ❌ (publishes self-only `canQuote`) |
| Markdown input | ❌ | ✅ | MFM ² | ✅ |
| Local-only Posts | ❌ | ✅ | ✅ | ✅ |

Sources: Mastodon v4.7.3 [`activity.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb) (no `EmojiReact` handler) and [CHANGELOG](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md); Pleroma [MastoAPI differences](https://docs.pleroma.social/backend/development/API/differences_in_mastoapi_responses/) (local visibility, emoji reactions) and [NodeInfo](https://docs.pleroma.social/backend/development/API/nodeinfo/) (`text/markdown` post format); Misskey [`ApNoteService.ts`](https://github.com/misskey-dev/misskey/blob/develop/packages/backend/src/core/activitypub/models/ApNoteService.ts); GoToSocial v0.22.2 [`internaltoas.go`](https://codeberg.org/superseriousbusiness/gotosocial/src/tag/v0.22.2/internal/typeutils/internaltoas.go) (quotes), [`status.go`](https://codeberg.org/superseriousbusiness/gotosocial/src/tag/v0.22.2/internal/api/model/status.go) (`local_only`), [posts guide](https://docs.gotosocial.org/en/latest/user_guide/posts/) (markdown) and [federation docs](https://docs.gotosocial.org/en/latest/federation/posts/) (polls).

¹ Pleroma's [client list](https://docs.pleroma.social/backend/clients/) names AndStatus as using ActivityPub C2S. The Akkoma fork has no outbox POST handler.
² Misskey uses its own MFM markup rather than Markdown.
³ Pleroma handles quote posts (see its [quote-related MRF policies](https://docs.pleroma.social/backend/configuration/cheatsheet/#mrf)); the exact property it emits was not verified here.

## Resource Requirements

Only GoToSocial publishes concrete numbers: its [getting started guide](https://docs.gotosocial.org/en/latest/getting_started/) says a small instance (1–20 active users) uses about 250–350 MB of RAM once caches are warm, and recommends about 1 GB of system RAM. Mastodon and Misskey additionally need PostgreSQL and Redis; check each project's installation docs for current requirements.

## Starting Your Own Instance

For managed hosting, see [Hosting Providers](/docs/ecosystem/hosting-providers).

Most platforms provide container images. GoToSocial's [official compose file](https://codeberg.org/superseriousbusiness/gotosocial/src/branch/main/example/docker-compose/docker-compose.yaml) uses:

```bash
# Example: GoToSocial (see its docs for the required GTS_* environment variables)
docker run -d \
  -p 443:8080 \
  -v ./data:/gotosocial/storage \
  docker.io/superseriousbusiness/gotosocial:latest
```

## See Also

- **[Mastodon](/docs/ecosystem/mastodon)** - Most widely deployed platform
- **[Big Platforms](/docs/ecosystem/big-platforms)** - Threads, Ghost, WordPress and more
- **[Libraries Overview](/docs/ecosystem/libraries-overview)** - Development libraries
- **[Hosting Providers](/docs/ecosystem/hosting-providers)** - Managed options
