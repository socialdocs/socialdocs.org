---
sidebar_position: 19
title: Bridges
description: Bridges connecting ActivityPub to other protocols
last_verified: 2026-10-15
verified_against: "fed.brid.gy/docs, Soapbox Mostr announcement, GitHub/GitLab repo APIs, FediDB (2026-10-15)"
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
| License | CC0-1.0 (public domain) |

Supported protocols:
- **Bluesky** (AT Protocol)
- **Web** (IndieWeb/Webmention)

Nostr is not supported; the [docs](https://fed.brid.gy/docs) say only that Farcaster and Nostr are being considered.

### How it works:

1. Users opt in on each side: fediverse users follow `@bsky.brid.gy@bsky.brid.gy`, Bluesky users follow `@ap.brid.gy` (blocking that account opts out)
2. Bridge creates proxy accounts
3. Only fully public posts are bridged — unlisted, followers-only posts and DMs never are

Handle formats and other interop details: [Big Platforms → Bridgy Fed](/docs/ecosystem/big-platforms#bridgy-fed).

## Protocol Bridges

### Bluesky (AT Protocol)

Bridgy Fed provides the primary bridge:

```
@handle@bsky.brid.gy        ← Bluesky user on the Fediverse (e.g. @snarfed.bsky.social@bsky.brid.gy)
user.instance.ap.brid.gy    ← Fediverse user on Bluesky (e.g. snarfed.indieweb.social.ap.brid.gy)
```

### Nostr

The main bridge between Nostr and the Fediverse is Mostr (Bridgy Fed does not support Nostr):

#### Mostr

Nostr–Fediverse bridge by Soapbox.

| Property | Value |
|----------|-------|
| Website | [mostr.pub](https://mostr.pub/) |
| Repository | [gitlab.com/soapbox-pub/mostr](https://gitlab.com/soapbox-pub/mostr) (active, October 2026) |
| Documentation | [Soapbox announcement](https://soapbox.pub/blog/mostr-fediverse-nostr-bridge/) |

How to find people, per the [announcement](https://soapbox.pub/blog/mostr-fediverse-nostr-bridge/):

```
Fediverse user on Nostr:  alex_at_gleasonator.com@mostr.pub   (NIP-05, via the wss://relay.mostr.pub relay)
Nostr user on Fediverse:  https://mostr.pub/users/<hex pubkey>  (search for this URL)
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

No bridge exists. [BirdsiteLive](https://github.com/NicolasConstant/BirdsiteLive), which mirrored Twitter accounts into the fediverse, has had no commits since March 2023.

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

