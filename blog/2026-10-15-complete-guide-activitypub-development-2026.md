---
slug: complete-guide-activitypub-development-2026
title: "The Complete Guide to ActivityPub Development in 2026"
authors: [socialdocs]
tags: [activitypub, fediverse, tutorial, development, federation]
description: "How to build federated software with ActivityPub in 2026: core concepts, what changed in Mastodon 4.5–4.7, HTTP signatures, the libraries worth using, and how to test interop."
keywords: [ActivityPub, Fediverse, Mastodon, federation, HTTP Signatures, RFC 9421, Fedify, WebFinger]
image: /img/socialdocs-social-card.png
---

# The Complete Guide to ActivityPub Development in 2026

ActivityPub connects about 13.8 million registered accounts (roughly 1.37 million active monthly) across Mastodon, Misskey, Pixelfed, PeerTube, Lemmy and many other servers, according to [FediDB](https://fedidb.com/) in October 2026. This guide is the 2026 update of [our 2025 guide](/blog/complete-guide-activitypub-development): what you need to build, what changed this year, and which tools to use.

{/* truncate */}

## The short version

- **Use a maintained library for federation plumbing.** Request signing and verification, origin checks and safe fetching are where most security bugs live. Fedify and Mastodon both shipped fixes for these bug classes in 2026.
- **Target current Mastodon behaviour** (4.7 as of October 2026), because most of the network runs Mastodon, but test against at least one other server too.
- **Treat the actor `id` as identity, not the handle.** Mastodon 4.7 made this switch.

## Core concepts

An **actor** (usually a `Person`, `Group` or `Service`) has an `inbox` and an `outbox`. Servers federate by POSTing **activities** (`Create`, `Follow`, `Like`, `Announce`, `Delete`, `Undo`…) to each other's inboxes, signed with the sending actor's key. Discovery from a handle like `@alice@example.com` goes through **WebFinger**.

```json
{
  "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "preferredUsername": "alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "followers": "https://example.com/users/alice/followers",
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

Serve actors and objects as `application/activity+json` (Mastodon ignores plain `application/json`) and WebFinger as `application/jrd+json`. Start with [Core Concepts](/docs/getting-started/core-concepts) and [Understanding Federation](/docs/getting-started/understanding-federation).

## What changed in 2025–2026

| Change | Why it matters |
|--------|----------------|
| **Quote posts** in Mastodon 4.5 ([FEP-044f](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md)) | Quotes need the author's consent via `QuoteRequest` / `QuoteAuthorization` and a quote policy |
| **Collections** in Mastodon 4.6 ([FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md)) | Curated, opt-in lists of accounts |
| **RFC 9421 HTTP Message Signatures** — Mastodon 4.7 sends them as a fallback to the older draft, and supports Ed25519 | Plan to verify both the legacy draft-cavage format and RFC 9421 |
| **Object Integrity Proofs** — Mastodon 4.7 verifies [FEP-8b32](https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md) | Objects can carry their own signatures |
| **Actor `id` as primary identifier** — Mastodon 4.7 | Remote accounts can change handles without becoming new accounts |
| **[FEP-7628](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md) (Move actor) is FINAL** (August 2026) | Standardised account migration |
| **W3C Social Web Working Group** chartered (January 2026) | Backwards-compatible updates to ActivityPub and Activity Streams are in progress in the [Editor's Draft](https://w3c.github.io/activitypub/); none published yet |

Details: [Mastodon 4.6](https://blog.joinmastodon.org/2026/06/mastodon-4.6/) and [Mastodon 4.7](https://blog.joinmastodon.org/2026/08/mastodon-4.7/) release posts, and our [October 2026 changelog](/blog/october-2026-what-changed).

## Receiving activities safely

:::danger
The inbox is the most security-sensitive part of an ActivityPub server. Several code samples elsewhere on this site are known to be unsafe; see [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37). Prefer a maintained library's verification over hand-written code.
:::

Whatever you use, every inbound POST must pass these checks before you act on it:

1. **The signature verifies**, and it covers at least `(request-target)`, `host`, `date` and `digest` (or the RFC 9421 equivalents, including `content-digest`).
2. **The digest matches the raw request body**, not a re-serialised copy of the parsed JSON.
3. **The `Date` is recent.** Mastodon treats a signature without an explicit expiry as valid for 5 minutes after it was created, plus a 1-hour clock-skew margin, so roughly 65 minutes in total; it also rejects signatures dated more than 1 hour in the future, and caps any explicit expiry at 12 hours ([signed_request.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/signed_request.rb)).
4. **The key's `owner` is the activity's `actor`.** A valid signature from one actor must not authorise an activity claiming to be from another.
5. **Embedded objects come from the same origin as the actor**, or you re-fetch them from their own origin before trusting them.
6. **Every remote fetch is SSRF-safe**: block private and loopback addresses, re-check after redirects, and cap response sizes.
7. **Remote HTML is sanitised** before you render it.

## Libraries worth using (October 2026)

| Language | Library | Status |
|----------|---------|--------|
| TypeScript / JavaScript | [Fedify](https://fedify.dev/) | Active (2.4.x); includes a CLI for debugging |
| Rust | [activitypub-federation](https://github.com/LemmyNet/activitypub-federation-rust) (used by Lemmy) | Active (0.6.6, October 2026) |
| Python | [apkit](https://github.com/fedi-libs/apkit) | Active (0.3.x) |
| Go | [go-ap/activitypub](https://github.com/go-ap/activitypub) (vocabulary) | Active |

**Avoid starting new projects on** activitypub-express (last release February 2024), go-fed/activity (no commits since 2022) or little-boxes (archived). Browse the [library pages](/docs/ecosystem/libraries-overview) for more options.

## Testing interop

1. Expose your dev server over public HTTPS with `fedify tunnel` or ngrok.
2. Inspect what remote servers see with [BrowserPub](https://browser.pub/) or `fedify lookup`.
3. Use `fedify inbox` to get a throwaway actor that follows you and shows what your server sends.
4. Follow your test account from a real, current Mastodon and at least one other server (GoToSocial, Misskey, Lemmy…).

See [Testing & Debugging Tools](/docs/tools/overview) and [Testing Your Implementation](/docs/guides/testing-your-implementation).

## Platform quirks to plan for

| Platform | What to know |
|----------|--------------|
| **Mastodon** | Requires signed `Digest` on POST; serve `application/activity+json`; supports quote posts and collections |
| **Lemmy** | Communities are `Group` actors; 1.0 (with API v4) is in beta, 0.19.x is stable |
| **PeerTube** | Videos are `Video` objects with PeerTube-specific extensions |
| **Pixelfed** | Posts with images arrive as objects with `attachment`s |

Guides: [Mastodon](/docs/guides/mastodon-compatibility), [Lemmy](/docs/guides/lemmy-compatibility), [PeerTube](/docs/guides/peertube-compatibility), [Pixelfed](/docs/guides/pixelfed-compatibility).

## Where the community is

- [SocialHub](https://socialhub.activitypub.rocks/) — developer forum
- [W3C SocialCG and Social Web WG](/docs/community/socialcg) — standards work; mailing list `public-swicg@w3.org`
- [Fediverse Enhancement Proposals](https://codeberg.org/fediverse/fep) — protocol extensions
- [Events](/docs/community/events) — FediForum, FOSDEM's Social Web devroom, TPAC

---

*Found an error? [Open an issue](https://github.com/socialdocs/socialdocs.org/issues) — we fix and log corrections.*
