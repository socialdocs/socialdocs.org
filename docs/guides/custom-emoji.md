---
sidebar_position: 11
title: Custom Emoji
description: Implementing custom emoji support using ActivityPub tags
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (activity/create.rb process_emoji, parser/custom_emoji_parser.rb, custom_emoji.rb, emoji_serializer.rb, activity/like.rb), FEP-c0e0 and FEP-9098 (DRAFT, Codeberg 2026-10-15)"
---

# Custom Emoji

Custom emoji allow servers to define their own emoji that can be used in posts and display names. They're implemented using the `Emoji` tag type — a Mastodon extension (`toot:Emoji`), not part of AS2, described for other implementers in [FEP-9098](https://codeberg.org/fediverse/fep/src/branch/main/fep/9098/fep-9098.md) (DRAFT).

## Emoji Structure

### Emoji Tag Format

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

### Post with Custom Emoji

```json
{
  "type": "Note",
  "content": "<p>Hello! <img src=\"https://example.com/emoji/blobcat.png\" alt=\":blobcat:\" class=\"emoji\"> How are you?</p>",
  "tag": [
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

## Emoji Properties

| Property | Description |
|----------|-------------|
| `type` | Always `"Emoji"` |
| `id` | Unique identifier URL |
| `name` | Shortcode with colons (e.g., `:blobcat:`) |
| `icon` | Image object with the emoji graphic; Mastodon reads only `icon.url` |
| `updated` | When the emoji was last modified (optional); Mastodon re-downloads when it is newer |

This is what Mastodon sends ([`emoji_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/emoji_serializer.rb)) and reads ([`custom_emoji_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/custom_emoji_parser.rb)).

## Storing Custom Emoji

### Database Schema

```javascript
const emojiSchema = {
  shortcode: String,      // 'blobcat' (without colons)
  domain: String,         // null for local, domain for remote
  url: String,            // Image URL (our copy, also for remote emoji)
  mediaType: String,      // image/png, image/gif or image/webp
  remoteUrl: String,      // remote emoji: the icon.url we copied from
  staticUrl: String,      // Static version for animated emoji
  visible: Boolean,       // Show in emoji picker
  category: String,       // Optional category
  createdAt: Date,
  updatedAt: Date
};
```

### Adding Local Emoji

```javascript
async function addEmoji(shortcode, imageFile, options = {}) {
  // Same rule as Mastodon: 2+ chars of letters, digits and underscores
  if (!/^[a-zA-Z0-9_]{2,128}$/.test(shortcode)) {
    throw new Error('Invalid shortcode: 2-128 letters, numbers or underscores');
  }

  // Check for duplicates
  const existing = await db.emoji.findOne({
    shortcode,
    domain: null
  });
  if (existing) {
    throw new Error('Emoji shortcode already exists');
  }

  // Detect the real format (don't trust the declared MIME type)
  const meta = await sharp(imageFile.buffer).metadata();
  if (!['png', 'gif', 'webp'].includes(meta.format)) {
    throw new Error('Emoji must be PNG, GIF or WebP'); // Mastodon's allowed types
  }
  const animated = (meta.pages || 1) > 1;
  const fit = { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } };

  // Keep animation in the main image; also make a static PNG, as Mastodon does
  const filename = `emoji/${shortcode}.${animated ? meta.format : 'png'}`;
  const main = sharp(imageFile.buffer, { animated }).resize(128, 128, fit);
  await (animated ? main.toFormat(meta.format) : main.png()).toFile(filename);

  const staticFilename = `emoji/${shortcode}_static.png`;
  await sharp(imageFile.buffer).resize(128, 128, fit).png().toFile(staticFilename);
  const staticUrl = `https://${config.domain}/${staticFilename}`;

  const emoji = {
    shortcode,
    domain: null,
    url: `https://${config.domain}/${filename}`,
    mediaType: `image/${animated ? meta.format : 'png'}`,
    staticUrl,
    visible: options.visible !== false,
    category: options.category || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.emoji.insert(emoji);
  return emoji;
}
```

## Using Emoji in Posts

### Parsing Emoji Shortcodes

Mastodon only recognises `:shortcode:` when it is not glued to other letters, digits or colons ([`CustomEmoji::SCAN_RE`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/custom_emoji.rb)):

```javascript
function parseEmoji(text) {
  const emojiRegex = /(?<=^|[^\p{L}\p{N}:]):([a-zA-Z0-9_]{2,}):(?=$|[^\p{L}\p{N}:])/gmu;
  const shortcodes = [];
  let match;

  while ((match = emojiRegex.exec(text)) !== null) {
    shortcodes.push(match[1]);
  }

  return [...new Set(shortcodes)];
}
```

### Building Emoji Tags

```javascript
async function buildEmojiTags(text) {
  const shortcodes = parseEmoji(text);
  const tags = [];

  for (const shortcode of shortcodes) {
    const emoji = await db.emoji.findOne({
      shortcode,
      domain: null // Only local emoji
    });

    if (emoji) {
      tags.push({
        type: 'Emoji',
        id: `https://${config.domain}/emoji/${shortcode}`,
        name: `:${shortcode}:`,
        updated: emoji.updatedAt.toISOString(),
        icon: {
          type: 'Image',
          mediaType: emoji.mediaType, // image/png, image/gif or image/webp
          url: emoji.url
        }
      });
    }
  }

  return tags;
}
```

### Converting to HTML

For your **own** posts (text you escaped yourself), replacing shortcodes is safe — escape the values anyway:

```javascript
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function emojiToHtml(escapedText, tags) {
  let html = escapedText;
  for (const emoji of [].concat(tags || []).filter(t => t?.type === 'Emoji')) {
    const shortcode = escapeHtml(emoji.name); // :shortcode:
    const img = `<img src="${escapeHtml(emoji.icon.url)}" alt="${shortcode}" title="${shortcode}" class="emoji" draggable="false">`;
    html = html.split(shortcode).join(img);
  }
  return html;
}
```

Mastodon itself sends the plain `:shortcode:` text in `content` and lets each receiver render the image.

### Complete Post Creation

```javascript
async function createPostWithEmoji(author, content, options = {}) {
  // Build all tags
  const emojiTags = await buildEmojiTags(content);
  const mentionTags = await buildMentionTags(content);
  const hashtagTags = buildHashtagTags(content);

  // Convert content to HTML with emoji
  let html = escapeHtml(content);
  html = await emojiToHtml(html, emojiTags);
  html = mentionsToHtml(html, mentionTags);
  html = hashtagsToHtml(html, config.domain);
  html = `<p>${html}</p>`;

  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/notes/${uuid()}`,
    type: 'Note',
    attributedTo: author.id,
    content: html,
    published: new Date().toISOString(),
    tag: [...emojiTags, ...mentionTags, ...hashtagTags],
    to: options.to || ['https://www.w3.org/ns/activitystreams#Public'],
    cc: options.cc || [author.followers]
  };

  await db.notes.insert(note);
  return note;
}
```

## Processing Remote Emoji

### Caching Remote Emoji

**Namespace remote emoji by the domain of the actor who sent them**, never by the tag's `id` or `icon.url`. Both are attacker-controlled: if you key on `new URL(tag.id).hostname`, any server can send `{"id": "https://victim.example/emoji/blobcat", ...}` and replace `:blobcat:` for every post from `victim.example`. Mastodon stores remote emoji under the sending account's domain ([`create.rb` `process_emoji`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)).

```javascript
async function processIncomingEmoji(tags, senderActor) {
  const domain = new URL(senderActor.id).hostname; // the verified sender
  const emojiTags = [].concat(tags || []).filter(t => t?.type === 'Emoji');

  for (const tag of emojiTags) {
    const shortcode = typeof tag.name === 'string' ? tag.name.replace(/:/g, '') : '';
    const iconUrl = tag.icon?.url;
    if (!/^[a-zA-Z0-9_]{2,}$/.test(shortcode) || !iconUrl) continue;
    if (new URL(iconUrl).protocol !== 'https:') continue;

    const existing = await db.emoji.findOne({ shortcode, domain });
    const updated = tag.updated ? new Date(tag.updated) : null;

    // Same rule as Mastodon: (re)fetch if new, if the image URL changed,
    // or if `updated` is newer than our copy
    if (existing && existing.remoteUrl === iconUrl && !(updated > existing.updatedAt)) continue;

    // Download and re-host the image (SSRF-safe fetch, size cap, decode
    // and re-encode) instead of hot-linking a remote URL
    const url = await cacheRemoteEmojiImage(iconUrl);
    if (!url) continue;

    await db.emoji.upsert({ shortcode, domain }, {
      $set: { remoteUrl: iconUrl, url, uri: tag.id, visible: false, updatedAt: new Date() },
    });
  }
}
```

### Rendering Remote Emoji

Sanitize the remote `content` first, then replace shortcodes **only in text nodes** (a blind string replace can land inside an attribute such as `title=":blobcat:"`), using your cached copy keyed by the author's domain:

```javascript
async function renderEmojiInto(sanitizedFragment, note, authorDomain) {
  const shortcodes = new Set(
    [].concat(note.tag || []).filter(t => t?.type === 'Emoji').map(t => t.name)
  );

  // `sanitizedFragment` is a DOM fragment from your HTML sanitizer
  for (const textNode of textNodesOf(sanitizedFragment)) {
    for (const name of shortcodes) {
      if (!textNode.data.includes(name)) continue;
      const cached = await db.emoji.findOne({ shortcode: name.replace(/:/g, ''), domain: authorDomain });
      if (!cached) continue;
      replaceTextWithImg(textNode, name, { src: cached.url, alt: name, className: 'emoji' });
    }
  }
}
```

## Emoji in Display Names

Actors can use emoji in their display name:

```json
{
  "type": "Person",
  "id": "https://example.com/users/alice",
  "name": "Alice :verified:",
  "tag": [
    {
      "type": "Emoji",
      "name": ":verified:",
      "icon": {
        "type": "Image",
        "url": "https://example.com/emoji/verified.png"
      }
    }
  ]
}
```

### Processing Actor Emoji

```javascript
async function renderActorName(actor) {
  // The name is plain text: escape it, then swap in cached emoji images
  let name = escapeHtml(actor.name || actor.preferredUsername);
  const domain = new URL(actor.id).hostname;

  for (const emoji of [].concat(actor.tag || []).filter(t => t?.type === 'Emoji')) {
    const cached = await db.emoji.findOne({ shortcode: String(emoji.name).replace(/:/g, ''), domain });
    if (!cached) continue;
    const alt = escapeHtml(emoji.name);
    name = name.split(alt).join(`<img src="${escapeHtml(cached.url)}" alt="${alt}" class="emoji">`);
  }

  return name;
}
```

## Emoji API

### List Available Emoji

```javascript
app.get('/api/custom_emojis', async (req, res) => {
  const emoji = await db.emoji.find({
    domain: null,
    visible: true
  });

  res.json(emoji.map(e => ({
    shortcode: e.shortcode,
    url: e.url,
    static_url: e.staticUrl || e.url,
    visible_in_picker: e.visible,
    category: e.category
  })));
});
```

### Emoji Picker Data

```javascript
async function getEmojiPicker() {
  const emoji = await db.emoji.find({
    domain: null,
    visible: true
  }).sort({ category: 1, shortcode: 1 });

  // Group by category
  const categories = {};
  for (const e of emoji) {
    const cat = e.category || 'Custom';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push({
      shortcode: e.shortcode,
      url: e.staticUrl || e.url
    });
  }

  return categories;
}
```

## Emoji Reactions

Emoji reactions are described in [FEP-c0e0](https://codeberg.org/fediverse/fep/src/branch/main/fep/c0e0/fep-c0e0.md) (DRAFT), based on Misskey, Pleroma and Fedibird; Hollo, Mitra, PieFed and Iceshrimp.NET have announced support. A reaction is an `EmojiReact` (`http://litepub.social/ns#EmojiReact`) whose `content` is a single Unicode emoji or a `:shortcode:`; a custom emoji is carried as one `Emoji` in `tag`:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "toot": "http://joinmastodon.org/ns#",
      "Emoji": "toot:Emoji",
      "litepub": "http://litepub.social/ns#",
      "EmojiReact": "litepub:EmojiReact"
    }
  ],
  "type": "EmojiReact",
  "id": "https://example.com/activities/react-1",
  "actor": "https://example.com/users/bob",
  "object": "https://other.example/notes/123",
  "content": ":blobcat:",
  "tag": [
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
  ],
  "to": ["https://other.example/users/alice"]
}
```

A reaction can also be sent as a `Like` with `content`, which non-supporting software treats as a plain like; FEP-c0e0 says implementations MUST treat such a `Like` like an `EmojiReact`. Reactions are retracted with `Undo`.

:::note Mastodon
Mastodon (4.7.3) has no `EmojiReact` handler and treats a `Like` with `content` as an ordinary favourite ([`like.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/like.rb)). Its `toot:Emoji` term is still the one reactions use.
:::

