---
sidebar_position: 1
title: Building an Actor
description: Complete guide to implementing an ActivityPub actor
---

# Building an Actor

This guide walks through implementing a complete ActivityPub actor from scratch. By the end, you'll have a functioning federated user that can be discovered, followed, and receive activities.

## What We're Building

A complete actor implementation requires:

1. **WebFinger endpoint** - Discovery
2. **Actor endpoint** - Profile information
3. **Inbox endpoint** - Receive activities
4. **Outbox endpoint** - Activity history
5. **Followers/Following** - Collections
6. **HTTP Signatures** - Authentication

## Prerequisites

```bash
npm init -y
npm install express body-parser crypto uuid
```

Generate RSA keys:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

## Step 1: Basic Setup

```javascript
// server.js
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const DOMAIN = process.env.DOMAIN || 'example.com';
const PORT = process.env.PORT || 3000;

// Load keys
const PRIVATE_KEY = fs.readFileSync('./private.pem', 'utf8');
const PUBLIC_KEY = fs.readFileSync('./public.pem', 'utf8');

// In-memory storage
const actors = new Map();
const followers = new Map();
const activities = [];

// Parse JSON bodies
app.use(express.json({
  type: ['application/json', 'application/activity+json', 'application/ld+json']
}));

// Create a default actor
actors.set('alice', {
  username: 'alice',
  name: 'Alice',
  summary: 'A test ActivityPub actor',
  privateKey: PRIVATE_KEY,
  publicKey: PUBLIC_KEY
});
followers.set('alice', new Set());
```

## Step 2: WebFinger Endpoint

```javascript
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;

  if (!resource) {
    return res.status(400).json({ error: 'Missing resource' });
  }

  // Parse acct:user@domain
  const match = resource.match(/^acct:([^@]+)@(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid resource format' });
  }

  const [, username, domain] = match;

  if (domain !== DOMAIN || !actors.has(username)) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.set('Content-Type', 'application/jrd+json');
  res.json({
    subject: resource,
    aliases: [
      `https://${DOMAIN}/@${username}`,
      `https://${DOMAIN}/users/${username}`
    ],
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: `https://${DOMAIN}/@${username}`
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `https://${DOMAIN}/users/${username}`
      }
    ]
  });
});
```

## Step 3: Actor Endpoint

```javascript
app.get('/users/:username', (req, res) => {
  const { username } = req.params;
  const actor = actors.get(username);

  if (!actor) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: `https://${DOMAIN}/users/${username}`,
    inbox: `https://${DOMAIN}/users/${username}/inbox`,
    outbox: `https://${DOMAIN}/users/${username}/outbox`,
    followers: `https://${DOMAIN}/users/${username}/followers`,
    following: `https://${DOMAIN}/users/${username}/following`,
    preferredUsername: username,
    name: actor.name,
    summary: actor.summary,
    url: `https://${DOMAIN}/@${username}`,
    manuallyApprovesFollowers: false,
    publicKey: {
      id: `https://${DOMAIN}/users/${username}#main-key`,
      owner: `https://${DOMAIN}/users/${username}`,
      publicKeyPem: actor.publicKey
    },
    endpoints: {
      sharedInbox: `https://${DOMAIN}/inbox`
    }
  });
});
```

## Step 4: Inbox Endpoint

```javascript
app.post('/users/:username/inbox', async (req, res) => {
  const { username } = req.params;

  if (!actors.has(username)) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Verify HTTP Signature (see Step 6)
  try {
    await verifySignature(req);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  const activity = req.body;
  console.log('Received:', activity.type, 'from', activity.actor);

  // Process activity
  switch (activity.type) {
    case 'Follow':
      await handleFollow(username, activity);
      break;
    case 'Undo':
      await handleUndo(username, activity);
      break;
    case 'Create':
      await handleCreate(username, activity);
      break;
    case 'Delete':
      await handleDelete(username, activity);
      break;
    case 'Like':
    case 'Announce':
      // Store notification
      activities.push({ type: 'notification', activity, receivedAt: new Date() });
      break;
  }

  res.status(202).send('Accepted');
});

// Shared inbox
app.post('/inbox', async (req, res) => {
  // Similar logic, but determine recipients from to/cc
  res.status(202).send('Accepted');
});
```

## Step 5: Handle Follow/Unfollow

```javascript
async function handleFollow(username, activity) {
  const followerActor = activity.actor;

  // Add to followers
  followers.get(username).add(followerActor);
  console.log(`${followerActor} followed ${username}`);

  // Send Accept
  const accept = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Accept',
    id: `https://${DOMAIN}/activities/${Date.now()}`,
    actor: `https://${DOMAIN}/users/${username}`,
    object: activity
  };

  // Fetch follower's inbox
  const followerInfo = await fetchActor(followerActor);
  await sendActivity(followerInfo.inbox, accept, actors.get(username));
}

