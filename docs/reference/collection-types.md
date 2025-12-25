---
sidebar_position: 9
title: Collection Types
description: Reference for ActivityStreams Collection types
---

# Collection Types

Collections group multiple objects together.

## Type Hierarchy

```
┌─────────────────────────────────────────┐
│              Collection                 │
├───────────────────┬─────────────────────┤
│  OrderedCollection │  CollectionPage    │
│                   │  OrderedCollectionPage│
└───────────────────┴─────────────────────┘
```

## Collection

Unordered set of items.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Collection",
  "id": "https://example.com/collection",
  "totalItems": 3,
  "items": [
    "https://example.com/item/1",
    "https://example.com/item/2",
    "https://example.com/item/3"
  ]
}
```

## OrderedCollection

Items in specific order (newest first typically).

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/outbox",
  "totalItems": 150,
  "first": "https://example.com/users/alice/outbox?page=true",
  "last": "https://example.com/users/alice/outbox?page=true&min_id=0"
}
```

## CollectionPage

A page within a collection.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "CollectionPage",
  "partOf": "https://example.com/collection",
  "items": ["..."],
  "next": "https://example.com/collection?page=2"
}
```

## OrderedCollectionPage

A page with ordered items.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollectionPage",
  "id": "https://example.com/users/alice/outbox?page=true",
  "partOf": "https://example.com/users/alice/outbox",
  "orderedItems": [
    { "type": "Create", "object": { "type": "Note" } }
  ],
  "next": "https://example.com/users/alice/outbox?page=2",
  "prev": "https://example.com/users/alice/outbox?page=0"
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `totalItems` | Integer | Total count |
| `items` | Array | Collection items |
| `orderedItems` | Array | Ordered items |
| `first` | URL | First page |
| `last` | URL | Last page |
| `current` | URL | Current page |
| `next` | URL | Next page |
| `prev` | URL | Previous page |
| `partOf` | URL | Parent collection |

## Common Uses

| Collection | Type | Purpose |
|------------|------|---------|
| `inbox` | OrderedCollection | Received activities |
| `outbox` | OrderedCollection | Published activities |
| `followers` | OrderedCollection | Follower list |
| `following` | OrderedCollection | Following list |
| `liked` | OrderedCollection | Liked objects |
| `shares` | Collection | Boost/announce list |
| `replies` | Collection | Comment thread |

## Pagination Pattern

```
┌─────────────────────────────────────────────────────┐
│ OrderedCollection (root)                            │
│ totalItems: 500                                     │
│ first: /outbox?page=true ──────┐                    │
└────────────────────────────────│────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────┐
│ OrderedCollectionPage (page 1)                      │
│ orderedItems: [20 items]                            │
│ next: /outbox?page=2 ──────────┐                    │
└────────────────────────────────│────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────┐
│ OrderedCollectionPage (page 2)                      │
│ orderedItems: [20 items]                            │
│ next: /outbox?page=3                                │
└─────────────────────────────────────────────────────┘
```

## Implementation

```javascript
app.get('/users/:user/outbox', async (req, res) => {
  const page = req.query.page;
  const user = req.params.user;

  if (!page) {
    // Return collection summary
    const count = await getActivityCount(user);
    return res.json({
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "OrderedCollection",
      "id": `https://example.com/users/${user}/outbox`,
      "totalItems": count,
      "first": `https://example.com/users/${user}/outbox?page=true`
    });
  }

  // Return paginated items
  const activities = await getActivities(user, page);
  res.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "OrderedCollectionPage",
    "partOf": `https://example.com/users/${user}/outbox`,
    "orderedItems": activities,
    "next": `https://example.com/users/${user}/outbox?page=${page + 1}`
  });
});
```

## See Also

- **[Followers & Following](/docs/reference/followers-following)**
- **[Outbox Endpoint](/docs/reference/outbox-endpoint)**

