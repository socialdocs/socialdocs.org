---
sidebar_position: 19
title: Pixelfed Compatibility
description: Implementing federation with Pixelfed, the photo-sharing platform
---

# Pixelfed Compatibility

Pixelfed is a federated photo-sharing platform similar to Instagram. It focuses on image-centric content with albums, collections, and stories. This guide covers federating with Pixelfed instances.

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

### Recommended Dimensions

| Format | Dimensions | Use Case |
|--------|-----------|----------|
| Square | 1080×1080 | Standard post |
| Portrait | 1080×1350 | 4:5 aspect ratio |
| Landscape | 1080×608 | 16:9 aspect ratio |
| Story | 1080×1920 | 9:16 vertical |

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
          <p>${note.summary || 'Sensitive content'}</p>
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

  // Validate attachments are images
  const images = attachments.filter(a =>
    a.type === 'Document' &&
    a.mediaType?.startsWith('image/')
  );

  if (images.length === 0) {
    // Not a photo post
    return processRegularNote(activity);
  }

  // Cache images locally (optional)
  for (const image of images) {
    await cacheRemoteMedia(image.url, {
      blurhash: image.blurhash,
      width: image.width,
      height: image.height,
      altText: image.name
    });
  }

  await db.posts.insert({
    id: note.id,
    type: 'photo',
    content: note.content,
    author: note.attributedTo,
    images: images,
    sensitive: note.sensitive || false,
    contentWarning: note.summary,
    published: note.published
  });
}
```

### Rendering Albums

```javascript
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
            src="${img.url}"
            alt="${img.name || `Image ${index + 1}`}"
            loading="lazy"
            style="background: url('data:image/svg+xml,${generateBlurhashSvg(img.blurhash)}')"
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

Pixelfed supports curated collections:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "OrderedCollection",
  "id": "https://pixelfed.example/users/photographer/collections/nature",
  "name": "Nature Photography",
  "summary": "My favorite nature shots",
  "attributedTo": "https://pixelfed.example/users/photographer",
  "totalItems": 25,
  "orderedItems": [
    "https://pixelfed.example/p/photographer/123",
    "https://pixelfed.example/p/photographer/456"
  ]
}
```

## Stories (Ephemeral Content)

Pixelfed stories are temporary posts that expire:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://pixelfed.example/stories/photographer/abc123",
  "attributedTo": "https://pixelfed.example/users/photographer",
  "content": "",
  "published": "2024-01-15T10:00:00Z",
  "expires": "2024-01-16T10:00:00Z",
  "to": ["https://pixelfed.example/users/photographer/followers"],
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://pixelfed.example/storage/stories/story123.jpg",
      "width": 1080,
      "height": 1920
    }
  ]
}
```

### Handling Expiring Content

```javascript
async function processStory(activity) {
  const note = activity.object;

  if (note.expires) {
    const expiresAt = new Date(note.expires);

    // Store with expiration
    await db.stories.insert({
      id: note.id,
      content: note,
      expiresAt
    });

    // Schedule cleanup
    scheduleJob(expiresAt, async () => {
      await db.stories.delete({ id: note.id });
    });
  }
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

  // Resize if too large
  let resized = image;
  if (metadata.width > 2048 || metadata.height > 2048) {
    resized = image.resize(2048, 2048, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Convert to JPEG with good quality
  const buffer = await resized
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  return {
    buffer,
    width: metadata.width,
    height: metadata.height,
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
        src="${attachment.url}"
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
      attachment: [
        { type: 'Document', url: 'https://pixelfed.example/1.jpg' },
        { type: 'Document', url: 'https://pixelfed.example/2.jpg' },
        { type: 'Document', url: 'https://pixelfed.example/3.jpg' }
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
