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

Two main bridges connect Nostr to the Fediverse:

#### Mostr

Native Nostr-Fediverse bridge by Soapbox.

| Property | Value |
|----------|-------|
| Website | [mostr.pub](https://mostr.pub/) |
| Documentation | [soapbox.pub/blog/mostr-fediverse-nostr-bridge](https://soapbox.pub/blog/mostr-fediverse-nostr-bridge/) |
| Status | Active |

How it works:
- Nostr users appear as `npub...@mostr.pub` on the Fediverse
- Fediverse users can follow Nostr accounts directly
- Posts sync bidirectionally
- Uses Nostr relays for message transport

```
Nostr user:     npub1abc...@mostr.pub
Fediverse user: @alice@mastodon.social (follow npub via mostr.pub)
```

#### Bridgy Fed (Nostr)

Bridgy Fed also supports Nostr alongside Bluesky and IndieWeb:

```
npub...@nostr.brid.gy ← Nostr user on Fediverse
```

#### Identity Linking (Alternative to Bridging)

Instead of bridging content, you can link identities across protocols using `alsoKnownAs`:

```json
{
  "type": "Person",
  "id": "https://example.com/alice#me",
  "alsoKnownAs": ["did:nostr:abc123..."]
}
```

This approach (used by [Fedbox](/docs/ecosystem/fedbox)) declares "I am the same person on both networks" without duplicating content. Users can then choose which protocol to interact with you on.

See the [did:nostr spec](https://nostrcg.github.io/did-nostr/) for the DID format.

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

