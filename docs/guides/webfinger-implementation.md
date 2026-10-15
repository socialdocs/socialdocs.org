---
sidebar_position: 15
title: WebFinger Implementation
description: Implementing WebFinger for user discovery in ActivityPub
last_verified: 2026-10-15
verified_against: "RFC 7033; Mastodon v4.7.3 source (app/lib/webfinger.rb, webfinger_resource.rb, webfinger_serializer.rb, process_account_service.rb); Fedify CLI docs"
---

# WebFinger Implementation

WebFinger (RFC 7033) enables user discovery by translating `@username@domain` handles into ActivityPub actor URLs. Without WebFinger, Mastodon and most other implementations cannot find your users. This guide covers implementing WebFinger properly.

## How WebFinger Works

```
┌────────────────────────────────────────────────────────┐
│                  WEBFINGER FLOW                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  User searches: @alice@example.com                     │
│       ↓                                                │
│  Client queries:                                       │
│  https://example.com/.well-known/webfinger             │
│  ?resource=acct:alice@example.com                      │
│       ↓                                                │
│  Server returns JRD with links                         │
│       ↓                                                │
│  Client finds self link with ActivityPub type          │
│       ↓                                                │
│  Client fetches the actor URL                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## WebFinger Response Format

### JSON Resource Descriptor (JRD)

```json
{
  "subject": "acct:alice@example.com",
  "aliases": [
    "https://example.com/@alice",
    "https://example.com/users/alice"
  ],
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://example.com/users/alice"
    },
    {
      "rel": "http://webfinger.net/rel/profile-page",
      "type": "text/html",
      "href": "https://example.com/@alice"
    }
  ]
}
```

### Required Elements

| Element | Description |
|---------|-------------|
| `subject` | The canonical identifier (acct: URI) |
| `links` | Array of related resources |
| `links[].rel` | Link relation type |
| `links[].type` | Media type of the resource |
| `links[].href` | URL of the resource |

### The Critical Link

For ActivityPub, you must include a `self` link with one of the two ActivityPub media types. Mastodon's client rejects a response that has no `subject` or no such `self` link ([`webfinger.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/webfinger.rb)):

```json
{
  "rel": "self",
  "type": "application/activity+json",
  "href": "https://example.com/users/alice"
}
```

Or with the full JSON-LD type:

```json
{
  "rel": "self",
  "type": "application/ld+json; profile=\"https://www.w3.org/ns/activitystreams\"",
  "href": "https://example.com/users/alice"
}
```

## Basic Implementation

### Express.js Example

```javascript
// Look up local accounts by lower-cased username; never build a regex from input.
app.get('/.well-known/webfinger', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); // RFC 7033 §5: MUST

  const resource = req.query.resource;
  if (typeof resource !== 'string' || !resource) {
    return res.status(400).end(); // RFC 7033 §4.2: missing or malformed resource
  }

  let username;
  if (resource.startsWith('acct:')) {
    // acct:alice@example.com — split on the LAST @ and compare hosts case-insensitively
    const acct = resource.slice(5);
    const at = acct.lastIndexOf('@');
    if (at < 1) return res.status(400).end();
    if (acct.slice(at + 1).toLowerCase() !== config.domain.toLowerCase()) {
      return res.status(404).end(); // not our domain: never answer for other hosts
    }
    username = acct.slice(0, at);
  } else if (/^https:\/\//i.test(resource)) {
    // Some clients look up by actor or profile URL
    const url = new URL(resource);
    if (url.host.toLowerCase() !== config.domain.toLowerCase()) return res.status(404).end();
    username = url.pathname.match(/^\/users\/([^/]+)$/)?.[1];
  } else {
    return res.status(400).end();
  }

  const user = username && await db.actors.findOne({ usernameLower: username.toLowerCase() });
  if (!user) return res.status(404).end();

  res.type('application/jrd+json').send(JSON.stringify({
    subject: `acct:${user.preferredUsername}@${config.domain}`,
    aliases: [user.id],
    links: [
      { rel: 'self', type: 'application/activity+json', href: user.id },
      { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: user.url },
    ],
  }));
});
```

Use the account's canonical username in `subject`, whatever case the client sent. Only include a `profile-page` link if that page exists.

### Response Headers

```javascript
res.set('Content-Type', 'application/jrd+json');
res.set('Access-Control-Allow-Origin', '*');   // RFC 7033 §5: servers MUST send it
res.set('Cache-Control', 'public, max-age=3600');
```

