---
sidebar_position: 14
title: Content Security
description: Security considerations for handling ActivityPub content
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
  '*': ['class']
};
```

### Sanitization Example

```javascript
const DOMPurify = require('dompurify');

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

```javascript
app.get('/media/proxy', async (req, res) => {
  const url = req.query.url;

  // Validate URL
  if (!isAllowedMediaUrl(url)) {
    return res.status(400).send('Invalid URL');
  }

  // Fetch with timeout
  const response = await fetch(url, {
    timeout: 10000,
    size: 10 * 1024 * 1024 // 10MB limit
  });

  // Validate content type
  const contentType = response.headers.get('content-type');
  if (!isAllowedMediaType(contentType)) {
    return res.status(400).send('Invalid media type');
  }

  // Stream to client
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'public, max-age=86400');
  response.body.pipe(res);
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

  // No IP addresses
  if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
    throw new Error('IP addresses not allowed');
  }

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

  // Object attribution matches actor (for Create)
  if (activity.type === 'Create') {
    if (activity.object?.attributedTo !== activity.actor) {
      throw new Error('Attribution mismatch');
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
  max: 100, // per domain
  keyGenerator: (req) => {
    return new URL(req.body.actor).hostname;
  }
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

