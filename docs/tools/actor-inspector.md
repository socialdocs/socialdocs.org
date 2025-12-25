---
sidebar_position: 2
title: Actor Inspector
description: Tools for inspecting and validating ActivityPub actors
---

# Actor Inspector

Inspecting ActivityPub actors helps debug federation issues and understand how different platforms represent users, groups, and services.

## Fetching Actors

### Command Line

```bash
# Fetch an actor with proper Accept header
curl -H "Accept: application/activity+json" \
  "https://mastodon.social/users/Gargron" | jq .

# Alternative content type
curl -H "Accept: application/ld+json; profile=\"https://www.w3.org/ns/activitystreams\"" \
  "https://mastodon.social/users/Gargron" | jq .
```

### JavaScript

```javascript
async function fetchActor(url) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/activity+json, application/ld+json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch actor: ${response.status}`);
  }

  return response.json();
}

// Usage
const actor = await fetchActor('https://mastodon.social/users/Gargron');
console.log(actor);
```

## Actor Structure

### Typical Mastodon Actor

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "toot": "http://joinmastodon.org/ns#",
      "discoverable": "toot:discoverable",
      "manuallyApprovesFollowers": "as:manuallyApprovesFollowers"
    }
  ],
  "id": "https://mastodon.social/users/Gargron",
  "type": "Person",
  "preferredUsername": "Gargron",
  "name": "Eugen Rochko",
  "summary": "<p>Developer of Mastodon</p>",
  "inbox": "https://mastodon.social/users/Gargron/inbox",
  "outbox": "https://mastodon.social/users/Gargron/outbox",
  "followers": "https://mastodon.social/users/Gargron/followers",
  "following": "https://mastodon.social/users/Gargron/following",
  "publicKey": {
    "id": "https://mastodon.social/users/Gargron#main-key",
    "owner": "https://mastodon.social/users/Gargron",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  },
  "endpoints": {
    "sharedInbox": "https://mastodon.social/inbox"
  }
}
```

## Validation Checklist

```
┌────────────────────────────────────────────────────────────┐
│                 ACTOR VALIDATION                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Required Properties                                       │
│  ✓ id          - Unique URI                                │
│  ✓ type        - Person, Group, Service, etc.             │
│  ✓ inbox       - URL to receive activities                 │
│  ✓ outbox      - URL of published activities               │
│                                                            │
│  Recommended Properties                                    │
│  ○ preferredUsername - The @handle                         │
│  ○ name              - Display name                        │
│  ○ publicKey         - For HTTP Signatures                 │
│  ○ followers         - Followers collection                │
│  ○ following         - Following collection                │
│  ○ endpoints.sharedInbox - For efficient delivery          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Actor Inspector Tool

### Full Validation Script

```javascript
class ActorInspector {
  constructor(actorUrl) {
    this.url = actorUrl;
    this.actor = null;
    this.errors = [];
    this.warnings = [];
  }

  async fetch() {
    const response = await fetch(this.url, {
      headers: { 'Accept': 'application/activity+json' }
    });

    if (!response.ok) {
      this.errors.push(`Fetch failed: ${response.status}`);
      return false;
    }

    this.actor = await response.json();
    return true;
  }

  validate() {
    const a = this.actor;

    // Required fields
    if (!a.id) this.errors.push('Missing required: id');
    if (!a.type) this.errors.push('Missing required: type');
    if (!a.inbox) this.errors.push('Missing required: inbox');
    if (!a.outbox) this.errors.push('Missing required: outbox');

    // Type validation
    const validTypes = ['Person', 'Group', 'Organization', 'Application', 'Service'];
    if (a.type && !validTypes.includes(a.type)) {
      this.warnings.push(`Unusual actor type: ${a.type}`);
    }

    // URL validation
    if (a.id && !a.id.startsWith('https://')) {
      this.errors.push('Actor id must be HTTPS');
    }

    if (a.inbox && !a.inbox.startsWith('https://')) {
      this.errors.push('Inbox must be HTTPS');
    }

    // Recommended fields
    if (!a.preferredUsername) {
      this.warnings.push('Missing recommended: preferredUsername');
    }

    if (!a.publicKey) {
      this.warnings.push('Missing recommended: publicKey (needed for federation)');
    }

    if (!a.endpoints?.sharedInbox) {
      this.warnings.push('Missing recommended: endpoints.sharedInbox');
    }

    // Public key validation
    if (a.publicKey) {
      if (!a.publicKey.id) this.errors.push('publicKey missing id');
      if (!a.publicKey.owner) this.errors.push('publicKey missing owner');
      if (!a.publicKey.publicKeyPem) this.errors.push('publicKey missing publicKeyPem');

      if (a.publicKey.owner && a.publicKey.owner !== a.id) {
        this.errors.push('publicKey.owner must match actor id');
      }
    }

    return this.errors.length === 0;
  }