Mastodon itself caches its WebFinger answers for 3 days, and 404/400/410 answers for 3 minutes ([`webfinger_controller.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/well_known/webfinger_controller.rb)). It answers `410 Gone` for permanently unavailable accounts.

### What Mastodon checks on your answer

When Mastodon resolves `@alice@example.com` ([`webfinger.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/webfinger.rb), [`process_account_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb)):

- It requests `https://example.com/.well-known/webfinger?resource=acct:alice@example.com` with `Accept: application/jrd+json, application/json`. It does not check the response Content-Type.
- On **404** it falls back to `/.well-known/host-meta` (an XRD template pointing to the real WebFinger URL); on **410** it treats the account as gone; any other non-200 is an error.
- The JRD must have a `subject` and a `self` link with an ActivityPub type.
- The `self` link's `href` must equal the actor's `id` exactly ("loops back"), and the username must match `[a-z0-9_]+([.-]+[a-z0-9_]+)*`.
- If `subject` names a different account than was asked for, Mastodon follows that redirect once and requires the second answer to agree.

## Querying WebFinger

### Client Implementation

```javascript
async function lookupWebFinger(handle) {
  // Parse handle: @alice@example.com or alice@example.com
  const cleaned = handle.replace(/^@/, '');
  const at = cleaned.lastIndexOf('@');
  const username = cleaned.slice(0, at);
  const domain = cleaned.slice(at + 1);

  if (at < 1 || !domain || /[\/?#]/.test(domain)) {
    throw new Error('Invalid handle format');
  }

  // RFC 7033 §4.2: HTTPS only, and percent-encode the resource
  const resource = encodeURIComponent(`acct:${username}@${domain}`);
  const url = `https://${domain}/.well-known/webfinger?resource=${resource}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/jrd+json, application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`WebFinger lookup failed: ${response.status}`);
  }

  const jrd = await response.json();

  // Find the ActivityPub actor URL
  const links = Array.isArray(jrd.links) ? jrd.links : [];
  const selfLink = links.find(link =>
    link.rel === 'self' &&
    (link.type === 'application/activity+json' ||
     link.type === 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"')
  );

  if (!selfLink) {
    throw new Error('No ActivityPub link found');
  }

  return {
    subject: jrd.subject,
    actorUrl: selfLink.href,
    profileUrl: links.find(l =>
      l.rel === 'http://webfinger.net/rel/profile-page'
    )?.href
  };
}
```

### Usage

```javascript
// Resolve a mention
const result = await lookupWebFinger('@alice@mastodon.social');
console.log(result.actorUrl);
// https://mastodon.social/users/alice
```

RFC 7033 §4.2 only allows redirects to `https` URLs; `fetch` follows any redirect, so check `response.url` starts with `https://` before trusting the answer.

On a server, the domain in a handle is user input: route these requests through an SSRF-safe fetcher that refuses private addresses (see `resolveAddress` in the [tested verification module](/docs/security/verifying-requests)). Then fetch the actor from `actorUrl` and check that its `id` equals `actorUrl` and its `preferredUsername` matches the handle.

## Additional Links

### Profile Page

```json
{
  "rel": "http://webfinger.net/rel/profile-page",
  "type": "text/html",
  "href": "https://example.com/@alice"
}
```

### Avatar

```json
{
  "rel": "http://webfinger.net/rel/avatar",
  "type": "image/png",
  "href": "https://example.com/avatars/alice.png"
}
```

### Remote Interaction Templates

Mastodon 4.7 publishes these on every account ([`webfinger_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/webfinger_serializer.rb)). The OStatus `subscribe` template is the long-standing "follow from your own server" link; the two FEP-3b86 Activity Intents templates arrived in Mastodon 4.6:

```json
[
  { "rel": "http://ostatus.org/schema/1.0/subscribe", "template": "https://example.com/authorize_interaction?uri={uri}" },
  { "rel": "https://w3id.org/fep/3b86/Create", "template": "https://example.com/share?text={content}" },
  { "rel": "https://w3id.org/fep/3b86/Object", "template": "https://example.com/authorize_interaction?uri={object}" }
]
```

## Handling Edge Cases

### Case Insensitivity

Match usernames case-insensitively, but never by building a regular expression from the request (a `.` or `*` in the input would match other accounts, and a crafted pattern can hang the server). Store a lower-cased copy and compare that:

```javascript
const user = await db.actors.findOne({ usernameLower: username.toLowerCase() });
```

### URL Resource Lookups

Some clients query with URLs instead of `acct:` URIs; RFC 7033 allows any URI as the resource, and Mastodon accepts both `acct:` and `https:` resources for its own accounts ([`webfinger_resource.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/webfinger_resource.rb)). The example above handles both.

### Multiple Domains

If you host multiple domains:

```javascript
const allowedDomains = ['example.com', 'example.org'];

app.get('/.well-known/webfinger', async (req, res) => {
  const resource = req.query.resource;
  const [username, domain] = parseResource(resource);

  if (!allowedDomains.includes(domain)) {
    return res.status(404).json({ error: 'Unknown domain' });
  }

  const user = await db.actors.findOne({
    preferredUsername: username,
    domain: domain
  });

  // ...
});
```

## CORS Configuration

RFC 7033 §5 says servers MUST send `Access-Control-Allow-Origin`, so browser-based clients can query WebFinger:

```javascript
app.use('/.well-known/webfinger', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Accept');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});
```

## Testing

### Manual Test

```bash
curl "https://example.com/.well-known/webfinger?resource=acct:alice@example.com" \
  -H "Accept: application/jrd+json"
```

### Expected Response

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

### Lookup Tools

- [webfinger.net](https://webfinger.net/lookup/?resource=acct:Gargron@mastodon.social) — look up any resource in the browser and see the raw JRD
- [webfinger.js](https://silverbucket.github.io/webfinger.js/) — open-source JavaScript client with a browser demo
- [Fedify CLI](https://fedify.dev/cli) — `fedify webfinger @alice@example.com` from the terminal; `fedify lookup @alice@example.com` follows through to the actor

### URL Encoding

RFC 7033 §4.1 says the `resource` value is percent-encoded. Accept both forms anyway, because clients send both (your framework's query parser decodes the encoded one):

```bash
curl "https://example.com/.well-known/webfinger?resource=acct%3Aalice%40example.com"
curl "https://example.com/.well-known/webfinger?resource=acct:alice@example.com"
```

### Verify the Actor Fetch

WebFinger only proves discovery. Follow the `self` link and make sure the actor itself is served as ActivityPub:

```bash
curl -H 'Accept: application/activity+json' https://example.com/users/alice
```

### Validation Checklist

- [ ] Returns 200 for valid users
- [ ] Returns 404 for unknown users and for other domains
- [ ] Returns 400 for a missing or malformed resource parameter
- [ ] Content-Type is `application/jrd+json`
- [ ] Sends `Access-Control-Allow-Origin`
- [ ] `self` link has an ActivityPub type and its `href` equals the actor's `id`
- [ ] Handles case-insensitive usernames without regex built from input
- [ ] Works with both `acct:` and URL resources

## Common Issues

### Wrong Content-Type

RFC 7033 §4.2 requires a JRD; serve it as `application/jrd+json`. Mastodon happens not to check the Content-Type, but other clients do.

```javascript
// Wrong: Express sends application/json
res.json(jrd);

// Right
res.type('application/jrd+json').send(JSON.stringify(jrd));
```

### Missing CORS

Without CORS, browser-based clients can't query WebFinger:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

### Domain Mismatch

The resource domain must match your server. Never answer for other hosts:

```javascript
if (domain !== config.domain) {
  return res.status(404).json({ error: 'Not found' });
}
```

### Wrong Link Type

These are the only two `self` link types Mastodon recognises ([`webfinger.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/webfinger.rb)):

```javascript
const validTypes = [
  'application/activity+json',
  'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
];
```

### Self Link Doesn't Loop Back

If the `self` link's `href` is not exactly the actor's `id` (a trailing slash, `http` vs `https`, a different path), Mastodon rejects the account with "does not loop back".

## Caching

Cache WebFinger responses to reduce load:

```javascript
async function cachedWebFinger(handle) {
  const cacheKey = `webfinger:${handle}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await lookupWebFinger(handle);
  await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour

  return result;
}
```

## Next Steps

- **[Testing Your Implementation](/docs/guides/testing-your-implementation)** - Validation
- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Authentication
- **[Building an Actor](/docs/guides/building-an-actor)** - Creating actors
- **[WebFinger sequence diagram](https://github.com/boyter/activitypub/blob/main/webfinger.md)** - External reference for the discovery exchange
