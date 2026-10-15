---
sidebar_position: 14
title: Content Security
description: Security considerations for handling ActivityPub content
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 sanitize_config.rb, DOMPurify 3.4.17, request-filtering-agent 3.2.1, express-rate-limit 8.7.1"
---

# Content Security

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
// needs, exactly as Mastodon does (sanitize_config.rb, lines 31-34):
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

// Enforce the class allowlist defined above (DOMPurify's ALLOWED_ATTR alone
// would let any class through).
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName !== 'class') return;
  const kept = data.attrValue.split(/\s+/).filter(allowedClass);
  if (kept.length) data.attrValue = kept.join(' ');
  else data.keepAttr = false;
});

// Every surviving link opens safely and can't reach a non-http(s) scheme
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') return;
  const href = node.getAttribute('href');
  if (!href || !/^https?:\/\//i.test(href)) node.removeAttribute('href');
  node.setAttribute('rel', 'nofollow noopener noreferrer');
});

function sanitizeContent(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,                         // the allowlist above
    ALLOWED_ATTR: ['href', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
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
const fetch = require('node-fetch'); // v2: timeout/size/follow options
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

  let response, body;
  try {
    response = await fetch(media.remoteUrl, {
      agent: (parsed) => useAgent(parsed.href), // checked agent per redirect hop
      timeout: 10000,
      size: 10 * 1024 * 1024, // 10MB limit
      follow: 3
    });
    // buffer() enforces the size limit; piping response.body would not.
    body = response.ok ? await response.buffer() : null;
  } catch (err) {
    return res.status(502).end(); // blocked address, timeout, too large, ...
  }

  const contentType = (response.headers.get('content-type') || '')
    .split(';')[0].trim().toLowerCase();
  if (!body || !SAFE_MEDIA_TYPES.has(contentType)) {
    return res.status(415).end();
  }

  res.set('Content-Type', contentType);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Security-Policy', "default-src 'none'; sandbox");
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(body);
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
const idOf = (v) => (typeof v === 'string' ? v : v?.id);

// signerId: the actor that owns the key that signed this request
// (from your signature verification — see Verifying Requests)
function validateActivity(activity, signerId) {
  // Required fields
  if (!activity.type || !activity.actor) {
    throw new Error('Missing required fields');
  }

  // Actor matches the authenticated sender
  if (idOf(activity.actor) !== signerId) {
    throw new Error('Actor mismatch');
  }

  // Object attribution includes the actor, and the object lives on the
  // actor's origin (for Create/Update) — the CVE-2024-23832 bug class.
  // attributedTo may be an array: PeerTube lists both the person and the channel.
  if (activity.type === 'Create' || activity.type === 'Update') {
    const object = activity.object;
    if (typeof object !== 'object' || typeof object.id !== 'string') {
      throw new Error('Create/Update must embed the object');
    }
    const authors = [].concat(object.attributedTo ?? []).map(idOf);
    if (!authors.includes(signerId)) {
      throw new Error('Attribution mismatch');
    }
    if (new URL(object.id).origin !== new URL(signerId).origin) {
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

// express-rate-limit 8: the default key is the client IP, grouped by /56
// for IPv6 so a client can't dodge the limit by rotating addresses.
// Don't key on req.body.actor: it is unauthenticated until the signature
// is verified. Add per-domain limits after verification.
const inboxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100
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
- **[HTTP Signatures](/docs/specs/http-signatures/overview)**
- **[Authentication Guide](/docs/getting-started/authentication-and-security)**

