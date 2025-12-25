---
sidebar_position: 11
title: Object Properties
description: Reference for ActivityStreams Object properties
---

# Object Properties

Properties specific to Object types (Note, Article, Image, etc.).

## Content Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | String | Recommended | Main body (HTML) |
| `contentMap` | Object | | Localized content |
| `source` | Object | | Original format |
| `mediaType` | String | | Content MIME type |

### Example Note

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/123",
  "content": "<p>Hello Fediverse!</p>",
  "mediaType": "text/html",
  "source": {
    "content": "Hello Fediverse!",
    "mediaType": "text/plain"
  }
}
```

## Reply Threading

| Property | Type | Description |
|----------|------|-------------|
| `inReplyTo` | URL | Parent object |
| `replies` | Collection | Reply collection |
| `context` | URL | Conversation thread |

```json
{
  "type": "Note",
  "inReplyTo": "https://other.example/notes/456",
  "content": "<p>Great point!</p>",
  "replies": {
    "type": "Collection",
    "first": "https://example.com/notes/123/replies"
  }
}
```

## Visibility & Sensitivity

| Property | Type | Description |
|----------|------|-------------|
| `sensitive` | Boolean | Content warning flag |
| `summary` | String | CW text if sensitive |

```json
{
  "type": "Note",
  "sensitive": true,
  "summary": "Spoilers for latest episode",
  "content": "<p>The ending was amazing!</p>"
}
```

## Media Objects

### Image

```json
{
  "type": "Image",
  "mediaType": "image/jpeg",
  "url": "https://example.com/photo.jpg",
  "name": "Alt text description",
  "width": 1920,
  "height": 1080,
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
}
```

### Video

```json
{
  "type": "Video",
  "mediaType": "video/mp4",
  "url": [
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://example.com/video.mp4",
      "width": 1920,
      "height": 1080
    }
  ],
  "duration": "PT5M30S"
}
```

### Audio

```json
{
  "type": "Audio",
  "mediaType": "audio/mpeg",
  "url": "https://example.com/podcast.mp3",
  "duration": "PT45M"
}
```

### Document

```json
{
  "type": "Document",
  "mediaType": "application/pdf",
  "url": "https://example.com/file.pdf",
  "name": "Report.pdf"
}
```

## Attachments

```json
{
  "type": "Note",
  "content": "<p>Check out these photos!</p>",
  "attachment": [
    {
      "type": "Image",
      "mediaType": "image/jpeg",
      "url": "https://example.com/photo1.jpg",
      "name": "Beach sunset"
    },
    {
      "type": "Image",
      "mediaType": "image/jpeg",
      "url": "https://example.com/photo2.jpg",
      "name": "Mountain view"
    }
  ]
}
```

## Tags and Mentions

| Type | Purpose | Example |
|------|---------|---------|
| `Hashtag` | Topic tag | `#fediverse` |
| `Mention` | User mention | `@user@domain` |
| `Emoji` | Custom emoji | `:blobcat:` |

```json
{
  "tag": [
    {
      "type": "Hashtag",
      "name": "#ActivityPub",
      "href": "https://example.com/tags/activitypub"
    },
    {
      "type": "Mention",
      "name": "@alice@example.com",
      "href": "https://example.com/users/alice"
    },
    {
      "type": "Emoji",
      "name": ":blobcat:",
      "icon": {
        "type": "Image",
        "url": "https://example.com/emoji/blobcat.png"
      }
    }
  ]
}
```

## Article vs Note

| Property | Note | Article |
|----------|------|---------|
| `name` | Optional | Required (title) |
| `content` | Short text | Long-form |
| Length | ~500 chars | Unlimited |
| Use case | Microblog | Blog post |

### Article Example

```json
{
  "type": "Article",
  "name": "Introduction to ActivityPub",
  "content": "<p>ActivityPub is a protocol...</p>",
  "published": "2024-01-15T10:00:00Z",
  "attributedTo": "https://example.com/users/alice"
}
```

## See Also

- **[Common Properties](/docs/reference/common-properties)**
- **[Activity Properties](/docs/reference/activity-properties)**

