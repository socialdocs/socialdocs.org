---
title: Guides by Task
sidebar_label: I want to…
description: Find the right guide by what you are trying to do — get followed by Mastodon users, make replies thread, migrate an account, fix a 401.
slug: /guides
---

# Guides by Task

Pick the thing you are trying to do. Each guide links to the specs and platform source it relies on.

## Get federating

| I want to… | Read |
|---|---|
| Stand up a minimal server that federates (tested against GoToSocial in CI) | [Your First ActivityPub Server](/docs/getting-started/your-first-activitypub-server) |
| Publish an actor other servers can find and follow | [Building an Actor](/docs/guides/building-an-actor), [WebFinger](/docs/guides/webfinger-implementation) |
| Accept activities safely | [Handling Incoming Activities](/docs/guides/handling-incoming-activities), [Verifying Requests](/docs/security/verifying-requests) |
| Send activities and have Mastodon accept them | [Sending Activities](/docs/guides/sending-activities), [HTTP Signatures](/docs/specs/http-signatures/overview) |
| Add ActivityPub to an existing website | [Adding ActivityPub to Your Homepage](/docs/guides/adding-activitypub-to-homepage) |
| Figure out why something doesn't work | [Troubleshooting by Symptom](/docs/guides/troubleshooting) |

## Build social features

| I want to… | Read |
|---|---|
| Get followed by a Mastodon user | [Following and Followers](/docs/guides/following-and-followers), [Mastodon Compatibility](/docs/guides/mastodon-compatibility) |
| Publish posts that show up in timelines | [Posts and Replies](/docs/guides/posts-and-replies) |
| Make replies thread, and fetch missing replies | [Threads, Replies and Backfill](/docs/guides/threads-replies-and-backfill) |
| Support quote posts and reply controls | [Quote Posts and Interaction Policies](/docs/guides/quote-posts-and-interaction-policies) |
| Notify people I mention, or send a private message | [Mentions and Hashtags](/docs/guides/mentions-and-hashtags), [Direct Messages](/docs/guides/direct-messages) |
| Attach images and video | [Media Attachments](/docs/guides/media-attachments) |
| Handle likes, boosts, polls and custom emoji | [Likes and Shares](/docs/guides/likes-and-shares), [Polls](/docs/guides/polls), [Custom Emoji](/docs/guides/custom-emoji) |

## Run it in production

| I want to… | Read |
|---|---|
| Delete posts and accounts so the deletion actually propagates | [Deletion](/docs/guides/deletion) |
| Let users move accounts between servers | [Account Migration](/docs/guides/account-migration), [Keys and Identity](/docs/security/keys-and-identity) |
| Deliver to thousands of servers without falling over | [Delivery at Scale](/docs/guides/delivery-at-scale), [Scaling and Performance](/docs/guides/scaling-and-performance) |
| Moderate, block and report | [Content Moderation](/docs/guides/content-moderation) |
| Require signed fetches (authorized fetch) | [Authorized Fetch](/docs/security/authorized-fetch) |
| Rotate keys or support Ed25519 | [Keys and Identity](/docs/security/keys-and-identity) |
| Test my implementation | [Testing Your Implementation](/docs/guides/testing-your-implementation), [Testing & Debugging tools](/docs/tools/overview) |

## Interoperate with a platform

| I want to work with… | Read |
|---|---|
| Mastodon | [Mastodon Compatibility](/docs/guides/mastodon-compatibility) |
| Lemmy, PieFed or other group-based software | [Lemmy Compatibility](/docs/guides/lemmy-compatibility) |
| Pixelfed | [Pixelfed Compatibility](/docs/guides/pixelfed-compatibility) |
| PeerTube | [PeerTube Compatibility](/docs/guides/peertube-compatibility) |
| Threads, Ghost, WordPress, Bluesky (via Bridgy Fed), NodeBB, Discourse | [Big Platforms](/docs/ecosystem/big-platforms) |
