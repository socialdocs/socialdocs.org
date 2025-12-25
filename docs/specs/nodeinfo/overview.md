---
sidebar_position: 1
title: NodeInfo
description: Server metadata protocol for Fediverse instances
---

# NodeInfo

NodeInfo is a protocol for exposing metadata about a server. It provides information like software name, version, usage statistics, and supported protocols.

## Specification

- **Repository**: [https://nodeinfo.diaspora.software/](https://nodeinfo.diaspora.software/)
- **Schema**: [https://nodeinfo.diaspora.software/schema.html](https://nodeinfo.diaspora.software/schema.html)

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

```json
{
  "version": "2.1",
  "software": {
    "name": "mastodon",
    "version": "4.2.0",
    "repository": "https://github.com/mastodon/mastodon",
    "homepage": "https://joinmastodon.org/"
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
    "nodeName": "Example Mastodon",
    "nodeDescription": "A friendly Mastodon instance"
  }
}
```

### Properties

| Property | Description |
|----------|-------------|
| `version` | NodeInfo schema version |
| `software.name` | Software name (lowercase) |
| `software.version` | Software version |
| `protocols` | Supported protocols |
| `usage.users` | User statistics |
| `usage.localPosts` | Number of local posts |
| `openRegistrations` | Whether signups are open |
| `services` | Connected services |
| `metadata` | Additional custom data |

## Implementation

### Discovery Endpoint

```javascript
app.get('/.well-known/nodeinfo', (req, res) => {
  res.json({
    links: [
      {
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
        href: `https://${req.hostname}/nodeinfo/2.1`
      },
      {
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
        href: `https://${req.hostname}/nodeinfo/2.0`
      }
    ]
  });
});
```

### NodeInfo Endpoint

```javascript
app.get('/nodeinfo/2.1', async (req, res) => {
  const stats = await getStats();

  res.json({
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
  });
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

Both are widely supported. Implement 2.1 and optionally 2.0 for compatibility.

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

- [FediDB](https://fedidb.org/) - Statistics
- [The-Federation.info](https://the-federation.info/) - Network stats
- [Fediverse.observer](https://fediverse.observer/) - Instance browser
- Instance pickers and directories

## Metadata Extensions

The `metadata` object can contain custom properties:

```json
{
  "metadata": {
    "nodeName": "Cool Server",
    "nodeDescription": "A very cool server",
    "maintainer": {
      "name": "Admin",
      "email": "admin@example.com"
    },
    "langs": ["en", "de"],
    "tosUrl": "https://example.com/tos",
    "privacyUrl": "https://example.com/privacy",
    "repositoryUrl": "https://github.com/example/myserver",
    "feedbackUrl": "https://github.com/example/myserver/issues"
  }
}
```

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
