---
sidebar_position: 6
title: Link Types
description: Link types in ActivityStreams 2.0
last_verified: 2026-10-15
verified_against: "AS2 Core & Vocabulary (W3C REC 2017), the published AS2 JSON-LD context, ActivityPub REC, Mastodon v4.7.3 source (context_helper.rb, account.rb, json_ld_helper.rb), Mastodon tag.rb"
---

# Link Types

Links in ActivityStreams represent references to other resources. A Link points to a resource via `href`. Links *may* have an `id` (its domain is Object | Link), but they usually don't — a Link describes a reference, not a resource with an identity of its own ([AS2 Vocab](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-id)).

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
| `href` | URI | Target resource URL (a Link without it points nowhere) |
| `rel` | String/Array | Link relation type |
| `mediaType` | String | MIME type of target |
| `name` | String | Human-readable name |
| `hreflang` | String | Language of target resource |
| `height` | Integer | Height in pixels (for media) |
| `width` | Integer | Width in pixels (for media) |
| `preview` | Object/Link | Preview of the resource |

### Link vs Object Reference

AS2 lets most properties take an Object, a Link, or a bare URI. In practice, use a **URI string or an embedded object with `id`**: Mastodon reads an embedded value's `id` ([`value_or_id`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb#L83-L85)), so a `Link` (which has `href`, not `id`) in `actor` or `object` is read as empty and the activity is dropped. All three forms below are valid AS2; only the first and third interoperate:

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

A Mention tag alone does not notify anyone on Mastodon: the mentioned actor must also be in `to` or `cc`. See [Mentions and Hashtags](/docs/guides/mentions-and-hashtags).

### Processing Mentions

```javascript
// Matches @user@domain. The domain must end in a letter or digit, so a
// trailing full stop ("…@bob@example.com.") is not swallowed.
const MENTION_RE = /@([\p{L}\p{N}_.-]+)@((?:[\p{L}\p{N}-]+\.)+[\p{L}\p{N}-]*[\p{L}\p{N}])/gu;

function extractMentions(text) {
  return [...text.matchAll(MENTION_RE)].map(([name, username, domain]) => ({
    type: 'Mention',
    name,
    username,
    domain,
    href: null // resolve via WebFinger before sending; drop mentions that don't resolve
  }));
}
```

Resolve each `username@domain` with [WebFinger](/docs/guides/webfinger-implementation), take the `self` link with type `application/activity+json` as `href`, and fetch the actor to confirm it exists.

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
        "mediaType": "image/png",
        "url": "https://example.com/emoji/blobcat.png"
      }
    }
  ]
}
```

## Hashtag

References a topic tag.

:::note Not part of core AS2
`Hashtag` and `Emoji` are fediverse **extensions**, not ActivityStreams 2.0 types (AS2 only defines `Mention` as a Link subtype). Include their context mappings, e.g. `"Hashtag": "as:Hashtag"` and Mastodon's `"Emoji": "toot:Emoji"`.
:::


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
| `name` | String | Tag, normally with `#` prefix (Mastodon sends it; not every implementation does, so strip a leading `#` when reading) |

### Processing Hashtags

Mastodon accepts Unicode letters and digits in hashtags ([tag.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/tag.rb#L42-L46)), so don't limit them to ASCII `\w`:

```javascript
function extractHashtags(text) {
  const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
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
| `http://webfinger.net/rel/profile-page` | Profile page (used in WebFinger) |
| `http://ostatus.org/schema/1.0/subscribe` | Remote follow URL template (used in WebFinger) |

Per the AS2 Vocabulary, `rel` values must be valid HTML/RFC 5988 link relations: no whitespace or commas ([AS2 Vocab: rel](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-rel)).

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
| Hashtag (extension) | Topic tag | href, name |

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
