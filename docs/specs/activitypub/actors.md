---
sidebar_position: 2
title: Actors
description: Understanding Actors in ActivityPub - users, bots, organizations, and more
last_verified: 2026-10-15
verified_against: "ActivityPub REC §3.1/§4.1, AS2 Vocabulary, Mastodon v4.7.3 source (actor_serializer, context_helper, signature_verification, account.rb, routes), Lemmy group.json fixture, FEP-521a/1b12"
---

# Actors

In ActivityPub, an **Actor** is any entity that can perform activities. Most commonly actors represent users, but they can also represent bots, organizations, services, or groups.

## Actor Types

ActivityStreams defines five actor types ([AS2 Vocabulary §3.2](https://www.w3.org/TR/activitystreams-vocabulary/#actor-types)):

| Type | AS2 definition | Typical use |
|------|-------------|----------|
| `Person` | An individual person | Individual accounts |
| `Application` | A software application | Server/instance actors |
| `Organization` | An organization | Business accounts |
| `Service` | A service of any kind | Bots, relays, bridges |
| `Group` | A formal or informal collective of actors | Communities, forums |

Mastodon publishes bot accounts as `Service` and its instance actor as `Application`, and treats incoming `Service`/`Application` actors as bots ([actor_serializer.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/actor_serializer.rb#L72-L80)).

## Required Properties

Every object MUST have an `id` and a `type` ([AP §3.1](https://www.w3.org/TR/activitypub/#obj-id)), and actors MUST also have an `inbox` and an `outbox` ([AP §4.1](https://www.w3.org/TR/activitypub/#actor-objects)). The security context below isn't required by the spec, but you need it for `publicKey`:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox"
}
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | String | One of the actor types |
| `id` | URL | Unique identifier (dereferenceable) |
| `inbox` | URL | Endpoint for receiving activities |
| `outbox` | URL | Collection of performed activities |

## Recommended Properties

### Identity

```json
{
  "preferredUsername": "alice",
  "name": "Alice Smith",
  "summary": "<p>Software developer and Fediverse enthusiast</p>",
  "url": "https://example.com/@alice"
}
```

| Property | Description |
|----------|-------------|
| `preferredUsername` | Handle/username (used in @mentions) |
| `name` | Display name |
| `summary` | Bio/description (HTML allowed) |
| `url` | Human-readable profile page |

### Media

```json
{
  "icon": {
    "type": "Image",
    "mediaType": "image/png",
    "url": "https://example.com/avatars/alice.png"
  },
  "image": {
    "type": "Image",
    "mediaType": "image/jpeg",
    "url": "https://example.com/headers/alice.jpg"
  }
}
```

| Property | Description |
|----------|-------------|
| `icon` | Avatar/profile picture |
| `image` | Header/banner image |

### Collections

`followers` and `following` SHOULD be present; `liked` MAY be ([AP §4.1](https://www.w3.org/TR/activitypub/#actor-objects)).

```json
{
  "followers": "https://example.com/users/alice/followers",
  "following": "https://example.com/users/alice/following",
  "liked": "https://example.com/users/alice/liked"
}
```

| Property | Description |
|----------|-------------|
| `followers` | Collection of followers |
| `following` | Collection of followed actors |
| `liked` | Collection of liked objects |

### Endpoints

`endpoints` is optional; these are some of the properties AP defines for it ([AP §4.1](https://www.w3.org/TR/activitypub/#endpoints)). In practice `sharedInbox` is the one other servers use.

```json
{
  "endpoints": {
    "sharedInbox": "https://example.com/inbox",
    "proxyUrl": "https://example.com/proxy",
    "oauthAuthorizationEndpoint": "https://example.com/oauth/authorize",
    "oauthTokenEndpoint": "https://example.com/oauth/token"
  }
}
```

| Endpoint | Description |
|----------|-------------|
| `sharedInbox` | Server-wide inbox for delivering public and followers-addressed activities once per server ([AP §7.1.3](https://www.w3.org/TR/activitypub/#shared-inbox-delivery)) |
| `proxyUrl` | Proxy for fetching remote objects |
| `oauthAuthorizationEndpoint` | OAuth 2.0 authorization |
| `oauthTokenEndpoint` | OAuth 2.0 token endpoint |

## Public Key

ActivityPub itself doesn't require keys, but in practice actors must publish a public key so other servers can verify their HTTP Signatures (Mastodon and most servers won't accept unsigned deliveries):

```json
{
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2L...\n-----END PUBLIC KEY-----"
  }
}
```

| Property | Description |
|----------|-------------|
| `id` | URL of the key (usually `{actor}#main-key`) |
| `owner` | URL of the actor owning this key |
| `publicKeyPem` | PEM-encoded public key (RSA is what everyone supports) |

RSA via `publicKey` remains the baseline for interoperability, but it is no longer the only option. [FEP-521a](https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md) (FINAL) lets an actor publish **multiple keys**, including Ed25519, as `Multikey` entries in `assertionMethod`; Mastodon 4.6 accepts multiple keys per remote actor and 4.7 also verifies Ed25519 in RFC 9421 signatures ([CHANGELOG](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md)). Multiple keys are also what makes **key rotation** workable: publish the new key alongside the old one, send an `Update` of the actor to followers, and remove the old key later. Mastodon refetches the key once when a signature fails to verify, so stale caches recover ([signature_verification.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/concerns/signature_verification.rb#L48-L66)). See [Keys and Identity](/docs/security/keys-and-identity) for details.

## Complete Actor Example

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "manuallyApprovesFollowers": "as:manuallyApprovesFollowers",
      "toot": "http://joinmastodon.org/ns#",
      "discoverable": "toot:discoverable",
      "schema": "http://schema.org#",
      "PropertyValue": "schema:PropertyValue",
      "value": "schema:value"
    }
  ],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "followers": "https://example.com/users/alice/followers",
  "following": "https://example.com/users/alice/following",
  "preferredUsername": "alice",
  "name": "Alice Smith",
  "summary": "<p>Software developer and Fediverse enthusiast</p>",
  "url": "https://example.com/@alice",
  "manuallyApprovesFollowers": false,
  "discoverable": true,
  "published": "2023-01-15T10:00:00Z",
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
  "attachment": [
    {
      "type": "PropertyValue",
      "name": "Website",
      "value": "<a href=\"https://alice.example\" rel=\"me\">alice.example</a>"
    },
    {
      "type": "PropertyValue",
      "name": "GitHub",
      "value": "<a href=\"https://github.com/alice\" rel=\"me\">github.com/alice</a>"
    }
  ],
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  },
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

## Mastodon Extensions

Mastodon adds several properties to actors, defined in its JSON-LD context ([context_helper.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/context_helper.rb)):

### Profile Fields

```json
{
  "attachment": [
    {
      "type": "PropertyValue",
      "name": "Website",
      "value": "<a href=\"https://example.com\" rel=\"me\">example.com</a>"
    }
  ]
}
```

### Featured Posts (Pinned)

```json
{
  "featured": "https://example.com/users/alice/collections/featured"
}
```

### Featured Hashtags

```json
{
  "featuredTags": "https://example.com/users/alice/collections/tags"
}
```

### Account Settings

```json
{
  "manuallyApprovesFollowers": true,
  "discoverable": true,
  "memorial": false,
  "indexable": true
}
```

| Property | Description |
|----------|-------------|
| `manuallyApprovesFollowers` | Requires follow approval |
| `discoverable` | Listed in profile directory |
| `memorial` | Account is memorialized |
| `indexable` | Posts can be indexed by search |

## Service and Application Actors

Server-level actors for relays, bridges, and bots. Mastodon's instance actor, for example, is an `Application` served at `/actor` with an inbox at `/actor/inbox` and `preferredUsername` `mastodon.internal` ([routes.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/config/routes.rb#L62-L67), [seed](https://github.com/mastodon/mastodon/blob/v4.7.3/db/seeds/02_instance_actor.rb)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Application",
  "id": "https://example.com/actor",
  "inbox": "https://example.com/inbox",
  "outbox": "https://example.com/outbox",
  "preferredUsername": "example.com",
  "name": "Example.com Server Actor"
}
```

## Group Actors

For communities (like Lemmy):

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "lemmy": "https://join-lemmy.org/ns#"
    }
  ],
  "type": "Group",
  "id": "https://lemmy.example/c/technology",
  "name": "Technology",
  "preferredUsername": "technology",
  "inbox": "https://lemmy.example/c/technology/inbox",
  "outbox": "https://lemmy.example/c/technology/outbox",
  "followers": "https://lemmy.example/c/technology/followers",
  "attributedTo": "https://lemmy.example/c/technology/moderators"
}
```

In Lemmy, `attributedTo` on a community points to its **moderators collection**, `name` is the display title and `preferredUsername` the slug ([Lemmy group.json](https://github.com/LemmyNet/lemmy/blob/main/crates/apub/apub/assets/lemmy/objects/group.json)). Group federation in general is described by [FEP-1b12](https://codeberg.org/fediverse/fep/src/branch/main/fep/1b12/fep-1b12.md) (FINAL).

## Actor Verification

When receiving activities, verify:

1. **The key belongs to the actor**: the actor's own document lists the key (`publicKey` or a FEP-521a `assertionMethod` entry). A key hosted on another origin is only acceptable if the actor document lists it.
2. **The key owner is `activity.actor`**
3. **The actor (or its domain) is not blocked**

:::tip Use the tested verifier
Request verification has its own page with tested code: **[Verifying incoming requests](/docs/security/verifying-requests)**. It covers draft-cavage and RFC 9421, the digest over the raw body, the required signed headers, binding the key owner to `activity.actor`, and SSRF-safe key fetching.
:::

## Caching Actors

Cache remote actors to reduce requests, but refresh them:

- **Periodically.** Mastodon treats a remote account as possibly stale after one day and refreshes it in the background ([account.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/account.rb#L71)).
- **On `Update`.** Apply `Update` activities for the actor (after checking they come from the actor itself).
- **On signature failure.** Refetch the key once before rejecting, as above.

The TTL is your choice; one day matches Mastodon.

## Next Steps

- **[Objects](/docs/specs/activitypub/objects)** - Content that actors create
- **[Activities](/docs/specs/activitypub/activities)** - Actions actors perform
- **[Building an Actor](/docs/guides/building-an-actor)** - Implementation guide
