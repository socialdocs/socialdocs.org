---
sidebar_position: 16
title: Testing Your Implementation
description: Tools, test suites, and strategies for validating ActivityPub implementations
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
  <text x="340" y="75" fill="currentColor" fontSize="10" opacity="0.8">Federation tests</text>

  {/* Integration */}
  <polygon points="180,90 280,90 310,130 150,130" fill="url(#testGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="230" y="117" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">Integration</text>
  <text x="370" y="115" fill="currentColor" fontSize="10" opacity="0.8">Component tests</text>

  {/* Unit Tests */}
  <polygon points="150,130 310,130 350,170 110,170" fill="url(#testGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="230" y="157" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">Unit Tests</text>
  <text x="390" y="155" fill="currentColor" fontSize="10" opacity="0.8">Function tests</text>

  {/* Static Analysis - Base */}
  <polygon points="110,170 350,170 380,200 80,200" fill="url(#testGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="230" y="192" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="600">Static Analysis</text>
  <text x="25" y="192" fill="currentColor" fontSize="9" opacity="0.8">Linting, types</text>
</svg>

## Test Suites

### ActivityPub Test Suite (activitypub-testsuite)

The official W3C-endorsed test suite for validating ActivityPub compliance:

```bash
# Clone the test suite
git clone https://github.com/w3c/activitypub

# Run against your server
npm install
npm test -- --server https://your-server.example
```

**Tests include:**
- Actor endpoint validation
- Inbox/Outbox delivery
- Activity type handling
- HTTP Signatures verification
- Content negotiation

### ap-test

A lightweight testing tool for quick validation:

```bash
# Install
npm install -g ap-test

# Test an actor
ap-test actor https://your-server.example/users/alice

# Test WebFinger
ap-test webfinger alice@your-server.example

# Test inbox delivery
ap-test inbox https://your-server.example/users/alice/inbox
```

### Fediverse Test Suite

Community-maintained comprehensive tests:

```javascript
const FediTest = require('fediverse-test-suite');

const tester = new FediTest({
  server: 'https://your-server.example',
  testUser: 'testbot'
});

// Run all tests
const results = await tester.runAll();

// Run specific category
const actorResults = await tester.runCategory('actors');
const deliveryResults = await tester.runCategory('delivery');
```

## Unit Testing

### Testing JSON-LD Parsing

```javascript
const { expect } = require('chai');
const { parseActivity } = require('../src/activitypub');

describe('Activity Parsing', () => {
  it('should parse Create activity', () => {
    const activity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Create',
      actor: 'https://example.com/users/alice',
      object: {
        type: 'Note',
        content: 'Hello world'
      }
    };

    const parsed = parseActivity(activity);

    expect(parsed.type).to.equal('Create');
    expect(parsed.object.type).to.equal('Note');
  });

  it('should handle compact IRIs', () => {
    const activity = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        { 'toot': 'http://joinmastodon.org/ns#' }
      ],
      type: 'Create',
      'toot:sensitive': true
    };

    const parsed = parseActivity(activity);
    expect(parsed.sensitive).to.be.true;
  });
});
```

### Testing HTTP Signatures

```javascript
describe('HTTP Signatures', () => {
  const { signRequest, verifySignature } = require('../src/signatures');
  const crypto = require('crypto');

  let keyPair;

  before(() => {
    keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
  });

  it('should sign a request', () => {
    const request = {
      method: 'POST',
      url: 'https://example.com/inbox',
      headers: {
        host: 'example.com',
        date: new Date().toUTCString()
      },
      body: JSON.stringify({ type: 'Create' })
    };

    const signed = signRequest(request, {
      keyId: 'https://example.com/users/alice#main-key',
      privateKey: keyPair.privateKey
    });

    expect(signed.headers.signature).to.exist;
  });

  it('should verify a valid signature', async () => {
    const request = signRequest(/* ... */);

    const isValid = await verifySignature(request, async (keyId) => {
      return keyPair.publicKey;
    });

    expect(isValid).to.be.true;
  });

  it('should reject tampered requests', async () => {
    const request = signRequest(/* ... */);
    request.body = 'tampered content';

    const isValid = await verifySignature(request, /* ... */);
    expect(isValid).to.be.false;
  });
});
```

