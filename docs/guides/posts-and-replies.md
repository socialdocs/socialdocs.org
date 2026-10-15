---
sidebar_position: 5
title: Posts and Replies
description: Creating, updating, and deleting content with ActivityPub Create, Update, and Delete activities
last_verified: 2026-10-15
verified_against: "ActivityPub REC §7.2–7.4; Mastodon v4.7.3 source (status_parser.rb, create.rb, update.rb, process_status_update_service.rb, lib/sanitize_ext/sanitize_config.rb) and docs.joinmastodon.org/spec/activitypub"
---

# Posts and Replies

Content creation is the core of any social platform. In ActivityPub, posts are represented as Objects (typically Notes) and actions on them are wrapped in Activities. This guide covers creating posts, handling replies, threading, and content management.

## Creating a Post

Posts are created using the **Create** activity with a **Note** object.

### Basic Note Structure

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/notes/123",
  "type": "Note",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>Hello, Fediverse!</p>",
  "published": "2024-01-15T10:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Create Activity

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/create-123",
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "published": "2024-01-15T10:30:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"],
  "object": {
    "id": "https://example.com/notes/123",
    "type": "Note",
    "attributedTo": "https://example.com/users/alice",
    "content": "<p>Hello, Fediverse!</p>",
    "published": "2024-01-15T10:30:00Z",
    "to": ["https://www.w3.org/ns/activitystreams#Public"],
    "cc": ["https://example.com/users/alice/followers"]
  }
}
```

### Implementation

```javascript
import crypto from 'node:crypto';
const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

