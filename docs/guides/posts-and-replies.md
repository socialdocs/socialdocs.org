---
sidebar_position: 5
title: Posts and Replies
description: Creating, updating, and deleting content with ActivityPub Create, Update, and Delete activities
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
async function createPost(author, content, options = {}) {
  const noteId = `https://${config.domain}/notes/${uuid()}`;
  const activityId = `https://${config.domain}/activities/${uuid()}`;
  const published = new Date().toISOString();

  // Build addressing
  const to = [];
  const cc = [];

  if (options.visibility === 'public') {
    to.push('https://www.w3.org/ns/activitystreams#Public');
    cc.push(`${author.id}/followers`);
  } else if (options.visibility === 'unlisted') {
    to.push(`${author.id}/followers`);
    cc.push('https://www.w3.org/ns/activitystreams#Public');
  } else if (options.visibility === 'followers') {
    to.push(`${author.id}/followers`);
  } else if (options.visibility === 'direct') {
    // Add mentioned users to 'to'
    to.push(...options.mentions || []);
  }

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
    ...(options.tag && { tag: options.tag })
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

**Allowed HTML tags** (varies by implementation):
- `<p>`, `<br>`, `<span>`
- `<a>` (with `href`, `rel`)
- `<strong>`, `<em>`, `<code>`, `<pre>`
- `<ul>`, `<ol>`, `<li>`
- `<blockquote>`

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

Use `inReplyTo` to indicate a reply:

```json
{
  "type": "Note",
  "id": "https://example.com/notes/456",
  "inReplyTo": "https://other.example/notes/123",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>Great point!</p>",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://example.com/users/alice/followers",
    "https://other.example/users/bob"
  ]
}
```

### Implementation

```javascript
async function createReply(author, content, inReplyTo, options = {}) {
  // Fetch the parent post to get addressing info
  const parent = await fetchObject(inReplyTo);

  // Include the parent author in cc
  const cc = [...(options.cc || [])];
  if (parent.attributedTo && !cc.includes(parent.attributedTo)) {
    cc.push(parent.attributedTo);
  }

  return createPost(author, content, {
    ...options,
    inReplyTo,
    cc
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
  const note = activity.object;

  // If it's a reply, try to fetch the parent
  if (note.inReplyTo) {
    const parent = await db.notes.findOne({ id: note.inReplyTo });

    if (!parent) {
      // Fetch from remote
      try {
        const remoteParent = await fetchObject(note.inReplyTo);
        await db.notes.insert(remoteParent);
      } catch (error) {
        // Parent might be deleted or inaccessible
        console.log('Could not fetch parent:', note.inReplyTo);
      }
    }
  }

  await db.notes.insert(note);
}
```

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

Only visible to mentioned users:

```json
{
  "to": ["https://other.example/users/bob"],
  "cc": []
}
```

## Updating Posts

Use the **Update** activity to edit posts:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/update-123",
  "type": "Update",
  "actor": "https://example.com/users/alice",
  "object": {
    "id": "https://example.com/notes/123",
    "type": "Note",
    "content": "<p>Updated content here</p>",
    "updated": "2024-01-15T11:00:00Z"
  }
}
```

### Implementation

```javascript
async function updatePost(author, noteId, newContent) {
  // Verify ownership
  const note = await db.notes.findOne({ id: noteId });
  if (note.attributedTo !== author.id) {
    throw new Error('Not authorized to edit this post');
  }

  const updated = new Date().toISOString();

  // Update locally
  await db.notes.update(
    { id: noteId },
    {
      $set: {
        content: sanitizeHtml(newContent),
        updated
      }
    }
  );

  // Create Update activity
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Update',
    actor: author.id,
    object: {
      id: noteId,
      type: 'Note',
      content: sanitizeHtml(newContent),
      updated
    },
    to: note.to,
    cc: note.cc
  };

  await deliverToRecipients(activity, author);
}
```

### Receiving Updates

```javascript
async function processUpdate(activity, signer) {
  const object = activity.object;

  // Verify the actor owns the object
  const existing = await db.notes.findOne({ id: object.id });
  if (!existing) return;

  if (existing.attributedTo !== signer.id) {
    throw new Error('Cannot update: not the author');
  }

  // Apply the update
  await db.notes.update(
    { id: object.id },
    {
      $set: {
        content: object.content,
        updated: object.updated || new Date().toISOString()
      }
    }
  );
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
    id: `https://${config.domain}/activities/${uuid()}`,
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

When a post is deleted, return a Tombstone:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/notes/123",
  "type": "Tombstone",
  "formerType": "Note",
  "deleted": "2024-01-15T12:00:00Z"
}
```

Or return HTTP 410 Gone:

```javascript
app.get('/notes/:id', async (req, res) => {
  const note = await db.notes.findOne({ id: noteId });

  if (!note) {
    return res.status(404).send();
  }

  if (note.type === 'Tombstone') {
    return res.status(410).json(note);
  }

  res.json(note);
});
```

## Best Practices

### 1. Always Include Required Fields

```javascript
const requiredFields = {
  id: noteId,
  type: 'Note',
  attributedTo: author.id,
  content: sanitizedContent,
  published: new Date().toISOString(),
  to: [], // Must have addressing
};
```

### 2. Sanitize HTML Content

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'a', 'span', 'strong', 'em', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'class', 'rel']
  });
}
```

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

  // Don't deliver to Public - it's not a real inbox
  recipients.delete('https://www.w3.org/ns/activitystreams#Public');

  // Expand follower collections
  // ... delivery logic
}
```

## Next Steps

- **[Likes and Shares](/docs/guides/likes-and-shares)** - Engagement activities
- **[Mentions and Hashtags](/docs/guides/mentions-and-hashtags)** - Tagging content
- **[Media Attachments](/docs/guides/media-attachments)** - Adding images and video
- **[Create](https://github.com/boyter/activitypub/blob/main/create-post.md) / [Delete](https://github.com/boyter/activitypub/blob/main/delete-post.md) sequence diagrams** - External reference for the delivery exchanges
