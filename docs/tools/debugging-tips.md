---
sidebar_position: 5
title: Debugging Tips
description: Common debugging techniques for ActivityPub implementations
---

# Debugging Tips

Debugging federation issues requires understanding the full request/response cycle. This guide covers common problems and debugging techniques.

## General Debugging Strategy

```
┌────────────────────────────────────────────────────────────┐
│                DEBUGGING WORKFLOW                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Identify the failing step                              │
│     └── WebFinger? Actor fetch? Inbox delivery?            │
│                                                            │
│  2. Check request/response                                 │
│     └── Headers, body, status code                         │
│                                                            │
│  3. Verify signatures                                      │
│     └── Key exists? Signature valid? Date current?         │
│                                                            │
│  4. Check JSON-LD                                          │
│     └── Context correct? Properties resolve?               │
│                                                            │
│  5. Compare with working implementation                    │
│     └── Test against Mastodon, compare payloads            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Logging Setup

### Request/Response Logging

```javascript
// Express middleware for logging all requests
app.use((req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`→ ${req.method} ${req.path}`);
  console.log('  Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body) {
    console.log('  Body:', JSON.stringify(req.body, null, 2));
  }

  // Log response
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`← ${res.statusCode} (${Date.now() - start}ms)`);
    if (body) console.log('  Response:', body.substring?.(0, 500) || body);
    return originalSend.call(this, body);
  };

  next();
});
```

### Activity Logging

```javascript
async function logActivity(activity, direction) {
  const log = {
    timestamp: new Date().toISOString(),
    direction,  // 'incoming' or 'outgoing'
    type: activity.type,
    actor: activity.actor,
    object: typeof activity.object === 'string'
      ? activity.object
      : activity.object?.id || activity.object?.type
  };

  console.log(JSON.stringify(log));

  // Also save to file for later analysis
  fs.appendFileSync('activity.log', JSON.stringify(log) + '\n');
}
```

## Common Issues

### 1. WebFinger Not Found (404)

**Symptoms:**
- Remote servers can't find your users
- Federation doesn't start

**Checks:**
```bash
# Test your WebFinger endpoint
curl -v "https://your-server/.well-known/webfinger?resource=acct:user@your-server"

# Should return 200 with application/jrd+json
```

**Common Causes:**
- Endpoint not at `/.well-known/webfinger`
- Resource parameter not handled
- Missing CORS headers

### 2. Actor Not Accessible (401/403/404)

**Symptoms:**
- WebFinger works but actor fetch fails
- "Could not fetch actor" errors

**Checks:**
```bash
# Must include Accept header
curl -H "Accept: application/activity+json" \
  "https://your-server/users/alice"
```

**Common Causes:**
- Wrong Accept header handling
- Actor URL doesn't match WebFinger self link
- Content negotiation issues

### 3. Signature Verification Failed

**Symptoms:**
- Incoming activities rejected
- "Invalid signature" in logs

**Debug Steps:**
```javascript
app.post('/inbox', (req, res) => {
  console.log('=== Signature Debug ===');
  console.log('Signature header:', req.headers.signature);
  console.log('Date header:', req.headers.date);
  console.log('Digest header:', req.headers.digest);

  // Verify digest matches body
  const bodyDigest = crypto
    .createHash('sha256')
    .update(JSON.stringify(req.body))
    .digest('base64');
  console.log('Expected digest:', `SHA-256=${bodyDigest}`);
  console.log('Match:', req.headers.digest === `SHA-256=${bodyDigest}`);
});
```

**Common Causes:**
- Clock skew (Date header too old/new)
- Digest doesn't match body
- Wrong key fetched
- Signing string built incorrectly

### 4. Activities Not Delivered

**Symptoms:**
- Posts don't appear on remote servers
- Follows not received

**Debug Steps:**
```javascript
async function debugDelivery(inbox, activity) {
  console.log('=== Delivery Debug ===');
  console.log('Target inbox:', inbox);
  console.log('Activity:', JSON.stringify(activity, null, 2));

  try {
    const response = await deliverActivity(inbox, activity);
    console.log('Response status:', response.status);
    console.log('Response body:', await response.text());
  } catch (error) {
    console.error('Delivery error:', error.message);
  }
}
```

**Common Causes:**
- Wrong addressing (to/cc empty)
- Inbox URL incorrect
- Signature generation failed
- Network/DNS issues

### 5. JSON-LD Context Errors

**Symptoms:**
- Activities rejected or misinterpreted
- Properties ignored

**Check:**
```javascript
const jsonld = require('jsonld');