async function createPost(author, content, options = {}) {
  const noteId = `https://${config.domain}/notes/${crypto.randomUUID()}`;
  const activityId = `https://${config.domain}/activities/${crypto.randomUUID()}`;
  const published = new Date().toISOString();

  // Build addressing
  const to = [];
  const cc = [];

  // options.mentions: [{ href: actorUrl, name: '@bob@remote.example' }]
  const mentions = options.mentions || [];

  if (options.visibility === 'public') {
    to.push(PUBLIC);
    cc.push(`${author.id}/followers`, ...mentions.map((m) => m.href));
  } else if (options.visibility === 'unlisted') {
    to.push(`${author.id}/followers`);
    cc.push(PUBLIC, ...mentions.map((m) => m.href));
  } else if (options.visibility === 'followers') {
    to.push(`${author.id}/followers`);
    cc.push(...mentions.map((m) => m.href));
  } else if (options.visibility === 'direct') {
    // Only the mentioned users
    to.push(...mentions.map((m) => m.href));
  }

  // Everyone addressed by name is also tagged: Mastodon only notifies
  // mentioned accounts, and treats an addressed-but-untagged account in a
  // direct post as "limited" visibility.
  const tag = [
    ...mentions.map((m) => ({ type: 'Mention', href: m.href, name: m.name })),
    ...(options.tag || [])
  ];

  // Create the Note
  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: noteId,
    type: 'Note',
    attributedTo: author.id,
    content: sanitizeHtml(content),
    published,
    to,
    cc,
    ...(options.inReplyTo && { inReplyTo: options.inReplyTo }),
    ...(options.sensitive && { sensitive: true }),
    ...(options.summary && { summary: options.summary }),
    ...(options.attachment && { attachment: options.attachment }),
    ...(tag.length && { tag })
  };

  // Create the activity
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: activityId,
    type: 'Create',
    actor: author.id,
    published,
    to,
    cc,
    object: note
  };

  // Store locally
  await db.notes.insert(note);
  await db.activities.insert(activity);

  // Deliver to recipients
  await deliverToRecipients(activity, author);

  return { note, activity };
}
```

## Content Format

### HTML Content

The `content` field contains HTML, which receiving servers sanitize:

```json
{
  "content": "<p>Check out this <a href=\"https://example.com\">link</a>!</p>"
}
```

**What Mastodon keeps** (v4.2 and later; other servers differ, so send simple HTML):

- `<p>`, `<br>`, `<span>`, `<a>` (`href`, `rel`, `class`)
- `<del>`, `<s>`, `<pre>`, `<code>`, `<em>`, `<strong>`, `<b>`, `<i>`, `<u>`, `<blockquote>`
- `<ul>`, `<ol>` (`start`, `reversed`), `<li>` (`value`)
- headings become `<strong>` inside `<p>`; every other element is converted or removed
- classes survive only if they are microformats (`h-*`, `p-*`, `u-*`, `dt-*`, `e-*`) or `mention`, `hashtag`, `ellipsis`, `invisible`
- links keep only `http`, `https` and a few other schemes (`dat`, `dweb`, `ipfs`, `ipns`, `ssb`, `gopher`, `xmpp`, `magnet`, `gemini`)

Source: [`sanitize_config.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/lib/sanitize_ext/sanitize_config.rb) and [Mastodon's HTML sanitization docs](https://docs.joinmastodon.org/spec/activitypub/#sanitization).

### Plain Text Alternative

Some implementations include `contentMap` for language variants or `source` for the original format:

```json
{
  "content": "<p>Hello world</p>",
  "source": {
    "content": "Hello world",
    "mediaType": "text/plain"
  }
}
```

### Content Warnings

Use `summary` for content warnings and `sensitive` for sensitive content:

```json
{
  "type": "Note",
  "summary": "Spoiler: Movie ending",
  "content": "<p>The butler did it!</p>",
  "sensitive": true
}
```

## Replies and Threading

### Creating a Reply

Use `inReplyTo` to indicate a reply, and address **and mention** the author you are replying to. Mastodon has no separate "reply" notification: the parent's author is notified only when tagged with a `Mention` ([`create.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)).

```json
{
  "type": "Note",
  "id": "https://example.com/notes/456",
  "inReplyTo": "https://other.example/notes/123",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p><span class=\"h-card\"><a href=\"https://other.example/users/bob\" class=\"u-url mention\">@<span>bob</span></a></span> Great point!</p>",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://example.com/users/alice/followers",
    "https://other.example/users/bob"
  ],
  "tag": [
    { "type": "Mention", "href": "https://other.example/users/bob", "name": "@bob@other.example" }
  ]
}
```

### Implementation

```javascript
async function createReply(author, content, inReplyTo, options = {}) {
  // Fetch the parent (SSRF-safe) and its author, to mention them
  const { json: parent } = await safeFetchJson(inReplyTo);
  const parentAuthorId = typeof parent.attributedTo === 'string' ? parent.attributedTo : parent.attributedTo?.id;
  const { json: parentAuthor } = await safeFetchJson(parentAuthorId);
  const handle = `@${parentAuthor.preferredUsername}@${new URL(parentAuthor.id).host}`;

  return createPost(author, content, {
    ...options,
    inReplyTo: parent.id,
    mentions: [...(options.mentions || []), { href: parentAuthor.id, name: handle }]
  });
}
```

### Building Thread Trees

When displaying replies, fetch and organize into a tree:

```javascript
async function buildThreadTree(rootNoteId) {
  const root = await db.notes.findOne({ id: rootNoteId });
  if (!root) return null;

  const replies = await db.notes.find({ inReplyTo: rootNoteId });

  return {
    ...root,
    replies: await Promise.all(
      replies.map(reply => buildThreadTree(reply.id))
    )
  };
}
```

### Fetching Remote Threads

When you receive a reply to an unknown post:

```javascript
async function processCreate(activity) {
  const note = activity.object; // already authorized (see Handling Incoming Activities)
  const parentId = typeof note.inReplyTo === 'string' ? note.inReplyTo : note.inReplyTo?.id;

  // If it's a reply, try to fetch the parent
  if (parentId && !(await db.notes.findOne({ id: parentId }))) {
    try {
      const { url, json: remoteParent } = await safeFetchJson(parentId);
      // Only store what the parent's own server says about it
      if (remoteParent.id === parentId && new URL(url).origin === new URL(parentId).origin) {
        await db.notes.insert(remoteParent);
      }
    } catch {
      // Parent deleted, private or unreachable: keep the reply anyway
    }
  }

  await db.notes.insert(note);
}
```

Fetch one parent per reply, in a background job, and bound how far up a thread you walk. For whole threads (`context`, `replies` collections, backfill), see [Threads, Replies and Backfill](/docs/guides/threads-replies-and-backfill).

## Visibility Levels

### Public

Visible to everyone, appears in public timelines:

```json
{
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Unlisted

Visible to everyone but doesn't appear in public timelines:

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

### Followers-Only

Only visible to followers:

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": []
}
```

### Direct (Mentioned Only)

Only visible to mentioned users. Each addressed user must also be in `tag` as a `Mention`, or Mastodon shows the post with "limited" visibility instead of as a direct message ([`create.rb` `process_audience`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)):

```json
{
  "to": ["https://other.example/users/bob"],
  "cc": [],
  "tag": [{ "type": "Mention", "href": "https://other.example/users/bob", "name": "@bob@other.example" }]
}
```

Mastodon decides visibility in this order: public address in `to` → public; public address in `cc` → unlisted; the author's `followers` collection in `to` → followers-only; anything else → direct ([`status_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/status_parser.rb)).

## Updating Posts

Use the **Update** activity to edit posts. Between servers an Update **replaces** the object ([AP §7.3](https://www.w3.org/TR/activitypub/#update-activity-inbox)), so send the complete object, not just the changed fields. Set `updated` to the time of the edit: Mastodon only applies a text edit when `updated` is present and newer than the last edit it saw ([`process_status_update_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_status_update_service.rb)).

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/update-123",
  "type": "Update",
  "actor": "https://example.com/users/alice",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"],
  "object": {
    "id": "https://example.com/notes/123",
    "type": "Note",
    "attributedTo": "https://example.com/users/alice",
    "content": "<p>Updated content here</p>",
    "published": "2024-01-15T10:30:00Z",
    "updated": "2024-01-15T11:00:00Z",
    "to": ["https://www.w3.org/ns/activitystreams#Public"],
    "cc": ["https://example.com/users/alice/followers"]
  }
}
```

### Implementation

```javascript
async function updatePost(author, noteId, newContent) {
  // Verify ownership
  const note = await db.notes.findOne({ id: noteId });
  if (!note || note.attributedTo !== author.id) {
    throw new Error('Not authorized to edit this post');
  }

  // The complete new version of the object
  const edited = {
    ...note,
    content: sanitizeHtml(newContent),
    updated: new Date().toISOString()
  };
  await db.notes.replace({ id: noteId }, edited);

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${crypto.randomUUID()}`,
    type: 'Update',
    actor: author.id,
    object: edited,
    to: note.to,
    cc: note.cc
  };

  await deliverToRecipients(activity, author);
}
```

### Receiving Updates

```javascript
async function processUpdate(activity, signer) {
  // authorizeActivity() already required the object to be on the signer's
  // origin and owned by the signer. Without an embedded object, fetch it.
  const object = typeof activity.object === 'object'
    ? activity.object
    : (await safeFetchJson(activity.object)).json;

  const existing = await db.notes.findOne({ id: object.id });
  if (!existing) return;

  if (existing.attributedTo !== signer.id) {
    throw new Error('Cannot update: not the author');
  }

  // Ignore stale updates, then replace the whole object
  if (existing.updated && object.updated && object.updated <= existing.updated) return;
  await db.notes.replace({ id: object.id }, { ...object, content: sanitizeHtml(object.content || '') });
}
```

## Deleting Posts

Use the **Delete** activity:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/delete-123",
  "type": "Delete",
  "actor": "https://example.com/users/alice",
  "object": "https://example.com/notes/123"
}
```

### Implementation

```javascript
async function deletePost(author, noteId) {
  const note = await db.notes.findOne({ id: noteId });

  if (!note) {
    throw new Error('Post not found');
  }

  if (note.attributedTo !== author.id) {
    throw new Error('Not authorized to delete this post');
  }

  // Create tombstone
  await db.notes.update(
    { id: noteId },
    {
      $set: {
        type: 'Tombstone',
        formerType: 'Note',
        deleted: new Date().toISOString(),
        content: null
      }
    }
  );

  // Send Delete activity
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${crypto.randomUUID()}`,
    type: 'Delete',
    actor: author.id,
    object: noteId,
    to: note.to,
    cc: note.cc
  };

  await deliverToRecipients(activity, author);
}
```

### Receiving Deletes

```javascript
async function processDelete(activity, signer) {
  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  const existing = await db.notes.findOne({ id: objectId });
  if (!existing) return;

  // Verify ownership
  if (existing.attributedTo !== signer.id) {
    throw new Error('Cannot delete: not the author');
  }

  // Convert to tombstone
  await db.notes.update(
    { id: objectId },
    {
      $set: {
        type: 'Tombstone',
        formerType: existing.type,
        deleted: new Date().toISOString()
      },
      $unset: {
        content: 1,
        attachment: 1
      }
    }
  );
}
```

## Tombstones

See [Deletion](/docs/guides/deletion) for the full picture: account deletion, Delete-before-Create and who may answer for a deleted object. When a post is deleted, return a Tombstone:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/notes/123",
  "type": "Tombstone",
  "formerType": "Note",
  "deleted": "2024-01-15T12:00:00Z"
}
```

with HTTP `410 Gone` (a plain `404` also works; Mastodon itself answers `404` for deleted posts):

```javascript
app.get('/notes/:id', async (req, res) => {
  const note = await db.notes.findOne({ id: `https://${config.domain}/notes/${req.params.id}` });

  if (!note) {
    return res.status(404).end();
  }

  res.type('application/activity+json');
  if (note.type === 'Tombstone') {
    return res.status(410).send(JSON.stringify({ '@context': 'https://www.w3.org/ns/activitystreams', ...note }));
  }

  res.send(JSON.stringify({ '@context': 'https://www.w3.org/ns/activitystreams', ...note }));
});
```

## Best Practices

### 1. Always Include Required Fields

```javascript
const requiredFields = {
  id: noteId,                        // https URL on your domain
  type: 'Note',
  attributedTo: author.id,           // must equal the Create's actor
  content: sanitizedContent,
  published: new Date().toISOString(),
  to: [PUBLIC],                      // non-empty: addressing decides who sees it
  cc: [`${author.id}/followers`]
};
```

### 2. Sanitize HTML Content

Remote HTML is untrusted. Sanitize it on the server before storing or rendering it:

```javascript
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DOMPurify = createDOMPurify(new JSDOM('').window);

function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    // Mastodon's element list (sanitize_config.rb), minus ruby annotations
    ALLOWED_TAGS: ['p', 'br', 'span', 'a', 'del', 's', 'pre', 'blockquote', 'code',
                   'b', 'strong', 'u', 'i', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'rel', 'start', 'reversed', 'value', 'lang'],
    ALLOWED_URI_REGEXP: /^https?:/i // http(s) links only
  });
}
```

This drops `class` entirely. To keep Mastodon's mention and hashtag classes, filter class values with an allowlist as shown in [Content Security](/docs/reference/content-security), rather than allowing `class` on every element.

### 3. Handle Missing Content Gracefully

```javascript
function getDisplayContent(note) {
  return note.content || note.name || note.summary || '[No content]';
}
```

### 4. Respect Addressing

Only deliver to explicitly addressed recipients:

```javascript
async function deliverToRecipients(activity, author) {
  const recipients = new Set([
    ...(activity.to || []),
    ...(activity.cc || [])
  ]);

  // Public is not an inbox: servers MUST NOT deliver to it.
  // Mastodon accepts three spellings of it.
  for (const p of [PUBLIC, 'as:Public', 'Public']) recipients.delete(p);
  recipients.delete(author.id); // never deliver to yourself (AP §7.1)

  // Expand follower collections
  // ... delivery logic
}
```

## Next Steps

- **[Likes and Shares](/docs/guides/likes-and-shares)** - Engagement activities
- **[Threads, Replies and Backfill](/docs/guides/threads-replies-and-backfill)** - `context`, `replies` and recovering missing replies
- **[Mentions and Hashtags](/docs/guides/mentions-and-hashtags)** - Tagging content
- **[Media Attachments](/docs/guides/media-attachments)** - Adding images and video
- **[Create](https://github.com/boyter/activitypub/blob/main/create-post.md) / [Delete](https://github.com/boyter/activitypub/blob/main/delete-post.md) sequence diagrams** - External reference for the delivery exchanges
