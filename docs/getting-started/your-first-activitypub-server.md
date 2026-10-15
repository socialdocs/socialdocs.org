---
sidebar_position: 3
title: Your First ActivityPub Server
description: Build a minimal ActivityPub server from scratch with Node.js
---

# Your First ActivityPub Server

:::danger Not safe for production
The code on this page is illustrative and **has known security flaws**: incomplete signature verification (signed headers, key-owner ↔ actor binding, Digest over the raw body), missing origin checks, and/or missing SSRF and output-escaping guards. Do not copy it into a real server. Use a maintained library such as [Fedify](https://fedify.dev/) or [activitypub-federation-rust](https://github.com/LemmyNet/activitypub-federation-rust) for request verification. Tracking: [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).
:::

In this tutorial, we'll build a minimal but functional ActivityPub server from scratch. By the end, you'll have a server that:

- Serves an Actor profile
- Handles WebFinger discovery
- Has an inbox that can receive activities
- Can be discovered and followed by Mastodon users

## Prerequisites

- Node.js 22+ installed
- Basic understanding of HTTP and REST APIs
- A domain name (or use ngrok for testing)

## Project Setup

Create a new project:

```bash
mkdir my-activitypub-server
cd my-activitypub-server
npm init -y
npm install express body-parser
```

## Step 1: Basic Server Structure

Create `server.js`:

```javascript
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DOMAIN = 'your-domain.com'; // Change this!
const USERNAME = 'alice';

// Parse JSON bodies
app.use(bodyParser.json({
  type: ['application/json', 'application/activity+json', 'application/ld+json']
}));

// Store for followers (in-memory for demo)
const followers = new Set();
const inbox = [];

app.listen(PORT, () => {
  console.log(`ActivityPub server running on port ${PORT}`);
});
```

## Step 2: WebFinger Endpoint

WebFinger allows other servers to discover your actor. When someone searches for `@alice@your-domain.com`, their server queries:

```
GET /.well-known/webfinger?resource=acct:alice@your-domain.com
```

Add the WebFinger endpoint:

```javascript
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;

  if (resource !== `acct:${USERNAME}@${DOMAIN}`) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.type('application/jrd+json').json({
    subject: `acct:${USERNAME}@${DOMAIN}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `https://${DOMAIN}/users/${USERNAME}`
      }
    ]
  });
});
```

## Step 3: Actor Endpoint

The Actor endpoint returns the profile. This is what other servers fetch to learn about your user:

```javascript
app.get('/users/:username', (req, res) => {
  if (req.params.username !== USERNAME) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: `https://${DOMAIN}/users/${USERNAME}`,
    inbox: `https://${DOMAIN}/users/${USERNAME}/inbox`,
    outbox: `https://${DOMAIN}/users/${USERNAME}/outbox`,
    followers: `https://${DOMAIN}/users/${USERNAME}/followers`,
    following: `https://${DOMAIN}/users/${USERNAME}/following`,
    preferredUsername: USERNAME,
    name: 'Alice',
    summary: 'A minimal ActivityPub actor',
    url: `https://${DOMAIN}/@${USERNAME}`,
    publicKey: {
      id: `https://${DOMAIN}/users/${USERNAME}#main-key`,
      owner: `https://${DOMAIN}/users/${USERNAME}`,
      publicKeyPem: PUBLIC_KEY // We'll generate this next
    }
  });
});
```

## Step 4: Generate Keys

ActivityPub itself doesn't mandate a key type, but RSA is the one every server supports for HTTP Signatures, so start with it (Mastodon 4.7 also verifies Ed25519). Generate a key pair:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

Load the keys in your server:

```javascript
const fs = require('fs');
const crypto = require('crypto');

const PRIVATE_KEY = fs.readFileSync('./private.pem', 'utf8');
const PUBLIC_KEY = fs.readFileSync('./public.pem', 'utf8');
```

## Step 5: Inbox Endpoint

The inbox receives activities from other servers:

```javascript
app.post('/users/:username/inbox', async (req, res) => {
  if (req.params.username !== USERNAME) {
    return res.status(404).json({ error: 'User not found' });
  }

  const activity = req.body;
  console.log('Received activity:', JSON.stringify(activity, null, 2));

  // Store the activity
  inbox.push(activity);

  // Handle different activity types
  switch (activity.type) {
    case 'Follow':
      await handleFollow(activity);
      break;
    case 'Undo':
      if (activity.object?.type === 'Follow') {
        await handleUnfollow(activity);
      }
      break;
    case 'Create':
      console.log('Received post:', activity.object?.content);
      break;
    default:
      console.log('Unhandled activity type:', activity.type);
  }

  res.status(202).send('Accepted');
});
```

## Step 6: Handle Follow Requests

When someone follows you, send an Accept activity back:

```javascript
const https = require('https');

async function handleFollow(activity) {
  const followerActor = activity.actor;

  // Add to followers
  followers.add(followerActor);
  console.log(`New follower: ${followerActor}`);

  // Fetch the follower's inbox
  const followerInfo = await fetchActor(followerActor);
  const followerInbox = followerInfo.inbox;

  // Create Accept activity
  const acceptActivity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Accept',
    id: `https://${DOMAIN}/activities/${Date.now()}`,
    actor: `https://${DOMAIN}/users/${USERNAME}`,
    object: activity
  };

  // Send Accept to follower's inbox
  await sendActivity(followerInbox, acceptActivity);
}

