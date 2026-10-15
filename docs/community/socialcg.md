---
sidebar_position: 2
title: Social Web Community Group
description: The W3C SocialCG and Social Web Working Group — who maintains ActivityPub, how to participate, and current task forces
---

# Social Web Community Group (SocialCG)

The W3C [Social Web Incubator Community Group](https://www.w3.org/groups/cg/socialcg/) (SocialCG, sometimes "SWICG") is where the ActivityPub community incubates extensions, writes reports, and coordinates implementers. Since January 2026 the formal maintenance of the ActivityPub and Activity Streams Recommendations has moved to the chartered [Social Web Working Group](/docs/ecosystem/w3c-groups); the CG keeps incubating work the WG can adopt.

*Facts on this page were checked against w3.org and the group's GitHub repositories in October 2026.*

## Who does what

| Group | Role | Leadership |
|-------|------|------------|
| [Social Web Working Group](https://www.w3.org/groups/wg/social/) (chartered 2026-01-15 to 2028-01-31) | Maintains the seven Social Web Recommendations (ActivityPub, Activity Streams 2.0 Core and Vocabulary, Webmention, WebSub, Micropub, LDN) and publishes backwards-compatible updates | Chair: Darius Kazemi |
| [Social Web Incubator CG](https://www.w3.org/groups/cg/socialcg/) | Incubates extensions, publishes CG reports, runs task forces | Chairs: Johannes Ernst and Dmitri Zagidulin. Zagidulin announced on [2 October 2026](https://github.com/w3c/socialwg/blob/main/meetings/2026/2026-10-02-CG-WG-joint.md) that he is stepping down and the group is looking for a second co-chair. |
| [FEP process](/docs/community/feps) | Community-run Fediverse Enhancement Proposals on Codeberg, independent of W3C | FEP facilitators |

As of October 2026 the WG has not yet published an updated ActivityPub draft; its Q3 2026 target slipped, and at the 2 October joint meeting members discussed trying to publish a draft around [TPAC 2026](https://www.w3.org/events/tpac/2026/) (Dublin, 26–30 October). Work happens in the [ActivityPub Editor's Draft](https://w3c.github.io/activitypub/).

## How to participate

1. **Join the CG** at [w3.org/groups/cg/socialcg](https://www.w3.org/groups/cg/socialcg/) — free; requires a W3C account and accepting the Community Contributor License Agreement.
2. **Subscribe to the mailing list**: `public-swicg@w3.org` ([archive](https://lists.w3.org/Archives/Public/public-swicg/)).
3. **Attend meetings**: dates are on the [SocialCG calendar](https://www.w3.org/groups/cg/socialcg/calendar/). In 2026 the CG and WG hold joint meetings, and the WG also runs ActivityPub spec read-through sessions.
4. **Read the minutes**: 2026 joint CG/WG minutes are in [w3c/socialwg/meetings/2026](https://github.com/w3c/socialwg/tree/main/meetings/2026); earlier CG minutes are in [swicg/meetings](https://github.com/swicg/meetings).
5. **File spec issues** on [w3c/activitypub](https://github.com/w3c/activitypub/issues) or [w3c/activitystreams](https://github.com/w3c/activitystreams/issues), and discuss on [SocialHub](https://socialhub.activitypub.rocks/).

## Task forces

From the CG's own [task force list](https://github.com/swicg/meetings/blob/main/DELIVERABLES-TASKFORCES.md) (October 2026):

| Task force | Focus | Main deliverable |
|------------|-------|------------------|
| [ActivityPub API](https://github.com/swicg/activitypub-api) | Client-to-server API improvements and an OAuth profile | [Basic Profile](https://swicg.github.io/activitypub-api/basicprofile) (unpublished draft) |
| [Data Portability](https://github.com/swicg/activitypub-data-portability) | Live account portability | [LOLA](https://swicg.github.io/activitypub-data-portability/lola.html) |
| [HTML Discovery](https://github.com/swicg/activitypub-html-discovery) | Finding ActivityPub objects from HTML pages | [ActivityPub Discovery](https://swicg.github.io/activitypub-html-discovery/) (unpublished draft) |
| [E2EE](https://github.com/swicg/activitypub-e2ee) | End-to-end encrypted messaging | [MLS over ActivityPub](https://swicg.github.io/activitypub-e2ee/mls) (unpublished draft) |
| [Forums](https://github.com/swicg/forums) | Threaded/forum ("threadiverse") interop at the context level | FEP and report planned |
| [Geosocial](https://github.com/swicg/geosocial) | Location in social data | Two documents planned |
| [Groups](https://swicg.github.io/groups/) | Group contexts and membership | [Groups in the ActivityPub Ecosystem](https://swicg.github.io/groups/) (in progress) |
| [Handles](https://github.com/swicg/activitypub-handles) | Handle resolution, internationalization, verification | New in August 2026 |
| [HTTP Signature](https://github.com/swicg/activitypub-http-signature) | Request signing | [ActivityPub and HTTP Signatures](https://www.w3.org/community/reports/socialcg/CG-FINAL-apsig-20240607/) (final report, 2024); 2026 revision planned |
| [Remix](https://github.com/swicg/activitypub-remix) | Remixing and aggregating actors | Explainer and report planned |
| [Trust and Safety](https://github.com/swicg/activitypub-trust-and-safety) | Trust, safety and integrity | [ActivityPub Trust and Safety](https://swicg.github.io/activitypub-trust-and-safety/) (living document) |
| Website | SWICG websites and accounts | Ongoing |

The Test Suite task force is listed as inactive.

## Published CG reports worth reading

- [ActivityPub and HTTP Signatures](https://www.w3.org/community/reports/socialcg/CG-FINAL-apsig-20240607/) (2024)
- [ActivityPub and WebFinger](https://www.w3.org/community/reports/socialcg/CG-FINAL-apwf-20240608/) (2024)
- [ActivityPub Miscellaneous Terms](https://www.w3.org/community/reports/socialcg/CG-FINAL-apmisc-20260828/) (2026)

## Reporting issues

- **Spec bugs and errata**: open an issue on [w3c/activitypub](https://github.com/w3c/activitypub/issues) or [w3c/activitystreams](https://github.com/w3c/activitystreams/issues), citing the section.
- **New features or extensions**: discuss on [SocialHub](https://socialhub.activitypub.rocks/), then consider writing a [FEP](/docs/community/feps) or bringing it to a CG meeting.

## Social Web Foundation

The [Social Web Foundation](https://socialwebfoundation.org/), launched in 2024 with Evan Prodromou among its founders, is a non-profit that advocates for the ActivityPub-based social web and supports standards work. It is separate from the W3C groups.

## History

The original Social Web Working Group (2014–2018) published Activity Streams 2.0 (May 2017) and ActivityPub (January 2018) as W3C Recommendations.

Key participants included:
- Christine Lemmer-Webber and Jessica Tallon (ActivityPub editors)
- Erin Shepherd, Amy Guy and Evan Prodromou (ActivityPub co-authors)
- James Snell and Evan Prodromou (Activity Streams 2.0 editors)

After that charter ended, the SocialCG carried on errata and incubation work until the Working Group was chartered again in January 2026.

## Next steps

- **[FEPs](/docs/community/feps)** - Enhancement proposals
- **[Events](/docs/community/events)** - Community events
- **[Resources](/docs/community/resources)** - Developer resources
