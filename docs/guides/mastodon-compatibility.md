---
sidebar_position: 17
title: Mastodon Compatibility
description: Ensuring your ActivityPub implementation works with Mastodon
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (context_helper.rb, fetch_remote_actor_service.rb, process_account_service.rb, status_parser.rb, create.rb, vote_serializer.rb, signature_verification.rb, account.rb) and docs.joinmastodon.org/spec/activitypub"
---

# Mastodon Compatibility

Mastodon is the largest ActivityPub implementation, making compatibility essential for any fediverse application. This guide covers Mastodon-specific requirements, extensions, and common interoperability issues.

## Mastodon's ActivityPub Extensions

Mastodon extends the standard vocabulary with terms in its own `toot:` namespace (`http://joinmastodon.org/ns#`) and reuses some `as:`, `schema:` and FEP terms. These are the definitions Mastodon itself publishes ([`context_helper.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb)); copy the ones you use into your own `@context`:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "manuallyApprovesFollowers": "as:manuallyApprovesFollowers",
      "sensitive": "as:sensitive",
      "Hashtag": "as:Hashtag",
      "movedTo": { "@id": "as:movedTo", "@type": "@id" },
      "alsoKnownAs": { "@id": "as:alsoKnownAs", "@type": "@id" },
      "toot": "http://joinmastodon.org/ns#",
      "Emoji": "toot:Emoji",
      "featured": { "@id": "toot:featured", "@type": "@id" },
      "featuredTags": { "@id": "toot:featuredTags", "@type": "@id" },
      "discoverable": "toot:discoverable",
      "indexable": "toot:indexable",
      "memorial": "toot:memorial",
      "suspended": "toot:suspended",
      "votersCount": "toot:votersCount",
      "focalPoint": { "@id": "toot:focalPoint", "@container": "@list" },
      "blurhash": "toot:blurhash",
      "schema": "http://schema.org#",
      "PropertyValue": "schema:PropertyValue",
      "value": "schema:value"
    }
  ]
}
```

Note that `sensitive` is `as:sensitive`, not a `toot:` term.

## Actor Requirements

### Minimum Actor Structure

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "toot": "http://joinmastodon.org/ns#",
      "discoverable": "toot:discoverable"
    }
  ],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "following": "https://example.com/users/alice/following",
  "followers": "https://example.com/users/alice/followers",
  "preferredUsername": "alice",
  "name": "Alice",
  "summary": "<p>Hello, I'm Alice!</p>",
  "url": "https://example.com/@alice",
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/avatars/alice.png"
  },
  "image": {
    "type": "Image",
    "mediaType": "image/jpeg",
    "url": "https://example.com/headers/alice.jpg"
  },
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "discoverable": true,
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

### Required Properties

What Mastodon rejects an actor without ([`fetch_remote_actor_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/fetch_remote_actor_service.rb), [`process_account_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb)):

| Property | Requirement |
|----------|-------------|
| `id` | Exactly the URL the actor was fetched from |
| `type` | `Person`, `Service`, `Application`, `Group` or `Organization` (`Service`/`Application` are shown as bots) |
| `inbox` | URL accepting POST requests for activities |
| `preferredUsername` | The handle's username, matching `[a-z0-9_]+([.-]+[a-z0-9_]+)*`; or an FEP-2c59 `webfinger` property |
| WebFinger | `acct:username@host` must return a `self` link equal to `id` |

Also publish:

