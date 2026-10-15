---
sidebar_position: 6
title: Choosing Your Stack
description: Comparing languages, frameworks, and libraries for ActivityPub development
---

# Choosing Your Stack

Choosing the right technology stack is crucial for your ActivityPub implementation. This guide compares popular options and helps you make an informed decision.

## Decision Factors

Consider these factors when choosing your stack:

| Factor | Questions to Ask |
|--------|-----------------|
| **Team expertise** | What languages does your team know? |
| **Performance needs** | How many users/requests do you expect? |
| **Ecosystem** | Are there existing ActivityPub libraries? |
| **Hosting** | Where will you deploy? |
| **Time constraints** | Do you need to ship quickly? |

## Language Comparison

### JavaScript/TypeScript

**Pros:**
- Large ecosystem and community
- Easy to get started
- Good ActivityPub library support
- Runs everywhere (Node.js, Deno, Bun)

**Cons:**
- Single-threaded (need clustering for CPU-bound tasks)
- Memory usage can be high

**Best for:** Quick prototypes, web-focused teams, full-stack development

**Popular libraries** (status as of October 2026 — see [JavaScript Libraries](/docs/ecosystem/javascript-libraries)):
- [Fedify](https://fedify.dev/) - TypeScript framework (active)
- [BotKit](https://botkit.fedify.dev/) - Bot framework built on Fedify (active)
- [activitypub-express](https://github.com/immers-space/activitypub-express) - Express middleware (dormant since 2024; avoid for new projects)

```typescript
// Example with Fedify 2.x
import { createFederation, MemoryKvStore } from "@fedify/fedify";
import { Person } from "@fedify/vocab";

const federation = createFederation({ kv: new MemoryKvStore() });

federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
  return new Person({
    id: ctx.getActorUri(identifier),
    preferredUsername: identifier,
  });
});
```

### Python

**Pros:**
- Clean, readable syntax
- Great for data processing
- Strong crypto libraries
- Good for AI/ML integration

**Cons:**
- Slower than compiled languages
- GIL limits parallelism

**Best for:** Backend services, data-heavy applications, ML integration

**Popular libraries** (see [Python Libraries](/docs/ecosystem/python-libraries)):
- [federation](https://federation.readthedocs.io/) - Multi-protocol library (active)
- [bovine](https://codeberg.org/bovine/bovine) - Async ActivityPub toolkit (no release since September 2025)
- [http-message-signatures](https://github.com/pyauth/http-message-signatures) - RFC 9421 signatures (active)

```python
# Example with Flask
import json
from flask import Flask, Response

app = Flask(__name__)

@app.get('/users/<username>')
def actor(username):
    doc = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        'type': 'Person',
        'id': f'https://example.com/users/{username}',
        # ... more properties, including publicKey
    }
    # jsonify() would send application/json, which Mastodon ignores
    return Response(json.dumps(doc), content_type='application/activity+json')
```

### Go

**Pros:**
- Excellent performance
- Great concurrency model
- Single binary deployment
- Strong standard library

**Cons:**
- Steeper learning curve
- Less flexible than dynamic languages
- Smaller ActivityPub ecosystem

**Best for:** High-performance servers, microservices, scale

**Popular libraries** (see [Go Libraries](/docs/ecosystem/go-libraries)):
- [go-ap](https://github.com/go-ap) - Modular ActivityPub packages (active)
- [GoToSocial's activity and httpsig forks](https://codeberg.org/superseriousbusiness/activity) - Maintained forks of go-fed (active)
- [GoToSocial](https://codeberg.org/superseriousbusiness/gotosocial) - Reference implementation
- go-fed/activity - the original, unmaintained since 2022; use the GoToSocial fork instead

```go
// Example with go-ap
import vocab "github.com/go-ap/activitypub"

person := vocab.Person{
    ID:                vocab.IRI("https://example.com/users/alice"),
    Type:              vocab.PersonType,
    PreferredUsername: vocab.NaturalLanguageValues{vocab.English: vocab.Content("alice")},
    Inbox:             vocab.IRI("https://example.com/users/alice/inbox"),
}
```

### Rust

**Pros:**
- Maximum performance
- Memory safety
- Great for long-running services
- Growing ecosystem

**Cons:**
- Steep learning curve
- Longer development time
- Smaller ActivityPub ecosystem

**Best for:** Performance-critical applications, infrastructure

**Popular libraries** (see [Rust Libraries](/docs/ecosystem/rust-libraries)):
- [activitypub_federation](https://github.com/LemmyNet/activitypub-federation-rust) - Lemmy's federation framework (active)

```rust
// Example with activitypub-federation
use activitypub_federation::{
    config::FederationConfig,
    traits::Actor,
};

#[derive(Clone)]
struct MyActor {
    id: Url,
    // ...
}

// MyActor must also implement the `Object` trait.
impl Actor for MyActor {
    fn id(&self) -> Url {
        self.id.clone()
    }
    // ... public_key_pem, private_key_pem, inbox
}
```

### Ruby

**Pros:**
- Developer-friendly
- Rails ecosystem
- Mastodon uses it

**Cons:**
- Performance limitations
- Smaller ActivityPub library support

**Best for:** Rails teams, Mastodon forks

**Popular libraries** (see [Ruby Libraries](/docs/ecosystem/ruby-libraries)):
- [Fedipub](https://gitlab.com/fedipub/fedipub) (formerly Federails) - Rails engine (active)
- [linzer](https://github.com/nomadium/linzer) - RFC 9421 HTTP Message Signatures (active)
- [Mastodon's implementation](https://github.com/mastodon/mastodon) - Reference

```ruby
# Example with Rails
class InboxController < ApplicationController
  def create
    activity = JSON.parse(request.body.read)
    ProcessActivityJob.perform_later(activity)
    head :accepted
  end
end
```

### PHP

**Pros:**
- Wide hosting availability
- Large community
- Easy deployment

**Cons:**
- Performance limitations
- Fewer ActivityPub libraries

**Best for:** WordPress integration, shared hosting

**Popular libraries** (see [PHP Libraries](/docs/ecosystem/php-libraries)):
- [ActivityPub for WordPress](https://github.com/Automattic/wordpress-activitypub) (active)
- [ActivityPhp](https://github.com/landrok/activitypub) (active)
- [Pixelfed's implementation](https://github.com/pixelfed/pixelfed)

## Framework Recommendations

### By Use Case

| Use Case | Recommended Stack |
|----------|-------------------|
| Microblogging | Ruby/Rails, Go |
| Photo sharing | PHP (Pixelfed), Node.js |
| Link aggregation | Rust (Lemmy), Go |
| Video hosting | Python, Go |
| Lightweight server | Go, Rust |
| Quick prototype | Node.js, Python |

### By Scale

| Scale | Recommended Approach |
|-------|---------------------|
| < 100 users | Any language, single server |
| 100-1000 users | Node.js/Python with caching |
| 1000-10000 users | Go/Rust, Redis, queue workers |
| 10000+ users | Distributed architecture, Go/Rust |

## Dedicated ActivityPub Frameworks

These frameworks provide most ActivityPub functionality out of the box:

### Fedify (TypeScript)

Modern, type-safe ActivityPub framework:

```typescript
import { createFederation, MemoryKvStore } from "@fedify/fedify";
import { Person } from "@fedify/vocab";

const federation = createFederation<void>({
  kv: new MemoryKvStore(),
});

federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
  return new Person({
    id: ctx.getActorUri(identifier),
    preferredUsername: identifier,
    // ...
  });
});
```

**Best for:** TypeScript projects, modern development

### go-ap (Go)

Modular packages for vocabulary, client, processing and storage, with [FedBOX](https://github.com/go-ap/fedbox) as a reference server.

**Best for:** Go projects that want a maintained framework (go-fed/activity is unmaintained)

### activitypub-federation (Rust)

Battle-tested library from Lemmy:

```rust
let config = FederationConfig::builder()
    .domain("example.com")
    .app_data(data)
    .build()
    .await?;
```

**Best for:** Rust projects, high-performance needs

## Build vs. Use Existing

### Start from Scratch

**When to do it:**
- Learning purposes
- Unique requirements
- Full control needed

**Effort:** High (months of work)

### Fork Existing Software

**When to do it:**
- Similar feature set needed
- Community and maintenance matters
- Faster time to market

**Popular bases:**
- Mastodon (Ruby) - Microblogging
- GoToSocial (Go) - Lightweight microblogging
- Pixelfed (PHP) - Photo sharing
- Lemmy (Rust) - Link aggregation

### Use a Framework

**When to do it:**
- Need flexibility
- Different use case than existing software
- Want to focus on features, not protocol

**Options:**
- Fedify (TypeScript)
- go-ap (Go)
- activitypub_federation (Rust)
- Fedipub (Ruby on Rails)

## Database Considerations

### PostgreSQL

Most common choice. Used by Mastodon, Pixelfed, Lemmy.

**Pros:** Reliable, feature-rich, good JSON support
**Cons:** Resource-intensive

### SQLite

Good for small instances. Used by GoToSocial.

**Pros:** Simple, no server needed, portable
**Cons:** Concurrent write limitations

### MongoDB

Document-oriented, matches ActivityPub's JSON structure.

**Pros:** Flexible schema, good for activities
**Cons:** Different paradigm, operational complexity

## Deployment Considerations

### Traditional VPS

- Full control
- Predictable costs
- Manual scaling

**Good for:** Most small-medium instances

### Container-Based (Docker/K8s)

- Easy deployment
- Scaling options
- Complex for small teams

**Good for:** Teams with container experience

### Serverless

- Auto-scaling
- Pay per use
- Cold start issues

**Good for:** Variable traffic, cost optimization

:::caution
Serverless can be tricky for ActivityPub because inbox processing and delivery need background queues with retries.
:::

## Making Your Decision

### Quick Start (Learning)

```
Language: JavaScript/TypeScript
Framework: Fedify (Node.js, Deno, or Bun)
Database: SQLite
Deploy: Local or single VPS
```

### Production-Ready (Small)

```
Language: Go or TypeScript
Framework: Fedify or GoToSocial-based
Database: PostgreSQL
Deploy: VPS with Docker
```

### Scale-Ready

```
Language: Go or Rust
Framework: Custom or Lemmy-based
Database: PostgreSQL + Redis
Deploy: Kubernetes or similar
```

## Next Steps

Based on your choice:

1. **[Building an Actor](/docs/guides/building-an-actor)** - Start implementing
2. **[Libraries Overview](/docs/ecosystem/libraries-overview)** - Explore available tools
3. **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)** - JS-specific options
4. **[Go Libraries](/docs/ecosystem/go-libraries)** - Go-specific options
