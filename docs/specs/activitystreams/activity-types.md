---
sidebar_position: 3
title: Activity Types
description: All activity types defined in ActivityStreams 2.0
---

# Activity Types

ActivityStreams 2.0 defines a comprehensive set of activity types for describing actions. These are organized into categories based on their purpose.

## Activity Categories

<svg viewBox="0 0 520 240" style={{maxWidth: '520px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="actGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="510" height="230" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="510" height="32" rx="12" fill="url(#actGrad)"/>
  <text x="260" y="26" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">ACTIVITY TYPE CATEGORIES</text>

  {/* Row 1 */}
  {/* Content */}
  <rect x="20" y="50" width="155" height="55" rx="8" fill="url(#actGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="97" y="70" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Content</text>
  <text x="97" y="88" textAnchor="middle" fill="currentColor" fontSize="10">Create, Update, Delete</text>

  {/* Relationship */}
  <rect x="185" y="50" width="155" height="55" rx="8" fill="url(#actGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="262" y="70" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Relationship</text>
  <text x="262" y="88" textAnchor="middle" fill="currentColor" fontSize="10">Follow, Accept, Reject,</text>
  <text x="262" y="100" textAnchor="middle" fill="currentColor" fontSize="10">Block, Ignore</text>

  {/* Reaction */}
  <rect x="350" y="50" width="155" height="55" rx="8" fill="url(#actGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="427" y="70" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Reaction</text>
  <text x="427" y="88" textAnchor="middle" fill="currentColor" fontSize="10">Like, Dislike, Announce</text>

  {/* Row 2 */}
  {/* Collection */}
  <rect x="20" y="115" width="155" height="55" rx="8" fill="url(#actGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="97" y="135" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Collection</text>
  <text x="97" y="153" textAnchor="middle" fill="currentColor" fontSize="10">Add, Remove, Move</text>

  {/* Notification */}
  <rect x="185" y="115" width="155" height="55" rx="8" fill="url(#actGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="262" y="135" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Notification</text>
  <text x="262" y="153" textAnchor="middle" fill="currentColor" fontSize="10">Offer, Invite, Flag</text>

  {/* Negation */}
  <rect x="350" y="115" width="155" height="55" rx="8" fill="url(#actGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="427" y="135" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">Negation</text>
  <text x="427" y="153" textAnchor="middle" fill="currentColor" fontSize="10">Undo</text>

  {/* Bottom info */}
  <text x="260" y="195" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.8">Most common: Create, Follow, Like, Announce, Undo</text>
  <text x="260" y="212" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.6">Each category serves a specific purpose in federated social networking</text>
</svg>

## Content Activities

### Create

Indicates a new object has been created.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://example.com/activities/create/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/1",
    "content": "Hello, world!"
  },
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

**Usage:** Creating posts, articles, images, or any new content.

### Update

Indicates an existing object has been modified.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Update",
  "id": "https://example.com/activities/update/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "id": "https://example.com/notes/1",
    "content": "Hello, world! (edited)"
  },
  "published": "2024-01-15T12:00:00Z"
}
```

**Usage:** Editing posts, updating profiles, modifying settings.

### Delete

Indicates an object has been deleted.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Delete",
  "id": "https://example.com/activities/delete/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/1",
  "published": "2024-01-15T14:00:00Z"
}
```

**Result:** The object should return a Tombstone or 410 Gone.

## Relationship Activities

### Follow

Indicates the actor wants to receive updates from the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  "id": "https://example.com/activities/follow/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/users/bob"
}
```

**Response:** The target should respond with Accept or Reject.

### Accept

Indicates approval of another activity.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Accept",
  "id": "https://example.com/activities/accept/1",
  "actor": "https://example.com/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/follow/1",
    "actor": "https://example.com/users/alice",
    "object": "https://example.com/users/bob"
  }
}
```

**Usage:** Accepting follows, event invitations, friend requests.

### Reject

Indicates disapproval of another activity.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Reject",
  "id": "https://example.com/activities/reject/1",
  "actor": "https://example.com/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/follow/1",
    "actor": "https://example.com/users/alice",
    "object": "https://example.com/users/bob"
  }
}
```

**Usage:** Rejecting follow requests, declining invitations.

### Block

Indicates the actor is blocking the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Block",
  "id": "https://example.com/activities/block/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/users/spammer"
}
```

**Note:** Block activities should generally not be delivered to the blocked actor.

### Ignore

Indicates the actor is ignoring the object (muting).

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Ignore",
  "id": "https://example.com/activities/ignore/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/users/annoying"
}
```

**Usage:** Muting users without blocking them.

## Reaction Activities

### Like

Indicates the actor likes or approves of the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Like",
  "id": "https://example.com/activities/like/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/123"
}
```

