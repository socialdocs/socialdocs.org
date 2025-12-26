---
sidebar_position: 2
title: Core Types
description: The fundamental types in ActivityStreams 2.0
---

# Core Types

ActivityStreams 2.0 defines a small set of core types that form the foundation for all ActivityPub objects. Every object in ActivityStreams inherits from these base types.

## Type Hierarchy

<svg viewBox="0 0 500 340" style={{maxWidth: '500px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="typeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="490" height="330" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="490" height="32" rx="12" fill="url(#typeGrad)"/>
  <text x="250" y="26" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">ACTIVITYSTREAMS TYPE HIERARCHY</text>

  {/* Object - root */}
  <rect x="20" y="50" width="110" height="28" rx="6" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="75" y="69" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">Object</text>
  <text x="135" y="69" fill="currentColor" fontSize="10" opacity="0.7">(base type)</text>

  {/* Activity branch */}
  <line x1="40" y1="78" x2="40" y2="100" stroke="#6364FF" strokeWidth="1.5"/>
  <line x1="40" y1="100" x2="55" y2="100" stroke="#6364FF" strokeWidth="1.5"/>
  <rect x="55" y="88" width="90" height="24" rx="5" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="100" y="105" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500">Activity</text>

  <line x1="70" y1="112" x2="70" y2="130" stroke="#6364FF" strokeWidth="1" opacity="0.6"/>
  <line x1="70" y1="130" x2="85" y2="130" stroke="#6364FF" strokeWidth="1" opacity="0.6"/>
  <text x="90" y="134" fill="currentColor" fontSize="10" opacity="0.7">├ IntransitiveActivity</text>
  <line x1="70" y1="130" x2="70" y2="148" stroke="#6364FF" strokeWidth="1" opacity="0.6"/>
  <line x1="70" y1="148" x2="85" y2="148" stroke="#6364FF" strokeWidth="1" opacity="0.6"/>
  <text x="90" y="152" fill="currentColor" fontSize="10" opacity="0.7">└ (All activity types)</text>

  {/* Actor branch */}
  <line x1="40" y1="100" x2="40" y2="175" stroke="#6364FF" strokeWidth="1.5"/>
  <line x1="40" y1="175" x2="55" y2="175" stroke="#6364FF" strokeWidth="1.5"/>
  <rect x="55" y="163" width="90" height="24" rx="5" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="100" y="180" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500">Actor</text>

  <text x="155" y="168" fill="currentColor" fontSize="9" opacity="0.7">Person, Group,</text>
  <text x="155" y="180" fill="currentColor" fontSize="9" opacity="0.7">Application, Service,</text>
  <text x="155" y="192" fill="currentColor" fontSize="9" opacity="0.7">Organization</text>

  {/* Collection branch */}
  <line x1="40" y1="175" x2="40" y2="225" stroke="#6364FF" strokeWidth="1.5"/>
  <line x1="40" y1="225" x2="55" y2="225" stroke="#6364FF" strokeWidth="1.5"/>
  <rect x="55" y="213" width="90" height="24" rx="5" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="100" y="230" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500">Collection</text>

  <text x="155" y="223" fill="currentColor" fontSize="9" opacity="0.7">OrderedCollection,</text>
  <text x="155" y="235" fill="currentColor" fontSize="9" opacity="0.7">CollectionPage, ...</text>

  {/* Content types */}
  <line x1="40" y1="225" x2="40" y2="260" stroke="#6364FF" strokeWidth="1.5"/>
  <line x1="40" y1="260" x2="55" y2="260" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="60" y="264" fill="currentColor" fontSize="10" opacity="0.7">└ (Note, Article, Image, Video...)</text>

  {/* Link - separate */}
  <rect x="300" y="50" width="90" height="28" rx="6" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="345" y="69" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="600">Link</text>
  <text x="395" y="69" fill="currentColor" fontSize="10" opacity="0.7">(separate)</text>

  <line x1="320" y1="78" x2="320" y2="100" stroke="#6364FF" strokeWidth="1.5"/>
  <line x1="320" y1="100" x2="335" y2="100" stroke="#6364FF" strokeWidth="1.5"/>
  <rect x="335" y="88" width="80" height="24" rx="5" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="375" y="105" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500">Mention</text>

  {/* Legend */}
  <rect x="300" y="280" width="180" height="45" rx="6" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="1" opacity="0.5"/>
  <text x="310" y="298" fill="currentColor" fontSize="10" fontWeight="500">Legend:</text>
  <rect x="310" y="305" width="12" height="12" rx="2" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="328" y="315" fill="currentColor" fontSize="9">Base type</text>
  <rect x="390" y="305" width="12" height="12" rx="2" fill="url(#typeGrad)" stroke="#6364FF" strokeWidth="1"/>
  <text x="408" y="315" fill="currentColor" fontSize="9">Subtype</text>
</svg>

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
