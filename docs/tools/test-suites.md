---
sidebar_position: 2
title: Test Suites
description: Test suites and frameworks for validating ActivityPub implementations
last_verified: 2026-10-15
verified_against: "GitHub API (steve-bate/activitypub-testsuite, fediverse-devnet/feditest, go-fed/testsuite) on 2026-10-15, fedify.dev/cli, Express 5 req.accepts behaviour, examples/verify-requests"
---

# Test Suites

There is no official, maintained ActivityPub conformance suite. This page lists the test suites that exist, their status, and how to write your own interop tests.

## Why Test Your Implementation?

- **Protocol Compliance**: Ensure your implementation follows the ActivityPub specification
- **Interoperability**: Verify your server can communicate with other Fediverse software
- **Regression Prevention**: Catch breaking changes before deployment
- **Edge Cases**: Discover handling issues for uncommon but valid ActivityPub scenarios

## Available Test Suites

### activitypub-testsuite (steve-bate)

A server-independent ActivityPub integration test suite written in Python with [pytest](https://docs.pytest.org/).

- **URL**: [github.com/steve-bate/activitypub-testsuite](https://github.com/steve-bate/activitypub-testsuite)
- **Language**: Python (tests any server, whatever its language)
- **Status**: Active (last updated March 2026)
- **How it's used**: it is not a standalone tool. Per its README, you create a server-specific test project that implements the support code for your server, then reuse the shared tests. Follow the repository's README for setup.

### FediTest

A framework for running scripted interoperability tests between real Fediverse implementations.

- **URL**: [github.com/fediverse-devnet/feditest](https://github.com/fediverse-devnet/feditest)
- **Language**: Python
- **Status**: Little activity since December 2024

### go-fed testsuite

A test suite from the go-fed project.

- **URL**: [github.com/go-fed/testsuite](https://github.com/go-fed/testsuite)
- **Language**: Go
- **Status**: Unmaintained (last updated September 2020)

### Hands-on alternatives

For day-to-day interop testing, most developers use live tools rather than a conformance suite: [BrowserPub](https://browser.pub/), the [Fedify CLI](https://fedify.dev/cli) (`fedify lookup`, `fedify inbox`), and [ActivityPub Academy](https://activitypub.academy/). See [Testing & debugging tools](/docs/tools/overview).

## Running Tests Against Your Server

### Basic Test Setup

Most test suites require:

1. **A running server** with a test actor
2. **HTTP access** to your server's endpoints
3. **Test configuration** pointing to your server

For activitypub-testsuite, follow the setup in its [README](https://github.com/steve-bate/activitypub-testsuite); it needs a small server-specific support project rather than just a URL.

### Testing in Development

For local development, expose your local server over public HTTPS so other servers can reach it — for example with [`fedify tunnel`](https://fedify.dev/cli) or ngrok:

```bash
# Start your local server
npm run dev  # or your server's start command

# In another terminal, expose it (either works)
fedify tunnel 3000
ngrok http 3000

# Use the public HTTPS URL the tunnel prints for testing
```

## What to Test

### Core Functionality

| Test Area | What to Verify |
|-----------|----------------|
| Actor endpoints | Profile returns valid JSON-LD |
| WebFinger | Discovery returns correct links |
| Inbox POST | Activities are accepted and processed |
| Outbox GET | Returns valid OrderedCollection |
| HTTP Signatures | Signatures verify correctly |

### Activity Handling

| Activity | Test Cases |
|----------|------------|
| Create | Object is created and stored |
| Follow | Follower is added, Accept/Reject sent |
| Like | Like is recorded |
| Announce | Boost is recorded |
| Delete | Object is removed or tombstoned |
| Undo | Previous activity is reversed |

### Federation Flows

```
Test: Complete Follow Flow
1. Actor A sends Follow to Actor B
2. Actor B's server receives and verifies signature
3. Actor B's server sends Accept
4. Actor A receives Accept
5. Actor A is now in Actor B's followers
6. Actor B's posts are delivered to Actor A
```

## Creating Your Own Tests

### Simple HTTP Test

```javascript
import assert from 'node:assert';

async function testActorEndpoint(actorUrl) {
  const response = await fetch(actorUrl, {
    headers: { 'Accept': 'application/activity+json' }
  });

  assert.strictEqual(response.status, 200);

  const actor = await response.json();

  // Required properties
  assert.ok(actor['@context'], 'Missing @context');
  assert.ok(actor.type, 'Missing type');
  assert.ok(actor.id, 'Missing id');
  assert.ok(actor.inbox, 'Missing inbox');
  assert.ok(actor.outbox, 'Missing outbox');

  console.log('✓ Actor endpoint valid');
}
```

### Testing Signature Verification

This uses `signCavage` from the site's tested [`examples/verify-requests`](https://github.com/socialdocs/socialdocs.org/tree/gh-pages/examples/verify-requests) module (`privateKey` is a Node `KeyObject`). Also test the failure cases — a tampered body, a signature that doesn't cover `digest`, a key owned by a different actor — and expect `401`; the module's own tests list the cases worth covering.

```javascript
import assert from 'node:assert';
import { signCavage } from './examples/verify-requests/src/index.js';

async function testSignatureVerification(inboxUrl, activity, privateKey, keyId) {
  const body = JSON.stringify(activity);
  const signed = signCavage({ method: 'POST', url: inboxUrl, body, keyId, privateKey });

  const response = await fetch(inboxUrl, {
    method: 'POST',
    headers: { ...signed, 'content-type': 'application/activity+json' },
    body
  });

  // Should accept with valid signature
  assert.ok(response.status >= 200 && response.status < 300,
    `Expected 2xx, got ${response.status}`);

  console.log('✓ Signature accepted');
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: ActivityPub Compliance Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Start server
        run: |
          npm ci
          npm start &
          npx wait-on http://localhost:3000

      - name: Run your ActivityPub smoke tests
        # e.g. the actor-endpoint and signature tests from this page
        run: node test/activitypub-smoke.test.js
```

## Common Test Failures

### Signature Issues

**Problem**: `401 Unauthorized` on inbox POST

**Common causes**:
- Clock skew between servers
- Wrong algorithm in signature
- Key not found at keyId URL
- Digest mismatch

### Content Negotiation

**Problem**: HTML returned instead of JSON

**Solution**: Pick the best match from *all* the types you serve. Browsers send `*/*`, so `req.accepts('application/activity+json')` on its own is truthy for them too:
```javascript
res.vary('Accept');
const type = req.accepts(['text/html', 'application/activity+json', 'application/ld+json']);
if (type === 'text/html') return res.send(renderProfilePage());
return res.type('application/activity+json').json(actor);
```

### Missing Required Fields

**Problem**: Test expects fields your implementation doesn't provide

**Solution**: Check the spec for required vs optional fields. The spec minimum is `id`, `type`, `inbox` and `outbox` ([AP §4.1](https://www.w3.org/TR/activitypub/#actor-objects)); to federate with Mastodon you also need `preferredUsername` and a `publicKey`:
```json
{
  "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "preferredUsername": "alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

## Resources

- [Fediverse Enhancement Proposals](https://codeberg.org/fediverse/fep) - FEP specifications to test against

## Next Steps

- **[Troubleshooting by symptom](/docs/guides/troubleshooting)** - Troubleshoot test failures
- **[Compliance Checklist](/docs/tools/compliance-checklist)** - Manual compliance verification
- **[Validating activities](/docs/tools/activity-validator)** - Check individual activities
