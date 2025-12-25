---
sidebar_position: 5
title: Followers & Following
description: Reference for followers and following collections
---

# Followers & Following Collections

These collections track the social graph.

## Followers

```
GET /users/{username}/followers
```

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/followers",
  "totalItems": 42,
  "first": "https://example.com/users/alice/followers?page=1"
}
```

## Following

```
GET /users/{username}/following
```

Same structure, lists accounts the user follows.

## Paginated Page

```json
{
  "type": "OrderedCollectionPage",
  "orderedItems": [
    "https://other.example/users/bob",
    "https://another.example/users/charlie"
  ],
  "next": "https://example.com/users/alice/followers?page=2"
}
```

## Privacy

Some implementations hide lists (only show `totalItems`).

## Implementation

```javascript
app.get('/users/:username/followers', async (req, res) => {
  const followers = await getFollowers(req.params.username);

  res.json({
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "OrderedCollection",
    "totalItems": followers.length,
    "orderedItems": followers
  });
});
```

## See Also

- **[Following and Followers Guide](/docs/guides/following-and-followers)**
- **[Collection Types](/docs/reference/collection-types)**
