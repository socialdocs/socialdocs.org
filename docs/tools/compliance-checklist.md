---
sidebar_position: 6
title: Compliance Checklist
description: Complete ActivityPub compliance checklist for implementations
last_verified: 2026-10-15
verified_against: "W3C ActivityPub REC, AS2 Core, RFC 7033, Mastodon v4.7.3 source (fetch_remote_actor_service.rb, json_ld_helper.rb, signed_request.rb, create.rb)"
---

# Compliance Checklist

Use this checklist to verify your ActivityPub implementation meets the specification requirements and works with other Fediverse software.

## Discovery

### WebFinger ([RFC 7033](https://www.rfc-editor.org/rfc/rfc7033))

- [ ] `GET /.well-known/webfinger?resource=acct:user@domain` answers for your local users only
- [ ] Response is `application/jrd+json`
- [ ] `subject` matches the requested resource
- [ ] A `rel="self"` link with `type="application/activity+json"` points to the actor
- [ ] Sends `Access-Control-Allow-Origin` — a **MUST** in [RFC 7033 §5](https://www.rfc-editor.org/rfc/rfc7033#section-5)

## Actor

### Required

- [ ] `id` — HTTPS URL that dereferences to this document ([AP §3.1](https://www.w3.org/TR/activitypub/#obj-id))
- [ ] `type` — `Person`, `Group`, `Service`, `Application` or `Organization`
- [ ] `inbox` and `outbox` — **MUST** ([AP §4.1](https://www.w3.org/TR/activitypub/#actor-objects)); Mastodon rejects an actor without an inbox
- [ ] `preferredUsername` (or a [FEP-2c59](https://codeberg.org/fediverse/fep/src/branch/main/fep/2c59/fep-2c59.md) `webfinger` property) — Mastodon rejects the actor without one ([source](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/fetch_remote_actor_service.rb#L34))
- [ ] `publicKey` with `id`, `owner` equal to the actor `id`, and an SPKI `publicKeyPem` — without a key no one can verify your signatures

### Recommended

- [ ] `followers` and `following` — **SHOULD** ([AP §4.1](https://www.w3.org/TR/activitypub/#actor-objects))
- [ ] `endpoints.sharedInbox` — lets servers deliver once per server
- [ ] `name`, `summary` (HTML), `icon`, `image`, `url` (the human-readable profile page)

### Content negotiation

- [ ] Actor URL returns JSON for `Accept: application/activity+json`
- [ ] Actor URL returns JSON for `Accept: application/ld+json; profile="https://www.w3.org/ns/activitystreams"`
- [ ] Response `Content-Type` is `application/activity+json` (or `application/ld+json` with the Activity Streams profile) — Mastodon discards anything else ([source](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb#L351-L361))
- [ ] Optional: HTML for browsers, with `Vary: Accept`

## Inbox

### Receiving activities

- [ ] Accepts `POST` with `application/activity+json` or `application/ld+json`
- [ ] Returns `202 Accepted` (or `200`) for activities it accepts, including types it ignores
- [ ] Returns `401` for missing or invalid signatures
- [ ] Returns `400` for malformed JSON

### Verifying requests ([tested code](/docs/security/verifying-requests))

- [ ] The signature covers `(request-target)`, `host`, `date` and `digest`
- [ ] `Digest` is checked against the **raw** request body
- [ ] `Date` is within a window (Mastodon: 5 minutes plus 1 hour of clock skew)
- [ ] The key is fetched from `keyId` safely (no private addresses — SSRF) and is listed by its owner actor
- [ ] The key's owner **is** `activity.actor`
- [ ] Embedded objects come from the actor's origin ([origin rules](/docs/security/origin-model))

### Activity handling

- [ ] `Create` — store new content
- [ ] `Update` — only from the object's owner
- [ ] `Delete` — only from the object's owner ([Deletion](/docs/guides/deletion))
- [ ] `Follow` → send `Accept` or `Reject`
- [ ] `Accept` / `Reject` — only for a `Follow` you actually sent
- [ ] `Undo` — reverses `Follow`, `Like`, `Announce`, `Block`
- [ ] `Like`, `Announce`
- [ ] `Block` — Mastodon sends it; stop delivering to the blocker

## Outbox and delivery

- [ ] `GET` returns an `OrderedCollection`, reverse chronological, paginated
- [ ] Every activity has `@context`, a unique `id`, `type` and `actor`
- [ ] Delivery goes to each recipient inbox, using `sharedInbox` when available
- [ ] Requests are signed (draft-cavage `rsa-sha256` is what most servers verify; see [HTTP signatures in 2026](/docs/specs/http-signatures/overview))
- [ ] `Digest` and `Date` headers are sent and signed
- [ ] Failed deliveries are retried with backoff; `404`/`410` are final ([Delivery at Scale](/docs/guides/delivery-at-scale))

## Collections

- [ ] `followers` and `following` exist
- [ ] They are `OrderedCollection` or `Collection`, with `totalItems`
- [ ] Large collections are paginated (`first`, `next`)

## Objects

### Notes and posts

- [ ] `type` is `Note` (or `Article`, `Question`, …)
- [ ] `id` is a unique HTTPS URL on your server
- [ ] `attributedTo` is the author
- [ ] `content` is HTML
- [ ] `published` is an RFC 3339 date-time, e.g. `2026-10-15T12:00:00Z` ([AS2 §2.3](https://www.w3.org/TR/activitystreams-core/#dates))
- [ ] `to`/`cc` address the right audience (a single value or an array)
- [ ] `inReplyTo` on replies; `tag` with `Mention` and `Hashtag` entries

## Interoperability

### Mastodon

- [ ] Every addressed actor in a direct message has a `Mention` tag (otherwise Mastodon treats it as "limited")
- [ ] `sensitive` and `summary` (content warning) are honoured
- [ ] `manuallyApprovesFollowers` is respected for locked accounts
- [ ] Optional Mastodon extensions from the `toot:` namespace — `Emoji`, `blurhash`, `discoverable`, `indexable` — only if you use them ([Mastodon's extensions](https://docs.joinmastodon.org/spec/activitypub/#contexts))

### Federation testing

- [ ] Can follow, and be followed by, a Mastodon account
- [ ] Posts appear on Mastodon, and Mastodon posts arrive
- [ ] Likes and boosts arrive
- [ ] Replies thread correctly ([Threads](/docs/guides/threads-replies-and-backfill))

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

  // Mastodon uses application/activity+json; some servers use the
  // ld+json profile type instead, so accept both
  const selfLink = data.links?.find(l =>
    l.rel === 'self' && /^application\/(activity\+json|ld\+json)/.test(l.type || '')
  );

  if (!selfLink) {
    return { success: false, error: 'Missing self link' };
  }

  return { success: true, actorUrl: selfLink.href };
}

async function testActor(domain, username) {
  const wf = await testWebFinger(domain, username);
  if (!wf.success) return wf;

  // Unsigned: servers in secure mode (e.g. mastodon.social) answer 401
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
**Date:** 2026-10-15
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

- **[WebFinger Lookup](/docs/guides/webfinger-implementation#lookup-tools)** - Test discovery
- **[Actor Inspector](/docs/tools/actor-inspector)** - Validate actors
- **[HTTP signatures in 2026](/docs/specs/http-signatures/overview)** - Debugging 401s
- **[Troubleshooting by symptom](/docs/guides/troubleshooting)** - Troubleshooting
