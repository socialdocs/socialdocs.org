---
sidebar_position: 8
title: Mentions and Hashtags
description: Implementing @mentions and #hashtags using ActivityPub tags
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (activitypub/activity/create.rb, note_serializer.rb, text_formatter.rb, hashtag_normalizer.rb, fetch_link_card_service.rb, collections_controller.rb), AS2 Vocabulary, Mastodon AP docs"
---

# Mentions and Hashtags

Mentions and hashtags are implemented using the `tag` property. Both use the same mechanism with different types: `Mention` for user references and `Hashtag` for topic tags.

:::note Extension types
`Mention` is defined in the [Activity Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-mention). `Hashtag` is **not** — it is an extension (`as:Hashtag`) that Mastodon and most fediverse software declare in their `@context` ([Mastodon AP docs](https://docs.joinmastodon.org/spec/activitypub/#Hashtag)).
:::

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
| `href` | The actor's ActivityPub `id` — this is what receivers resolve |
| `name` | Display text. Usually `@username@domain`; Mastodon sends `@acct`, which omits the domain for its own local users ([`note_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/note_serializer.rb)). Don't rely on it |

### Parsing Mentions from Text

```javascript
function parseMentions(text) {
  // @username@domain — usernames may contain . and - between word
  // characters, as in Mastodon's Account::MENTION_RE
  const mentionRegex = /(?<![=\/\w])@([a-z0-9_]+(?:[.-]+[a-z0-9_]+)*)@([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi;
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
  // The domain comes from user-typed text: fetch it with an SSRF-safe
  // client (no private/loopback addresses, timeouts, size cap), e.g.
  // safeFetchJson from /docs/security/verifying-requests
  const resource = encodeURIComponent(`acct:${username}@${domain}`);
  const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=${resource}`;

  const jrd = await safeFetchJson(webfingerUrl, {
    headers: { 'Accept': 'application/jrd+json' }
  });

  // Find the ActivityPub link
  const apLink = (jrd.links || []).find(link =>
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

Use the same markup Mastodon produces (`h-card` / `u-url mention`, see [`text_formatter.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/text_formatter.rb)). Mastodon skips links with `rel="tag"`, `class="u-url"` or `h-card`, and links matching a mentioned account's profile URL, when choosing a link to preview ([`fetch_link_card_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/fetch_link_card_service.rb)) — other markup can turn your mention into a link-preview card.

The `href` came back from a remote WebFinger response, so escape it and accept only `https:` URLs:

```javascript
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function mentionsToHtml(html, mentions) {
  // `html` is already-escaped text; `mention.name` is what the user typed
  for (const mention of mentions) {
    const url = new URL(mention.href);
    if (url.protocol !== 'https:') continue;
    const username = mention.name.split('@')[1];
    const link = `<span class="h-card"><a href="${escapeHtml(url.href)}" class="u-url mention">@<span>${escapeHtml(username)}</span></a></span>`;
    html = html.replace(escapeHtml(mention.name), link);
  }
  return html;
}
```

### Mention Notifications

Mastodon notifies a local user only when they are **both** tagged with a `Mention` **and** in the post's `to`/`cc`. Users who are addressed but not tagged become *silent* mentions (they can see the post, no notification), and users who are tagged but not addressed are explicitly not notified ([`create.rb` `process_audience`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)). Doing the same on your server avoids notification spam from tags alone:

```javascript
async function notifyMentions(note) {
  const audience = new Set([].concat(note.to || [], note.cc || []));
  const mentions = [].concat(note.tag || []).filter(t => t.type === 'Mention');

  for (const mention of mentions) {
    if (!audience.has(mention.href)) continue; // tagged but not addressed
    const localUser = await db.actors.findOne({ id: mention.href, local: true });
    if (localUser) {
      await createNotification(localUser.id, 'mention', {
        actor: note.attributedTo,
        note: note.id
      });
    }
  }
}
```

### Addressing Mentioned Users

Mentioned users must be in `to` or `cc` to be delivered the post and, on Mastodon, to be notified:

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
    to.push(...mentionedActors); // DM: mentions go in to, with Mention tags
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
  // #hashtag preceded by start or whitespace; letters/digits in any script
  const hashtagRegex = /(?<=^|\s)[#＃]([\p{L}\p{N}_\u00B7\u30FB\u200C]*\p{L}[\p{L}\p{N}_\u00B7\u30FB\u200C]*)/gu;
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

Mastodon does **not** reduce hashtags to ASCII — `#日本語` is a valid tag. Its [`HashtagNormalizer`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/hashtag_normalizer.rb) applies, in order: Unicode NFKC (folds full-width characters), lowercase, ASCII-folding of accented Latin letters (`café` → `cafe`), then removes anything that isn't a letter, digit or one of the separators `_ · ・` and ZWNJ ([`tag.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/tag.rb)). A close approximation in JavaScript:

```javascript
function normalizeHashtag(tag) {
  return tag
    .normalize('NFKC')
    .toLowerCase()
    // approximate ASCII folding: strip combining accents from Latin letters only
    .replace(/[a-z\u00C0-\u024F]\p{M}*/gu, (c) => c.normalize('NFD').replace(/\p{M}/gu, ''))
    .replace(/[^\p{L}\p{N}_\u00B7\u30FB\u200C]/gu, '');
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
      href: `https://${config.domain}/tags/${encodeURIComponent(normalized)}`,
      name: `#${hashtag.tag}` // Keep original case in name
    });
  }

  return tags;
}
```

### Converting Hashtags to HTML

```javascript
function hashtagsToHtml(html, domain) {
  // Same markup as Mastodon: rel="tag" keeps it out of link previews
  return html.replace(/(?<=^|\s)[#＃]([\p{L}\p{N}_\u00B7\u30FB\u200C]*\p{L}[\p{L}\p{N}_\u00B7\u30FB\u200C]*)/gu, (match, tag) => {
    const url = `https://${domain}/tags/${encodeURIComponent(normalizeHashtag(tag))}`;
    return `<a href="${url}" class="mention hashtag" rel="tag">#<span>${tag}</span></a>`;
  });
}
```

### Hashtag Timeline

```javascript
app.get('/tags/:tag', async (req, res) => {
  const tag = normalizeHashtag(req.params.tag);

  // Store the normalized name when indexing (see processIncomingNote below)
  // and match it exactly — never build a regex from request input
  const posts = await db.notes.find({
    hashtags: tag,
    // Only public posts
    'to': 'https://www.w3.org/ns/activitystreams#Public'
  }).sort({ published: -1 }).limit(20);

  // Browsers send */*, so pick explicitly between HTML and AP JSON
  res.vary('Accept');
  if (req.accepts(['html', 'application/activity+json', 'application/ld+json']) !== 'html') {
    res.type('application/activity+json').json({
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

For comparison, Mastodon's `/tags/:tag` JSON is a bare `OrderedCollection` with only an `id` and no items ([`tags_controller.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/tags_controller.rb)), so don't expect to read remote hashtag timelines this way.

## Featured Hashtags

Mastodon exposes the hashtags a user features on their profile as `featuredTags` (`toot:featuredTags`, see the [Mastodon AP docs](https://docs.joinmastodon.org/spec/activitypub/#featuredTags)):

```json
{
  "type": "Person",
  "id": "https://example.com/users/alice",
  "featuredTags": "https://example.com/users/alice/collections/tags"
}
```

### Featured Tags Collection

Mastodon serves it as an unordered `Collection` ([`collections_controller.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/collections_controller.rb)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Collection",
  "id": "https://example.com/users/alice/collections/tags",
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

  // Index normalized hashtag names for search and tag timelines
  const hashtags = [].concat(tags)
    .filter(t => t?.type === 'Hashtag' && typeof t.name === 'string')
    .map(t => normalizeHashtag(t.name.replace(/^[#＃]/, '')))
    .filter(Boolean);
  await db.notes.update({ id: note.id }, { $set: { hashtags } });

  // Notify local users who are both tagged and addressed
  await notifyMentions(note);
}
```

## Common Issues

### HTML/Tag Mismatch

Mastodon does not reject a post whose `content` and `tag` disagree, but readers only see `content`: a `Mention` with no matching link is invisible, and a mention or hashtag link without the markup above may be picked as the post's link-preview card. A quick self-check:

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
