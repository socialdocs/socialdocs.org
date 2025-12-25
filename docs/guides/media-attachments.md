---
sidebar_position: 9
title: Media Attachments
description: Implementing image, video, and audio attachments in ActivityPub
---

# Media Attachments

Media attachments allow posts to include images, videos, and audio files. ActivityPub uses the `attachment` property with Document, Image, Video, or Audio objects. This guide covers implementing media support.

## Attachment Structure

### Basic Image Attachment

```json
{
  "type": "Note",
  "content": "<p>Check out this photo!</p>",
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo.jpg",
      "name": "A sunset over the ocean"
    }
  ]
}
```

### Attachment Properties

| Property | Description |
|----------|-------------|
| `type` | `Document`, `Image`, `Video`, or `Audio` |
| `mediaType` | MIME type (e.g., `image/jpeg`, `video/mp4`) |
| `url` | Direct URL to the media file |
| `name` | Alt text / description (accessibility) |
| `width` | Width in pixels (optional) |
| `height` | Height in pixels (optional) |
| `blurhash` | BlurHash string for placeholder (Mastodon extension) |

## Type Variations

### Using Document (Mastodon Style)

Mastodon uses `Document` for all attachments:

```json
{
  "type": "Document",
  "mediaType": "image/png",
  "url": "https://example.com/media/image.png",
  "name": "Alt text description",
  "blurhash": "LEHV6nWB2yk8pyoJadR*.7kCMdnj",
  "width": 1920,
  "height": 1080
}
```

### Using Image (Threads Style)

Some implementations use specific types:

```json
{
  "type": "Image",
  "mediaType": "image/jpeg",
  "url": "https://example.com/media/photo.jpg",
  "name": "Description"
}
```

### Handle Both

```javascript
function getAttachmentType(attachment) {
  if (['Image', 'Document'].includes(attachment.type)) {
    if (attachment.mediaType?.startsWith('image/')) {
      return 'image';
    }
  }
  if (['Video', 'Document'].includes(attachment.type)) {
    if (attachment.mediaType?.startsWith('video/')) {
      return 'video';
    }
  }
  if (['Audio', 'Document'].includes(attachment.type)) {
    if (attachment.mediaType?.startsWith('audio/')) {
      return 'audio';
    }
  }
  return 'unknown';
}
```

## Video Attachments

```json
{
  "type": "Document",
  "mediaType": "video/mp4",
  "url": "https://example.com/media/video.mp4",
  "name": "Video description",
  "width": 1280,
  "height": 720,
  "duration": 120
}
```

### Video with Preview

```json
{
  "type": "Document",
  "mediaType": "video/mp4",
  "url": "https://example.com/media/video.mp4",
  "name": "Video description",
  "preview": {
    "type": "Image",
    "url": "https://example.com/media/video-thumb.jpg"
  }
}
```

## Audio Attachments

```json
{
  "type": "Document",
  "mediaType": "audio/mpeg",
  "url": "https://example.com/media/audio.mp3",
  "name": "Podcast episode",
  "duration": 3600
}
```

## Uploading Media

### Media Upload Endpoint

