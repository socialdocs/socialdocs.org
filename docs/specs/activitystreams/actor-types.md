---
sidebar_position: 5
title: Actor Types
description: Actor types in ActivityStreams 2.0 and ActivityPub
---

# Actor Types

Actors are the entities that perform activities in ActivityPub. They represent users, organizations, bots, and services that can create content and interact with others.

## Actor Types Overview

<svg viewBox="0 0 520 160" style={{maxWidth: '520px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="actorGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="510" height="150" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="510" height="32" rx="12" fill="url(#actorGrad2)"/>
  <text x="260" y="26" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">ACTOR TYPES</text>

  {/* Person */}
  <rect x="20" y="50" width="90" height="44" rx="6" fill="url(#actorGrad2)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="65" y="68" textAnchor="middle" fill="#6364FF" fontSize="12" fontWeight="600">Person</text>
  <text x="65" y="84" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">Human user</text>

  {/* Group */}
  <rect x="120" y="50" width="90" height="44" rx="6" fill="url(#actorGrad2)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="165" y="68" textAnchor="middle" fill="#6364FF" fontSize="12" fontWeight="600">Group</text>
  <text x="165" y="84" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">Communities</text>

  {/* Organization */}
  <rect x="220" y="50" width="90" height="44" rx="6" fill="url(#actorGrad2)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="265" y="68" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Organization</text>
  <text x="265" y="84" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">Business</text>

  {/* Application */}
  <rect x="320" y="50" width="90" height="44" rx="6" fill="url(#actorGrad2)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="365" y="68" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Application</text>
  <text x="365" y="84" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">Bots</text>

  {/* Service */}
  <rect x="420" y="50" width="90" height="44" rx="6" fill="url(#actorGrad2)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="465" y="68" textAnchor="middle" fill="#6364FF" fontSize="12" fontWeight="600">Service</text>
  <text x="465" y="84" textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.7">Automated</text>

  {/* Descriptions */}
  <text x="20" y="115" fill="currentColor" fontSize="10" opacity="0.8">👤 Person: Individual accounts</text>
  <text x="20" y="130" fill="currentColor" fontSize="10" opacity="0.8">👥 Group: Lemmy communities, PeerTube channels</text>
  <text x="20" y="145" fill="currentColor" fontSize="10" opacity="0.8">🤖 Application/Service: Bots, relays, system actors</text>
</svg>

## Person

Represents an individual human user.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "summary": "<p>Software developer and fediverse enthusiast</p>",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "followers": "https://example.com/users/alice/followers",
  "following": "https://example.com/users/alice/following",
  "liked": "https://example.com/users/alice/liked",
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/avatars/alice.png"
  },
  "image": {
    "type": "Image",
    "mediaType": "image/jpeg",
    "url": "https://example.com/headers/alice.jpg"
  },
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  },
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

**Used by:** All social platforms for user accounts

## Group

