---
sidebar_position: 14
title: Rust Libraries
description: ActivityPub libraries for Rust
---

# Rust Libraries

Rust libraries for implementing ActivityPub.

Status and versions below were taken from crates.io and GitHub on **2026-10-15**. *Active* = a release or commit in the last 12 months; *Dormant* = 12–36 months; *Unmaintained* = no release for over 3 years.

| Crate | Latest release | Status |
|-------|----------------|--------|
| [activitypub_federation](#activitypub_federation) | 0.6.6 (2026-10-01) | Active |
| [http-signature-normalization](#http-signature-normalization) | 0.7.1 (2026-06-17) | Active |
| [webfinger](#webfinger) | 0.5.1 (2022-06-12) | Dormant |
| [activitystreams](#activitystreams) | 0.6.2 stable (2020); 0.7.0-alpha.25 (2023-07-06) | Unmaintained |
| Kitsune (server) | — | Archived (August 2025) |

## activitypub_federation

The federation framework extracted from Lemmy: object and actor traits, fetching with caching, signed delivery with a retrying queue, inbox handling, and WebFinger helpers. Integrations for actix-web and axum.

| Property | Value |
|----------|-------|
| Repository | [github.com/LemmyNet/activitypub-federation-rust](https://github.com/LemmyNet/activitypub-federation-rust) |
| Crate | `activitypub_federation` |
| Docs | [docs.rs/activitypub_federation](https://docs.rs/activitypub_federation) — includes a step-by-step guide |
| License | AGPL-3.0 |

Your types implement the `Object` trait (load/verify/convert) and, for actors, the `Actor` trait (`id`, `public_key_pem`, `private_key_pem`, `inbox`, …). Activities implement `ActivityHandler`. The [docs.rs guide](https://docs.rs/activitypub_federation) walks through each trait.

### Sending Activities

```rust
use activitypub_federation::activity_queue::queue_activity;

// `activity` implements ActivityHandler + Serialize,
// `actor` implements Actor, `data` is the request's Data<T>.
let inboxes = vec![remote_actor.shared_inbox_or_inbox()];
queue_activity(&activity, &local_actor, inboxes, &data).await?;
```

`queue_activity` signs and delivers with automatic retries. To run your own queue, use `activity_sending::SendActivityTask::prepare(&activity, &actor, inboxes, &data)` and call `sign_and_send(&data)` on each task.

## http-signature-normalization

Minimal-dependency draft-cavage HTTP Signatures where you supply the crypto. Companion crates add actix-web and reqwest integration. By asonix.

| Property | Value |
|----------|-------|
| Crate | [crates.io/crates/http-signature-normalization](https://crates.io/crates/http-signature-normalization) |
| Companion crates | `http-signature-normalization-actix`, `http-signature-normalization-reqwest` |
| License | AGPL-3.0 |

The `Config` builder has fediverse-relevant switches: `mastodon_compat()`, `require_digest()` and `require_header(...)`. Signing is `config.begin_sign(method, path_and_query, headers)?.sign(key_id, |signing_string| …)?`; verification is `config.begin_verify(method, path_and_query, headers)?` then `.verify(|signature, signing_string| …)` after you look up `key_id()`. See [docs.rs](https://docs.rs/http-signature-normalization) for full examples. It does not implement RFC 9421.

## webfinger

A WebFinger client and server-side resolver, from the Plume project.

| Property | Value |
|----------|-------|
| Crate | [crates.io/crates/webfinger](https://crates.io/crates/webfinger) |
| License | GPL-3.0 |

```rust
// with_https = true
let wf = webfinger::resolve("acct:alice@example.com", true).await?;

for link in wf.links {
    if link.rel == "self" {
        if let Some(href) = link.href {
            println!("Actor URL: {href}");
        }
    }
}
```

## activitystreams

Type-safe ActivityStreams vocabulary by asonix.

:::caution Unmaintained
The last stable release (0.6.2) is from 2020 and the 0.7 line never left alpha (last alpha July 2023). `activitypub_federation` defines its own types and doesn't need it.
:::

| Property | Value |
|----------|-------|
| Crate | [crates.io/crates/activitystreams](https://crates.io/crates/activitystreams) |
| License | GPL-3.0 |

## Reference: Lemmy

Lemmy's federation code lives in [`crates/apub/`](https://github.com/LemmyNet/lemmy/tree/main/crates/apub) (`activities/`, `objects/`, `send/`) and is the largest real-world user of `activitypub_federation`.

## Choosing

- **New server**: activitypub_federation.
- **Own stack, only need signatures**: http-signature-normalization (draft-cavage), and plan for RFC 9421 separately.

## See Also

- **[Lemmy](/docs/ecosystem/lemmy)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
