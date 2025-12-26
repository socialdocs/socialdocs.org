---
sidebar_position: 2
title: Core Concepts
description: Understanding Actors, Activities, Objects, and Collections in ActivityPub
---

# Core Concepts

Before diving into implementation, you need to understand the fundamental building blocks of ActivityPub. Everything in the protocol revolves around four core concepts: **Actors**, **Activities**, **Objects**, and **Collections**.

## The ActivityPub Model

<svg viewBox="0 0 520 320" style={{maxWidth: '520px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.15}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.15}}/>
    </linearGradient>
  </defs>

  {/* Main container */}
  <rect x="10" y="10" width="500" height="300" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>

  {/* Header */}
  <rect x="10" y="10" width="500" height="45" rx="12" fill="url(#boxGrad)"/>
  <path d="M10 43 L510 43" stroke="#6364FF" strokeWidth="1" opacity="0.3"/>
  <text x="260" y="30" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="700">ACTOR</text>
  <text x="260" y="48" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">(Person, Organization, Application, Service, Group)</text>

  {/* Actor box */}
  <rect x="40" y="90" width="100" height="45" rx="8" fill="url(#boxGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="90" y="118" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Actor</text>

  {/* Activity box */}
  <rect x="250" y="90" width="100" height="45" rx="8" fill="url(#boxGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="300" y="118" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Activity</text>

  {/* Object box */}
  <rect x="250" y="200" width="100" height="45" rx="8" fill="url(#boxGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="300" y="228" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Object</text>

  {/* Arrows */}
  <line x1="140" y1="112" x2="245" y2="112" stroke="#6364FF" strokeWidth="2" markerEnd="url(#arrowhead)"/>
  <text x="192" y="105" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">performs</text>
  <polygon points="245,109 255,112 245,115" fill="#6364FF"/>

  <line x1="300" y1="135" x2="300" y2="195" stroke="#6364FF" strokeWidth="2"/>
  <text x="320" y="168" fill="currentColor" fontSize="11" opacity="0.7">targets</text>
  <polygon points="297,195 300,205 303,195" fill="#6364FF"/>

  {/* Collections bar */}
  <rect x="40" y="260" width="440" height="40" rx="8" fill="url(#boxGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="260" y="275" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">Collections</text>
  <text x="260" y="292" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">inbox  •  outbox  •  followers  •  following  •  liked</text>
</svg>

## Actors

An **Actor** is any entity that can perform activities. In social networking terms, actors are typically users, but they can also be bots, organizations, or services.

### Actor Types

| Type | Description | Example |
|------|-------------|---------|
| `Person` | A human user | `@alice@example.com` |
| `Organization` | A company or group | `@acme-corp@example.com` |
| `Application` | A bot or automated service | `@weather-bot@example.com` |
| `Service` | A software service | `@relay@example.com` |
| `Group` | A shared actor for communities | `@developers@example.com` |

### Actor Properties

Every actor has these essential properties:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "followers": "https://example.com/users/alice/followers",
  "following": "https://example.com/users/alice/following",
  "preferredUsername": "alice",
  "name": "Alice Smith",
  "summary": "Software developer and Fediverse enthusiast",
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

### Required Actor Endpoints

| Endpoint | Purpose |
|----------|---------|
| `inbox` | Receives incoming activities from other servers |
| `outbox` | Contains activities performed by this actor |

### Optional Actor Endpoints

| Endpoint | Purpose |
|----------|---------|
| `followers` | Collection of actors following this actor |
| `following` | Collection of actors this actor follows |
| `liked` | Collection of objects this actor has liked |

## Activities

An **Activity** represents an action. When an actor does something — posts a message, follows someone, likes a post — that action is represented as an Activity.

### Common Activity Types

| Activity | Description | Example |
|----------|-------------|---------|
| `Create` | Create new content | Posting a new status |
| `Update` | Modify existing content | Editing a post |
| `Delete` | Remove content | Deleting a post |
| `Follow` | Subscribe to an actor | Following a user |
| `Accept` | Accept a request | Accepting a follow request |
| `Reject` | Reject a request | Rejecting a follow request |
| `Like` | Express appreciation | Liking a post |
| `Announce` | Share content | Boosting/reblogging |
| `Undo` | Reverse an activity | Unfollowing, unliking |

### Activity Structure

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://example.com/activities/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/1",
    "content": "Hello, Fediverse!"
  },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Activity Properties

| Property | Required | Description |
|----------|----------|-------------|
| `type` | Yes | The type of activity |
| `actor` | Yes | Who performed the activity |
| `object` | Usually | The target of the activity |
| `to` | No | Primary recipients |
| `cc` | No | Secondary recipients |
| `bto` | No | Private primary recipients |
| `bcc` | No | Private secondary recipients |

## Objects

An **Object** represents content or things that activities act upon. The most common objects are content types like notes, articles, and images.

### Common Object Types

| Type | Description | Use Case |
|------|-------------|----------|
| `Note` | Short text content | Mastodon statuses, tweets |
| `Article` | Long-form content | Blog posts |
| `Image` | Image content | Photos |
| `Video` | Video content | Video posts |
| `Audio` | Audio content | Podcasts, music |
| `Document` | Generic file | Attachments |
| `Event` | Calendar event | Meetups, events |
| `Place` | Location | Check-ins |

### Object Structure

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "Hello, Fediverse!",
  "published": "2024-01-15T10:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Important Object Properties

| Property | Description |
|----------|-------------|
| `id` | Unique identifier (URL) |
| `type` | The object type |
| `attributedTo` | The creator/author |
| `content` | The main content (HTML) |
| `published` | When it was created |
| `updated` | When it was last modified |
| `inReplyTo` | Parent object (for replies) |
| `attachment` | Media attachments |
| `tag` | Hashtags, mentions |

## Collections

A **Collection** is an ordered or unordered set of objects or activities. Collections are used for inboxes, outboxes, followers lists, and more.

### Collection Types

| Type | Description |
|------|-------------|
| `Collection` | Unordered set |
| `OrderedCollection` | Ordered set (newest first) |
| `CollectionPage` | A page within a collection |
| `OrderedCollectionPage` | An ordered page |

### Collection Structure

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/outbox",
  "totalItems": 42,
  "first": "https://example.com/users/alice/outbox?page=1",
  "last": "https://example.com/users/alice/outbox?page=3"
}
```

### Collection Page

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollectionPage",
  "id": "https://example.com/users/alice/outbox?page=1",
  "partOf": "https://example.com/users/alice/outbox",
  "next": "https://example.com/users/alice/outbox?page=2",
  "orderedItems": [
    { "type": "Create", "..." : "..." },
    { "type": "Announce", "..." : "..." }
  ]
}
```

