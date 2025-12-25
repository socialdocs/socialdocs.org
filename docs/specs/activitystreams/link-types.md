---
sidebar_position: 6
title: Link Types
description: Link types in ActivityStreams 2.0
---

# Link Types

Links in ActivityStreams represent references to other resources. Unlike Objects, Links don't have an `id` property—they point to resources via `href`.

## Link

The base Link type for referencing external resources.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Link",
  "href": "https://example.com/resource",
  "mediaType": "text/html",
  "name": "Example Resource"
}
```

### Link Properties

| Property | Type | Description |
|----------|------|-------------|
| `href` | URI | Target resource URL (required) |
| `rel` | String/Array | Link relation type |
| `mediaType` | String | MIME type of target |
| `name` | String | Human-readable name |
| `hreflang` | String | Language of target resource |
| `height` | Integer | Height in pixels (for media) |
| `width` | Integer | Width in pixels (for media) |
| `preview` | Object/Link | Preview of the resource |

### Link vs Object Reference

Links and objects can often be used interchangeably:

```json
// As Object reference (just the URL)
{
  "actor": "https://example.com/users/alice"
}

// As Link object (with metadata)
{
  "actor": {
    "type": "Link",
    "href": "https://example.com/users/alice",
    "name": "Alice"
  }
}

// As embedded Object
{
  "actor": {
    "type": "Person",
    "id": "https://example.com/users/alice",
    "name": "Alice"
  }
}
```

## Mention

References an actor in content. Used for @mentions.

```json
{
  "type": "Mention",
  "href": "https://example.com/users/bob",
  "name": "@bob@example.com"
}
```

### Mention in Notes

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "content": "<p>Hello <a href=\"https://example.com/users/bob\">@bob</a>!</p>",
  "tag": [
    {
      "type": "Mention",
      "href": "https://example.com/users/bob",
      "name": "@bob@example.com"
    }
  ]
}
```

### Mention Properties

| Property | Type | Description |
|----------|------|-------------|
| `href` | URI | Actor's ID URL |
| `name` | String | @handle format |

### Processing Mentions

```javascript
function extractMentions(text) {
  const mentionRegex = /@(\w+)@([\w.-]+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, username, domain] = match;
    mentions.push({
      type: 'Mention',
      name: fullMatch,
      href: null // Will be resolved via WebFinger
    });
  }

  return mentions;
}

async function resolveMention(mention) {
  const [, username, domain] = mention.name.match(/@(\w+)@([\w.-]+)/);
  const webfinger = await lookupWebFinger(`${username}@${domain}`);
  mention.href = webfinger.actorUrl;
  return mention;
}
```

## Common Link Uses

### Media Links

For video with multiple resolutions:

```json
{
  "type": "Video",
  "url": [
    {
      "type": "Link",
      "href": "https://example.com/video-1080p.mp4",
      "mediaType": "video/mp4",
      "height": 1080,
      "width": 1920
    },
    {
      "type": "Link",
      "href": "https://example.com/video-720p.mp4",
      "mediaType": "video/mp4",
      "height": 720,
      "width": 1280
    }
  ]
}
```

### Alternate Representations

```json
{
  "type": "Article",
  "id": "https://example.com/articles/1",
  "url": [
    {
      "type": "Link",
      "href": "https://example.com/articles/1",
      "mediaType": "text/html",
      "name": "Web version"
    },
    {
      "type": "Link",
      "href": "https://example.com/articles/1.pdf",
      "mediaType": "application/pdf",
      "name": "PDF version"
    }
  ]
}
```

### Language Variants

```json
{
  "type": "Article",
  "url": [
    {
      "type": "Link",
      "href": "https://example.com/article/en",
      "hreflang": "en",
      "name": "English"
    },
    {
      "type": "Link",
      "href": "https://example.com/article/de",
      "hreflang": "de",
      "name": "Deutsch"
    }
  ]
}
```

## Tag Array Usage

The `tag` property can contain various link types:

```json
{
  "type": "Note",
  "content": "<p>Hello @bob! Check out #activitypub :blobcat:</p>",
  "tag": [
    {
      "type": "Mention",
      "href": "https://example.com/users/bob",
      "name": "@bob@example.com"
    },
    {
      "type": "Hashtag",
      "href": "https://example.com/tags/activitypub",
      "name": "#activitypub"
    },
    {
      "type": "Emoji",
      "id": "https://example.com/emoji/blobcat",
      "name": ":blobcat:",
      "icon": {
        "type": "Image",
        "url": "https://example.com/emoji/blobcat.png"
      }
    }
  ]
}
```

## Hashtag

References a topic tag.

```json
{
  "type": "Hashtag",
  "href": "https://example.com/tags/fediverse",
  "name": "#fediverse"
}
```

### Hashtag Properties

| Property | Type | Description |
|----------|------|-------------|
| `href` | URI | Tag page URL |
| `name` | String | Tag with # prefix |

### Processing Hashtags

```javascript
function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g;
  const tags = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    const [fullMatch, tagName] = match;
    tags.push({
      type: 'Hashtag',
      href: `https://${config.domain}/tags/${tagName.toLowerCase()}`,
      name: `#${tagName}`
    });
  }

  return tags;
}
```

## Link Relations

The `rel` property specifies the relationship:

```json
{
  "type": "Link",
  "href": "https://example.com/profile",
  "rel": "http://webfinger.net/rel/profile-page"
}
```

### Common Relations

| Relation | Description |
|----------|-------------|
| `self` | Canonical representation |
| `alternate` | Alternative representation |
| `preview` | Preview of the resource |
| `http://webfinger.net/rel/profile-page` | Profile page |
| `http://ostatus.org/schema/1.0/subscribe` | Remote follow URL |

## Preview Links

Provide previews for linked content:

```json
{
  "type": "Link",
  "href": "https://example.com/video.mp4",
  "mediaType": "video/mp4",
  "preview": {
    "type": "Image",
    "url": "https://example.com/video-thumbnail.jpg"
  }
}
```

## Link Type Quick Reference

| Type | Purpose | Key Properties |
|------|---------|----------------|
| Link | Generic reference | href, mediaType |
| Mention | @mention | href, name |
| Hashtag | Topic tag | href, name |

## Best Practices

### Always Include mediaType

```json
// Good
{
  "type": "Link",
  "href": "https://example.com/image.png",
  "mediaType": "image/png"
}

// Less helpful
{
  "type": "Link",
  "href": "https://example.com/image.png"
}
```

### Use Descriptive Names

```json
{
  "type": "Link",
  "href": "https://example.com/doc.pdf",
  "mediaType": "application/pdf",
  "name": "User Manual (PDF, 2.3 MB)"
}
```

### Validate href URLs

```javascript
function isValidLink(link) {
  if (!link.href) return false;

  try {
    const url = new URL(link.href);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}
```

## Next Steps

- **[Properties](/docs/specs/activitystreams/properties)** - All properties reference
- **[Object Types](/docs/specs/activitystreams/object-types)** - Object types
- **[Mentions and Hashtags](/docs/guides/mentions-and-hashtags)** - Implementation guide