### Testing Activity Handlers

```javascript
describe('Inbox Handlers', () => {
  const { processActivity } = require('../src/inbox');
  const db = require('../src/db');

  beforeEach(async () => {
    await db.clear();
  });

  describe('Follow', () => {
    it('should create follower record', async () => {
      const activity = {
        type: 'Follow',
        actor: 'https://remote.example/users/bob',
        object: 'https://local.example/users/alice'
      };

      await processActivity(activity, { verified: true });

      const record = await db.followers.findOne({
        actor: activity.object,
        follower: activity.actor
      });

      expect(record).to.exist;
    });

    it('should auto-accept for unlocked accounts', async () => {
      // ... test Accept generation
    });

    it('should require approval for locked accounts', async () => {
      // ... test pending follow requests
    });
  });

  describe('Create', () => {
    it('should store Note in inbox', async () => {
      const activity = {
        type: 'Create',
        actor: 'https://remote.example/users/bob',
        object: {
          type: 'Note',
          id: 'https://remote.example/notes/123',
          content: 'Hello!'
        },
        to: ['https://local.example/users/alice']
      };

      await processActivity(activity, { verified: true });

      const note = await db.notes.findOne({
        id: activity.object.id
      });

      expect(note).to.exist;
      expect(note.content).to.equal('Hello!');
    });
  });
});
```

## Integration Testing

### Testing with a Mock Server

```javascript
const express = require('express');
const { expect } = require('chai');

describe('Federation Integration', () => {
  let mockServer;
  let mockServerUrl;
  let inboxReceived = [];

  before((done) => {
    const app = express();
    app.use(express.json({ type: '*/*' }));

    // Mock actor endpoint
    app.get('/users/remote', (req, res) => {
      res.json({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Person',
        id: `${mockServerUrl}/users/remote`,
        inbox: `${mockServerUrl}/inbox`,
        outbox: `${mockServerUrl}/outbox`,
        preferredUsername: 'remote'
      });
    });

    // Mock inbox
    app.post('/inbox', (req, res) => {
      inboxReceived.push(req.body);
      res.status(202).end();
    });

    mockServer = app.listen(0, () => {
      mockServerUrl = `http://localhost:${mockServer.address().port}`;
      done();
    });
  });

  after(() => mockServer.close());

  it('should deliver activities to remote inbox', async () => {
    const { sendFollow } = require('../src/outbox');

    await sendFollow(
      localActor,
      { id: `${mockServerUrl}/users/remote` }
    );

    // Wait for delivery
    await new Promise(r => setTimeout(r, 1000));

    expect(inboxReceived).to.have.length(1);
    expect(inboxReceived[0].type).to.equal('Follow');
  });
});
```

### Testing WebFinger

```javascript
describe('WebFinger', () => {
  it('should return JRD for valid user', async () => {
    const response = await fetch(
      'https://your-server.example/.well-known/webfinger?resource=acct:alice@your-server.example',
      { headers: { Accept: 'application/jrd+json' } }
    );

    expect(response.status).to.equal(200);
    expect(response.headers.get('content-type')).to.include('application/jrd+json');

    const jrd = await response.json();
    expect(jrd.subject).to.equal('acct:alice@your-server.example');
    expect(jrd.links).to.be.an('array');

    const selfLink = jrd.links.find(l => l.rel === 'self');
    expect(selfLink.type).to.equal('application/activity+json');
  });

  it('should return 404 for unknown user', async () => {
    const response = await fetch(
      'https://your-server.example/.well-known/webfinger?resource=acct:nobody@your-server.example'
    );

    expect(response.status).to.equal(404);
  });
});
```

## End-to-End Testing

### Testing with Real Instances

Use disposable test instances:

```javascript
describe('Mastodon Compatibility', () => {
  const mastodonInstance = 'https://mastodon.social';

  it('should be discoverable via WebFinger', async () => {
    // Test that Mastodon can find your users
    const response = await fetch(
      `${mastodonInstance}/api/v2/search?q=alice@your-server.example&resolve=true`,
      { headers: { Authorization: `Bearer ${testToken}` } }
    );

    const data = await response.json();
    expect(data.accounts).to.have.length.gt(0);
  });
});
```

### Using Docker for Test Environments

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  your-server:
    build: .
    environment:
      - DATABASE_URL=postgres://test:test@db/test
      - DOMAIN=test.localhost
    ports:
      - "3000:3000"

  mastodon:
    image: tootsuite/mastodon:latest
    environment:
      - LOCAL_DOMAIN=mastodon.localhost
    ports:
      - "3001:3000"

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=test
```

