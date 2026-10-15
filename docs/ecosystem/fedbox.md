---
sidebar_position: 9
title: Fedbox
description: ActivityPub implementation details for Fedbox
---

# Fedbox

Fedbox is a minimal, single-user ActivityPub server with Solid-compatible WebID support.

:::note Disclosure
Fedbox and the [microfed](/docs/ecosystem/javascript-libraries#microfed) library it is built on are written by the maintainer of SocialDocs.
:::

:::danger Experimental — not for production
Fedbox is an early experiment (npm 0.0.10, December 2025). As of that release its inbox **logs a failed or missing HTTP signature but still processes the activity**, so anyone can forge activities to it. It signs with draft-cavage only. Use it to explore identity ideas (WebID, `did:nostr`), not to run a public account.
:::

:::info Not FedBOX (go-ap)
This page is about the Node.js **Fedbox** (`npm install fedbox`, [micro-fed/fedbox](https://github.com/micro-fed/fedbox)). It is unrelated to **[FedBOX](https://github.com/go-ap/fedbox)**, the Go reference server of the [go-ap](/docs/ecosystem/go-libraries#go-ap) project by Marius Orcsik.
:::

## Overview

| Property | Value |
|----------|-------|
| Language | JavaScript (Node.js) |
| Database | SQLite |
| License | MIT |
| Repository | [github.com/micro-fed/fedbox](https://github.com/micro-fed/fedbox) |
| npm | [npmjs.com/package/fedbox](https://www.npmjs.com/package/fedbox) |
| Latest release | 0.0.10 (2025-12-26) |
| Status | Experimental |

## Key Features

- **Zero to Fediverse in 60 seconds** - Quick CLI setup
- **Solid-compatible WebIDs** - `/alice#me` fragment identifiers
- **Profile/AP separation** - Decouple identity from federation
- **Web UI editing** - Inline profile editing with avatar upload
- **Nostr identity** - Link via `did:nostr` in `alsoKnownAs`
- **Minimal resources** - SQLite, single process

## Quick Start

```bash
# Install globally
npm install -g fedbox

# Initialize identity
fedbox init

# Start server
fedbox start

# Or run profile-only server
fedbox profile
```

## ActivityPub Implementation

### Actor Type (Solid-compatible WebID)

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://example.com/alice#me",
  "url": "https://example.com/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "summary": "<p>Hello!</p>",
  "inbox": "https://example.com/alice/inbox",
  "outbox": "https://example.com/alice/outbox",
  "followers": "https://example.com/alice/followers",
  "following": "https://example.com/alice/following",
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  },
  "alsoKnownAs": ["did:nostr:124c0fa9..."],
  "icon": {
    "type": "Image",
    "mediaType": "image/jpeg",
    "url": "https://example.com/public/avatar.jpg"
  },
  "publicKey": {
    "id": "https://example.com/alice#main-key",
    "owner": "https://example.com/alice#me",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

Note the Solid-compatible URI structure:
- `/alice` - Profile document (HTML with JSON-LD)
- `/alice#me` - WebID (the Person/Actor)

### Note

```json
{
  "type": "Note",
  "id": "https://example.com/alice/posts/1703001234567",
  "attributedTo": "https://example.com/alice#me",
  "content": "<p>Hello from Fedbox!</p>",
  "published": "2024-12-19T12:00:00.000Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/alice/followers"]
}
```

## Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Notes |
| Follow | ✅ | Auto-accept |
| Accept | ✅ | Follow acceptance |
| Undo | ✅ | Unfollow |
| Like | ⚠️ | Receive only |
| Announce | ⚠️ | Receive only |
| Delete | ❌ | Not handled |

## Separated Architecture

Fedbox supports separating **identity** (profile) from **federation** (AP server):

```
Profile Server (static host)         AP Server (fedbox)
───────────────────────────          ─────────────────
https://me.example.com               https://fedbox.example.com
    /alice                               /alice/inbox
    /alice#me  ──points to──►            /alice/outbox
                                         /alice/followers
```

### Profile-only Configuration

```json
{
  "username": "alice",
  "displayName": "Alice",
  "summary": "My bio",
  "apServer": "https://fedbox.example.com",
  "nostrPubkey": "124c0fa99407182..."
}
```

The profile can be hosted on GitHub Pages, S3, or any static server.

### Remote Profile via Data Island

Fedbox can fetch identity from a static HTML page with embedded JSON-LD:

```json
{
  "username": "alice",
  "profileUrl": "https://me.example.com/alice",
  "domain": "fedbox.example.com"
}
```

Fedbox extracts the `<script type="application/ld+json">` data island, merges with local AP endpoints, and serves with proper content negotiation.

## Nostr Identity

Link your Nostr pubkey (64-char hex):

```json
{
  "nostrPubkey": "124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2"
}
```

This adds to the actor:

```json
{
  "alsoKnownAs": ["did:nostr:124c0fa99407182ece5a24fad9b7f6674902fc422843d3128d38a0afbee0fdd2"]
}
```

Following the [did:nostr spec](https://nostrcg.github.io/did-nostr/).

## API Endpoints

### Discovery

```
GET /.well-known/webfinger?resource=acct:alice@example.com
GET /.well-known/nodeinfo
GET /nodeinfo/2.1
```

### Actor & Collections

```
GET /{username}              # Profile (HTML or JSON-LD)
GET /{username}#me           # WebID (Actor)
POST /{username}/inbox       # Receive activities
GET /{username}/outbox       # Published activities
GET /{username}/followers    # Follower collection
GET /{username}/following    # Following collection
GET /{username}/posts/{id}   # Individual post
```

### Shared Inbox

```
POST /inbox
```

### Profile Editing

```
POST /{username}/edit        # Update profile (multipart form)
```

## CLI Commands

```bash
# Setup
fedbox init             # Create identity with keypair
fedbox start            # Start full AP server
fedbox profile [port]   # Start profile-only server
fedbox status           # Show configuration

# Social
fedbox post "text"      # Create a post
fedbox follow @user@domain   # Follow someone
fedbox timeline         # View incoming posts
fedbox reply <url> "text"    # Reply to a post
fedbox posts            # View your posts

# Maintenance
fedbox clean            # Remove database
fedbox clean --all      # Remove all data
```

## Configuration

`fedbox.json`:

```json
{
  "username": "alice",
  "displayName": "Alice",
  "summary": "Hello!",
  "port": 3000,
  "domain": "example.com",
  "apServer": null,
  "nostrPubkey": null,
  "avatar": "avatar.jpg",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "privateKey": "-----BEGIN PRIVATE KEY-----..."
}
```

| Field | Description |
|-------|-------------|
| `domain` | Public domain for federation |
| `apServer` | External AP server URL (separated mode) |
| `profileUrl` | Remote HTML profile URL (extracts JSON-LD data island) |
| `nostrPubkey` | 64-char hex Nostr pubkey |
| `avatar` | Avatar filename in `public/` |

## Built on microfed

Fedbox uses [microfed](https://github.com/micro-fed/microfed.org) for ActivityPub primitives:

- Profile generation
- HTTP Signature signing/verification
- WebFinger resolution
- Activity creation and delivery

## Interoperability

### With Mastodon

Fedbox implements WebFinger, Follow/Accept and post delivery, but its interoperability has not been independently tested. Remember that its inbox does not reject unsigned requests.

### With Solid

- ✅ WebID at `#me` fragment
- ✅ JSON-LD profile document
- ✅ Content negotiation (HTML/JSON-LD)

### With Nostr

- ✅ `did:nostr` in `alsoKnownAs`
- ✅ Hex pubkey linking (64-char)
- ✅ Cross-protocol identity

## See Also

- **[microfed](https://github.com/micro-fed/microfed.org)** - Underlying AP library
- **[did:nostr spec](https://nostrcg.github.io/did-nostr/)** - Nostr DID method
- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)**
