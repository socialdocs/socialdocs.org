---
sidebar_position: 17
title: Mastodon Compatibility
description: Ensuring your ActivityPub implementation works with Mastodon
---

# Mastodon Compatibility

Mastodon is the largest ActivityPub implementation, making compatibility essential for any fediverse application. This guide covers Mastodon-specific requirements, extensions, and common interoperability issues.

## Mastodon's ActivityPub Extensions

Mastodon extends the standard ActivityPub vocabulary with custom properties under the `toot` namespace:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "toot": "http://joinmastodon.org/ns#",
      "Emoji": "toot:Emoji",
      "featured": "toot:featured",
      "featuredTags": "toot:featuredTags",
      "discoverable": "toot:discoverable",
      "suspended": "toot:suspended",
      "focalPoint": {
        "@id": "toot:focalPoint",
        "@container": "@list"
      },
      "blurhash": "toot:blurhash"
    }
  ]
}
```

## Actor Requirements

### Minimum Actor Structure

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "toot": "http://joinmastodon.org/ns#",
      "discoverable": "toot:discoverable"
    }
  ],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "following": "https://example.com/users/alice/following",
  "followers": "https://example.com/users/alice/followers",
  "preferredUsername": "alice",
  "name": "Alice",
  "summary": "<p>Hello, I'm Alice!</p>",
  "url": "https://example.com/@alice",
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/avatars/alice.png"
  },
  "image": {
    "type": "Image",
    "mediaType": "image/jpeg",
    "url": "https://example.com/headers/alice.jpg"
  },
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "discoverable": true,
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

### Required Properties

| Property | Description |
|----------|-------------|
| `inbox` | URL accepting POST requests for activities |
| `outbox` | URL returning actor's activities |
| `publicKey` | RSA public key for signature verification |
| `preferredUsername` | The @handle part (alphanumeric, underscores) |

### Mastodon-Specific Properties

| Property | Description |
|----------|-------------|
| `discoverable` | Whether to include in directory/search |
| `featured` | URL to pinned posts collection |
| `featuredTags` | URL to featured hashtags collection |
| `suspended` | Whether account is suspended |
| `manuallyApprovesFollowers` | Locked account requiring follow approval |
| `endpoints.sharedInbox` | Shared inbox for efficient delivery |

## Visibility Levels

Mastodon implements four visibility levels through addressing:

### Public

```json
{
  "type": "Create",
  "object": { "type": "Note", "content": "..." },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Unlisted (Hidden from timelines)

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

### Followers-Only

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": []
}
```

### Direct Message

```json
{
  "to": ["https://example.com/users/bob"],
  "cc": []
}
```

## Note Format

### Complete Note Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/123",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>Hello <span class=\"h-card\"><a href=\"https://example.com/users/bob\" class=\"u-url mention\">@<span>bob</span></a></span>!</p>",
  "published": "2024-01-15T12:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://example.com/users/alice/followers",
    "https://example.com/users/bob"
  ],
  "inReplyTo": null,
  "sensitive": false,
  "summary": null,
  "tag": [
    {
      "type": "Mention",
      "href": "https://example.com/users/bob",
      "name": "@bob@example.com"
    }
  ],
  "attachment": [],
  "url": "https://example.com/@alice/123"
}
```

### Content Formatting

Mastodon expects HTML content with specific formatting:

