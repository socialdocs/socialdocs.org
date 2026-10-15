---
sidebar_position: 1
title: ActivityStreams 2.0 Overview
description: The JSON vocabulary for representing social data in ActivityPub
last_verified: 2026-10-15
verified_against: "AS2 Core & Vocabulary (W3C REC 2017), the published AS2 JSON-LD context, ActivityPub REC, Mastodon v4.7.3 source (context_helper.rb, account.rb, json_ld_helper.rb)"
---

# ActivityStreams 2.0 Overview

ActivityStreams 2.0 is the vocabulary that ActivityPub uses to represent social data. It defines the format for activities, actors, objects, and collections using JSON-LD.

## Specification

- **Status**: W3C Recommendation (May 2017), under maintenance by the [Social Web Working Group](/docs/ecosystem/w3c-groups) alongside ActivityPub — no updated version published as of October 2026
- **Core**: [https://www.w3.org/TR/activitystreams-core/](https://www.w3.org/TR/activitystreams-core/)
- **Vocabulary**: [https://www.w3.org/TR/activitystreams-vocabulary/](https://www.w3.org/TR/activitystreams-vocabulary/)

## The JSON-LD Context

Every ActivityStreams document includes a context:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "content": "Hello, world!"
}
```

The context maps short property names to full URIs:
- `type` → `@type` (and `id` → `@id`), JSON-LD keywords rather than vocabulary terms
- `content` → `https://www.w3.org/ns/activitystreams#content`

## Core Types

### Object

The base type for all things:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Object",
  "id": "https://example.com/objects/1",
  "name": "A simple object"
}
```

### Activity

An action performed by an actor:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "content": "Hello!"
  }
}
```

### Actor

An entity that can perform activities:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/alice",
  "name": "Alice"
}
```

### Collection

A group of items:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Collection",
  "totalItems": 2,
  "items": [
    { "type": "Note", "content": "First" },
    { "type": "Note", "content": "Second" }
  ]
}
```

## Type Hierarchy

AS2 has **two** base types, `Object` and `Link`; a Link is not an Object ([AS2 Core §4.2](https://www.w3.org/TR/activitystreams-core/#link)). Extension relationships below are from the [Activity Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/).

```
Object
├── Activity
│   ├── Create, Update, Delete, Follow, Like, Announce, Undo, Add, Remove, ...
│   ├── Accept ── TentativeAccept
│   ├── Reject ── TentativeReject
│   ├── Ignore ── Block
│   ├── Offer ── Invite
│   └── IntransitiveActivity
│       ├── Arrive
│       ├── Travel
│       └── Question
├── Person, Organization, Application, Service, Group
│     (actor types — there is no "Actor" class; each extends Object directly)
├── Note, Article, Event, Place, Profile, Relationship, Tombstone
├── Document
│   ├── Audio
│   ├── Image
│   ├── Video
│   └── Page
└── Collection
    ├── OrderedCollection
    └── CollectionPage
        └── OrderedCollectionPage   (also extends OrderedCollection)

Link
└── Mention
```

## Common Properties

### Identity

| Property | Type | Description |
|----------|------|-------------|
| `id` | URL | Unique identifier |
| `type` | String or array | Object type(s) |
| `name` | String | Display name |
| `summary` | String | Short description (may contain HTML) |

### Authorship

| Property | Type | Description |
|----------|------|-------------|
| `attributedTo` | Object or Link (usually an actor) | Creator |
| `actor` | Object or Link (usually an actor) | Activity performer |

### Content

| Property | Type | Description |
|----------|------|-------------|
| `content` | String | Main content (HTML unless `mediaType` says otherwise) |
| `contentMap` | Object | Localized content |
| `mediaType` | String | MIME type of `content` (Object) or of the target (Link) |

### Timestamps

| Property | Type | Description |
|----------|------|-------------|
| `published` | DateTime | Creation time |
| `updated` | DateTime | Last modified |
| `startTime` | DateTime | Event start |
| `endTime` | DateTime | Event end |

### Addressing

| Property | Type | Description |
|----------|------|-------------|
| `to` | Object/Link, one or many | Primary recipients |
| `cc` | Object/Link, one or many | Secondary recipients |
| `bto` | Object/Link, one or many | Private primary (strip before delivery) |
| `bcc` | Object/Link, one or many | Private secondary (strip before delivery) |

None of these properties is functional, so a single value and a one-element array mean the same thing; consumers must accept both.

## Extending ActivityStreams

### Custom Properties

Extensions are added through the `@context`; the normative AS2 context itself must not be overridden ([AS2 Core §5](https://www.w3.org/TR/activitystreams-core/#extensibility)). `sensitive` below is **not** part of AS2 — it is a widely used extension that Mastodon declares as `as:sensitive` ([context_helper.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb)):

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "sensitive": "as:sensitive",
      "toot": "http://joinmastodon.org/ns#",
      "blurhash": "toot:blurhash"
    }
  ],
  "type": "Note",
  "content": "Hidden content",
  "sensitive": true
}
```

### Custom Types

Define new types the same way. `Emoji` is Mastodon's extension type (`toot:Emoji`), not AS2:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "Emoji": "toot:Emoji"
    }
  ],
  "type": "Emoji",
  "id": "https://example.com/emojis/awesome",
  "name": ":awesome:",
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/emoji/awesome.png"
  }
}
```

## Processing ActivityStreams

### Parsing

```javascript
function parseActivityStreams(json) {
  // Normalize to array context
  let context = json['@context'];
  if (!Array.isArray(context)) {
    context = [context];
  }

  // Get type
  const type = json.type;

  // Handle multiple types
  const types = Array.isArray(type) ? type : [type];

  return {
    context,
    types,
    data: json
  };
}
```

### Type Checking

`type` may be a string or an array, so check every value. The lists below are the AS2 Vocabulary's activity and actor types; extensions add more (e.g. Mastodon's `QuoteRequest`), so treat unknown types as "ignore", not "error" ([AS2 Core §5](https://www.w3.org/TR/activitystreams-core/#extensibility)).

```javascript
const ACTIVITY_TYPES = new Set([
  'Activity', 'IntransitiveActivity', 'Accept', 'Add', 'Announce', 'Arrive',
  'Block', 'Create', 'Delete', 'Dislike', 'Flag', 'Follow', 'Ignore', 'Invite',
  'Join', 'Leave', 'Like', 'Listen', 'Move', 'Offer', 'Question', 'Reject',
  'Read', 'Remove', 'TentativeReject', 'TentativeAccept', 'Travel', 'Undo',
  'Update', 'View'
]);
const ACTOR_TYPES = new Set(['Application', 'Group', 'Organization', 'Person', 'Service']);

const typesOf = (obj) => [].concat(obj?.type ?? []);

function isActivity(obj) {
  return typesOf(obj).some((t) => ACTIVITY_TYPES.has(t));
}

function isActor(obj) {
  return typesOf(obj).some((t) => ACTOR_TYPES.has(t));
}
```

## See Also

- **[Core Types](/docs/specs/activitystreams/core-types)** - Base types
- **[Activity Types](/docs/specs/activitystreams/activity-types)** - All activities
- **[Object Types](/docs/specs/activitystreams/object-types)** - Content types
- **[Properties](/docs/specs/activitystreams/properties)** - All properties
