---
sidebar_position: 1
title: WebFinger
description: User discovery protocol for the Fediverse
---

# WebFinger

WebFinger is a protocol for discovering information about users and resources using their identifier (like an email address or username). In the Fediverse, it's how servers find ActivityPub actors from a simple `@user@domain` address.

## Specification

- **Status**: RFC 7033 (September 2013)
- **URL**: [https://tools.ietf.org/html/rfc7033](https://tools.ietf.org/html/rfc7033)

## How It Works

<svg viewBox="0 0 500 280" style={{maxWidth: '500px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="wfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="490" height="270" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="490" height="28" rx="12" fill="url(#wfGrad)"/>
  <text x="250" y="24" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">WEBFINGER DISCOVERY FLOW</text>

  {/* Step 1: User Search */}
  <rect x="20" y="45" width="180" height="40" rx="6" fill="url(#wfGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="110" y="60" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">User searches:</text>
  <text x="110" y="76" textAnchor="middle" fill="#6364FF" fontSize="11" fontWeight="600">@alice@example.com</text>

  {/* Arrow 1 */}
  <line x1="110" y1="88" x2="110" y2="108" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="107,105 110,115 113,105" fill="#6364FF"/>

  {/* Step 2: Query */}
  <rect x="20" y="118" width="460" height="36" rx="6" fill="url(#wfGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="250" y="132" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">Server queries:</text>
  <text x="250" y="147" textAnchor="middle" fill="#6364FF" fontSize="10" fontWeight="500" fontFamily="monospace">example.com/.well-known/webfinger?resource=acct:alice@example.com</text>

  {/* Arrow 2 */}
  <line x1="250" y1="156" x2="250" y2="168" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="247,165 250,175 253,165" fill="#6364FF"/>

  {/* Step 3: Response */}
  <rect x="80" y="178" width="340" height="36" rx="6" fill="url(#wfGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="250" y="192" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.7">Response contains:</text>
  <text x="250" y="207" textAnchor="middle" fill="#6364FF" fontSize="10" fontWeight="500" fontFamily="monospace">href: "https://example.com/users/alice"</text>

  {/* Arrow 3 */}
  <line x1="250" y1="216" x2="250" y2="228" stroke="#6364FF" strokeWidth="2"/>
  <polygon points="247,225 250,235 253,225" fill="#6364FF"/>

  {/* Step 4: Actor */}
  <rect x="150" y="238" width="200" height="30" rx="6" fill="#6364FF"/>
  <text x="250" y="258" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">ActivityPub Actor Retrieved</text>
</svg>

## Request Format

### URL

```
GET /.well-known/webfinger?resource={resource}
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `resource` | Yes | The resource identifier |
| `rel` | No | Filter links by relation |

### Resource Format

For users, use the `acct:` URI scheme:

```
acct:username@domain
```

Examples:
- `acct:alice@example.com`
- `acct:bob@mastodon.social`

## Response Format

```json
{
  "subject": "acct:alice@example.com",
  "aliases": [
    "https://example.com/@alice",
    "https://example.com/users/alice"
  ],
  "links": [
    {
      "rel": "http://webfinger.net/rel/profile-page",
      "type": "text/html",
      "href": "https://example.com/@alice"
    },
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://example.com/users/alice"
    },
    {
      "rel": "http://ostatus.org/schema/1.0/subscribe",
      "template": "https://example.com/authorize_interaction?uri={uri}"
    }
  ]
}
```

### Properties

| Property | Description |
|----------|-------------|
| `subject` | The queried resource |
| `aliases` | Alternative identifiers |
| `links` | Related resources |

### Link Relations

| Relation | Purpose |
|----------|---------|
| `self` | The canonical representation |
| `http://webfinger.net/rel/profile-page` | Human-readable profile |
| `http://ostatus.org/schema/1.0/subscribe` | Remote follow URL |

## Implementation

### Server Endpoint

```javascript
app.get('/.well-known/webfinger', async (req, res) => {
  const resource = req.query.resource;

  if (!resource) {
    return res.status(400).json({ error: 'Missing resource parameter' });
  }

  // Parse acct: URI
  const match = resource.match(/^acct:([^@]+)@(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid resource format' });
  }

  const [, username, domain] = match;

  // Verify domain matches our server
  if (domain !== 'example.com') {
    return res.status(404).json({ error: 'User not found' });
  }

  // Find user
  const user = await db.users.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.set('Content-Type', 'application/jrd+json');
  res.json({
    subject: resource,
    aliases: [
      `https://example.com/@${username}`,
      `https://example.com/users/${username}`
    ],
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: `https://example.com/@${username}`
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `https://example.com/users/${username}`
      },
      {
        rel: 'http://ostatus.org/schema/1.0/subscribe',
        template: 'https://example.com/authorize_interaction?uri={uri}'
      }
    ]
  });
});
```

### Client Query

```javascript
async function lookupUser(handle) {
  // Parse handle: @alice@example.com or alice@example.com
  const match = handle.replace(/^@/, '').match(/^([^@]+)@(.+)$/);
  if (!match) {
    throw new Error('Invalid handle format');
  }

  const [, username, domain] = match;
  const resource = `acct:${username}@${domain}`;

  // Query WebFinger
  const url = `https://${domain}/.well-known/webfinger?resource=${encodeURIComponent(resource)}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/jrd+json' }
  });

  if (!response.ok) {
    throw new Error(`WebFinger failed: ${response.status}`);
  }

  const data = await response.json();

  // Find ActivityPub actor
  const actorLink = data.links.find(
    link => link.rel === 'self' && link.type === 'application/activity+json'
  );

  if (!actorLink) {
    throw new Error('No ActivityPub actor found');
  }

  return actorLink.href;
}
```

## Content Types

### Request

```http
GET /.well-known/webfinger?resource=acct:alice@example.com HTTP/1.1
Host: example.com
Accept: application/jrd+json
```

### Response

```http
HTTP/1.1 200 OK
Content-Type: application/jrd+json
Access-Control-Allow-Origin: *

{ ... }
```

## CORS

WebFinger endpoints SHOULD support CORS for browser-based clients:

```javascript
app.use('/.well-known/webfinger', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Headers', 'Accept');
  next();
});
```

## Error Handling

### 400 Bad Request

```json
{
  "error": "invalid_request",
  "error_description": "Missing or invalid resource parameter"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "error_description": "Resource not found"
}
```

## Caching

WebFinger responses can be cached:

```javascript
res.set('Cache-Control', 'max-age=86400'); // 24 hours
```

## Security

1. **HTTPS required** - Always use HTTPS for WebFinger
2. **Validate domains** - Only respond for your domain
3. **Rate limiting** - Prevent enumeration attacks

```javascript
const rateLimit = require('express-rate-limit');

app.use('/.well-known/webfinger', rateLimit({
  windowMs: 60 * 1000,
  max: 100
}));
```

## Testing

### curl

```bash
curl "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social"
```

### Online Tools

- [WebFinger.net Lookup](https://webfinger.net/)
- Browser DevTools

## Common Issues

### CORS Errors

Add CORS headers to your endpoint.

### Wrong Content-Type

Use `application/jrd+json`, not `application/json`.

### Domain Mismatch

Verify the domain in the resource matches your server.

## Next Steps

- **[Building an Actor](/docs/guides/building-an-actor)** - Implement WebFinger
- **[Actor Endpoint](/docs/specs/activitypub/actors)** - The link target
