---
sidebar_position: 2
title: Core Types
description: The fundamental types in ActivityStreams 2.0
---

# Core Types

ActivityStreams 2.0 defines a small set of core types that form the foundation for all ActivityPub objects. Every object in ActivityStreams inherits from these base types.

## Type Hierarchy

```
┌────────────────────────────────────────────────────────────┐
│                 ACTIVITYSTREAMS TYPE HIERARCHY             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Object (base type)                                        │
│  ├── Activity                                              │
│  │   ├── IntransitiveActivity                              │
│  │   └── (All activity types)                              │
│  ├── Actor                                                 │
│  │   ├── Person                                            │
│  │   ├── Group                                             │
│  │   ├── Application                                       │
│  │   ├── Service                                           │
│  │   └── Organization                                      │
│  ├── Collection                                            │
│  │   ├── OrderedCollection                                 │
│  │   ├── CollectionPage                                    │
│  │   └── OrderedCollectionPage                             │
│  └── (Content types: Note, Article, etc.)                  │
│                                                            │
│  Link (separate from Object)                               │
│  └── Mention                                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Object

The base type for all ActivityStreams objects.

### Definition

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Object",
  "id": "https://example.com/objects/1",
  "name": "A Simple Object"
}
```

### Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `@context` | String/Array | JSON-LD context |
| `type` | String/Array | The object type(s) |
| `id` | String (URI) | Globally unique identifier |
| `name` | String | Human-readable name |
| `content` | String | Text content (often HTML) |
| `summary` | String | Brief description |
| `published` | DateTime | When created |
| `updated` | DateTime | When last modified |
| `attributedTo` | Object/Link | Creator/author |
| `to` | Array | Primary recipients |
| `cc` | Array | Secondary recipients |
| `bto` | Array | Blind primary recipients |
| `bcc` | Array | Blind secondary recipients |

### Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Object",
  "id": "https://example.com/objects/unique-id",
  "name": "My Object",
  "content": "This is the content of the object",
  "published": "2024-01-15T10:00:00Z",
  "updated": "2024-01-15T12:00:00Z",
  "attributedTo": "https://example.com/users/alice"
}
```

## Link

Represents a reference to another resource. Links are not Objects—they're a separate base type.

### Definition

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Link",
  "href": "https://example.com/resource",
  "mediaType": "text/html"
}
```

### Link Properties

| Property | Type | Description |
|----------|------|-------------|
| `href` | String (URI) | The target resource URL |
| `rel` | String/Array | Link relation type |
| `mediaType` | String | MIME type of the target |
| `name` | String | Human-readable name |
| `hreflang` | String | Language of the target |
| `height` | Integer | Height in pixels |
| `width` | Integer | Width in pixels |
| `preview` | Object/Link | Preview of the linked resource |

### Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Link",
  "href": "https://example.com/article",
  "mediaType": "text/html",
  "name": "An Interesting Article",
  "hreflang": "en"
}
```

## Activity

Represents an action. Activities are the primary way to describe what's happening in ActivityPub.

### Definition

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Activity",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1"
}
```

### Activity Properties

| Property | Type | Description |
|----------|------|-------------|
| `actor` | Object/Link | Who performed the activity |
| `object` | Object/Link | What the activity is about |
| `target` | Object/Link | Indirect object (e.g., Add to target) |
| `result` | Object/Link | Result of the activity |
| `origin` | Object/Link | Where the activity originated |
| `instrument` | Object/Link | Tool used to perform the activity |

### Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://example.com/activities/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "content": "Hello, world!"
  },
  "published": "2024-01-15T10:00:00Z"
}
```

## IntransitiveActivity

An Activity without an `object` property. The action is self-contained.

### Examples

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Arrive",
  "actor": "https://example.com/users/alice",
  "location": {
    "type": "Place",
    "name": "San Francisco"
  }
}
```

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Travel",
  "actor": "https://example.com/users/alice",
  "origin": {
    "type": "Place",
    "name": "New York"
  },
  "target": {
    "type": "Place",
    "name": "Los Angeles"
  }
}
```

## Collection

Represents an ordered or unordered set of Objects or Links.

### Definition

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Collection",
  "totalItems": 3,
  "items": [
    "https://example.com/objects/1",
    "https://example.com/objects/2",
    "https://example.com/objects/3"
  ]
}
```

### Collection Properties

| Property | Type | Description |
|----------|------|-------------|
| `totalItems` | Integer | Total number of items |
| `items` | Array | The items (unordered) |
| `current` | CollectionPage/Link | Current page |
| `first` | CollectionPage/Link | First page |
| `last` | CollectionPage/Link | Last page |

### Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Collection",
  "id": "https://example.com/users/alice/followers",
  "totalItems": 150,
  "first": "https://example.com/users/alice/followers?page=1"
}
```

## OrderedCollection

A Collection where the order of items is significant.

### Definition

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "totalItems": 3,
  "orderedItems": [
    "https://example.com/objects/3",
    "https://example.com/objects/2",
    "https://example.com/objects/1"
  ]
}
```

### Used For

- Outbox (newest first)
- Inbox (newest first)
- Followers lists
- Following lists
- Liked posts

### Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/outbox",
  "totalItems": 1250,
  "first": "https://example.com/users/alice/outbox?page=true",
  "last": "https://example.com/users/alice/outbox?min_id=0&page=true"
}
```

## CollectionPage

A single page of a Collection.

### Definition

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "CollectionPage",
  "partOf": "https://example.com/collection",
  "items": [...]
}
```

### CollectionPage Properties

| Property | Type | Description |
|----------|------|-------------|
| `partOf` | Collection/Link | The parent collection |
| `next` | CollectionPage/Link | Next page |
| `prev` | CollectionPage/Link | Previous page |

### Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "CollectionPage",
  "id": "https://example.com/users/alice/followers?page=1",
  "partOf": "https://example.com/users/alice/followers",
  "next": "https://example.com/users/alice/followers?page=2",
  "items": [
    "https://example.com/users/bob",
    "https://example.com/users/carol"
  ]
}
```

## OrderedCollectionPage

A single page of an OrderedCollection.

### Definition

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollectionPage",
  "partOf": "https://example.com/collection",
  "orderedItems": [...],
  "startIndex": 0
}
```

### Additional Property

| Property | Type | Description |
|----------|------|-------------|
| `startIndex` | Integer | Index of the first item |

### Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollectionPage",
  "id": "https://example.com/users/alice/outbox?page=true",
  "partOf": "https://example.com/users/alice/outbox",
  "next": "https://example.com/users/alice/outbox?max_id=123&page=true",
  "prev": "https://example.com/users/alice/outbox?min_id=456&page=true",
  "orderedItems": [
    {
      "type": "Create",
      "object": { "type": "Note", "content": "Hello!" }
    }
  ]
}
```

## Type Coercion

Objects can have multiple types:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": ["Person", "Object"],
  "id": "https://example.com/users/alice",
  "name": "Alice"
}
```

## Null Values

Properties with null values should be omitted rather than included:

```json
// Correct
{
  "type": "Note",
  "content": "Hello"
}

// Avoid
{
  "type": "Note",
  "content": "Hello",
  "summary": null
}
```

## Next Steps

- **[Activity Types](/docs/specs/activitystreams/activity-types)** - All activity types
- **[Object Types](/docs/specs/activitystreams/object-types)** - Content object types
- **[Actor Types](/docs/specs/activitystreams/actor-types)** - Actor types
- **[Properties](/docs/specs/activitystreams/properties)** - All properties reference
