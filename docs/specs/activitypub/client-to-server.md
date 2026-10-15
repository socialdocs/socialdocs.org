---
sidebar_position: 6
title: Client-to-Server
description: The ActivityPub Client-to-Server protocol for user interactions
last_verified: 2026-10-15
verified_against: "ActivityPub REC §6 and Editor's Draft (Oct 2026), FEP-d8c2, Pleroma and Akkoma routers"
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

C2S requires authentication, but the spec leaves the mechanism unspecified: it only lists optional OAuth endpoints (`oauthAuthorizationEndpoint`, `oauthTokenEndpoint`) on the actor's `endpoints` ([AP §B.1](https://www.w3.org/TR/activitypub/#authorization)). Current work on a common profile is [FEP-d8c2](https://codeberg.org/fediverse/fep/src/branch/main/fep/d8c2/fep-d8c2.md) (OAuth 2.0 profile for the ActivityPub API, DRAFT). A bearer token is typical:

```http
POST /users/alice/outbox HTTP/1.1
Host: example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/activity+json
```

## Posting Activities

### Submit to Outbox

Clients discover the outbox from the actor document and POST to it; the request MUST be authenticated as the outbox owner, and the body MUST be a single Activity or a single non-Activity object ([AP §6](https://www.w3.org/TR/activitypub/#client-to-server-interactions)):

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

The server ([AP §6](https://www.w3.org/TR/activitypub/#client-to-server-interactions)):
1. Validates the activity
2. Ignores any client-supplied activity `id` and assigns its own (MUST)
3. For a `Create`, assigns an `id` to the new object
4. Sets the `actor` property
5. Adds the activity to the outbox collection (MUST)
6. Removes `bto`/`bcc` before delivery (MUST) and delivers to recipients (S2S)

### Response

```http
HTTP/1.1 201 Created
Location: https://example.com/activities/123
```

The server MUST answer `201 Created` and, unless the activity is transient, MUST put the new `id` in `Location`.

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
- `id` to activity and object
- `actor` property
- `attributedTo` on the object — the actor SHOULD be copied there ([AP §6.2](https://www.w3.org/TR/activitypub/#create-activity-outbox))
- Recipients: the server SHOULD copy addressing between the `Create` and its object so they match
- A `published` timestamp (not required by AP, but expected by most software)

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

In C2S, `Update` is a **partial** update: each top-level key supplied replaces the stored value ([AP §6.3.1](https://www.w3.org/TR/activitypub/#partial-updates)). The current Editor's Draft no longer describes using `null` to remove a field ([ED](https://w3c.github.io/activitypub/)). When the server federates the change, it sends the **complete** object.

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

The server MUST wrap it in a `Create`, and copy the object's `to`, `bto`, `cc`, `bcc` and `audience` onto that activity ([AP §6.2.1](https://www.w3.org/TR/activitypub/#object-without-create)).

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

The Recommendation leaves media upload out of scope ([AP §6.12](https://www.w3.org/TR/activitypub/#uploading-media), non-normative) and points to the SocialCG's [ActivityPub Media Upload](https://www.w3.org/wiki/SocialCG/ActivityPub/MediaUpload) report, which describes an `uploadMedia` endpoint; Pleroma implements one at `/api/ap/upload_media`. In practice each server has its own upload API; the example below is illustrative (`/api/v1/media` is Mastodon's *client API*, not ActivityPub):

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

    // Wrap bare objects in Create, copying addressing (AP §6.2.1)
    if (!isActivityType(activity.type)) {
      const object = activity;
      activity = { '@context': 'https://www.w3.org/ns/activitystreams', type: 'Create', object };
      for (const field of ['to', 'bto', 'cc', 'bcc', 'audience']) {
        if (object[field]) activity[field] = object[field];
      }
    }

    // Servers MUST ignore a client-supplied activity id (AP §6)
    activity.id = `https://example.com/activities/${crypto.randomUUID()}`;
    activity.actor = actor;
    activity.published = new Date().toISOString();

    if (activity.type === 'Create' && activity.object && typeof activity.object === 'object') {
      // A new object: mint its id too, so clients can't claim arbitrary ids.
      // (For Update/Delete the object id refers to an existing object and
      // must be checked for ownership instead.)
      activity.object.id = `https://example.com/objects/${crypto.randomUUID()}`;
      activity.object.attributedTo = actor;
    }

    // Store activity
    await db.activities.insert(activity);

    // Deliver to recipients (async); strip bto/bcc first (AP §6)
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
| Pleroma | Yes — `POST` outbox, `GET` inbox, media upload ([Pleroma source](https://git.pleroma.social/pleroma/pleroma), `lib/pleroma/web/router.ex`) |
| Akkoma | Reading the inbox only; no outbox `POST` ([router.ex](https://akkoma.dev/AkkomaGang/akkoma/src/branch/develop/lib/pleroma/web/router.ex)) |
| Mastodon | No (uses its own client API) |
| Pixelfed | No |
| Lemmy | No |

## Next Steps

- **[Server-to-Server](/docs/specs/activitypub/server-to-server)** - Federation protocol
- **[Delivery](/docs/specs/activitypub/delivery)** - How activities are sent
- **[Building an Actor](/docs/guides/building-an-actor)** - Implementation guide
