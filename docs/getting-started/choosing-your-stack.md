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

**Popular libraries:**
- [activitypub-express](https://github.com/immers-space/activitypub-express) - Express middleware
- [@fedify/fedify](https://fedify.dev/) - Modern TypeScript framework
- [ActivityPub.js](https://github.com/nicksellen/activitypub) - General-purpose library

```javascript
// Example with activitypub-express
const express = require('express');
const ActivitypubExpress = require('activitypub-express');

const app = express();
const apex = ActivitypubExpress({
  domain: 'example.com',
  actorParam: 'actor',
  objectParam: 'id'
});

app.use(apex);
app.get('/u/:actor', apex.net.actor.get);
app.post('/u/:actor/inbox', apex.net.inbox.post);
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

**Popular libraries:**
- [bovine](https://codeberg.org/bovine/bovine) - ActivityPub library
- [little-boxes](https://github.com/tsileo/little-boxes) - Toolkit
- [Federation](https://federation.readthedocs.io/) - Full protocol support

```python
# Example with Flask
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/users/<username>/inbox', methods=['POST'])
def inbox(username):
    activity = request.get_json()
    # Process activity
    return '', 202

@app.route('/users/<username>', methods=['GET'])
def actor(username):
    return jsonify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        'type': 'Person',
        'id': f'https://example.com/users/{username}',
        # ... more properties
    })
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

**Popular libraries:**
- [go-fed/activity](https://github.com/go-fed/activity) - Complete implementation
- [go-ap](https://github.com/go-ap) - ActivityPub packages
- [gotosocial internals](https://github.com/superseriousbusiness/gotosocial) - Reference implementation

```go
// Example with go-fed
package main

import (
    "github.com/go-fed/activity/pub"
    "github.com/go-fed/activity/streams"
)

func main() {
    actor := streams.NewActivityStreamsPerson()
    // Configure actor...

    handler := pub.NewSocialActor(
        db,
        clock,
        NewSocialProtocol(),
    )
    // Set up HTTP handlers...
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

**Popular libraries:**
- [activitypub-federation](https://github.com/LemmyNet/activitypub-federation-rust) - Lemmy's library
- [actix-activitypub](https://github.com/rust-activitypub/actix-activitypub) - Actix integration

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

impl Actor for MyActor {
    fn id(&self) -> Url {
        self.id.clone()
    }
    // ... implement other methods
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

**Popular libraries:**
- [Mastodon's implementation](https://github.com/mastodon/mastodon) - Reference
- No standalone gems widely adopted

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

**Popular libraries:**
- [ActivityPub for WordPress](https://github.com/pfefferle/wordpress-activitypub)
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
import { createFederation } from "@fedify/fedify";

const federation = createFederation<Context>({
  kv: new MemoryKvStore(),
});

federation.setActorDispatcher("/users/{handle}", async (ctx, handle) => {
  return new Person({
    id: ctx.getActorUri(handle),
    name: handle,
    // ...
  });
});
```

**Best for:** TypeScript projects, modern development

### go-fed/activity (Go)

Complete ActivityPub implementation:

```go
handler := pub.NewSocialActor(
    database,
    clock,
    protocol,
)
```

**Best for:** Go projects needing full spec compliance

### activitypub-federation (Rust)

Battle-tested library from Lemmy:

```rust
let config = FederationConfig::builder()
    .app_data(data)
    .build()?;
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
- go-fed (Go)
- activitypub-federation (Rust)

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
Serverless can be tricky for ActivityPub due to long-running inbox processing and WebSocket needs.
:::

## Making Your Decision

### Quick Start (Learning)

```
Language: JavaScript/TypeScript
Framework: Express + activitypub-express
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
