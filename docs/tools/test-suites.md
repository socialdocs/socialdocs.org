---
sidebar_position: 2
title: Test Suites
description: Test suites and frameworks for validating ActivityPub implementations
---

# Test Suites

Testing your ActivityPub implementation is crucial for ensuring interoperability with the broader Fediverse. These test suites help validate protocol compliance and catch issues before they affect federation.

## Why Test Your Implementation?

- **Protocol Compliance**: Ensure your implementation follows the ActivityPub specification
- **Interoperability**: Verify your server can communicate with other Fediverse software
- **Regression Prevention**: Catch breaking changes before deployment
- **Edge Cases**: Discover handling issues for uncommon but valid ActivityPub scenarios

## Available Test Suites

### ActivityPub Test Suite

A robust suite offering comprehensive testing tools for validating ActivityPub implementations against protocol specifications.

- **URL**: [github.com/activitypub-testsuite](https://github.com/steve-bate/activitypub-testsuite)
- **Language**: Python
- **Focus**: Protocol compliance testing

**Features:**
- Tests for inbox/outbox handling
- Signature verification tests
- Activity delivery validation
- Collection pagination tests

### Fediverse Test Framework

A project aimed at providing a comprehensive framework for testing Fediverse technologies.

- **URL**: [codeberg.org/fediverse/fediverse-test-framework](https://codeberg.org/fediverse/fediverse-test-framework)
- **Focus**: End-to-end Fediverse testing

**Features:**
- Multi-platform testing support
- Federation flow validation
- Interoperability checks between implementations

### FEP Testing

Feature files written in Gherkin syntax for testing Fediverse Enhancement Proposals and core functionality.

- **URL**: [codeberg.org/fediverse/fep-testing](https://codeberg.org/fediverse/fep-testing)
- **Language**: Gherkin/Cucumber
- **Focus**: Behavior-driven testing

**Features:**
- Human-readable test scenarios
- FEP compliance validation
- Easy to extend with new test cases

```gherkin
Feature: Follow Activity
  Scenario: User follows another user
    Given actor "alice@server-a.com" exists
    And actor "bob@server-b.com" exists
    When alice sends a Follow activity to bob
    Then bob's server should receive the Follow
    And bob's server should respond with Accept
```

### rocks-testsuite

An ActivityPub test suite designed to validate and assess compliance with the protocol, originally from activitypub.rocks.

- **URL**: [github.com/go-fed/testsuite](https://github.com/go-fed/testsuite)
- **Focus**: Compliance validation

**Features:**
- Server-to-server tests
- Client-to-server tests
- Detailed compliance reports

### go-fed Testsuite

A test suite repository specifically for federated software using the go-fed library.

- **URL**: [github.com/go-fed/testsuite](https://github.com/go-fed/testsuite)
- **Language**: Go
- **Focus**: go-fed implementation testing

### Pubstrate

A Scheme-scripted test suite providing structured tests for ActivityPub implementations with meticulous protocol adherence checks.

- **URL**: [gitlab.com/dustyweb/pubstrate](https://gitlab.com/dustyweb/pubstrate)
- **Language**: Scheme (Guile)
- **Focus**: Protocol adherence

**Features:**
- Detailed protocol compliance checks
- Scriptable test scenarios
- Comprehensive coverage of ActivityPub spec

## Running Tests Against Your Server

### Basic Test Setup

Most test suites require:

1. **A running server** with a test actor
2. **HTTP access** to your server's endpoints
3. **Test configuration** pointing to your server

```bash
# Example: Running activitypub-testsuite
git clone https://github.com/steve-bate/activitypub-testsuite
cd activitypub-testsuite
pip install -r requirements.txt

# Configure your server URL
export AP_TEST_SERVER=https://your-server.com
export AP_TEST_ACTOR=https://your-server.com/users/testuser

# Run tests
pytest
```

### Testing in Development

For local development, use a tool like ngrok to expose your local server:

```bash
# Start your local server
npm run dev  # or your server's start command

# In another terminal, expose it
ngrok http 3000

# Use the ngrok URL for testing
# https://abc123.ngrok.io
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
| Announce | Boost is recorded and forwarded |
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
const assert = require('assert');

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

```javascript
async function testSignatureVerification(inboxUrl, activity, privateKey, keyId) {
  const body = JSON.stringify(activity);
  const signature = createHttpSignature(privateKey, keyId, 'POST', inboxUrl, body);

  const response = await fetch(inboxUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/activity+json',
      'Date': signature.date,
      'Digest': signature.digest,
      'Signature': signature.signature
    },
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
      - uses: actions/checkout@v3

      - name: Start server
        run: |
          npm install
          npm start &
          sleep 5

      - name: Run ActivityPub tests
        run: |
          git clone https://github.com/steve-bate/activitypub-testsuite
          cd activitypub-testsuite
          pip install -r requirements.txt
          pytest --server=http://localhost:3000
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

**Solution**: Ensure Accept header handling:
```javascript
if (req.accepts('application/activity+json') ||
    req.accepts('application/ld+json')) {
  return res.json(actor);
}
return res.html(profilePage);
```

### Missing Required Fields

**Problem**: Test expects fields your implementation doesn't provide

**Solution**: Check the spec for required vs optional fields. Minimum actor:
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox"
}
```

## Resources

- [ActivityPub Test Report](https://activitypub.rocks/implementation-report/) - Implementation reports
- [Fediverse Enhancement Proposals](https://codeberg.org/fediverse/fep) - FEP specifications to test against
- [W3C ActivityPub Test Cases](https://www.w3.org/wiki/ActivityPub_Testsuite) - Official test documentation

## Next Steps

- **[Debugging Tips](/docs/tools/debugging-tips)** - Troubleshoot test failures
- **[Compliance Checklist](/docs/tools/compliance-checklist)** - Manual compliance verification
- **[Activity Validator](/docs/tools/activity-validator)** - Validate individual activities
