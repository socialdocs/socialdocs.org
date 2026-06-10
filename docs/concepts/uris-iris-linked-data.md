---
sidebar_position: 1
title: URIs, IRIs & Linked Data
description: Understanding identifiers and the opacity principle in ActivityPub
---

# URIs, IRIs & Linked Data

ActivityPub is built on Linked Data principles. Understanding how identifiers work is essential for correct implementations.

## URI vs IRI vs URL

These terms are often confused:

| Term | Meaning | Example |
|------|---------|---------|
| **URI** | Uniform Resource Identifier (ASCII only) | `https://example.com/users/alice` |
| **IRI** | Internationalized Resource Identifier (Unicode) | `https://example.com/用户/アリス` |
| **URL** | Uniform Resource Locator (a URI you can fetch) | `https://example.com/actor` |
| **URN** | Uniform Resource Name (persistent identifier) | `urn:isbn:0451450523` |

In practice, ActivityPub uses **IRIs** (which include URIs as a subset). Most implementations treat them as URLs that can be dereferenced via HTTP.

## The Opacity Principle

:::warning Critical Concept
**IRIs are opaque identifiers.** You cannot infer meaning from the string pattern — only by dereferencing and inspecting the data.
:::

This is fundamental to Linked Data and RDF. Consider these URLs:

```
https://mastodon.social/users/alice
https://mastodon.social/users/alice/followers
https://example.com/ap/followers/alice
https://myserver.com/f?user=123
```

All four could be followers collections. You cannot know from the URL alone — you must:

1. **Fetch** the URL (dereference it)
2. **Inspect** the `type` property in the response
3. **Handle** based on what it actually is

### Wrong: Parsing URL Patterns

```javascript
// ❌ WRONG: Assumes URL structure
if (recipient.endsWith('/followers')) {
  // Treat as followers collection
}
```

This breaks when servers use different URL patterns.

### Correct: Dereference and Inspect

```javascript
// ✅ CORRECT: Fetch and check the type
const data = await fetch(recipient, {
  headers: { 'Accept': 'application/activity+json' }
}).then(r => r.json());

if (data.type === 'OrderedCollection' || data.type === 'Collection') {
  // It's a collection — expand members
  await expandCollection(data);
} else if (isActorType(data.type)) {
  // It's an actor — use their inbox
  inboxes.add(data.inbox);
}

function isActorType(type) {
  return ['Person', 'Service', 'Application', 'Group', 'Organization'].includes(type);
}
```

### Where This Applies

The opacity principle applies to **all** ActivityPub URLs:

- **Actor IDs** — Don't parse usernames from URLs
- **Inbox/Outbox** — Don't assume `/inbox` or `/outbox` paths
- **Followers/Following** — Don't assume `/followers` or `/following`
- **Object IDs** — Don't extract post IDs or timestamps from URLs

## Dereferencing

To get data from an IRI, you **dereference** it — make an HTTP GET request.

### Content Negotiation

Request the format you want via the `Accept` header:

```http
GET /users/alice HTTP/1.1
Host: example.com
Accept: application/activity+json
```

Common formats:

| Accept Header | Format |
|---------------|--------|
| `application/activity+json` | ActivityStreams JSON-LD |
| `application/ld+json` | Generic JSON-LD |
| `text/html` | Human-readable page |

### Handling Redirects

Servers may redirect. Always follow redirects, but track the canonical ID:

```javascript
const response = await fetch(url, { redirect: 'follow' });
const finalUrl = response.url; // May differ from original
const data = await response.json();
const canonicalId = data.id; // The authoritative ID
```

## Fragment Identifiers and httpRange-14

The `#` in a URL denotes a **fragment identifier**:

```
https://example.com/document#section2
└──────────────────────────┘ └──────┘
         base URL           fragment
```

### The httpRange-14 Problem

A fundamental question in web architecture: **What does a URL identify?**

When you request `https://example.com/alice`:
- Do you get **Alice** (the person)?
- Or a **document about Alice**?

This ambiguity led to the W3C TAG's **httpRange-14** resolution, which established:

- If a URL returns `200 OK`, it identifies an **information resource** (a document)
- If it returns `303 See Other`, it identifies something else (a person, concept, etc.)

### Why Fragments Are Preferred

In **5-star Linked Data**, fragment identifiers solve httpRange-14 elegantly:

```
https://example.com/alice#me
└─────────────────────────┘
```

