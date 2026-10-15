---
sidebar_position: 3
title: Objects
description: Content objects in ActivityPub - Notes, Articles, Images, and more
last_verified: 2026-10-15
verified_against: "ActivityPub REC §3, §6.4, AS2 Vocabulary, Mastodon v4.7.3 source (tag_manager, note_serializer, context_helper), Lemmy 0.19.20 page.json fixture"
---

# Objects

Objects in ActivityPub represent content — posts, images, videos, events, and more. They're the "things" that activities act upon.

## Base Object Properties

All objects can have these properties:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "Hello, Fediverse!",
  "published": "2024-01-15T10:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Core Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | String | Object type (Note, Article, etc.) |
| `id` | URL | Unique, publicly dereferenceable identifier (HTTPS); MUST be present except on transient objects ([AP §3.1](https://www.w3.org/TR/activitypub/#obj-id)) |
| `attributedTo` | URL/Actor | Creator of the object |
| `content` | String | Main content (HTML allowed) |
| `published` | DateTime | Creation timestamp |
| `updated` | DateTime | Last modification timestamp |

### Addressing

| Property | Description |
|----------|-------------|
| `to` | Primary recipients |
| `cc` | Secondary recipients |
| `bto` | Private primary recipients |
| `bcc` | Private secondary recipients |

### Content Properties

| Property | Description |
|----------|-------------|
| `summary` | Content warning or preview |
| `contentMap` | Localized content `{"en": "Hello"}` |
| `source` | The source the `content` was rendered from, e.g. Markdown ([AP §3.3](https://www.w3.org/TR/activitypub/#source-property)) |
| `mediaType` | MIME type of content |

## Common Object Types

### Note

Short-form content (like tweets/toots):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>Hello, Fediverse! 👋</p>",
  "published": "2024-01-15T10:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"],
  "sensitive": false,
  "tag": [],
  "attachment": []
}
```

### Article

Long-form content (blog posts):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Article",
  "id": "https://blog.example/posts/1",
  "attributedTo": "https://blog.example/users/writer",
  "name": "My First Blog Post",
  "content": "<p>This is the full content...</p>",
  "summary": "A brief introduction to my blog",
  "published": "2024-01-15T10:30:00Z",
  "url": "https://blog.example/posts/my-first-blog-post"
}
```

Key difference: `Article` typically has a `name` (title), `Note` does not.

### Image

Photo posts:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Image",
  "id": "https://example.com/photos/1",
  "attributedTo": "https://example.com/users/photographer",
  "name": "Sunset at the beach",
  "url": {
    "type": "Link",
    "href": "https://example.com/media/1.jpg",
    "mediaType": "image/jpeg",
    "width": 1920,
    "height": 1080
  }
}
```

:::note Photo posts in practice
Most fediverse software — including Pixelfed — federates a photo post as a **`Note` with `Image` attachments**, not as a top-level `Image` ([Pixelfed ActivityPub docs](https://docs.pixelfed.org/spec/ActivityPub.html)). A bare `Image` object is valid AS2, but many servers won't display it.
:::

### Video

Video content (a generic AS2 example — PeerTube's real format is covered in the [PeerTube guide](/docs/guides/peertube-compatibility)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Video",
  "id": "https://video.example/videos/1",
  "attributedTo": "https://video.example/accounts/creator",
  "name": "Tutorial: Building with ActivityPub",
  "duration": "PT15M30S",
  "url": [
    {
      "type": "Link",
      "href": "https://video.example/videos/1.mp4",
      "mediaType": "video/mp4",
      "height": 1080
    },
    {
      "type": "Link",
      "href": "https://video.example/videos/1.webm",
      "mediaType": "video/webm"
    }
  ]
}
```

### Page

Lemmy posts are `Page` objects addressed to a community. Lemmy puts the shared link in `attachment` as a `Link`, not in `url`, and sets `audience` to the community (based on Lemmy's [page.json fixture](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/objects/page.json)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Page",
  "id": "https://lemmy.example/post/1",
  "attributedTo": "https://lemmy.example/u/alice",
  "to": [
    "https://lemmy.example/c/technology",
    "https://www.w3.org/ns/activitystreams#Public"
  ],
  "audience": "https://lemmy.example/c/technology",
  "name": "Interesting Article About ActivityPub",
  "content": "<p>This is my commentary on the article...</p>",
  "mediaType": "text/html",
  "attachment": [
    { "type": "Link", "href": "https://example.com/article" }
  ]
}
```

See the [Lemmy guide](/docs/guides/lemmy-compatibility) for details.

### Event

Calendar events:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Event",
  "id": "https://events.example/events/1",
  "name": "Fediverse Developer Meetup",
  "startTime": "2024-02-15T18:00:00Z",
  "endTime": "2024-02-15T21:00:00Z",
  "location": {
    "type": "Place",
    "name": "Community Center"
  }
}
```

## Replies

Objects can be replies to other objects:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/2",
  "attributedTo": "https://example.com/users/bob",
  "content": "Great point!",
  "inReplyTo": "https://other.example/notes/1",
  "to": [
    "https://other.example/users/alice",
    "https://www.w3.org/ns/activitystreams#Public"
  ]
}
```

### Reply Collection

Posts can link to their replies:

```json
{
  "type": "Note",
  "id": "https://example.com/notes/1",
  "replies": {
    "type": "Collection",
    "id": "https://example.com/notes/1/replies",
    "first": "https://example.com/notes/1/replies?page=1"
  }
}
```

## Media Attachments

Objects can have media attachments:

```json
{
  "type": "Note",
  "content": "Check out this photo!",
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo.jpg",
      "name": "A beautiful sunset",
      "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

### Blurhash

Mastodon uses blurhash for image placeholders (`toot:blurhash` in its [context](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb)):

```json
{
  "type": "Document",
  "url": "https://example.com/image.jpg",
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
}
```

## Tags

`Mention` is part of AS2. `Hashtag`, `Emoji` and `sensitive` are extensions: declare `"Hashtag": "as:Hashtag"`, `"sensitive": "as:sensitive"` and `"toot": "http://joinmastodon.org/ns#"`, `"Emoji": "toot:Emoji"` in your `@context`, as Mastodon does ([context_helper.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb)).

### Hashtags

```json
{
  "type": "Note",
  "content": "<p>Learning about <a href=\"https://example.com/tags/activitypub\">#activitypub</a></p>",
  "tag": [
    {
      "type": "Hashtag",
      "href": "https://example.com/tags/activitypub",
      "name": "#activitypub"
    }
  ]
}
```

### Mentions

```json
{
  "type": "Note",
  "content": "<p>Hey <a href=\"https://other.example/users/bob\">@bob</a>!</p>",
  "tag": [
    {
      "type": "Mention",
      "href": "https://other.example/users/bob",
      "name": "@bob@other.example"
    }
  ],
  "to": ["https://other.example/users/bob"]
}
```

### Custom Emoji

```json
{
  "type": "Note",
  "content": "<p>This is awesome :awesome:</p>",
  "tag": [
    {
      "type": "Emoji",
      "id": "https://example.com/emoji/awesome",
      "name": ":awesome:",
      "icon": {
        "type": "Image",
        "url": "https://example.com/emoji/awesome.png",
        "mediaType": "image/png"
      }
    }
  ]
}
```

## Content Warnings

Use `sensitive` and `summary` for content warnings:

```json
{
  "type": "Note",
  "sensitive": true,
  "summary": "Spoilers for the new movie",
  "content": "<p>The ending was amazing when...</p>"
}
```

## Visibility

AP has no visibility levels; they are conventions built from addressing. These are Mastodon's mappings ([tag_manager.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/tag_manager.rb#L173-L230)); Mastodon also adds mentioned accounts to `cc` (or to `to` for direct messages):

### Public

```json
{
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Unlisted (Public but not in timelines)

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

### Followers-Only

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": []
}
```

### Direct Message

```json
{
  "to": ["https://other.example/users/bob"],
  "cc": [],
  "tag": [
    { "type": "Mention", "href": "https://other.example/users/bob", "name": "@bob@other.example" }
  ]
}
```

Include a `Mention` tag for each recipient — see [Direct Messages](/docs/guides/direct-messages).

## Polls (Question)

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Question",
  "id": "https://example.com/questions/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "What's your favorite programming language?",
  "endTime": "2024-01-22T10:30:00Z",
  "oneOf": [
    {
      "type": "Note",
      "name": "JavaScript",
      "replies": {
        "type": "Collection",
        "totalItems": 42
      }
    },
    {
      "type": "Note",
      "name": "Python",
      "replies": {
        "type": "Collection",
        "totalItems": 38
      }
    }
  ]
}
```

Use `oneOf` for single-choice, `anyOf` for multiple-choice.

## Location

Adding location to objects:

```json
{
  "type": "Note",
  "content": "Beautiful day at the park!",
  "location": {
    "type": "Place",
    "name": "Central Park",
    "latitude": 40.785091,
    "longitude": -73.968285
  }
}
```

## Object Fetching

When you receive a reference to an object, you may need to fetch it. Clients MUST send the `ld+json` profile media type ([AP §3.2](https://www.w3.org/TR/activitypub/#retrieving-objects)); sending both types is the safe choice:

```http
GET /notes/1 HTTP/1.1
Host: example.com
Accept: application/ld+json; profile="https://www.w3.org/ns/activitystreams", application/activity+json
```

Only trust the result if its `id` is on the origin you fetched it from — see [Origin model](/docs/security/origin-model). Servers with authorized fetch require the GET to be signed — see [Authorized Fetch](/docs/security/authorized-fetch).

## Tombstones

Deleted objects become Tombstones:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Tombstone",
  "id": "https://example.com/notes/1",
  "formerType": "Note",
  "deleted": "2024-01-16T12:00:00Z"
}
```

If a deleted object is requested, the server SHOULD respond with 410 Gone when it serves a Tombstone, or 404 Not Found otherwise ([AP §6.4](https://www.w3.org/TR/activitypub/#delete-activity-outbox)). Mastodon returns 404 for deleted posts — see [Deletion](/docs/guides/deletion).

## Next Steps

- **[Activities](/docs/specs/activitypub/activities)** - Actions on objects
- **[Collections](/docs/specs/activitypub/collections)** - Groups of objects
- **[Posts and Replies](/docs/guides/posts-and-replies)** - Implementation guide
- **[Threads, Replies and Backfill](/docs/guides/threads-replies-and-backfill)** - The `context` and `replies` properties in practice
