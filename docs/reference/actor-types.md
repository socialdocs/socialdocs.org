---
sidebar_position: 8
title: Actor Types
description: Reference for ActivityPub Actor types and their uses
---

# Actor Types

Actors are entities that can perform activities in the Fediverse.

## Core Actor Types

<svg viewBox="0 0 500 100" style={{maxWidth: '500px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="actorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.15}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.15}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="490" height="90" rx="10" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="490" height="30" rx="10" fill="url(#actorGrad)"/>
  <text x="250" y="26" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">Actor</text>

  {/* Actor types */}
  <rect x="15" y="45" width="90" height="40" rx="6" fill="url(#actorGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="60" y="70" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">Person</text>

  <rect x="115" y="45" width="90" height="40" rx="6" fill="url(#actorGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="160" y="70" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">Group</text>

  <rect x="215" y="45" width="90" height="40" rx="6" fill="url(#actorGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="260" y="70" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500">Service</text>

  <rect x="315" y="45" width="90" height="40" rx="6" fill="url(#actorGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="360" y="70" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500">Application</text>

  <rect x="415" y="45" width="75" height="40" rx="6" fill="url(#actorGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="452" y="70" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">Organization</text>
</svg>

## Person

Represents an individual user account.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/alice",
  "preferredUsername": "alice",
  "name": "Alice Smith",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox"
}
```

**Use Cases:** User accounts, personal profiles

## Group

Represents a collection of actors.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Group",
  "id": "https://example.com/groups/developers",
  "name": "Developer Community",
  "attributedTo": "https://example.com/users/admin"
}
```

**Use Cases:** Forums, communities, mailing lists (Lemmy, Friendica)

## Service

Represents an automated service or bot.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Service",
  "id": "https://example.com/bots/weather",
  "name": "Weather Bot",
  "summary": "Posts daily weather updates"
}
```

**Use Cases:** Bots, automated accounts, bridges

## Application

Represents a software application.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Application",
  "id": "https://example.com/apps/relay",
  "name": "Fediverse Relay"
}
```

**Use Cases:** Relay servers, aggregators

## Organization

Represents a formal organization.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Organization",
  "id": "https://example.com/orgs/acme",
  "name": "ACME Corporation"
}
```

**Use Cases:** Companies, nonprofits, institutions

## Comparison

| Type | Human | Automated | Collective |
|------|-------|-----------|------------|
| Person | ✓ | | |
| Group | | | ✓ |
| Service | | ✓ | |
| Application | | ✓ | |
| Organization | | | ✓ |

## Required Properties

All actors MUST have:

| Property | Description |
|----------|-------------|
| `id` | Unique URL identifier |
| `type` | One of the actor types |
| `inbox` | URL for receiving activities |
| `outbox` | URL for published activities |

## Common Optional Properties

| Property | Description |
|----------|-------------|
| `preferredUsername` | Handle without domain |
| `name` | Display name |
| `summary` | Bio/description (HTML allowed) |
| `icon` | Avatar image |
| `image` | Header/banner image |
| `publicKey` | For HTTP Signatures |

## Implementation Patterns

### Mastodon

Uses `Person` for users with bot flag:

```json
{
  "type": "Person",
  "manuallyApprovesFollowers": false,
  "discoverable": true
}
```

### Lemmy

Uses `Group` for communities:

```json
{
  "type": "Group",
  "name": "!programming@lemmy.ml",
  "moderators": ["..."]
}
```

## See Also

- **[Actor Properties](/docs/reference/actor-properties)**
- **[Building an Actor](/docs/guides/building-an-actor)**

