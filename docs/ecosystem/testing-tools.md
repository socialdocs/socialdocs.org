---
sidebar_position: 21
title: Testing Tools
description: Tools for testing ActivityPub implementations
---

# Testing Tools

Tools and resources for testing ActivityPub implementations.

## Online Tools

### ActivityPub Academy

Test server for development.

| Property | Value |
|----------|-------|
| Website | [activitypub.academy](https://activitypub.academy/) |
| Purpose | Interactive testing |
| Features | Test actors, activities |

### Webfinger.net

WebFinger lookup tool.

| Property | Value |
|----------|-------|
| Website | [webfinger.net](https://webfinger.net/) |
| Purpose | Test WebFinger |
| Usage | Enter handle, see response |

### JSON-LD Playground

Validate JSON-LD documents.

| Property | Value |
|----------|-------|
| Website | [json-ld.org/playground](https://json-ld.org/playground/) |
| Purpose | Expand/compact JSON-LD |
| Features | Visualize document |

## Command-Line Testing

### curl for ActivityPub

**Fetch an actor:**
```bash
curl -H "Accept: application/activity+json" \
  https://mastodon.social/users/Gargron
```

**Test WebFinger:**
```bash
curl "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social"
```

**Fetch NodeInfo:**
```bash
curl https://mastodon.social/.well-known/nodeinfo
```

### httpie (alternative to curl)

```bash
# Install: pip install httpie
http GET https://mastodon.social/users/Gargron \
  Accept:application/activity+json
```

## Local Development

### Test Servers

**ActorServer** - Minimal test server:
```bash
# Python example
python -m http.server 8000
# Serve static actor JSON
```

**ngrok** - Expose local server:
```bash
ngrok http 3000
# Get public URL for testing federation
```

### Local Mastodon

For integration testing:

```bash
git clone https://github.com/mastodon/mastodon
cd mastodon
docker-compose up
# Access at localhost:3000
```

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
4. Check for 202 Accepted

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
| 401 on inbox | Bad signature | Check signing |
| 404 on actor | Wrong Accept | Add header |
| No federation | Blocked IP | Check firewall |
| Signature invalid | Clock skew | Sync NTP |

### Logging

Enable verbose logging:

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

### Public Test Instances

- **activitypub.academy** - Test server
- **Your own test instance** - Recommended

### Creating Test Accounts

1. Set up local Mastodon
2. Create test users
3. Follow/interact with your server
4. Check delivery and responses

## See Also

- **[Debugging Tips](/docs/tools/debugging-tips)**
- **[Compliance Checklist](/docs/tools/compliance-checklist)**
- **[WebFinger Lookup](/docs/tools/webfinger-lookup)**