**Usage:** Liking posts, favoriting content.

### Dislike

Indicates the actor dislikes or disapproves of the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Dislike",
  "id": "https://example.com/activities/dislike/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/456"
}
```

**Note:** Not widely used in Mastodon, but supported by Lemmy and others.

### Announce

Indicates the actor is sharing/boosting the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Announce",
  "id": "https://example.com/activities/announce/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/789",
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://example.com/users/alice/followers",
    "https://example.com/users/bob"
  ]
}
```

**Usage:** Retweets, boosts, shares.

## Collection Activities

### Add

Indicates the actor has added the object to the target collection.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Add",
  "id": "https://example.com/activities/add/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/123",
  "target": "https://example.com/users/alice/collections/favorites"
}
```

**Usage:** Adding to collections, bookmarks, playlists.

### Remove

Indicates the actor has removed the object from the target collection.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Remove",
  "id": "https://example.com/activities/remove/1",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/123",
  "target": "https://example.com/users/alice/collections/favorites"
}
```

### Move

Indicates the actor is moving the object to a new location.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Move",
  "id": "https://old.example/activities/move/1",
  "actor": "https://old.example/users/alice",
  "object": "https://old.example/users/alice",
  "target": "https://new.example/users/alice"
}
```

**Usage:** Account migration between servers.

## Notification Activities

### Flag

Indicates the actor is reporting the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Flag",
  "id": "https://example.com/activities/flag/1",
  "actor": "https://example.com/actor",
  "object": [
    "https://other.example/users/badactor",
    "https://other.example/notes/offensive"
  ],
  "content": "This user is posting spam"
}
```

**Usage:** Reporting users or content to moderators.

### Offer

Indicates the actor is offering the object to the target.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Offer",
  "id": "https://example.com/activities/offer/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Event",
    "name": "Birthday Party"
  },
  "target": "https://example.com/users/bob"
}
```

### Invite

Indicates the actor is inviting the target to the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Invite",
  "id": "https://example.com/activities/invite/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Event",
    "name": "Birthday Party"
  },
  "target": "https://example.com/users/bob"
}
```

## Negation Activity

### Undo

Reverses a previous activity.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Undo",
  "id": "https://example.com/activities/undo/1",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Follow",
    "id": "https://example.com/activities/follow/1",
    "actor": "https://example.com/users/alice",
    "object": "https://example.com/users/bob"
  }
}
```

**Usage:** Unfollowing, unliking, unboosting.

## Less Common Activities

### Arrive

Indicates the actor has arrived at a location (IntransitiveActivity).

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Arrive",
  "actor": "https://example.com/users/alice",
  "location": {
    "type": "Place",
    "name": "San Francisco"
  }
}
```

### Leave

Indicates the actor has left a location or group.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Leave",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Group",
    "name": "Photography Club"
  }
}
```

### Join

Indicates the actor has joined a group.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Join",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Group",
    "id": "https://example.com/groups/photography"
  }
}
```

### Read

Indicates the actor has read the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Read",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/articles/1"
}
```

### View

Indicates the actor has viewed the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "View",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/videos/1"
}
```

### Listen

Indicates the actor has listened to the object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Listen",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/audio/podcast-episode-1"
}
```

## Question (IntransitiveActivity)

Represents a poll or question. The object property contains the options.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Question",
  "id": "https://example.com/polls/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "What's your favorite color?",
  "oneOf": [
    { "type": "Note", "name": "Red" },
    { "type": "Note", "name": "Blue" },
    { "type": "Note", "name": "Green" }
  ],
  "endTime": "2024-01-16T10:00:00Z"
}
```

**Options:**
- `oneOf`: Single-choice (radio buttons)
- `anyOf`: Multiple-choice (checkboxes)

## Activity Quick Reference

| Activity | Actor does what | To/with object | Notes |
|----------|-----------------|----------------|-------|
| Create | creates | content | New content |
| Update | modifies | content | Edit existing |
| Delete | removes | content | Permanent removal |
| Follow | subscribes to | actor | Request updates |
| Accept | approves | activity | Confirm action |
| Reject | denies | activity | Deny action |
| Block | blocks | actor | Prevent interaction |
| Like | approves | content | Positive reaction |
| Announce | shares | content | Boost/retweet |
| Undo | reverses | activity | Cancel previous |
| Add | adds object to | collection | Bookmark, etc |
| Remove | removes object from | collection | Unbookmark |
| Flag | reports | content/actor | Moderation |
| Move | relocates | actor | Migration |

## Next Steps

- **[Object Types](/docs/specs/activitystreams/object-types)** - Content types
- **[Actor Types](/docs/specs/activitystreams/actor-types)** - Actor types
- **[Properties](/docs/specs/activitystreams/properties)** - All properties
