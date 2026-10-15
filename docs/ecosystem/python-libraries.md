---
sidebar_position: 12
title: Python Libraries
description: ActivityPub libraries for Python
---

# Python Libraries

Python libraries for implementing ActivityPub.

Status and versions below were taken from PyPI, Codeberg and GitHub on **2026-10-15**. *Active* = a release or commit in the last 12 months; *Dormant* = 12–36 months; *Archived* = the repository is archived.

| Library | Latest release | Status |
|---------|----------------|--------|
| [federation](#federation) | 0.27.0 (2026-03-28) | Active |
| [PyLD](#pyld) | 3.3.0 (2026-09-02) | Active |
| [http-message-signatures](#http-message-signatures) | 2.0.1 (2026-01-19) | Active |
| [bovine](#bovine) | 0.5.19 (2025-09-24) | Dormant |
| [apkit](#archived-projects) | 0.3.8 (2026-02-17) | Archived (Sep 2026) |
| [little-boxes](#archived-projects) | 0.1.0 (2018-06-12) | Archived |
| [httpsig](#archived-projects) | 1.3.0 (2018-11-28) | Archived |

## federation

Python library that abstracts several social-web protocols — ActivityPub and Diaspora are stable; Matrix support is early — behind one entity API. Used by Socialhome, with optional Django integration.

| Property | Value |
|----------|-------|
| Repository | [codeberg.org/socialhome/federation](https://codeberg.org/socialhome/federation) (mirror: [github.com/jaywink/federation](https://github.com/jaywink/federation)) |
| Documentation | [federation.readthedocs.io](https://federation.readthedocs.io/) |
| pip | `federation` |
| License | BSD-3-Clause |

Sending goes through `federation.outbound.handle_send(entity, author_user, recipients, ...)`, where the author must carry `private_key` and `fid`, and each recipient is a dict with `endpoint`, `fid`, `public` and `protocol`. See the [usage documentation](https://federation.readthedocs.io/) for full examples.

## PyLD

The reference JSON-LD processor for Python.

| Property | Value |
|----------|-------|
| Repository | [github.com/digitalbazaar/pyld](https://github.com/digitalbazaar/pyld) |
| pip | `PyLD` |

```python
from pyld import jsonld

expanded = jsonld.expand(document)
compacted = jsonld.compact(expanded, "https://www.w3.org/ns/activitystreams")
```

## http-message-signatures

An implementation of [RFC 9421 HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421). Note that it does not check the body digest for you, and that it follows the "see what is signed" rule: only trust data returned by `verify()`. Its sister project [requests-http-signature](https://github.com/pyauth/requests-http-signature) adds body-digest handling for `requests`.

| Property | Value |
|----------|-------|
| Repository | [github.com/pyauth/http-message-signatures](https://github.com/pyauth/http-message-signatures) |
| pip | `http-message-signatures` |

Most of the fediverse still sends draft-cavage signatures, so a server receiving from Mastodon and others needs to handle both formats. See the [README](https://github.com/pyauth/http-message-signatures#readme) for signer and verifier examples.

## bovine

Async ActivityPub client and server building blocks (actor objects, signed requests, WebFinger), by Helge.

| Property | Value |
|----------|-------|
| Repository | [codeberg.org/bovine/bovine](https://codeberg.org/bovine/bovine) |
| Documentation | [bovine.readthedocs.io](https://bovine.readthedocs.io/) |
| pip | `bovine` |
| License | MIT |

```python
from bovine import BovineActor
from bovine.activitystreams import Actor

# Build an actor document
actor_doc = Actor(
    id="https://example.com/users/alice",
    preferred_username="alice",
    name="Alice",
    inbox="https://example.com/users/alice/inbox",
    outbox="https://example.com/users/alice/outbox",
).build()

# Send a signed POST to a remote inbox
async with BovineActor(
    actor_id="https://example.com/users/alice",
    public_key_url="https://example.com/users/alice#main-key",
    secret=private_key_pem,
) as actor:
    await actor.post("https://remote.example/inbox", activity)
```

`BovineActor` can also send an RFC 9530 `Content-Digest` instead of the legacy `Digest` header (`digest_method` parameter).

## Archived Projects

These still appear in older tutorials. Don't start new work on them.

| Project | Notes |
|---------|-------|
| [apkit](https://github.com/fedi-libs/apkit) | ActivityPub toolkit; the whole `fedi-libs` organisation was archived in September 2026 |
| [little-boxes](https://github.com/tsileo/little-boxes) | Archived; last release 2018 |
| [httpsig](https://github.com/ahknight/httpsig) | draft-cavage only; archived, last release 2018 — use `http-message-signatures` or bovine's signing instead |

## Choosing

- **Multi-protocol or Django project**: federation.
- **Async, building your own server**: bovine is the most complete toolkit, but check its activity before depending on it.
- **Only need signatures**: http-message-signatures (RFC 9421) — and handle draft-cavage too for compatibility.

## Example: Serving an Actor with Flask

```python
import json
from flask import Flask, Response

app = Flask(__name__)
AP = "application/activity+json"

@app.get("/users/<username>")
def actor(username):
    base = f"https://example.com/users/{username}"
    doc = {
        "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1",
        ],
        "type": "Person",
        "id": base,
        "preferredUsername": username,
        "inbox": f"{base}/inbox",
        "outbox": f"{base}/outbox",
        "publicKey": {
            "id": f"{base}#main-key",
            "owner": base,
            "publicKeyPem": PUBLIC_KEY_PEM,
        },
    }
    # Flask's jsonify() sends application/json, which Mastodon ignores.
    return Response(json.dumps(doc), content_type=AP)
```

An inbox endpoint must verify the request signature, the body digest and that the signing key belongs to the activity's `actor` before acting on anything — see [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).

## See Also

- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
- **[Building an Actor](/docs/guides/building-an-actor)**
