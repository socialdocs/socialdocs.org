---
sidebar_position: 16
title: Testing Your Implementation
description: Tools, test suites, and strategies for validating ActivityPub implementations
last_verified: 2026-10-15
verified_against: "Fedify CLI docs (fedify-dev/fedify docs/cli.md); activitypub.academy /api/v2/instance (Mastodon 4.1.18); Mastodon API docs (methods/search); examples/first-server and examples/verify-requests in this repository"
---

# Testing Your Implementation

Building an ActivityPub implementation requires thorough testing to ensure compatibility with the broader fediverse. This guide covers testing tools, validation strategies, and test suites available for verifying your implementation.

## Testing Levels

<svg viewBox="0 0 460 220" style={{maxWidth: '460px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="testGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="450" height="210" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="450" height="28" rx="12" fill="url(#testGrad)"/>
  <text x="230" y="24" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">TESTING PYRAMID</text>

  {/* E2E - Top */}
  <polygon points="230,50 280,90 180,90" fill="url(#testGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="230" y="78" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">E2E</text>
  <text x="448" y="75" textAnchor="end" fill="currentColor" fontSize="10" opacity="0.8">Federation tests</text>

  {/* Integration */}
  <polygon points="180,90 280,90 310,130 150,130" fill="url(#testGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="230" y="117" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">Integration</text>
  <text x="448" y="115" textAnchor="end" fill="currentColor" fontSize="10" opacity="0.8">Component tests</text>

  {/* Unit Tests */}
  <polygon points="150,130 310,130 350,170 110,170" fill="url(#testGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="230" y="157" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">Unit Tests</text>
  <text x="448" y="155" textAnchor="end" fill="currentColor" fontSize="10" opacity="0.8">Function tests</text>

  {/* Static Analysis - Base */}
  <polygon points="110,170 350,170 380,200 80,200" fill="url(#testGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="230" y="192" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600">Static Analysis</text>
  <text x="15" y="192" fill="currentColor" fontSize="9" opacity="0.8">Linting, types</text>
</svg>

## Testing Tools

There is no official, maintained W3C conformance test suite for ActivityPub. In practice, implementers test against real servers using these tools:

### Fedify CLI

The [Fedify CLI](https://fedify.dev/cli) works against any ActivityPub server, not just Fedify-based ones:

```bash
# Install
npm install -g @fedify/cli

# Fetch an actor or object (add -a / --authorized-fetch to sign the request,
# for servers that refuse unsigned fetches)
fedify lookup @alice@your-server.example

# Check WebFinger and NodeInfo
fedify webfinger @alice@your-server.example
fedify nodeinfo your-server.example

# Run an ephemeral inbox server that shows what is delivered to it
fedify inbox

# Expose a local dev server over a public HTTPS URL
fedify tunnel 3000
```

### browser.pub

[browser.pub](https://browser.pub/) lets you browse any actor, object or collection as a federated server sees it — useful for checking how your JSON renders to others.

### ActivityPub Academy

[ActivityPub Academy](https://activitypub.academy/) gives you a temporary account on a Mastodon instance that shows the ActivityPub traffic it sends and receives. It runs an old Mastodon version (4.1.18 as of October 2026), so it won't show behaviour added since, such as RFC 9421 signatures or quote posts.

### This site's tools

The [Activity Linter, Actor Inspector and Signature Inspector](/docs/tools/overview) run in your browser and check JSON and signatures against the specs and Mastodon's rules.

## Unit Testing

Test your handlers as plain functions with the network injected, so tests are fast and deterministic. The tested tutorial server does exactly this: its [`app.test.js`](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/examples/first-server/test/app.test.js) drives the HTTP handler with a fake `fetchJson` and `deliver`, using Node's built-in test runner.

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Follow is accepted and the follower stored', async () => {
  const delivered = [];
  const app = createApp({
    cfg, store,
    fetchJson: async (url) => ({ json: remoteActors[url] }), // no network
    deliver: async (inbox, activity) => { delivered.push({ inbox, activity }); return 202; },
  });
  // ...sign a Follow with a test key, POST it to the handler, then:
  assert.equal(delivered[0].activity.type, 'Accept');
});
```

### Parsing JSON-LD Shapes

Remote servers differ in how they shape the same data. Test that your code accepts each form:

- a property as a single value **and** as an array (`"to": "…"` vs `"to": ["…"]`)
- a reference as a URL string **and** as an embedded object (`"actor": "…"` vs `"actor": { "id": "…" }`)
- the public address as `https://www.w3.org/ns/activitystreams#Public`, `as:Public` or `Public` (Mastodon accepts all three)
- extension terms under their real IRIs: Mastodon's `sensitive` is `as:sensitive`, not a `toot:` term ([`context_helper.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb))

### Testing HTTP Signatures

Testing that a valid signature passes is the easy half. The bugs that matter are the requests your verifier **accepts when it shouldn't**. At minimum, test that it rejects:

- an unsigned request
- a signature that covers only some headers (e.g. just `date`) — it must cover the method and full URL, `host`, `date` and the digest
- a POST whose signature doesn't cover the digest, or whose body was swapped
- a body that was re-serialised (the digest is over the raw bytes, not `JSON.stringify(req.body)`)
- a signature replayed against a different query string
- an activity whose `actor` is not the owner of the signing key
- a key document claiming an owner whose actor document doesn't list that key
- a stale or future-dated signature (Mastodon's window is roughly 65 minutes back, 1 hour forward)
- a `keyId` that resolves to a private or loopback address

The [tested verification module](https://github.com/socialdocs/socialdocs.org/tree/gh-pages/examples/verify-requests/test) behind [Verifying incoming requests](/docs/security/verifying-requests) has a `node --test` case for each of these, plus the RFC 9421 Ed25519 test vector. Use it as a checklist, or run your own verifier against the same cases.

## Integration Testing Against a Real Server

Mocks only tell you that your code agrees with your own idea of the protocol. The tutorial server in this repository is tested against a **real GoToSocial 0.22.2** in Docker, in CI ([`examples/first-server/integration`](https://github.com/socialdocs/socialdocs.org/tree/gh-pages/examples/first-server/integration)):

- `compose.yaml` starts GoToSocial (image `superseriousbusiness/gotosocial:0.22.2`) and the server under test on a private network.
- `federate.mjs` uses GoToSocial's client API to look up the test server's account, follow it, wait for the `Accept`, publish a post on the test server and check that it reaches the GoToSocial user's home timeline.
- `run.sh` creates a throwaway CA and certificates so both sides speak HTTPS, then runs the above; the [workflow](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/.github/workflows/tutorial.yml) runs it on changes and weekly.

GoToSocial is a single container with SQLite, which makes it practical in CI. Mastodon needs PostgreSQL, Redis, web and Sidekiq processes and a TLS proxy; budget for a much larger setup if you need it.

Two things such a setup needs that production must never have: your server must be allowed to fetch and deliver to **private addresses** (the containers share a private network), and it must trust the throwaway CA. Keep both behind explicit test-only settings, as the tutorial does with `ALLOW_PRIVATE_ADDRESSES`.

### Testing WebFinger

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('WebFinger returns a JRD with a self link that loops back', async () => {
  const res = await fetch(
    'https://your-server.example/.well-known/webfinger?resource=acct:alice@your-server.example'
  );
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/jrd\+json/);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');

  const jrd = await res.json();
  assert.equal(jrd.subject, 'acct:alice@your-server.example');
  const self = jrd.links.find((l) => l.rel === 'self');
  assert.equal(self.type, 'application/activity+json');

  const actor = await (await fetch(self.href, { headers: { Accept: 'application/activity+json' } })).json();
  assert.equal(actor.id, self.href); // Mastodon requires this exact match
});

test('WebFinger returns 404 for unknown users and other domains', async () => {
  for (const r of ['acct:nobody@your-server.example', 'acct:alice@other.example']) {
    const res = await fetch(`https://your-server.example/.well-known/webfinger?resource=${encodeURIComponent(r)}`);
    assert.equal(res.status, 404);
  }
});
```

## End-to-End Testing

### Searching From a Mastodon Account

Ask a Mastodon server to resolve your account, the way a user's search does. `resolve=true` needs a user access token with the `read:search` scope ([Mastodon API: search](https://docs.joinmastodon.org/methods/search/)):

```javascript
const res = await fetch(
  `https://mastodon.example/api/v2/search?q=${encodeURIComponent('@alice@your-server.example')}&type=accounts&resolve=true`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const { accounts } = await res.json();
// accounts[0].url should be your actor's profile URL
```

Use a server you run or have permission to test against, not a large public instance.

## Validation Checklist

### Actor Validation

- [ ] Served with `Content-Type: application/activity+json`
- [ ] `@context` includes `https://www.w3.org/ns/activitystreams`
- [ ] `id` is exactly the URL it is served from
- [ ] Has `inbox`, `outbox` and `preferredUsername`
- [ ] Publishes a public key (`publicKey`, or FEP-521a `assertionMethod`)
- [ ] Returns HTML for browsers if you have a profile page (optional), with `Vary: Accept`

### Inbox Validation

- [ ] Accepts POST requests
- [ ] Verifies HTTP Signatures over the raw body
- [ ] Returns 202 Accepted for valid activities
- [ ] Returns 401 for invalid signatures
- [ ] Rejects activities whose `actor` isn't the signer
- [ ] Applies origin rules before storing objects

### Delivery Validation

- [ ] Signs every POST
- [ ] Delivers to followers' shared inboxes when available, once per server
- [ ] Never delivers to the sending actor itself
- [ ] Retries network errors and 5xx; treats most 4xx as final (see [Delivery at Scale](/docs/guides/delivery-at-scale))

### WebFinger Validation

- [ ] Responds at `/.well-known/webfinger`
- [ ] Returns `application/jrd+json`
- [ ] Sends `Access-Control-Allow-Origin`
- [ ] Contains a `self` link with an ActivityPub type whose `href` is the actor `id`
- [ ] Handles both `acct:` and URL resources

## Debugging Federation Issues

### Request Logging

```javascript
app.use((req, res, next) => {
  if (req.path.endsWith('/inbox')) {
    console.log('Federation request:', {
      method: req.method,
      path: req.originalUrl,
      signature: req.headers.signature,
      signatureInput: req.headers['signature-input'],
      digest: req.headers.digest || req.headers['content-digest'],
      contentType: req.headers['content-type']
    });
  }
  next();
});
```

When Mastodon rejects one of your requests, the reason is in the response body; see [Troubleshooting by Symptom](/docs/guides/troubleshooting).

### Testing Locally with Tunnels

Federation needs a public HTTPS hostname. A tunnel gives your machine one:

```bash
fedify tunnel 3000
# or: ngrok http 3000
```

## Common Test Scenarios

| Scenario | What to Test |
|----------|--------------|
| User follows remote user | WebFinger → Fetch Actor → Send Follow → Receive Accept |
| User receives post | Verify signature → Store in inbox → Display in timeline |
| User creates post | Create activity → Deliver to followers → Verify delivery |
| User mentions remote user | Resolve mention → Include in activity → Deliver to inbox |
| User deletes post | Send Delete → Verify tombstone → Remote removal |

## Next Steps

- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Mastodon-specific requirements
- **[Scaling and Performance](/docs/guides/scaling-and-performance)** - Production optimization
- **[WebFinger Implementation](/docs/guides/webfinger-implementation)** - User discovery