```javascript
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/ogg'
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.post('/api/media', authenticate, upload.single('file'), async (req, res) => {
  const file = req.file;

  // Generate unique filename
  const filename = `${uuid()}-${file.originalname}`;
  const filepath = `media/${filename}`;

  // Process image
  if (file.mimetype.startsWith('image/')) {
    const metadata = await sharp(file.buffer).metadata();

    // Generate blurhash
    const { data, info } = await sharp(file.buffer)
      .resize(32, 32, { fit: 'inside' })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const blurhash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4, 4
    );

    // Save file
    await saveFile(filepath, file.buffer);

    return res.json({
      id: uuid(),
      type: 'Document',
      mediaType: file.mimetype,
      url: `https://${config.domain}/${filepath}`,
      width: metadata.width,
      height: metadata.height,
      blurhash
    });
  }

  // Handle video/audio
  await saveFile(filepath, file.buffer);

  res.json({
    id: uuid(),
    type: 'Document',
    mediaType: file.mimetype,
    url: `https://${config.domain}/${filepath}`
  });
});
```

### Creating Post with Attachments

```javascript
async function createPostWithMedia(author, content, mediaIds, options = {}) {
  // Fetch media records
  const attachments = await db.media.find({ _id: { $in: mediaIds } });

  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/notes/${uuid()}`,
    type: 'Note',
    attributedTo: author.id,
    content: sanitizeHtml(content),
    published: new Date().toISOString(),
    to: options.to || ['https://www.w3.org/ns/activitystreams#Public'],
    cc: options.cc || [`${author.id}/followers`],
    attachment: attachments.map(media => ({
      type: 'Document',
      mediaType: media.mediaType,
      url: media.url,
      name: media.description || '',
      ...(media.width && { width: media.width }),
      ...(media.height && { height: media.height }),
      ...(media.blurhash && { blurhash: media.blurhash })
    })),
    ...(options.sensitive && { sensitive: true })
  };

  await db.notes.insert(note);
  return note;
}
```

## BlurHash

BlurHash generates a compact placeholder while images load:

### Generating BlurHash

```javascript
const { encode } = require('blurhash');
const sharp = require('sharp');

async function generateBlurhash(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(32, 32, { fit: 'inside' })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // x components
    4  // y components
  );
}
```

### Decoding BlurHash (Client-Side)

```javascript
import { decode } from 'blurhash';

function blurhashToDataURL(blurhash, width = 32, height = 32) {
  const pixels = decode(blurhash, width, height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}
```

## Focal Point

Mastodon supports focal points for image cropping:

```json
{
  "type": "Document",
  "mediaType": "image/jpeg",
  "url": "https://example.com/media/photo.jpg",
  "focalPoint": [0.5, 0.25]
}
```

Values range from -1.0 to 1.0 (center is 0,0).

```javascript
function applyFocalPoint(element, focalPoint) {
  if (!focalPoint) {
    element.style.objectPosition = 'center';
    return;
  }

  const [x, y] = focalPoint;
  const percentX = ((x + 1) / 2) * 100;
  const percentY = ((y + 1) / 2) * 100;

  element.style.objectPosition = `${percentX}% ${percentY}%`;
}
```

## Processing Incoming Attachments

```javascript
async function processIncomingNote(note) {
  const attachments = note.attachment || [];

  for (const attachment of attachments) {
    // Cache remote media locally (optional)
    if (shouldCacheMedia(attachment)) {
      const localUrl = await cacheRemoteMedia(attachment.url);
      attachment.localUrl = localUrl;
    }

    // Store attachment metadata
    await db.attachments.insert({
      noteId: note.id,
      type: attachment.type,
      mediaType: attachment.mediaType,
      url: attachment.url,
      localUrl: attachment.localUrl,
      name: attachment.name,
      width: attachment.width,
      height: attachment.height,
      blurhash: attachment.blurhash
    });
  }
}

async function cacheRemoteMedia(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();

  const filename = `cache/${uuid()}-${path.basename(new URL(url).pathname)}`;
  await saveFile(filename, buffer);

  return `https://${config.domain}/${filename}`;
}
```

## Sensitive Media

Mark attachments as sensitive:

```json
{
  "type": "Note",
  "content": "<p>NSFW content</p>",
  "sensitive": true,
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/nsfw.jpg"
    }
  ]
}
```

### Handling Sensitive Media

```javascript
function renderAttachment(attachment, isSensitive) {
  if (isSensitive) {
    return `
      <div class="sensitive-media" onclick="revealMedia(this)">
        <div class="blur-overlay">
          ${attachment.blurhash
            ? `<img src="${blurhashToDataURL(attachment.blurhash)}">`
            : '<div class="placeholder"></div>'
          }
          <span>Click to reveal</span>
        </div>
        <img src="${attachment.url}" alt="${attachment.name}" hidden>
      </div>
    `;
  }

  return `<img src="${attachment.url}" alt="${attachment.name}">`;
}
```

## Multiple Attachments

Posts can have multiple attachments:

```json
{
  "type": "Note",
  "content": "<p>My photo gallery</p>",
  "attachment": [
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo1.jpg",
      "name": "First photo"
    },
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo2.jpg",
      "name": "Second photo"
    },
    {
      "type": "Document",
      "mediaType": "image/jpeg",
      "url": "https://example.com/media/photo3.jpg",
      "name": "Third photo"
    }
  ]
}
```

Mastodon limits to 4 attachments per post.

## Alt Text

Always include descriptive alt text:

```javascript
async function uploadMedia(file, description) {
  // ... upload processing ...

  return {
    type: 'Document',
    mediaType: file.mimetype,
    url: mediaUrl,
    name: description || '' // Alt text goes in name
  };
}
```

### Accessibility Best Practices

```javascript
function validateAltText(attachments) {
  const warnings = [];

  for (const attachment of attachments) {
    if (!attachment.name || attachment.name.trim() === '') {
      warnings.push(`Attachment ${attachment.url} is missing alt text`);
    }
  }

  return warnings;
}
```

## Common Issues

### Type Mismatch

Handle both Document and specific types:

```javascript
function isImageAttachment(attachment) {
  if (attachment.type === 'Image') return true;
  if (attachment.type === 'Document') {
    return attachment.mediaType?.startsWith('image/');
  }
  return false;
}
```

### Missing mediaType

Infer from URL if missing:

```javascript
function inferMediaType(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
```

### Remote Media Failures

Handle unavailable media gracefully:

```javascript
async function renderAttachment(attachment) {
  try {
    const response = await fetch(attachment.url, { method: 'HEAD' });
    if (!response.ok) {
      return '<div class="media-unavailable">Media unavailable</div>';
    }
    return `<img src="${attachment.url}" alt="${attachment.name}">`;
  } catch (error) {
    return '<div class="media-unavailable">Media unavailable</div>';
  }
}
```

## Next Steps

- **[Polls](/docs/guides/polls)** - Creating polls
- **[Custom Emoji](/docs/guides/custom-emoji)** - Custom emoji support
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Platform specifics
