---
sidebar_position: 18
title: Client Apps
description: Mobile and desktop apps for the Fediverse
---

# Client Apps

Third-party apps for accessing Fediverse platforms.

## Mobile Apps

### iOS

| App | Platforms | Features | License |
|-----|-----------|----------|---------|
| [Ivory](https://tapbots.com/ivory/) | Mastodon | Polished, paid | Proprietary |
| [Ice Cubes](https://github.com/Dimillian/IceCubesApp) | Mastodon | Open source, free | MIT |
| [Mona](https://apps.apple.com/app/mona-for-mastodon/id1659154653) | Mastodon | Feature-rich | Proprietary |
| [Toot!](https://apps.apple.com/app/toot/id1229021451) | Mastodon | Playful design | Proprietary |
| [Tusker](https://apps.apple.com/app/tusker/id1498334597) | Mastodon | Native iOS | Open Source |

### Android

| App | Platforms | Features | License |
|-----|-----------|----------|---------|
| [Tusky](https://tusky.app/) | Mastodon | Popular, mature | GPL-3.0 |
| [Megalodon](https://github.com/sk22/megalodon) | Mastodon | Tusky fork, extras | GPL-3.0 |
| [Fedilab](https://fedilab.app/) | Multi | Many platforms | GPL-3.0 |
| [Moshidon](https://github.com/LucasGGamerM/moshidon) | Mastodon | Material You | GPL-3.0 |
| [Jerboa](https://github.com/dessalines/jerboa) | Lemmy | Official client | AGPL-3.0 |

### Cross-Platform

| App | Platforms | Features | License |
|-----|-----------|----------|---------|
| [Elk](https://elk.zone/) | Mastodon | Web/PWA | MIT |
| [Phanpy](https://phanpy.social/) | Mastodon | Minimalist web | MIT |
| [Voyager](https://vger.app/) | Lemmy | iOS/Android | AGPL-3.0 |

## Desktop Apps

### Native

| App | OS | Platform | License |
|-----|-------|----------|---------|
| [Whalebird](https://whalebird.social/) | Win/Mac/Linux | Mastodon | MIT |
| [Sengi](https://github.com/NicolasConstant/sengi) | Win/Mac/Linux | Mastodon | AGPL-3.0 |
| [Hyperspace](https://github.com/hyperspacedev/hyperspace) | Win/Mac/Linux | Mastodon | NPL |
| [TheDesk](https://github.com/cutls/TheDesk) | Win/Mac/Linux | Mastodon | GPL-3.0 |

### Web Clients

| Client | Platform | Description |
|--------|----------|-------------|
| [Elk](https://elk.zone/) | Mastodon | Modern web client |
| [Phanpy](https://phanpy.social/) | Mastodon | Minimalist |
| [Semaphore](https://semaphore.social/) | Mastodon | Pinafore successor |
| [Photon](https://phtn.app/) | Lemmy | Modern UI |

## Platform-Specific

### Mastodon

Most apps use the Mastodon API:
- Official web interface
- Third-party clients listed above
- PWA support in official web

### Lemmy

- **Voyager** (iOS/Android) - Popular choice
- **Jerboa** (Android) - Official client
- **Sync for Lemmy** (Android) - From Reddit Sync dev
- **Photon** (Web) - Modern interface

### Pixelfed

- Official web interface
- Some Mastodon clients work partially
- Native apps in development

### PeerTube

- Official web interface
- **NewPipe** (Android) - Supports PeerTube
- **Thorium** (iOS) - Dedicated client

## Developing a Client

### API Compatibility

Most clients target the Mastodon API:

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

Currently supported by:
- Pleroma/Akkoma
- Some experimental servers

## Choosing a Client

### For Mastodon Users

| Need | Recommendation |
|------|----------------|
| iOS, polished | Ivory, Ice Cubes |
| Android, mature | Tusky, Megalodon |
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