```bash
# Run integration tests
docker-compose -f docker-compose.test.yml up -d
npm run test:e2e
docker-compose -f docker-compose.test.yml down
```

## Validation Checklist

### Actor Validation

- [ ] Returns valid JSON-LD with @context
- [ ] Has unique, dereferenceable id
- [ ] Contains inbox and outbox URLs
- [ ] Has valid preferredUsername
- [ ] publicKey contains valid RSA public key
- [ ] Content negotiation returns ActivityPub for appropriate Accept headers
- [ ] Returns HTML for browser requests

### Inbox Validation

- [ ] Accepts POST requests
- [ ] Verifies HTTP Signatures
- [ ] Returns 202 Accepted for valid activities
- [ ] Returns 401/403 for invalid signatures
- [ ] Handles all required activity types
- [ ] Rejects activities with wrong actor

### Outbox Validation

- [ ] Supports GET for fetching activities
- [ ] Delivers activities to recipient inboxes
- [ ] Signs requests with valid HTTP Signatures
- [ ] Uses shared inbox when available
- [ ] Implements retry logic for failed deliveries

### WebFinger Validation

- [ ] Responds at /.well-known/webfinger
- [ ] Returns application/jrd+json
- [ ] Includes CORS headers
- [ ] Contains self link with ActivityPub type
- [ ] Handles both acct: and URL resources

## Automated Testing Tools

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: ActivityPub Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:test@localhost/test

      - name: Run ActivityPub compliance tests
        run: npm run test:activitypub
```

### Linting ActivityPub Objects

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

// ActivityStreams schema (simplified)
const activitySchema = {
  type: 'object',
  required: ['@context', 'type'],
  properties: {
    '@context': {
      oneOf: [
        { type: 'string', const: 'https://www.w3.org/ns/activitystreams' },
        { type: 'array', items: { type: ['string', 'object'] } }
      ]
    },
    type: { type: 'string' },
    id: { type: 'string', format: 'uri' },
    actor: { type: 'string', format: 'uri' },
    object: { type: ['string', 'object'] }
  }
};

const validate = ajv.compile(activitySchema);

function lintActivity(activity) {
  const valid = validate(activity);
  if (!valid) {
    return { valid: false, errors: validate.errors };
  }
  return { valid: true };
}
```

## Debugging Federation Issues

### Request Logging

```javascript
app.use((req, res, next) => {
  if (req.path.includes('/inbox') || req.path.includes('/outbox')) {
    console.log('Federation Request:', {
      method: req.method,
      path: req.path,
      headers: {
        signature: req.headers.signature,
        digest: req.headers.digest,
        contentType: req.headers['content-type']
      },
      body: req.body
    });
  }
  next();
});
```

### Testing Locally with Tunnels

```bash
# Use ngrok to expose local server
ngrok http 3000

# Your server is now accessible at https://xxxx.ngrok.io
# Test federation with real instances
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
