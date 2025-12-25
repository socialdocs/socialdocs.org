---
sidebar_position: 19
title: Bridges
description: Bridges connecting ActivityPub to other protocols
---

# Bridges

Bridges connect the Fediverse to other social networks and protocols.

## What Are Bridges?

Bridges translate between ActivityPub and other protocols, allowing users on different networks to interact.

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐
│  Mastodon   │◄───▶│  Bridge  │◄───▶│   Bluesky   │
│ (ActivityPub)│     │          │     │  (AT Proto) │
└─────────────┘     └──────────┘     └─────────────┘
```

## Active Bridges

### Bridgy Fed

Connects ActivityPub to multiple protocols.

| Property | Value |
|----------|-------|
| Website | [fed.brid.gy](https://fed.brid.gy/) |
| Repository | [github.com/snarfed/bridgy-fed](https://github.com/snarfed/bridgy-fed) |
| License | Public Domain |

Supported protocols:
- **Bluesky** (AT Protocol)
- **Nostr**
- **Web** (IndieWeb/Webmention)

### How it works:

1. User opts in via their profile
2. Bridge creates proxy accounts
3. Posts and interactions sync bidirectionally

### Matrix-ActivityPub

Bridges Matrix chat to ActivityPub.

| Property | Value |
|----------|-------|
| Status | Experimental |
| Use Case | Chat ↔ Social |

## Protocol Bridges

### Bluesky (AT Protocol)

Bridgy Fed provides the primary bridge:

```
@user@bsky.brid.gy ← Bluesky user on Fediverse
@user@ap.brid.gy   ← Fediverse user on Bluesky
```

### Nostr

Bridgy Fed also bridges Nostr:

```
npub...@mostr.pub ← Nostr user on Fediverse
```

### Twitter/X

No official bridge exists. Historical options:
- BirdsiteLive (discontinued)
- Self-hosted instances (legal concerns)

## Building a Bridge

### Architecture

```
┌─────────────────────────────────────────────────┐
│                    Bridge                       │
├─────────────────────────────────────────────────┤
│  Protocol A Adapter  │  Protocol B Adapter     │
│  - Receive activities│  - Receive messages     │
│  - Convert format    │  - Convert format       │
│  - Send to other side│  - Send to other side   │
└─────────────────────────────────────────────────┘
```

### Key Components

1. **Adapter per protocol** - Handle protocol specifics
2. **Mapping layer** - Convert between formats
3. **Identity management** - Map users across systems
4. **Queue** - Handle async delivery

### Example: Activity Mapping

```javascript
// ActivityPub Note → Other format
function mapNoteToOther(apNote) {
  return {
    id: generateId(),
    text: stripHtml(apNote.content),
    author: mapActor(apNote.attributedTo),
    timestamp: apNote.published,
    // Protocol-specific fields
  };
}

// Other format → ActivityPub Note
function mapOtherToNote(otherPost) {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Note",
    "content": escapeHtml(otherPost.text),
    "attributedTo": mapToActor(otherPost.author),
    "published": otherPost.timestamp
  };
}
```

## Considerations

### Identity

| Approach | Pros | Cons |
|----------|------|------|
| Proxy accounts | Seamless UX | Account pollution |
| Explicit opt-in | User consent | Friction |
| Domain-based | Clear ownership | Complex setup |

### Content Mapping

| Challenge | Solution |
|-----------|----------|
| Different character limits | Truncation/threading |
| Media format differences | Transcoding |
| Missing features | Graceful degradation |
| Reactions/likes | Map to closest equivalent |

### Privacy

- Users should explicitly opt in
- Respect block/mute across bridges
- Handle deletions appropriately
- Consider data residency

### Moderation

- How do reports work cross-protocol?
- Who handles abuse?
- Content policy alignment

## Self-Hosting

### Bridgy Fed

```bash
git clone https://github.com/snarfed/bridgy-fed
cd bridgy-fed
# Follow setup instructions
```

### Considerations

- Domain and SSL required
- Protocol-specific API access
- Storage for mapping data
- Rate limiting

## See Also

- **[Bridgy Fed](https://fed.brid.gy/)**
- **[Other Servers](/docs/ecosystem/other-servers)** (Relays section)
- **[SocialHub Forum](https://socialhub.activitypub.rocks/)**

