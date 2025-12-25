---
sidebar_position: 2
title: Actors
description: Understanding Actors in ActivityPub - users, bots, organizations, and more
---

# Actors

In ActivityPub, an **Actor** is any entity that can perform activities. Most commonly actors represent users, but they can also represent bots, organizations, services, or groups.

## Actor Types

ActivityStreams defines five actor types:

| Type | Description | Use Case |
|------|-------------|----------|
| `Person` | A human user | Individual accounts |
| `Application` | A software bot | Automated accounts, bots |
| `Organization` | A company or group | Business accounts |
| `Service` | A software service | Relay servers, bridges |
| `Group` | A shared actor | Communities, forums |

## Required Properties

Every actor MUST have:

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
| `sharedInbox` | Server-wide inbox for batch delivery |
| `proxyUrl` | Proxy for fetching remote objects |
| `oauthAuthorizationEndpoint` | OAuth 2.0 authorization |
| `oauthTokenEndpoint` | OAuth 2.0 token endpoint |

## Public Key

Actors MUST include a public key for HTTP Signature verification:

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
| `publicKeyPem` | PEM-encoded RSA public key |

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

Mastodon adds several properties to actors:

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

Server-level actors for relays, bridges, and bots:

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
  "attributedTo": "https://lemmy.example/u/admin"
}
```

## Actor Verification

When receiving activities, verify:

1. **Actor ID domain matches keyId domain**
2. **Public key belongs to actor**
3. **Actor is not blocked**

```javascript
function verifyActor(activity, signature) {
  const actorUrl = new URL(activity.actor);
  const keyUrl = new URL(signature.keyId);

  // Key must be on same domain as actor
  if (actorUrl.hostname !== keyUrl.hostname) {
    throw new Error('Key domain mismatch');
  }

  // Fetch and verify actor owns the key
  const actor = await fetchActor(activity.actor);
  if (actor.publicKey.id !== signature.keyId) {
    throw new Error('Key ID mismatch');
  }

  return true;
}
```

## Caching Actors

Cache remote actors to reduce requests:

| Approach | TTL | Notes |
|----------|-----|-------|
| Short cache | 1-24 hours | Good for active federation |
| Long cache | 1-7 days | Reduces requests, staler data |
| On-demand | Fetch when needed | Most current, more requests |

Recommended: 24-hour cache with refresh on key operations.

## Next Steps

- **[Objects](/docs/specs/activitypub/objects)** - Content that actors create
- **[Activities](/docs/specs/activitypub/activities)** - Actions actors perform
- **[Building an Actor](/docs/guides/building-an-actor)** - Implementation guide
