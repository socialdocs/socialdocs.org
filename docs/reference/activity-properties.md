---
sidebar_position: 12
title: Activity Properties
description: Reference for ActivityStreams Activity properties
---

# Activity Properties

Properties specific to Activity types (Create, Follow, Like, etc.).

## Core Activity Structure

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://example.com/activities/123",
  "actor": "https://example.com/users/alice",
  "object": { "type": "Note", "content": "..." },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "published": "2024-01-15T10:00:00Z"
}
```

## Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | String | Activity type |
| `actor` | Actor/URL | Who performed it |
| `object` | Object/URL | What it acts upon |

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | URL | Unique identifier |
| `target` | Object/URL | Destination/context |
| `result` | Object | Outcome |
| `origin` | Object/URL | Source location |
| `instrument` | Object | Tool used |
| `to` | Array | Primary recipients |
| `cc` | Array | Secondary recipients |
| `published` | DateTime | When performed |

## Activity-Specific Properties

### Create

```json
{
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/123",
    "content": "<p>Hello!</p>",
    "attributedTo": "https://example.com/users/alice"
  }
}
```

### Follow

```json
{
  "type": "Follow",
  "id": "https://example.com/activities/follow/456",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/users/bob"
}
```

### Accept/Reject

```json
{
  "type": "Accept",
  "actor": "https://other.example/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/follow/456",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/users/bob"
  }
}
```

### Like

```json
{
  "type": "Like",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/notes/789"
}
```

### Announce (Boost/Share)

```json
{
  "type": "Announce",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/notes/789",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Update

```json
{
  "type": "Update",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/123",
    "content": "<p>Updated content</p>",
    "updated": "2024-01-15T12:00:00Z"
  }
}
```

### Delete

```json
{
  "type": "Delete",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/123"
}
```

After deletion, the object becomes a Tombstone:

```json
{
  "type": "Tombstone",
  "id": "https://example.com/notes/123",
  "formerType": "Note",
  "deleted": "2024-01-15T14:00:00Z"
}
```

### Undo

```json
{
  "type": "Undo",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Like",
    "id": "https://example.com/activities/like/101",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/notes/789"
  }
}
```

### Add/Remove (Collections)

```json
{
  "type": "Add",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/123",
  "target": "https://example.com/users/alice/collections/favorites"
}
```

### Move

```json
{
  "type": "Move",
  "actor": "https://old.example/users/alice",
  "object": "https://old.example/users/alice",
  "target": "https://new.example/users/alice"
}
```

### Block

```json
{
  "type": "Block",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/users/spammer"
}
```

## Activity Flow

```
┌─────────────────────────────────────────────────────┐
│ Actor performs Activity                             │
├─────────────────────────────────────────────────────┤
│ 1. Activity created with actor, object, type       │
│ 2. Activity POSTed to actor's outbox               │
│ 3. Server delivers to recipients' inboxes          │
│ 4. Recipients process and may respond              │
└─────────────────────────────────────────────────────┘
```

## See Also

- **[Common Properties](/docs/reference/common-properties)**
- **[Handling Activities](/docs/guides/handling-incoming-activities)**