```javascript
function formatContent(text, mentions, hashtags) {
  let html = escapeHtml(text);

  // Format mentions with h-card microformat
  for (const mention of mentions) {
    const pattern = new RegExp(`@${mention.username}(@${mention.domain})?`, 'g');
    html = html.replace(pattern,
      `<span class="h-card">` +
      `<a href="${mention.url}" class="u-url mention">` +
      `@<span>${mention.username}</span>` +
      `</a></span>`
    );
  }

  // Format hashtags
  for (const tag of hashtags) {
    const pattern = new RegExp(`#${tag}`, 'gi');
    html = html.replace(pattern,
      `<a href="https://example.com/tags/${tag.toLowerCase()}" ` +
      `class="mention hashtag" rel="tag">#<span>${tag}</span></a>`
    );
  }

  // Wrap in paragraph
  return `<p>${html}</p>`;
}
```

### Content Warnings

```json
{
  "type": "Note",
  "sensitive": true,
  "summary": "Content warning text here",
  "content": "<p>The actual post content...</p>"
}
```

## Media Attachments

### Image with BlurHash

```json
{
  "type": "Document",
  "mediaType": "image/jpeg",
  "url": "https://example.com/media/photo.jpg",
  "name": "Alt text description",
  "width": 1920,
  "height": 1080,
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "focalPoint": [0.0, 0.0]
}
```

### Video Attachment

```json
{
  "type": "Document",
  "mediaType": "video/mp4",
  "url": "https://example.com/media/video.mp4",
  "name": "Video description",
  "width": 1280,
  "height": 720,
  "blurhash": "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."
}
```

### BlurHash Generation

```javascript
const { encode } = require('blurhash');
const sharp = require('sharp');

async function generateBlurhash(imagePath) {
  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // x components
    4  // y components
  );
}
```

## Polls

### Poll Format

```json
{
  "type": "Question",
  "id": "https://example.com/notes/poll-123",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>What's your favorite color?</p>",
  "endTime": "2024-01-16T12:00:00Z",
  "oneOf": [
    {
      "type": "Note",
      "name": "Red",
      "replies": {
        "type": "Collection",
        "totalItems": 10
      }
    },
    {
      "type": "Note",
      "name": "Blue",
      "replies": {
        "type": "Collection",
        "totalItems": 15
      }
    }
  ],
  "votersCount": 25
}
```

### Voting

```json
{
  "type": "Create",
  "actor": "https://example.com/users/bob",
  "object": {
    "type": "Note",
    "name": "Blue",
    "inReplyTo": "https://example.com/notes/poll-123",
    "attributedTo": "https://example.com/users/bob"
  }
}
```

## Custom Emoji

```json
{
  "type": "Emoji",
  "id": "https://example.com/emoji/blobcat",
  "name": ":blobcat:",
  "updated": "2024-01-01T00:00:00Z",
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/emoji/blobcat.png"
  }
}
```

## HTTP Signature Requirements

Mastodon requires HTTP Signatures on all requests:

### Signing Outgoing Requests

```javascript
const crypto = require('crypto');

function signRequest(request, actor, privateKey) {
  const date = new Date().toUTCString();
  const url = new URL(request.url);
  const digest = crypto
    .createHash('sha256')
    .update(request.body)
    .digest('base64');

  const signedHeaders = '(request-target) host date digest';
  const signatureString = [
    `(request-target): ${request.method.toLowerCase()} ${url.pathname}`,
    `host: ${url.host}`,
    `date: ${date}`,
    `digest: SHA-256=${digest}`
  ].join('\n');

  const signature = crypto
    .sign('sha256', Buffer.from(signatureString), privateKey)
    .toString('base64');

  return {
    ...request,
    headers: {
      ...request.headers,
      'Date': date,
      'Digest': `SHA-256=${digest}`,
      'Signature': `keyId="${actor.publicKey.id}",` +
        `algorithm="rsa-sha256",` +
        `headers="${signedHeaders}",` +
        `signature="${signature}"`
    }
  };
}
```

### Verifying Incoming Requests

```javascript
async function verifySignature(request) {
  const signatureHeader = request.headers.signature;
  const params = parseSignatureHeader(signatureHeader);

  // Fetch the public key
  const actor = await fetchActor(params.keyId.split('#')[0]);
  const publicKey = actor.publicKey.publicKeyPem;

  // Reconstruct the signature string
  const headers = params.headers.split(' ');
  const signatureString = headers.map(header => {
    if (header === '(request-target)') {
      return `(request-target): ${request.method.toLowerCase()} ${request.path}`;
    }
    return `${header}: ${request.headers[header.toLowerCase()]}`;
  }).join('\n');

  // Verify
  return crypto.verify(
    'sha256',
    Buffer.from(signatureString),
    publicKey,
    Buffer.from(params.signature, 'base64')
  );
}
```

## Common Compatibility Issues

### Missing WebFinger

Mastodon requires WebFinger for user discovery:

```javascript
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;
  // Handle acct: URIs
  if (!resource?.startsWith('acct:')) {
    return res.status(400).json({ error: 'Invalid resource' });
  }

  const [username, domain] = resource.slice(5).split('@');

  // Return JRD
  res.json({
    subject: resource,
    links: [{
      rel: 'self',
      type: 'application/activity+json',
      href: `https://${domain}/users/${username}`
    }]
  });
});
```

### Wrong Content-Type

Mastodon expects specific media types:

```javascript
// For actor/object responses
res.setHeader('Content-Type', 'application/activity+json');

