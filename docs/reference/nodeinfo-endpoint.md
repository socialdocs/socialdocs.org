---
sidebar_position: 6
title: NodeInfo Endpoint
description: Reference for the NodeInfo server metadata endpoint
---

# NodeInfo Endpoint

NodeInfo provides server metadata—software, version, and statistics.

## Discovery

```
GET /.well-known/nodeinfo
```

```json
{
  "links": [{
    "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
    "href": "https://example.com/nodeinfo/2.0"
  }]
}
```

## NodeInfo Response

```
GET /nodeinfo/2.0
```

```json
{
  "version": "2.0",
  "software": {
    "name": "mastodon",
    "version": "4.2.0"
  },
  "protocols": ["activitypub"],
  "usage": {
    "users": { "total": 1000 },
    "localPosts": 50000
  },
  "openRegistrations": true
}
```

## Fields

| Field | Description |
|-------|-------------|
| software.name | Server software |
| protocols | Supported protocols |
| usage.users.total | User count |
| openRegistrations | Signups open |

## Implementation

```javascript
app.get('/nodeinfo/2.0', (req, res) => {
  res.json({
    version: '2.0',
    software: { name: 'myserver', version: '1.0' },
    protocols: ['activitypub'],
    usage: { users: { total: 100 } },
    openRegistrations: true
  });
});
```

## See Also

- **[NodeInfo Specification](http://nodeinfo.diaspora.software/)**
- **[Endpoints Overview](/docs/reference/endpoints-overview)**
