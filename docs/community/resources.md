---
sidebar_position: 4
title: Resources
description: Developer resources, libraries, and tools for building on ActivityPub
---

# Developer Resources

A collection of libraries, tools, and resources for building ActivityPub and Fediverse applications.

## Libraries by Language

### JavaScript / TypeScript

| Library | Description | License |
|---------|-------------|---------|
| [Fedify](https://fedify.dev/) | Full ActivityPub server framework | MIT |
| [ActivityPub Express](https://github.com/immers-space/activitypub-express) | Express.js middleware for ActivityPub (unmaintained) | MIT |
| [express-activitypub](https://github.com/dariusk/express-activitypub) | Simple reference implementation | MIT |
| [http-signature](https://github.com/joyent/node-http-signature) | HTTP Signatures implementation | MIT |

```javascript
// Example: Using Fedify 2.x
import { createFederation, MemoryKvStore } from '@fedify/fedify';

const federation = createFederation({
  kv: new MemoryKvStore(), // use a persistent store in production
});

federation.setActorDispatcher('/users/{identifier}', async (ctx, identifier) => {
  // Return actor object
});
```

### Python

| Library | Description | License |
|---------|-------------|---------|
| [federation](https://github.com/jaywink/federation) | Multi-protocol social web library | BSD-3 |
| [little-boxes](https://github.com/tsileo/little-boxes) | Minimal ActivityPub framework (archived) | ISC |
| [bovine](https://codeberg.org/bovine/bovine) | Fediverse application library | MIT |
| [Takahē](https://github.com/jointakahe/takahe) | Multi-domain AP server | BSD-3 |

```python
# Example: Using federation library
from federation.entities import base
from federation.outbound import handle_create

entity = base.Post(
    raw_content="Hello from Python!",
    id="https://example.com/posts/1"
)
```

### Rust

| Library | Description | License |
|---------|-------------|---------|
| [activitypub-federation](https://github.com/LemmyNet/activitypub-federation-rust) | High-level AP framework (from Lemmy) | AGPL-3.0 |
| [activitystreams](https://github.com/asonix/activitystreams) | Traits and types for AS/AP | GPL-3.0 |
| [megalodon-rs](https://github.com/h3poteto/megalodon-rs) | Mastodon/Pleroma API client | Apache-2.0 |

```rust
// Example: Using activitypub-federation
use activitypub_federation::config::FederationConfig;

let config = FederationConfig::builder()
    .domain("example.com")
    .app_data(data)
    .build()?;
```

### Go

| Library | Description | License |
|---------|-------------|---------|
| [go-fed/activity](https://github.com/go-fed/activity) | Full AS/AP implementation | BSD-3 |
| [Hannibal](https://github.com/EmissarySocial/Hannibal) | ActivityPub library | Apache-2.0 |
| [go-activitypub](https://github.com/go-ap/activitypub) | AP service implementation | ISC |

```go
// Example: Using go-fed/activity
import "github.com/go-fed/activity/streams"

note := streams.NewActivityStreamsNote()
note.GetActivityStreamsContent().Set(/* ... */)
```

### PHP

| Library | Description | License |
|---------|-------------|---------|

### Ruby

| Library | Description | License |
|---------|-------------|---------|
| [activitypub](https://github.com/mastodon/mastodon) | Reference (Mastodon codebase) | AGPL-3.0 |

### Elixir

| Library | Description | License |
|---------|-------------|---------|
| [activity_pub](https://github.com/bonfire-networks/activity_pub) | ActivityPub library | AGPL-3.0 |
| [Pleroma](https://git.pleroma.social/pleroma/pleroma) | Full implementation reference | AGPL-3.0 |

## Tools

### Testing & Debugging

| Tool | Description |
|------|-------------|
| [FediDB](https://fedidb.org/) | Fediverse network statistics |

### Development Utilities

| Tool | Description |
|------|-------------|
| [HTTP Signature Tester](https://httpsig-test.examples.webfist.org/) | Verify signature implementation |
| [JSON-LD Playground](https://json-ld.org/playground/) | Test JSON-LD processing |
| [WebFinger Tester](https://webfinger.net/lookup/) | Test WebFinger discovery |

### Instance Management

| Tool | Description |
|------|-------------|

## Reference Implementations

### Full Servers

```
┌────────────────────────────────────────────────────────────┐
│              REFERENCE IMPLEMENTATIONS                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Microblogging                                             │
│  ├── Mastodon (Ruby)    - mastodon/mastodon               │
│  ├── Pleroma (Elixir)   - pleroma/pleroma                 │
│  └── Misskey (TS)       - misskey-dev/misskey             │
│                                                            │
│  Link Aggregation                                          │
│  └── Lemmy (Rust)       - LemmyNet/lemmy                  │
│                                                            │
│  Photo Sharing                                             │
│  └── Pixelfed (PHP)     - pixelfed/pixelfed               │
│                                                            │
│  Video                                                     │
│  └── PeerTube (TS)      - Chocobozzz/PeerTube             │
│                                                            │
│  Blogging                                                  │
│  ├── WriteFreely (Go)   - writefreely/writefreely         │
│  └── Plume (Rust)       - Plume-org/Plume                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Minimal Examples

| Project | Language | Purpose |
|---------|----------|---------|
| [express-activitypub](https://github.com/dariusk/express-activitypub) | Node.js | Reference implementation |
| [microblog.pub](https://github.com/tsileo/microblog.pub) | Python | Single-user server |

## Specifications

### Core Standards

| Specification | URL |
|--------------|-----|
| ActivityPub | [w3.org/TR/activitypub](https://www.w3.org/TR/activitypub/) |
| ActivityStreams 2.0 Core | [w3.org/TR/activitystreams-core](https://www.w3.org/TR/activitystreams-core/) |
| ActivityStreams 2.0 Vocabulary | [w3.org/TR/activitystreams-vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/) |
| JSON-LD | [w3.org/TR/json-ld](https://www.w3.org/TR/json-ld/) |
| WebFinger | [RFC 7033](https://datatracker.ietf.org/doc/html/rfc7033) |

### De Facto Standards

| Specification | Documentation |
|--------------|---------------|
| HTTP Signatures | [docs.joinmastodon.org/spec/security](https://docs.joinmastodon.org/spec/security/) |
| NodeInfo | [nodeinfo.diaspora.software](http://nodeinfo.diaspora.software/) |
| Mastodon Extensions | [docs.joinmastodon.org](https://docs.joinmastodon.org/) |

## Learning Resources

### Tutorials

| Resource | Description |
|----------|-------------|
| [ActivityPub Rocks](https://activitypub.rocks/) | Official resource site |
| [How to Implement ActivityPub](https://blog.joinmastodon.org/2018/06/how-to-implement-a-basic-activitypub-server/) | Mastodon blog tutorial |

### Diagrams & Visual References

| Resource | Description |
|----------|-------------|
| [boyter/activitypub](https://github.com/boyter/activitypub) | Sequence diagrams for common flows: Follow, Create, Delete, Announce, Move, WebFinger — a "clean room" implementation reference (MIT) |

### Books

| Resource | Description |
|----------|-------------|
| [ActivityPub: Programming for the Social Web](https://www.oreilly.com/library/view/activitypub/9781098162733/) | Evan Prodromou (O'Reilly, 2024) — building ActivityPub clients and servers, by a co-author of the spec |
| [Move Slowly and Build Bridges](https://openlibrary.org/isbn/9780197776674) | Robert W. Gehl (Oxford University Press, 2025) — history and culture of Mastodon and the Fediverse |

## Community Resources

### Forums & Discussion

| Resource | Description |
|----------|-------------|
| [SocialHub](https://socialhub.activitypub.rocks/) | Developer community forum |
| [Lemmy Communities](https://lemmy.world/c/fediverse) | Fediverse discussions |
| [#fediverse:matrix.org](https://matrix.to/#/#fediverse:matrix.org) | Matrix chat room |

### News & Updates

| Resource | Description |
|----------|-------------|
| [We Distribute](https://wedistribute.org/) | Fediverse news |
| [Fediverse Report](https://fediversereport.com/) | Weekly updates |

### Curated Lists

| Resource | URL |
|----------|-----|
| Delightful AP Development | [codeberg.org/fediverse/delightful-activitypub-development](https://codeberg.org/fediverse/delightful-activitypub-development) |
| Awesome ActivityPub | [github.com/BasixKOR/awesome-activitypub](https://github.com/BasixKOR/awesome-activitypub) |
| Fediverse.Party Tools | [fediverse.party/en/tools](https://fediverse.party/en/tools/) |

## API Documentation

### Platform APIs

| Platform | Documentation |
|----------|--------------|
| Mastodon | [docs.joinmastodon.org/api](https://docs.joinmastodon.org/api/) |
| Lemmy | [join-lemmy.org/docs](https://join-lemmy.org/docs/) |
| Pixelfed | [docs.pixelfed.org](https://docs.pixelfed.org/) |
| PeerTube | [docs.joinpeertube.org/api-rest-reference](https://docs.joinpeertube.org/api-rest-reference.html) |

### Library Documentation

| Library | Documentation |
|---------|--------------|
| Fedify | [fedify.dev](https://fedify.dev/) |
| go-fed/activity (unmaintained since 2022) | [pkg.go.dev/github.com/go-fed/activity](https://pkg.go.dev/github.com/go-fed/activity) |
| activitypub-federation-rust | [docs.rs/activitypub_federation](https://docs.rs/activitypub_federation/) |

## Quick Reference

### Essential URLs

```
┌────────────────────────────────────────────────────────────┐
│                  ESSENTIAL URLS                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Specifications                                            │
│  ├── w3.org/TR/activitypub                                │
│  ├── w3.org/TR/activitystreams-core                       │
│  └── w3.org/TR/activitystreams-vocabulary                 │
│                                                            │
│  Community                                                 │
│  ├── socialhub.activitypub.rocks                          │
│  ├── activitypub.rocks                                    │
│  └── codeberg.org/fediverse/fep                           │
│                                                            │
│  Tools                                                     │
│  ├── json-ld.org/playground                               │
│  ├── webfinger.net/lookup                                 │
│  └── fedidb.org                                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Common Namespaces

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "toot": "http://joinmastodon.org/ns#",
      "schema": "http://schema.org#",
      "PropertyValue": "schema:PropertyValue",
      "value": "schema:value"
    }
  ]
}
```

## Getting Help

### Where to Ask Questions

1. **SocialHub Forum** - Best for implementation questions
2. **Matrix Rooms** - Real-time help
3. **GitHub Issues** - Library-specific questions
4. **Stack Overflow** - Tag with `activitypub`

### Debugging Tips

```javascript
// Log incoming activities
app.post('/inbox', (req, res) => {
  console.log('Received activity:', JSON.stringify(req.body, null, 2));
  // Process activity...
});

```

To check signatures, don't hand-roll a verifier: see [Verifying incoming requests](/docs/security/verifying-requests) for tested code, or use your framework's built-in verification.

## Next Steps

- **[Getting Started](/docs/getting-started/what-is-the-fediverse)** - Begin development
- **[ActivityPub Protocol](/docs/specs/activitypub/overview)** - Learn the protocol
- **[Implementation Guides](/docs/guides/webfinger-implementation)** - Step-by-step guides
