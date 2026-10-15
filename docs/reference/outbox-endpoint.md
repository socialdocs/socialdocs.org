---
sidebar_position: 3
title: Outbox Endpoint
description: Reference for the ActivityPub outbox endpoint
---

# Outbox Endpoint

:::danger Not safe for production
The code on this page is illustrative and **has known security flaws**: incomplete signature verification (signed headers, key-owner ↔ actor binding, Digest over the raw body), missing origin checks, and/or missing SSRF and output-escaping guards. Do not copy it into a real server. Use a maintained library such as [Fedify](https://fedify.dev/) or [activitypub-federation-rust](https://github.com/LemmyNet/activitypub-federation-rust) for request verification. Tracking: [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).
:::

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
