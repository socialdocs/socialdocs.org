---
sidebar_position: 3
title: Spec Status Tracker
description: Where ActivityPub standardization stands right now — the W3C Working Group's 1.1 maintenance pass, live Editor's Draft changes, and Community Group task forces, with a dated changelog
last_verified: 2026-10-15
verified_against: "W3C Social Web WG charter, w3c/activitypub PRs, w3c/socialwg meeting notes 2026-10-02 and 2026-10-09, SocialCG posts, FEP repository"
---

# Spec Status Tracker

A dated snapshot of ActivityPub standardization work. Every entry links to its source; check those for anything newer than the date at the top of the [changelog](#changelog).

:::info What to build against today
The published Recommendations — [ActivityPub (January 2018)](https://www.w3.org/TR/activitypub/), [Activity Streams 2.0 Core and Vocabulary (May 2017)](https://www.w3.org/TR/activitystreams-core/) — are still the normative versions. The [ActivityPub Editor's Draft](https://w3c.github.io/activitypub/) shows clarifications the Working Group has accepted but not yet published. Neither changes what Mastodon and other servers do on the wire today.
:::

## W3C Social Web Working Group

| | |
|---|---|
| Charter | [Social Web WG charter](https://www.w3.org/2026/01/social-web-wg-charter.html), 15 January 2026 – 31 January 2028 |
| Chair | Darius Kazemi |
| Deliverables | ActivityPub, Activity Streams 2.0 Core, Activity Vocabulary — "Expected completion: Q3 2026" (not met, see below) |
| Meeting notes | [w3c/socialwg/meetings/2026](https://github.com/w3c/socialwg/tree/main/meetings/2026) |

### "1.1" maintenance vs a future "2.0"

The WG is doing a backwards-compatible maintenance pass ("1.1"): errata, clarifications, examples. Changes that would break existing implementations are explicitly deferred to a later "2.0" — for example, on 2026-10-09 a better partial-update mechanism (deleting individual properties, patch formats such as [FEP-a1d1](https://fediverse.codeberg.page/fep/fep/a1d1/)) was called "Not 1.1 changes, more of a 2.0" ([2026-10-09 notes](https://github.com/w3c/socialwg/blob/main/meetings/2026/2026-10-09-WG-AP-suite.md)).

No updated draft has been published to `/TR` yet. On 2026-10-02 the group discussed trying to "publish a draft by TPAC" ([2026-10-02 notes](https://github.com/w3c/socialwg/blob/main/meetings/2026/2026-10-02-CG-WG-joint.md)).

### Editor's Draft changes to watch

| Change | Status | What it means for implementers |
|---|---|---|
| [#621](https://github.com/w3c/activitypub/pull/621) Clarify delivery to additional inboxes for public activities | **Merged** 2026-10-09 | The spec now explicitly allows a server to deliver public activities to inboxes beyond the addressed recipients — the pattern relays and discovery services rely on. Resolves [issue #620](https://github.com/w3c/activitypub/issues/620). |
| [#626](https://github.com/w3c/activitypub/pull/626) Shared inbox delivery: "all known" → "additional" shared inboxes | **Merged** 2026-10-09 | Servers MAY deliver public posts to *additional* shared inboxes, rather than the old "all known" wording. |
| [#637](https://github.com/w3c/activitypub/pull/637) Expand on using non-HTTP ids | **Open**, contested | Proposed by Ryan Barrett (Bridgy Fed) to allow ids such as DIDs. Mastodon and others pushed back; suggestions on 2026-10-02 included using `url`/`alsoKnownAs` for other identifiers in 1.1 and dropping the requirement that every identifier be dereferenceable ([2026-10-02 notes](https://github.com/w3c/socialwg/blob/main/meetings/2026/2026-10-02-CG-WG-joint.md)). Keep `id` on HTTPS. |

Other topics from the section-by-section read-through on 2026-10-09: more examples with non-ASCII `preferredUsername`, and how Tombstone, 404 and 410 should be used after a delete ([2026-10-09 notes](https://github.com/w3c/socialwg/blob/main/meetings/2026/2026-10-09-WG-AP-suite.md)).

### Server-to-service content delivery (Google explainer)

Google published an [explainer](https://github.com/explainers-by-googlers/activitypub-service-content-delivery) in September 2026 proposing that servers deliver public-addressed content to admin-chosen ActivityPub *service* actors (search and discovery services), using existing activities. It explicitly leaves the management of those lists and any user controls out of scope. The discussion led to issue #620 and the merged PRs above.

## SocialCG task forces

Status as reported at the [2026-10-02 joint CG/WG call](https://github.com/w3c/socialwg/blob/main/meetings/2026/2026-10-02-CG-WG-joint.md) unless noted.

| Task force | Status | Links |
|---|---|---|
| **ActivityPub API (C2S)** | Initial draft of a *Basic Profile for ActivityPub API Servers* published 2026-05-19 (OAuth, HTTP practices such as CORS, rate limits and caching). It is a first draft and "doesn't represent consensus". The OAuth profile is [FEP-d8c2](https://codeberg.org/fediverse/fep/src/branch/main/fep/d8c2/fep-d8c2.md) (DRAFT). | [Announcement](https://www.w3.org/community/socialcg/2026/05/19/initial-draft-of-basic-profile-for-activitypub-api-servers/), [Basic Profile](https://swicg.github.io/activitypub-api/basicprofile) |
| **Data Portability (LOLA)** | Draft "ready to finalize", but the group isn't meeting "since implementers aren't implementing". LOLA is a tentative deliverable in the WG charter. | [LOLA CG draft](https://swicg.github.io/activitypub-data-portability/lola) |
| **E2EE** | "Heading toward CG draft"; working on threat modelling. | [swicg/activitypub-e2ee](https://github.com/swicg/activitypub-e2ee) |
| **Handles / internationalized WebFinger** | No lead; may hibernate until one is found. A support tracker for internationalized WebFinger handles exists. | [i18n WebFinger tracker](https://swicg.github.io/activitypub-webfinger/internationalized) |
| **Groups** | Initial task-force report draft adopted 2026-05-28. | [Announcement](https://www.w3.org/community/socialcg/2026/05/28/groups-task-force-initial-draft-adopted-for-task-force-report/) |
| **HTTP Signatures** | Nothing to report. The CG's [HTTP Signatures report](https://swicg.github.io/activitypub-http-signature/) is the reference. | — |
| **Trust & Safety** | Looking for new leads. | — |

CG leadership: Dmitri Zagidulin said on 2026-10-02 he is stepping down as co-chair; Johannes Ernst remains. See [Social Web Community Group](/docs/community/socialcg) for how to take part.

## Changelog

Newest first. Each entry is dated by when the change happened, with its source.

| Date | Change |
|---|---|
| 2026-10-26 – 30 | [TPAC 2026](https://www.w3.org/events/tpac/2026/), Dublin. Breakout sessions were being proposed at the 2026-10-02 call. |
| 2026-10-09 | WG resolved to merge [#621](https://github.com/w3c/activitypub/pull/621) and [#626](https://github.com/w3c/activitypub/pull/626) (public delivery to additional inboxes). |
| 2026-10-02 | [#637](https://github.com/w3c/activitypub/pull/637) (non-HTTP ids) discussed; no decision. Draft-by-TPAC floated. |
| 2026-09 | Google's [server-to-service content delivery explainer](https://github.com/explainers-by-googlers/activitypub-service-content-delivery) published. |
| 2026-08-26 | [FEP-7628 (Move Actor)](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md) finalized. |
| 2026-06-02 | [WebSub republished as a W3C Recommendation](https://www.w3.org/TR/2026/REC-websub-20260602/) — the first of the WG's maintained specs to get an updated version. |
| 2026-05-28 | Groups task force adopts initial report draft. |
| 2026-05-19 | C2S Basic Profile initial draft published. |
| 2026-01-15 | Social Web Working Group chartered. |

For FEP statuses see [FEPs](/docs/community/feps); for the history of the groups see [W3C Groups](/docs/ecosystem/w3c-groups).
