---
sidebar_position: 20
title: Hosting Providers
description: Managed hosting options for Fediverse servers
last_verified: 2026-10-15
verified_against: "Provider websites (masto.host, fedihost.co) on 2026-10-15; GoToSocial v0.22.2 release assets and docs; Mastodon v4.7.3 docker-compose.yml"
---

# Hosting Providers

Options for running a Fediverse server, from fully managed to self-hosted. Prices change often — the figures below are what each provider's site showed on 2026-10-15.

## Managed Fediverse Hosting

| Provider | Platforms | Starting price | Notes |
|----------|-----------|----------------|-------|
| [Masto.host](https://masto.host/) | Mastodon | $6/month + tax ([pricing](https://masto.host/pricing/)) | Fully managed: install, upgrades, security |
| [Fedihost](https://fedihost.co/) | Mastodon, PeerTube, GoToSocial | $4/month | Backups included; data portable |

Other providers come and go; check that a provider currently lists your platform before relying on it.

## Self-Hosting

### Requirements

Each project documents its own requirements — use these rather than generic tables:

| Platform | Requirements |
|----------|--------------|
| GoToSocial | ~250–350 MB RAM in use for a small instance; ~1 GB system RAM recommended ([docs](https://docs.gotosocial.org/en/latest/getting_started/)) |
| Mastodon | PostgreSQL, Redis, Ruby, Node.js, plus object storage for media at scale ([docs](https://docs.joinmastodon.org/admin/prerequisites/)) |
| Pixelfed | PHP, MySQL/MariaDB or PostgreSQL, Redis, ffmpeg ([docs](https://docs.pixelfed.org/running-pixelfed/prerequisites.html)) |
| PeerTube | Node.js, PostgreSQL, Redis, ffmpeg; video storage dominates ([docs](https://docs.joinpeertube.org/install/any-os)) |

Any mainstream VPS or container host can run these; media and video storage usually costs more than compute.

### Quick Start with GoToSocial

The lightest option for a personal server (see the [installation guide](https://docs.gotosocial.org/en/latest/getting_started/installation/metal/) for the config file you need first):

```bash
# Latest releases: https://codeberg.org/superseriousbusiness/gotosocial/releases
wget https://codeberg.org/superseriousbusiness/gotosocial/releases/download/v0.22.2/gotosocial_0.22.2_linux_amd64.tar.gz
tar -xzf gotosocial_0.22.2_linux_amd64.tar.gz
./gotosocial --config-path ./config.yaml server start
```

### Docker Compose

Most platforms ship a Compose file. Mastodon's [`docker-compose.yml`](https://github.com/mastodon/mastodon/blob/v4.7.3/docker-compose.yml) (v4.7.3) uses:

```yaml
services:
  db:
    image: postgres:14-alpine
  redis:
    image: redis:7-alpine
  web:
    image: ghcr.io/mastodon/mastodon:v4.7.3   # pin a specific version
  streaming:
    image: ghcr.io/mastodon/mastodon-streaming:v4.7.3
  sidekiq:
    image: ghcr.io/mastodon/mastodon:v4.7.3
```

## Managed vs Self-Hosted

| Aspect | Managed | Self-Hosted |
|--------|---------|-------------|
| Setup | Minutes | Hours |
| Upgrades and security fixes | Provider | You |
| Control and customisation | Limited | Full |
| Backups | Usually included | Your responsibility |

Managed hosting suits first-time admins and small communities. Self-hosting suits people who want full control or custom modifications — and who will apply security releases promptly.

## Object Storage

Large instances store media in S3-compatible object storage (e.g. AWS S3, Backblaze B2, Cloudflare R2, Wasabi, or self-hosted MinIO). Compare current storage and egress pricing directly; egress is often the larger cost for media-heavy servers.

## See Also

- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[GoToSocial](/docs/ecosystem/gotosocial)** (lightweight option)
- **[Mastodon](/docs/ecosystem/mastodon)**
