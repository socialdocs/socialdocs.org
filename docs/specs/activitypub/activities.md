---
sidebar_position: 4
title: Activities
description: Activity types in ActivityPub - Create, Follow, Like, and more
---

# Activities

Activities are the verbs of ActivityPub — they represent actions that actors perform. When a user posts, follows someone, or likes content, those actions are represented as Activity objects.

## Activity Structure

All activities share a common structure:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://example.com/activities/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"],
  "published": "2024-01-15T10:30:00Z"
}
```

### Core Properties

| Property | Required | Description |
|----------|----------|-------------|
| `type` | Yes | Activity type |
| `id` | Yes | Unique identifier |
| `actor` | Yes | Who performed the activity |
| `object` | Usually | Target of the activity |
| `to` | No | Primary recipients |
| `cc` | No | Secondary recipients |
| `published` | No | When performed |

## Content Activities

### Create

Creates new content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://example.com/activities/create-1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/1",
    "attributedTo": "https://example.com/users/alice",
    "content": "Hello, world!",
    "to": ["https://www.w3.org/ns/activitystreams#Public"]
  },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

:::note
When receiving a Create, verify that `activity.actor` matches `object.attributedTo`.
:::

### Update

Modifies existing content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Update",
  "id": "https://example.com/activities/update-1",
  "actor": "https://example.com/users/alice",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/1",
    "attributedTo": "https://example.com/users/alice",
    "to": ["https://www.w3.org/ns/activitystreams#Public"],
    "content": "Hello, world! (edited)",
    "published": "2024-01-15T10:00:00Z",
    "updated": "2024-01-15T11:00:00Z"
  }
}
```

Only the original author (or server) should be able to Update objects.

:::warning Server-to-server Update is a full replacement
Between servers, an `Update` carries the **complete** new object, not a patch: receivers replace their copy wholesale ([AP §7.3](https://www.w3.org/TR/activitypub/#update-activity-inbox)). Partial updates only exist in the client-to-server API ([AP §6.3](https://www.w3.org/TR/activitypub/#update-activity-outbox)).
:::

### Delete

Removes content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Delete",
  "id": "https://example.com/activities/delete-1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1",
  "to": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

When receiving Delete:
1. Verify the actor owns the object (same origin as the object's `id`, and the object's `attributedTo`)
2. Remove your copy, or replace it with a `Tombstone`

The *origin* server (the one that hosts the object) then answers future fetches with `410 Gone` if it serves a `Tombstone`, or `404 Not Found` otherwise ([AP §6.4](https://www.w3.org/TR/activitypub/#delete-activity-outbox)). Receivers don't serve the object, so they have nothing to return.

## Social Activities

### Follow

Request to follow an actor:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  "id": "https://example.com/activities/follow-1",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/users/bob"
}
```

The receiving server should respond with Accept or Reject.

### Accept

Accepts a Follow (or other request):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Accept",
  "id": "https://other.example/activities/accept-1",
  "actor": "https://other.example/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/follow-1",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/users/bob"
  }
}
```

### Reject

Rejects a Follow request:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Reject",
  "id": "https://other.example/activities/reject-1",
  "actor": "https://other.example/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/follow-1",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/users/bob"
  }
}
```

## Reaction Activities

### Like

Express appreciation:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Like",
  "id": "https://example.com/activities/like-1",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/notes/1"
}
```

### Announce (Boost/Reblog)

Share content with your followers:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Announce",
  "id": "https://example.com/activities/announce-1",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/notes/1",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://other.example/users/bob",
    "https://example.com/users/alice/followers"
  ]
}
```

## Negative Activities

### Block

Block an actor:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Block",
  "id": "https://example.com/activities/block-1",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/users/spammer"
}
```

