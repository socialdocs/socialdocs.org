---
sidebar_position: 9
title: Media Attachments
description: Implementing image, video, and audio attachments in ActivityPub
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (note_serializer.rb MediaAttachmentSerializer, parser/media_attachment_parser.rb, activity/create.rb, media_attachment.rb, status.rb), Mastodon API guidelines (focal points), AS2 Vocabulary, sharp docs"
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
| `name` | Alt text. Mastodon sends alt text as `name`, and when reading prefers `summary`, then `name` ([`media_attachment_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/media_attachment_parser.rb)) |
| `width` | Width in pixels (optional) |
| `height` | Height in pixels (optional) |
| `duration` | Length of audio/video as an [`xsd:duration`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-duration) string such as `PT2M` — not a number (optional) |
| `icon` | Thumbnail for video/audio; Mastodon reads `icon` (a URL or an `Image` with `url`) (optional) |
| `blurhash` | BlurHash placeholder (Mastodon extension, `toot:blurhash`). Mastodon ignores it if either component count is above 5 |
| `focalPoint` | `[x, y]` crop focus (Mastodon extension, `toot:focalPoint`) |

These are the properties Mastodon serializes on each attachment ([`MediaAttachmentSerializer`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/note_serializer.rb)).

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

### Using Specific Types

Other implementations use the specific AS2 types:

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
  "duration": "PT2M"
}
```

### Video with Thumbnail

Mastodon puts a custom thumbnail in `icon` and reads it from there; it does not read AS2 `preview` ([`media_attachment_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/media_attachment_parser.rb)):

```json
{
  "type": "Document",
  "mediaType": "video/mp4",
  "url": "https://example.com/media/video.mp4",
  "name": "Video description",
  "icon": {
    "type": "Image",
    "mediaType": "image/jpeg",
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
  "duration": "PT1H"
}
```

## Uploading Media

### Media Upload Endpoint

Three rules for uploads:

- **Never use the client's filename** in a path (`../../` traversal) — generate the name and extension yourself.
- **Don't trust the declared MIME type** — `file.mimetype` is whatever the client sent. Decode the file and use the detected format.
- **Strip metadata.** Phone photos carry EXIF GPS coordinates. Re-encode images (sharp drops metadata unless you ask it to keep it, and `.rotate()` first applies the EXIF orientation), and strip video/audio metadata with `ffmpeg -map_metadata -1`, as Mastodon does ([`vips_lazy_thumbnail.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/lib/paperclip/vips_lazy_thumbnail.rb)).

```javascript
import multer from 'multer';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { randomUUID } from 'node:crypto';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// sharp format -> [mediaType, extension]; no SVG (it can carry script)
const IMAGE_FORMATS = {
  jpeg: ['image/jpeg', 'jpg'],
  png: ['image/png', 'png'],
  webp: ['image/webp', 'webp'],
  gif: ['image/gif', 'gif'],
};

app.post('/api/media', authenticate, upload.single('file'), async (req, res) => {
  const meta = await sharp(req.file.buffer, { animated: true }).metadata().catch(() => null);
  const format = meta && IMAGE_FORMATS[meta.format];
  if (!format) {
    // Video/audio: probe and strip with ffmpeg in a job, then store the same way
    return res.status(415).json({ error: 'Unsupported media type' });
  }
  const [mediaType, ext] = format;

  // Re-encode: applies EXIF orientation, drops EXIF/GPS and other metadata
  const { data: clean, info } = await sharp(req.file.buffer, { animated: true })
    .rotate()
    .toFormat(meta.format)
    .toBuffer({ resolveWithObject: true });

  const { data: pixels, info: small } = await sharp(clean)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const blurhash = encode(new Uint8ClampedArray(pixels), small.width, small.height, 4, 4);

  const id = randomUUID();
  const filepath = `media/${id}.${ext}`;
  await saveFile(filepath, clean);

  const media = {
    id,
    ownerId: req.user.id,
    mediaType,
    url: `https://${config.domain}/${filepath}`,
    width: info.width,
    height: meta.pageHeight ?? info.height, // one frame of an animation
    blurhash,
    description: String(req.body.description || '').slice(0, 10000), // Mastodon's limit
  };
  await db.media.insert(media);
  res.json({ id, url: media.url });
});
```

Serve uploaded files with the stored `Content-Type` and `X-Content-Type-Options: nosniff`, from a separate domain if you can.

### Creating Post with Attachments

```javascript
async function createPostWithMedia(author, content, mediaIds, options = {}) {
  // Only the uploader's own media, in the order given, at most 4
  // (Mastodon keeps only the first 4 attachments of remote posts too)
  const owned = await db.media.find({ id: { $in: mediaIds }, ownerId: author.id });
  const attachments = mediaIds
    .map(id => owned.find(m => m.id === id))
    .filter(Boolean)
    .slice(0, 4);

  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/notes/${uuid()}`,
    type: 'Note',
    attributedTo: author.id,
    content: sanitizeHtml(content),
    published: new Date().toISOString(),
    to: options.to || ['https://www.w3.org/ns/activitystreams#Public'],
    cc: options.cc || [author.followers],
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

Values range from -1.0 to 1.0, **left-to-right and bottom-to-top**; `(0, 0)` is the centre, so `[0.5, 0.25]` is right of and above centre ([Mastodon API guidelines](https://docs.joinmastodon.org/api/guidelines/#focal-points)). CSS `object-position` runs top-to-bottom, so flip `y`:

```javascript
function applyFocalPoint(element, focalPoint) {
  if (!Array.isArray(focalPoint) || focalPoint.length !== 2) {
    element.style.objectPosition = 'center';
    return;
  }

  const clamp = (v) => Math.max(-1, Math.min(1, Number(v) || 0));
  const [x, y] = focalPoint.map(clamp);
  const percentX = ((x + 1) / 2) * 100;
  const percentY = ((1 - y) / 2) * 100; // +1 is the top edge

  element.style.objectPosition = `${percentX}% ${percentY}%`;
}
```

## Processing Incoming Attachments

Mastodon treats an attachment with an `href` as a link (a preview-card candidate), not media, and keeps at most 4 media attachments ([`create.rb` `process_attachments`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)). `url` may be a string or a `Link` object.

```javascript
const urlOf = (u) => (typeof u === 'string' ? u : Array.isArray(u) ? urlOf(u[0]) : u?.href);

async function processIncomingNote(note) {
  const attachments = [].concat(note.attachment || [])
    .filter(a => a && !a.href)          // href = link, not media
    .slice(0, 4);

  for (const attachment of attachments) {
    const url = urlOf(attachment.url);
    if (!url || new URL(url).protocol !== 'https:') continue;

    await db.attachments.insert({
      noteId: note.id,
      type: attachment.type,
      mediaType: attachment.mediaType,
      url,
      description: attachment.summary || attachment.name || '',
      width: attachment.width,
      height: attachment.height,
      blurhash: attachment.blurhash,
      // optional: cached copy made by a background job
      localUrl: shouldCacheMedia(attachment) ? await cacheRemoteMedia(url) : null
    });
  }
}

async function cacheRemoteMedia(url) {
  // SSRF-safe fetch with a byte cap and timeout (see the media proxy in
  // /docs/reference/content-security), then decode and re-encode it like an
  // upload — never store remote bytes under a remote-chosen name or type
  const buffer = await safeFetchBuffer(url, { maxBytes: 10 * 1024 * 1024 });
  const meta = await sharp(buffer).metadata().catch(() => null);
  const format = meta && IMAGE_FORMATS[meta.format];
  if (!format) return null;

  const filename = `cache/${randomUUID()}.${format[1]}`;
  await saveFile(filename, await sharp(buffer).rotate().toFormat(meta.format).toBuffer());
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

`sensitive` is a Mastodon extension (`as:sensitive`), not part of AS2.

### Handling Sensitive Media

Every value here came from a remote server: escape it, and accept only `https:` media URLs.

```javascript
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function renderAttachment(attachment, isSensitive) {
  const url = new URL(attachment.localUrl || attachment.url);
  if (url.protocol !== 'https:') return '';
  const img = `<img src="${escapeHtml(url.href)}" alt="${escapeHtml(attachment.description)}"`;

  if (isSensitive) {
    // Reveal with a <button> + event listener in your client code, not inline JS
    return `
      <div class="sensitive-media">
        <button type="button" class="reveal">Show sensitive media</button>
        ${img} hidden>
      </div>`;
  }
  return `${img}>`;
}
```

The BlurHash placeholder is drawn client-side (see above) from a value Mastodon validates; validate it the same way before decoding.

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

Mastodon allows 4 attachments per post and keeps only the first 4 of a remote post ([`Status::MEDIA_ATTACHMENTS_LIMIT`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/status.rb)).

## Alt Text

Always include descriptive alt text:

```javascript
function toAttachment(media) {
  return {
    type: 'Document',
    mediaType: media.mediaType,
    url: media.url,
    name: media.description || '' // Alt text goes in name
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

Don't probe remote media from the server while rendering (it's slow, and an SSRF vector). Cache media in a background job, or let the client handle failures — e.g. swap in a "media unavailable" placeholder from an `error` event listener on the `<img>`.

## Next Steps

- **[Polls](/docs/guides/polls)** - Creating polls
- **[Custom Emoji](/docs/guides/custom-emoji)** - Custom emoji support
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Platform specifics
