---
sidebar_position: 1
title: Server Software Overview
description: Fediverse server software comparison and overview
---

# Server Software Overview

The Fediverse consists of many different server software implementations, each with different features, focuses, and communities.

## Major Platforms

### Microblogging

| Software | Language | Description | Active Users |
|----------|----------|-------------|--------------|
| [Mastodon](/docs/ecosystem/mastodon) | Ruby | Most popular, Twitter-like | ~10M+ |
| [Pleroma](/docs/ecosystem/pleroma) | Elixir | Lightweight alternative | ~100K+ |
| [Misskey](/docs/ecosystem/misskey) | TypeScript | Feature-rich, Japanese | ~500K+ |
| [GoToSocial](/docs/ecosystem/gotosocial) | Go | Privacy-focused, lightweight | ~10K+ |

### Link Aggregation

| Software | Language | Description |
|----------|----------|-------------|
| [Lemmy](/docs/ecosystem/lemmy) | Rust | Reddit-like communities |
| Kbin | PHP | Federated content aggregator |

### Media

| Software | Language | Description |
|----------|----------|-------------|
| [Pixelfed](/docs/ecosystem/pixelfed) | PHP | Instagram-like photos |
| [PeerTube](/docs/ecosystem/peertube) | TypeScript | YouTube-like videos |
| Funkwhale | Python | Music streaming |
| Owncast | Go | Live streaming |

### Minimal / Single-User

| Software | Language | Description |
|----------|----------|-------------|
| [Fedbox](/docs/ecosystem/fedbox) | JavaScript | Zero to Fediverse in 60 seconds |
| [microfed](https://github.com/micro-fed/microfed.org) | JavaScript | Modular ActivityPub library |
| Takahē | Python | Multi-domain, single-user |
| Ktistec | Crystal | Single-user, lightweight |

### Other

| Software | Language | Description |
|----------|----------|-------------|
| Friendica | PHP | Facebook-like social network |
| Hubzilla | PHP | Decentralized publishing |
| BookWyrm | Python | Book tracking (Goodreads-like) |
| WriteFreely | Go | Blogging platform |
| Mobilizon | Elixir | Event organizing |

## Choosing Software

### For Individual Users

Consider:
- **Mastodon** - Most features, biggest network effect
- **GoToSocial** - Lightweight, privacy-focused
- **Pleroma** - Customizable, lower resources
- **Fedbox** - Minimal CLI-first, Solid-compatible

### For Communities

Consider:
- **Mastodon** - Established moderation tools
- **Lemmy** - For Reddit-like discussions
- **Pixelfed** - For photo communities

### For Developers

Consider:
- **GoToSocial** - Clean, well-documented Go codebase
- **Pleroma** - Flexible, good C2S support
- **Custom** - Build your own!

## Feature Comparison

| Feature | Mastodon | Pleroma | Misskey | GoToSocial |
|---------|----------|---------|---------|------------|
| ActivityPub | ✅ | ✅ | ✅ | ✅ |
| C2S API | ❌ | ✅ | ❌ | ❌ |
| Polls | ✅ | ✅ | ✅ | ✅ |
| Custom Emoji | ✅ | ✅ | ✅ | ✅ |
| Reactions | ❌ | ✅ | ✅ | ❌ |
| Quote Posts | ❌ | ✅ | ✅ | ❌ |
| Markdown | ❌ | ✅ | ✅ | ✅ |
| Local-only Posts | ❌ | ✅ | ✅ | ✅ |

## Resource Requirements

### Low (Single-user or small)

- **Fedbox**: Minimal RAM, Node.js, SQLite
- **GoToSocial**: 256MB RAM, single binary
- **Pleroma**: 512MB RAM
- **Akkoma**: 512MB RAM

### Medium (100-1000 users)

- **Mastodon**: 2-4GB RAM, PostgreSQL, Redis
- **Misskey**: 2-4GB RAM, PostgreSQL, Redis

### High (1000+ users)

- Multiple servers
- Load balancing
- Dedicated database
- Object storage

## Implementation Quality

### Best for Compatibility

1. **Mastodon** - De facto standard, most tested
2. **Pleroma/Akkoma** - Excellent compatibility
3. **Misskey** - Good, some quirks

### Best Documentation

1. **Mastodon** - Extensive API docs
2. **GoToSocial** - Clean, modern docs
3. **Pleroma** - Good technical docs

### Best for Forking

1. **GoToSocial** - Clean Go codebase
2. **Mastodon** - Many existing forks
3. **Pleroma/Akkoma** - Flexible architecture

## Starting Your Own Instance

### Managed Hosting

- [Masto.host](https://masto.host/) - Mastodon
- [Spacebear](https://app.spacebear.ee/) - Multiple platforms
- [Cloudplane](https://cloudplane.org/) - Various options

### Self-Hosting

Most platforms provide Docker images:

```bash
# Example: GoToSocial
docker run -d \
  -p 443:8080 \
  -v ./data:/gotosocial/storage \
  superseriousbusiness/gotosocial:latest
```

## See Also

- **[Mastodon](/docs/ecosystem/mastodon)** - Most popular platform
- **[Libraries Overview](/docs/ecosystem/libraries-overview)** - Development libraries
- **[Hosting Providers](/docs/ecosystem/hosting-providers)** - Managed options