// For WebFinger
res.setHeader('Content-Type', 'application/jrd+json');
```

### Missing Accept Header Handling

```javascript
app.get('/users/:username', (req, res) => {
  const accept = req.headers.accept || '';

  if (accept.includes('application/activity+json') ||
      accept.includes('application/ld+json')) {
    // Return ActivityPub actor
    return res.json(getActor(req.params.username));
  }

  // Return HTML page
  res.render('profile', { username: req.params.username });
});
```

### Signature Verification Failures

Common causes:
- Clock skew (ensure server time is accurate)
- Wrong key format
- Missing headers in signature
- Incorrect digest calculation

```javascript
// Ensure body digest matches
const expectedDigest = crypto
  .createHash('sha256')
  .update(rawBody)
  .digest('base64');

const receivedDigest = req.headers.digest?.replace('SHA-256=', '');

if (expectedDigest !== receivedDigest) {
  return res.status(401).json({ error: 'Digest mismatch' });
}
```

## Mastodon API Compatibility

Some applications implement Mastodon's REST API alongside ActivityPub:

### Status Endpoints

```javascript
// GET /api/v1/statuses/:id
app.get('/api/v1/statuses/:id', async (req, res) => {
  const note = await db.notes.findOne({ id: req.params.id });

  res.json({
    id: note._id,
    created_at: note.published,
    content: note.content,
    account: await formatAccount(note.attributedTo),
    // ... other Mastodon fields
  });
});
```

### Account Lookup

```javascript
// GET /api/v1/accounts/lookup
app.get('/api/v1/accounts/lookup', async (req, res) => {
  const acct = req.query.acct;
  const actor = await findActorByHandle(acct);

  res.json({
    id: actor._id,
    username: actor.preferredUsername,
    acct: `${actor.preferredUsername}@${getDomain(actor.id)}`,
    display_name: actor.name,
    // ... other fields
  });
});
```

## Testing Mastodon Integration

### Manual Testing

```bash
# Test actor fetch
curl -H "Accept: application/activity+json" \
  https://your-server.example/users/alice

# Test WebFinger
curl "https://your-server.example/.well-known/webfinger?resource=acct:alice@your-server.example"

# Search from Mastodon
# Use the Mastodon search box with @alice@your-server.example
```

### Automated Tests

```javascript
describe('Mastodon Compatibility', () => {
  it('should be discoverable via WebFinger', async () => {
    const response = await fetch(
      'https://your-server.example/.well-known/webfinger?resource=acct:alice@your-server.example'
    );

    expect(response.status).toBe(200);
    const jrd = await response.json();
    expect(jrd.links.find(l => l.rel === 'self')).toBeDefined();
  });

  it('should return valid actor', async () => {
    const response = await fetch(
      'https://your-server.example/users/alice',
      { headers: { Accept: 'application/activity+json' } }
    );

    const actor = await response.json();
    expect(actor.inbox).toBeDefined();
    expect(actor.publicKey).toBeDefined();
  });
});
```

## Next Steps

- **[Lemmy Compatibility](/docs/guides/lemmy-compatibility)** - Link aggregator federation
- **[Testing Your Implementation](/docs/guides/testing-your-implementation)** - Validation tools
- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Signature details
