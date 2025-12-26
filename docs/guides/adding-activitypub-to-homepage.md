---
sidebar_position: 25
title: Adding ActivityPub to Your Homepage
description: Use Fedbox to federate your existing static profile
---

# Adding ActivityPub to Your Homepage

Already have a personal homepage? This guide shows how to add ActivityPub federation using Fedbox while keeping your identity on your own domain.

## Overview

```
Your Homepage (static)              Fedbox Server
────────────────────               ──────────────
https://you.example.com            https://ap.example.com
    /                                  /you/inbox
    /#me  ◄──── identity               /you/outbox
                                       /you/followers
```

Your homepage hosts your identity. Fedbox handles ActivityPub federation.

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
    "id": "https://you.example.com/#me",
    "url": "https://you.example.com/",
    "preferredUsername": "you",
    "name": "Your Name",
    "summary": "<p>Your bio here</p>",
    "inbox": "https://ap.example.com/you/inbox",
    "outbox": "https://ap.example.com/you/outbox",
    "followers": "https://ap.example.com/you/followers",
    "following": "https://ap.example.com/you/following",
    "publicKey": {
      "id": "https://you.example.com/#main-key",
      "owner": "https://you.example.com/#me",
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
- `id` uses `#me` fragment (Solid-compatible WebID)
- `inbox`, `outbox`, `followers` point to your Fedbox server
- `publicKey` must match your Fedbox keypair

## Step 2: Set Up Fedbox

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
