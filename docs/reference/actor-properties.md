---
sidebar_position: 13
title: Actor Properties
description: Reference for ActivityPub Actor properties
---

# Actor Properties

Properties specific to Actor types (Person, Group, Service, etc.).

## Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | URL | Unique actor identifier |
| `type` | String | Actor type |
| `inbox` | URL | Receiving endpoint |
| `outbox` | URL | Publishing endpoint |

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Person",
  "id": "https://example.com/users/alice",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox"
}
```

## Identity Properties

| Property | Type | Description |
|----------|------|-------------|
| `preferredUsername` | String | Handle (no @domain) |
| `name` | String | Display name |
| `summary` | String | Bio (HTML allowed) |

```json
{
  "preferredUsername": "alice",
  "name": "Alice Smith",
  "summary": "<p>Developer and <a href='#'>#Fediverse</a> enthusiast</p>"
}
```

## Collection Endpoints

| Property | Type | Description |
|----------|------|-------------|
| `followers` | URL | Followers collection |
| `following` | URL | Following collection |
| `liked` | URL | Liked posts |
| `featured` | URL | Pinned posts |
| `featuredTags` | URL | Featured hashtags |

```json
{
  "followers": "https://example.com/users/alice/followers",
  "following": "https://example.com/users/alice/following",
  "liked": "https://example.com/users/alice/liked",
  "featured": "https://example.com/users/alice/collections/featured"
}
```

## Profile Images

| Property | Type | Description |
|----------|------|-------------|
| `icon` | Image | Avatar |
| `image` | Image | Header/banner |

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

## Public Key (Security)

Required for HTTP Signatures:

```json
{
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}
```

## Service Endpoints

| Property | Type | Description |
|----------|------|-------------|
| `endpoints` | Object | Additional endpoints |
| `sharedInbox` | URL | Shared delivery inbox |

```json
{
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

## Mastodon Extensions

| Property | Type | Description |
|----------|------|-------------|
| `manuallyApprovesFollowers` | Boolean | Locked account |
| `discoverable` | Boolean | Show in directory |
| `memorial` | Boolean | Memorial account |
| `indexable` | Boolean | Allow search indexing |

```json
{
  "manuallyApprovesFollowers": false,
  "discoverable": true,
  "indexable": true
}
```

## Profile Metadata

Custom fields using `attachment`:

```json
{
  "attachment": [
    {
      "type": "PropertyValue",
      "name": "Website",
      "value": "<a href='https://example.com'>example.com</a>"
    },
    {
      "type": "PropertyValue",
      "name": "Pronouns",
      "value": "she/her"
    }
  ]
}
```

## Verification

Identity proofs with `rel=me`:

```json
{
  "attachment": [
    {
      "type": "PropertyValue",
      "name": "Website",
      "value": "<a href='https://mysite.com' rel='me'>mysite.com</a>"
    }
  ]
}
```

## Also Known As (Migration)

For account migration:

```json
{
  "alsoKnownAs": [
    "https://old.example/users/alice"
  ],
  "movedTo": "https://new.example/users/alice"
}
```

## Complete Actor Example

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://example.com/users/alice",
  "preferredUsername": "alice",
  "name": "Alice Smith",
  "summary": "<p>Developer</p>",
  "inbox": "https://example.com/users/alice/inbox",
  "outbox": "https://example.com/users/alice/outbox",
  "followers": "https://example.com/users/alice/followers",
  "following": "https://example.com/users/alice/following",
  "icon": {
    "type": "Image",
    "url": "https://example.com/avatars/alice.png"
  },
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----..."
  },
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

## See Also

- **[Actor Types](/docs/reference/actor-types)**
- **[Building an Actor](/docs/guides/building-an-actor)**
- **[HTTP Signatures](/docs/reference/http-signatures-reference)**

