---
sidebar_position: 19
title: Pixelfed Compatibility
description: Implementing federation with Pixelfed, the photo-sharing platform
---

# Pixelfed Compatibility

:::info Verified against
Pixelfed v0.14.4, checked 2026-10-15 against Pixelfed's [ActivityPub transformers](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub), which generate everything Pixelfed sends.
:::

Pixelfed is a federated photo-sharing platform similar to Instagram. It focuses on image-centric posts, albums and stories. This guide covers federating with Pixelfed instances.

## Pixelfed's Content Model

```
┌────────────────────────────────────────────────────────────┐
│                  PIXELFED STRUCTURE                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Post Types:                                               │
│  - Photo posts (single image or album)                     │
│  - Stories (ephemeral content)                             │
│  - Collections (curated albums)                            │
│                                                            │
│  Key Features:                                             │
│  - Image-first design                                      │
│  - Alt text support                                        │
│  - NSFW/sensitive content handling                         │
│  - Square or original aspect ratio                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Actor Structure

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://pixelfed.example/users/photographer",
  "preferredUsername": "photographer",
  "name": "Photo Enthusiast",
  "summary": "<p>Sharing beautiful moments</p>",
  "inbox": "https://pixelfed.example/users/photographer/inbox",
  "outbox": "https://pixelfed.example/users/photographer/outbox",
  "followers": "https://pixelfed.example/users/photographer/followers",
  "following": "https://pixelfed.example/users/photographer/following",
  "url": "https://pixelfed.example/photographer",
  "icon": {
    "type": "Image",
    "mediaType": "image/jpeg",
    "url": "https://pixelfed.example/storage/avatars/photographer.jpg"
  },
  "publicKey": {
    "id": "https://pixelfed.example/users/photographer#main-key",
    "owner": "https://pixelfed.example/users/photographer",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "endpoints": {
    "sharedInbox": "https://pixelfed.example/f/inbox"
  }
}
```

## Photo Posts

### Single Image Post

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://pixelfed.example/p/photographer/123456789",
  "attributedTo": "https://pixelfed.example/users/photographer",
  "content": "<p>Beautiful sunset at the beach! 🌅</p>",
  "published": "2024-01-15T18:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://pixelfed.example/users/photographer/followers"],
  "sensitive": false,
  "commentsEnabled": true,
  "capabilities": {
    "announce": "https://www.w3.org/ns/activitystreams#Public",
    "like": "https://www.w3.org/ns/activitystreams#Public",
    "reply": "https://www.w3.org/ns/activitystreams#Public"
  },
  "location": {
    "type": "Place",
    "name": "Santa Monica",
    "longitude": "-118.49",
    "latitude": "34.01",
    "country": "United States"
  },
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://pixelfed.example/storage/m/photo123.jpg",
      "name": "A colorful sunset over the ocean with silhouettes of palm trees",
      "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      "width": 1080,
      "height": 1080,
      "focalPoint": [0.0, 0.0]
    }
  ],
  "url": "https://pixelfed.example/p/photographer/123456789",
  "tag": [
    {
      "type": "Hashtag",
      "href": "https://pixelfed.example/discover/tags/sunset",
      "name": "#sunset"
    },
    {
      "type": "Hashtag",
      "href": "https://pixelfed.example/discover/tags/photography",
      "name": "#photography"
    }
  ]
}
```

Fields beyond plain AS2, from Pixelfed's [`CreateNote.php`](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub/Verb/CreateNote.php):

| Property | Meaning |
|----------|---------|
| `commentsEnabled` | `false` when the author turned comments off |
| `capabilities` | Who may `announce`, `like` and `reply` (`reply` is `[]` when comments are off) |
| `interactionPolicy` | Quote policy (FEP-044f style), sent alongside the above |
| `location` | Optional `Place` with `name`, `latitude`, `longitude`, `country` |

Pixelfed hashtag names include the leading `#`.

