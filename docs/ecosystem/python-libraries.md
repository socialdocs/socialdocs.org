---
sidebar_position: 12
title: Python Libraries
description: ActivityPub libraries for Python
---

# Python Libraries

Python libraries for implementing ActivityPub.

## bovine

Modern ActivityPub library for Python.

| Property | Value |
|----------|-------|
| Repository | [codeberg.org/bovine/bovine](https://codeberg.org/bovine/bovine) |
| Documentation | [bovine.readthedocs.io](https://bovine.readthedocs.io/) |
| License | MIT |
| Status | Maintenance (low activity since late 2025) |

### Features

- Async/await support
- ActivityPub client and server
- HTTP Signatures
- WebFinger

### Example

```python
from bovine import BovineClient
from bovine.activitystreams import build_actor

# Create an actor
actor = build_actor(
    actor_id="https://example.com/users/alice",
    name="Alice",
    preferred_username="alice"
)

# Send an activity
client = BovineClient(private_key, key_id)
await client.post(
    inbox_url="https://remote.example/inbox",
    activity=activity
)
```

## Federation

Django library for federation protocols.

| Property | Value |
|----------|-------|
| Repository | [github.com/jaywink/federation](https://github.com/jaywink/federation) |
| Documentation | [federation.readthedocs.io](https://federation.readthedocs.io/) |
| License | BSD-3 |
| Status | Active |

### Features

- Django integration
- Multiple protocols (ActivityPub, Diaspora)
- Inbound/outbound handling

### Example

```python
from federation.entities import Post
from federation.outbound import handle_send

post = Post(
    id="https://example.com/posts/123",
    actor_id="https://example.com/users/alice",
    raw_content="Hello, Fediverse!",
)

handle_send(post, recipients)
```

## little-boxes

ActivityPub toolkit.

| Property | Value |
|----------|-------|
| Repository | [github.com/tsileo/little-boxes](https://github.com/tsileo/little-boxes) |
| License | ISC |
| Status | Maintenance |

### Example

```python
from little_boxes import activitypub as ap

class MyBackend(ap.Backend):
    def fetch_iri(self, iri):
        # Fetch remote object
        pass

    def inbox_new(self, as_actor, activity):
        # Handle incoming activity
        pass

backend = MyBackend()
ap.use_backend(backend)

# Create an activity
note = ap.Note(
    content="Hello!",
    to=[ap.AS_PUBLIC],
    attributedTo="https://example.com/users/alice"
)
```

## httpsig

HTTP Signature library.

| Property | Value |
|----------|-------|
| Repository | [github.com/ahknight/httpsig](https://github.com/ahknight/httpsig) |
| pip | `httpsig` |
| Status | Stable |

### Signing

```python
from httpsig import HTTPSignatureAuth
import requests

auth = HTTPSignatureAuth(
    key_id='https://example.com/users/alice#main-key',
    secret=private_key,
    algorithm='rsa-sha256',
    headers=['(request-target)', 'host', 'date', 'digest']
)

response = requests.post(
    'https://remote.example/inbox',
    json=activity,
    auth=auth
)
```

## PyLD

JSON-LD processor.

| Property | Value |
|----------|-------|
| Repository | [github.com/digitalbazaar/pyld](https://github.com/digitalbazaar/pyld) |
| pip | `PyLD` |
| Status | Active |

### Example

```python
from pyld import jsonld

# Expand
expanded = jsonld.expand(document)

# Compact
compacted = jsonld.compact(expanded, {
    "@context": "https://www.w3.org/ns/activitystreams"
})
```

## Comparison

| Library | Framework | Protocols | Complexity |
|---------|-----------|-----------|------------|
| bovine | Any/async | ActivityPub | Medium |
| federation | Django | Multiple | High |
| little-boxes | Any | ActivityPub | Medium |
| httpsig | Any | - | Low |

## Quick Start

**For Django projects**: Use Federation.

**For async projects**: Use bovine.

**For Flask/other**: Use little-boxes or build custom.

## Example: Minimal Server

```python
from flask import Flask, request, jsonify
from httpsig import HTTPSignatureAuth
import json

app = Flask(__name__)

@app.route('/users/<username>', methods=['GET'])
def actor(username):
    return jsonify({
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Person",
        "id": f"https://example.com/users/{username}",
        "preferredUsername": username,
        "inbox": f"https://example.com/users/{username}/inbox",
        "outbox": f"https://example.com/users/{username}/outbox"
    })

@app.route('/users/<username>/inbox', methods=['POST'])
def inbox(username):
    activity = request.json
    # Process activity
    return '', 202
```

## See Also

- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
- **[Building an Actor](/docs/guides/building-an-actor)**

