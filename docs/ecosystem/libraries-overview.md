---
sidebar_position: 10
title: Libraries & SDKs Overview
description: ActivityPub libraries and SDKs for various programming languages
---

# Libraries & SDKs Overview

This page provides an overview of ActivityPub libraries available for different programming languages.

## By Language

### JavaScript/TypeScript

| Library | Description | Status |
|---------|-------------|--------|
| [Fedify](https://fedify.dev/) | Modern TypeScript framework | Active |
| [activitypub-express](https://github.com/immers-space/activitypub-express) | Express.js middleware | Active |
| [ActivityPub.js](https://github.com/nicksellen/activitypub) | General-purpose library | Maintenance |

[More JavaScript libraries →](/docs/ecosystem/javascript-libraries)

### Python

| Library | Description | Status |
|---------|-------------|--------|
| [bovine](https://codeberg.org/bovine/bovine) | ActivityPub library | Active |
| [little-boxes](https://github.com/tsileo/little-boxes) | ActivityPub toolkit | Maintenance |
| [Federation](https://federation.readthedocs.io/) | Protocol support | Active |

[More Python libraries →](/docs/ecosystem/python-libraries)

### Go

| Library | Description | Status |
|---------|-------------|--------|
| [go-fed/activity](https://github.com/go-fed/activity) | Complete implementation | Active |
| [go-ap](https://github.com/go-ap) | ActivityPub packages | Active |
| [pub](https://github.com/writeas/pub) | WriteFreely's library | Maintenance |

[More Go libraries →](/docs/ecosystem/go-libraries)

### Rust

| Library | Description | Status |
|---------|-------------|--------|
| [activitypub-federation](https://github.com/LemmyNet/activitypub-federation-rust) | Lemmy's library | Active |
| [activitystreams](https://crates.io/crates/activitystreams) | Types library | Active |

[More Rust libraries →](/docs/ecosystem/rust-libraries)

### Ruby

| Library | Description | Status |
|---------|-------------|--------|
| Mastodon source | Reference implementation | Active |

[More Ruby libraries →](/docs/ecosystem/ruby-libraries)

### PHP

| Library | Description | Status |
|---------|-------------|--------|
| [ActivityPub for WordPress](https://github.com/pfefferle/wordpress-activitypub) | WordPress plugin | Active |
| Pixelfed source | Reference for PHP | Active |

[More PHP libraries →](/docs/ecosystem/php-libraries)

## Choosing a Library

### For Quick Prototypes

- **JavaScript**: activitypub-express (easiest setup)
- **Python**: bovine or little-boxes
- **Go**: go-fed/activity (most complete)

### For Production

- **TypeScript**: Fedify (modern, maintained)
- **Rust**: activitypub-federation (battle-tested)
- **Go**: go-fed/activity or GoToSocial's code

### For Learning

- Study existing implementations:
  - GoToSocial (Go) - Clean, well-documented
  - Mastodon (Ruby) - Reference implementation
  - Lemmy (Rust) - Modern architecture

## What Libraries Provide

### Core Features

- JSON-LD context handling
- ActivityStreams type definitions
- Activity serialization/deserialization

### Federation Features

- HTTP Signature signing/verification
- WebFinger client/server
- Inbox/Outbox handling
- Activity delivery

### Optional Features

- Database integration
- Queue management
- Caching
- Rate limiting

## Library Maturity Levels

### Production Ready

- activitypub-federation (Rust)
- go-fed/activity (Go)
- Fedify (TypeScript)

### Stable

- activitypub-express (JavaScript)
- bovine (Python)

### Experimental

- Various new projects

## Building Without a Library

If no library fits your needs, you can implement from scratch:

1. **Start simple**: WebFinger + Actor endpoint
2. **Add inbox**: Receive activities
3. **Add signing**: HTTP Signatures
4. **Add delivery**: Send to other servers

See our [implementation guides](/docs/guides/building-an-actor) for step-by-step instructions.

## Contributing to Libraries

Most libraries welcome contributions:

- Bug fixes and tests
- Documentation improvements
- Feature additions
- Compatibility fixes

Check each library's contribution guidelines.

## See Also

- **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)** - Detailed JS options
- **[Python Libraries](/docs/ecosystem/python-libraries)** - Python options
- **[Go Libraries](/docs/ecosystem/go-libraries)** - Go options
- **[Choosing Your Stack](/docs/getting-started/choosing-your-stack)** - Stack selection