  report() {
    console.log('=== Actor Inspector Report ===\n');
    console.log(`URL: ${this.url}`);
    console.log(`Type: ${this.actor?.type}`);
    console.log(`Username: ${this.actor?.preferredUsername}`);
    console.log(`Name: ${this.actor?.name || '(not set)'}`);

    console.log('\n--- Endpoints ---');
    console.log(`Inbox: ${this.actor?.inbox}`);
    console.log(`Outbox: ${this.actor?.outbox}`);
    console.log(`Shared Inbox: ${this.actor?.endpoints?.sharedInbox || '(not set)'}`);

    if (this.errors.length > 0) {
      console.log('\n--- Errors ---');
      this.errors.forEach(e => console.log(`❌ ${e}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n--- Warnings ---');
      this.warnings.forEach(w => console.log(`⚠️  ${w}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All checks passed!');
    }
  }
}

// Usage
const inspector = new ActorInspector('https://mastodon.social/users/Gargron');
await inspector.fetch();
inspector.validate();
inspector.report();
```

## Comparing Actors

### Platform Differences

| Property | Mastodon | Lemmy | Pixelfed | PeerTube |
|----------|----------|-------|----------|----------|
| type | Person | Person/Group | Person | Person/Group |
| preferredUsername | ✓ | ✓ | ✓ | ✓ |
| name | Display name | Display name | Display name | Channel name |
| summary | HTML bio | HTML bio | HTML bio | HTML description |
| icon | Avatar | Avatar | Avatar | Avatar |
| image | Header | Banner | - | Banner |
| discoverable | ✓ | - | ✓ | - |

### Fetch Multiple Actors

```javascript
async function compareActors(urls) {
  const actors = await Promise.all(
    urls.map(async url => {
      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'application/activity+json' }
        });
        return { url, actor: await response.json() };
      } catch (error) {
        return { url, error: error.message };
      }
    })
  );

  // Compare properties
  const properties = ['type', 'preferredUsername', 'name', 'inbox', 'outbox'];

  console.log('Property comparison:');
  properties.forEach(prop => {
    console.log(`\n${prop}:`);
    actors.forEach(({ url, actor, error }) => {
      if (error) {
        console.log(`  ${url}: ERROR - ${error}`);
      } else {
        console.log(`  ${url}: ${actor[prop] || '(not set)'}`);
      }
    });
  });
}
```

## Endpoint Testing

### Test Inbox

```bash
# Note: Requires valid HTTP signature for real servers
curl -X POST \
  -H "Content-Type: application/activity+json" \
  -d '{"type": "Create", "actor": "...", "object": "..."}' \
  "https://example.com/users/alice/inbox"
```

### Test Outbox (Read)

```bash
# Fetch recent activities
curl -H "Accept: application/activity+json" \
  "https://mastodon.social/users/Gargron/outbox" | jq .
```

### Test Collections

```bash
# Followers (may be empty or restricted)
curl -H "Accept: application/activity+json" \
  "https://mastodon.social/users/Gargron/followers" | jq .

# Following
curl -H "Accept: application/activity+json" \
  "https://mastodon.social/users/Gargron/following" | jq .
```

## Common Issues

### 406 Not Acceptable

Server doesn't recognize Accept header:

```bash
# Try alternative
curl -H "Accept: application/ld+json" "https://example.com/users/alice"
```

### 401/403 Unauthorized

Some endpoints require authentication:

```javascript
// Outbox might be public, but inbox always requires signature
// Followers/following may be private
```

### Different URL vs ID

Actor URL and ID should match:

```json
{
  "id": "https://example.com/users/alice",
  "url": "https://example.com/@alice"
}
```

The `id` is for ActivityPub, `url` is the human-readable profile page.

## Related Tools

- **[WebFinger Lookup](/docs/tools/webfinger-lookup)** - Discover actor URLs
- **[Signature Tester](/docs/tools/signature-tester)** - Test HTTP signatures
- **[JSON-LD Playground](/docs/tools/json-ld-playground)** - Validate JSON-LD
