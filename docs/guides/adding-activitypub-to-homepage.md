---
sidebar_position: 25
title: Adding ActivityPub to Your Homepage
description: Put a federated account next to your existing homepage with Fedbox, and what Mastodon requires for that to work
last_verified: 2026-10-15
verified_against: "Fedbox main branch (micro-fed/fedbox lib/server.js, bin/cli.js, October 2026); Mastodon v4.7.3 source (json_ld_helper.rb, process_account_service.rb, webfinger.rb, fetch_resource_service.rb); RFC 7033"
---

# Adding ActivityPub to Your Homepage

Already have a personal homepage or a Solid profile? This guide puts a federated account next to it, using [Fedbox](/docs/ecosystem/fedbox) to handle ActivityPub, so people on Mastodon and elsewhere can follow you.

:::caution Fedbox is experimental
Fedbox is a small, early project by this site's maintainer. Read the [Fedbox page](/docs/ecosystem/fedbox) first: the inbox signature fix from October 2026 is on its main branch but not yet in a published npm release.
:::

## What Mastodon requires

Whatever software you use, Mastodon only accepts an account when all of these hold (Mastodon v4.7.3):

1. **WebFinger** for `acct:you@your.domain` returns a `self` link to the actor ([`webfinger.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/webfinger.rb)).
2. **The actor URL returns JSON** with `Content-Type: application/activity+json` (or `application/ld+json` with the ActivityStreams profile). An HTML page with an embedded JSON-LD `<script>` is not accepted ([`json_ld_helper.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb)).
3. **The actor's `id` is exactly the URL that was fetched.** Mastodon compares strings; a relative `"id": "#me"` is never equal to `https://your.domain/you#me` ([`json_ld_helper.rb` `fetch_resource`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb)).
4. **The WebFinger `self` link loops back** to that same `id` ([`process_account_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb)).
5. **The key that signs your requests** is published in that actor under the `keyId` you sign with.

A static homepage can usually satisfy 1 (WebFinger can be a static file: Mastodon does not check its Content-Type) but not 2 and 3: static hosts serve one file per URL with a fixed Content-Type. So the actor itself has to be served by something dynamic. That is Fedbox's job.

## Recommended setup: Fedbox on your homepage's domain

Run Fedbox behind the web server that already serves your homepage, and route only the ActivityPub paths to it. Your handle is then `@you@you.example.com`, and your homepage stays exactly as it is.

```
https://you.example.com/                    your homepage (unchanged, static)
https://you.example.com/you                 Fedbox: profile page (HTML) and actor (JSON)
https://you.example.com/you#me              your actor id
https://you.example.com/you/inbox, /outbox, /followers, /following, /posts/…
https://you.example.com/inbox               Fedbox: shared inbox
https://you.example.com/.well-known/webfinger, /.well-known/nodeinfo, /nodeinfo/2.1
```

### Step 1: Install and initialise Fedbox

```bash
npm install -g fedbox
fedbox init      # asks for username, display name, bio and port; generates a key pair
```

`fedbox init` writes `fedbox.json`. Add your domain to it; with `domain` set, Fedbox builds `https://` URLs on that domain:

```json
{
  "username": "you",
  "displayName": "Your Name",
  "summary": "Your bio",
  "port": 3000,
  "domain": "you.example.com",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "privateKey": "-----BEGIN PRIVATE KEY-----..."
}
```

Keep `fedbox.json` private: it contains your private key. Don't set `profileUrl` (see [below](#the-profileurl-option)).

### Step 2: Route the ActivityPub paths to Fedbox

Fedbox listens on plain HTTP on `port`; your web server terminates TLS. With nginx:

```nginx
server {
    listen 443 ssl;
    server_name you.example.com;
    root /var/www/homepage;            # your existing homepage

    # Fedbox: discovery, the actor and its collections, the inboxes
    location ~ ^/(\.well-known/(webfinger|nodeinfo)|nodeinfo/|inbox$|you(/|$)) {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Replace `you` with your username. If you set an `avatar` in `fedbox.json`, Fedbox serves it from `/public/…`; route that path to Fedbox too, or host the image yourself. With Caddy:

```caddy
you.example.com {
    root * /var/www/homepage
    @fedbox path /.well-known/webfinger /.well-known/nodeinfo /nodeinfo/* /inbox /you /you/*
    reverse_proxy @fedbox 127.0.0.1:3000
    file_server
}
```

### Step 3: Start Fedbox

```bash
fedbox start
```

### Step 4: Link your homepage to your account

Add these to your homepage's `<head>`:

```html
<!-- Pasting your homepage URL into Mastodon's search finds your account -->
<link rel="alternate" type="application/activity+json" href="https://you.example.com/you">
<!-- IndieWeb convention: "this account is also me" -->
<link rel="me" href="https://you.example.com/you">
```

Mastodon follows a `<link rel="alternate" type="application/activity+json">` when someone searches for a page URL ([`fetch_resource_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/fetch_resource_service.rb)). Fedbox's own profile page already includes one.

### Step 5: Test

```bash
curl -s "https://you.example.com/.well-known/webfinger?resource=acct:you@you.example.com"
curl -si -H 'Accept: application/activity+json' https://you.example.com/you
npx @fedify/cli lookup @you@you.example.com
```

Then search for `@you@you.example.com` from a Mastodon account. If it isn't found, see [Troubleshooting by Symptom](/docs/guides/troubleshooting).

## Alternative: Fedbox on a subdomain

If you can't proxy paths on your homepage's server, run Fedbox on its own host (for example `ap.example.com`, with `"domain": "ap.example.com"`) and point DNS and TLS at it. Your handle is then `@you@ap.example.com`; link to it from your homepage as in Step 4.

A handle on your homepage's domain with the actor on another host ("split-domain" WebFinger) needs WebFinger on **both** hosts to agree, or the FEP-2c59 `webfinger` property on the actor; Fedbox does not set that up for you. See [Keys and Identity](/docs/security/keys-and-identity) for how Mastodon resolves split domains.

## The `profileUrl` option

Fedbox has an experimental `profileUrl` setting: it fetches your homepage, extracts the first `<script type="application/ld+json">` block, and serves that data as your actor with Fedbox's inbox, outbox and collection URLs merged in ([`buildActorFromProfile` in `lib/server.js`](https://github.com/micro-fed/fedbox/blob/gh-pages/lib/server.js)).

As of October 2026 this does **not** produce an account Mastodon accepts:

- The served actor keeps the homepage's `id` (for example `"#me"` or `https://you.example.com/#me`), but Mastodon fetches the actor from the URL in Fedbox's WebFinger answer, `https://<fedbox domain>/you#me`, and requires the `id` to equal it.
- The served actor keeps the homepage's `publicKey` if it has one, while Fedbox signs its requests with the key id `https://<fedbox domain>/you#main-key`. Receivers can't find that key in the actor.

Use the recommended setup above until this changes.

## Optional: link a Nostr identity

Fedbox adds `alsoKnownAs: ["did:nostr:<pubkey>"]` to your actor when `fedbox.json` has a `nostrPubkey` (64 hex characters):

```json
{
  "nostrPubkey": "your64charhexpubkey"
}
```

Mastodon only uses `alsoKnownAs` for account migration; other software may ignore a `did:nostr` entry.

## Troubleshooting

### Mastodon can't find `@you@you.example.com`

- `curl` the WebFinger URL from Step 5: it must return JSON with a `self` link to `https://you.example.com/you#me`.
- `curl` the actor with the `Accept` header: it must return `Content-Type: application/activity+json` and an `id` of exactly `https://you.example.com/you#me`. If you get your homepage's HTML, the proxy isn't routing `/you` to Fedbox.

### "Signature verification failed"

- Fedbox signs with the key in `fedbox.json`; the actor it serves publishes the matching public key. Don't edit one without the other, and don't use `profileUrl` with a `publicKey` in your homepage's JSON-LD.

### WebFinger works locally but not from Mastodon

- WebFinger must be reachable over HTTPS on port 443 of the exact domain in your handle (RFC 7033 §4).
- Some static hosts don't serve dot-directories such as `.well-known` without extra configuration; with the recommended setup Fedbox answers it instead.

## See Also

- **[Fedbox](/docs/ecosystem/fedbox)** - Project page, status and caveats
- **[Building an Actor](/docs/guides/building-an-actor)** - What an actor must contain
- **[WebFinger Implementation](/docs/guides/webfinger-implementation)** - WebFinger in depth
