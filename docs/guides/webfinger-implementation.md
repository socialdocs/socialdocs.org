---
sidebar_position: 15
title: WebFinger Implementation
description: Implementing WebFinger for user discovery in ActivityPub
---

# WebFinger Implementation

WebFinger (RFC 7033) enables user discovery by translating `@username@domain` handles into ActivityPub actor URLs. Without WebFinger, Mastodon and most other implementations cannot find your users. This guide covers implementing WebFinger properly.

## How WebFinger Works

```
┌────────────────────────────────────────────────────────┐
│                  WEBFINGER FLOW                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  User searches: @alice@example.com                     │
│       ↓                                                │
│  Client queries:                                       │
│  https://example.com/.well-known/webfinger             │
│  ?resource=acct:alice@example.com                      │
│       ↓                                                │
│  Server returns JRD with links                         │
│       ↓                                                │
│  Client finds self link with ActivityPub type          │
│       ↓                                                │
│  Client fetches the actor URL                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## WebFinger Response Format

### JSON Resource Descriptor (JRD)

```json
{
  "subject": "acct:alice@example.com",
  "aliases": [
    "https://example.com/@alice",
    "https://example.com/users/alice"
  ],
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://example.com/users/alice"
    },
    {
      "rel": "http://webfinger.net/rel/profile-page",
      "type": "text/html",
      "href": "https://example.com/@alice"
    }
  ]
}
```

### Required Elements

| Element | Description |
|---------|-------------|
| `subject` | The canonical identifier (acct: URI) |
| `links` | Array of related resources |
| `links[].rel` | Link relation type |
| `links[].type` | Media type of the resource |
| `links[].href` | URL of the resource |

### The Critical Link

For ActivityPub, you must include a `self` link with the correct type:

```json
{
  "rel": "self",
  "type": "application/activity+json",
  "href": "https://example.com/users/alice"
}
```

Or with the full JSON-LD type:

```json
{
  "rel": "self",
  "type": "application/ld+json; profile=\"https://www.w3.org/ns/activitystreams\"",
  "href": "https://example.com/users/alice"
}
```

## Basic Implementation

### Express.js Example

```javascript
app.get('/.well-known/webfinger', async (req, res) => {
  const resource = req.query.resource;

  if (!resource) {
    return res.status(400).json({ error: 'Missing resource parameter' });
  }

  // Parse the acct: URI
  let username, domain;

  if (resource.startsWith('acct:')) {
    const acct = resource.slice(5); // Remove 'acct:'
    [username, domain] = acct.split('@');
  } else if (resource.startsWith('https://')) {
    // Handle direct URL lookup
    const url = new URL(resource);
    domain = url.hostname;
    username = url.pathname.split('/').pop();
  } else {
    return res.status(400).json({ error: 'Invalid resource format' });
  }

  // Verify domain matches our server
  if (domain !== config.domain) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Find the user
  const user = await db.actors.findOne({
    preferredUsername: username
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Build the JRD response
  const jrd = {
    subject: `acct:${username}@${config.domain}`,
    aliases: [
      user.url || `https://${config.domain}/@${username}`,
      user.id
    ],
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: user.id
      },
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: user.url || `https://${config.domain}/@${username}`
      }
    ]
  };

  res.setHeader('Content-Type', 'application/jrd+json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(jrd);
});
```

### Response Headers

```javascript
res.setHeader('Content-Type', 'application/jrd+json');
res.setHeader('Access-Control-Allow-Origin', '*'); // Required for browser clients
res.setHeader('Cache-Control', 'max-age=3600'); // Cache for 1 hour
```

## Querying WebFinger

### Client Implementation

```javascript
async function lookupWebFinger(handle) {
  // Parse handle: @alice@example.com or alice@example.com
  const cleaned = handle.replace(/^@/, '');
  const [username, domain] = cleaned.split('@');

  if (!username || !domain) {
    throw new Error('Invalid handle format');
  }

  const url = `https://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/jrd+json, application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`WebFinger lookup failed: ${response.status}`);
  }

  const jrd = await response.json();

  // Find the ActivityPub actor URL
  const selfLink = jrd.links.find(link =>
    link.rel === 'self' &&
    (link.type === 'application/activity+json' ||
     link.type === 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"')
  );

  if (!selfLink) {
    throw new Error('No ActivityPub link found');
  }

  return {
    subject: jrd.subject,
    actorUrl: selfLink.href,
    profileUrl: jrd.links.find(l =>
      l.rel === 'http://webfinger.net/rel/profile-page'
    )?.href
  };
}
```

### Usage

```javascript
// Resolve a mention
const result = await lookupWebFinger('@alice@mastodon.social');
console.log(result.actorUrl);
// https://mastodon.social/users/alice

// Fetch the actor
const actor = await fetchActor(result.actorUrl);
```

## Additional Links

### Profile Page

```json
{
  "rel": "http://webfinger.net/rel/profile-page",
  "type": "text/html",
  "href": "https://example.com/@alice"
}
```

### Avatar

```json
{
  "rel": "http://webfinger.net/rel/avatar",
  "type": "image/png",
  "href": "https://example.com/avatars/alice.png"
}
```

### Atom Feed (Legacy)

```json
{
  "rel": "http://schemas.google.com/g/2010#updates-from",
  "type": "application/atom+xml",
  "href": "https://example.com/users/alice.atom"
}
```

### Subscribe URL (OStatus)

```json
{
  "rel": "http://ostatus.org/schema/1.0/subscribe",
  "template": "https://example.com/authorize_interaction?uri={uri}"
}
```

## Handling Edge Cases

### Case Insensitivity

Usernames should be case-insensitive:

```javascript
const user = await db.actors.findOne({
  preferredUsername: { $regex: new RegExp(`^${username}$`, 'i') }
});
```

### URL Resource Lookups

Some clients query with URLs instead of acct: URIs:

```javascript
app.get('/.well-known/webfinger', async (req, res) => {
  const resource = req.query.resource;

  let username;

  if (resource.startsWith('acct:')) {
    username = resource.slice(5).split('@')[0];
  } else if (resource.startsWith('https://')) {
    // Handle: https://example.com/users/alice
    const url = new URL(resource);
    if (url.hostname !== config.domain) {
      return res.status(404).json({ error: 'Not found' });
    }
    // Extract username from URL path
    const match = url.pathname.match(/\/users\/([^\/]+)/);
    username = match ? match[1] : null;
  }

  // Continue with lookup...
});
```

### Multiple Domains

If you host multiple domains:

```javascript
const allowedDomains = ['example.com', 'example.org'];

app.get('/.well-known/webfinger', async (req, res) => {
  const resource = req.query.resource;
  const [username, domain] = parseResource(resource);

  if (!allowedDomains.includes(domain)) {
    return res.status(404).json({ error: 'Unknown domain' });
  }

  const user = await db.actors.findOne({
    preferredUsername: username,
    domain: domain
  });

  // ...
});
```

## CORS Configuration

WebFinger must be accessible from browsers:

```javascript
app.use('/.well-known/webfinger', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});
```

## Testing

### Manual Test

```bash
curl "https://example.com/.well-known/webfinger?resource=acct:alice@example.com" \
  -H "Accept: application/jrd+json"
```

### Expected Response

```json
{
  "subject": "acct:alice@example.com",
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://example.com/users/alice"
    }
  ]
}
```

### Validation Checklist

- [ ] Returns 200 for valid users
- [ ] Returns 404 for unknown users
- [ ] Returns 400 for missing resource parameter
- [ ] Content-Type is `application/jrd+json`
- [ ] CORS headers allow cross-origin requests
- [ ] `self` link has correct ActivityPub type
- [ ] Handles case-insensitive usernames
- [ ] Works with both `acct:` and URL resources

## Common Issues

### Wrong Content-Type

```javascript
// Wrong
res.json(jrd);

// Right
res.setHeader('Content-Type', 'application/jrd+json');
res.json(jrd);
```

### Missing CORS

Without CORS, browser-based clients can't query WebFinger:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

### Domain Mismatch

The resource domain must match your server:

```javascript
if (domain !== config.domain) {
  return res.status(404).json({ error: 'Not found' });
}
```

### Wrong Link Type

```javascript
// These are all valid ActivityPub types:
const validTypes = [
  'application/activity+json',
  'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
];
```

## Caching

Cache WebFinger responses to reduce load:

```javascript
async function cachedWebFinger(handle) {
  const cacheKey = `webfinger:${handle}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await lookupWebFinger(handle);
  await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour

  return result;
}
```

## Next Steps

- **[Testing Your Implementation](/docs/guides/testing-your-implementation)** - Validation
- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Authentication
- **[Building an Actor](/docs/guides/building-an-actor)** - Creating actors
- **[WebFinger sequence diagram](https://github.com/boyter/activitypub/blob/main/webfinger.md)** - External reference for the discovery exchange
