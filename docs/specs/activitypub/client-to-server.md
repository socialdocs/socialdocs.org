---
sidebar_position: 6
title: Client-to-Server
description: The ActivityPub Client-to-Server protocol for user interactions
---

# Client-to-Server (C2S)

The Client-to-Server protocol defines how client applications interact with ActivityPub servers. While most Fediverse software uses custom APIs, understanding C2S helps you build spec-compliant implementations.

## Overview

```
┌─────────────────┐                    ┌─────────────────┐
│                 │  POST /outbox      │                 │
│     Client      │───────────────────►│     Server      │
│  (Mobile App)   │                    │   (Your Server) │
│                 │◄───────────────────│                 │
│                 │  GET /inbox        │                 │
└─────────────────┘                    └─────────────────┘
```

## Authentication

C2S requires authentication. The spec suggests OAuth 2.0:

```http
POST /users/alice/outbox HTTP/1.1
Host: example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/activity+json
```

## Posting Activities

### Submit to Outbox

Clients POST activities to the actor's outbox:

```http
POST /users/alice/outbox HTTP/1.1
Host: example.com
Authorization: Bearer <token>
Content-Type: application/activity+json

{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "object": {
    "type": "Note",
    "content": "Hello, world!"
  }
}
```

### Server Processing

The server:
1. Validates the activity
2. Assigns an `id` to the activity
3. Assigns an `id` to the object (if new)
4. Sets the `actor` property
5. Adds to the outbox collection
6. Delivers to recipients (S2S)

### Response

```http
HTTP/1.1 201 Created
Location: https://example.com/activities/123
```

## Activity Handling

### Create

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "object": {
    "type": "Note",
    "content": "My new post",
    "to": ["https://www.w3.org/ns/activitystreams#Public"]
  }
}
```

Server adds:
- `id` to activity
- `id` to object
- `actor` property
- `published` timestamp
- `attributedTo` on object

### Like

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Like",
  "object": "https://other.example/notes/456"
}
```

### Follow

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  "object": "https://other.example/users/bob"
}
```

### Update

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Update",
  "object": {
    "id": "https://example.com/notes/123",
    "type": "Note",
    "content": "Updated content"
  }
}
```

### Delete

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Delete",
  "object": "https://example.com/notes/123"
}
```

### Undo

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Undo",
  "object": "https://example.com/activities/like-456"
}
```

## Reading Activities

### Get Inbox

```http
GET /users/alice/inbox HTTP/1.1
Host: example.com
Authorization: Bearer <token>
Accept: application/activity+json
```

Response:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://example.com/users/alice/inbox",
  "totalItems": 42,
  "first": "https://example.com/users/alice/inbox?page=true"
}
```

### Get Outbox

```http
GET /users/alice/outbox HTTP/1.1
Host: example.com
Accept: application/activity+json
```

## Direct Object Posting

For convenience, clients can POST objects directly:

```http
POST /users/alice/outbox HTTP/1.1

{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "content": "Hello!"
}
```

Server wraps in a Create activity automatically.

## Addressing

### Public Post

```json
{
  "type": "Note",
  "content": "Hello everyone!",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Followers Only

```json
{
  "type": "Note",
  "content": "Just for my followers",
  "to": ["https://example.com/users/alice/followers"]
}
```

### Direct Message

```json
{
  "type": "Note",
  "content": "Private message",
  "to": ["https://other.example/users/bob"]
}
```

## Uploaded Media

### Upload Endpoint

Some servers provide a media upload endpoint:

```http
POST /api/v1/media HTTP/1.1
Host: example.com
Authorization: Bearer <token>
Content-Type: multipart/form-data

[binary image data]
```

Response:

```json
{
  "id": "123",
  "type": "Document",
  "url": "https://example.com/media/123.jpg",
  "mediaType": "image/jpeg"
}
```

### Attach to Post

```json
{
  "type": "Note",
  "content": "Check out this photo!",
  "attachment": [
    {
      "type": "Document",
      "url": "https://example.com/media/123.jpg",
      "mediaType": "image/jpeg"
    }
  ]
}
```

## Implementation Example

### Express.js Outbox Handler

```javascript
app.post('/users/:username/outbox',
  authenticate,
  async (req, res) => {
    const username = req.params.username;
    const actor = `https://example.com/users/${username}`;

    // Verify authenticated user matches
    if (req.user.actor !== actor) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let activity = req.body;

    // Wrap bare objects in Create
    if (!isActivityType(activity.type)) {
      activity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Create',
        object: activity
      };
    }

    // Assign IDs and properties
    activity.id = `https://example.com/activities/${uuid()}`;
    activity.actor = actor;
    activity.published = new Date().toISOString();

    if (activity.object && typeof activity.object === 'object') {
      if (!activity.object.id) {
        activity.object.id = `https://example.com/objects/${uuid()}`;
      }
      activity.object.attributedTo = actor;
    }

    // Store activity
    await db.activities.insert(activity);

    // Deliver to recipients (async)
    deliverActivity(activity);

    res.status(201)
       .location(activity.id)
       .json(activity);
  }
);
```

## C2S vs Custom APIs

| Aspect | C2S | Custom API (Mastodon) |
|--------|-----|----------------------|
| Standardized | Yes | No |
| Tooling | Limited | Extensive |
| Features | Basic | Platform-specific |
| Adoption | Low | High |

### When to Use C2S

- Building a generic ActivityPub client
- Interoperability is priority
- Following spec strictly

### When to Use Custom API

- Platform-specific features
- Better tooling available
- Faster development

## Implementations Supporting C2S

| Platform | C2S Support |
|----------|-------------|
| Pleroma | Full |
| Mastodon | Partial (read-only) |
| Pixelfed | No |
| Lemmy | No |

## Next Steps

- **[Server-to-Server](/docs/specs/activitypub/server-to-server)** - Federation protocol
- **[Delivery](/docs/specs/activitypub/delivery)** - How activities are sent
- **[Building an Actor](/docs/guides/building-an-actor)** - Implementation guide
