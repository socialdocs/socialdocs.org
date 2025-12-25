---
sidebar_position: 14
title: Rust Libraries
description: ActivityPub libraries for Rust
---

# Rust Libraries

Rust libraries for implementing ActivityPub.

## activitypub-federation

Battle-tested library from Lemmy.

| Property | Value |
|----------|-------|
| Repository | [github.com/LemmyNet/activitypub-federation-rust](https://github.com/LemmyNet/activitypub-federation-rust) |
| crates.io | `activitypub-federation` |
| License | AGPL-3.0 |
| Status | Active, Production Ready |

### Features

- Complete S2S federation
- HTTP Signatures
- WebFinger
- Activity queue
- Async/await

### Example

```rust
use activitypub_federation::{
    config::FederationConfig,
    traits::Actor,
};

#[derive(Clone)]
struct MyActor {
    id: Url,
    inbox: Url,
    public_key: String,
}

impl Actor for MyActor {
    fn id(&self) -> Url {
        self.id.clone()
    }

    fn public_key_pem(&self) -> &str {
        &self.public_key
    }

    fn inbox(&self) -> Url {
        self.inbox.clone()
    }
}
```

### Sending Activities

```rust
use activitypub_federation::activity_sending::SendActivityTask;

let activity = Create {
    actor: actor.id(),
    object: note,
};

SendActivityTask::prepare(&activity, &actor, vec![inbox_url])
    .await?
    .send(&data)
    .await?;
```

## activitystreams

Type-safe ActivityStreams vocabulary.

| Property | Value |
|----------|-------|
| Repository | [crates.io/crates/activitystreams](https://crates.io/crates/activitystreams) |
| License | GPL-3.0 |
| Status | Active |

### Example

```rust
use activitystreams::{
    activity::Create,
    object::Note,
    prelude::*,
};

let note = Note::new()
    .set_content("Hello from Rust!")
    .set_attributed_to("https://example.com/users/alice".parse()?);

let create = Create::new(
    "https://example.com/users/alice".parse()?,
    note.into_any_base()?,
);
```

## http-signature-normalization

HTTP Signature handling.

| Property | Value |
|----------|-------|
| Repository | [crates.io/crates/http-signature-normalization](https://crates.io/crates/http-signature-normalization) |
| License | AGPL-3.0 |
| Status | Active |

### Signing

```rust
use http_signature_normalization_actix::prelude::*;

let config = Config::default()
    .set_expiration(Duration::seconds(30));

let signed = config
    .begin_sign("POST", "/inbox", headers)?
    .sign(key_id, |signing_string| {
        // Sign with private key
        sign_with_rsa(signing_string, private_key)
    })?;
```

### Verification

```rust
let unverified = config.begin_verify(
    request.method(),
    request.uri().path_and_query(),
    request.headers(),
)?;

let key_id = unverified.key_id();
// Fetch public key
let verified = unverified.verify(|signing_string, signature| {
    verify_rsa(signing_string, signature, public_key)
})?;
```

## webfinger

WebFinger client.

| Property | Value |
|----------|-------|
| Repository | [crates.io/crates/webfinger](https://crates.io/crates/webfinger) |
| License | MIT |
| Status | Stable |

### Example

```rust
use webfinger::WebFinger;

let wf = WebFinger::fetch("alice@example.com").await?;

for link in wf.links {
    if link.rel == "self" {
        println!("Actor URL: {}", link.href);
    }
}
```

## Comparison

| Library | Scope | Complexity | Use Case |
|---------|-------|------------|----------|
| activitypub-federation | Full federation | High | Production servers |
| activitystreams | Types only | Medium | Type safety |
| http-signature-normalization | Signing | Low | HTTP Signatures |

## Production Examples

### Lemmy

```
lemmy/crates/apub/
├── src/
│   ├── activities/     # Activity handlers
│   ├── objects/        # AP objects
│   └── protocol/       # Type definitions
```

### Quick Start

**For new projects**: Use activitypub-federation.

**For custom implementations**: Combine activitystreams + http-signature-normalization.

## See Also

- **[Lemmy](/docs/ecosystem/lemmy)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**

