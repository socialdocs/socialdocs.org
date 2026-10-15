---
sidebar_position: 2
title: Mastodon
description: ActivityPub implementation details for Mastodon
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (actor_serializer.rb, activity.rb, routes.rb, signed_request.rb), mastodon.social live responses, 4.5–4.7 release notes"
---

# Mastodon

Mastodon is the most widely deployed ActivityPub server, serving as the de facto reference implementation.

## Overview

| Property | Value |
|----------|-------|
| Language | Ruby on Rails |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/mastodon/mastodon](https://github.com/mastodon/mastodon) |
| Latest release | [v4.7.3](https://github.com/mastodon/mastodon/releases/tag/v4.7.3) (2026-10-01) |
| Documentation | [docs.joinmastodon.org](https://docs.joinmastodon.org/) |

## ActivityPub Implementation

### Actor Type

Mastodon's [actor serializer](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/actor_serializer.rb) picks the type per account: `Application` for the instance actor, `Service` for bot accounts, `Group` for group accounts, and `Person` for everyone else. A trimmed user actor:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://mastodon.social/users/username",
  "preferredUsername": "username",
  "inbox": "https://mastodon.social/users/username/inbox",
  "outbox": "https://mastodon.social/users/username/outbox",
  "followers": "https://mastodon.social/users/username/followers",
  "following": "https://mastodon.social/users/username/following"
}
```

### Custom Extensions

Mastodon adds several non-standard properties:

| Property | Type | Description |
|----------|------|-------------|
| `manuallyApprovesFollowers` | Boolean | Locked account |
| `discoverable` | Boolean | Public directory |
| `indexable` | Boolean | Search indexing |
| `memorial` | Boolean | Memorial account |
| `featured` | URL | Pinned posts collection |
| `featuredTags` | URL | Pinned hashtags collection |
| `webfinger` | String | Canonical `acct:` handle ([FEP-2c59](https://codeberg.org/fediverse/fep/src/branch/main/fep/2c59/fep-2c59.md), 4.6+) |
| `interactionPolicy` | Object | Who may quote/feature ([quote posts](/docs/guides/quote-posts-and-interaction-policies)) |
| `featuredCollections` | URL | Collections ([FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md), 4.6+) |
| `attributionDomains` | Array | Domains allowed to credit this author on link previews |
| `movedTo` / `alsoKnownAs` | URL / Array | [Account migration](/docs/guides/account-migration) |

### Supported Activities

| Activity | Support | Notes |
|----------|---------|-------|
| Create | ✅ | Notes, polls (`Question`) |
| Delete | ✅ | Objects and actors ([Deletion](/docs/guides/deletion)) |
| Update | ✅ | Edits, profile updates |
| Follow / Accept / Reject | ✅ | Follow requests |
| Like | ✅ | Favourites |
| Announce | ✅ | Boosts |
| Undo | ✅ | Follow, Like, Announce, Block |
| Block | ✅ | Sent to the blocked account's server |
| Flag | ✅ | Reports, sent from the instance actor |
| Add / Remove | ✅ | Pinned posts and featured tags |
| Move | ✅ | Account migration |
| QuoteRequest | ✅ | Quote posts (4.5+) |
| FeatureRequest | ✅ | Collections (4.6+) |

Source: [`activity.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb) (inbound handlers).

### Object Types

**Note (Toot/Post)**:
```json
{
  "type": "Note",
  "id": "https://mastodon.social/users/alice/statuses/123",
  "attributedTo": "https://mastodon.social/users/alice",
  "content": "<p>Hello world!</p>",
  "published": "2024-01-15T10:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://mastodon.social/users/alice/followers"],
  "attachment": [],
  "tag": [],
  "sensitive": false,
  "inReplyTo": null
}
```

**Poll (Question)**:
```json
{
  "type": "Question",
  "content": "What's your favorite color?",
  "endTime": "2024-01-16T10:00:00Z",
  "oneOf": [
    { "type": "Note", "name": "Red", "replies": { "totalItems": 10 } },
    { "type": "Note", "name": "Blue", "replies": { "totalItems": 15 } }
  ]
}
```

## API Endpoints

### WebFinger

```
GET /.well-known/webfinger?resource=acct:user@domain
```

### NodeInfo

```
GET /.well-known/nodeinfo
GET /nodeinfo/2.0
```

### Actor

```
GET /users/{username}
Accept: application/activity+json
```

### Collections

```
GET /users/{username}/outbox
GET /users/{username}/followers
GET /users/{username}/following
```

## Recent Releases

| Version | Released | Federation-relevant changes |
|---------|----------|-----------------------------|
| [4.7](https://blog.joinmastodon.org/2026/08/mastodon-4.7/) | August 2026 | Actor `id` as primary identifier; RFC 9421 signatures (fallback) with Ed25519; FEP-8b32 proof verification; inbound FEP-521a keys; FEP-8967 `Link` attachments |
| [4.6](https://blog.joinmastodon.org/2026/06/mastodon-4.6/) | June 2026 | Collections ([FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md)); FEP-2c59 WebFinger backlink; FEP-3b86 Activity Intents; media `duration` |
| [4.5](https://github.com/mastodon/mastodon/releases/tag/v4.5.0) | November 2025 | Consent-respecting quote posts ([FEP-044f](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md)) |

Check the [release notes](https://github.com/mastodon/mastodon/releases) for the current patch version.

## Compatibility Notes

### Quirks

1. **Signatures**: draft-cavage HTTP Signatures by default; RFC 9421 accepted since 4.5 and sent as a fallback since 4.7 — see [HTTP Signatures](/docs/specs/http-signatures/overview)
2. **Date Header**: A signature without `expires` is valid for 5 minutes after its `Date`/`created`, plus 1 hour of clock skew (so about 65 minutes); explicit expiries are capped at 12 hours; anything more than 1 hour in the future is rejected ([`signed_request.rb`](https://github.com/mastodon/mastodon/blob/main/app/lib/signed_request.rb))
3. **Digest Header**: Required for POST requests
4. **Content-Type**: Serve ActivityPub documents as `application/activity+json` (or the `ld+json` profile type); plain `application/json` is ignored

### Known Issues

- Quote posts supported since v4.5 — quoting requires author approval, federated via `QuoteAuthorization`
- Since v4.7, the actor `id` (not the WebFinger handle) is the primary identifier for remote accounts, and remote accounts can change handles
- Since v4.7, Mastodon sends RFC 9421 HTTP Message Signatures as a fallback (including Ed25519 keys) and verifies [FEP-8b32](https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md) Object Integrity Proofs
- No emoji reactions (`EmojiReact` is not handled; only `Like`)

## Testing Against Mastodon

### Verify Actor Fetching

Many Mastodon servers, including mastodon.social, run in *secure mode* (authorized fetch) and answer unsigned requests with **401**. Use a client that can sign its requests, such as the [Fedify CLI](https://fedify.dev/cli) with `--authorized-fetch`:

```bash
npx @fedify/cli lookup --authorized-fetch @Gargron@mastodon.social
```

An unsigned `curl -H "Accept: application/activity+json" https://<server>/users/<name>` works only against servers without secure mode. See [Authorized Fetch](/docs/security/authorized-fetch).

### Test WebFinger

```bash
curl "https://mastodon.social/.well-known/webfinger?resource=acct:Gargron@mastodon.social"
```

## See Also

- **[Mastodon API Docs](https://docs.joinmastodon.org/)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Ruby Libraries](/docs/ecosystem/ruby-libraries)**

