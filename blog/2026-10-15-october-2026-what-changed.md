---
slug: october-2026-what-changed
title: "October 2026: What Changed for ActivityPub Developers"
authors: [socialdocs]
tags: [activitypub, fediverse, changelog]
description: "Mastodon 4.6 and 4.7, FEP-7628 goes FINAL, the W3C Social Web WG's status, Lemmy 1.0 beta, and the end of fediverse.observer."
---

# October 2026: What Changed for ActivityPub Developers

A dated roundup of the changes since June 2026 that affect people building ActivityPub software, and what we updated on SocialDocs as a result.

{/* truncate */}

## Mastodon 4.6 and 4.7

- **[Mastodon 4.6](https://blog.joinmastodon.org/2026/06/mastodon-4.6/)** (17 June 2026) added collections based on [FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md), email subscriptions to posts, profile improvements and new profile-editing API endpoints.
- **[Mastodon 4.7](https://blog.joinmastodon.org/2026/08/mastodon-4.7/)** (20 August 2026) mostly reworks internals. Per the [release notes](https://github.com/mastodon/mastodon/releases/tag/v4.7.0), it:
  - uses the ActivityPub actor `id` as the primary identifier instead of the WebFinger handle, so remote accounts that change handles are renamed rather than duplicated;
  - sends RFC 9421 HTTP Message Signatures as a fallback to the earlier draft, and supports Ed25519 signatures;
  - verifies [FEP-8b32](https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md) Object Integrity Proofs;
  - adds inbound support for FEP-521a and `Link` objects in `attachment` (FEP-8967).
- Mastodon's [releases page](https://github.com/mastodon/mastodon/releases) has the current patch version (4.7.3 as of 1 October 2026).

## FEP-7628 (Move actor) is FINAL

[FEP-7628](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md) was finalized on 26 August 2026, giving account migration a stable specification.

## W3C Social Web Working Group

The Working Group chartered in January 2026 aimed to publish backwards-compatible updates to ActivityPub, Activity Streams 2.0 and Activity Vocabulary in Q3 2026. That target slipped: no new version has been published to /TR yet. Work continues in the [ActivityPub Editor's Draft](https://w3c.github.io/activitypub/), and at the [2 October joint meeting](https://github.com/w3c/socialwg/blob/main/meetings/2026/2026-10-02-CG-WG-joint.md) members discussed trying to publish a draft around [TPAC 2026](https://www.w3.org/events/tpac/2026/) (Dublin, 26–30 October). See [W3C groups](/docs/ecosystem/w3c-groups).

## Lemmy 1.0 is still in beta

The latest stable Lemmy is 0.19.20 (21 July 2026); 1.0.0-beta.2 came out on 11 September 2026 ([releases](https://github.com/LemmyNet/lemmy/releases)). Lemmy 1.0 introduces [API v4](https://join-lemmy.org/news/2025-02-03_-_Breaking_Changes_in_Lemmy_1.0), with a v3 compatibility layer for existing clients.

## fediverse.observer has shut down

The fediverse.observer statistics site is gone; its domain now redirects to a domain-parking page ([SocialHub thread](https://socialhub.activitypub.rocks/t/fediverse-observer-shut-down/8939)). We removed our links to it. [FediDB](https://fedidb.com/) remains available for network statistics.

## What we changed on SocialDocs

- Added security warnings to pages whose inbox and signature-verification code is unsafe to copy, tracked in [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).
- Removed references to libraries, packages and tools that do not exist.
- Corrected factual errors, including the ActivityPub editors, `as:Public` delivery and Mastodon's signature time window.
- Added site search and "last updated" dates on docs pages.
- Published [The Complete Guide to ActivityPub Development in 2026](/blog/complete-guide-activitypub-development-2026).

Spotted something wrong? [Open an issue](https://github.com/socialdocs/socialdocs.org/issues).
