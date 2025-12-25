---
sidebar_position: 3
title: Objects
description: Content objects in ActivityPub - Notes, Articles, Images, and more
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
| `id` | URL | Unique, dereferenceable identifier |
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
| `source` | Original source format |
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
  "id": "https://pixelfed.example/p/1",
  "attributedTo": "https://pixelfed.example/users/photographer",
  "name": "Sunset at the beach",
  "url": {
    "type": "Link",
    "href": "https://pixelfed.example/storage/photos/1.jpg",
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
  "name": "Tutorial: Building with ActivityPub",
  "duration": "PT15M30S",
  "url": [
    {
      "type": "Link",
      "href": "https://peertube.example/videos/1.mp4",
      "mediaType": "video/mp4",
      "height": 1080
    },
    {
      "type": "Link",
      "href": "https://peertube.example/videos/1.webm",
      "mediaType": "video/webm"
    }
  ]
}
```

### Page

Link shares (like Lemmy posts):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Page",
  "id": "https://lemmy.example/post/1",
  "attributedTo": "https://lemmy.example/u/alice",
  "name": "Interesting Article About ActivityPub",
  "url": "https://example.com/article",
  "content": "This is my commentary on the article..."
}
```

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
    "name": "Community Center",
    "address": "123 Main St"
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

Mastodon uses blurhash for image placeholders:

```json
{
  "type": "Document",
  "url": "https://example.com/image.jpg",
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
}
```

## Tags

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

Control who can see objects:

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
  "cc": []
}
```

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

When you receive a reference to an object, you may need to fetch it:

```http
GET /notes/1 HTTP/1.1
Host: example.com
Accept: application/activity+json
```

:::tip
Cache fetched objects to reduce network requests. A TTL of 1-24 hours is typical.
:::

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

Return HTTP 410 Gone for deleted objects.

## Next Steps

- **[Activities](/docs/specs/activitypub/activities)** - Actions on objects
- **[Collections](/docs/specs/activitypub/collections)** - Groups of objects
- **[Posts and Replies](/docs/guides/posts-and-replies)** - Implementation guide