| Property | Why |
|----------|-----|
| `publicKey` (or FEP-521a `assertionMethod`) | Without a key, nothing you sign can be verified |
| `outbox`, `followers`, `following` | `inbox` and `outbox` are required by the ActivityPub spec ([§4.1](https://www.w3.org/TR/activitypub/#actor-objects)); Mastodon shows post, following and follower counts from each collection's `totalItems` ([`process_account_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb)) |

### Mastodon-Specific Properties

| Property | Description |
|----------|-------------|
| `discoverable` | Whether to include in the profile directory |
| `indexable` | Whether public posts may be full-text indexed |
| `featured` | URL to pinned posts collection |
| `featuredTags` | URL to featured hashtags collection |
| `suspended`, `memorial` | Account flags |
| `manuallyApprovesFollowers` | Locked account requiring follow approval |
| `attachment` (`PropertyValue`) | Profile metadata fields |
| `endpoints.sharedInbox` | Shared inbox for efficient delivery |

From [Mastodon's profile properties list](https://docs.joinmastodon.org/spec/activitypub/#profile).

## Visibility Levels

Mastodon derives one of four visibility levels from the addressing, checking in this order: public address in `to`, public address in `cc`, the author's followers collection in `to`, anything else ([`status_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/status_parser.rb)). The public address may be written in full, as `as:Public` or as `Public`.

### Public

```json
{
  "type": "Create",
  "object": { "type": "Note", "content": "..." },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

### Unlisted (Hidden from timelines)

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

### Followers-Only

```json
{
  "to": ["https://example.com/users/alice/followers"],
  "cc": []
}
```

### Direct Message

Every addressed account must also be tagged with a `Mention`, or Mastodon stores the post with "limited" visibility instead ([`create.rb` `process_audience`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)):

```json
{
  "to": ["https://example.com/users/bob"],
  "cc": [],
  "object": {
    "type": "Note",
    "to": ["https://example.com/users/bob"],
    "tag": [{ "type": "Mention", "href": "https://example.com/users/bob", "name": "@bob@example.com" }]
  }
}
```

## Note Format

### Complete Note Example

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://example.com/notes/123",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>Hello <span class=\"h-card\"><a href=\"https://example.com/users/bob\" class=\"u-url mention\">@<span>bob</span></a></span>!</p>",
  "published": "2024-01-15T12:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://example.com/users/alice/followers",
    "https://example.com/users/bob"
  ],
  "inReplyTo": null,
  "sensitive": false,
  "summary": null,
  "tag": [
    {
      "type": "Mention",
      "href": "https://example.com/users/bob",
      "name": "@bob@example.com"
    }
  ],
  "attachment": [],
  "url": "https://example.com/@alice/123"
}
```

### Content Formatting

Mastodon renders mentions and hashtags with this markup. The classes matter: they are among the few Mastodon's sanitizer keeps ([sanitization](https://docs.joinmastodon.org/spec/activitypub/#sanitization)).

```html
<span class="h-card"><a href="https://example.com/users/bob" class="u-url mention">@<span>bob</span></a></span>
<a href="https://example.com/tags/fediverse" class="mention hashtag" rel="tag">#<span>fediverse</span></a>
```

Build it from tokens rather than by running regular expressions over HTML, and escape every value you insert:

```javascript
const escapeHtml = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// parts: [{ text }, { mention: { username, url } }, { hashtag: { name, url } }]
function formatContent(parts) {
  const html = parts.map((p) => {
    if (p.mention) {
      return `<span class="h-card"><a href="${escapeHtml(p.mention.url)}" class="u-url mention">` +
        `@<span>${escapeHtml(p.mention.username)}</span></a></span>`;
    }
    if (p.hashtag) {
      return `<a href="${escapeHtml(p.hashtag.url)}" class="mention hashtag" rel="tag">` +
        `#<span>${escapeHtml(p.hashtag.name)}</span></a>`;
    }
    return escapeHtml(p.text);
  }).join('');
  return `<p>${html}</p>`;
}
```

The `content` markup is only for display: each mention also needs a `Mention` entry in `tag`, and each hashtag a `Hashtag` entry ([Mentions and Hashtags](/docs/guides/mentions-and-hashtags)).

### Content Warnings

```json
{
  "type": "Note",
  "sensitive": true,
  "summary": "Content warning text here",
  "content": "<p>The actual post content...</p>"
}
```

## Media Attachments

### Image with BlurHash

```json
{
  "type": "Document",
  "mediaType": "image/jpeg",
  "url": "https://example.com/media/photo.jpg",
  "name": "Alt text description",
  "width": 1920,
  "height": 1080,
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
  "focalPoint": [0.0, 0.0]
}
```

### Video Attachment

```json
{
  "type": "Document",
  "mediaType": "video/mp4",
  "url": "https://example.com/media/video.mp4",
  "name": "Video description",
  "width": 1280,
  "height": 720,
  "blurhash": "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."
}
```

### BlurHash Generation

```javascript
import { encode } from 'blurhash';
import sharp from 'sharp';

