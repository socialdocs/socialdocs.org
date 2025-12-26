---
sidebar_position: 25
title: Adding ActivityPub to Your Homepage
description: Use Fedbox to federate your existing static profile
---

# Adding ActivityPub to Your Homepage

Already have a Solid profile or personal homepage? This guide shows how to add ActivityPub federation using Fedbox, allowing your existing WebID to participate in the Fediverse.

The goal is to **unify Solid and ActivityPub with minimal bridging** — your identity lives in one place, and Fedbox handles federation.

## Overview

```
Your Homepage (static)              Fedbox Server
────────────────────               ──────────────
https://you.example.com            https://ap.example.com
    /                                  /you/inbox
    /#me  ◄──── identity               /you/outbox
                                       /you/followers
```

Your homepage hosts your identity. Fedbox handles ActivityPub federation. A single Fedbox instance can handle multiple users.

## URI Fragment Identifiers

Both Solid and this approach use **URI fragment identifiers** (`#me`) for identity:

- `https://you.example.com/` — The profile document
- `https://you.example.com/#me` — The WebID (the Person)

This is the Solid convention: the document and the thing it describes are distinct. The fragment `#me` identifies the person *within* the document. This allows the same URL to serve both HTML (for browsers) and JSON-LD (for machines) via content negotiation.

The `id` can be relative — just `"#me"` — and resolves against the document URL.

## Content Negotiation

The standards-compliant approach is **content negotiation**: the same URL serves different representations based on the `Accept` header.

```
GET /alice
Accept: text/html           →  HTML page
Accept: application/ld+json →  JSON-LD actor
```

However, **static hosts can't do content negotiation** — they serve the same file regardless of headers. And some ActivityPub implementations expect JSON when they request it, even though JSON-LD data islands in HTML are valid per the JSON-LD spec.

### How Fedbox Solves This

Fedbox fetches your static HTML profile, extracts the JSON-LD data island, and serves it with proper content negotiation:

```
Mastodon                        Fedbox                      Your Homepage
────────                        ──────                      ─────────────
GET actor (Accept: JSON) ──────► extracts data island ◄──── static HTML
                          ◄───── returns JSON-LD
```

This means your homepage stays static, but Fedbox provides the content negotiation layer.

### Alternative: Proxy-Based Content Negotiation

If you want content negotiation without Fedbox in the middle, you can configure a reverse proxy:

```nginx
# Nginx content negotiation
location /alice {
    if ($http_accept ~* "application/.*json") {
        rewrite ^ /alice.jsonld last;
    }
    # Default: serve HTML
    try_files /alice.html =404;
}
```

Then maintain two files:
- `/alice.html` — your profile page
- `/alice.jsonld` — the actor JSON-LD

This is more work but gives you full control without a separate AP server.

## Step 1: Add JSON-LD to Your Homepage

Add a data island to your existing HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your Name</title>
  <script type="application/ld+json">
  {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    "type": "Person",
    "id": "#me",
    "url": "./",
    "preferredUsername": "you",
    "name": "Your Name",
    "summary": "<p>Your bio here</p>",
    "inbox": "https://ap.example.com/you/inbox",
    "outbox": "https://ap.example.com/you/outbox",
    "followers": "https://ap.example.com/you/followers",
    "following": "https://ap.example.com/you/following",
    "publicKey": {
      "id": "#main-key",
      "owner": "#me",
      "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
    }
  }
  </script>
</head>
<body>
  <!-- Your existing homepage content -->
</body>
</html>
```

Key points:
- `id` uses relative `#me` — resolves to `https://you.example.com/#me`
- Fragment IDs are Solid-compatible WebIDs
- `inbox`, `outbox`, `followers` point to your Fedbox server
- `publicKey` must match your Fedbox keypair

## Step 2: Set Up Fedbox

### Deployment Options

**Dedicated server** (e.g., `ap.example.com`):
- Point DNS A record to your server
- Fedbox listens on port 443 (or use a reverse proxy)
- Simplest setup — no path routing needed

**Shared server** (e.g., `example.com/ap/`):
- Add proxy rules to your existing web server:

```nginx
# Nginx example
location /you/inbox { proxy_pass http://localhost:3000; }
location /you/outbox { proxy_pass http://localhost:3000; }
location /you/followers { proxy_pass http://localhost:3000; }
location /you/following { proxy_pass http://localhost:3000; }
location /inbox { proxy_pass http://localhost:3000; }
```

### Installation

On your server (VPS, cloud instance, etc.):

```bash
# Install
npm install -g fedbox

# Initialize
fedbox init
```

Edit `fedbox.json`:

```json
{
  "username": "you",
  "displayName": "Your Name",
  "summary": "Your bio",
  "port": 3000,
  "domain": "ap.example.com",
  "profileUrl": "https://you.example.com/",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "privateKey": "-----BEGIN PRIVATE KEY-----..."
}
```

The `profileUrl` tells Fedbox to fetch your identity from your homepage.

## Step 3: Copy Your Public Key

Get your public key from Fedbox:

```bash
cat fedbox.json | grep -A 10 publicKey
```

Copy this into your homepage's JSON-LD `publicKeyPem` field.

## Step 4: Add WebFinger

For people to find you as `@you@you.example.com`, add WebFinger to your homepage.

Create `/.well-known/webfinger` (or configure your server to respond):

```json
{
  "subject": "acct:you@you.example.com",
  "links": [
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://you.example.com/#me"
    }
  ]
}
```

For static hosts like GitHub Pages, create `.well-known/webfinger` as a file (no extension).

## Step 5: Start Fedbox

```bash
fedbox start
```

Fedbox will:
1. Fetch your homepage
2. Extract the JSON-LD data island
3. Merge with local AP endpoints
4. Serve with proper content negotiation

## Step 6: Test Discovery

From Mastodon, search for `@you@you.example.com`. You should see your profile with your homepage identity.

## How It Works

```
Mastodon                    Your Homepage              Fedbox
────────                    ─────────────              ──────

GET webfinger ────────────► returns actor href

GET actor ─────────────────► returns JSON-LD ─────────► (or Fedbox serves it)
                            with AP endpoints

POST inbox ──────────────────────────────────────────► receives activities

GET outbox ──────────────────────────────────────────► returns your posts
```

## Optional: Link Nostr Identity

Add your Nostr pubkey to the JSON-LD:

```json
{
  "alsoKnownAs": ["did:nostr:your64charhexpubkey"]
}
```

And in `fedbox.json`:

```json
{
  "nostrPubkey": "your64charhexpubkey"
}
```

## Troubleshooting

### "Could not fetch remote profile"

- Check that your homepage is accessible
- Verify the JSON-LD is valid (use jsonlint.com)
- Ensure `<script type="application/ld+json">` is present

### "Signature verification failed"

- The public key in your homepage must match Fedbox's keypair
- Copy the exact key from `fedbox.json`

### "WebFinger not found"

- Ensure `.well-known/webfinger` is accessible
- Check CORS headers if on a different domain
- Some static hosts require special configuration for dotfiles

## See Also

- **[Fedbox Documentation](/docs/ecosystem/fedbox)** - Full reference
- **[Building an Actor](/docs/guides/building-an-actor)** - Actor structure details
- **[WebFinger Implementation](/docs/guides/webfinger-implementation)** - WebFinger deep dive
