---
sidebar_position: 4
title: WebFinger Endpoint
description: Reference for the WebFinger discovery endpoint
---

# WebFinger Endpoint

WebFinger (RFC 7033) discovers actor profiles from handles.

## Endpoint

```
GET /.well-known/webfinger?resource=acct:{user}@{domain}
```

## Request

```http
GET /.well-known/webfinger?resource=acct:alice@example.com
Accept: application/jrd+json
```

## Response

```json
{
  "subject": "acct:alice@example.com",
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://example.com/users/alice"
    }
  ]
}
```

## Required Fields

| Field | Description |
|-------|-------------|
| subject | Requested resource |
| links[].rel | `self` for ActivityPub |
| links[].type | `application/activity+json` |
| links[].href | Actor URL |

## Implementation

```javascript
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;
  const [, user, domain] = resource.match(/acct:(.+)@(.+)/);

  res.type('application/jrd+json').json({
    subject: resource,
    links: [{
      rel: 'self',
      type: 'application/activity+json',
      href: `https://${domain}/users/${user}`
    }]
  });
});
```

## CORS

Allow cross-origin requests:

```javascript
res.header('Access-Control-Allow-Origin', '*');
```

## See Also

- **[WebFinger Lookup Tool](/docs/tools/webfinger-lookup)**
- **[WebFinger Implementation](/docs/guides/webfinger-implementation)**