async function generateBlurhash(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // x components
    4  // y components
  );
}
```

## Polls

### Poll Format

Options are `Note`s without an `id`, each with a `replies` collection holding its vote count; `oneOf` is a single-choice poll and `anyOf` multiple-choice ([Mastodon polls](https://docs.joinmastodon.org/spec/activitypub/#Question)).

```json
{
  "type": "Question",
  "id": "https://example.com/notes/poll-123",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>What's your favorite color?</p>",
  "endTime": "2024-01-16T12:00:00Z",
  "oneOf": [
    {
      "type": "Note",
      "name": "Red",
      "replies": {
        "type": "Collection",
        "totalItems": 10
      }
    },
    {
      "type": "Note",
      "name": "Blue",
      "replies": {
        "type": "Collection",
        "totalItems": 15
      }
    }
  ],
  "votersCount": 25
}
```

### Voting

A vote is a `Create` of a `Note` whose `name` exactly matches the option, `inReplyTo` the poll, addressed only to the poll's author. This is what Mastodon sends ([`vote_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/vote_serializer.rb)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://other.example/users/bob#votes/827163/activity",
  "type": "Create",
  "actor": "https://other.example/users/bob",
  "to": "https://example.com/users/alice",
  "object": {
    "id": "https://other.example/users/bob#votes/827163",
    "type": "Note",
    "name": "Blue",
    "attributedTo": "https://other.example/users/bob",
    "to": "https://example.com/users/alice",
    "inReplyTo": "https://example.com/notes/poll-123"
  }
}
```

For multiple-choice polls, send one `Create` per chosen option.

## Custom Emoji

```json
{
  "type": "Emoji",
  "id": "https://example.com/emoji/blobcat",
  "name": ":blobcat:",
  "updated": "2024-01-01T00:00:00Z",
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/emoji/blobcat.png"
  }
}
```

## HTTP Signature Requirements

Mastodon requires a valid HTTP signature on every POST to an inbox. GET requests for actors and posts only need one when the server runs in secure mode ("authorized fetch"), which some instances, including mastodon.social, do ([Authorized Fetch](/docs/security/authorized-fetch)).

### Signing Outgoing Requests

Use tested code rather than assembling signing strings by hand: [`signCavage` and `signRfc9421`](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/examples/verify-requests/src/sign.js) from the verification module, wrapped for delivery in [Sending Activities](/docs/guides/sending-activities#signing-and-sending). Mastodon's own rules for what you send:

- the signature covers `(request-target)` (with the query string), `host`, `date` and, for a POST, `digest`
- `Digest: SHA-256=<base64>` is computed over the exact bytes of the body
- a signature is valid for about 65 minutes after its `Date` (5-minute default expiry plus 1 hour of clock skew), and is rejected if dated more than an hour in the future
- Mastodon 4.7 accepts both draft-cavage signatures and RFC 9421, and retries its own deliveries with RFC 9421 when a server answers `400` or `401`

Details and Mastodon's exact error messages: [HTTP Signatures](/docs/specs/http-signatures/overview) and [Troubleshooting by Symptom](/docs/guides/troubleshooting).

### Verifying Incoming Requests

:::tip Use the tested verifier
Request verification has its own page with tested code: **[Verifying incoming requests](/docs/security/verifying-requests)**. It covers draft-cavage and RFC 9421, the digest over the raw body, the required signed headers, binding the key owner to `activity.actor`, and SSRF-safe key fetching.
:::

## Common Compatibility Issues

### Missing WebFinger

Mastodon requires WebFinger for user discovery, and requires its `self` link to point back to the actor's `id`. Answer only for your own domain and for accounts that exist:

```javascript
app.get('/.well-known/webfinger', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const m = /^acct:([^@]+)@(.+)$/.exec(String(req.query.resource || ''));
  if (!m) return res.status(400).end();
  if (m[2].toLowerCase() !== DOMAIN.toLowerCase()) return res.status(404).end();

  const user = await db.actors.findOne({ usernameLower: m[1].toLowerCase() });
  if (!user) return res.status(404).end();

  res.type('application/jrd+json').send(JSON.stringify({
    subject: `acct:${user.preferredUsername}@${DOMAIN}`,
    links: [{ rel: 'self', type: 'application/activity+json', href: user.id }]
  }));
});
```

More in [WebFinger Implementation](/docs/guides/webfinger-implementation).

### Wrong Content-Type

Mastodon expects specific media types:

```javascript
// For actor/object responses
res.setHeader('Content-Type', 'application/activity+json');

