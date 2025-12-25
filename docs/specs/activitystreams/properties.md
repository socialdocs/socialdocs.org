---
sidebar_position: 7
title: Properties
description: Complete reference of ActivityStreams 2.0 properties
---

# Properties Reference

This is a comprehensive reference of all properties defined in ActivityStreams 2.0.

## Core Properties

### @context

JSON-LD context definition.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams"
}
```

Can be an array for multiple contexts:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "toot": "http://joinmastodon.org/ns#",
      "sensitive": "as:sensitive"
    }
  ]
}
```

### type

The object type(s).

```json
{ "type": "Note" }
{ "type": ["Note", "Object"] }
```

### id

Globally unique identifier (URI).

```json
{ "id": "https://example.com/notes/12345" }
```

## Object Properties

### name

Human-readable name/title.

```json
{ "name": "My Blog Post" }
```

### nameMap

Localized names.

```json
{
  "nameMap": {
    "en": "Hello",
    "de": "Hallo",
    "ja": "こんにちは"
  }
}
```

### content

Text content (typically HTML).

```json
{ "content": "<p>Hello, world!</p>" }
```

### contentMap

Localized content.

```json
{
  "contentMap": {
    "en": "<p>Hello, world!</p>",
    "es": "<p>¡Hola, mundo!</p>"
  }
}
```

### summary

Brief description or content warning.

```json
{ "summary": "Discussion of spoilers" }
```

### mediaType

MIME type of content.

```json
{ "mediaType": "text/html" }
{ "mediaType": "text/markdown" }
```

### source

Original source format.

```json
{
  "content": "<p><strong>Hello</strong></p>",
  "source": {
    "content": "**Hello**",
    "mediaType": "text/markdown"
  }
}
```

## Temporal Properties

### published

When the object was created.

```json
{ "published": "2024-01-15T10:30:00Z" }
```

### updated

When the object was last modified.

```json
{ "updated": "2024-01-15T14:45:00Z" }
```

### startTime

Start time for events or activities.

```json
{ "startTime": "2024-02-01T18:00:00Z" }
```

### endTime

End time for events.

```json
{ "endTime": "2024-02-01T21:00:00Z" }
```

### duration

Duration in ISO 8601 format.

```json
{ "duration": "PT2H30M" }
```

## Attribution Properties

### attributedTo

Who created the object.

```json
{ "attributedTo": "https://example.com/users/alice" }
```

Multiple authors:

```json
{
  "attributedTo": [
    "https://example.com/users/alice",
    "https://example.com/users/bob"
  ]
}
```

### generator

Application that created the object.

```json
{
  "generator": {
    "type": "Application",
    "name": "MyApp",
    "url": "https://myapp.example"
  }
}
```

## Addressing Properties

### to

Primary recipients (public).

```json
{ "to": ["https://www.w3.org/ns/activitystreams#Public"] }
```

### cc

Secondary recipients (public).

```json
{ "cc": ["https://example.com/users/alice/followers"] }
```

### bto

Blind primary recipients (hidden).

```json
{ "bto": ["https://example.com/users/admin"] }
```

### bcc

Blind secondary recipients (hidden).

```json
{ "bcc": ["https://example.com/users/moderator"] }
```

### audience

Target audience.

```json
{ "audience": "https://lemmy.example/c/technology" }
```

## Relationship Properties

### inReplyTo

What this object is replying to.

```json
{ "inReplyTo": "https://example.com/notes/123" }
```

### replies

Collection of replies.

```json
{
  "replies": {
    "type": "Collection",
    "totalItems": 5,
    "first": "https://example.com/notes/123/replies?page=1"
  }
}
```

### tag

Associated tags (mentions, hashtags, emoji).

```json
{
  "tag": [
    { "type": "Mention", "href": "https://example.com/users/bob", "name": "@bob" },
    { "type": "Hashtag", "href": "https://example.com/tags/fedi", "name": "#fedi" }
  ]
}
```

### attachment

Attached media or documents.