### Album Post (Multiple Images)

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://pixelfed.example/p/photographer/987654321",
  "attributedTo": "https://pixelfed.example/users/photographer",
  "content": "<p>Travel diary: Japan 🇯🇵</p>",
  "published": "2024-01-15T12:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://pixelfed.example/users/photographer/followers"],
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://pixelfed.example/storage/m/tokyo1.jpg",
      "name": "Tokyo Tower at night",
      "blurhash": "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
      "width": 1080,
      "height": 1350
    },
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://pixelfed.example/storage/m/kyoto1.jpg",
      "name": "Traditional temple in Kyoto",
      "blurhash": "L6Pj0^jE.AyE_3t7t7R**0LJxvt6",
      "width": 1080,
      "height": 1350
    },
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://pixelfed.example/storage/m/osaka1.jpg",
      "name": "Osaka street food market",
      "blurhash": "LGF5]+Yk^6#M@-5c,1J5@[or[Q6.",
      "width": 1080,
      "height": 1080
    }
  ],
  "url": "https://pixelfed.example/p/photographer/987654321"
}
```

## Image Requirements

Pixelfed accepts any aspect ratio and size within the instance's upload limits (set by each admin). Send accurate `width` and `height` so clients can lay out the grid before images load.

### Media Properties

```json
{
  "type": "Document",
  "mediaType": "image/jpeg",
  "url": "https://example.com/image.jpg",
  "name": "Alt text description for accessibility",
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "width": 1080,
  "height": 1080,
  "focalPoint": [0.5, 0.33]
}
```

| Property | Description |
|----------|-------------|
| `name` | Alt text for accessibility |
| `blurhash` | BlurHash placeholder string |
| `width` / `height` | Image dimensions in pixels |
| `focalPoint` | Focus point for cropping [x, y] from -1 to 1 |

## Sensitive Content

### Marking Content as Sensitive

```json
{
  "type": "Note",
  "sensitive": true,
  "summary": "Artistic nudity",
  "content": "<p>Figure study</p>",
  "attachment": [
    {
      "type": "Document",
      "url": "https://pixelfed.example/storage/m/sensitive.jpg",
      "name": "Figure study in charcoal"
    }
  ]
}
```

### Processing Sensitive Content

```javascript
function renderPixelfedPost(note) {
  const isSensitive = note.sensitive === true;

  if (isSensitive) {
    return `
      <article class="post sensitive">
        <div class="content-warning">
          <p>${escapeHtml(note.summary || 'Sensitive content')}</p>
          <button onclick="revealContent(this)">Show content</button>
        </div>
        <div class="hidden-content" style="display:none">
          ${renderAttachments(note.attachment)}
        </div>
      </article>
    `;
  }

  return renderNormalPost(note);
}
```

## Implementing Pixelfed Support

### Handling Image-Heavy Posts

```javascript
async function processPixelfedPost(activity) {
  const note = activity.object;
  const attachments = note.attachment || [];

  // Pixelfed sends media as Document (Image is also common elsewhere)
  const images = attachments.filter(a =>
    (a.type === 'Document' || a.type === 'Image') &&
    (a.mediaType ?? '').startsWith('image/')
  );

  if (images.length === 0) {
    // Not a photo post
    return processRegularNote(activity);
  }

  // Cache images locally (optional). Use an SSRF-safe fetcher with
  // size and content-type limits: these URLs are attacker-controlled.
  for (const image of images) {
    await cacheRemoteMedia(image.url, {
      blurhash: image.blurhash,
      width: image.width,
      height: image.height,
      altText: image.name
    });
  }

  const post = {
    id: note.id,
    type: 'photo',
    content: note.content, // remote HTML: sanitize before display
    author: note.attributedTo,
    images: images,
    sensitive: note.sensitive || false,
    contentWarning: note.summary,
    published: note.published
  };
  await db.posts.insert(post);
  return post;
}
```

### Rendering Albums

```javascript
// Only allow http(s) URLs from remote content
function safeHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

