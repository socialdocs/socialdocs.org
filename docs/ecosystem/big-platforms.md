---
sidebar_position: 20
title: Big Platforms and Their Quirks
description: How Threads, Ghost, WordPress, NodeBB, Discourse, Bridgy Fed and Flipboard federate — and what your implementation will see from them
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 status_parser.rb; TryGhost/ActivityPub main; Automattic/wordpress-activitypub 9.3.1 FEDERATION.md and release notes; discourse-activity-pub settings; NodeBB docs; fed.brid.gy/docs; Meta engineering blog"
---

# Big Platforms and Their Quirks

Large platforms that joined the fediverse each made design choices your server will run into. This page lists the ones that affect interop, with sources. Where a platform's current behaviour couldn't be confirmed from a primary source, it says so.

## Long-form posts show up as headline + link on Mastodon

Several of these platforms publish long-form posts as `Article`. Mastodon only fully supports `Note` and `Question`; for `Article`, `Page`, `Image`, `Audio`, `Video` and `Event` it builds the status from the **`name` (as a heading), the `summary`, and a link to `url`** — the `content` is not shown ([`status_parser.rb` in Mastodon v4.7.3](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/status_parser.rb#L48-L56), [`CONVERTED_TYPES`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb#L10)).

So if you publish blog posts as `Article`, Mastodon users see a title card that links back to your site. If you want the full text inline, publish a `Note` — at the cost of losing the title and long-form semantics. Other servers (Misskey forks, Akkoma, NodeBB) may render `Article` differently; test against the ones your users are on.

## Threads (Meta)

| | |
|---|---|
| Opt-in | Users aged 18+ with public profiles choose to federate ([Meta engineering, March 2024](https://engineering.fb.com/2024/03/21/networking-traffic/threads-has-entered-the-fediverse/)) |
| What doesn't federate | Posts with restricted replies, replies to non-federated posts, polls, and reposts of non-federated posts (same source) |
| Quote posts | Sent using [FEP-e232](https://codeberg.org/fediverse/fep/src/branch/main/fep/e232/fep-e232.md) object links plus `_misskey_quote` (same source) — not the consent-based [FEP-044f](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md) that Mastodon 4.5+ uses |
| Links | Link attachments are appended to the post text when not already included (same source) |

**Current status: unverified.** Meta has not published an engineering update on fediverse features since the 2024 post. A Meta engineer [posted in June 2025](https://www.threads.com/@pcottle/post/DLAj1KZOxQT/this-milestone-only-includes-the-fediverse-following-feed-and-search-functionali) that Threads added a fediverse following feed and search, that replying to fediverse posts was a goal rather than a shipped feature, and that fediverse replies can be *seen* on Threads posts. Nothing newer from Meta could be confirmed; check before relying on reply behaviour.

## Ghost

| | |
|---|---|
| Since | [Ghost 6.0](https://ghost.org/changelog/6/), 4 August 2025 — "works on all Ghost 6.0 sites, whether on Ghost(Pro) or self-hosted" |
| Implementation | A separate, multi-tenant [ActivityPub service](https://github.com/TryGhost/ActivityPub) built with [Fedify](https://fedify.dev/); Ghost proxies `/.ghost/activitypub/*`, `/.well-known/webfinger` and `/.well-known/nodeinfo` to it |
| Long-form posts | Sent as `Article` with `name`, `content`, `summary`, `image` and `url`, plus a `preview` `Note` holding the excerpt ([source](https://github.com/TryGhost/ActivityPub/blob/main/src/helpers/activitypub/activity.ts)) — so Mastodon shows a title card and link (see above) |
| Short notes | Sent as `Note` with image attachments and mentions (same source) |

If your server can render `preview`, it is a better excerpt than `summary` for Ghost articles.

## WordPress (ActivityPub plugin)

The [ActivityPub plugin](https://github.com/Automattic/wordpress-activitypub) (Automattic; 9.3.1 released 2026-09-02) documents its behaviour in [`FEDERATION.md`](https://github.com/Automattic/wordpress-activitypub/blob/trunk/FEDERATION.md):

- **Object types:** `Note` by default; `Article` for standard posts without a specific post format — which Mastodon shows as a title card.
- **Signatures:** signs all outgoing `POST`s and supports signed `GET`s. Since 8.1 it retries failed deliveries with the other signature format ("double-knock", [PR #3098](https://github.com/Automattic/wordpress-activitypub/pull/3098)); 9.0 binds RFC 9421 keyIds to the actor's host ([PR #3357](https://github.com/Automattic/wordpress-activitypub/pull/3357)).
- **Client-to-server:** [8.1.0](https://github.com/Automattic/wordpress-activitypub/releases/tag/8.1.0) (2026-04-21) added a C2S API with OAuth; [9.0.0](https://github.com/Automattic/wordpress-activitypub/releases/tag/9.0.0) improved conformance with the SWICG [Basic Profile](https://swicg.github.io/activitypub-api/basicprofile) (listed as partial). This is one of the few production C2S implementations — useful to test clients against.
- **FEPs:** among others FEP-044f (quote posts), FEP-7628 (Move), FEP-7888 (`context`), FEP-8fcf (followers sync), FEP-b2b8 (long-form text), FEP-c180 (problem details), FEP-7aa9 consent endpoint (9.0).

## NodeBB

NodeBB (v4.16.3, 2026-10-14) federates forums ([NodeBB ActivityPub docs](https://docs.nodebb.org/activitypub/)):

- **Categories are `Group` actors** following [FEP-1b12](https://docs.nodebb.org/activitypub/fep/1b12/): when anyone posts in a category, the category `Announce`s the post to its followers. Categories can also follow other `Group` actors.
- **`audience`** is set to the category; the topic is expressed in `context`.
- **Threads:** NodeBB first resolves the [FEP-7888](https://docs.nodebb.org/activitypub/context/) `context` as a collection and imports every object in it; if there is no resolvable `context`, it walks the `inReplyTo` chain to the root. Publish a resolvable `context` collection if you want your threads to arrive whole.
- Remote content that isn't in a followed category lands in an "Uncategorized" pseudo-category.

## Discourse (ActivityPub plugin)

The [discourse-activity-pub](https://github.com/discourse/discourse-activity-pub) plugin publishes categories and tags as actors. From its [settings](https://github.com/discourse/discourse-activity-pub/blob/main/config/settings.yml) and [messages](https://github.com/discourse/discourse-activity-pub/blob/main/config/locales/server.en.yml):

- Two publication modes per actor: **first post only** or **full topic** ("Full topic publication requires public publication").
- **Delivery is delayed** by 5 minutes by default (`activity_pub_delivery_delay_minutes`); deletes are delivered immediately. Don't expect a new topic to arrive the moment it is posted.
- **Signed requests are required** by default (`activity_pub_require_signed_requests`) — sign your `GET`s.
- Editing a note after publication is not supported.

## Bridgy Fed

[Bridgy Fed](https://fed.brid.gy/docs) bridges the fediverse, Bluesky and websites. Per its docs:

| Who | Bridged handle |
|---|---|
| Bluesky user, seen from the fediverse | `@handle@bsky.brid.gy`, e.g. `@snarfed.bsky.social@bsky.brid.gy` |
| Fediverse user, seen from Bluesky | `user.instance.ap.brid.gy`, e.g. `@snarfed@indieweb.social` → `snarfed.indieweb.social.ap.brid.gy` (underscores and tildes become dashes) |
| Website, seen from Bluesky | `yourdomain.com.web.brid.gy` |
| Website, seen from the fediverse | `@yourdomain.com@yourdomain.com` by default |

- **Opt-in on both sides:** fediverse users follow `@bsky.brid.gy@bsky.brid.gy` (block it to opt out); Bluesky users follow `@ap.brid.gy`.
- **Only fully public posts are bridged.** Unlisted, followers-only posts and DMs never are.
- **Nostr is not supported** — the docs say only that Farcaster and Nostr are being considered.

If your server shows remote handles, `bsky.brid.gy` and `web.brid.gy` actors are bridges: link them to the original account where you can.

## Flipboard and Surf

Surf is Flipboard's client for the open social web, reaching people "on the ATproto network as well as those on ActivityPub"; as of Flipboard's [March 2025 announcement](https://about.flipboard.com/press/surf-unifies-bluesky-mastodon-and-threads-communities-launches-the-blue-wave-beta-of-its-open-social-browser/) it was in private beta, with Bluesky login and Mastodon account linking. Later launch status is unverified.

## Tumblr

**Unverified.** Tumblr does not federate. Automattic's plan to move Tumblr onto WordPress — which would have brought the ActivityPub plugin with it — was reported in June 2025 to be on hold. No primary source from Automattic or Tumblr staff was found.

## See also

- [Bridges](/docs/ecosystem/bridges)
- [Mastodon](/docs/ecosystem/mastodon)
- [Server software](/docs/ecosystem/server-software)
