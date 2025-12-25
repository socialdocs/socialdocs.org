---
sidebar_position: 1
title: Fediverse Enhancement Proposals
description: The FEP process for extending ActivityPub and improving fediverse interoperability
---

# Fediverse Enhancement Proposals (FEPs)

Fediverse Enhancement Proposals (FEPs) are documents that provide information to the Fediverse community. They propose new features, document best practices, and improve interoperability across the diverse services and communities that form the Fediverse.

## What is a FEP?

```
┌────────────────────────────────────────────────────────────┐
│                   FEP LIFECYCLE                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│  │  DRAFT  │───▶│  FINAL  │    │WITHDRAWN│               │
│  └─────────┘    └─────────┘    └─────────┘               │
│       │              ▲              ▲                     │
│       │              │              │                     │
│       └──────────────┴──────────────┘                     │
│                                                            │
│  DRAFT     - Under discussion and development             │
│  FINAL     - Accepted specification                        │
│  WITHDRAWN - No longer maintained                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

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
| FEP-f1d5 | NodeInfo in Fediverse Software | FINAL |
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

```
┌────────────────────────────────────────────────────────────┐
│                 STANDARDS HIERARCHY                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  W3C Recommendations                                       │
│  ├── ActivityPub (W3C REC)                                │
│  └── ActivityStreams 2.0 (W3C REC)                        │
│       │                                                    │
│       ▼                                                    │
│  Fediverse Enhancement Proposals                          │
│  ├── Extensions to ActivityPub                            │
│  ├── Interoperability requirements                        │
│  └── Best practices                                        │
│       │                                                    │
│       ▼                                                    │
│  Implementation-Specific Extensions                        │
│  ├── Mastodon (toot: namespace)                           │
│  ├── Lemmy (lemmy: namespace)                             │
│  └── Others                                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

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
