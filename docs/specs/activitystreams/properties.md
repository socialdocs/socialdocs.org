---
sidebar_position: 7
title: Properties
description: Complete reference of ActivityStreams 2.0 properties
last_verified: 2026-10-15
verified_against: "AS2 Core & Vocabulary (W3C REC 2017), the published AS2 JSON-LD context, ActivityPub REC, Mastodon v4.7.3 source (context_helper.rb, account.rb, json_ld_helper.rb)"
---

# Properties Reference

A reference for the properties you will meet most often. The full, normative list is the [Activity Vocabulary §4](https://www.w3.org/TR/activitystreams-vocabulary/#properties). Actor properties such as `inbox`, `outbox` and `preferredUsername` are defined by [ActivityPub §4.1](https://www.w3.org/TR/activitypub/#actor-objects), not AS2, and extensions are marked as such.

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

The object type(s) — a string or an array; consumers must handle both.

```json
{ "type": "Note" }
{ "type": ["Note", "http://schema.org/CreativeWork"] }
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

Primary recipients. Visible to everyone who can see the object; addressing the special `Public` collection makes the object public.

```json
{ "to": ["https://www.w3.org/ns/activitystreams#Public"] }
```

### cc

Secondary recipients, also visible to everyone who can see the object.

```json
{ "cc": ["https://example.com/users/alice/followers"] }
```

### bto

Blind primary recipients. The sending server MUST remove `bto` and `bcc` before delivery ([AP §6](https://www.w3.org/TR/activitypub/#client-to-server-interactions)).

```json
{ "bto": ["https://example.com/users/admin"] }
```

### bcc

Blind secondary recipients (stripped before delivery, like `bto`).

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

Where the object came from — "the actor has moved `object` from `origin` to `target`" ([AS2 Vocab: Move](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-move)).

```json
{
  "type": "Move",
  "object": "http://example.org/posts/1",
  "origin": { "type": "Collection", "name": "List A" },
  "target": { "type": "Collection", "name": "List B" }
}
```

Account migration (Mastodon) uses `Move` differently: `object` is the old account and `target` the new one, with no `origin`.

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

The @handle part. ActivityPub only calls it "a short username… with no uniqueness guarantees" ([AP §4.1](https://www.w3.org/TR/activitypub/#actor-objects)); Mastodon expects ASCII letters, digits and `_`, with `.` or `-` only between them (`USERNAME_RE` in [account.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/account.rb#L75)), so stick to that for interop.

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

Location precision. `accuracy` is a **percentage** (0–100); `radius` is a distance in `units` (metres by default).

```json
{ "altitude": 100, "accuracy": 94.0, "radius": 50 }
```

## Special Properties

### sensitive

Content contains sensitive material. This is a fediverse **extension** (mapped as `as:sensitive`), not part of AS2. In Mastodon the content-warning text goes in `summary`; `sensitive` is the boolean.

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

None of these are AS2 core. `manuallyApprovesFollowers` and `movedTo` map to `as:` terms, `alsoKnownAs` is in the published AS2 context, and `discoverable` and `featured` are in Mastodon's `toot:` namespace ([context_helper.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb)).

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

Account migration. `movedTo` is set on the **old** account, `alsoKnownAs` on the **new** one (listing the old account) — they appear on different actors.

```json
// Old account (https://old.example/users/alice)
{ "movedTo": "https://new.example/users/alice" }

// New account (https://new.example/users/alice)
{ "alsoKnownAs": ["https://old.example/users/alice"] }
```

### publicKey

Public key for HTTP Signatures, from the [W3C Security Vocabulary](https://w3id.org/security/v1) (not a Mastodon invention). Newer implementations can also publish keys as `Multikey` entries in `assertionMethod` ([FEP-521a](https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md)).

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
| actor | Activity | URI/Object | Yes (in practice) |
| object | Activity | URI/Object | Yes, except IntransitiveActivity |
| inbox | Actor | URI | Yes |
| outbox | Actor | URI | Yes |
| content | Object | String | Common |
| published | Object | DateTime | Common |
| to | Object/Activity | URI/Object, one or many | Common |
| cc | Object/Activity | URI/Object, one or many | Common |

*ActivityPub requires `id` except on intentionally transient objects ([AP §3.1](https://www.w3.org/TR/activitypub/#obj-id)).

## Next Steps

- **[Core Types](/docs/specs/activitystreams/core-types)** - Base types
- **[Activity Types](/docs/specs/activitystreams/activity-types)** - Activity types
- **[Object Types](/docs/specs/activitystreams/object-types)** - Object types
