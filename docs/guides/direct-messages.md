---
sidebar_position: 7
title: Direct Messages
description: Implementing private messaging in ActivityPub using addressing
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
│  Followers:   to: [followers], cc: []                   │
│  Direct:      to: [user1, user2], cc: []                │
│                                                         │
│  No as:Public + No followers = Direct Message           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

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

  // Deliver directly to each recipient's inbox (not shared inbox!)
  for (const recipientId of recipientIds) {
    const recipient = await fetchActor(recipientId);
    // Use personal inbox for privacy
    await deliverActivity(activity, recipient.inbox, sender);
  }

  return { note, activity };
}
```

## Identifying Direct Messages

### Check Addressing

```javascript
function isDirectMessage(note) {
  const publicAddress = 'https://www.w3.org/ns/activitystreams#Public';

  // No public addressing
  const toPublic = note.to?.includes(publicAddress);
  const ccPublic = note.cc?.includes(publicAddress);

  if (toPublic || ccPublic) {
    return false;
  }

  // No followers collection
  const hasFollowers = (addresses) =>
    addresses?.some(addr => addr.endsWith('/followers'));

  if (hasFollowers(note.to) || hasFollowers(note.cc)) {
    return false;
  }

  return true;
}
```

### Mastodon's Approach

Mastodon identifies DMs as posts where all recipients are also Mentioned in tags:

```javascript
function isMastodonDirectMessage(note) {
  const allRecipients = [...(note.to || []), ...(note.cc || [])];
  const publicAddress = 'https://www.w3.org/ns/activitystreams#Public';

  // Filter out public and get actual recipients
  const actualRecipients = allRecipients.filter(r =>
    r !== publicAddress && !r.endsWith('/followers')
  );

  // Get mentioned actors
  const mentionedActors = (note.tag || [])
    .filter(t => t.type === 'Mention')
    .map(t => t.href);

  // All recipients should be mentioned
  return actualRecipients.every(r => mentionedActors.includes(r));
}
```

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

### Use Personal Inbox, Not Shared Inbox

For privacy, DMs should be delivered to personal inboxes:

```javascript
async function deliverDirectMessage(activity, sender) {
  const recipients = activity.to || [];

  for (const recipientId of recipients) {
    const recipient = await fetchActor(recipientId);

    // Use personal inbox for DMs, never shared inbox
    const inbox = recipient.inbox;

    await deliverActivity(activity, inbox, sender);
  }
}
```

### Strip bto/bcc Before Delivery

The spec requires removing `bto` and `bcc` before federation:

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

```javascript
async function getConversations(userId) {
  // Get all DMs involving this user
  const dms = await db.notes.find({
    $and: [
      { $or: [{ attributedTo: userId }, { 'to': userId }] },
      // Is a DM (no public, no followers)
      { 'to': { $not: { $regex: /Public$|\/followers$/ } } }
    ]
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

Pleroma introduced a separate `ChatMessage` type for better DM UX:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://pleroma.social/litepub"
  ],
  "type": "ChatMessage",
  "id": "https://pleroma.example/chat/123",
  "actor": "https://pleroma.example/users/alice",
  "to": ["https://other.example/users/bob"],
  "content": "Hey!"
}
```

**Key differences:**
- Only one recipient allowed per ChatMessage
- Cleaner conversation threading
- Not converted to mention-style display

```javascript
function isChatMessage(activity) {
  return activity.object?.type === 'ChatMessage';
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

Ensure all recipients are mentioned for Mastodon compatibility:

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
