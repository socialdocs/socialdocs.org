---
sidebar_position: 1
title: ActivityPub Overview
description: Understanding the ActivityPub protocol for federated social networking
---

# ActivityPub Overview

ActivityPub is a W3C Recommendation that defines a protocol for decentralized social networking. It provides both a client-to-server (C2S) API and a server-to-server (S2S) federation protocol.

## Specification

- **Status**: W3C Recommendation (January 2018)
- **URL**: [https://www.w3.org/TR/activitypub/](https://www.w3.org/TR/activitypub/)
- **Editors**: Christopher Lemmer Webber, Jessica Tallon, Erin Shepherd

## Two Protocols in One

ActivityPub defines two complementary protocols:

<svg viewBox="0 0 520 200" style={{maxWidth: '520px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="apGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="510" height="190" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="510" height="35" rx="12" fill="url(#apGrad)"/>
  <text x="260" y="28" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">ActivityPub</text>

  {/* Divider */}
  <line x1="260" y1="40" x2="260" y2="195" stroke="#6364FF" strokeWidth="1" opacity="0.3"/>

  {/* C2S */}
  <text x="132" y="60" textAnchor="middle" fill="#6364FF" fontSize="13" fontWeight="600">Client-to-Server (C2S)</text>
  <text x="30" y="85" fill="currentColor" fontSize="11" opacity="0.8">• User posts via app</text>
  <text x="30" y="105" fill="currentColor" fontSize="11" opacity="0.8">• Read inbox/outbox</text>
  <text x="30" y="125" fill="currentColor" fontSize="11" opacity="0.8">• Manage following</text>
  <text x="30" y="145" fill="currentColor" fontSize="11" opacity="0.8">• Like, share, reply</text>

  {/* S2S */}
  <text x="388" y="60" textAnchor="middle" fill="#6364FF" fontSize="13" fontWeight="600">Server-to-Server (S2S)</text>
  <text x="285" y="85" fill="currentColor" fontSize="11" opacity="0.8">• Server delivers to followers</text>
  <text x="285" y="105" fill="currentColor" fontSize="11" opacity="0.8">• Receive activities from others</text>
  <text x="285" y="125" fill="currentColor" fontSize="11" opacity="0.8">• Handle federation</text>
  <text x="285" y="145" fill="currentColor" fontSize="11" opacity="0.8">• Process remote activities</text>
</svg>

### Client-to-Server (C2S)

The C2S protocol defines how clients (apps) interact with servers:

- **POST to Outbox**: Submit activities the user wants to perform
- **GET from Inbox**: Read activities sent to the user
- **GET from Collections**: Read followers, following, likes

:::note
Most Fediverse software implements a custom REST API instead of C2S. The S2S protocol is universally implemented.
:::

### Server-to-Server (S2S)

The S2S protocol defines how servers federate:

- **POST to Inbox**: Deliver activities to remote users
- **GET Actor**: Fetch remote user profiles
- **GET Objects**: Fetch remote content

## Core Components

### 1. Actors

Every user or entity is represented as an Actor with:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "preferredUsername": "alice"
}
```

[Learn more about Actors →](/docs/specs/activitypub/actors)

### 2. Activities

Actions are represented as Activity objects:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "content": "Hello, world!"
  }
}
```

[Learn more about Activities →](/docs/specs/activitypub/activities)

### 3. Objects

Content is represented as Objects:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/1",
  "content": "Hello, world!",
  "attributedTo": "https://example.com/users/alice"
}
```

[Learn more about Objects →](/docs/specs/activitypub/objects)

### 4. Collections

Lists of items are represented as Collections:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/outbox",
  "totalItems": 42,
  "first": "https://example.com/users/alice/outbox?page=1"
}
```

[Learn more about Collections →](/docs/specs/activitypub/collections)

## Required Endpoints

### For All Actors

| Endpoint | Method | Description |
|----------|--------|-------------|
| Actor URL | GET | Returns the actor's profile |
| Inbox | POST | Receives activities from other servers |
| Outbox | GET | Returns activities by this actor |

### For C2S (Optional)

| Endpoint | Method | Description |
|----------|--------|-------------|
| Outbox | POST | Client submits new activities |
| Inbox | GET | Client reads incoming activities |

## Content Negotiation

ActivityPub uses content negotiation. Clients should:

**Request:**
```http
GET /users/alice HTTP/1.1
Accept: application/activity+json
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/activity+json

{ ... actor JSON ... }
```

Accepted media types:
- `application/activity+json`
- `application/ld+json; profile="https://www.w3.org/ns/activitystreams"`

## Addressing

Activities specify recipients using:

| Property | Purpose |
|----------|---------|
| `to` | Primary recipients (visible) |
| `cc` | Secondary recipients (visible) |
| `bto` | Private primary recipients |
| `bcc` | Private secondary recipients |
| `audience` | Additional context |

Special addresses:
- `https://www.w3.org/ns/activitystreams#Public` - Public visibility

## Security

ActivityPub relies on:

1. **HTTPS** - All URLs must use HTTPS
2. **HTTP Signatures** - Verify request authenticity
3. **Linked Data Signatures** - (Optional) Sign objects themselves

[Learn more about Security →](/docs/getting-started/authentication-and-security)

## Relationship to Other Specs

<svg viewBox="0 0 480 180" style={{maxWidth: '480px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="stackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  {/* ActivityPub layer */}
  <rect x="5" y="5" width="470" height="45" rx="8" fill="url(#stackGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="240" y="23" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">ActivityPub</text>
  <text x="240" y="40" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">(Federation Protocol)</text>

  {/* ActivityStreams layer */}
  <rect x="5" y="55" width="470" height="45" rx="8" fill="url(#stackGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="240" y="73" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="600">ActivityStreams 2.0</text>
  <text x="240" y="90" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">(Data Vocabulary)</text>

  {/* Bottom layer - 3 columns */}
  <rect x="5" y="105" width="153" height="45" rx="8" fill="url(#stackGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="82" y="123" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">WebFinger</text>
  <text x="82" y="140" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">(Discovery)</text>

  <rect x="163" y="105" width="154" height="45" rx="8" fill="url(#stackGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="240" y="123" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">HTTP Signatures</text>
  <text x="240" y="140" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">(Authentication)</text>

  <rect x="322" y="105" width="153" height="45" rx="8" fill="url(#stackGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="398" y="123" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">JSON-LD</text>
  <text x="398" y="140" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">(Linked Data)</text>
</svg>

## Common Extensions

The Fediverse has developed de facto extensions:

| Extension | Purpose | Used By |
|-----------|---------|---------|
| `sensitive` | Content warnings | Mastodon |
| `Emoji` | Custom emoji | Mastodon, Misskey |
| `PropertyValue` | Profile fields | Mastodon |
| `IdentityProof` | Identity verification | Keyoxide |
| `Hashtag` | Hashtag type | Most platforms |

## Implementation Status

| Platform | C2S | S2S |
|----------|-----|-----|
| Mastodon | ❌ | ✅ |
| Pleroma | ✅ | ✅ |
| Pixelfed | ❌ | ✅ |
| Lemmy | ❌ | ✅ |
| PeerTube | ❌ | ✅ |

## Next Steps

- **[Actors](/docs/specs/activitypub/actors)** - Deep dive into Actor objects
- **[Activities](/docs/specs/activitypub/activities)** - Activity types and handling
- **[Server-to-Server](/docs/specs/activitypub/server-to-server)** - Federation mechanics
- **[Building an Actor](/docs/guides/building-an-actor)** - Practical implementation
