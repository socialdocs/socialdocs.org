---
sidebar_position: 1
title: Activity Validator
description: Validate your ActivityPub activities against the spec
---

# Activity Validator

Use this tool to validate your ActivityStreams activities and objects against the specification.

## Online Validators

### ActivityPub.rocks Validator

The most comprehensive online validator:

**URL**: [https://activitypub.rocks/tools/](https://activitypub.rocks/)

Features:
- Validates ActivityStreams JSON
- Checks required properties
- Verifies JSON-LD context
- Tests HTTP Signatures

### Go-Fed Validator

Testing tool from the go-fed project:

**URL**: [https://go-fed.org/](https://go-fed.org/)

Features:
- Comprehensive spec compliance
- Detailed error messages

## Local Validation

### Basic JSON Schema Validation

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

const activitySchema = {
  type: 'object',
  required: ['@context', 'type', 'actor'],
  properties: {
    '@context': {
      oneOf: [
        { type: 'string' },
        { type: 'array' }
      ]
    },
    type: { type: 'string' },
    id: { type: 'string', format: 'uri' },
    actor: {
      oneOf: [
        { type: 'string', format: 'uri' },
        { type: 'object' }
      ]
    },
    object: {},
    to: { type: 'array', items: { type: 'string' } },
    cc: { type: 'array', items: { type: 'string' } }
  }
};

function validateActivity(activity) {
  const validate = ajv.compile(activitySchema);
  const valid = validate(activity);

  if (!valid) {
    console.log('Validation errors:', validate.errors);
  }

  return valid;
}
```

### Type-Specific Validation

```javascript
function validateByType(activity) {
  const errors = [];

  // Common checks
  if (!activity['@context']) {
    errors.push('Missing @context');
  }

  if (!activity.type) {
    errors.push('Missing type');
  }

  if (!activity.actor) {
    errors.push('Missing actor');
  }

  // Type-specific checks
  switch (activity.type) {
    case 'Create':
      if (!activity.object) {
        errors.push('Create requires object');
      }
      if (activity.object && activity.object.attributedTo !== activity.actor) {
        errors.push('Create object.attributedTo should match actor');
      }
      break;

    case 'Follow':
      if (!activity.object) {
        errors.push('Follow requires object (target actor)');
      }
      break;

    case 'Like':
    case 'Announce':
      if (!activity.object) {
        errors.push(`${activity.type} requires object`);
      }
      break;

    case 'Delete':
      if (!activity.object) {
        errors.push('Delete requires object');
      }
      break;

    case 'Undo':
      if (!activity.object) {
        errors.push('Undo requires object (activity to undo)');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Common Validation Errors

### Missing @context

```json
// ❌ Wrong
{
  "type": "Note",
  "content": "Hello"
}

// ✅ Correct
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "content": "Hello"
}
```

### Invalid Actor URL

```json
// ❌ Wrong - not a URL
{
  "actor": "alice"
}

// ✅ Correct
{
  "actor": "https://example.com/users/alice"
}
```

### Missing Required Properties

```json
// ❌ Wrong - Create without object
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://example.com/users/alice"
}

// ✅ Correct
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "content": "Hello!"
  }
}
```

### Attribution Mismatch

```json
// ❌ Wrong - actor doesn't match attributedTo
{
  "type": "Create",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "Note",
    "attributedTo": "https://example.com/users/bob",
    "content": "Hello"
  }
}
```

## Validation Checklist

### For All Activities

- [ ] Has `@context`
- [ ] Has valid `type`
- [ ] Has `actor` as URL
- [ ] Has unique `id`
- [ ] `to`/`cc` are arrays of URLs

### For Create

- [ ] Has `object`
- [ ] Object has `id`
- [ ] Object has `type`
- [ ] Object has `attributedTo`
- [ ] `attributedTo` matches `actor`

### For Follow

- [ ] Has `object` (target actor URL)
- [ ] Object is a valid actor URL

### For Undo

- [ ] Has `object` (activity being undone)
- [ ] Actor matches original activity actor

## Testing Tools

### curl

```bash
# Test your activity endpoint
curl -X POST https://example.com/inbox \
  -H "Content-Type: application/activity+json" \
  -d '{
    "@context": "https://www.w3.org/ns/activitystreams",
    "type": "Create",
    "actor": "https://example.com/users/alice",
    "object": {
      "type": "Note",
      "content": "Test"
    }
  }'
```

### Postman/Insomnia

Import ActivityPub collections for testing.

## See Also

- **[Actor Inspector](/docs/tools/actor-inspector)** - Inspect remote actors
- **[WebFinger Lookup](/docs/tools/webfinger-lookup)** - Test discovery
- **[Test Suites](/docs/tools/test-suites)** - Comprehensive testing
