---
sidebar_position: 2
title: Activity Types Reference
description: Complete reference for ActivityStreams activity types
---

# Activity Types Reference

This reference covers all activity types used in ActivityPub federation.

## Content Activities

### Create

Creates new content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://example.com/activities/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/1",
    "content": "Hello, world!"
  },
  "to": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

**Processing**: Store the object, notify recipients.

### Update

Modifies existing content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Update",
  "id": "https://example.com/activities/2",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/1",
    "content": "Hello, world! (edited)",
    "updated": "2024-01-15T11:00:00Z"
  }
}
```

**Processing**: Verify actor owns object, update stored content.

### Delete

Removes content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Delete",
  "id": "https://example.com/activities/3",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1"
}
```

**Processing**: Verify ownership, replace with Tombstone.

## Social Activities

### Follow

Request to follow an actor:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  "id": "https://example.com/activities/4",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/users/bob"
}
```

**Processing**: Add to pending follows, send Accept or Reject.

### Accept

Accepts a request (usually Follow):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Accept",
  "id": "https://other.example/activities/5",
  "actor": "https://other.example/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/4",
    "actor": "https://example.com/users/alice",
    "object": "https://other.example/users/bob"
  }
}
```

**Processing**: Add to following list, start receiving content.

### Reject

Rejects a request:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Reject",
  "id": "https://other.example/activities/6",
  "actor": "https://other.example/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/4"
  }
}
```

**Processing**: Remove from pending follows.

## Reaction Activities

### Like

Express appreciation:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Like",
  "id": "https://example.com/activities/7",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/notes/1"
}
```

**Processing**: Store like, notify author.

### Announce

Share/boost content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Announce",
  "id": "https://example.com/activities/8",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/notes/1",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://other.example/users/bob",
    "https://example.com/users/alice/followers"
  ]
}
```

**Processing**: Store boost, notify author, deliver to followers.

## Negative Activities

### Block

Block an actor:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Block",
  "id": "https://example.com/activities/9",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/users/spammer"
}
```

**Note**: Usually kept local, only federated if you want the blocked party to know.

### Flag

Report content/actors:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Flag",
  "id": "https://example.com/activities/10",
  "actor": "https://example.com/users/alice",
  "object": [
    "https://other.example/users/abuser",
    "https://other.example/notes/offensive"
  ],
  "content": "This user is posting abusive content"
}
```

**Processing**: Create moderation report for admins.

## Undo Activity

Reverses a previous activity:

### Undo Follow

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Undo",
  "id": "https://example.com/activities/11",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/4",
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
  "id": "https://example.com/activities/12",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Like",
    "id": "https://example.com/activities/7"
  }
}
```

### Undo Announce

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Undo",
  "id": "https://example.com/activities/13",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Announce",
    "id": "https://example.com/activities/8"
  }
}
```

## Collection Activities

### Add

Add to a collection (e.g., pin a post):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Add",
  "id": "https://example.com/activities/14",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1",
  "target": "https://example.com/users/alice/collections/featured"
}
```

### Remove

Remove from a collection:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Remove",
  "id": "https://example.com/activities/15",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1",
  "target": "https://example.com/users/alice/collections/featured"
}
```

## Migration Activity

### Move

Account migration:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Move",
  "id": "https://old.example/activities/16",
  "actor": "https://old.example/users/alice",
  "object": "https://old.example/users/alice",
  "target": "https://new.example/users/alice"
}
```

## Activity Summary

| Activity | Purpose | Common Use |
|----------|---------|------------|
| Create | New content | Posts, notes |
| Update | Edit content | Editing posts |
| Delete | Remove content | Deleting posts |
| Follow | Subscribe | Following users |
| Accept | Approve request | Accept follows |
| Reject | Deny request | Reject follows |
| Like | React positively | Favorites |
| Announce | Share content | Boosts/reblogs |
| Undo | Reverse action | Unfollow, unlike |
| Block | Block actor | Blocking users |
| Flag | Report | Reporting abuse |
| Add | Add to collection | Pin posts |
| Remove | Remove from collection | Unpin posts |
| Move | Migrate account | Account moves |

## See Also

- **[Object Types](/docs/reference/object-types)** - Content types
- **[Handling Activities](/docs/guides/handling-incoming-activities)** - Processing
- **[Sending Activities](/docs/guides/sending-activities)** - Delivery
