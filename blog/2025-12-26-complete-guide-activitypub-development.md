---
slug: complete-guide-activitypub-development
title: "The Complete Guide to ActivityPub Development in 2025"
authors: [socialdocs]
tags: [activitypub, fediverse, tutorial, development, federation]
description: "Learn how to build federated social applications with ActivityPub. This comprehensive guide covers everything from basic concepts to production-ready implementations."
keywords: [ActivityPub, Fediverse, Mastodon API, federation, decentralized social network, ActivityStreams, WebFinger, HTTP Signatures]
image: /img/socialdocs-social-card.png
---

# The Complete Guide to ActivityPub Development in 2025

ActivityPub has become the backbone of the decentralized social web. With over 13 million users across Mastodon, Lemmy, PeerTube, Pixelfed, and dozens of other platforms, understanding ActivityPub is essential for developers building the next generation of social applications.

This guide provides everything you need to start building with ActivityPub — from core concepts to production deployment.

<!-- truncate -->

## What is ActivityPub?

[ActivityPub](https://www.w3.org/TR/activitypub/) is a W3C Recommendation that defines how servers communicate in a federated social network. Unlike centralized platforms like Twitter or Facebook, ActivityPub enables independent servers to communicate with each other, creating an interconnected "Fediverse."

**Key benefits:**
- **No single point of control** — Users can choose their server or run their own
- **Interoperability** — A Mastodon user can follow a PeerTube channel
- **Data portability** — Users can migrate between servers
- **Open standard** — Anyone can implement it

## Core Concepts

Before diving into code, understand these fundamental concepts:

### Actors

An [Actor](/docs/specs/activitypub/actors) is any entity that can perform actions — usually a user account, but also bots, groups, or services.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "preferredUsername": "alice",
  "name": "Alice"
}
```

### Activities

[Activities](/docs/specs/activitypub/activities) represent actions: Create, Follow, Like, Announce (boost), Delete, and more.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "content": "Hello, Fediverse!"
  }
}
```

### Federation

[Federation](/docs/getting-started/understanding-federation) is how servers exchange activities. When Alice follows Bob on a different server, her server sends a Follow activity to Bob's inbox.

## Getting Started: Your First ActivityPub Server

Ready to build? Here's the minimal implementation path:

### Step 1: WebFinger Discovery

Implement the `/.well-known/webfinger` endpoint so other servers can find your users:

```javascript
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;
  const [, user, domain] = resource.match(/acct:(.+)@(.+)/);

  res.json({
    subject: resource,
    links: [{
      rel: 'self',
      type: 'application/activity+json',
      href: `https://${domain}/users/${user}`
    }]
  });
});
```

→ Full guide: [WebFinger Implementation](/docs/guides/webfinger-implementation)

### Step 2: Actor Endpoint

Return your user's profile in ActivityPub format:

```javascript
app.get('/users/:username', (req, res) => {
  res.json({
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: `https://example.com/users/${req.params.username}`,
    inbox: `https://example.com/users/${req.params.username}/inbox`,
    outbox: `https://example.com/users/${req.params.username}/outbox`,
    preferredUsername: req.params.username,
    publicKey: {
      id: `https://example.com/users/${req.params.username}#main-key`,
      owner: `https://example.com/users/${req.params.username}`,
      publicKeyPem: PUBLIC_KEY
    }
  });
});
```

→ Full guide: [Building an Actor](/docs/guides/building-an-actor)

### Step 3: Inbox for Receiving Activities

Accept incoming activities from other servers:

```javascript
app.post('/users/:username/inbox', async (req, res) => {
  // Verify HTTP Signature
  await verifySignature(req);

  const activity = req.body;

  switch (activity.type) {
    case 'Follow':
      await handleFollow(activity);
      break;
    case 'Create':
      await handleCreate(activity);
      break;
    // ... handle other types
  }

  res.status(202).send('Accepted');
});
```

→ Full guide: [Handling Incoming Activities](/docs/guides/handling-incoming-activities)

### Step 4: HTTP Signatures

All inbox requests must be cryptographically signed. This proves the request came from who it claims:

```javascript
const crypto = require('crypto');

