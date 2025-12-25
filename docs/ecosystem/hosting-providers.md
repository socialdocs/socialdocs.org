---
sidebar_position: 20
title: Hosting Providers
description: Managed hosting options for Fediverse servers
---

# Hosting Providers

Managed hosting services for running Fediverse instances.

## Mastodon Hosting

### Masto.host

Dedicated Mastodon hosting.

| Property | Value |
|----------|-------|
| Website | [masto.host](https://masto.host/) |
| Pricing | From €6/month |
| Features | Full management, backups |

Features:
- Automatic updates
- Custom domains
- S3 media storage
- Email delivery

### Fedihost

Mastodon and other platforms.

| Property | Value |
|----------|-------|
| Website | [fedihost.co](https://fedihost.co/) |
| Pricing | From $6/month |
| Platforms | Mastodon, Pleroma, Pixelfed |

### Spacebear

Multi-platform hosting.

| Property | Value |
|----------|-------|
| Website | [spacebear.ee](https://spacebear.ee/) |
| Pricing | From €9/month |
| Platforms | Mastodon, PeerTube, Pixelfed |

Features:
- Estonian hosting
- Multiple platforms
- Custom domains

## Multi-Platform

### Cloudplane

Various Fediverse platforms.

| Property | Value |
|----------|-------|
| Website | [cloudplane.org](https://cloudplane.org/) |
| Pricing | From $5/month |
| Platforms | Multiple |

### Hetzner + Managed

Many providers offer setup on Hetzner:
- Lower ongoing costs
- More control
- Manual updates

## Self-Hosting Options

### VPS Providers

| Provider | Starting Price | Notes |
|----------|---------------|-------|
| Hetzner | €4/month | Popular in EU |
| DigitalOcean | $6/month | Easy setup |
| Linode | $5/month | Good support |
| Vultr | $5/month | Many locations |
| OVH | €4/month | EU-based |

### Requirements by Platform

| Platform | Minimum RAM | Storage | Notes |
|----------|-------------|---------|-------|
| GoToSocial | 256MB | 10GB | Lightest option |
| Pleroma | 512MB | 20GB | Lightweight |
| Mastodon | 2GB | 40GB+ | Full featured |
| Pixelfed | 2GB | 50GB+ | Media heavy |
| PeerTube | 4GB | 100GB+ | Video storage |

## Docker Hosting

### Railway

Container-based deployments.

| Property | Value |
|----------|-------|
| Website | [railway.app](https://railway.app/) |
| Pricing | Usage-based |
| Ease | One-click deploys |

### Fly.io

Edge deployments.

| Property | Value |
|----------|-------|
| Website | [fly.io](https://fly.io/) |
| Pricing | Free tier + usage |
| Ease | CLI-based |

### Render

Managed containers.

| Property | Value |
|----------|-------|
| Website | [render.com](https://render.com/) |
| Pricing | From $7/month |
| Ease | Git integration |

## Comparison

### Managed vs Self-Hosted

| Aspect | Managed | Self-Hosted |
|--------|---------|-------------|
| Cost | Higher monthly | Lower ongoing |
| Setup | Instant | Hours/days |
| Maintenance | Included | Your responsibility |
| Control | Limited | Full |
| Scaling | Provider handles | Manual |
| Backups | Included | DIY |

### When to Choose Managed

- First-time instance admins
- Small communities (< 100 users)
- Limited technical expertise
- Want to focus on community

### When to Self-Host

- Technical expertise available
- Larger communities
- Cost optimization needed
- Custom modifications required

## Setup Guides

### Quick Start with GoToSocial

Lightest option for personal use:

```bash
# On a small VPS
wget https://github.com/superseriousbusiness/gotosocial/releases/latest/download/gotosocial_linux_amd64.tar.gz
tar -xzf gotosocial_linux_amd64.tar.gz
./gotosocial server start
```

### Docker Compose

Most platforms provide Docker Compose files:

```yaml
version: '3'
services:
  app:
    image: tootsuite/mastodon:latest
    # ... configuration
  db:
    image: postgres:14
  redis:
    image: redis:alpine
```

## Object Storage

For media files, consider:

| Provider | Pricing | Notes |
|----------|---------|-------|
| Wasabi | $7/TB | S3 compatible |
| Backblaze B2 | $5/TB | Cheap egress |
| Cloudflare R2 | $15/TB | No egress fees |
| MinIO | Self-host | Free |

## See Also

- **[Server Software Overview](/docs/ecosystem/server-software)**
- **[GoToSocial](/docs/ecosystem/gotosocial)** (lightweight option)
- **[Mastodon](/docs/ecosystem/mastodon)** (popular choice)

