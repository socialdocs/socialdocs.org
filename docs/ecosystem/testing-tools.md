---
sidebar_position: 21
title: Testing Tools
description: Tools for testing ActivityPub implementations
last_verified: 2026-10-15
verified_against: "Live checks of each tool (2026-10-15): activitypub.academy /api/v1/instance, browser.pub, fedify.dev/cli, mastodon.social responses; Mastodon dev docs"
---

# Testing Tools

Tools and resources for testing ActivityPub implementations. This site's own interactive tools are under [Testing & Debugging](/docs/tools/overview).

## Online Tools

| Tool | What it does |
|------|--------------|
| [BrowserPub](https://browser.pub/) | Browse any actor or object as ActivityPub JSON, following links between them |
| [ActivityPub Academy](https://activitypub.academy/) | A Mastodon test server (it runs **Mastodon 4.1.18**, so newer 4.5–4.7 behaviour isn't reproduced) |
| [webfinger.net](https://webfinger.net/) | WebFinger lookups |
| [JSON-LD Playground](https://json-ld.org/playground/) | Expand, compact and inspect JSON-LD |

## Command-Line Testing

### Fedify CLI

The [Fedify CLI](https://fedify.dev/cli) (`npx @fedify/cli …`) covers most day-to-day debugging:

| Command | Use |
|---------|-----|
| `fedify lookup <handle-or-URL>` | Fetch an actor or object; add `--authorized-fetch` to sign the request (needed for servers in secure mode) |
| `fedify webfinger <handle>` | WebFinger lookup |
| `fedify nodeinfo <host>` | NodeInfo lookup |
| `fedify inbox` | Run a temporary inbox that logs what other servers send you |
| `fedify tunnel <port>` | Expose a local server over HTTPS for federation testing |

### curl

WebFinger and NodeInfo answer unsigned requests:

```bash
curl "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social"
curl https://mastodon.social/.well-known/nodeinfo
```

Actor and object fetches need the right `Accept` header — and many servers, including mastodon.social, answer **401** unless the request is signed (see [Authorized Fetch](/docs/security/authorized-fetch)):

```bash
# Works only against servers without secure mode
curl -H "Accept: application/activity+json" https://your-test-server.example/users/test
```

## Local Development

- **Expose a local server** with `fedify tunnel 3000` or [ngrok](https://ngrok.com/) (`ngrok http 3000`) — remote servers need a public HTTPS URL.
- **Run a real server to federate with.** This site's [tutorial](/docs/getting-started/your-first-activitypub-server) is tested in CI against GoToSocial in Docker; its [integration setup](https://github.com/socialdocs/socialdocs.org/tree/gh-pages/examples/first-server) is a reusable template. For Mastodon, follow its [development setup guide](https://docs.joinmastodon.org/dev/setup/) — a bare `docker compose up` from the repository is not enough.

## Test Cases

### Minimum Viable Actor

Test your actor endpoint returns:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/test",
  "preferredUsername": "test",
  "inbox": "https://example.com/users/test/inbox",
  "outbox": "https://example.com/users/test/outbox",
  "publicKey": {
    "id": "https://example.com/users/test#main-key",
    "owner": "https://example.com/users/test",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

### WebFinger Response

Test `/.well-known/webfinger?resource=acct:test@example.com`:

```json
{
  "subject": "acct:test@example.com",
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://example.com/users/test"
    }
  ]
}
```

### HTTP Signature Validation

Use existing servers to test signing:

1. Create test activity
2. Sign with your implementation
3. POST to real inbox (test instance)
4. Check for 202 Accepted — but note Mastodon accepts the request before processing it, so a 202 only means the signature passed; confirm the activity actually took effect on the remote side (see [Troubleshooting](/docs/guides/troubleshooting))

## Integration Testing

### Test Matrix

| Test | Description | Expected |
|------|-------------|----------|
| Actor fetch | GET /users/test | Valid actor JSON |
| WebFinger | GET /.well-known/webfinger | Links array |
| NodeInfo | GET /.well-known/nodeinfo | Valid nodeinfo |
| Inbox POST | POST activity | 202 Accepted |
| Follow | Send Follow | Accept received |
| Create | Send Create Note | Note appears |

### Automated Testing Script

```python
import requests

BASE_URL = "https://your-server.example"

def test_actor():
    resp = requests.get(
        f"{BASE_URL}/users/test",
        headers={"Accept": "application/activity+json"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "Person"
    assert "inbox" in data
    print("✓ Actor endpoint")

def test_webfinger():
    resp = requests.get(
        f"{BASE_URL}/.well-known/webfinger",
        params={"resource": "acct:test@your-server.example"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "links" in data
    print("✓ WebFinger endpoint")

if __name__ == "__main__":
    test_actor()
    test_webfinger()
    print("All tests passed!")
```

## Debugging

### Common Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| 401 on inbox | Bad or missing signature | Read the JSON error in the response body |
| HTML instead of JSON for an actor | Missing or wrong `Accept` header | Send `Accept: application/activity+json` |
| 401 when fetching | Server requires signed fetches | Sign `GET`s |
| Signature rejected as expired | Clock skew | Sync NTP |

See [Troubleshooting by Symptom](/docs/guides/troubleshooting) for more.

### Logging

Log incoming requests while developing (not in production — signatures and bodies may contain private data):

```javascript
// Node.js example
app.use((req, res, next) => {
  console.log({
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  next();
});
```

## Test Accounts

Prefer your own test instance (local Docker or a small VPS) so you can read its logs. ActivityPub Academy is useful for quick checks but runs an old Mastodon (4.1.18).

## See Also

- **[Troubleshooting by symptom](/docs/guides/troubleshooting)**
- **[Compliance Checklist](/docs/tools/compliance-checklist)**
- **[WebFinger Lookup](/docs/guides/webfinger-implementation#lookup-tools)**

