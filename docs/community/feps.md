---
sidebar_position: 1
title: Fediverse Enhancement Proposals
description: The FEP process for extending ActivityPub and improving fediverse interoperability
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
| FEP-d9ad | Test Cases for FEPs | DRAFT |

### Federation & Discovery

| FEP | Title | Status |
|-----|-------|--------|
| FEP-d556 | Server-Level Actor Discovery Using WebFinger | FINAL |
| FEP-0151 | NodeInfo in Fediverse Software (2025 edition) | FINAL (March 2026) |
| FEP-f1d5 | NodeInfo in Fediverse Software | FINAL (superseded by FEP-0151) |
| FEP-8fcf | Followers Collection Synchronization | FINAL |
| FEP-ae0c | Fediverse Relay Protocols | FINAL |

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

These are still DRAFT status but already shape real-world interop (as of mid-2026):

| FEP | Title | Who implements it |
|-----|-------|-------------------|
| [FEP-044f](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md) | Consent-respecting quote posts (`QuoteRequest`/`QuoteAuthorization`, `canQuote`) | Mastodon 4.5+ (full), GoToSocial 0.21 (partial) |
| [FEP-dd4b](https://codeberg.org/fediverse/fep/src/branch/main/fep/dd4b/fep-dd4b.md) | Quote Posts — alternative `Announce`-based approach | Proposal stage |
| [FEP-8b32](https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md) | Object Integrity Proofs — self-authenticating activities | Mitra, Streams |
| [FEP-7888](https://codeberg.org/fediverse/fep/src/branch/main/fep/7888/fep-7888.md) | Demystifying the `context` property — conversation grouping | NodeBB, Streams, Mitra |
| [FEP-171b](https://codeberg.org/fediverse/fep/src/branch/main/fep/171b/fep-171b.md) | Conversation Containers — moderated conversation collections | Streams |
| [FEP-ef61](https://codeberg.org/fediverse/fep/src/branch/main/fep/ef61/fep-ef61.md) | Portable Objects — server-independent IDs for nomadic identity | Mitra, Streams lineage |

:::note Vendor drafts
Mastodon 4.6's collections feature is based on "FEP-7aa9 (Featured Collections)" — but as of mid-2026 that draft lives in [Mastodon's own repository](https://github.com/mastodon/featured_collections) and has not been submitted to the canonical FEP repo. Vendor-published drafts can become FEPs later; check the [FEP repository](https://codeberg.org/fediverse/fep) for current status.
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

Create a markdown file following this template:

```markdown
---
slug: "xxxx"
authors: Your Name <your@email.example>
status: DRAFT
dateReceived: 2024-01-15
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

```bash
# Fork the repository
git clone https://codeberg.org/your-username/fep
cd fep

# Create your FEP directory
mkdir fep/xxxx
cp template.md fep/xxxx/fep-xxxx.md

# Submit pull request
git add .
git commit -m "Add FEP-xxxx: Your Proposal Title"
git push origin main
```

### 3. Discussion Period

Once submitted:
1. Create a discussion topic on [SocialHub](https://socialhub.activitypub.rocks/c/standards/fep/54)
2. Engage with community feedback
3. Update the FEP based on discussions

### 4. Finalization

After sufficient discussion and implementation:
1. Request status change to FINAL
2. Facilitators review and merge
3. FEP becomes a stable specification

## FEP Governance

### Facilitators

The FEP process is managed by facilitators listed in `FACILITATORS.md`. Their role is:
- Merge pull requests
- Create tracking issues
- Remain neutral on proposals
- Ensure process compliance

### DoOcracy

The FEP community operates as a "DoOcracy":
> Pick up any task you want, and steer it to completion.

This means anyone can:
- Propose new FEPs
- Review and comment on proposals
- Implement FEPs in their software
- Help maintain the process

## Reading FEPs

### Understanding Status

- **DRAFT**: Work in progress, may change significantly
- **FINAL**: Stable specification, suitable for implementation
- **WITHDRAWN**: No longer maintained (may be replaced)

### Implementation Notes

When implementing a FEP:

```javascript
// Check if an activity uses a FEP extension
function supportsFEP(object, fepId) {
  const context = object['@context'];

  if (Array.isArray(context)) {
    return context.some(ctx =>
      typeof ctx === 'object' && ctx.fep === `https://w3id.org/fep/${fepId}`
    );
  }

  return false;
}

// Example: Check for FEP-e232 Object Links
if (supportsFEP(activity, 'e232')) {
  // Process object links according to FEP-e232
}
```

## Notable Draft FEPs

These drafts are actively being developed:

| FEP | Title | Description |
|-----|-------|-------------|
| FEP-c390 | Identity Proofs | Cryptographic identity verification |
| FEP-4adb | Dereferencing identifiers with webfinger | Enhanced actor discovery |
| FEP-e3e9 | Conversation Threads | Improved reply threading |
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
- **[Events](/docs/community/events)** - Fediverse conferences
- **[Resources](/docs/community/resources)** - Developer resources