function signRequest(privateKey, keyId, method, url, body) {
  const digest = crypto.createHash('sha256').update(body).digest('base64');
  const date = new Date().toUTCString();

  const signingString = [
    `(request-target): ${method.toLowerCase()} ${new URL(url).pathname}`,
    `host: ${new URL(url).host}`,
    `date: ${date}`,
    `digest: SHA-256=${digest}`
  ].join('\n');

  const signature = crypto.sign('RSA-SHA256',
    Buffer.from(signingString), privateKey).toString('base64');

  return { date, digest: `SHA-256=${digest}`, signature };
}
```

→ Full guide: [Authentication and Security](/docs/getting-started/authentication-and-security)

## Essential Implementation Patterns

### Following and Followers

The follow flow is fundamental to federation:

1. Alice sends `Follow` activity to Bob's inbox
2. Bob's server sends `Accept` back to Alice's inbox
3. Alice adds Bob to her following list
4. Bob's future posts are delivered to Alice's inbox

→ Full guide: [Following and Followers](/docs/guides/following-and-followers)

### Creating Posts

Wrap content in a `Create` activity and deliver to followers:

```javascript
async function createPost(author, content) {
  const note = {
    type: 'Note',
    id: `https://example.com/notes/${uuid()}`,
    attributedTo: author.id,
    content: content,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [`${author.id}/followers`]
  };

  const activity = {
    type: 'Create',
    actor: author.id,
    object: note,
    to: note.to,
    cc: note.cc
  };

  await deliverToFollowers(activity, author);
}
```

→ Full guide: [Posts and Replies](/docs/guides/posts-and-replies)

## Platform Compatibility

Different Fediverse platforms have specific requirements:

| Platform | Key Considerations |
|----------|-------------------|
| **Mastodon** | Uses `toot:` namespace, requires `discoverable` flag |
| **Lemmy** | Uses `Group` actors for communities |
| **PeerTube** | Video-focused with custom extensions |
| **Pixelfed** | Image-focused, supports `Image` objects |

→ Full guides: [Mastodon Compatibility](/docs/guides/mastodon-compatibility), [Lemmy Compatibility](/docs/guides/lemmy-compatibility)

## Libraries and Tools

Don't build from scratch. Use established libraries:

### JavaScript/TypeScript
- **[activitypub-express](https://github.com/immers-space/activitypub-express)** — Express middleware
- **[@fedify/fedify](https://fedify.dev/)** — Type-safe framework

### Python
- **[bovine](https://codeberg.org/bovine/bovine)** — ActivityPub toolkit
- **[little-boxes](https://github.com/tsileo/little-boxes)** — Minimal implementation

### Go
- **[go-fed](https://github.com/go-fed/activity)** — Complete ActivityPub library
- **[pub](https://github.com/davecheney/pub)** — Lightweight library

### Rust
- **[activitypub-federation](https://crates.io/crates/activitypub-federation)** — Lemmy's library

→ Full directory: [Ecosystem Libraries](/docs/ecosystem/javascript-libraries)

## Testing Your Implementation

Before going live:

1. **Use ngrok** to expose your local server
2. **Test WebFinger** with the lookup tool
3. **Try following** from a real Mastodon account
4. **Check signatures** with the signature tester

→ Full guide: [Testing Your Implementation](/docs/guides/testing-your-implementation)

## Production Checklist

Before deploying:

- [ ] HTTPS only (required for federation)
- [ ] HTTP Signatures implemented
- [ ] Rate limiting on inbox
- [ ] Content sanitization (prevent XSS)
- [ ] Delivery retry queue
- [ ] Dead server tracking

→ Full checklist: [Compliance Checklist](/docs/tools/compliance-checklist)

## Community Resources

Join the ActivityPub developer community:

- **[SocialHub Forum](https://socialhub.activitypub.rocks/)** — Primary discussion forum
- **[W3C Social CG](https://www.w3.org/community/socialcg/)** — Standards development
- **[Fediverse Enhancement Proposals](https://codeberg.org/fediverse/fep)** — Protocol extensions
- **[Social Web Foundation](https://socialwebfoundation.org/)** — Advocacy and funding

## Next Steps

Ready to build? Start with these resources:

1. **[What is the Fediverse?](/docs/getting-started/what-is-the-fediverse)** — Conceptual foundation
2. **[Building an Actor](/docs/guides/building-an-actor)** — Your first implementation
3. **[ActivityPub Specification](/docs/specs/activitypub/overview)** — Protocol deep-dive

The decentralized social web is growing fast. Whether you're building the next Mastodon competitor, adding federation to an existing app, or creating something entirely new, ActivityPub provides the foundation.

**Welcome to the Fediverse. Let's build together.**

---

*Have questions? Join the discussion on [SocialHub](https://socialhub.activitypub.rocks/) or [open an issue](https://github.com/socialdocs/socialdocs.org/issues) on GitHub.*