async function handleUndo(username, activity) {
  const undone = activity.object;

  if (undone.type === 'Follow' && undone.object === `https://${DOMAIN}/users/${username}`) {
    followers.get(username).delete(activity.actor);
    console.log(`${activity.actor} unfollowed ${username}`);
  }
}
```

## Step 6: HTTP Signature Verification

```javascript
async function verifySignature(req) {
  const sigHeader = req.headers.signature;
  if (!sigHeader) throw new Error('Missing signature');

  // Parse signature header
  const params = {};
  sigHeader.replace(/(\w+)="([^"]+)"/g, (_, key, val) => params[key] = val);

  // Check date freshness
  const date = new Date(req.headers.date);
  if (Math.abs(Date.now() - date) > 5 * 60 * 1000) {
    throw new Error('Request too old');
  }

  // Fetch public key
  const actorUrl = params.keyId.split('#')[0];
  const actor = await fetchActor(actorUrl);
  const publicKey = actor.publicKey.publicKeyPem;

  // Rebuild signing string
  const signingString = params.headers.split(' ').map(header => {
    if (header === '(request-target)') {
      return `(request-target): ${req.method.toLowerCase()} ${req.originalUrl}`;
    }
    return `${header}: ${req.headers[header.toLowerCase()]}`;
  }).join('\n');

  // Verify
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingString);

  if (!verifier.verify(publicKey, params.signature, 'base64')) {
    throw new Error('Invalid signature');
  }
}

async function fetchActor(url) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/activity+json' }
  });
  return response.json();
}
```

## Step 7: Send Activities

```javascript
async function sendActivity(inbox, activity, actor) {
  const body = JSON.stringify(activity);
  const url = new URL(inbox);
  const date = new Date().toUTCString();

  // Create digest
  const digest = `SHA-256=${crypto.createHash('sha256').update(body).digest('base64')}`;

  // Create signing string
  const signingString = [
    `(request-target): post ${url.pathname}`,
    `host: ${url.host}`,
    `date: ${date}`,
    `digest: ${digest}`
  ].join('\n');

  // Sign
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingString);
  const signature = signer.sign(actor.privateKey, 'base64');

  const signatureHeader = [
    `keyId="https://${DOMAIN}/users/${actor.username}#main-key"`,
    'algorithm="rsa-sha256"',
    'headers="(request-target) host date digest"',
    `signature="${signature}"`
  ].join(',');

  const response = await fetch(inbox, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/activity+json',
      'Date': date,
      'Digest': digest,
      'Signature': signatureHeader,
      'Host': url.host
    },
    body
  });

  console.log(`Delivered to ${inbox}: ${response.status}`);
}
```

## Step 8: Collection Endpoints

```javascript
// Outbox
app.get('/users/:username/outbox', (req, res) => {
  const { username } = req.params;

  if (!actors.has(username)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const userActivities = activities.filter(a =>
    a.actor === `https://${DOMAIN}/users/${username}`
  );

  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `https://${DOMAIN}/users/${username}/outbox`,
    totalItems: userActivities.length,
    orderedItems: userActivities.slice(0, 20)
  });
});

// Followers
app.get('/users/:username/followers', (req, res) => {
  const { username } = req.params;
  const userFollowers = followers.get(username);

  if (!userFollowers) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `https://${DOMAIN}/users/${username}/followers`,
    totalItems: userFollowers.size,
    orderedItems: Array.from(userFollowers)
  });
});

// Following
app.get('/users/:username/following', (req, res) => {
  const { username } = req.params;

  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `https://${DOMAIN}/users/${username}/following`,
    totalItems: 0,
    orderedItems: []
  });
});
```

## Step 9: Start Server

```javascript
app.listen(PORT, () => {
  console.log(`ActivityPub server running at https://${DOMAIN}`);
  console.log(`Actor: @alice@${DOMAIN}`);
});
```

## Testing

### 1. Use ngrok

```bash
ngrok http 3000
```

Update `DOMAIN` environment variable.

### 2. Test WebFinger

```bash
curl "https://your-domain/.well-known/webfinger?resource=acct:alice@your-domain"
```

### 3. Test Actor

```bash
curl -H "Accept: application/activity+json" "https://your-domain/users/alice"
```

### 4. Search from Mastodon

Search for `@alice@your-domain` on any Mastodon instance.

## What's Next

- **[Sending Activities](/docs/guides/sending-activities)** - Post content
- **[Following and Followers](/docs/guides/following-and-followers)** - Manage relationships
- **[Posts and Replies](/docs/guides/posts-and-replies)** - Create content
