---
sidebar_position: 1
title: Object Types Reference
description: Complete reference for ActivityStreams object types
---

# Object Types Reference

This reference covers all standard ActivityStreams object types used in the Fediverse.

## Core Object Types

### Note

Short-form text content (the most common type):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>Hello, Fediverse!</p>",
  "published": "2024-01-15T10:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"],
  "sensitive": false,
  "tag": [],
  "attachment": [],
  "inReplyTo": null
}
```

| Property | Type | Description |
|----------|------|-------------|
| `content` | String (HTML) | The post content |
| `published` | DateTime | When created |
| `inReplyTo` | URL | Parent post (for replies) |
| `sensitive` | Boolean | Content warning flag |
| `summary` | String | Content warning text |
| `tag` | Array | Mentions, hashtags, emoji |
| `attachment` | Array | Media attachments |

### Article

Long-form content with a title:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Article",
  "id": "https://blog.example/articles/1",
  "attributedTo": "https://blog.example/users/writer",
  "name": "Understanding ActivityPub",
  "content": "<p>ActivityPub is a protocol...</p>",
  "summary": "An introduction to federated social networking",
  "published": "2024-01-15T10:30:00Z",
  "url": "https://blog.example/posts/understanding-activitypub"
}
```

Key difference from Note: Article has a `name` (title).

### Image

Photo/image content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Image",
  "id": "https://pixelfed.example/p/1",
  "attributedTo": "https://pixelfed.example/users/photographer",
  "name": "Sunset at the beach",
  "url": {
    "type": "Link",
    "href": "https://pixelfed.example/storage/1.jpg",
    "mediaType": "image/jpeg",
    "width": 1920,
    "height": 1080
  }
}
```

### Video

Video content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Video",
  "id": "https://peertube.example/videos/1",
  "attributedTo": "https://peertube.example/accounts/creator",
  "name": "My Video",
  "duration": "PT15M30S",
  "url": [
    {
      "type": "Link",
      "href": "https://peertube.example/videos/1.mp4",
      "mediaType": "video/mp4",
      "height": 1080
    }
  ]
}
```

### Audio

Audio content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Audio",
  "id": "https://funkwhale.example/tracks/1",
  "attributedTo": "https://funkwhale.example/users/musician",
  "name": "My Song",
  "duration": "PT3M45S",
  "url": {
    "type": "Link",
    "href": "https://funkwhale.example/tracks/1.mp3",
    "mediaType": "audio/mpeg"
  }
}
```

### Document

Generic file/attachment:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Document",
  "mediaType": "image/png",
  "url": "https://example.com/files/image.png",
  "name": "Screenshot",
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "width": 1920,
  "height": 1080
}
```

Used primarily for attachments in Notes.

### Page

Link/URL sharing (used by Lemmy):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Page",
  "id": "https://lemmy.example/post/1",
  "attributedTo": "https://lemmy.example/u/alice",
  "name": "Interesting Article",
  "content": "My commentary on this article...",
  "url": "https://example.com/article"
}
```

### Event

Calendar events:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Event",
  "id": "https://events.example/events/1",
  "name": "Developer Meetup",
  "content": "Join us for a discussion about ActivityPub",
  "startTime": "2024-02-15T18:00:00Z",
  "endTime": "2024-02-15T21:00:00Z",
  "location": {
    "type": "Place",
    "name": "Community Center",
    "address": "123 Main St"
  }
}
```

### Question (Poll)

Polls:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Question",
  "id": "https://example.com/polls/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "What's your favorite language?",
  "endTime": "2024-01-22T10:30:00Z",
  "oneOf": [
    {
      "type": "Note",
      "name": "JavaScript",
      "replies": { "type": "Collection", "totalItems": 42 }
    },
    {
      "type": "Note",
      "name": "Python",
      "replies": { "type": "Collection", "totalItems": 38 }
    }
  ]
}
```

Use `oneOf` for single choice, `anyOf` for multiple choice.

### Place

Location information:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Place",
  "name": "Central Park",
  "latitude": 40.785091,
  "longitude": -73.968285,
  "address": "New York, NY"
}
```

### Tombstone

Deleted content:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Tombstone",
  "id": "https://example.com/notes/1",
  "formerType": "Note",
  "deleted": "2024-01-16T12:00:00Z"
}
```

## Fediverse Extensions

### Emoji (Custom Emoji)

```json
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
```

### Hashtag

```json
{
  "type": "Hashtag",
  "href": "https://example.com/tags/activitypub",
  "name": "#activitypub"
}
```

### Mention

```json
{
  "type": "Mention",
  "href": "https://example.com/users/bob",
  "name": "@bob@example.com"
}
```

### PropertyValue (Profile Fields)

```json
{
  "type": "PropertyValue",
  "name": "Website",
  "value": "<a href=\"https://example.com\" rel=\"me\">example.com</a>"
}
```

## Type Summary Table

| Type | Primary Use | Has Title |
|------|-------------|-----------|
| Note | Short posts, toots | No |
| Article | Blog posts | Yes |
| Image | Photos | Yes |
| Video | Videos | Yes |
| Audio | Music, podcasts | Yes |
| Document | Attachments | Optional |
| Page | Link shares | Yes |
| Event | Calendar events | Yes |
| Question | Polls | No |
| Place | Locations | Yes |
| Tombstone | Deleted content | No |

## See Also

- **[Activity Types](/docs/reference/activity-types)** - Actions on objects
- **[Common Properties](/docs/reference/common-properties)** - Shared properties
- **[Posts and Replies](/docs/guides/posts-and-replies)** - Implementation guide
