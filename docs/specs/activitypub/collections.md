---
sidebar_position: 5
title: Collections
description: Collections in ActivityPub - Inboxes, Outboxes, and paginated lists
---

# Collections

Collections in ActivityPub are ordered or unordered lists of objects or activities. They're used for inboxes, outboxes, followers lists, and any other groupings of items.

## Collection Types

| Type | Description | Order |
|------|-------------|-------|
| `Collection` | Unordered set | None |
| `OrderedCollection` | Ordered set | Maintained |
| `CollectionPage` | Page of a Collection | None |
| `OrderedCollectionPage` | Page of an OrderedCollection | Maintained |

## Basic Collection Structure

### Unpaginated Collection

For small collections:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/following",
  "totalItems": 3,
  "orderedItems": [
    "https://example.com/users/bob",
    "https://example.com/users/carol",
    "https://other.example/users/dave"
  ]
}
```

### Paginated Collection

For larger collections:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/outbox",
  "totalItems": 1542,
  "first": "https://example.com/users/alice/outbox?page=true",
  "last": "https://example.com/users/alice/outbox?min_id=0"
}
```

### Collection Page

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollectionPage",
  "id": "https://example.com/users/alice/outbox?page=true",
  "partOf": "https://example.com/users/alice/outbox",
  "next": "https://example.com/users/alice/outbox?max_id=12345",
  "prev": "https://example.com/users/alice/outbox?min_id=12350",
  "orderedItems": [
    { "type": "Create", "...": "..." },
    { "type": "Announce", "...": "..." }
  ]
}
```

## Collection Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | URL | Unique identifier |
| `type` | String | Collection type |
| `totalItems` | Integer | Total number of items |
| `first` | URL | First page |
| `last` | URL | Last page |
| `current` | URL | Current/latest page |
| `items` | Array | Items (for Collection) |
| `orderedItems` | Array | Items (for OrderedCollection) |

## Page Properties

| Property | Type | Description |
|----------|------|-------------|
| `partOf` | URL | Parent collection |
| `next` | URL | Next page |
| `prev` | URL | Previous page |
| `startIndex` | Integer | Index of first item |

## Standard Collections

### Inbox

Receives incoming activities:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/inbox",
  "totalItems": 523,
  "first": "https://example.com/users/alice/inbox?page=true"
}
```

**POST** to inbox: Receive activities (S2S)
**GET** from inbox: Read activities (C2S, authenticated)

### Outbox

Contains activities by the actor:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/outbox",
  "totalItems": 156,
  "first": "https://example.com/users/alice/outbox?page=true"
}
```

**GET** from outbox: Read activities (public)
**POST** to outbox: Submit activities (C2S, authenticated)

### Followers

Collection of actors following this actor:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/followers",
  "totalItems": 42,
  "first": "https://example.com/users/alice/followers?page=true"
}
```

### Following

Collection of actors this actor follows:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/following",
  "totalItems": 108,
  "first": "https://example.com/users/alice/following?page=true"
}
```

### Liked

Collection of objects the actor has liked:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/liked",
  "totalItems": 234
}
```

## Pagination Strategies

### Cursor-Based (Recommended)

Use item IDs as cursors:

```
/outbox?max_id=12345  → Items older than 12345
/outbox?min_id=12345  → Items newer than 12345
/outbox?since_id=12345 → Items since 12345
```

```json
{
  "type": "OrderedCollectionPage",
  "id": "https://example.com/users/alice/outbox?max_id=12345",
  "next": "https://example.com/users/alice/outbox?max_id=12340",
  "prev": "https://example.com/users/alice/outbox?min_id=12345"
}
```

### Offset-Based

Simple but less efficient:

```
/outbox?page=1  → First 20 items
/outbox?page=2  → Items 21-40
```

:::caution
Offset pagination can be slow for large collections and can skip/repeat items when the collection changes.
:::

### Keyset-Based

Similar to cursor, but using timestamps:

```
/outbox?before=2024-01-15T10:00:00Z
```

## Implementation

### Creating a Collection Endpoint

```javascript
app.get('/users/:username/outbox', async (req, res) => {
  const username = req.params.username;
  const page = req.query.page;
  const maxId = req.query.max_id;

  const baseUrl = `https://example.com/users/${username}/outbox`;

  if (!page) {
    // Return collection metadata
    const count = await db.activities.count({ actor: username });

    return res.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: baseUrl,
      totalItems: count,
      first: `${baseUrl}?page=true`,
      last: `${baseUrl}?min_id=0`
    });
  }

  // Return a page
  const query = { actor: username };
  if (maxId) {
    query.id = { $lt: maxId };
  }

  const activities = await db.activities
    .find(query)
    .sort({ id: -1 })
    .limit(20);

  const items = activities.map(a => a.data);
  const nextMaxId = activities.length > 0
    ? activities[activities.length - 1].id
    : null;

  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollectionPage',
    id: maxId ? `${baseUrl}?max_id=${maxId}` : `${baseUrl}?page=true`,
    partOf: baseUrl,
    next: nextMaxId ? `${baseUrl}?max_id=${nextMaxId}` : undefined,
    orderedItems: items
  });
});
```

### Fetching a Collection

```javascript
async function fetchCollection(collectionUrl) {
  const items = [];

  // Fetch collection
  let response = await fetch(collectionUrl, {
    headers: { 'Accept': 'application/activity+json' }
  });
  let collection = await response.json();

  // If items are inline, return them
  if (collection.orderedItems) {
    return collection.orderedItems;
  }
  if (collection.items) {
    return collection.items;
  }

  // Otherwise, paginate
  let pageUrl = collection.first;

  while (pageUrl) {
    response = await fetch(pageUrl, {
      headers: { 'Accept': 'application/activity+json' }
    });
    const page = await response.json();

    const pageItems = page.orderedItems || page.items || [];
    items.push(...pageItems);

    pageUrl = page.next;

    // Safety limit
    if (items.length > 1000) break;
  }

  return items;
}
```

## Collection Synchronization

### Synchronizing Followers

When your followers collection changes, you don't need to notify anyone. The change is reflected when the collection is fetched.

### Synchronizing Follow Lists

After receiving an Accept for a Follow:

1. Add the actor to your following collection
2. Start fetching their outbox for past posts (optional)
3. Start delivering your posts to their inbox

## Security Considerations

### Authentication

- **Inbox**: Accept POST from any authenticated server
- **Outbox GET**: Usually public
- **Outbox POST**: Authenticated owner only (C2S)
- **Followers/Following**: May require authentication for privacy

### Privacy

Some servers hide followers/following counts or require authentication:

```json
{
  "type": "OrderedCollection",
  "id": "https://example.com/users/private/followers",
  "totalItems": 0
}
```

(Returning 0 or omitting `totalItems` for privacy)

## Best Practices

1. **Always paginate** large collections
2. **Use cursor-based pagination** for stability
3. **Set reasonable page sizes** (20-40 items)
4. **Include `totalItems`** when possible
5. **Cache collection responses** appropriately
6. **Handle empty collections** gracefully

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/new/outbox",
  "totalItems": 0,
  "orderedItems": []
}
```

## Next Steps

- **[Client-to-Server](/docs/specs/activitypub/client-to-server)** - Using collections in C2S
- **[Server-to-Server](/docs/specs/activitypub/server-to-server)** - Federation and collections
- **[Following and Followers](/docs/guides/following-and-followers)** - Implementation guide