function renderPhotoAlbum(attachments) {
  if (attachments.length === 1) {
    return renderSingleImage(attachments[0]);
  }

  // Grid layout for multiple images
  const gridClass = attachments.length <= 4 ? 'grid-2x2' : 'grid-scroll';

  return `
    <div class="photo-album ${gridClass}">
      ${attachments.map((img, index) => `
        <div class="album-image">
          <img
            src="${escapeHtml(safeHttpUrl(img.url))}"
            alt="${escapeHtml(img.name || `Image ${index + 1}`)}"
            loading="lazy"
          />
        </div>
      `).join('')}
    </div>
  `;
}
```

### Creating Photo Posts for Pixelfed

```javascript
async function createPhotoPost(author, images, caption, options = {}) {
  // Process images
  const attachments = await Promise.all(images.map(async (image) => {
    const metadata = await processImage(image);

    return {
      type: 'Document',
      mediaType: metadata.mimeType,
      url: metadata.url,
      name: image.altText || '',
      blurhash: await generateBlurhash(image),
      width: metadata.width,
      height: metadata.height
    };
  }));

  // Extract hashtags
  const hashtags = extractHashtags(caption);

  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Note',
    id: `https://${config.domain}/posts/${uuid()}`,
    attributedTo: author.id,
    content: formatCaption(caption),
    published: new Date().toISOString(),
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [`${author.id}/followers`],
    attachment: attachments,
    sensitive: options.sensitive || false,
    summary: options.contentWarning || null,
    tag: hashtags.map(tag => ({
      type: 'Hashtag',
      href: `https://${config.domain}/tags/${tag}`,
      name: `#${tag}`
    }))
  };

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Create',
    id: `${note.id}/activity`,
    actor: author.id,
    object: note
  };

  await deliverToFollowers(activity, author);

  return note;
}
```

## Collections

Pixelfed has curated collections in its UI, but v0.14.4 has no ActivityPub transformer for them (only statuses, profiles, outboxes and the activity "verbs" in [`app/Transformer/ActivityPub`](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub)), so don't expect collections to federate.

## Stories (Ephemeral Content)

Stories are **not** Notes. Pixelfed federates them only to the author's followers, as an `Add` whose object is a `Story` that points to a [bearcap](https://github.com/pixelfed/pixelfed/blob/v0.14.4/app/Util/Lexer/Bearcap.php) URL (a capability URL containing an access token) — see [`CreateStory.php`](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub/Verb/CreateStory.php):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://pixelfed.example/stories/photographer/abc123/activity",
  "type": "Add",
  "actor": "https://pixelfed.example/users/photographer",
  "to": ["https://pixelfed.example/users/photographer/followers"],
  "object": {
    "id": "https://pixelfed.example/stories/photographer/abc123",
    "type": "Story",
    "object": "bear:?t=<token>&u=https://pixelfed.example/stories/photographer/abc123"
  }
}
```

Fetching the bearcap URL (with the token as a bearer token) returns the `Story` itself — see [`StoryVerb.php`](https://github.com/pixelfed/pixelfed/tree/v0.14.4/app/Transformer/ActivityPub/Verb/StoryVerb.php):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://pixelfed.example/stories/photographer/abc123",
  "type": "Story",
  "to": ["https://pixelfed.example/users/photographer/followers"],
  "cc": [],
  "attributedTo": "https://pixelfed.example/users/photographer",
  "published": "2026-10-15T10:00:00+00:00",
  "expiresAt": "2026-10-16T10:00:00+00:00",
  "duration": 10,
  "can_reply": true,
  "can_react": true,
  "attachment": {
    "type": "Image",
    "url": "https://pixelfed.example/storage/stories/story123.jpg",
    "mediaType": "image/jpeg"
  }
}
```

Note that `expiresAt` (not `expires`) carries the expiry, and `attachment` is a single object. A story is removed early with a `Delete` whose object is `{ "id": ..., "type": "Story" }`.

### Handling Expiring Content

```javascript
async function processAddStory(activity) {
  const ref = activity.object;
  if (ref?.type !== 'Story') return;

  // Dereference the bearcap URL (SSRF-safe fetch, token as bearer auth)
  const story = await fetchBearcap(ref.object);
  if (story.attributedTo !== activity.actor) {
    throw new Error('Story author does not match actor');
  }

  const expiresAt = new Date(story.expiresAt);
  if (!(expiresAt > new Date())) return; // already expired

  // Persist the expiry and let a periodic job (or a TTL index) purge
  // expired rows; in-memory timers are lost on restart.
  await db.stories.insert({ id: story.id, content: story, expiresAt });
}
```

## Interactions

### Likes

```json
{
  "type": "Like",
  "actor": "https://mastodon.example/users/alice",
  "object": "https://pixelfed.example/p/photographer/123456789"
}
```

### Comments

```json
{
  "type": "Create",
  "actor": "https://mastodon.example/users/alice",
  "object": {
    "type": "Note",
    "content": "<p>Stunning shot! 📸</p>",
    "inReplyTo": "https://pixelfed.example/p/photographer/123456789"
  }
}
```

### Sharing/Reblogging

```json
{
  "type": "Announce",
  "actor": "https://mastodon.example/users/alice",
  "object": "https://pixelfed.example/p/photographer/123456789"
}
```

## Best Practices

### Image Optimization

```javascript
const sharp = require('sharp');

