---
sidebar_position: 8
title: Mentions and Hashtags
description: Implementing @mentions and #hashtags using ActivityPub tags
---

# Mentions and Hashtags

Mentions and hashtags are implemented using the `tag` property in ActivityPub. Both use the same mechanism but with different types: `Mention` for user references and `Hashtag` for topic tags. This guide covers implementing both.

## The Tag Property

Tags link content references in `content` to structured data:

```json
{
  "type": "Note",
  "content": "<p>Hey <a href=\"https://example.com/users/bob\">@bob</a>! Check out <a href=\"https://example.com/tags/fediverse\">#Fediverse</a></p>",
  "tag": [
    {
      "type": "Mention",
      "href": "https://example.com/users/bob",
      "name": "@bob@example.com"
    },
    {
      "type": "Hashtag",
      "href": "https://example.com/tags/fediverse",
      "name": "#Fediverse"
    }
  ]
}
```

## Mentions

### Mention Tag Format

```json
{
  "type": "Mention",
  "href": "https://example.com/users/bob",
  "name": "@bob@example.com"
}
```

| Property | Description |
|----------|-------------|
| `type` | Always `"Mention"` |
| `href` | The actor's ActivityPub ID (URL) |
| `name` | The `@username@domain` format |

### Parsing Mentions from Text

```javascript
function parseMentions(text) {
  // Match @username@domain.tld pattern
  const mentionRegex = /@([a-zA-Z0-9_]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      domain: match[2],
      full: match[0]
    });
  }

  return mentions;
}
```

### Resolving Mentions to Actors

```javascript
async function resolveMention(username, domain) {
  // Use WebFinger to find the actor
  const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`;

  const response = await fetch(webfingerUrl, {
    headers: { 'Accept': 'application/jrd+json' }
  });

  const jrd = await response.json();

  // Find the ActivityPub link
  const apLink = jrd.links.find(link =>
    link.rel === 'self' &&
    (link.type === 'application/activity+json' ||
     link.type === 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"')
  );

  if (!apLink) {
    throw new Error('No ActivityPub link found');
  }

  return apLink.href;
}
```

### Building Mention Tags

```javascript
async function buildMentionTags(text) {
  const mentions = parseMentions(text);
  const tags = [];

  for (const mention of mentions) {
    try {
      const actorId = await resolveMention(mention.username, mention.domain);

      tags.push({
        type: 'Mention',
        href: actorId,
        name: mention.full
      });
    } catch (error) {
      console.log(`Could not resolve mention: ${mention.full}`);
    }
  }

  return tags;
}
```

### Converting Mentions to HTML

```javascript
function mentionsToHtml(text, mentions) {
  let html = text;

  for (const mention of mentions) {
    const link = `<a href="${mention.href}" class="mention">@${mention.name.split('@')[1]}</a>`;
    html = html.replace(mention.name, link);
  }

  return html;
}
```

### Mention Notifications

Mastodon requires mentions in `tag` to generate notifications:

```javascript
async function processCreate(activity) {
  const note = activity.object;

  // Extract mentions from tags
  const mentions = (note.tag || []).filter(t => t.type === 'Mention');

  // Check if any mentions are local users
  for (const mention of mentions) {
    const localUser = await db.actors.findOne({ id: mention.href });

    if (localUser) {
      // Create notification
      await createNotification(localUser.id, 'mention', {
        actor: note.attributedTo,
        note: note.id
      });
    }
  }
}
```

### Addressing Mentioned Users

Mentioned users must be included in `to` or `cc` to receive the post:

```javascript
async function createPostWithMentions(author, content, visibility) {
  const mentionTags = await buildMentionTags(content);
  const mentionedActors = mentionTags.map(t => t.href);

  // Build addressing
  const to = [];
  const cc = [];

  if (visibility === 'public') {
    to.push('https://www.w3.org/ns/activitystreams#Public');
    cc.push(`${author.id}/followers`);
    cc.push(...mentionedActors); // Add mentions to cc
  } else if (visibility === 'direct') {
    to.push(...mentionedActors); // DM: mentions go in to
  }

  return createPost(author, content, { to, cc, tag: mentionTags });
}
```

## Hashtags

### Hashtag Tag Format

```json
{
  "type": "Hashtag",
  "href": "https://example.com/tags/fediverse",
  "name": "#Fediverse"
}
```

| Property | Description |
|----------|-------------|
| `type` | Always `"Hashtag"` |
| `href` | URL to the hashtag page on your server |
| `name` | The `#tag` including the hash symbol |

### Parsing Hashtags

```javascript
function parseHashtags(text) {
  // Match #hashtag pattern (unicode-aware)
  const hashtagRegex = /#([a-zA-Z0-9_\u00C0-\u024F]+)/g;
  const hashtags = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push({
      tag: match[1],
      full: match[0]
    });
  }

  return hashtags;
}
```

### Normalizing Hashtags

Mastodon normalizes hashtags to lowercase ASCII:

```javascript
function normalizeHashtag(tag) {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9_]/g, '');     // Remove invalid chars
}
```

### Building Hashtag Tags

