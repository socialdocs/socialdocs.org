---
sidebar_position: 20
title: Glossary
description: Definitions of key terms in ActivityPub and the Fediverse
---

# Glossary

A comprehensive glossary of terms used in ActivityPub, ActivityStreams, and the Fediverse.

## A

### Activity
An action performed by an [Actor](#actor). Activities are the core unit of communication in ActivityPub. Examples include `Create`, `Follow`, `Like`, `Announce`, and `Delete`.

**See also:** [Activity Types](/docs/reference/activity-types), [Activity Properties](/docs/reference/activity-properties)

### ActivityPub
A W3C Recommendation protocol for decentralized social networking. It defines how servers communicate (Server-to-Server) and how clients interact with servers (Client-to-Server).

**See also:** [ActivityPub Overview](/docs/specs/activitypub/overview)

### ActivityStreams 2.0
A JSON-LD based vocabulary for representing social data. ActivityPub uses ActivityStreams as its data format.

**See also:** [ActivityStreams Overview](/docs/specs/activitystreams/overview)

### Actor
An entity that can perform activities. Actors have an `inbox` for receiving activities and an `outbox` for publishing them. Types include `Person`, `Group`, `Service`, `Application`, and `Organization`.

**See also:** [Actor Types](/docs/reference/actor-types), [Building an Actor](/docs/guides/building-an-actor)

### Addressing
The mechanism for specifying recipients of an activity using `to`, `cc`, `bto`, `bcc`, and `audience` properties.

### Announce
An activity type used to share or "boost" content. Equivalent to retweet/reblog/boost on various platforms.

**See also:** [Likes and Shares](/docs/guides/likes-and-shares)

### Application
An [Actor](#actor) type representing a software application, often used for bots or automated services.

---

## B

### Backfill
The process of fetching historical content when a new follow relationship is established.

### Block
An activity that prevents interaction between actors. Blocked actors cannot see content or interact with the blocking actor.

### Boost
Common term for sharing/reblogging content. Implemented as an `Announce` activity in ActivityPub.

### BlurHash
A compact representation of an image placeholder, used to show a blurred preview while the full image loads. Commonly used by Mastodon and Pixelfed.

---

## C

### C2S (Client-to-Server)
The ActivityPub protocol for client applications to interact with servers. Less commonly implemented than S2S.

**See also:** [Client-to-Server](/docs/specs/activitypub/client-to-server)

### Collection
An ordered or unordered set of objects. Used for followers lists, outboxes, and other aggregations.

**See also:** [Collection Types](/docs/reference/collection-types)

### Content Negotiation
The HTTP mechanism for requesting different representations of a resource. ActivityPub uses this to serve JSON-LD to federation requests and HTML to browsers.

```http
Accept: application/activity+json
```

### Content Warning (CW)
A summary/spoiler text that hides the main content behind a click. Implemented using the `summary` property with `sensitive: true`.

### Context
In JSON-LD, the `@context` property defines the vocabulary used in a document. ActivityPub uses `https://www.w3.org/ns/activitystreams` as its primary context.

---

## D

### Dereference
The process of fetching a remote object by its URL/ID. When you receive an activity with an object ID, you dereference it to get the full object.

### Digest
An HTTP header containing a hash of the request body, used with [HTTP Signatures](#http-signatures) to ensure message integrity.

```http
Digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=
```

### Direct Message (DM)
A private message addressed only to specific actors, with no public or followers visibility.

**See also:** [Direct Messages](/docs/guides/direct-messages)

### Dislike
An activity expressing negative sentiment. Used by Lemmy for downvotes but not supported by Mastodon.

---

## E

### Emoji
Custom emoji supported via the `Emoji` type (Mastodon extension). Rendered inline in content using `:shortcode:` syntax.

**See also:** [Custom Emoji](/docs/guides/custom-emoji)

### Endpoints
Additional URLs associated with an actor, typically including `sharedInbox` for efficient delivery.

```json
{
  "endpoints": {
    "sharedInbox": "https://example.com/inbox"
  }
}
```

---

## F

### Featured
A collection of pinned posts, displayed prominently on an actor's profile. Mastodon extension.

### Fediverse
A portmanteau of "federation" and "universe." The network of interconnected servers using ActivityPub and related protocols.

**See also:** [What is the Fediverse?](/docs/getting-started/what-is-the-fediverse)

### Federation
The process of servers communicating with each other to share content and activities across the network.

**See also:** [Understanding Federation](/docs/getting-started/understanding-federation)

### FEP (Fediverse Enhancement Proposal)
Community-driven specifications for extending ActivityPub functionality.

**See also:** [Fediverse Enhancement Proposals](/docs/community/feps)

### Follow
An activity expressing intent to subscribe to an actor's content. Typically requires an `Accept` response.

**See also:** [Following and Followers](/docs/guides/following-and-followers)

### Followers Collection
A collection containing actors who follow a given actor.

### Following Collection
A collection containing actors that a given actor follows.

---

## G

### Group
An [Actor](#actor) type representing a collective, such as a community or forum. Used by Lemmy for communities.

---

## H

### Handle
A user identifier in the format `@username@domain`, similar to email addresses.

### Hashtag
A tag starting with `#` used to categorize content. Implemented using the `Hashtag` type in the `tag` array.

**See also:** [Mentions and Hashtags](/docs/guides/mentions-and-hashtags)

### HTTP Signatures
A mechanism for authenticating HTTP requests using public key cryptography. Required for inbox delivery.

**See also:** [HTTP Signatures Overview](/docs/specs/http-signatures/overview)

---

## I

### Inbox
An endpoint where an actor receives activities from other servers. Every actor must have an inbox.

**See also:** [Inbox Endpoint](/docs/reference/inbox-endpoint)

### Instance
A single installation of Fediverse software running on a domain. Also called a "server."

### IRI (Internationalized Resource Identifier)
A generalized form of URI that supports Unicode characters. Used as identifiers in JSON-LD.

---

## J

### JRD (JSON Resource Descriptor)
The response format for [WebFinger](#webfinger) queries.

```json
{
  "subject": "acct:user@example.com",
  "links": [...]
}
```

### JSON-LD
JavaScript Object Notation for Linked Data. The format used by ActivityStreams and ActivityPub for representing data.

**See also:** [JSON-LD Security](/docs/reference/json-ld-security)

---

## K

### Key ID
The identifier for a public key, used in HTTP Signatures to locate the key for verification.

```
keyId="https://example.com/users/alice#main-key"
```

---

## L

### Like
An activity expressing positive sentiment or appreciation. Equivalent to "favorite" on some platforms.

**See also:** [Likes and Shares](/docs/guides/likes-and-shares)

### Linked Data Signatures
A method for cryptographically signing JSON-LD documents themselves (as opposed to HTTP requests).

### Local-only
Content that is not federated to other servers. Supported by some platforms as a visibility option.

---

## M

### Mastodon
The most popular ActivityPub implementation, a microblogging platform similar to Twitter.

**See also:** [Mastodon](/docs/ecosystem/mastodon), [Mastodon Compatibility](/docs/guides/mastodon-compatibility)

### Mention
A reference to another actor within content, typically rendered as a link. Uses the `Mention` type in the `tag` array.

**See also:** [Mentions and Hashtags](/docs/guides/mentions-and-hashtags)

### Move
An activity used for account migration, indicating that an actor has moved to a new account.

**See also:** [Account Migration](/docs/guides/account-migration)

---

## N

### NodeInfo
A protocol for exposing server metadata, including software name, version, and statistics.

**See also:** [NodeInfo Endpoint](/docs/reference/nodeinfo-endpoint)

### Note
The most common object type, representing a short text post. Used by Mastodon for toots/posts.

---

## O

### Object
A thing that activities act upon. Can be content (Note, Article, Image) or other entities.

**See also:** [Object Types](/docs/reference/object-types), [Object Properties](/docs/reference/object-properties)

### OrderedCollection
A [Collection](#collection) where the order of items is significant. Used for outboxes and timelines.

### Organization
An [Actor](#actor) type representing a formal organization, company, or institution.

### Outbox
An endpoint listing activities an actor has published. Used for fetching an actor's posts.

**See also:** [Outbox Endpoint](/docs/reference/outbox-endpoint)

---

## P

### Page
An object type used by Lemmy for posts (as opposed to Notes for comments).

### Person
The most common [Actor](#actor) type, representing an individual user account.

### Poll
Interactive voting content implemented using the `Question` type with `oneOf` or `anyOf` options.

**See also:** [Polls](/docs/guides/polls)

### preferredUsername
The local part of an actor's handle (without the domain).

### Public Address
The special URL `https://www.w3.org/ns/activitystreams#Public` indicating public visibility.

### publicKey
The RSA public key associated with an actor, used for HTTP Signature verification.

---

## Q

### Question
An object type representing a poll with voting options.

---

## R

### Relay
A server that redistributes activities to multiple instances, helping smaller servers discover content.

### Reply
A Note or other object that references another object via `inReplyTo`.

**See also:** [Posts and Replies](/docs/guides/posts-and-replies)

---

## S

### S2S (Server-to-Server)
The ActivityPub protocol for servers to communicate with each other. The primary federation mechanism.

**See also:** [Server-to-Server](/docs/specs/activitypub/server-to-server)

### Sensitive
A boolean property indicating content should be hidden behind a warning. Used with `summary` for content warnings.

### Service
An [Actor](#actor) type representing an automated service or bot.

### Shared Inbox
A single inbox endpoint that receives activities for all actors on a server, reducing delivery overhead.

### Signature
See [HTTP Signatures](#http-signatures).

---

## T

### Tag
An array property containing [Hashtags](#hashtag), [Mentions](#mention), and [Emoji](#emoji) referenced in content.

### Thread
A conversation consisting of a post and its replies, linked via `inReplyTo`.

### Tombstone
An object type representing deleted content, containing `formerType` and `deleted` timestamp.

```json
{
  "type": "Tombstone",
  "formerType": "Note",
  "deleted": "2024-01-15T12:00:00Z"
}
```

### Toot
Mastodon's original term for a post (now officially called "post"). Technically a Note in ActivityPub.

---

## U

### Undo
An activity that reverses a previous activity, such as unfollowing or unliking.

### Unlisted
A visibility level where content is public but not shown in public timelines.

---

## V

### Visibility
The audience for content, determined by addressing. Common levels: public, unlisted, followers-only, direct.

---

## W

### WebFinger
A protocol (RFC 7033) for discovering information about actors using their handle.

**See also:** [WebFinger Overview](/docs/specs/webfinger/overview), [WebFinger Implementation](/docs/guides/webfinger-implementation)

---

## Special Characters

### @context
The JSON-LD property defining the vocabulary/namespace for a document.

### @id
The JSON-LD property for the unique identifier of an object. Often shortened to `id` in ActivityStreams.

### @type
The JSON-LD property for the type of an object. Often shortened to `type` in ActivityStreams.

---

## Numeric

### 202 Accepted
The HTTP status code returned when an inbox successfully receives an activity for processing.

### 401 Unauthorized
HTTP status indicating missing or invalid authentication (often signature verification failure).

### 403 Forbidden
HTTP status indicating the request was understood but refused (e.g., blocked actor).

### 404 Not Found
HTTP status indicating the requested resource doesn't exist.

### 410 Gone
HTTP status indicating a resource was deleted. Used for tombstoned content.

---

## See Also

- **[Core Concepts](/docs/getting-started/core-concepts)** - Introduction to fundamental concepts
- **[Reference Overview](/docs/reference/endpoints-overview)** - Technical reference documentation
- **[ActivityPub Specification](https://www.w3.org/TR/activitypub/)** - Official W3C specification