async function optimizeForFederation(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  // Apply EXIF orientation first, then resize if too large.
  // sharp strips EXIF (including GPS) on output unless you call withMetadata().
  let resized = image.rotate();
  if (metadata.width > 2048 || metadata.height > 2048) {
    resized = resized.resize(2048, 2048, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Convert to JPEG with good quality
  const { data: buffer, info } = await resized
    .jpeg({ quality: 85, progressive: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer,
    width: info.width,   // dimensions of the output, not the input
    height: info.height,
    mimeType: 'image/jpeg'
  };
}
```

### Alt Text Handling

```javascript
function renderImage(attachment) {
  const altText = attachment.name || 'Image';
  const hasAltText = attachment.name && attachment.name.length > 0;

  return `
    <figure>
      <img
        src="${escapeHtml(safeHttpUrl(attachment.url))}"
        alt="${escapeHtml(altText)}"
        loading="lazy"
      />
      ${hasAltText ? `
        <figcaption class="alt-text">
          <button onclick="showAltText(this)">ALT</button>
          <span class="hidden">${escapeHtml(attachment.name)}</span>
        </figcaption>
      ` : ''}
    </figure>
  `;
}
```

## CSS for Photo Layouts

```css
/* Photo post grid */
.photo-album {
  display: grid;
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
}

.grid-2x2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-scroll {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* Square crop for grid */
.album-image img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

/* Preserve aspect ratio for single image */
.single-image img {
  max-width: 100%;
  height: auto;
}

/* Blur placeholder */
.loading-blur {
  filter: blur(20px);
  transform: scale(1.1);
}
```

## Testing Pixelfed Federation

```javascript
describe('Pixelfed Compatibility', () => {
  it('should handle photo posts', async () => {
    const note = {
      type: 'Note',
      id: 'https://pixelfed.example/p/user/1',
      content: '<p>Test</p>',
      attachment: [{
        type: 'Document',
        mediaType: 'image/jpeg',
        url: 'https://pixelfed.example/image.jpg',
        name: 'Test image'
      }]
    };

    await processPixelfedPost({ type: 'Create', object: note });

    const stored = await db.posts.findOne({ id: note.id });
    expect(stored.type).toBe('photo');
    expect(stored.images).toHaveLength(1);
  });

  it('should handle albums', async () => {
    const note = {
      type: 'Note',
      id: 'https://pixelfed.example/p/user/2',
      attachment: [
        { type: 'Document', mediaType: 'image/jpeg', url: 'https://pixelfed.example/1.jpg' },
        { type: 'Document', mediaType: 'image/jpeg', url: 'https://pixelfed.example/2.jpg' },
        { type: 'Document', mediaType: 'image/jpeg', url: 'https://pixelfed.example/3.jpg' }
      ]
    };

    const result = await processPixelfedPost({ type: 'Create', object: note });
    expect(result.images).toHaveLength(3);
  });
});
```

## Next Steps

- **[PeerTube Compatibility](/docs/guides/peertube-compatibility)** - Video federation
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Microblogging federation
- **[Media Attachments](/docs/guides/media-attachments)** - Media handling details