- The server returns the **document** at `https://example.com/alice`
- The fragment `#me` identifies **Alice herself** within that document
- No ambiguity: the document describes Alice, but `#me` *is* Alice

This is why you'll see patterns like:

| Pattern | Identifies |
|---------|------------|
| `https://example.com/alice` | Document about Alice |
| `https://example.com/alice#me` | Alice (the person) |
| `https://example.com/alice#main-key` | Alice's public key |

### Fragments in ActivityPub

In Linked Data best practices, fragments identify sub-resources within a document. However, the ActivityPub spec doesn't define how fragment URIs should be resolved, and **actual implementation support is limited**.

The most common use is `#main-key` for public keys:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/users/alice",
  "type": "Person",
  "name": "Alice",
  "publicKey": {
    "id": "https://example.com/users/alice#main-key",
    "owner": "https://example.com/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

The `#main-key` fragment identifies the key object within Alice's document.

:::caution Reality vs. Ideal
While fragments are a Linked Data best practice, their use in ActivityPub is inconsistent:
- **`#main-key`** is widely used for signing keys, but often special-cased rather than resolved via general fragment handling
- Some implementations generate fragment IDs for transient activities, but the fragments may not be present in the returned JSON
- Very few implementations support fetching and resolving arbitrary fragment URIs
- See [w3c/activitypub#367](https://github.com/w3c/activitypub/issues/367) for ongoing discussion
:::

### How Fragments Work

1. The **fragment is not sent to the server** — clients handle it locally
2. You fetch the base URL, then extract the fragment portion client-side
3. The server returns one document; the fragment selects part of it

:::tip 5-Star Linked Data
Using fragment URIs is a best practice in Linked Data because:
- Clear distinction between documents and things
- Single HTTP request retrieves related data
- Avoids httpRange-14 ambiguity
- Works with RDF and JSON-LD naturally
:::

## Fediverse Conventions

While IRIs are opaque in principle, the Fediverse has developed common conventions:

| Pattern | Common Meaning |
|---------|----------------|
| `/users/{name}` | Actor profile |
| `/users/{name}/inbox` | Actor inbox |
| `/users/{name}/outbox` | Actor outbox |
| `/users/{name}/followers` | Followers collection |
| `/users/{name}/following` | Following collection |
| `/@{name}` | Actor (alternative) |
| `/activities/{id}` | Activity object |
| `/objects/{id}` | Content object |

:::caution Convention, Not Specification
These patterns are **conventions**, not requirements. Many servers use different structures:

- Pleroma: `/users/{name}`, `/users/{name}/followers`
- Lemmy: `/u/{name}`, `/c/{name}`
- PeerTube: `/accounts/{name}`, `/video-channels/{name}`

**Never rely on URL patterns programmatically.** Always dereference.
:::

### When Conventions Help

Conventions are useful for:
- **Debugging** — Quickly identify resource types when reading logs
- **Documentation** — Explaining typical structures
- **Heuristics** — Fallback guesses when dereferencing fails

But production code should always dereference first.

## Summary

| Principle | Description |
|-----------|-------------|
| **IRIs are opaque** | Don't parse meaning from URL strings |
| **Dereference first** | Fetch the URL and inspect `type` |
| **Use fragments** | Prefer `#` URIs for non-document things (5-star LD) |
| **httpRange-14** | Fragments avoid document/thing ambiguity |
| **Conventions ≠ specs** | URL patterns are hints, not guarantees |

## Further Reading

- [5-Star Linked Data](https://5stardata.info/) — Tim Berners-Lee's Linked Data principles
- [httpRange-14](https://www.w3.org/2001/tag/doc/httpRange-14/2007-05-31/HttpRange-14) — W3C TAG resolution
- [Cool URIs for the Semantic Web](https://www.w3.org/TR/cooluris/) — W3C best practices
- [Roy Fielding on HTTP Dereference (2002)](https://lists.w3.org/Archives/Public/www-tag/2002Mar/0121.html) — The httpRange-14 debate origins: Fielding (REST creator) argues HTTP URIs don't imply documents; Berners-Lee counters that fragments enable subdividing documents into things. Both perspectives shaped modern Linked Data.

## See Also

- **[ActivityStreams Overview](/docs/specs/activitystreams/overview)** — Object and activity types
- **[Actor Objects](/docs/specs/activitypub/actors)** — Actor structure and properties
- **[Delivery](/docs/specs/activitypub/delivery)** — Recipient resolution
