---
sidebar_position: 1
title: Fediverse Enhancement Proposals
description: The FEP process for extending ActivityPub and improving fediverse interoperability
last_verified: 2026-10-15
verified_against: "codeberg.org/fediverse/fep front matter and Implementations sections (2026-10-15), fep-xxxx-template.md, README.md, Mitra and Streams FEDERATION.md"
---

# Fediverse Enhancement Proposals (FEPs)

Fediverse Enhancement Proposals (FEPs) are documents that provide information to the Fediverse community. They propose new features, document best practices, and improve interoperability across the diverse services and communities that form the Fediverse.

## What is a FEP?

<svg viewBox="0 0 500 180" style={{maxWidth: '500px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="fepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="490" height="170" rx="10" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="490" height="26" rx="10" fill="url(#fepGrad)"/>
  <text x="250" y="23" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">FEP LIFECYCLE</text>

  {/* Draft */}
  <rect x="30" y="50" width="100" height="36" rx="6" fill="url(#fepGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="80" y="73" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">DRAFT</text>

  {/* Arrow to Final */}
  <line x1="130" y1="68" x2="170" y2="68" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="167,64 177,68 167,72" fill="#6364FF"/>

  {/* Final */}
  <rect x="180" y="50" width="100" height="36" rx="6" fill="#6364FF"/>
  <text x="230" y="73" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">FINAL</text>

  {/* Withdrawn */}
  <rect x="320" y="50" width="110" height="36" rx="6" fill="url(#fepGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="375" y="73" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">WITHDRAWN</text>

  {/* Arrows from Draft */}
  <path d="M 80 86 L 80 105 L 200 105" fill="none" stroke="#6364FF" strokeWidth="1.5" strokeDasharray="4,2"/>
  <path d="M 80 105 L 340 105" fill="none" stroke="#6364FF" strokeWidth="1.5" strokeDasharray="4,2"/>
  <polygon points="200,101 200,109 210,105" fill="#6364FF"/>
  <polygon points="337,101 337,109 347,105" fill="#6364FF"/>

  {/* Labels */}
  <text x="30" y="140" fill="currentColor" fontSize="10"><tspan fontWeight="500">DRAFT</tspan> - Under discussion</text>
  <text x="30" y="158" fill="currentColor" fontSize="10"><tspan fontWeight="500">FINAL</tspan> - Accepted specification</text>
  <text x="260" y="140" fill="currentColor" fontSize="10"><tspan fontWeight="500">WITHDRAWN</tspan> - No longer maintained</text>
</svg>

A FEP can:
- Propose a new feature or extension
- Document implementation best practices
- Describe interoperability requirements
- Define vocabulary extensions

## FEP Repository

The official FEP repository is hosted on Codeberg:

- **Repository**: [codeberg.org/fediverse/fep](https://codeberg.org/fediverse/fep)
- **Discussion**: [SocialHub Forum](https://socialhub.activitypub.rocks/c/standards/fep/54)
- **Web View**: [fep.swf.pub](http://fep.swf.pub/)

## Key FEPs

### Core Process

| FEP | Title | Status |
|-----|-------|--------|
| FEP-a4ed | The Fediverse Enhancement Proposal Process | FINAL |
| FEP-67ff | FEDERATION.md | FINAL |
| FEP-d9ad | Create Conformance Tests for Fediverse Enhancement Proposals | DRAFT |

### Federation & Discovery

| FEP | Title | Status |
|-----|-------|--------|
| FEP-d556 | Server-Level Actor Discovery Using WebFinger | FINAL |
| FEP-0151 | NodeInfo in Fediverse Software (2025 edition) | FINAL (March 2026) |
| FEP-f1d5 | NodeInfo in Fediverse Software | FINAL (superseded by FEP-0151) |
| FEP-8fcf | Followers collection synchronization across servers | FINAL |
| FEP-ae0c | Fediverse Relay Protocols: Mastodon and LitePub | FINAL |
| FEP-7628 | Move Actor | FINAL (August 2026) |

### Groups & Collections

| FEP | Title | Status |
|-----|-------|--------|
| FEP-1b12 | Group Federation | FINAL |
| FEP-400e | Publicly-appendable ActivityPub Collections | FINAL |
| FEP-e232 | Object Links | FINAL |

### Security

| FEP | Title | Status |
|-----|-------|--------|
| FEP-521a | Representing Actor's Public Keys | FINAL |

### Notable Drafts in Production

These are still DRAFT status but already shape real-world interop (as of October 2026):

| FEP | Title | Who implements it |
|-----|-------|-------------------|
| [FEP-044f](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md) | Consent-respecting quote posts (`QuoteRequest`/`QuoteAuthorization`, `canQuote`) | Mastodon 4.5+. GoToSocial (0.22.2) publishes a self-only `canQuote` but does not support quotes |
| [FEP-dd4b](https://codeberg.org/fediverse/fep/src/branch/main/fep/dd4b/fep-dd4b.md) | Quote Posts — alternative `Announce`-based approach | Proposal stage |
| [FEP-8b32](https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md) | Object Integrity Proofs — self-authenticating activities | Mitra, Streams, Vervis, Hubzilla; Mastodon 4.7+ (verification) |
| [FEP-7888](https://codeberg.org/fediverse/fep/src/branch/main/fep/7888/fep-7888.md) | Demystifying the `context` property — conversation grouping | NodeBB, Streams |
| [FEP-171b](https://codeberg.org/fediverse/fep/src/branch/main/fep/171b/fep-171b.md) | Conversation Containers — moderated conversation collections | Streams, Forte, Hubzilla, Mitra (private conversations) |
| [FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md) | Featuring recommendations using a dedicated collection (Mastodon's "Collections") — curated, opt-in account collections | Mastodon 4.6+ |
| [FEP-8967](https://codeberg.org/fediverse/fep/src/branch/main/fep/8967/fep-8967.md) | Generating link previews for attached links (`Link` objects in `attachment`) | Mastodon 4.7+ |
| [FEP-ef61](https://codeberg.org/fediverse/fep/src/branch/main/fep/ef61/fep-ef61.md) | Portable Objects — server-independent IDs for nomadic identity | Streams, Forte, Mitra (gateway only) |

:::note Vendor drafts
Some FEPs start life in a vendor's own repository — FEP-7aa9 (Mastodon's Collections) was first published by Mastodon and submitted to the canonical FEP repo in June 2026. Check the [FEP repository](https://codeberg.org/fediverse/fep) for current status.
:::

## FEP Identifiers

FEP identifiers are computed from the proposal title using the first 4 hex digits of the SHA-256 hash:

```bash
# Generate a FEP identifier
echo -n "The Fediverse Enhancement Proposal Process" | sha256sum | cut -c1-4
# Output: a4ed
```

This ensures unique, deterministic identifiers while avoiding manual numbering conflicts.

## Creating a FEP

### 1. Draft Your Proposal

Start from the repository's [`fep-xxxx-template.md`](https://codeberg.org/fediverse/fep/src/branch/main/fep-xxxx-template.md). Its outline looks like this:

```markdown
---
slug: "xxxx"
authors: Your Name <your@email.example>
status: DRAFT
dateReceived: 2026-10-15
discussionsTo: https://socialhub.activitypub.rocks/t/your-topic
---

# FEP-xxxx: Your Proposal Title

## Summary

Brief description of what this FEP proposes.

## Requirements

The key words "MUST", "SHOULD", "MAY" are to be interpreted as
described in RFC 2119.

## Proposal

Detailed description of the proposal...

## Security Considerations

Security implications of this proposal...

## Implementations

List of implementations supporting this FEP...

## References

- [Reference 1](https://example.com)
```

### 2. Submit a Pull Request

Fork [fediverse/fep](https://codeberg.org/fediverse/fep) on Codeberg, then:

```bash
git clone https://codeberg.org/your-username/fep
cd fep

# Your id is the first 4 hex digits of sha256(title)
mkdir fep/xxxx
cp fep-xxxx-template.md fep/xxxx/fep-xxxx.md

git checkout -b fep-xxxx
git add fep/xxxx
git commit -m "Add FEP-xxxx: Your Proposal Title"
git push origin fep-xxxx
# then open a pull request on Codeberg
```

### 3. Discussion Period

Within seven days a facilitator reviews the submission. If accepted it gets status `DRAFT`, a tracking issue and a `trackingIssue` attribute. While it is a draft:
1. Start a discussion (usually on [SocialHub](https://socialhub.activitypub.rocks/c/standards/fep/54)) and collect feedback
2. Submit updates; changes from non-authors need an author's approval

### 4. Finalization

After **at least 60 days**, the authors may request final comments. If there are no community objections within **14 days** and the authors have built enough awareness and discussion, a facilitator sets the status to `FINAL`. A FINAL FEP can only receive minor corrections; substantial changes need a new FEP with a `replaces` attribute. Drafts with no updates for 2 years are set to `WITHDRAWN`. ([FEP-a4ed](https://codeberg.org/fediverse/fep/src/branch/main/fep/a4ed/fep-a4ed.md))

## FEP Governance

### Facilitators

The FEP process is managed by facilitators listed in [`FACILITATORS.md`](https://codeberg.org/fediverse/fep/src/branch/main/FACILITATORS.md) — "neutral custodians of the FEP process, who merge PR's and create tracking issues".

### DoOcracy

The FEP README describes the SocialHub developer community as a "DoOcracy":
> pick up any task you want, and then steer it to completion

This means anyone can:
- Propose new FEPs
- Review and comment on proposals
- Implement FEPs in their software
- Help maintain the process

## Reading FEPs

### Understanding Status

- **DRAFT**: Work in progress, may change significantly
- **FINAL**: Stable specification, suitable for implementation
- **WITHDRAWN**: Withdrawn by its authors, or inactive for 2 years; can be resubmitted

### Implementation Notes

There is no general way to detect from an object's `@context` which FEPs it follows. Each FEP defines its own properties (and sometimes context terms); detect support by checking for those properties — e.g. a `tag` entry of type `Link` with `mediaType` set to the ActivityStreams type for FEP-e232 Object Links — and fall back gracefully when they are absent. Servers can advertise implemented FEPs in a `FEDERATION.md` file ([FEP-67ff](https://codeberg.org/fediverse/fep/src/branch/main/fep/67ff/fep-67ff.md)).

## Notable Draft FEPs

These drafts are actively being developed:

| FEP | Title | Description |
|-----|-------|-------------|
| FEP-c390 | Identity Proofs | Cryptographic identity verification |
| FEP-4adb | Dereferencing identifiers with webfinger | Enhanced actor discovery |
| FEP-e3e9 | Actor-Relative URLs | Stable URLs relative to an actor, for portability |
| FEP-8b32 | Object Integrity Proofs | Content authenticity |

## Relationship to Standards

<svg viewBox="0 0 480 260" style={{maxWidth: '480px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="stdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="470" height="250" rx="10" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="470" height="26" rx="10" fill="url(#stdGrad)"/>
  <text x="240" y="23" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">STANDARDS HIERARCHY</text>

  {/* W3C Layer */}
  <rect x="25" y="45" width="430" height="55" rx="6" fill="#6364FF"/>
  <text x="240" y="65" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">W3C Recommendations</text>
  <text x="240" y="82" textAnchor="middle" fill="white" fontSize="10" opacity="0.9">ActivityPub • ActivityStreams 2.0</text>

  {/* Arrow */}
  <line x1="240" y1="100" x2="240" y2="115" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="237,112 240,122 243,112" fill="#6364FF"/>

  {/* FEP Layer */}
  <rect x="25" y="125" width="430" height="55" rx="6" fill="url(#stdGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="240" y="145" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Fediverse Enhancement Proposals</text>
  <text x="240" y="162" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.9">Extensions • Interoperability • Best practices</text>

  {/* Arrow */}
  <line x1="240" y1="180" x2="240" y2="195" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="237,192 240,202 243,192" fill="#6364FF"/>

  {/* Implementation Layer */}
  <rect x="25" y="205" width="430" height="40" rx="6" fill="url(#stdGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="240" y="222" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="600">Implementation-Specific Extensions</text>
  <text x="240" y="238" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.8">Mastodon (toot:) • Lemmy (lemmy:) • Others</text>
</svg>

FEPs bridge the gap between W3C specifications and implementation-specific extensions, providing community-driven standards.

## Resources

- [FEP Repository](https://codeberg.org/fediverse/fep)
- [SocialHub Forum](https://socialhub.activitypub.rocks/c/standards/fep/54)
- [FEP Process (FEP-a4ed)](https://codeberg.org/fediverse/fep/src/branch/main/fep/a4ed/fep-a4ed.md)
- [Social Web Foundation](https://socialwebfoundation.org/)

## Next Steps

- **[SocialCG](/docs/community/socialcg)** - W3C Community Group
- **[Quote Posts and Interaction Policies](/docs/guides/quote-posts-and-interaction-policies)** - FEP-044f and FEP-7aa9 in practice
- **[Events](/docs/community/events)** - Fediverse conferences
- **[Resources](/docs/community/resources)** - Developer resources
