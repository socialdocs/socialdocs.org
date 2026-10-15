---
sidebar_position: 7
title: Direct Messages
description: Implementing private messaging in ActivityPub using addressing
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (activitypub/tag_manager.rb, parser/status_parser.rb, activity/create.rb, status_reach_finder.rb, account.rb), ActivityPub REC §6, Pleroma AP extensions docs"
---

# Direct Messages

Direct messages in ActivityPub aren't a separate message type—they're regular Notes with restricted addressing. A "direct message" is simply a post addressed only to specific users, without the public or followers collection. This guide covers implementing private messaging.

## How DMs Work

There are no "visibility levels" in the ActivityPub spec. Privacy is controlled entirely through addressing:

```
┌─────────────────────────────────────────────────────────┐
│                VISIBILITY BY ADDRESSING                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Public:      to: [as:Public], cc: [followers]          │
│  Unlisted:    to: [followers], cc: [as:Public]          │
│  Followers:   to: [followers], cc: [mentioned users]    │
│  Direct:      to: [mentioned users], cc: []             │
│                                                         │
│  No as:Public + no followers = Direct Message           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

These are the shapes Mastodon sends ([`tag_manager.rb` `to`/`cc`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/tag_manager.rb)); mentioned users are also added to `cc` on public, unlisted and followers-only posts. On receipt, Mastodon derives visibility the same way: `as:Public` in `to` → public, in `cc` → unlisted, the author's followers collection in `to` → followers-only, otherwise direct ([`status_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/status_parser.rb)).

## Sending a Direct Message

### DM Note Format

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/notes/dm-123",
  "type": "Note",
  "attributedTo": "https://example.com/users/alice",
  "to": ["https://other.example/users/bob"],
  "cc": [],
  "content": "<p>Hey Bob, this is a private message!</p>",
  "published": "2024-01-15T10:30:00Z",
  "tag": [
    {
      "type": "Mention",
      "href": "https://other.example/users/bob",
      "name": "@bob@other.example"
    }
  ]
}
```

### Create Activity for DM

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/create-dm-123",
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "to": ["https://other.example/users/bob"],
  "cc": [],
  "object": {
    "id": "https://example.com/notes/dm-123",
    "type": "Note",
    "attributedTo": "https://example.com/users/alice",
    "to": ["https://other.example/users/bob"],
    "content": "<p>Hey Bob, this is a private message!</p>"
  }
}
```

### Implementation

```javascript
async function sendDirectMessage(sender, recipientIds, content) {
  const noteId = `https://${config.domain}/notes/${uuid()}`;
  const activityId = `https://${config.domain}/activities/${uuid()}`;
  const published = new Date().toISOString();

  // Build mention tags
  const tags = await Promise.all(
    recipientIds.map(async (recipientId) => {
      const recipient = await fetchActor(recipientId);
      return {
        type: 'Mention',
        href: recipientId,
        name: `@${recipient.preferredUsername}@${new URL(recipientId).hostname}`
      };
    })
  );

  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: noteId,
    type: 'Note',
    attributedTo: sender.id,
    to: recipientIds,
    cc: [],
    content: sanitizeHtml(content),
    published,
    tag: tags
  };

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: activityId,
    type: 'Create',
    actor: sender.id,
    to: recipientIds,
    cc: [],
    object: note
  };

  // Store locally
  await db.notes.insert(note);

  // Deliver once per inbox (shared inbox if advertised, as Mastodon does)
  const inboxes = new Set();
  for (const recipientId of recipientIds) {
    const recipient = await fetchActor(recipientId);
    inboxes.add(recipient.endpoints?.sharedInbox || recipient.inbox);
  }
  for (const inbox of inboxes) {
    await deliverActivity(activity, inbox, sender);
  }

  return { note, activity };
}
```

## Identifying Direct Messages

### Check Addressing

Compare against the author's real `followers` URL (from their actor document) — followers collections can live at any URL, so don't guess from a `/followers` suffix. Treat all three spellings of the Public collection as public:

```javascript
const PUBLIC = new Set([
  'https://www.w3.org/ns/activitystreams#Public',
  'as:Public',
  'Public',
]);

