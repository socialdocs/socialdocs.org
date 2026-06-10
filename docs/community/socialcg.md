---
sidebar_position: 2
title: Social Web Community Group
description: W3C community group maintaining ActivityPub and ActivityStreams specifications
---

# Social Web Community Group (SocialCG)

The W3C Social Web Incubator Community Group (SocialCG) is the standards body responsible for maintaining ActivityPub, ActivityStreams 2.0, and related social web specifications.

## Overview

```
┌────────────────────────────────────────────────────────────┐
│                 W3C SOCIAL WEB HISTORY                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  2014-2018: Social Web Working Group                       │
│  ├── Created ActivityPub specification                     │
│  ├── Created ActivityStreams 2.0 specification            │
│  └── Published as W3C Recommendations                      │
│       │                                                    │
│       ▼                                                    │
│  2017-Present: Social Web Incubator Community Group       │
│  ├── Maintains specifications                              │
│  ├── Manages errata                                        │
│  ├── Incubates new proposals                              │
│  └── Coordinates with implementors                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## What is SocialCG?

The SocialCG is a W3C Community Group that:

- **Maintains** ActivityPub and ActivityStreams 2.0 specifications
- **Manages** errata and clarifications
- **Incubates** new proposals and extensions
- **Coordinates** between implementors
- **Reviews** Fediverse Enhancement Proposals (FEPs)

**Website**: [w3.org/community/socialcg](https://www.w3.org/community/socialcg/)

## Specifications Maintained

### W3C Recommendations

| Specification | Status | Description |
|--------------|--------|-------------|
| [ActivityPub](https://www.w3.org/TR/activitypub/) | W3C REC | Server-to-server and client-to-server protocol |
| [ActivityStreams 2.0](https://www.w3.org/TR/activitystreams-core/) | W3C REC | Core data model and vocabulary |
| [AS2 Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/) | W3C REC | Standard types and properties |

### Community Specifications

| Specification | Status | Description |
|--------------|--------|-------------|
| [HTTP Signatures](https://docs.joinmastodon.org/spec/security/) | De facto | Request signing for authentication |
| [WebFinger](https://webfinger.net/) | RFC 7033 | Actor discovery |
| [NodeInfo](http://nodeinfo.diaspora.software/) | Community | Server metadata |

## How to Participate

### 1. Join the Group

Anyone can join the SocialCG:

1. Visit [w3.org/community/socialcg](https://www.w3.org/community/socialcg/)
2. Click "Join this group"
3. Create a W3C account (free for individuals)
4. Accept the Community Contributor License Agreement

### 2. Attend Meetings

The SocialCG holds regular meetings:

- **Frequency**: Bi-weekly or monthly
- **Format**: Video calls + IRC/Matrix
- **Minutes**: Published publicly
- **Participation**: Open to all members

Find meeting times and agendas on the [SocialCG wiki](https://www.w3.org/wiki/SocialCG).

### 3. Contribute to Discussions

Participate in specification discussions:

```
┌────────────────────────────────────────────────────────────┐
│                  CONTRIBUTION CHANNELS                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  GitHub Issues                                             │
│  ├── github.com/w3c/activitypub                           │
│  └── github.com/w3c/activitystreams                       │
│                                                            │
│  SocialHub Forum                                           │
│  └── socialhub.activitypub.rocks                          │
│                                                            │
│  Matrix/IRC                                                │
│  └── #social:matrix.org / #social on W3C IRC              │
│                                                            │
│  Mailing List                                              │
│  └── public-socialcg@w3.org                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Task Forces

The SocialCG organizes work through task forces:

### Web Task Force