async function handleUnfollow(activity) {
  const followerActor = activity.actor;
  followers.delete(followerActor);
  console.log(`Unfollowed by: ${followerActor}`);
}
```

## Step 7: HTTP Signatures

All outgoing requests must be signed. Here's a signing function:

```javascript
function signRequest(method, url, body) {
  const urlObj = new URL(url);
  const date = new Date().toUTCString();
  const digest = body
    ? `SHA-256=${crypto.createHash('sha256').update(body).digest('base64')}`
    : null;

  const signedHeaders = digest
    ? '(request-target) host date digest'
    : '(request-target) host date';

  const signatureString = [
    `(request-target): ${method.toLowerCase()} ${urlObj.pathname}`,
    `host: ${urlObj.host}`,
    `date: ${date}`,
    digest ? `digest: ${digest}` : null
  ].filter(Boolean).join('\n');

  const signature = crypto.sign('sha256', Buffer.from(signatureString), PRIVATE_KEY);
  const signatureBase64 = signature.toString('base64');

  return {
    date,
    digest,
    signature: `keyId="https://${DOMAIN}/users/${USERNAME}#main-key",` +
               `algorithm="rsa-sha256",` +
               `headers="${signedHeaders}",` +
               `signature="${signatureBase64}"`
  };
}
```

## Step 8: Send Activities

Send signed activities to other servers:

```javascript
async function sendActivity(inboxUrl, activity) {
  const body = JSON.stringify(activity);
  const headers = signRequest('POST', inboxUrl, body);

  const urlObj = new URL(inboxUrl);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/activity+json',
        'Date': headers.date,
        'Digest': headers.digest,
        'Signature': headers.signature,
        'Host': urlObj.host
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Sent activity to ${inboxUrl}: ${res.statusCode}`);
        resolve(data);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
```

## Step 9: Fetch Remote Actors

Fetch actor information from other servers:

```javascript
async function fetchActor(actorUrl) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(actorUrl);

    // Note: servers in Mastodon's "secure mode" require this GET to be
    // signed too, and in production you need an SSRF-safe fetch
    const req = https.get({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      timeout: 10000,
      headers: {
        'Accept': 'application/ld+json; profile="https://www.w3.org/ns/activitystreams", application/activity+json'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Fetch failed: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 1_000_000) req.destroy(new Error('Response too large'));
      });
      res.on('end', () => {
        // A throw inside this callback would crash the process —
        // turn bad JSON into a rejected promise instead
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
  });
}
```

## Step 10: Collections Endpoints

Add the remaining endpoints:

```javascript
// Outbox
app.get('/users/:username/outbox', (req, res) => {
  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `https://${DOMAIN}/users/${USERNAME}/outbox`,
    totalItems: 0,
    orderedItems: []
  });
});

// Followers
app.get('/users/:username/followers', (req, res) => {
  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `https://${DOMAIN}/users/${USERNAME}/followers`,
    totalItems: followers.size,
    orderedItems: Array.from(followers)
  });
});

// Following
app.get('/users/:username/following', (req, res) => {
  res.set('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `https://${DOMAIN}/users/${USERNAME}/following`,
    totalItems: 0,
    orderedItems: []
  });
});
```

## Complete Server Code

Here's the complete minimal server:

```javascript
// server.js - Complete minimal ActivityPub server
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'your-domain.com';
const USERNAME = 'alice';

// Load RSA keys
const PRIVATE_KEY = fs.readFileSync('./private.pem', 'utf8');
const PUBLIC_KEY = fs.readFileSync('./public.pem', 'utf8');

// In-memory storage
const followers = new Set();
const inbox = [];

app.use(bodyParser.json({
  type: ['application/json', 'application/activity+json', 'application/ld+json']
}));

// ... (all the endpoints from above)

app.listen(PORT, () => {
  console.log(`ActivityPub server running at https://${DOMAIN}`);
});
```

## Testing Your Server

### 1. Use ngrok for Local Testing

```bash
ngrok http 3000
```

Update `DOMAIN` to your ngrok URL (without `https://`).

### 2. Test WebFinger

```bash
curl "https://your-ngrok-url/.well-known/webfinger?resource=acct:alice@your-ngrok-url"
```

### 3. Test Actor Endpoint

```bash
curl -H "Accept: application/activity+json" "https://your-ngrok-url/users/alice"
```

### 4. Search from Mastodon

On any Mastodon instance, search for `@alice@your-ngrok-url`. You should see your actor!

## Common Issues

### "Could not fetch profile"
- Check that your server returns correct `Content-Type: application/activity+json`
- Ensure HTTPS is working (use ngrok)
- Verify WebFinger returns the correct actor URL

### "Follow not working"
- Check HTTP Signatures are correct
- Ensure your server's clock is synchronized
- Look at server logs for signature verification errors

### "Activities not being delivered"
- Verify the inbox URL is correct
- Check that you're signing requests
- Ensure the `Date` header is within a few minutes of current time

## Next Steps

You now have a working ActivityPub server! To make it production-ready:

1. **[Add database storage](/docs/guides/handling-incoming-activities)** - Replace in-memory storage
2. **[Implement posting](/docs/guides/sending-activities)** - Create and deliver posts
3. **[Handle more activities](/docs/guides/likes-and-shares)** - Likes, boosts, replies
4. **[HTTP Signatures deep dive](/docs/specs/http-signatures/overview)** - Understand the cryptography

## Resources

- [ActivityPub Spec](https://www.w3.org/TR/activitypub/)
- [Example implementations on GitHub](https://github.com/topics/activitypub)
- [SocialHub Forum](https://socialhub.activitypub.rocks/)