async function debugContext(object) {
  try {
    const expanded = await jsonld.expand(object);
    console.log('Expanded:', JSON.stringify(expanded, null, 2));
  } catch (error) {
    console.error('JSON-LD error:', error.message);
  }
}
```

## Network Debugging

### Using curl Verbose Mode

```bash
# Full request/response details
curl -v -X POST \
  -H "Content-Type: application/activity+json" \
  -H "Accept: application/activity+json" \
  -d '{"type":"Follow",...}' \
  "https://example.com/inbox"
```

### DNS/SSL Issues

```bash
# Check DNS resolution
dig example.com

# Check SSL certificate
openssl s_client -connect example.com:443 -servername example.com

# Test with SSL verification disabled (debugging only!)
curl -k "https://example.com/users/alice"
```

### Using ngrok for Local Testing

```bash
# Expose local server to internet
ngrok http 3000

# Use the ngrok URL for testing federation
# https://abc123.ngrok.io -> http://localhost:3000
```

## Comparison Testing

### Compare with Mastodon

```javascript
async function compareWithMastodon(handle) {
  // Fetch a known-working Mastodon actor
  const mastodonActor = await fetchActor('https://mastodon.social/users/Gargron');

  // Fetch your actor
  const yourActor = await fetchActor('https://your-server/users/alice');

  // Compare structure
  const mastodonKeys = Object.keys(mastodonActor).sort();
  const yourKeys = Object.keys(yourActor).sort();

  console.log('Mastodon has:', mastodonKeys);
  console.log('You have:', yourKeys);

  // Find missing keys
  const missing = mastodonKeys.filter(k => !yourKeys.includes(k));
  console.log('You are missing:', missing);
}
```

### Activity Structure Comparison

```javascript
// Capture a working activity from Mastodon
// Compare with your generated activity

function compareActivities(working, yours) {
  const diff = {};

  for (const key of Object.keys(working)) {
    if (JSON.stringify(working[key]) !== JSON.stringify(yours[key])) {
      diff[key] = {
        working: working[key],
        yours: yours[key]
      };
    }
  }

  return diff;
}
```

## Debugging Checklist

### Outgoing Federation

- [ ] WebFinger returns correct self link
- [ ] Actor is fetchable with Accept header
- [ ] Actor has publicKey
- [ ] Activities have correct @context
- [ ] Activities have actor, object, to/cc
- [ ] HTTP Signatures generated correctly
- [ ] Digest header matches body

### Incoming Federation

- [ ] Inbox accepts POST requests
- [ ] Signature verification works
- [ ] Date validation allows clock skew
- [ ] Activities are parsed correctly
- [ ] Actor is fetched and cached
- [ ] Responses use correct status codes

## Useful Tools

### Local Development

```bash
# Watch logs in real-time
tail -f activity.log | jq .

# Pretty-print JSON
cat activity.json | jq .

# Test endpoint quickly
http POST localhost:3000/inbox < activity.json
```

### Online Tools

| Tool | Purpose |
|------|---------|
| [webfinger.net](https://webfinger.net/) | Test WebFinger |
| [json-ld.org/playground](https://json-ld.org/playground/) | Validate JSON-LD |
| [requestbin.com](https://requestbin.com/) | Inspect incoming requests |

## Error Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 202 | Accepted | Success - activity queued |
| 400 | Bad Request | Check JSON structure |
| 401 | Unauthorized | Check signature |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check URL/resource |
| 406 | Not Acceptable | Check Accept header |
| 410 | Gone | Resource deleted |
| 500 | Server Error | Check server logs |

## Related Tools

- **[WebFinger Lookup](/docs/tools/webfinger-lookup)** - Test discovery
- **[Actor Inspector](/docs/tools/actor-inspector)** - Validate actors
- **[Signature Tester](/docs/tools/signature-tester)** - Debug signatures
- **[Compliance Checklist](/docs/tools/compliance-checklist)** - Full validation