```json
{
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

## Activity Properties

### actor

Who performed the activity.

```json
{ "actor": "https://example.com/users/alice" }
```

### object

What the activity is about.

```json
{ "object": "https://example.com/notes/123" }
```

### target

Indirect object/destination.

```json
{
  "type": "Add",
  "object": "https://example.com/notes/123",
  "target": "https://example.com/collections/favorites"
}
```

### result

Outcome of the activity.

```json
{
  "type": "Create",
  "result": {
    "type": "Note",
    "id": "https://example.com/notes/456"
  }
}
```

### origin

Where the object came from.

```json
{
  "type": "Move",
  "origin": "https://old.example/users/alice"
}
```

### instrument

Tool used to perform the activity.

```json
{
  "instrument": {
    "type": "Application",
    "name": "Mobile App"
  }
}
```

## Collection Properties

### totalItems

Total number of items.

```json
{ "totalItems": 150 }
```

### items

Unordered items.

```json
{ "items": ["https://example.com/1", "https://example.com/2"] }
```

### orderedItems

Ordered items.

```json
{ "orderedItems": ["https://example.com/3", "https://example.com/2", "https://example.com/1"] }
```

### first

First page of collection.

```json
{ "first": "https://example.com/collection?page=1" }
```

### last

Last page of collection.

```json
{ "last": "https://example.com/collection?page=10" }
```

### current

Current page of collection.

```json
{ "current": "https://example.com/collection?page=5" }
```

### next / prev

Pagination links.

```json
{
  "next": "https://example.com/collection?page=6",
  "prev": "https://example.com/collection?page=4"
}
```

### partOf

Parent collection for pages.

```json
{ "partOf": "https://example.com/collection" }
```

## Actor Properties

### inbox

URL to receive activities.

```json
{ "inbox": "https://example.com/users/alice/inbox" }
```

### outbox

URL listing published activities.

```json
{ "outbox": "https://example.com/users/alice/outbox" }
```

### following

Following collection.

```json
{ "following": "https://example.com/users/alice/following" }
```

### followers

Followers collection.

```json
{ "followers": "https://example.com/users/alice/followers" }
```

### liked

Liked items collection.

```json
{ "liked": "https://example.com/users/alice/liked" }
```

### preferredUsername

The @handle part (ASCII, no spaces).

```json
{ "preferredUsername": "alice" }
```

### endpoints

Service endpoints.

```json
{
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

## Link Properties

### href

Target URL.

```json
{ "href": "https://example.com/resource" }
```

### rel

Link relation.

```json
{ "rel": "self" }
```

### hreflang

Target language.

```json
{ "hreflang": "en" }
```

### height / width

Dimensions for media.

```json
{ "height": 1080, "width": 1920 }
```

## Media Properties

### url

Resource URL(s).

```json
{ "url": "https://example.com/image.jpg" }
```

Multiple URLs:

```json
{
  "url": [
    { "type": "Link", "href": "https://example.com/image.jpg", "mediaType": "image/jpeg" },
    { "type": "Link", "href": "https://example.com/image.webp", "mediaType": "image/webp" }
  ]
}
```

### icon

Avatar/icon image.

```json
{
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/avatar.png"
  }
}
```

### image

Header/banner image.

```json
{
  "image": {
    "type": "Image",
    "mediaType": "image/jpeg",
    "url": "https://example.com/header.jpg"
  }
}
```

### preview

Preview of the object.

```json
{
  "preview": {
    "type": "Image",
    "url": "https://example.com/thumbnail.jpg"
  }
}
```

## Location Properties

### location

Physical location.

```json
{
  "location": {
    "type": "Place",
    "name": "San Francisco",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

### latitude / longitude

Geographic coordinates.

```json
{ "latitude": 37.7749, "longitude": -122.4194 }
```

### altitude / accuracy / radius

Location precision.

```json
{ "altitude": 100, "accuracy": 10, "radius": 50 }
```

## Special Properties

### sensitive

Content contains sensitive material.

```json
{ "sensitive": true }
```

### formerType

Original type of deleted object.

```json
{
  "type": "Tombstone",
  "formerType": "Note",
  "deleted": "2024-01-15T14:00:00Z"
}
```

### deleted

When the object was deleted.

```json
{ "deleted": "2024-01-15T14:00:00Z" }
```

## Mastodon Extensions

### discoverable

Show in directory.

```json
{ "discoverable": true }
```

### manuallyApprovesFollowers

Locked account.

```json
{ "manuallyApprovesFollowers": true }
```

### featured

Pinned posts collection.

```json
{ "featured": "https://example.com/users/alice/collections/featured" }
```

### movedTo / alsoKnownAs

Account migration.

```json
{
  "movedTo": "https://new.example/users/alice",
  "alsoKnownAs": ["https://old.example/users/alice"]
}
```

### publicKey

RSA public key for signatures.

```json
{
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

## Property Quick Reference

| Property | Applies To | Type | Required |
|----------|------------|------|----------|
| id | All | URI | Yes* |
| type | All | String/Array | Yes |
| actor | Activity | URI/Object | Yes |
| object | Activity | URI/Object | Usually |
| inbox | Actor | URI | Yes |
| outbox | Actor | URI | Yes |
| content | Object | String | Common |
| published | Object | DateTime | Common |
| to | Object/Activity | Array | Common |
| cc | Object/Activity | Array | Common |

*Not required for transient objects

## Next Steps

- **[Core Types](/docs/specs/activitystreams/core-types)** - Base types
- **[Activity Types](/docs/specs/activitystreams/activity-types)** - Activity types
- **[Object Types](/docs/specs/activitystreams/object-types)** - Object types
