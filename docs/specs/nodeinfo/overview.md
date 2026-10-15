---
sidebar_position: 1
title: NodeInfo
description: Server metadata protocol for Fediverse instances
last_verified: 2026-10-15
verified_against: "NodeInfo PROTOCOL.md and 2.0/2.1 JSON schemas (jhass/nodeinfo), FEP-0151 (FINAL), mastodon.social and misskey.io NodeInfo (fetched 2026-10-15)"
---

# NodeInfo

NodeInfo is a protocol for exposing metadata about a server. It provides information like software name, version, usage statistics, and supported protocols.

## Specification

- **Repository**: [https://nodeinfo.diaspora.software/](https://nodeinfo.diaspora.software/)
- **Schema**: [https://nodeinfo.diaspora.software/schema.html](https://nodeinfo.diaspora.software/schema.html) (JSON Schemas in [jhass/nodeinfo](https://github.com/jhass/nodeinfo/tree/main/schemas))
- **Fediverse guidance**: [FEP-0151](https://codeberg.org/fediverse/fep/src/branch/main/fep/0151/fep-0151.md) (FINAL)

## How It Works

```
1. Client fetches /.well-known/nodeinfo
2. Response contains links to NodeInfo documents
3. Client fetches the NodeInfo document
4. Gets server metadata
```

## Discovery

### Request

```http
GET /.well-known/nodeinfo HTTP/1.1
Host: example.com
Accept: application/json
```

### Response

```json
{
  "links": [
    {
      "rel": "http://nodeinfo.diaspora.software/ns/schema/2.1",
      "href": "https://example.com/nodeinfo/2.1"
    },
    {
      "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
      "href": "https://example.com/nodeinfo/2.0"
    }
  ]
}
```

## NodeInfo Document

### Schema 2.1 (Current)

All of `version`, `software` (with `name` and `version`), `protocols` (at least one), `services`, `openRegistrations`, `usage` (with `users`) and `metadata` are **required** by both the 2.0 and 2.1 schemas; `software.name` must match `^[a-z0-9-]+$`.

```json
{
  "version": "2.1",
  "software": {
    "name": "myserver",
    "version": "1.0.0",
    "repository": "https://github.com/example/myserver",
    "homepage": "https://example.com/"
  },
  "protocols": ["activitypub"],
  "usage": {
    "users": {
      "total": 1000,
      "activeMonth": 500,
      "activeHalfyear": 800
    },
    "localPosts": 50000
  },
  "openRegistrations": true,
  "services": {
    "inbound": [],
    "outbound": ["atom1.0", "rss2.0"]
  },
  "metadata": {
    "nodeName": "Example Server",
    "nodeDescription": "A friendly ActivityPub server"
  }
}
```

Mastodon (4.7) publishes **only NodeInfo 2.0**: mastodon.social's `/.well-known/nodeinfo` links just `/nodeinfo/2.0`, with `nodeName`, `nodeDescription`, `optInServerDirectory` and `optInServerRecommendation` in `metadata`. Don't assume a 2.1 document exists — follow whatever the discovery document links.

### Properties

| Property | Description |
|----------|-------------|
| `version` | NodeInfo schema version |
| `software.name` | Software name (`^[a-z0-9-]+$`) |
| `software.version` | Software version |
| `protocols` | Supported protocols |
| `usage.users` | User statistics |
| `usage.localPosts` | Number of local posts |
| `usage.localComments` | Number of local comments (optional) |
| `openRegistrations` | Whether signups are open |
| `services` | Third-party services the server can receive from (`inbound`) or publish to (`outbound`), e.g. `rss2.0` |
| `metadata` | Additional custom data |

## Implementation

### Discovery Endpoint

```javascript
// Use your configured domain, not req.hostname (the Host header is client-controlled)
const DOMAIN = 'example.com';

app.get('/.well-known/nodeinfo', (req, res) => {
  res.json({
    links: [
      {
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
        href: `https://${DOMAIN}/nodeinfo/2.1`
      }
    ]
  });
});
```

### NodeInfo Endpoint

```javascript
app.get('/nodeinfo/2.1', async (req, res) => {
  const stats = await getStats();

  // The protocol asks for this media type, with the schema as profile
  res.type('application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"');
  res.send(JSON.stringify({
    version: '2.1',
    software: {
      name: 'myserver',
      version: '1.0.0',
      repository: 'https://github.com/example/myserver',
      homepage: 'https://example.com'
    },
    protocols: ['activitypub'],
    usage: {
      users: {
        total: stats.totalUsers,
        activeMonth: stats.activeMonth,
        activeHalfyear: stats.activeHalfYear
      },
      localPosts: stats.localPosts
    },
    openRegistrations: true,
    services: {
      inbound: [],
      outbound: []
    },
    metadata: {
      nodeName: 'My ActivityPub Server',
      nodeDescription: 'A custom ActivityPub implementation'
    }
  }));
});

