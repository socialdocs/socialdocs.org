---
sidebar_position: 11
title: Custom Emoji
description: Implementing custom emoji support using ActivityPub tags
---

# Custom Emoji

Custom emoji allow servers to define their own emoji that can be used in posts and display names. They're implemented using the `Emoji` tag type. This guide covers implementing custom emoji support.

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
| `icon` | Image object with the emoji graphic |
| `updated` | When the emoji was last modified (optional) |

## Storing Custom Emoji

### Database Schema

```javascript
const emojiSchema = {
  shortcode: String,      // 'blobcat' (without colons)
  domain: String,         // null for local, domain for remote
  url: String,            // Image URL
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
  // Validate shortcode
  if (!/^[a-zA-Z0-9_]+$/.test(shortcode)) {
    throw new Error('Invalid shortcode: use only letters, numbers, and underscores');
  }

  // Check for duplicates
  const existing = await db.emoji.findOne({
    shortcode,
    domain: null
  });
  if (existing) {
    throw new Error('Emoji shortcode already exists');
  }

  // Process and save image
  const filename = `emoji/${shortcode}.png`;
  await sharp(imageFile)
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(filename);

  // Create static version for animated emoji
  let staticUrl = null;
  if (imageFile.mimetype === 'image/gif') {
    const staticFilename = `emoji/${shortcode}_static.png`;
    await sharp(imageFile, { animated: false })
      .resize(128, 128, { fit: 'contain' })
      .png()
      .toFile(staticFilename);
    staticUrl = `https://${config.domain}/${staticFilename}`;
  }

  const emoji = {
    shortcode,
    domain: null,
    url: `https://${config.domain}/${filename}`,
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

```javascript
function parseEmoji(text) {
  const emojiRegex = /:([a-zA-Z0-9_]+):/g;
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
        icon: {
          type: 'Image',
          mediaType: 'image/png',
          url: emoji.url
        }
      });
    }
  }

  return tags;
}
```

### Converting to HTML

```javascript
async function emojiToHtml(text, tags) {
  const emojiTags = (tags || []).filter(t => t.type === 'Emoji');

  let html = text;
  for (const emoji of emojiTags) {
    const shortcode = emoji.name; // :shortcode:
    const imgHtml = `<img src="${emoji.icon.url}" alt="${shortcode}" title="${shortcode}" class="emoji" draggable="false">`;
    html = html.split(shortcode).join(imgHtml);
  }

  return html;
}
```

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
    cc: options.cc || [`${author.id}/followers`]
  };

  await db.notes.insert(note);
  return note;
}
```

## Processing Remote Emoji

### Caching Remote Emoji

```javascript
async function processIncomingEmoji(tags) {
  const emojiTags = (tags || []).filter(t => t.type === 'Emoji');

  for (const tag of emojiTags) {
    const shortcode = tag.name.replace(/:/g, '');
    const domain = new URL(tag.id || tag.icon.url).hostname;

    // Check if already cached
    const existing = await db.emoji.findOne({ shortcode, domain });

    if (!existing) {
      // Cache the remote emoji
      await db.emoji.insert({
        shortcode,
        domain,
        url: tag.icon.url,
        staticUrl: null,
        visible: false, // Don't show remote emoji in local picker
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (tag.updated && new Date(tag.updated) > existing.updatedAt) {
      // Update if remote emoji was modified
      await db.emoji.update(
        { shortcode, domain },
        { $set: { url: tag.icon.url, updatedAt: new Date() } }
      );
    }
  }
}
```

### Rendering Remote Emoji

```javascript
async function renderContent(note) {
  let html = note.content;

  // Process emoji tags
  const emojiTags = (note.tag || []).filter(t => t.type === 'Emoji');

  for (const emoji of emojiTags) {
    // Use locally cached URL if available
    const cached = await db.emoji.findOne({
      shortcode: emoji.name.replace(/:/g, ''),
      domain: new URL(emoji.id || emoji.icon.url).hostname
    });

    const url = cached?.localUrl || emoji.icon.url;
    const img = `<img src="${url}" alt="${emoji.name}" class="emoji">`;

    // Replace shortcode with image
    html = html.split(emoji.name).join(img);
  }

  return html;
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
function renderActorName(actor) {
  let name = escapeHtml(actor.name || actor.preferredUsername);

  const emojiTags = (actor.tag || []).filter(t => t.type === 'Emoji');

  for (const emoji of emojiTags) {
    const img = `<img src="${emoji.icon.url}" alt="${emoji.name}" class="emoji">`;
    name = name.split(emoji.name).join(img);
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

Some platforms support emoji reactions (like Discord):

```json
{
  "type": "EmojiReact",
  "actor": "https://example.com/users/bob",
  "object": "https://example.com/notes/123",
  "content": ":blobcat:",
  "tag": [
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

:::note
Emoji reactions are not part of the ActivityPub spec and are not supported by Mastodon. They're used by Pleroma, Misskey, and others.
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

Some implementations use different structures:

```javascript
function getEmojiUrl(emojiTag) {
  if (emojiTag.icon?.url) {
    return emojiTag.icon.url;
  }
  if (emojiTag.url) {
    return emojiTag.url;
  }
  if (emojiTag.href) {
    return emojiTag.href;
  }
  return null;
}
```

### Case Sensitivity

Shortcodes should be case-insensitive:

```javascript
async function findEmoji(shortcode) {
  return db.emoji.findOne({
    shortcode: { $regex: new RegExp(`^${shortcode}$`, 'i') }
  });
}
```

## Next Steps

- **[Account Migration](/docs/guides/account-migration)** - Moving accounts
- **[Content Moderation](/docs/guides/content-moderation)** - Handling abuse
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Platform specifics
