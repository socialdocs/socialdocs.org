---
sidebar_position: 6
title: Compliance Checklist
description: Complete ActivityPub compliance checklist for implementations
---

# Compliance Checklist

Use this checklist to verify your ActivityPub implementation meets the specification requirements and works with other Fediverse software.

## Core Requirements

### WebFinger (Discovery)

```
┌────────────────────────────────────────────────────────────┐
│                    WEBFINGER                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [ ] /.well-known/webfinger endpoint exists               │
│  [ ] Accepts ?resource=acct:user@domain parameter          │
│  [ ] Returns application/jrd+json content type             │
│  [ ] Response includes subject matching request            │
│  [ ] Response includes self link                           │
│  [ ] Self link has type: application/activity+json        │
│  [ ] Self link href points to actor                        │
│  [ ] CORS headers allow cross-origin requests              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Actor

```
┌────────────────────────────────────────────────────────────┐
│                      ACTOR                                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Required:                                                 │
│  [ ] id - HTTPS URL, dereferenceable                      │
│  [ ] type - Person, Group, Service, etc.                  │
│  [ ] inbox - URL for receiving activities                  │
│  [ ] outbox - URL for published activities                 │
│                                                            │
│  Recommended:                                              │
│  [ ] preferredUsername - the @handle                       │
│  [ ] name - display name                                   │
│  [ ] summary - bio (HTML)                                  │
│  [ ] publicKey - for HTTP Signatures                       │
│  [ ] publicKey.id - key identifier                         │
│  [ ] publicKey.owner - matches actor id                    │
│  [ ] publicKey.publicKeyPem - PEM format                   │
│  [ ] followers - collection URL                            │
│  [ ] following - collection URL                            │
│  [ ] endpoints.sharedInbox - for efficient delivery        │
│                                                            │
│  Optional:                                                 │
│  [ ] icon - avatar image                                   │
│  [ ] image - header/banner image                           │
│  [ ] url - profile page URL                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

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
