---
sidebar_position: 7
title: Pleroma
description: ActivityPub implementation details for Pleroma
last_verified: 2026-10-15
verified_against: "Pleroma docs (docs.pleroma.social), live JSON from a Pleroma 2.10.2 server (actor, outbox, litepub-0.1.jsonld), Akkoma and Rebased forge APIs, FediDB"
---

# Pleroma

Pleroma is a lightweight microblogging server written in Elixir, with a Mastodon-compatible client API.

## Overview

| Property | Value |
|----------|-------|
| Language | Elixir |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [git.pleroma.social/pleroma/pleroma](https://git.pleroma.social/pleroma/pleroma) |
| Documentation | [docs.pleroma.social](https://docs.pleroma.social/) |
| Latest release | 2.10.2, a security release ([announcements](https://pleroma.social/announcements/)) |
| Accounts (FediDB, Oct 2026) | ~54K |

## Forks

| Fork | Description |
|------|-------------|
| [Akkoma](https://akkoma.dev/AkkomaGang/akkoma) | The most active fork (v3.20.1, September 2026; ~24K accounts on FediDB). It has [disabled the ActivityPub C2S write endpoints](https://akkoma.dev/AkkomaGang/akkoma/src/branch/develop/CHANGELOG.md). |
| [Rebased](https://gitlab.com/soapbox-pub/rebased) | Backend fork maintained by Soapbox, "the recommended backend for Soapbox" |

## ActivityPub Implementation

The examples below are trimmed from a live Pleroma 2.10.2 server.

### Actor

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://pleroma.example/schemas/litepub-0.1.jsonld",
    { "@language": "und" }
  ],
  "type": "Person",
  "id": "https://pleroma.example/users/alice",
  "preferredUsername": "alice",
  "webfinger": "acct:alice@pleroma.example",
  "inbox": "https://pleroma.example/users/alice/inbox",
  "outbox": "https://pleroma.example/users/alice/outbox",
  "featured": "https://pleroma.example/users/alice/collections/featured",
  "discoverable": true,
  "capabilities": { "acceptsChatMessages": true },
  "endpoints": {
    "sharedInbox": "https://pleroma.example/inbox",
    "oauthRegistrationEndpoint": "https://pleroma.example/api/v1/apps",
    "oauthAuthorizationEndpoint": "https://pleroma.example/oauth/authorize",
    "oauthTokenEndpoint": "https://pleroma.example/oauth/token"
  }
}
```

Pleroma serves its own JSON-LD context at `/schemas/litepub-0.1.jsonld`. It defines, among others, `ChatMessage`, `EmojiReact`, `directMessage`, `listMessage`, `capabilities`, `oauthRegistrationEndpoint`, and both `quoteUrl` and `quoteUri` (the latter from Fedibird's namespace).

### Note

```json
{
  "type": "Note",
  "id": "https://pleroma.example/objects/22dffc91-c7df-4bc7-9e25-ed08b796b2fe",
  "actor": "https://pleroma.example/users/alice",
  "attributedTo": "https://pleroma.example/users/alice",
  "content": "<p>Hello from Pleroma!</p>",
  "source": { "content": "Hello from Pleroma!", "mediaType": "text/plain" },
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://pleroma.example/users/alice/followers"],
  "context": "https://pleroma.example/contexts/68dcec58-05a0-4012-88b7-49e2a94f12e4",
  "conversation": "https://pleroma.example/contexts/68dcec58-05a0-4012-88b7-49e2a94f12e4"
}
```

`context` and `conversation` carry the same thread URL. `source.mediaType` reflects the format the author wrote in: Pleroma's [NodeInfo](https://docs.pleroma.social/backend/development/API/nodeinfo/) lists `text/plain`, `text/html`, `text/markdown` and `text/bbcode`.

## Supported Extensions

| Feature | How it federates |
|---------|------------------|
| Emoji reactions | `EmojiReact` activity; advertised as `pleroma_emoji_reactions` in NodeInfo ([docs](https://docs.pleroma.social/backend/development/API/pleroma_api/#emoji-reactions)) |
| Chats | `ChatMessage` objects in a `Create`, addressed to exactly one actor and always private ([docs](https://docs.pleroma.social/backend/development/ap_extensions/#chatmessages)); actors that accept them advertise `capabilities.acceptsChatMessages` |
| Quote posts | `quoteUrl` / `quoteUri` (defined in the LitePub context) |
| Local-only posts | `local` visibility; such posts are not federated ([docs](https://docs.pleroma.social/backend/development/API/differences_in_mastoapi_responses/#statuses)) |
| Media upload | `uploadMedia` actor endpoint, a C2S extension ([docs](https://docs.pleroma.social/backend/development/ap_extensions/#uploadmedia)) |

### Chat Message

From [Pleroma's AP extensions docs](https://docs.pleroma.social/backend/development/ap_extensions/#chatmessages):

```json
{
  "type": "Create",
  "actor": "http://2hu.gensokyo/users/raymoo",
  "id": "http://2hu.gensokyo/objects/1",
  "object": {
    "type": "ChatMessage",
    "id": "http://2hu.gensokyo/objects/2",
    "attributedTo": "http://2hu.gensokyo/users/raymoo",
    "content": "You expected a cute girl? Too bad.",
    "published": "2020-02-12T14:08:20Z",
    "to": ["http://2hu.gensokyo/users/marisa"]
  },
  "to": ["http://2hu.gensokyo/users/marisa"]
}
```

## Client-to-Server (C2S)

Pleroma has partial ActivityPub C2S support: its actors advertise OAuth endpoints and `uploadMedia`, and its [client list](https://docs.pleroma.social/backend/clients/) names AndStatus as an ActivityPub C2S client. Most Pleroma clients use the Mastodon-compatible API instead. The Akkoma fork has disabled the C2S write endpoints.

## API Endpoints

```
GET /.well-known/webfinger
GET /.well-known/nodeinfo
GET /users/{nickname}
GET /objects/{uuid}
GET /contexts/{uuid}
POST /inbox                    # shared inbox
POST /users/{nickname}/inbox
```

## Compatibility With Mastodon

- Mastodon has no emoji reactions, so `EmojiReact` is not shown there ([Mastodon 4.7.3 handlers](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb))
- `ChatMessage` is not understood by Mastodon; check `capabilities.acceptsChatMessages` before sending one
- Mastodon's quote posts use the consent-based [FEP-044f](/docs/guides/quote-posts-and-interaction-policies) flow, not `quoteUrl`

## See Also

- **[Pleroma Documentation](https://docs.pleroma.social/)**
- **[Akkoma](https://akkoma.social/)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
