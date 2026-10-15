---
sidebar_position: 17
title: Other Libraries
description: ActivityPub libraries for other programming languages
last_verified: 2026-10-15
verified_against: "Package registries and forge APIs (npm, PyPI, crates.io, RubyGems, Packagist, Go proxy, GitHub, Codeberg) on 2026-10-15; @fedify/* 2.4.4"
---

# Other Libraries

ActivityPub options for languages without a dedicated page. Status checked on **2026-10-15**.

## Elixir

### activity_pub (Bonfire)

A general-purpose ActivityPub library for Elixir, extracted from and used by [Bonfire](https://bonfirenetworks.org/). You plug it into your app by writing an adapter module. Its README describes it as work in progress, with federation testing underway.

| Property | Value |
|----------|-------|
| Repository | [github.com/bonfire-networks/activity_pub](https://github.com/bonfire-networks/activity_pub) |
| Install | git dependency (`branch: "stable"`), not on Hex |
| License | AGPL-3.0 |
| Status | Active (commits October 2026) |

### Pleroma / Akkoma source

Pleroma and its fork Akkoma are mature Elixir servers whose federation code is a useful reference, though not packaged as a library.

| Property | Value |
|----------|-------|
| Akkoma | [akkoma.dev/AkkomaGang/akkoma](https://akkoma.dev/AkkomaGang/akkoma) — see [`lib/pleroma/web/activity_pub/`](https://akkoma.dev/AkkomaGang/akkoma/src/branch/develop/lib/pleroma/web/activity_pub) |
| Pleroma | [git.pleroma.social/pleroma/pleroma](https://git.pleroma.social/pleroma/pleroma) |

## C# / .NET

**[Letterbook](https://github.com/Letterbook/Letterbook)** (AGPL-3.0, active) is a federated social server written in C#; its source is the most current .NET ActivityPub reference. Its separate type library, [Letterbook.ActivityPub](https://github.com/Letterbook/Letterbook.ActivityPub), has not been updated since June 2024.

## Java / Kotlin, Swift, Dart, Haskell

We don't know of a maintained, general-purpose ActivityPub library for these languages. If you know one, please [open an issue](https://github.com/socialdocs/socialdocs.org/issues). Until then, build on a JSON library and an HTTP-signature implementation for your platform, and test against real servers.

## Building Your Own

If no library exists for your language, the minimum to federate with Mastodon is:

1. **Types** — actors (`Person`, `Group`, `Service`), objects (`Note`, `Article`, `Image`), activities (`Create`, `Follow`, `Accept`, `Undo`, `Like`, `Announce`, `Delete`), and `OrderedCollection`.
2. **WebFinger** — `GET /.well-known/webfinger?resource=acct:{user}@{domain}` returning a `self` link of type `application/activity+json`.
3. **Actor endpoint** — served as `application/activity+json`, with a `publicKey`.
4. **HTTP Signatures** — sign outgoing POSTs (draft-cavage `rsa-sha256` with `(request-target) host date digest` is what most servers accept today; [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421) is the future), and **verify** incoming ones, including the body digest and that the key belongs to the activity's `actor` — see [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).
5. **Inbox and outbox** — accept activities with `202`, and publish your own.

See [Building an Actor](/docs/guides/building-an-actor) for the details.

## Community Resources

- **[SocialHub](https://socialhub.activitypub.rocks/)** — Developer forum
- **[FEP Repository](https://codeberg.org/fediverse/fep)** — Fediverse Enhancement Proposals

## See Also

- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
- **[Building an Actor](/docs/guides/building-an-actor)**
