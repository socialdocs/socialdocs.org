---
sidebar_position: 3
title: Outbox Endpoint
description: Reference for the ActivityPub outbox endpoint
---

# Outbox Endpoint

The outbox lists an actor's published activities.

## Reading (GET)

```
GET /users/{username}/outbox
```

### Response

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/outbox",
  "totalItems": 150,
  "first": "https://example.com/users/alice/outbox?page=true"
}
```

### Paginated Page

```json
{
  "type": "OrderedCollectionPage",
  "orderedItems": [
    { "type": "Create", "object": { "type": "Note" } }
  ],
  "next": "https://example.com/users/alice/outbox?page=2"
}
```

## Writing (POST) - Client-to-Server

```
POST /users/{username}/outbox
Authorization: Bearer {token}
```

Used by clients to publish activities.

## Implementation

```javascript
app.get('/users/:username/outbox', async (req, res) => {
  const activities = await getActivities(req.params.username);

  res.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "OrderedCollection",
    "totalItems": activities.length,
    "orderedItems": activities
  });
});
```

## See Also

- **[Inbox Endpoint](/docs/reference/inbox-endpoint)**
- **[Collection Types](/docs/reference/collection-types)**