:::note
The spec says servers SHOULD NOT deliver `Block` to its object ([AP §6.9](https://www.w3.org/TR/activitypub/#block-activity-outbox)), but **Mastodon does send it** to the blocked user's server, which uses it to hide the blocker's posts and disallow mentions ([Mastodon docs](https://docs.joinmastodon.org/spec/activitypub/#Block)). Expect to receive Blocks, and don't treat delivery as guaranteed enforcement.
:::

### Flag (Report)

Report content or actors:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Flag",
  "id": "https://example.com/activities/flag-1",
  "actor": "https://example.com/actor",
  "object": [
    "https://other.example/users/abuser",
    "https://other.example/notes/offensive"
  ],
  "content": "This user is posting abusive content"
}
```

Send to the remote server's inbox (actor or shared inbox). Mastodon sends `Flag` from its **instance actor** rather than the reporting user, so the reporter stays anonymous to the remote server ([Mastodon docs](https://docs.joinmastodon.org/spec/activitypub/)); do the same.

## Undo

Reverses a previous activity:

### Undo Follow (Unfollow)

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Undo",
  "id": "https://example.com/activities/undo-1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/follow-1",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/users/bob"
  }
}
```

### Undo Like

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Undo",
  "id": "https://example.com/activities/undo-2",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Like",
    "id": "https://example.com/activities/like-1",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/notes/1"
  }
}
```

### Undo Announce

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Undo",
  "id": "https://example.com/activities/undo-3",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Announce",
    "id": "https://example.com/activities/announce-1"
  }
}
```

## Collection Activities

### Add

Add an object to a collection:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Add",
  "id": "https://example.com/activities/add-1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1",
  "target": "https://example.com/users/alice/collections/featured"
}
```

Used for pinning posts to profile.

### Remove

Remove an object from a collection:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Remove",
  "id": "https://example.com/activities/remove-1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1",
  "target": "https://example.com/users/alice/collections/featured"
}
```

## Move

For account migration. Before sending, the **new** account must list the old one in its `alsoKnownAs`; receivers (including Mastodon) reject the Move otherwise. [FEP-7628](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md) (FINAL) describes the full flow:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Move",
  "id": "https://old.example/activities/move-1",
  "actor": "https://old.example/users/alice",
  "object": "https://old.example/users/alice",
  "target": "https://new.example/users/alice"
}
```

## Activity Processing

### Handling Incoming Activities

Only dispatch an activity after the request has been authenticated: the HTTP signature verified over the raw body, and the signing key's owner confirmed to be `activity.actor`. That step is covered, with tested code, in [Verifying incoming requests](/docs/security/verifying-requests); the dispatcher below assumes it has already happened.

```javascript
// `activity` has already passed verifyRequest() + parseActivityFrom()
// (see /docs/security/verifying-requests), so activity.actor is the signer.
async function handleActivity(activity) {
  switch (activity.type) {
    case 'Create':
      return handleCreate(activity);
    case 'Update':
      return handleUpdate(activity);
    case 'Delete':
      return handleDelete(activity);
    case 'Follow':
      return handleFollow(activity);
    case 'Accept':
      return handleAccept(activity);
    case 'Reject':
      return handleReject(activity);
    case 'Like':
      return handleLike(activity);
    case 'Announce':
      return handleAnnounce(activity);
    case 'Undo':
      return handleUndo(activity);
    default:
      console.log('Unknown activity type:', activity.type);
      return { status: 202 };
  }
}
```

### Side Effects

Activities trigger side effects:

| Activity | Side Effects |
|----------|--------------|
| Create | Store object, notify mentioned users |
| Update | Update stored object, notify |
| Delete | Remove object, cascade to local copies |
| Follow | Add pending follow or auto-accept |
| Accept | Add to following, start delivery |
| Like | Increment counter, notify author |
| Announce | Add boost, notify author |
| Undo | Reverse the original activity's effects |

## Idempotency

Activities should be idempotent — processing the same activity twice should have the same result as processing it once.

```javascript
async function handleLike(activity) {
  const existing = await db.likes.findOne({
    activityId: activity.id
  });

  if (existing) {
    // Already processed, ignore
    return { status: 200 };
  }

  await db.likes.insert({
    activityId: activity.id,
    actor: activity.actor,
    object: activity.object,
    createdAt: new Date()
  });

  return { status: 201 };
}
```

## Next Steps

- **[Collections](/docs/specs/activitypub/collections)** - Organizing activities
- **[Delivery](/docs/specs/activitypub/delivery)** - Sending activities
- **[Handling Activities](/docs/guides/handling-incoming-activities)** - Implementation