async function getStats() {
  const now = new Date();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const halfYearAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

  return {
    totalUsers: await db.users.count(),
    activeMonth: await db.users.count({ lastActiveAt: { $gte: monthAgo } }),
    activeHalfYear: await db.users.count({ lastActiveAt: { $gte: halfYearAgo } }),
    localPosts: await db.posts.count()
  };
}
```

## Schema Versions

### 2.0 vs 2.1

Version 2.1 adds:
- `software.repository` - Source code URL
- `software.homepage` - Project homepage

FEP-0151 says servers SHOULD implement 2.1. Clients follow the highest version linked from the discovery document, so publishing only 2.1 is fine; publish 2.0 too only if you need very old consumers.

### FEP-0151 (2025 edition)

[FEP-0151](https://codeberg.org/fediverse/fep/src/branch/main/fep/0151/fep-0151.md) (FINAL, March 2026) is the current guidance on NodeInfo in fediverse software — a revised version of the 2020 FEP-f1d5. Key rules:

- Treat `software.name` and `software.version` as **opaque strings**: you MUST NOT infer capabilities from them (version info MAY be used to block software with known vulnerabilities).
- Servers that want to hide usage statistics SHOULD publish an empty `usage.users` object rather than skewed numbers.
- For capability discovery, prefer protocol-level mechanisms such as [FEP-844e](https://codeberg.org/fediverse/fep/src/branch/main/fep/844e/fep-844e.md) over NodeInfo.

## Common Software Names

| Software | Name Value |
|----------|------------|
| Mastodon | `mastodon` |
| Pleroma | `pleroma` |
| Pixelfed | `pixelfed` |
| Lemmy | `lemmy` |
| PeerTube | `peertube` |
| Misskey | `misskey` |
| GoToSocial | `gotosocial` |

## Protocols

| Protocol | Description |
|----------|-------------|
| `activitypub` | ActivityPub federation |
| `diaspora` | Diaspora protocol |
| `ostatus` | OStatus (legacy) |
| `zot` | Zot protocol (Hubzilla) |

## Usage by Federation Tools

NodeInfo is used by:

- [FediDB](https://fedidb.com/) - Statistics
- Instance pickers and directories

## Metadata Extensions

`metadata` is free-form. FEP-0151 lists the widely used keys: `nodeName`, `nodeDescription`, `staffAccounts` (actor IDs) and `federation.enabled`:

```json
{
  "metadata": {
    "nodeName": "My server",
    "nodeDescription": "My server",
    "staffAccounts": ["https://social.example/actors/1"],
    "federation": { "enabled": true }
  }
}
```

Other keys vary by software. Misskey, for example, publishes `maintainer`, `langs`, `tosUrl`, `privacyPolicyUrl`, `repositoryUrl`, `feedbackUrl` and more (from misskey.io's `/nodeinfo/2.1`). Treat anything outside FEP-0151's list as software-specific.

## Caching

NodeInfo can be cached:

```javascript
res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
```

## Testing

```bash
# Fetch discovery document
curl https://mastodon.social/.well-known/nodeinfo

# Fetch NodeInfo
curl https://mastodon.social/nodeinfo/2.0
```

## Next Steps

- **[Server Software](/docs/ecosystem/server-software)** - Fediverse platforms
- **[Building an Actor](/docs/guides/building-an-actor)** - Full implementation
