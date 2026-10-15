---
sidebar_position: 14
title: Content Security
description: Security considerations for handling ActivityPub content
---

# Content Security

:::danger Not safe for production
The code on this page is illustrative and **has known security flaws**: incomplete signature verification (signed headers, key-owner ↔ actor binding, Digest over the raw body), missing origin checks, and/or missing SSRF and output-escaping guards. Do not copy it into a real server. Use a maintained library such as [Fedify](https://fedify.dev/) or [activitypub-federation-rust](https://github.com/LemmyNet/activitypub-federation-rust) for request verification. Tracking: [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).
:::

Handling federated content safely requires careful security practices.

## HTML Sanitization

Content from remote servers may contain malicious HTML.

### Dangerous Elements

| Element | Risk |
|---------|------|
| `<script>` | JavaScript execution |
| `<iframe>` | Embedding malicious pages |
| `<object>`, `<embed>` | Plugin exploits |
| `<form>` | Phishing attacks |
| `<meta>` | Redirects |

### Safe Allow List

```javascript
const ALLOWED_TAGS = [
  'p', 'br', 'span', 'a',
  'strong', 'b', 'em', 'i', 'u', 's', 'del',
  'blockquote', 'pre', 'code',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

const ALLOWED_ATTRS = {
  'a': ['href', 'rel', 'class'],
  'span': ['class'],
  'p': ['class']
};

// Don't let remote content use arbitrary classes — it would pick up your
// site's CSS and could spoof UI. Keep only the classes fediverse markup
// needs, as Mastodon does (sanitize_config.rb):
function allowedClass(c) {
  return /^(h|p|u|dt|e)-/.test(c)            // microformats
      || /^(mention|hashtag)$/.test(c)       // semantic
      || /^(ellipsis|invisible)$/.test(c)    // link formatting
      || c === 'quote-inline';
}
```

### Sanitization Example

```javascript
// DOMPurify needs a DOM; on the server, give it one from jsdom
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const DOMPurify = createDOMPurify(new JSDOM('').window);

function sanitizeContent(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: true
  });
}
```

## Link Safety

### External Link Handling

```javascript
function processLinks(html) {
  const doc = parseHTML(html);

  doc.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');

    // Add security attributes
    link.setAttribute('rel', 'nofollow noopener noreferrer');
    link.setAttribute('target', '_blank');

    // Validate URL scheme
    if (!isValidUrl(href)) {
      link.removeAttribute('href');
    }
  });

  return doc.toString();
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

### Dangerous Schemes

Block these URL schemes:

| Scheme | Risk |
|--------|------|
| `javascript:` | Script execution |
| `data:` | Embedded content |
| `vbscript:` | Legacy scripting |
| `file:` | Local file access |

## Media Handling

### Image Proxying

```
┌────────────┐     ┌──────────────┐     ┌────────────┐
│   User     │────▶│  Your Server │────▶│  Remote    │
│  Browser   │◀────│   (Proxy)    │◀────│  Server    │
└────────────┘     └──────────────┘     └────────────┘
```

Benefits:
- Hides user IP from remote servers
- Allows content validation
- Enables caching
- Blocks tracking pixels

### Implementation

A media proxy that fetches any URL it's given is an **open proxy** and an SSRF hole, and one that echoes the remote `Content-Type` turns a remote `image/svg+xml` or `text/html` file into script running on *your* origin (stored XSS). Only proxy URLs you already know about, and only serve raster media types:

```javascript
const fetch = require('node-fetch');
const { useAgent } = require('request-filtering-agent'); // blocks internal IPs

// Raster types only — never image/svg+xml or text/html
const SAFE_MEDIA_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg'
]);

app.get('/media/proxy/:id', async (req, res) => {
  // Look the media up in your own database (it came from an attachment
  // you stored) instead of accepting an arbitrary ?url=
  const media = await db.remoteMedia.findOne({ id: req.params.id });
  if (!media) return res.status(404).end();

  const response = await fetch(media.remoteUrl, {
    agent: useAgent(media.remoteUrl),
    timeout: 10000,
    size: 10 * 1024 * 1024, // 10MB limit
    follow: 3
  });

  const contentType = (response.headers.get('content-type') || '')
    .split(';')[0].trim().toLowerCase();
  if (!response.ok || !SAFE_MEDIA_TYPES.has(contentType)) {
    return res.status(415).end();
  }

  res.set('Content-Type', contentType);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Security-Policy', "default-src 'none'; sandbox");
  res.set('Cache-Control', 'public, max-age=86400');
  response.body.pipe(res); // node-fetch returns a Node stream
});
```

## Input Validation

### Actor ID Validation

```javascript
function validateActorId(id) {
  const url = new URL(id);

  // Must be HTTPS
  if (url.protocol !== 'https:') {
    throw new Error('Actor ID must use HTTPS');
  }

  // No localhost in production
  if (url.hostname === 'localhost') {
    throw new Error('Invalid actor domain');
  }

  // No IP literals (IPv4 or bracketed IPv6)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname.startsWith('[')) {
    throw new Error('IP addresses not allowed');
  }

  // Note: this is input hygiene, not SSRF protection — a hostname can
  // still resolve to an internal address. Fetch through a filtering
  // agent (see JSON-LD Security > SSRF Prevention).
  return true;
}
```

### Activity Validation

```javascript
function validateActivity(activity) {
  // Required fields
  if (!activity.type || !activity.actor) {
    throw new Error('Missing required fields');
  }

  // Actor matches authenticated sender
  if (activity.actor !== authenticatedActor) {
    throw new Error('Actor mismatch');
  }

  // Object attribution matches actor, and the object lives on the
  // actor's origin (for Create/Update) — the CVE-2024-23832 bug class
  if (activity.type === 'Create' || activity.type === 'Update') {
    if (activity.object?.attributedTo !== activity.actor) {
      throw new Error('Attribution mismatch');
    }
    if (new URL(activity.object.id).origin !== new URL(activity.actor).origin) {
      throw new Error('Object is not on the actor\'s origin');
    }
  }

  return true;
}
```

## Rate Limiting

Prevent abuse from federated servers:

```javascript
const rateLimit = require('express-rate-limit');

const inboxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  // req.body.actor is unauthenticated until the signature is verified —
  // keying on it lets attackers dodge the limit (and new URL(undefined)
  // throws). Key on the client IP here; add per-domain limits after
  // verification.
  keyGenerator: (req) => req.ip
});

app.post('/inbox', inboxLimiter, handleInbox);
```

## Security Checklist

| Check | Status |
|-------|--------|
| Sanitize all HTML content | Required |
| Validate URL schemes | Required |
| Proxy remote media | Recommended |
| Verify HTTP Signatures | Required |
| Rate limit inboxes | Recommended |
| Validate actor attribution | Required |
| Block private IP ranges | Required |

## See Also

- **[JSON-LD Security](/docs/reference/json-ld-security)**
- **[HTTP Signatures](/docs/reference/http-signatures-reference)**
- **[Authentication Guide](/docs/getting-started/authentication-and-security)**