// Mirrors Mastodon's visibility rules (status_parser.rb)
function visibilityOf(note, author) {
  const to = [].concat(note.to || []);
  const cc = [].concat(note.cc || []);
  if (to.some(a => PUBLIC.has(a))) return 'public';
  if (cc.some(a => PUBLIC.has(a))) return 'unlisted';
  if (author.followers && to.includes(author.followers)) return 'private';
  return 'direct';
}
```

### Mastodon's Extra Rule: Mentions

A post that comes out as `direct` stays a DM on Mastodon only if every **local** account it is addressed to is also tagged with a `Mention`. An addressed account without a `Mention` becomes a *silent mention*, and the post is downgraded to **limited** visibility — still private, but not shown as a direct message, and no notification ([`create.rb` `process_audience`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)). So always send a `Mention` tag for each DM recipient.

## Group Direct Messages

DMs can include multiple recipients:

```json
{
  "type": "Note",
  "attributedTo": "https://example.com/users/alice",
  "to": [
    "https://server-b.example/users/bob",
    "https://server-c.example/users/carol"
  ],
  "content": "<p>Hey both of you!</p>",
  "tag": [
    {
      "type": "Mention",
      "href": "https://server-b.example/users/bob",
      "name": "@bob@server-b.example"
    },
    {
      "type": "Mention",
      "href": "https://server-c.example/users/carol",
      "name": "@carol@server-c.example"
    }
  ]
}
```

### Handling Group DMs

```javascript
async function getConversation(userId, participants) {
  // Sort participant IDs for consistent lookup
  const sortedParticipants = [...participants, userId].sort();
  const conversationKey = sortedParticipants.join(',');

  // Find all DMs between these participants
  const messages = await db.notes.find({
    $and: [
      { 'to': { $all: participants } },
      { $or: [
        { attributedTo: userId },
        { 'to': userId }
      ]}
    ]
  }).sort({ published: 1 });

  return messages;
}
```

## Delivery Considerations

### Personal or Shared Inbox

Either works. Mastodon delivers every post, DMs included, to the recipient server's shared inbox when one is advertised ([`account.rb` `preferred_inbox_url`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/account.rb)); the receiving server then decides who may see it from `to`/`cc`. That means a receiving server **must** enforce addressing on shared-inbox deliveries — never show a delivered object to local users who aren't addressed. Delivering to a personal inbox additionally tells the receiver which account it is for: Mastodon gives that account access to the post even if it isn't addressed (it is added as a silent mention, see `postprocess_audience_and_deliver` in `create.rb`).

### Strip bto/bcc Before Delivery

The spec requires removing `bto` and `bcc` before delivery ([AP §6](https://www.w3.org/TR/activitypub/#client-to-server-interactions), [§7.1](https://www.w3.org/TR/activitypub/#delivery)):

```javascript
function prepareForDelivery(activity) {
  const prepared = { ...activity };
  delete prepared.bto;
  delete prepared.bcc;

  if (prepared.object && typeof prepared.object === 'object') {
    delete prepared.object.bto;
    delete prepared.object.bcc;
  }

  return prepared;
}
```

## Conversations View

### Grouping Messages

Store the visibility computed by `visibilityOf()` when you ingest a note, then query on it:

```javascript
async function getConversations(userId) {
  // Get all DMs involving this user
  const dms = await db.notes.find({
    visibility: 'direct',
    $or: [{ attributedTo: userId }, { to: userId }, { cc: userId }]
  }).sort({ published: -1 });

  // Group by participants
  const conversations = new Map();

  for (const dm of dms) {
    const participants = getParticipants(dm, userId);
    const key = participants.sort().join(',');

    if (!conversations.has(key)) {
      conversations.set(key, {
        participants,
        lastMessage: dm,
        messages: []
      });
    }
    conversations.get(key).messages.push(dm);
  }

  return Array.from(conversations.values());
}

