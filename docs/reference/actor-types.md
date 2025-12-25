---
sidebar_position: 8
title: Actor Types
description: Reference for ActivityPub Actor types and their uses
---

# Actor Types

Actors are entities that can perform activities in the Fediverse.

## Core Actor Types

```
┌─────────────────────────────────────────────────────┐
│                     Actor                           │
├──────────┬──────────┬───────────┬──────────┬───────┤
│  Person  │  Group   │  Service  │ Applica- │ Organ-│
│          │          │           │  tion    │ ization│
└──────────┴──────────┴───────────┴──────────┴───────┘
```

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

