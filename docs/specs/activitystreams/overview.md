---
sidebar_position: 1
title: ActivityStreams 2.0 Overview
description: The JSON vocabulary for representing social data in ActivityPub
---

# ActivityStreams 2.0 Overview

ActivityStreams 2.0 is the vocabulary that ActivityPub uses to represent social data. It defines the format for activities, actors, objects, and collections using JSON-LD.

## Specification

- **Status**: W3C Recommendation (May 2017)
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
- `type` → `https://www.w3.org/ns/activitystreams#type`
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

```
Object
├── Activity
│   ├── Create
│   ├── Delete
│   ├── Update
│   ├── Follow
│   ├── Accept
│   ├── Reject
│   ├── Like
│   ├── Announce
│   └── ... (more)
├── Actor
│   ├── Person
│   ├── Organization
│   ├── Application
│   ├── Service
│   └── Group
├── Object Types
│   ├── Note
│   ├── Article
│   ├── Image
│   ├── Video
│   ├── Audio
│   └── ... (more)
├── Collection
│   └── OrderedCollection
└── Link
```

## Common Properties

### Identity

| Property | Type | Description |
|----------|------|-------------|
| `id` | URL | Unique identifier |
| `type` | String | Object type |
| `name` | String | Display name |
| `summary` | String | Short description |

### Authorship

| Property | Type | Description |
|----------|------|-------------|
| `attributedTo` | Actor | Creator |
| `actor` | Actor | Activity performer |

### Content

| Property | Type | Description |
|----------|------|-------------|
| `content` | String | Main content (HTML) |
| `contentMap` | Object | Localized content |
| `mediaType` | String | MIME type |

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
| `to` | Array | Primary recipients |
| `cc` | Array | Secondary recipients |
| `bto` | Array | Private primary |
| `bcc` | Array | Private secondary |

## Extending ActivityStreams

### Custom Properties

Add properties via the context:

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

Define new types:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "Emoji": "toot:Emoji"
    }
  ],
  "type": "Emoji",
  "name": ":awesome:",
  "icon": {
    "type": "Image",
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

```javascript
function isActivity(obj) {
  const activityTypes = [
    'Create', 'Update', 'Delete', 'Follow',
    'Accept', 'Reject', 'Like', 'Announce', 'Undo'
  ];
  return activityTypes.includes(obj.type);
}

function isActor(obj) {
  const actorTypes = [
    'Person', 'Organization', 'Application', 'Service', 'Group'
  ];
  return actorTypes.includes(obj.type);
}
```

## See Also

- **[Core Types](/docs/specs/activitystreams/core-types)** - Base types
- **[Activity Types](/docs/specs/activitystreams/activity-types)** - All activities
- **[Object Types](/docs/specs/activitystreams/object-types)** - Content types
- **[Properties](/docs/specs/activitystreams/properties)** - All properties
