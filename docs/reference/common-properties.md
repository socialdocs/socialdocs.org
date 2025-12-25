---
sidebar_position: 10
title: Common Properties
description: Reference for properties shared across ActivityStreams types
---

# Common Properties

Properties that appear across multiple ActivityStreams types.

## Identity

| Property | Type | Description |
|----------|------|-------------|
| `@context` | String/Array | JSON-LD context |
| `id` | URL | Globally unique identifier |
| `type` | String/Array | Object type(s) |

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/notes/123",
  "type": "Note"
}
```

## Naming

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Display name |
| `nameMap` | Object | Localized names |
| `summary` | String | Short description (HTML) |
| `summaryMap` | Object | Localized summaries |

```json
{
  "name": "My Post",
  "nameMap": {
    "en": "My Post",
    "es": "Mi Publicación"
  },
  "summary": "<p>A brief description</p>"
}
```

## Content

| Property | Type | Description |
|----------|------|-------------|
| `content` | String | Main content (HTML) |
| `contentMap` | Object | Localized content |
| `mediaType` | String | MIME type of content |
| `source` | Object | Original source format |

```json
{
  "content": "<p>Hello <strong>world</strong>!</p>",
  "mediaType": "text/html",
  "source": {
    "content": "Hello **world**!",
    "mediaType": "text/markdown"
  }
}
```

## Timestamps

| Property | Type | Description |
|----------|------|-------------|
| `published` | DateTime | Creation time |
| `updated` | DateTime | Last modification |
| `startTime` | DateTime | Event start |
| `endTime` | DateTime | Event end |
| `duration` | Duration | Time span |

```json
{
  "published": "2024-01-15T10:00:00Z",
  "updated": "2024-01-15T12:30:00Z"
}
```

## Attribution

| Property | Type | Description |
|----------|------|-------------|
| `attributedTo` | Actor/URL | Creator/author |
| `generator` | Object | Creating application |
| `audience` | Actor/URL | Intended audience |

```json
{
  "attributedTo": "https://example.com/users/alice",
  "generator": {
    "type": "Application",
    "name": "My App"
  }
}
```

## Addressing

| Property | Type | Description |
|----------|------|-------------|
| `to` | Array | Primary recipients |
| `cc` | Array | Secondary recipients |
| `bto` | Array | Private primary |
| `bcc` | Array | Private secondary |

```json
{
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Special Addresses

| Address | Meaning |
|---------|---------|
| `https://www.w3.org/ns/activitystreams#Public` | Public post |
| `{actor}/followers` | All followers |

## Media Attachments

| Property | Type | Description |
|----------|------|-------------|
| `attachment` | Array | Attached media |
| `icon` | Image | Thumbnail/avatar |
| `image` | Image | Representative image |
| `preview` | Link/Object | Preview version |

```json
{
  "attachment": [
    {
      "type": "Image",
      "mediaType": "image/png",
      "url": "https://example.com/image.png",
      "name": "Description for accessibility"
    }
  ]
}
```

## Links and Relations

| Property | Type | Description |
|----------|------|-------------|
| `url` | URL/Link | Web page |
| `href` | URL | Link target |
| `rel` | String | Link relation |
| `tag` | Array | Hashtags/mentions |
| `inReplyTo` | URL | Reply target |

```json
{
  "tag": [
    {
      "type": "Hashtag",
      "name": "#fediverse",
      "href": "https://example.com/tags/fediverse"
    },
    {
      "type": "Mention",
      "name": "@bob@other.example",
      "href": "https://other.example/users/bob"
    }
  ]
}
```

## Location

| Property | Type | Description |
|----------|------|-------------|
| `location` | Place | Geographic location |
| `latitude` | Float | Latitude |
| `longitude` | Float | Longitude |
| `altitude` | Float | Altitude |
| `radius` | Float | Accuracy radius |

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

## See Also

- **[Object Properties](/docs/reference/object-properties)**
- **[Activity Properties](/docs/reference/activity-properties)**
- **[Actor Properties](/docs/reference/actor-properties)**

