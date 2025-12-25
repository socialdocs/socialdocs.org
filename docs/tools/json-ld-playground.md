---
sidebar_position: 3
title: JSON-LD Playground
description: Tools for testing and validating JSON-LD in ActivityPub
---

# JSON-LD Playground

ActivityPub uses JSON-LD for semantic data representation. Understanding JSON-LD helps debug context issues and ensure interoperability.

## Online Tools

### W3C JSON-LD Playground

The official tool for testing JSON-LD:

**URL**: [json-ld.org/playground](https://json-ld.org/playground/)

**Features:**
- Expand, compact, flatten, frame operations
- Multiple input formats
- Real-time validation
- Share examples via URL

### Using the Playground

1. Paste your ActivityPub object in the input
2. Select operation (usually "Expand")
3. View the expanded form to see resolved terms

## JSON-LD Operations

### Expansion

Expands compact terms to full IRIs:

**Input:**
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "content": "Hello, world!"
}
```

**Expanded:**
```json
[
  {
    "@type": ["https://www.w3.org/ns/activitystreams#Note"],
    "https://www.w3.org/ns/activitystreams#content": [
      {"@value": "Hello, world!"}
    ]
  }
]
```

### Compaction

Shortens full IRIs using a context:

```javascript
const jsonld = require('jsonld');

const expanded = [{
  "@type": ["https://www.w3.org/ns/activitystreams#Note"],
  "https://www.w3.org/ns/activitystreams#content": [
    {"@value": "Hello!"}
  ]
}];

const context = {"@context": "https://www.w3.org/ns/activitystreams"};
const compacted = await jsonld.compact(expanded, context);
// Result: { "@context": "...", "type": "Note", "content": "Hello!" }
```

## Common Contexts

### ActivityStreams

```json
{
  "@context": "https://www.w3.org/ns/activitystreams"
}
```

Defines: `type`, `id`, `actor`, `object`, `content`, `published`, etc.

### Security (for HTTP Signatures)

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ]
}
```

Adds: `publicKey`, `publicKeyPem`, `owner`

### Mastodon Extensions

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "toot": "http://joinmastodon.org/ns#",
      "Emoji": "toot:Emoji",
      "discoverable": "toot:discoverable",
      "sensitive": "as:sensitive"
    }
  ]
}
```

## Validation Script

### Check Context Resolution

```javascript
const jsonld = require('jsonld');

async function validateContext(object) {
  try {
    // Try to expand - will fail if context is invalid
    const expanded = await jsonld.expand(object);
    console.log('✅ Context is valid');
    console.log('Expanded form:', JSON.stringify(expanded, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Context error:', error.message);
    return false;
  }
}

// Test
const note = {
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "content": "Hello!"
};

validateContext(note);
```

### Verify Term Resolution

```javascript
async function checkTerms(object, expectedTerms) {
  const expanded = await jsonld.expand(object);
  const flat = expanded[0] || {};

  const results = {};
  for (const term of expectedTerms) {
    const asNs = `https://www.w3.org/ns/activitystreams#${term}`;
    results[term] = asNs in flat || `@${term}` in flat;
  }

  return results;
}

// Check if common terms resolve
const terms = ['type', 'actor', 'object', 'content', 'published'];
const results = await checkTerms(activity, terms);
console.log(results);
// { type: true, actor: true, object: true, content: true, published: true }
```

## Common Issues

### Missing Context

```json
// ❌ Bad - no context
{
  "type": "Note",
  "content": "Hello"
}

// ✅ Good - has context
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "content": "Hello"
}
```

### Wrong Context URL

```json
// ❌ Bad - typo in URL
{
  "@context": "https://www.w3.org/ns/activitystream",
  "type": "Note"
}

// ✅ Good - correct URL
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note"
}
```

### Context Order Matters

```json
// Later contexts override earlier ones
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "content": "http://example.com/custom#content"
    }
  ],
  "content": "This uses custom namespace"
}
```

### Unknown Terms

```javascript
// Terms not in context are dropped during compaction
const object = {
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "customField": "This will be lost"
};

// After round-trip through JSON-LD processor, customField may be gone
```

## Testing ActivityPub Objects

### Validate a Note

```javascript
async function validateNote(note) {
  const errors = [];

  // Check context
  if (!note['@context']) {
    errors.push('Missing @context');
  }

  // Expand and check required fields
  try {
    const expanded = await jsonld.expand(note);
    const obj = expanded[0] || {};

    const asNs = 'https://www.w3.org/ns/activitystreams#';

    if (!obj['@type']?.includes(`${asNs}Note`)) {
      errors.push('type must be Note');
    }

    if (!obj[`${asNs}content`]) {
      errors.push('Missing content');
    }

    if (!obj[`${asNs}attributedTo`]) {
      errors.push('Missing attributedTo');
    }

  } catch (e) {
    errors.push(`JSON-LD error: ${e.message}`);
  }

  return errors;
}
```

### Validate an Activity

```javascript
async function validateActivity(activity) {
  const errors = [];
  const asNs = 'https://www.w3.org/ns/activitystreams#';

  try {
    const expanded = await jsonld.expand(activity);
    const obj = expanded[0] || {};

    // Check for actor
    if (!obj[`${asNs}actor`]) {
      errors.push('Activity must have actor');
    }

    // Check for object (most activities need it)
    const type = obj['@type']?.[0];
    const intransitive = [
      `${asNs}Arrive`,
      `${asNs}Travel`,
      `${asNs}Question`
    ];

    if (!obj[`${asNs}object`] && !intransitive.includes(type)) {
      errors.push('Activity should have object');
    }

  } catch (e) {
    errors.push(`JSON-LD error: ${e.message}`);
  }

  return errors;
}
```

## Local Testing Setup

### Node.js Setup

```bash
npm install jsonld
```

```javascript
const jsonld = require('jsonld');

// Custom document loader (for offline testing)
const customLoader = async (url) => {
  const contexts = {
    'https://www.w3.org/ns/activitystreams': {
      // ActivityStreams context (cached)
    }
  };

  if (contexts[url]) {
    return {
      document: contexts[url],
      documentUrl: url
    };
  }

  // Fall back to default loader
  return jsonld.documentLoaders.node()(url);
};

jsonld.documentLoader = customLoader;
```

### Browser Setup

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsonld/8.3.2/jsonld.min.js"></script>
<script>
  async function test() {
    const note = {
      "@context": "https://www.w3.org/ns/activitystreams",
      "type": "Note",
      "content": "Hello!"
    };

    const expanded = await jsonld.expand(note);
    console.log(expanded);
  }
  test();
</script>
```

## Quick Reference

```
┌────────────────────────────────────────────────────────────┐
│              JSON-LD QUICK REFERENCE                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  @context  - Defines term mappings                         │
│  @id       - Unique identifier (same as 'id' in AS2)       │
│  @type     - Object type (same as 'type' in AS2)           │
│  @value    - Literal value in expanded form                │
│                                                            │
│  Operations:                                               │
│  • Expand   - Resolve all terms to full IRIs               │
│  • Compact  - Shorten IRIs using context                   │
│  • Flatten  - Remove nesting                               │
│  • Frame    - Reshape to match template                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Related Tools

- **[Actor Inspector](/docs/tools/actor-inspector)** - Inspect actors
- **[Debugging Tips](/docs/tools/debugging-tips)** - General debugging
- **[Compliance Checklist](/docs/tools/compliance-checklist)** - Full validation