## Addressing and Visibility

ActivityPub uses `to`, `cc`, `bto`, and `bcc` properties to control who sees content.

### Special Addresses

| Address | Meaning |
|---------|---------|
| `https://www.w3.org/ns/activitystreams#Public` | Visible to everyone |
| `{actor}/followers` | Visible to followers |

### Visibility Examples

**Public post:**
```json
{
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

**Followers-only post:**
```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": []
}
```

**Direct message:**
```json
{
  "to": ["https://other.example/users/bob"],
  "cc": []
}
```

## JSON-LD Context

ActivityPub uses JSON-LD for extensibility. The `@context` tells parsers how to interpret the JSON.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "toot": "http://joinmastodon.org/ns#",
      "sensitive": "as:sensitive"
    }
  ]
}
```

:::tip
You can extend ActivityStreams with custom properties by adding them to the context. This is how Mastodon adds features like content warnings (`sensitive`) and custom emoji.
:::

## Next Steps

Now that you understand the core concepts:

1. **[Your First ActivityPub Server](/docs/getting-started/your-first-activitypub-server)** - Put these concepts into practice
2. **[ActivityStreams Reference](/docs/specs/activitystreams/overview)** - Complete vocabulary reference
3. **[Object Types Reference](/docs/reference/object-types)** - All object types with examples
