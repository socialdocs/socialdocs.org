---
sidebar_position: 4
title: Object Types
description: Content object types in ActivityStreams 2.0
---

# Object Types

ActivityStreams defines various object types for representing content. These types describe what kind of content an object represents.

## Content Types

### Note

Short-form content, similar to a tweet or status update.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/1",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>Hello, world!</p>",
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

**Used by:** Mastodon (toots), Pleroma, Misskey

### Article

Long-form content like blog posts.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Article",
  "id": "https://example.com/articles/1",
  "name": "Getting Started with ActivityPub",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>ActivityPub is a protocol for decentralized social networking...</p>",
  "published": "2024-01-15T10:00:00Z",
  "url": "https://example.com/blog/getting-started"
}
```

**Used by:** WriteFreely, Plume, WordPress (with plugin)

### Page

A document or web page, often with a title and external URL.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Page",
  "id": "https://lemmy.example/post/12345",
  "name": "Interesting Article About Programming",
  "url": "https://external-site.com/article",
  "content": "<p>Discussion about the article...</p>",
  "attributedTo": "https://lemmy.example/u/alice"
}
```

**Used by:** Lemmy (for posts with titles/links)

### Event

A scheduled event or activity.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Event",
  "id": "https://example.com/events/1",
  "name": "Fediverse Developer Meetup",
  "startTime": "2024-02-01T18:00:00Z",
  "endTime": "2024-02-01T21:00:00Z",
  "location": {
    "type": "Place",
    "name": "Tech Hub",
    "address": "123 Main Street"
  },
  "attributedTo": "https://example.com/users/alice"
}
```

**Used by:** Mobilizon, Gancio

## Media Types

### Image

A static image.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Image",
  "id": "https://example.com/images/1",
  "name": "Sunset over the ocean",
  "url": "https://example.com/media/sunset.jpg",
  "mediaType": "image/jpeg",
  "width": 1920,
  "height": 1080
}
```

### Video

A video file.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Video",
  "id": "https://peertube.example/videos/1",
  "name": "My First Video",
  "url": [
    {
      "type": "Link",
      "href": "https://peertube.example/videos/1.mp4",
      "mediaType": "video/mp4",
      "height": 1080
    }
  ],
  "duration": "PT5M30S",
  "attributedTo": "https://peertube.example/accounts/alice"
}
```

**Used by:** PeerTube

### Audio

An audio file.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Audio",
  "id": "https://funkwhale.example/tracks/1",
  "name": "My Song",
  "url": {
    "type": "Link",
    "href": "https://funkwhale.example/audio/song.mp3",
    "mediaType": "audio/mpeg"
  },
  "duration": "PT3M45S",
  "attributedTo": "https://funkwhale.example/users/alice"
}
```

**Used by:** Funkwhale

### Document

A generic document attachment.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Document",
  "mediaType": "image/jpeg",
  "url": "https://example.com/media/photo.jpg",
  "name": "Photo description for accessibility",
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "width": 1920,
  "height": 1080
}
```

**Used by:** Mastodon (for attachments)

## Location Types

### Place

A physical location.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Place",
  "name": "San Francisco",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "address": "San Francisco, CA, USA"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Place name |
| `latitude` | Number | Latitude coordinate |
| `longitude` | Number | Longitude coordinate |
| `altitude` | Number | Altitude in meters |
| `accuracy` | Number | Accuracy in meters |
| `radius` | Number | Radius in meters |
| `units` | String | Unit of measurement |

## Special Types

### Tombstone

Represents a deleted object.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Tombstone",
  "id": "https://example.com/notes/1",
  "formerType": "Note",
  "deleted": "2024-01-15T14:00:00Z"
}
```

**Used when:** An object has been deleted but needs to return something.

### Profile

Describes an actor's profile.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Profile",
  "describes": "https://example.com/users/alice",
  "summary": "Software developer and fediverse enthusiast"
}
```

### Relationship

Describes a relationship between two actors.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Relationship",
  "subject": "https://example.com/users/alice",
  "relationship": "http://purl.org/vocab/relationship/friendOf",
  "object": "https://example.com/users/bob"
}
```

## Tag Types

### Mention

References another actor.

```json
{
  "type": "Mention",
  "href": "https://example.com/users/bob",
  "name": "@bob@example.com"
}
```

### Hashtag

A topic tag.

```json
{
  "type": "Hashtag",
  "href": "https://example.com/tags/fediverse",
  "name": "#fediverse"
}
```

### Emoji

A custom emoji.

```json
{
  "type": "Emoji",
  "id": "https://example.com/emoji/blobcat",
  "name": ":blobcat:",
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/emoji/blobcat.png"
  }
}
```

## Attachment Examples

### Note with Image

```json
{
  "type": "Note",
  "content": "<p>Check out this photo!</p>",
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo.jpg",
      "name": "A beautiful landscape"
    }
  ]
}
```

### Note with Multiple Attachments

```json
{
  "type": "Note",
  "content": "<p>Photo album from my trip</p>",
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo1.jpg",
      "name": "Beach sunset"
    },
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo2.jpg",
      "name": "Mountain view"
    }
  ]
}
```

## Object Type Quick Reference

| Type | Description | Example Use |
|------|-------------|-------------|
| Note | Short text | Toots, posts |
| Article | Long text | Blog posts |
| Page | Web page | Link posts |
| Event | Scheduled event | Meetups |
| Image | Picture | Photo posts |
| Video | Video content | Video hosting |
| Audio | Audio content | Music, podcasts |
| Document | Generic file | Attachments |
| Place | Location | Check-ins |
| Tombstone | Deleted content | Deletion markers |
| Mention | User reference | @mentions |
| Hashtag | Topic tag | #hashtags |
| Emoji | Custom emoji | :emoji: |

## Content Representation

### HTML Content

Most implementations expect HTML in the `content` property:

```json
{
  "type": "Note",
  "content": "<p>Hello <a href=\"https://example.com/@bob\">@bob</a>!</p>",
  "mediaType": "text/html"
}
```

### Plain Text

For plain text, use `mediaType`:

```json
{
  "type": "Note",
  "content": "Hello @bob!",
  "mediaType": "text/plain"
}
```

### Source

Preserve the original source format:

```json
{
  "type": "Note",
  "content": "<p>Hello <strong>world</strong>!</p>",
  "source": {
    "content": "Hello **world**!",
    "mediaType": "text/markdown"
  }
}
```

## Next Steps

- **[Actor Types](/docs/specs/activitystreams/actor-types)** - Actor types
- **[Properties](/docs/specs/activitystreams/properties)** - All properties
- **[Link Types](/docs/specs/activitystreams/link-types)** - Link types