Maintains [activitypub.rocks](https://activitypub.rocks/) and related documentation:

- Website maintenance
- Developer resources
- Implementation guides

### Test Suite Task Force

Develops conformance testing:

- ActivityPub test suite
- Interoperability testing
- Implementation validation

### Errata Task Force

Manages specification corrections:

- Reviews errata submissions
- Maintains errata documents
- Proposes clarifications

## Current Initiatives

### Social Web Working Group (Rechartered)

In January 2026, the W3C rechartered the [Social Web Working Group](/docs/ecosystem/w3c-groups) (chaired by Darius Kazemi) to:

- Maintain all seven Social Web Recommendations (ActivityPub, ActivityStreams 2.0, Activity Vocabulary, Webmention, WebSub, Micropub, LDN)
- Publish backwards-compatible updates incorporating accepted errata (expected Q3 2026)
- Potentially adopt incubated work like LOLA (account portability) onto the Recommendation track

The SocialCG continues to incubate new proposals, which the Working Group can adopt — modifications to the Recommendations themselves now happen in the WG.

### Focus Areas

Current SocialCG focus areas include:

1. **End-to-End Encryption** - Secure direct messaging
2. **Portable Identity** - Account migration and portability
3. **Trust & Safety** - Moderation and content policies
4. **Interoperability** - Cross-platform compatibility

## Social Web Foundation

In 2024, Evan Prodromou (co-author of ActivityPub) launched the [Social Web Foundation](https://socialwebfoundation.org/) to:

- Advocate for open social web standards
- Fund development and research
- Coordinate between organizations
- Support the SocialCG's work

The foundation works alongside the SocialCG to advance ActivityPub adoption.

## Reporting Issues

### Specification Issues

For issues with the specifications themselves:

```
ActivityPub issues:
https://github.com/w3c/activitypub/issues

ActivityStreams issues:
https://github.com/w3c/activitystreams/issues
```

### Errata

For corrections to published specifications:

1. Open an issue on the relevant repository
2. Label it as "errata"
3. Describe the error and proposed correction
4. Reference relevant spec sections

### Feature Requests

For new features or extensions:

1. Discuss on [SocialHub](https://socialhub.activitypub.rocks/)
2. Consider writing a [FEP](/docs/community/feps)
3. Present at SocialCG meetings

## Meeting Schedule

SocialCG meetings are scheduled on the group's calendar:

```
┌────────────────────────────────────────────────────────────┐
│                  TYPICAL MEETING FORMAT                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Roll call and introductions           (5 min)         │
│  2. Review of action items                (10 min)        │
│  3. Issue triage                          (20 min)        │
│  4. Discussion topics                     (20 min)        │
│  5. New business                          (5 min)         │
│                                                            │
│  Duration: ~60 minutes                                     │
│  Notes: Published to W3C wiki                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Resources

### Official Resources

- [SocialCG Home](https://www.w3.org/community/socialcg/)
- [SocialCG Wiki](https://www.w3.org/wiki/SocialCG)
- [SocialCG Tools](https://www.w3.org/groups/cg/socialcg/tools/)
- [Meeting Minutes](https://www.w3.org/community/socialcg/2023/)

### Specifications

- [ActivityPub Spec](https://www.w3.org/TR/activitypub/)
- [ActivityStreams Core](https://www.w3.org/TR/activitystreams-core/)
- [ActivityStreams Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/)

### Community

- [ActivityPub Rocks](https://activitypub.rocks/)
- [SocialHub Forum](https://socialhub.activitypub.rocks/)
- [Social Web Foundation](https://socialwebfoundation.org/)

## History

### Social Web Working Group (2014-2018)

The Social Web Working Group was a formal W3C Working Group that:

- Developed ActivityPub from concept to specification
- Standardized ActivityStreams 2.0
- Published both as W3C Recommendations in 2018

Key participants included:
- Evan Prodromou (ActivityPub co-author)
- Christopher Lemmer Webber (ActivityPub co-author)
- Amy Guy (AS2 editor)
- James Snell (AS2 co-editor)

### Transition to Community Group

After the Working Group charter ended:

1. SocialCG was established to continue maintenance
2. Specifications became stable W3C Recommendations
3. Community-driven extensions through FEPs
4. Focus shifted to implementation support

## Next Steps

- **[FEPs](/docs/community/feps)** - Enhancement proposals
- **[Events](/docs/community/events)** - Community events
- **[Resources](/docs/community/resources)** - Developer resources