```javascript
function buildHashtagTags(text) {
  const hashtags = parseHashtags(text);
  const tags = [];

  for (const hashtag of hashtags) {
    const normalized = normalizeHashtag(hashtag.tag);

    tags.push({
      type: 'Hashtag',
      href: `https://${config.domain}/tags/${normalized}`,
      name: `#${hashtag.tag}` // Keep original case in name
    });
  }

  return tags;
}
```

### Converting Hashtags to HTML

```javascript
function hashtagsToHtml(text, domain) {
  return text.replace(/#([a-zA-Z0-9_\u00C0-\u024F]+)/g, (match, tag) => {
    const normalized = normalizeHashtag(tag);
    return `<a href="https://${domain}/tags/${normalized}" class="hashtag">#${tag}</a>`;
  });
}
```

### Hashtag Timeline

```javascript
app.get('/tags/:tag', async (req, res) => {
  const tag = normalizeHashtag(req.params.tag);

  // Find posts with this hashtag
  const posts = await db.notes.find({
    'tag': {
      $elemMatch: {
        type: 'Hashtag',
        name: { $regex: new RegExp(`^#${tag}$`, 'i') }
      }
    },
    // Only public posts
    'to': 'https://www.w3.org/ns/activitystreams#Public'
  }).sort({ published: -1 }).limit(20);

  // Return as ActivityPub collection or HTML
  if (req.accepts('application/activity+json')) {
    res.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `https://${config.domain}/tags/${tag}`,
      totalItems: posts.length,
      orderedItems: posts.map(p => p.id)
    });
  } else {
    res.render('hashtag', { tag, posts });
  }
});
```

## Featured Hashtags

Users can feature hashtags on their profile:

```json
{
  "type": "Person",
  "id": "https://example.com/users/alice",
  "featuredTags": "https://example.com/users/alice/featured_tags"
}
```

### Featured Tags Collection

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Collection",
  "id": "https://example.com/users/alice/featured_tags",
  "totalItems": 2,
  "items": [
    {
      "type": "Hashtag",
      "href": "https://example.com/tags/activitypub",
      "name": "#ActivityPub"
    },
    {
      "type": "Hashtag",
      "href": "https://example.com/tags/fediverse",
      "name": "#Fediverse"
    }
  ]
}
```

## Complete Example

Putting it all together:

```javascript
async function createPost(author, rawText, options = {}) {
  // Parse mentions and hashtags
  const mentionTags = await buildMentionTags(rawText);
  const hashtagTags = buildHashtagTags(rawText);

  // Convert to HTML
  let html = escapeHtml(rawText);
  html = mentionsToHtml(html, mentionTags);
  html = hashtagsToHtml(html, config.domain);
  html = `<p>${html}</p>`;

  // Build addressing
  const mentionedActors = mentionTags.map(t => t.href);
  const to = [...(options.to || [])];
  const cc = [...(options.cc || []), ...mentionedActors];

  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/notes/${uuid()}`,
    type: 'Note',
    attributedTo: author.id,
    content: html,
    published: new Date().toISOString(),
    to,
    cc,
    tag: [...mentionTags, ...hashtagTags]
  };

  await db.notes.insert(note);
  return note;
}
```

## Processing Incoming Tags

```javascript
async function processIncomingNote(note) {
  const tags = note.tag || [];

  // Index hashtags for search
  for (const tag of tags.filter(t => t.type === 'Hashtag')) {
    const normalized = normalizeHashtag(tag.name.replace('#', ''));
    await db.hashtagIndex.upsert(
      { tag: normalized },
      { $addToSet: { notes: note.id } }
    );
  }

  // Process mentions for notifications
  for (const tag of tags.filter(t => t.type === 'Mention')) {
    const localUser = await db.actors.findOne({ id: tag.href });
    if (localUser) {
      await createNotification(localUser.id, 'mention', {
        from: note.attributedTo,
        note: note.id
      });
    }
  }
}
```

## Common Issues

### HTML/Tag Mismatch

Mastodon requires the HTML content to match the tags:

```javascript
function validateTagsMatchContent(note) {
  const content = note.content;

  for (const tag of note.tag || []) {
    if (tag.type === 'Mention') {
      // Check mention link exists in content
      if (!content.includes(tag.href)) {
        console.warn('Mention href not found in content:', tag.href);
      }
    }
    if (tag.type === 'Hashtag') {
      const tagName = tag.name.toLowerCase();
      if (!content.toLowerCase().includes(tagName)) {
        console.warn('Hashtag not found in content:', tag.name);
      }
    }
  }
}
```

### Mention Without Addressing

Mentioned users won't receive the post unless addressed:

```javascript
function ensureMentionsAddressed(note) {
  const mentionedActors = (note.tag || [])
    .filter(t => t.type === 'Mention')
    .map(t => t.href);

  const addressed = new Set([
    ...(note.to || []),
    ...(note.cc || [])
  ]);

  for (const actor of mentionedActors) {
    if (!addressed.has(actor)) {
      note.cc = note.cc || [];
      note.cc.push(actor);
    }
  }
}
```

## Next Steps

- **[Media Attachments](/docs/guides/media-attachments)** - Adding images and video
- **[Polls](/docs/guides/polls)** - Creating polls
- **[Custom Emoji](/docs/guides/custom-emoji)** - Custom emoji support