Represents a collection of actors, often used for communities.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Group",
  "id": "https://lemmy.example/c/technology",
  "preferredUsername": "technology",
  "name": "Technology",
  "summary": "<p>A community for tech discussion</p>",
  "inbox": "https://lemmy.example/c/technology/inbox",
  "outbox": "https://lemmy.example/c/technology/outbox",
  "followers": "https://lemmy.example/c/technology/followers",
  "attributedTo": [
    "https://lemmy.example/u/moderator1",
    "https://lemmy.example/u/moderator2"
  ],
  "publicKey": {
    "id": "https://lemmy.example/c/technology#main-key",
    "owner": "https://lemmy.example/c/technology",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

**Used by:**
- Lemmy (communities)
- PeerTube (channels)
- Groups in various platforms

## Organization

Represents a company, institution, or organization.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Organization",
  "id": "https://example.com/orgs/acme",
  "preferredUsername": "acme",
  "name": "ACME Corporation",
  "summary": "<p>Building better products</p>",
  "inbox": "https://example.com/orgs/acme/inbox",
  "outbox": "https://example.com/orgs/acme/outbox",
  "url": "https://acme.example.com",
  "publicKey": {
    "id": "https://example.com/orgs/acme#main-key",
    "owner": "https://example.com/orgs/acme",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

**Used by:** Business accounts, official accounts

## Application

Represents a software application, typically a bot.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Application",
  "id": "https://example.com/bots/newsbot",
  "preferredUsername": "newsbot",
  "name": "News Bot",
  "summary": "<p>Automated news aggregator</p>",
  "inbox": "https://example.com/bots/newsbot/inbox",
  "outbox": "https://example.com/bots/newsbot/outbox",
  "publicKey": {
    "id": "https://example.com/bots/newsbot#main-key",
    "owner": "https://example.com/bots/newsbot",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

**Used by:** Bots, automated accounts

## Service

Represents a service or daemon process.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Service",
  "id": "https://relay.example/actor",
  "preferredUsername": "relay",
  "name": "Fediverse Relay",
  "summary": "<p>ActivityPub relay service</p>",
  "inbox": "https://relay.example/inbox",
  "outbox": "https://relay.example/outbox",
  "publicKey": {
    "id": "https://relay.example/actor#main-key",
    "owner": "https://relay.example/actor",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

**Used by:** Relay servers, system accounts

## Required Actor Properties

All actors must have these properties for ActivityPub:

| Property | Description |
|----------|-------------|
| `id` | Unique, dereferenceable URL |
| `type` | One of the actor types |
| `inbox` | URL to receive activities |
| `outbox` | URL listing published activities |

## Recommended Actor Properties

| Property | Description |
|----------|-------------|
| `preferredUsername` | The @handle part |
| `name` | Display name |
| `summary` | Bio/description (HTML) |
| `url` | Profile page URL |
| `icon` | Avatar image |
| `image` | Header/banner image |
| `publicKey` | RSA public key for signatures |
| `endpoints.sharedInbox` | Shared inbox URL |
| `followers` | Followers collection URL |
| `following` | Following collection URL |

## Mastodon-Specific Properties

```json
{
  "type": "Person",
  "discoverable": true,
  "manuallyApprovesFollowers": false,
  "featured": "https://example.com/users/alice/collections/featured",
  "featuredTags": "https://example.com/users/alice/collections/tags",
  "movedTo": null,
  "alsoKnownAs": [],
  "attachment": [
    {
      "type": "PropertyValue",
      "name": "Website",
      "value": "<a href=\"https://alice.example\">alice.example</a>"
    }
  ]
}
```

| Property | Description |
|----------|-------------|
| `discoverable` | Show in directory/search |
| `manuallyApprovesFollowers` | Locked account |
| `featured` | Pinned posts collection |
| `featuredTags` | Featured hashtags |
| `movedTo` | Migration target |
| `alsoKnownAs` | Aliases for migration |
| `attachment` | Profile fields |

## Profile Fields

Mastodon uses `attachment` with `PropertyValue` type for profile fields:

```json
{
  "attachment": [
    {
      "type": "PropertyValue",
      "name": "Website",
      "value": "<a href=\"https://example.com\" rel=\"me\">example.com</a>"
    },
    {
      "type": "PropertyValue",
      "name": "Location",
      "value": "San Francisco"
    },
    {
      "type": "PropertyValue",
      "name": "Pronouns",
      "value": "she/her"
    }
  ]
}
```

## Public Key Structure

Required for HTTP Signatures:

```json
{
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
  }
}
```

| Property | Description |
|----------|-------------|
| `id` | Key identifier (actor URL + fragment) |
| `owner` | The actor who owns this key |
| `publicKeyPem` | PEM-encoded RSA public key |

## Instance Actor

Servers often have a special instance-level actor:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Application",
  "id": "https://example.com/actor",
  "preferredUsername": "example.com",
  "name": "Example Server",
  "summary": "<p>A Mastodon instance</p>",
  "inbox": "https://example.com/inbox",
  "outbox": "https://example.com/outbox",
  "publicKey": {
    "id": "https://example.com/actor#main-key",
    "owner": "https://example.com/actor",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

**Used for:**
- Sending Flag (report) activities
- Instance-level announcements
- Relay connections

## Actor Type Comparison

| Type | Use Case | Has Followers | Creates Content |
|------|----------|---------------|-----------------|
| Person | Users | Yes | Yes |
| Group | Communities | Yes | Redistributes |
| Organization | Companies | Yes | Yes |
| Application | Bots | Yes | Yes |
| Service | System | Sometimes | Sometimes |

## Content Negotiation

Actors must be served with correct content type based on Accept header:

```javascript
app.get('/users/:username', (req, res) => {
  const accept = req.headers.accept || '';

  if (accept.includes('application/activity+json') ||
      accept.includes('application/ld+json')) {
    res.type('application/activity+json');
    return res.json(getActor(req.params.username));
  }

  // Return HTML profile page
  res.render('profile', { username: req.params.username });
});
```

## Next Steps

- **[Link Types](/docs/specs/activitystreams/link-types)** - Link and Mention types
- **[Properties](/docs/specs/activitystreams/properties)** - All properties reference
- **[Building an Actor](/docs/guides/building-an-actor)** - Implementation guide
