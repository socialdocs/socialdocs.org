---
sidebar_position: 4
title: Resources
description: Developer resources, libraries, and tools for building on ActivityPub
last_verified: 2026-10-15
verified_against: "Links and GitHub API repository status checked 2026-10-15; Mastodon v4.7.3 context_helper.rb; Matrix directory API; Stack Exchange API"
---

# Developer Resources

A collection of libraries, tools, and resources for building ActivityPub and Fediverse applications.

## Libraries

Library listings, with maintenance status taken from package registries and forges, live on the ecosystem pages:

- [Libraries overview](/docs/ecosystem/libraries-overview) — what to pick, by language
- [Fedify](/docs/ecosystem/fedify) (TypeScript), [JavaScript](/docs/ecosystem/javascript-libraries), [Python](/docs/ecosystem/python-libraries), [Go](/docs/ecosystem/go-libraries), [Rust](/docs/ecosystem/rust-libraries), [Ruby](/docs/ecosystem/ruby-libraries), [PHP](/docs/ecosystem/php-libraries), [other languages](/docs/ecosystem/other-libraries)

## Tools

### Testing & Debugging

| Tool | Description |
|------|-------------|
| [FediDB](https://fedidb.org/) | Fediverse network statistics |

### Development Utilities

| Tool | Description |
|------|-------------|
| [JSON-LD Playground](https://json-ld.org/playground/) | Test JSON-LD processing |
| [WebFinger Tester](https://webfinger.net/lookup/) | Test WebFinger discovery |

## Reference Implementations

### Full Servers

Widely deployed servers whose source is worth reading (see [Server Software](/docs/ecosystem/server-software) for the full list):

- **Microblogging:** [Mastodon](https://github.com/mastodon/mastodon) (Ruby), [Pleroma](https://git.pleroma.social/pleroma/pleroma) (Elixir), [Misskey](https://github.com/misskey-dev/misskey) (TypeScript), [GoToSocial](https://codeberg.org/superseriousbusiness/gotosocial) (Go)
- **Link aggregation:** [Lemmy](https://github.com/LemmyNet/lemmy) (Rust)
- **Photos:** [Pixelfed](https://github.com/pixelfed/pixelfed) (PHP)
- **Video:** [PeerTube](https://github.com/Chocobozzz/PeerTube) (TypeScript)
- **Blogging:** [WriteFreely](https://github.com/writefreely/writefreely) (Go); [Plume](https://github.com/Plume-org/Plume) (Rust, little activity since April 2025)

### Minimal Examples

| Project | Language | Purpose |
|---------|----------|---------|
| [express-activitypub](https://github.com/dariusk/express-activitypub) | Node.js | Small single-user server by Darius Kazemi — readable, but not a security reference |
| [microblog.pub](https://github.com/tsileo/microblog.pub) | Python | Single-user server (no GitHub activity since 2023) |

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
| HTTP Signatures | [draft-cavage-12](https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12), [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421), [SWICG report](https://www.w3.org/community/reports/socialcg/CG-FINAL-apsig-20240607/), [Mastodon's profile](https://docs.joinmastodon.org/spec/security/) |
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
| [Lemmy Communities](https://lemmy.ml/c/fediverse) | Fediverse discussions |
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

- **Specifications:** [w3.org/TR/activitypub](https://www.w3.org/TR/activitypub/), [w3.org/TR/activitystreams-core](https://www.w3.org/TR/activitystreams-core/), [w3.org/TR/activitystreams-vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/)
- **Community:** [socialhub.activitypub.rocks](https://socialhub.activitypub.rocks/), [activitypub.rocks](https://activitypub.rocks/), [codeberg.org/fediverse/fep](https://codeberg.org/fediverse/fep)
- **Tools:** [json-ld.org/playground](https://json-ld.org/playground/), [webfinger.net/lookup](https://webfinger.net/lookup/), [fedidb.org](https://fedidb.org/)

### Common Namespaces

Mastodon's context, including the `schema:` terms it uses for profile fields ([context_helper.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb)):

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
4. **Stack Overflow** - the `activitypub` tag exists but sees little traffic; SocialHub is usually faster

### Debugging Tips

```javascript
// Log incoming activities while debugging (never log secrets in production)
app.post('/inbox', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
  console.log('Received activity:', req.body.toString());
  // Verify, then process...
  res.sendStatus(202);
});
```

To check signatures, don't hand-roll a verifier: see [Verifying incoming requests](/docs/security/verifying-requests) for tested code, or use your framework's built-in verification.

## Next Steps

- **[Getting Started](/docs/getting-started/what-is-the-fediverse)** - Begin development
- **[ActivityPub Protocol](/docs/specs/activitypub/overview)** - Learn the protocol
- **[Implementation Guides](/docs/guides/webfinger-implementation)** - Step-by-step guides
