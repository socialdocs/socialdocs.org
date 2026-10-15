---
sidebar_position: 18
title: Client Apps
description: Mobile and desktop apps for the Fediverse
last_verified: 2026-10-15
verified_against: "GitHub/Codeberg/Gitea repo APIs and LICENSE files, project READMEs (2026-10-15); app-store listings not checked"
---

# Client Apps

Third-party apps for accessing Fediverse platforms. Licenses and status are from each project's repository (October 2026); closed-source apps are listed without a repository check.

## Mobile Apps

### iOS

| App | Platforms | Features | License |
|-----|-----------|----------|---------|
| [Ivory](https://tapbots.com/ivory/) | Mastodon | Polished, paid | Proprietary |
| [Ice Cubes](https://github.com/Dimillian/IceCubesApp) | Mastodon | Open source, free | AGPL-3.0 |
| [Mona](https://apps.apple.com/app/mona-for-mastodon/id1659154653) | Mastodon | Feature-rich | Proprietary |
| [Toot!](https://apps.apple.com/app/toot/id1229021451) | Mastodon | Playful design | Proprietary |
| [Tusker](https://apps.apple.com/app/tusker/id1498334597) | Mastodon | Native iOS ([source](https://git.shadowfacts.net/shadowfacts/Tusker)) | Open source |

### Android

| App | Platforms | Features | License |
|-----|-----------|----------|---------|
| [Tusky](https://tusky.app/) | Mastodon | Mature ([source](https://codeberg.org/tusky/Tusky), moved to Codeberg) | GPL-3.0 |
| [Fedilab](https://fedilab.app/) | Multi | Many platforms ([source](https://codeberg.org/tom79/Fedilab)) | GPL-3.0 |
| [Moshidon](https://github.com/LucasGGamerM/moshidon) | Mastodon | Fork of Megalodon (itself a fork of the official app, now archived); last release June 2025 | GPL-3.0 |
| [Jerboa](https://github.com/LemmyNet/jerboa) | Lemmy | By the Lemmy project | AGPL-3.0 |
| [Pixelfed](https://github.com/pixelfed/pixelfed-rn) | Pixelfed | Official app (iOS and Android) | AGPL-3.0 |

### Cross-Platform

| App | Platforms | Features | License |
|-----|-----------|----------|---------|
| [Elk](https://elk.zone/) | Mastodon | Web/PWA | MIT |
| [Phanpy](https://phanpy.social/) | Mastodon | Minimalist web | MIT |
| [Voyager](https://vger.app/) | Lemmy | iOS/Android/web | AGPL-3.0 |

## Desktop Apps

### Native

| App | OS | Platform | License |
|-----|-------|----------|---------|
| [Whalebird](https://whalebird.social/) | Win/Mac/Linux | Mastodon | GPL-3.0 |
| [Sengi](https://github.com/NicolasConstant/sengi) | Win/Mac/Linux | Mastodon | AGPL-3.0 |

### Web Clients

| Client | Platform | Description |
|--------|----------|-------------|
| [Elk](https://elk.zone/) | Mastodon | Modern web client |
| [Phanpy](https://phanpy.social/) | Mastodon | Minimalist |
| [Photon](https://phtn.app/) | Lemmy | Modern UI (AGPL-3.0) |

## Platform-Specific

### Mastodon

Most apps use the Mastodon API:
- Official web interface
- Third-party clients listed above
- PWA support in official web

### Lemmy

- **Voyager** (iOS/Android/web)
- **Jerboa** (Android) - by the Lemmy project
- **Photon** (web)

### Pixelfed

- Official web interface
- Official [Pixelfed app](https://github.com/pixelfed/pixelfed-rn) for iOS and Android
- Pixelfed implements the Mastodon client API, so many Mastodon clients work

### PeerTube

- Official web interface
- **[NewPipe](https://github.com/TeamNewPipe/NewPipe)** (Android) - supports PeerTube alongside other services
- The dedicated Thorium client ([sschueller/peertube-android](https://github.com/sschueller/peertube-android)) is archived

## Developing a Client

### API Compatibility

Many clients target the Mastodon API:

```
GET /api/v1/accounts/:id
GET /api/v1/timelines/home
POST /api/v1/statuses
```

### Authentication

OAuth 2.0 flow:
```
1. Register app → client_id, client_secret
2. User authorizes → authorization code
3. Exchange code → access token
4. Use token for API calls
```

### ActivityPub C2S

Some platforms support C2S (Client-to-Server):

```http
POST /users/alice/outbox
Authorization: Bearer {token}
Content-Type: application/activity+json

{
  "type": "Create",
  "object": {
    "type": "Note",
    "content": "Hello!"
  }
}
```

Mastodon, Misskey and GoToSocial do not implement C2S. [Pleroma](/docs/ecosystem/pleroma#client-to-server-c2s) has partial support; its fork Akkoma has disabled the C2S write endpoints. See [Client-to-Server](/docs/specs/activitypub/client-to-server) for the spec and the SocialCG's work on a C2S profile.

## Choosing a Client

### For Mastodon Users

| Need | Recommendation |
|------|----------------|
| iOS, polished | Ivory, Ice Cubes |
| Android, mature | Tusky |
| Desktop | Whalebird, Elk |
| Web | Elk, Phanpy |

### For Lemmy Users

| Need | Recommendation |
|------|----------------|
| iOS | Voyager |
| Android | Voyager, Jerboa |
| Web | Photon |

## See Also

- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[Mastodon API Docs](https://docs.joinmastodon.org/client/intro/)**

