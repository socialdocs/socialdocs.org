---
sidebar_position: 6
title: Compliance Checklist
description: Complete ActivityPub compliance checklist for implementations
---

# Compliance Checklist

Use this checklist to verify your ActivityPub implementation meets the specification requirements and works with other Fediverse software.

## Core Requirements

### WebFinger (Discovery)

<svg viewBox="0 0 480 200" style={{maxWidth: '480px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="wfcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="470" height="190" rx="10" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="470" height="26" rx="10" fill="url(#wfcGrad)"/>
  <text x="240" y="23" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">WEBFINGER</text>

  <text x="25" y="50" fill="currentColor" fontSize="10">☐ /.well-known/webfinger endpoint exists</text>
  <text x="25" y="68" fill="currentColor" fontSize="10">☐ Accepts ?resource=acct:user@domain parameter</text>
  <text x="25" y="86" fill="currentColor" fontSize="10">☐ Returns application/jrd+json content type</text>
  <text x="25" y="104" fill="currentColor" fontSize="10">☐ Response includes subject matching request</text>
  <text x="25" y="122" fill="currentColor" fontSize="10">☐ Response includes self link</text>
  <text x="25" y="140" fill="currentColor" fontSize="10">☐ Self link has type: application/activity+json</text>
  <text x="25" y="158" fill="currentColor" fontSize="10">☐ Self link href points to actor</text>
  <text x="25" y="176" fill="currentColor" fontSize="10">☐ CORS headers allow cross-origin requests</text>
</svg>

### Actor

<svg viewBox="0 0 520 320" style={{maxWidth: '520px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="actcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="510" height="310" rx="10" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="510" height="26" rx="10" fill="url(#actcGrad)"/>
  <text x="260" y="23" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">ACTOR</text>

  <text x="25" y="50" fill="#6364FF" fontSize="11" fontWeight="600">Required:</text>
  <text x="25" y="68" fill="currentColor" fontSize="10">☐ id - HTTPS URL, dereferenceable</text>
  <text x="25" y="84" fill="currentColor" fontSize="10">☐ type - Person, Group, Service, etc.</text>
  <text x="25" y="100" fill="currentColor" fontSize="10">☐ inbox - URL for receiving activities</text>
  <text x="25" y="116" fill="currentColor" fontSize="10">☐ outbox - URL for published activities</text>

  <text x="25" y="140" fill="#6364FF" fontSize="11" fontWeight="600">Recommended:</text>
  <text x="25" y="158" fill="currentColor" fontSize="10">☐ preferredUsername - the @handle</text>
  <text x="25" y="174" fill="currentColor" fontSize="10">☐ name - display name</text>
  <text x="25" y="190" fill="currentColor" fontSize="10">☐ summary - bio (HTML)</text>
  <text x="25" y="206" fill="currentColor" fontSize="10">☐ publicKey - for HTTP Signatures</text>
  <text x="260" y="158" fill="currentColor" fontSize="10">☐ publicKey.id - key identifier</text>
  <text x="260" y="174" fill="currentColor" fontSize="10">☐ publicKey.owner - matches actor id</text>
  <text x="260" y="190" fill="currentColor" fontSize="10">☐ publicKey.publicKeyPem - PEM format</text>
  <text x="260" y="206" fill="currentColor" fontSize="10">☐ followers/following - collection URLs</text>
  <text x="260" y="222" fill="currentColor" fontSize="10">☐ endpoints.sharedInbox - efficient delivery</text>

  <text x="25" y="250" fill="#6364FF" fontSize="11" fontWeight="600">Optional:</text>
  <text x="25" y="268" fill="currentColor" fontSize="10">☐ icon - avatar image</text>
  <text x="25" y="284" fill="currentColor" fontSize="10">☐ image - header/banner image</text>
  <text x="25" y="300" fill="currentColor" fontSize="10">☐ url - profile page URL</text>
</svg>

### Content Negotiation

```
[ ] Actor URL returns JSON when Accept: application/activity+json
[ ] Actor URL returns JSON when Accept: application/ld+json
[ ] Actor URL returns HTML for browsers (optional but recommended)
[ ] Content-Type header is application/activity+json
```

## Inbox

### Receiving Activities

```
┌────────────────────────────────────────────────────────────┐
│                      INBOX                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [ ] Accepts POST requests                                 │
│  [ ] Accepts application/activity+json content             │
│  [ ] Accepts application/ld+json content                   │
│  [ ] Returns 202 Accepted for valid activities             │
│  [ ] Returns 401/403 for invalid signatures                │
│  [ ] Returns 400 for malformed JSON                        │
│                                                            │
│  Signature Verification:                                   │
│  [ ] Parses Signature header                               │
│  [ ] Fetches public key from keyId                        │
│  [ ] Verifies signature against request                    │
│  [ ] Allows reasonable clock skew (~30 seconds)            │
│  [ ] Verifies Digest header if present                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Activity Handling

```
[ ] Create - creates new content
[ ] Update - updates existing content (check authorization)
[ ] Delete - deletes content (check authorization)
[ ] Follow - records follow request
[ ] Accept - confirms follow
[ ] Reject - denies follow
[ ] Undo - reverses previous activity
[ ] Like - records like
[ ] Announce - records boost/share
[ ] Block - handles block (optional)
```

## Outbox

### Sending Activities

```
┌────────────────────────────────────────────────────────────┐
│                     OUTBOX                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [ ] GET returns OrderedCollection                         │
│  [ ] Collection is paginated                               │
│  [ ] Activities include required properties                │
│  [ ] Activities have @context                              │
│  [ ] Activities have unique id                             │
│  [ ] Activities have actor                                 │
│  [ ] Activities have type                                  │
│                                                            │
│  Delivery:                                                 │
│  [ ] Delivers to recipient inboxes                         │
│  [ ] Uses shared inbox when available                      │
│  [ ] Signs requests with HTTP Signatures                   │
│  [ ] Includes Digest header                                │
│  [ ] Includes proper Date header                           │
│  [ ] Retries on temporary failures                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## HTTP Signatures

```
┌────────────────────────────────────────────────────────────┐
│                 HTTP SIGNATURES                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Generation:                                               │
│  [ ] Uses RSA-SHA256 algorithm                             │
│  [ ] Includes (request-target) pseudo-header               │
│  [ ] Includes host header                                  │
│  [ ] Includes date header                                  │
│  [ ] Includes digest header                                │
│  [ ] keyId points to actor's publicKey                     │
│  [ ] Signature is base64 encoded                           │
│                                                            │
│  Verification:                                             │
│  [ ] Parses Signature header correctly                     │
│  [ ] Fetches key from keyId URL                            │
│  [ ] Rebuilds signing string in correct order              │
│  [ ] Uses correct algorithm                                │
│  [ ] Validates date is recent                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Collections

```
[ ] Followers collection exists
[ ] Following collection exists
[ ] Collections return OrderedCollection or Collection
[ ] Collections include totalItems
[ ] Large collections are paginated
[ ] Page navigation (first, next, prev) works
[ ] Collection items are ordered (newest first typical)
```

## Objects

### Notes/Posts

```
[ ] type is Note (or Article, etc.)
[ ] id is unique HTTPS URL
[ ] attributedTo points to author
[ ] content is HTML-formatted
[ ] published is ISO 8601 datetime
[ ] to/cc arrays for addressing
[ ] inReplyTo for replies
[ ] tag array for mentions/hashtags
```

### Activities

```
[ ] @context includes ActivityStreams
[ ] type is valid activity type
[ ] id is unique HTTPS URL
[ ] actor is author's ID
[ ] object is content or reference
[ ] published is ISO 8601 datetime
[ ] to/cc copied from object or set appropriately
```

## Interoperability

### Mastodon Compatibility

```
[ ] Uses toot: namespace for extensions
[ ] Includes blurhash for images
[ ] Handles sensitive content flag
[ ] Supports custom emoji
[ ] Handles manuallyApprovesFollowers
[ ] Supports discoverable flag
```

### Federation Testing

```
[ ] Can follow Mastodon users
[ ] Can be followed by Mastodon users
[ ] Posts appear on Mastodon
[ ] Receives posts from Mastodon
[ ] Likes are received
[ ] Boosts are received
[ ] Replies thread correctly
```

## Automated Testing

### Test Script

```javascript
async function runComplianceTests(domain, username) {
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // WebFinger test
  try {
    const wf = await testWebFinger(domain, username);
    if (wf.success) {
      results.passed.push('WebFinger');
    } else {
      results.failed.push(`WebFinger: ${wf.error}`);
    }
  } catch (e) {
    results.failed.push(`WebFinger: ${e.message}`);
  }

  // Actor test
  try {
    const actor = await testActor(domain, username);
    if (actor.success) {
      results.passed.push('Actor');
    } else {
      results.failed.push(`Actor: ${actor.error}`);
    }
  } catch (e) {
    results.failed.push(`Actor: ${e.message}`);
  }

  // Add more tests...

  return results;
}

async function testWebFinger(domain, username) {
  const url = `https://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`;
  const res = await fetch(url);

  if (res.status !== 200) {
    return { success: false, error: `Status ${res.status}` };
  }

  const data = await res.json();

  if (!data.subject) {
    return { success: false, error: 'Missing subject' };
  }

  const selfLink = data.links?.find(l =>
    l.rel === 'self' && l.type === 'application/activity+json'
  );

  if (!selfLink) {
    return { success: false, error: 'Missing self link' };
  }

  return { success: true, actorUrl: selfLink.href };
}

async function testActor(domain, username) {
  const wf = await testWebFinger(domain, username);
  if (!wf.success) return wf;

  const res = await fetch(wf.actorUrl, {
    headers: { 'Accept': 'application/activity+json' }
  });

  if (res.status !== 200) {
    return { success: false, error: `Status ${res.status}` };
  }

  const actor = await res.json();

  const required = ['id', 'type', 'inbox', 'outbox'];
  const missing = required.filter(k => !actor[k]);

  if (missing.length > 0) {
    return { success: false, error: `Missing: ${missing.join(', ')}` };
  }

  return { success: true, actor };
}
```

## Test Results Template

```markdown
# ActivityPub Compliance Report

**Server:** example.com
**Date:** 2024-01-15
**Tester:** [your name]

## Summary
- Passed: 25/30
- Failed: 3/30
- Warnings: 2

## Results

### Discovery
- [x] WebFinger endpoint
- [x] Self link present
- [ ] CORS headers - Missing Access-Control-Allow-Origin

### Actor
- [x] Required properties
- [x] Public key
- [ ] Shared inbox - Not configured

### Inbox
- [x] Accepts activities
- [x] Signature verification
- [x] Activity handling

### Outbox
- [x] Returns collection
- [x] Delivery works
- [ ] Retry logic - Not implemented

## Recommendations
1. Add CORS headers to WebFinger
2. Configure shared inbox for efficiency
3. Implement delivery retry queue
```

## Related Tools

- **[WebFinger Lookup](/docs/tools/webfinger-lookup)** - Test discovery
- **[Actor Inspector](/docs/tools/actor-inspector)** - Validate actors
- **[Signature Tester](/docs/tools/signature-tester)** - Debug signatures
- **[Debugging Tips](/docs/tools/debugging-tips)** - Troubleshooting