function getParticipants(note, excludeUserId) {
  const all = new Set([
    note.attributedTo,
    ...(note.to || [])
  ]);
  all.delete(excludeUserId);
  return Array.from(all);
}
```

## Security Considerations

### No End-to-End Encryption

:::warning
ActivityPub DMs are **not end-to-end encrypted**. Server administrators can read them, similar to email. They're private from other users, not from server operators.
:::

### Content Stored on Multiple Servers

DMs are stored on:
1. The sender's server
2. Each recipient's server

Once sent, the sender cannot guarantee deletion on remote servers.

### Authentication

Always verify the sender:

```javascript
async function processDirectMessage(activity, signer) {
  // Verify the activity's actor matches the signer
  if (activity.actor !== signer.id) {
    throw new Error('Actor does not match signer');
  }

  // Verify the object's attributedTo matches
  if (activity.object.attributedTo !== activity.actor) {
    throw new Error('Attribution mismatch');
  }

  // Process the DM...
}
```

## Pleroma ChatMessage Extension

Pleroma has a separate 1-on-1 chat type, `ChatMessage` (`http://litepub.social/ns#ChatMessage`). It is wrapped in a `Create`, is always private, and **must have exactly one actor in `to`** — multi-user chats go through a `Group` that `Announce`s messages ([Pleroma AP extensions](https://docs.pleroma.social/backend/development/ap_extensions/#chatmessages)):

```json
{
  "type": "Create",
  "id": "https://pleroma.example/objects/1",
  "actor": "https://pleroma.example/users/alice",
  "to": ["https://other.example/users/bob"],
  "object": {
    "type": "ChatMessage",
    "id": "https://pleroma.example/objects/2",
    "attributedTo": "https://pleroma.example/users/alice",
    "to": ["https://other.example/users/bob"],
    "content": "Hey!",
    "published": "2026-10-15T10:00:00Z"
  }
}
```

Mastodon only accepts `Note` and `Question` (plus a few converted types such as `Article`) in `Create`, so it ignores `ChatMessage` entirely ([`activity.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb)). Send ordinary DMs to non-Pleroma software.

```javascript
function isChatMessage(activity) {
  return activity.type === 'Create' && activity.object?.type === 'ChatMessage';
}
```

## Common Issues

### Accidental Public DMs

Prevent users from accidentally making DMs public:

```javascript
function validateDirectMessage(note) {
  const publicAddress = 'https://www.w3.org/ns/activitystreams#Public';

  if (note.to?.includes(publicAddress) ||
      note.cc?.includes(publicAddress)) {
    throw new Error('Direct messages cannot include public addressing');
  }

  if ((note.to || []).length === 0) {
    throw new Error('Direct messages must have at least one recipient');
  }
}
```

### Missing Mentions

Ensure every recipient is tagged, otherwise Mastodon downgrades the post to "limited" and doesn't notify (see above):

```javascript
function ensureMentions(note) {
  const recipientIds = new Set([...(note.to || [])]);
  const mentionedIds = new Set(
    (note.tag || [])
      .filter(t => t.type === 'Mention')
      .map(t => t.href)
  );

  for (const recipientId of recipientIds) {
    if (!mentionedIds.has(recipientId)) {
      // Add missing mention
      note.tag = note.tag || [];
      note.tag.push({
        type: 'Mention',
        href: recipientId,
        name: `@${extractHandle(recipientId)}`
      });
    }
  }
}
```

### Reply Threading

When replying to a DM, maintain the conversation:

```javascript
async function replyToDirectMessage(sender, originalNote, content) {
  // Keep the same recipient list
  const recipients = [
    originalNote.attributedTo,
    ...(originalNote.to || [])
  ].filter(id => id !== sender.id);

  return sendDirectMessage(sender, recipients, content, {
    inReplyTo: originalNote.id
  });
}
```

## Next Steps

- **[Mentions and Hashtags](/docs/guides/mentions-and-hashtags)** - Tagging users
- **[Content Moderation](/docs/guides/content-moderation)** - Handling abuse
- **[Authentication and Security](/docs/getting-started/authentication-and-security)** - Security model