## CSS Styling

```css
.emoji {
  width: 1.2em;
  height: 1.2em;
  vertical-align: middle;
  object-fit: contain;
  margin: 0 0.1em;
}

/* Larger emoji in picker */
.emoji-picker .emoji {
  width: 32px;
  height: 32px;
  cursor: pointer;
}

/* Animated emoji - pause on reduced motion */
@media (prefers-reduced-motion: reduce) {
  .emoji {
    animation: none;
  }
}
```

## Common Issues

### Shortcode Extraction

Extract shortcode correctly from the name:

```javascript
function extractShortcode(name) {
  // Handle ":shortcode:" format
  return name.replace(/^:/, '').replace(/:$/, '');
}
```

### Missing Icon Data

Always send `icon` as an `Image` with a `url`: Mastodon reads only `icon.url` and skips emoji without it.

### Case Sensitivity

Mastodon matches shortcodes exactly (case-sensitive), unique per domain. Look them up by exact value — and never build a regular expression from a shortcode you received:

```javascript
async function findEmoji(shortcode, domain) {
  return db.emoji.findOne({ shortcode, domain });
}
```

## Next Steps

- **[Account Migration](/docs/guides/account-migration)** - Moving accounts
- **[Content Moderation](/docs/guides/content-moderation)** - Handling abuse
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Platform specifics