// For WebFinger
res.setHeader('Content-Type', 'application/jrd+json');
```

### Missing Accept Header Handling

Mastodon asks for `application/activity+json, application/ld+json` ([`json_ld_helper.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb)). If the same URL also serves HTML, negotiate on `Accept` and send `Vary: Accept` so caches keep the two apart:

```javascript
app.get('/users/:username', (req, res) => {
  const accept = req.headers.accept || '';
  res.vary('Accept');

  if (accept.includes('application/activity+json') ||
      accept.includes('application/ld+json')) {
    return res.type('application/activity+json').send(JSON.stringify(getActor(req.params.username)));
  }

  res.render('profile', { username: req.params.username });
});
```

### Signature Verification Failures

Common causes:
- Clock skew (keep server time in sync with NTP)
- Digest computed over re-serialised JSON instead of the exact body bytes
- Signature not covering `(request-target)`, `host`, `date` and `digest`
- The `keyId` doesn't resolve to a key listed in your actor

When Mastodon rejects your request, the response body says why. [Troubleshooting by Symptom](/docs/guides/troubleshooting) lists Mastodon's error messages and fixes; for verifying requests **you** receive, use the [tested verifier](/docs/security/verifying-requests).

## Mastodon API Compatibility

Some applications implement Mastodon's REST API alongside ActivityPub:

This is the client API that Mastodon apps speak, separate from federation, and it uses plain `application/json`. Its entities and endpoints are documented at [docs.joinmastodon.org/methods](https://docs.joinmastodon.org/methods/) and [/entities](https://docs.joinmastodon.org/entities/); for example, [`GET /api/v1/accounts/lookup`](https://docs.joinmastodon.org/methods/accounts/#lookup) resolves `acct=user@domain` to an `Account`. Implementing it lets existing Mastodon apps talk to your server; it has no effect on federation.

## Testing Mastodon Integration

### Manual Testing

```bash
# Test actor fetch
curl -H "Accept: application/activity+json" \
  https://your-server.example/users/alice

# Test WebFinger
curl "https://your-server.example/.well-known/webfinger?resource=acct:alice@your-server.example"

# Search from Mastodon
# Use the Mastodon search box with @alice@your-server.example
```

### Automated Tests

```javascript
describe('Mastodon Compatibility', () => {
  it('should be discoverable via WebFinger', async () => {
    const response = await fetch(
      'https://your-server.example/.well-known/webfinger?resource=acct:alice@your-server.example'
    );

    expect(response.status).toBe(200);
    const jrd = await response.json();
    expect(jrd.links.find(l => l.rel === 'self')).toBeDefined();
  });

  it('should return valid actor', async () => {
    const response = await fetch(
      'https://your-server.example/users/alice',
      { headers: { Accept: 'application/activity+json' } }
    );

    expect(response.headers.get('content-type')).toContain('application/activity+json');
    const actor = await response.json();
    expect(actor.id).toBe('https://your-server.example/users/alice');
    expect(actor.inbox).toBeDefined();
    expect(actor.publicKey).toBeDefined();
  });
});
```

## Next Steps

- **[Lemmy Compatibility](/docs/guides/lemmy-compatibility)** - Link aggregator federation
- **[Quote Posts and Interaction Policies](/docs/guides/quote-posts-and-interaction-policies)** - FEP-044f quotes and `canQuote`
- **[Testing Your Implementation](/docs/guides/testing-your-implementation)** - Validation tools
- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Signature details
