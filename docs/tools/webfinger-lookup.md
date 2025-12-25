---
sidebar_position: 1
title: WebFinger Lookup
description: Tools and techniques for testing WebFinger discovery
---

# WebFinger Lookup

WebFinger is the first step in ActivityPub federation—discovering an actor's location from their handle. This guide covers tools and techniques for testing WebFinger.

## Online Lookup Tools

### webfinger.net

The official WebFinger testing tool:

```
https://webfinger.net/lookup/?resource=acct:user@example.com
```

**Features:**
- Tests any WebFinger resource
- Shows full JSON response
- Validates response format
- Highlights errors

### Custom Lookup Tool

Build a simple lookup interface:

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebFinger Lookup</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    input { width: 300px; padding: 0.5rem; }
    button { padding: 0.5rem 1rem; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>WebFinger Lookup</h1>
  <input type="text" id="handle" placeholder="user@example.com">
  <button onclick="lookup()">Lookup</button>
  <div id="result"></div>

  <script>
    async function lookup() {
      const handle = document.getElementById('handle').value;
      const result = document.getElementById('result');

      // Parse handle
      const match = handle.match(/@?([^@]+)@(.+)/);
      if (!match) {
        result.innerHTML = '<p class="error">Invalid handle format</p>';
        return;
      }

      const [, user, domain] = match;
      const url = `https://${domain}/.well-known/webfinger?resource=acct:${user}@${domain}`;

      try {
        result.innerHTML = '<p>Loading...</p>';
        const response = await fetch(url);
        const data = await response.json();
        result.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      } catch (error) {
        result.innerHTML = `<p class="error">Error: ${error.message}</p>`;
      }
    }
  </script>
</body>
</html>
```

## Command Line Testing

### Using curl

```bash
# Basic lookup
curl "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social"

# With headers
curl -H "Accept: application/jrd+json" \
  "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social"

# Pretty print with jq
curl -s "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social" | jq .
```

### Expected Response

```json
{
  "subject": "acct:Gargron@mastodon.social",
  "aliases": [
    "https://mastodon.social/@Gargron",
    "https://mastodon.social/users/Gargron"
  ],
  "links": [
    {
      "rel": "http://webfinger.net/rel/profile-page",
      "type": "text/html",
      "href": "https://mastodon.social/@Gargron"
    },
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://mastodon.social/users/Gargron"
    },
    {
      "rel": "http://ostatus.org/schema/1.0/subscribe",
      "template": "https://mastodon.social/authorize_interaction?uri={uri}"
    }
  ]
}
```

## Validation Checklist

### Required Elements

```
┌────────────────────────────────────────────────────────────┐
│              WEBFINGER VALIDATION                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✓ Response returns 200 OK                                 │
│  ✓ Content-Type: application/jrd+json                      │
│  ✓ subject matches requested resource                      │
│  ✓ links array exists                                      │
│  ✓ self link with application/activity+json type           │
│  ✓ self link href is valid HTTPS URL                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Validation Script

```javascript
async function validateWebFinger(handle) {
  const match = handle.match(/@?([^@]+)@(.+)/);
  if (!match) throw new Error('Invalid handle format');

  const [, user, domain] = match;
  const resource = `acct:${user}@${domain}`;
  const url = `https://${domain}/.well-known/webfinger?resource=${encodeURIComponent(resource)}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/jrd+json' }
  });

  const results = {
    url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    errors: [],
    warnings: []
  };

  // Check status
  if (response.status !== 200) {
    results.errors.push(`Expected 200, got ${response.status}`);
    return results;
  }

  // Check content type
  if (!results.contentType?.includes('application/jrd+json')) {
    results.warnings.push(`Content-Type should be application/jrd+json`);
  }

  const data = await response.json();
  results.data = data;

  // Check subject
  if (data.subject !== resource) {
    results.warnings.push(`Subject mismatch: ${data.subject} !== ${resource}`);
  }

  // Check for self link
  const selfLink = data.links?.find(l =>
    l.rel === 'self' && l.type === 'application/activity+json'
  );

  if (!selfLink) {
    results.errors.push('Missing self link with application/activity+json type');
  } else if (!selfLink.href?.startsWith('https://')) {
    results.errors.push('Self link must be HTTPS');
  } else {
    results.actorUrl = selfLink.href;
  }

  return results;
}
```

## Common Issues

### CORS Errors

WebFinger endpoints should allow cross-origin requests:

```
Access-Control-Allow-Origin: *
```

If you see CORS errors in the browser, test with curl instead.

### Wrong Content-Type

Some servers return `application/json` instead of `application/jrd+json`:

```javascript
// Accept both content types
const response = await fetch(url, {
  headers: {
    'Accept': 'application/jrd+json, application/json'
  }
});
```

### Missing Self Link

The `self` link is required for ActivityPub:

```json
{
  "rel": "self",
  "type": "application/activity+json",
  "href": "https://example.com/users/alice"
}
```

### URL Encoding

Resource parameter must be URL-encoded:

```bash
# Correct
curl "https://example.com/.well-known/webfinger?resource=acct%3Aalice%40example.com"

# Also works (browser auto-encodes)
curl "https://example.com/.well-known/webfinger?resource=acct:alice@example.com"
```

## Testing Your Implementation

### Basic Test

```bash
# Test your server
curl -v "https://your-server.com/.well-known/webfinger?resource=acct:testuser@your-server.com"
```

### Verify Actor Fetch

After WebFinger succeeds, verify the actor URL works:

```bash
# Get actor URL from WebFinger self link
ACTOR_URL="https://your-server.com/users/testuser"

# Fetch actor
curl -H "Accept: application/activity+json" "$ACTOR_URL"
```

### Integration Test

```javascript
async function testWebFingerFlow(handle) {
  console.log(`Testing: ${handle}`);

  // Step 1: WebFinger lookup
  const wf = await validateWebFinger(handle);
  if (wf.errors.length > 0) {
    console.error('WebFinger errors:', wf.errors);
    return false;
  }

  console.log(`Actor URL: ${wf.actorUrl}`);

  // Step 2: Fetch actor
  const actorResponse = await fetch(wf.actorUrl, {
    headers: { 'Accept': 'application/activity+json' }
  });

  if (!actorResponse.ok) {
    console.error(`Actor fetch failed: ${actorResponse.status}`);
    return false;
  }

  const actor = await actorResponse.json();
  console.log(`Actor type: ${actor.type}`);
  console.log(`Actor name: ${actor.name || actor.preferredUsername}`);

  return true;
}
```

## Related Tools

- **[Actor Inspector](/docs/tools/actor-inspector)** - Inspect fetched actors
- **[Signature Tester](/docs/tools/signature-tester)** - Test HTTP signatures
- **[Debugging Tips](/docs/tools/debugging-tips)** - General debugging
