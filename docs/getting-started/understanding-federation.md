---
sidebar_position: 4
title: Understanding Federation
description: How ActivityPub servers discover and communicate with each other
last_verified: 2026-10-15
verified_against: "W3C ActivityPub REC §5-7, RFC 7033, draft-cavage-http-signatures-12, Mastodon v4.7.3 source (delivery_worker.rb, signed_request.rb, block.rb)"
---

# Understanding Federation

Federation is what makes the Fediverse work. It's the process by which independent servers discover each other, exchange information, and deliver content across the network. This guide explains how it all fits together.

## The Federation Flow

When a user on Server A interacts with content from Server B, here's what happens:

<svg viewBox="0 0 540 280" style={{maxWidth: '540px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="fedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="530" height="270" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="530" height="35" rx="12" fill="url(#fedGrad)"/>
  <text x="270" y="28" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">FEDERATION FLOW</text>

  {/* Step 1 */}
  <circle cx="35" cy="70" r="14" fill="#6364FF"/><text x="35" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">1</text>
  <text x="60" y="65" fill="currentColor" fontSize="13" fontWeight="600">Discovery</text>
  <text x="60" y="82" fill="currentColor" fontSize="11" opacity="0.7">User searches @bob@server-b.com → WebFinger query</text>

  {/* Step 2 */}
  <circle cx="35" cy="120" r="14" fill="#6364FF"/><text x="35" y="125" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">2</text>
  <text x="60" y="115" fill="currentColor" fontSize="13" fontWeight="600">Actor Fetch</text>
  <text x="60" y="132" fill="currentColor" fontSize="11" opacity="0.7">Server A fetches actor → Gets inbox, outbox, public key</text>

  {/* Step 3 */}
  <circle cx="35" cy="170" r="14" fill="#6364FF"/><text x="35" y="175" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">3</text>
  <text x="60" y="165" fill="currentColor" fontSize="13" fontWeight="600">Activity Delivery</text>
  <text x="60" y="182" fill="currentColor" fontSize="11" opacity="0.7">Server A sends Follow to inbox (signed with HTTP Signatures)</text>

  {/* Step 4 */}
  <circle cx="35" cy="220" r="14" fill="#6364FF"/><text x="35" y="225" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">4</text>
  <text x="60" y="215" fill="currentColor" fontSize="13" fontWeight="600">Response</text>
  <text x="60" y="232" fill="currentColor" fontSize="11" opacity="0.7">Server B verifies signature → Sends Accept back to Server A</text>

  {/* Flow arrows */}
  <path d="M520 70 L520 220" stroke="#6364FF" strokeWidth="2" strokeDasharray="4,3" opacity="0.5"/>
  <polygon points="517,215 520,225 523,215" fill="#6364FF" opacity="0.5"/>
</svg>

## Step 1: Discovery with WebFinger

When you search for a user like `@bob@server-b.com`, your server needs to find Bob's profile. This is where [WebFinger](/docs/specs/webfinger/overview) comes in.

### WebFinger Request

```http
GET /.well-known/webfinger?resource=acct:bob@server-b.com HTTP/1.1
Host: server-b.com
Accept: application/jrd+json
```

### WebFinger Response

```json
{
  "subject": "acct:bob@server-b.com",
  "aliases": [
    "https://server-b.com/@bob",
    "https://server-b.com/users/bob"
  ],
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://server-b.com/users/bob"
    },
    {
      "rel": "http://webfinger.net/rel/profile-page",
      "type": "text/html",
      "href": "https://server-b.com/@bob"
    }
  ]
}
```

The `rel: self` link with `type: application/activity+json` tells us where to fetch the ActivityPub actor.

## Step 2: Fetching the Actor

With the actor URL from WebFinger, your server fetches the full actor profile:

### Actor Request

```http
GET /users/bob HTTP/1.1
Host: server-b.com
Accept: application/ld+json; profile="https://www.w3.org/ns/activitystreams", application/activity+json
```

### Actor Response

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1"
  ],
  "type": "Person",
  "id": "https://server-b.com/users/bob",
  "inbox": "https://server-b.com/users/bob/inbox",
  "outbox": "https://server-b.com/users/bob/outbox",
  "followers": "https://server-b.com/users/bob/followers",
  "following": "https://server-b.com/users/bob/following",
  "preferredUsername": "bob",
  "name": "Bob",
  "publicKey": {
    "id": "https://server-b.com/users/bob#main-key",
    "owner": "https://server-b.com/users/bob",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

Key information obtained:
- **inbox**: Where to send activities to Bob
- **outbox**: Where to fetch Bob's posts
- **publicKey**: Used to verify signatures from Bob's server

## Step 3: Delivering Activities

When Alice wants to follow Bob, her server sends a Follow activity to Bob's inbox.

### The Follow Activity

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  "id": "https://server-a.com/activities/123",
  "actor": "https://server-a.com/users/alice",
  "object": "https://server-b.com/users/bob"
}
```

### HTTP Signature

The ActivityPub spec doesn't define an authentication mechanism, but in practice every major server requires inbox deliveries to be signed with HTTP Signatures. The signature proves the request came from Server A.

```http
POST /users/bob/inbox HTTP/1.1
Host: server-b.com
Date: Sun, 15 Jan 2024 10:30:00 GMT
Digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=
Signature: keyId="https://server-a.com/users/alice#main-key",
           algorithm="rsa-sha256",
           headers="(request-target) host date digest",
           signature="..."
Content-Type: application/activity+json

{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  ...
}
```

## Step 4: Signature Verification

When Server B receives the activity, it must verify the signature:

```
1. Extract keyId from Signature header
   → https://server-a.com/users/alice#main-key

2. Fetch the public key
   GET https://server-a.com/users/alice
   → Find the key whose id equals keyId and read its owner
     (the owner must be the activity's actor)

3. Check the Signature's headers list covers (request-target),
   host, date and digest, that the Digest matches the raw body,
   and that Date is recent

4. Reconstruct the signing string
   (request-target): post /users/bob/inbox
   host: server-b.com
   date: Sun, 15 Jan 2024 10:30:00 GMT
   digest: SHA-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=

5. Verify the signature using the public key
   → If valid, process the activity
   → If invalid, reject with 401/403
```

## Step 5: Processing and Response

After verifying the signature, Server B processes the Follow:

1. **Check if actor exists** - Does Bob exist on this server?
2. **Check blocks** - Is Alice blocked by Bob or the server?
3. **Auto-accept or queue** - Depending on Bob's settings
4. **Send Accept** - Notify Alice that the follow was accepted

### Accept Activity

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Accept",
  "id": "https://server-b.com/activities/456",
  "actor": "https://server-b.com/users/bob",
  "object": {
    "type": "Follow",
    "id": "https://server-a.com/activities/123",
    "actor": "https://server-a.com/users/alice",
    "object": "https://server-b.com/users/bob"
  }
}
```

This Accept is sent to Alice's inbox, also with HTTP Signatures.

## Content Delivery

Once Alice follows Bob, she'll receive Bob's public posts. Here's how a post gets delivered:

### 1. Bob Creates a Post

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "id": "https://server-b.com/activities/789",
  "actor": "https://server-b.com/users/bob",
  "object": {
    "type": "Note",
    "id": "https://server-b.com/notes/1",
    "content": "Hello, Fediverse!",
    "attributedTo": "https://server-b.com/users/bob",
    "to": ["https://www.w3.org/ns/activitystreams#Public"],
    "cc": ["https://server-b.com/users/bob/followers"]
  },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://server-b.com/users/bob/followers"]
}
```

### 2. Server B Determines Recipients

Looking at `to` and `cc`:
- `as:Public` - Public post: anyone may read it, but it is **not** a delivery target — servers MUST NOT deliver to the Public collection. Delivery still goes only to the listed actors and collections
- `bob/followers` - Expand to list of follower inboxes

### 3. Deduplicate and Batch

If multiple users on Server A follow Bob, the post is only delivered once to Server A's shared inbox.

```
Bob's followers on different servers:
- alice@server-a.com  → server-a.com/inbox
- carol@server-a.com  → server-a.com/inbox (same!)
- dave@server-c.com   → server-c.com/users/dave/inbox

Delivery targets:
- server-a.com/inbox (1 delivery for 2 users)
- server-c.com/users/dave/inbox
```

### 4. Deliver to Each Inbox

Server B sends the Create activity to each unique inbox.

## Shared Inboxes

To reduce load, servers can advertise a shared inbox:

```json
{
  "type": "Person",
  "id": "https://server-a.com/users/alice",
  "inbox": "https://server-a.com/users/alice/inbox",
  "endpoints": {
    "sharedInbox": "https://server-a.com/inbox"
  }
}
```

When delivering to multiple users on the same server, use the shared inbox.

## Handling Failures

Federation isn't always reliable, so servers queue deliveries and retry them. As one real example, Mastodon retries a failed delivery up to 16 times with a delay of roughly *n*⁴ + 15 seconds plus jitter, which adds up to about 2–3 days before it gives up ([delivery_worker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/delivery_worker.rb)). It doesn't retry most 4xx responses, and it stops delivering to a server altogether once deliveries have failed on 7 separate days.

The essentials:
- **Persist the queue** so deliveries survive restarts
- **Back off** between attempts, and stop on responses that will never succeed (e.g. 404, 410)
- **Track dead servers** so they don't tie up your workers

[Delivery at Scale](/docs/guides/delivery-at-scale) covers this in detail.

## Object Fetching

Sometimes servers need to fetch objects they haven't seen:

### Scenario: Reply to Unknown Post

Alice receives a reply to a post she hasn't seen:

```json
{
  "type": "Create",
  "object": {
    "type": "Note",
    "inReplyTo": "https://server-c.com/notes/unknown",
    "content": "Great point!"
  }
}
```

Server A can fetch the parent:

```http
GET /notes/unknown HTTP/1.1
Host: server-c.com
Accept: application/ld+json; profile="https://www.w3.org/ns/activitystreams", application/activity+json
```

This allows servers to reconstruct conversation threads.

## Privacy Considerations

### What Gets Federated

| Visibility | Who Receives |
|------------|--------------|
| Public | All servers with interested followers |
| Unlisted | Same as public, but not in public timelines |
| Followers-only | Only servers with followers |
| Direct | Only mentioned users' servers |

### What Stays Local

- Mute lists
- Who you block, beyond the blocked account's own server — Mastodon sends a `Block` activity to the blocked account's server, so that server does learn about it ([block_service.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/block_service.rb))
- Draft posts
- User settings
- Private notes

## Common Federation Issues

### Signature Verification Failures

**Causes:**
- Clock skew or stale requests (Mastodon treats a signature without `expires` as valid for 5 minutes after creation, plus 1 hour of tolerated skew, so about 65 minutes; and never more than 1 hour in the future)
- Incorrect key format
- Wrong signing algorithm

**Solutions:**
- Use NTP to sync server clocks
- Verify the key is a valid PEM-encoded public key
- Sign with `rsa-sha256` (Mastodon also accepts `hs2019`), and see [HTTP Signatures](/docs/specs/http-signatures/overview) for RFC 9421

### Delivery Failures

**Causes:**
- Server unreachable
- Inbox endpoint returns errors
- Rate limiting

**Solutions:**
- Retry with backoff, and treat 404/410 as final
- Respect `429` responses
- Monitor delivery success rates

### Stale Data

**Causes:**
- Actor info cached too long
- Object references to deleted content

**Solutions:**
- Cache actors for a limited time and refetch when a signature fails to verify (the key may have rotated)
- Respect HTTP cache headers
- Handle 410 Gone responses

## Next Steps

- **[HTTP Signatures](/docs/specs/http-signatures/overview)** - Deep dive into signing
- **[Delivery](/docs/specs/activitypub/delivery)** - ActivityPub delivery rules
- **[Building an Actor](/docs/guides/building-an-actor)** - Implement federation
