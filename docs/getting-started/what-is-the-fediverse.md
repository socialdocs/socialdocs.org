---
sidebar_position: 1
title: What is the Fediverse?
description: An introduction to the Fediverse, ActivityPub, and the decentralized social web
last_verified: 2026-10-15
verified_against: "W3C ActivityPub REC, RFC 7033, RFC 9421, draft-cavage-http-signatures-12, FediDB API (api.fedidb.org/v1/stats) on 2026-10-15"
---

# What is the Fediverse?

The **Fediverse** (a portmanteau of "federation" and "universe") is a network of interconnected, independently-operated social media servers that can communicate with each other. Unlike traditional social networks where a single company controls everything, the Fediverse is decentralized — anyone can run their own server and still interact with users on other servers.

## How It Works

<svg viewBox="0 0 500 280" className="diagram" style={{maxWidth: '500px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="serverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.1}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.1}}/>
    </linearGradient>
  </defs>

  {/* Server A - Mastodon */}
  <rect x="20" y="20" width="120" height="60" rx="8" fill="url(#serverGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="80" y="45" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Server A</text>
  <text x="80" y="65" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">(Mastodon)</text>

  {/* Server B - Pixelfed */}
  <rect x="360" y="20" width="120" height="60" rx="8" fill="url(#serverGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="420" y="45" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Server B</text>
  <text x="420" y="65" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">(Pixelfed)</text>

  {/* Server C - Lemmy */}
  <rect x="20" y="180" width="120" height="60" rx="8" fill="url(#serverGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="80" y="205" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Server C</text>
  <text x="80" y="225" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">(Lemmy)</text>

  {/* Server D - PeerTube */}
  <rect x="360" y="180" width="120" height="60" rx="8" fill="url(#serverGrad)" stroke="#6364FF" strokeWidth="2"/>
  <text x="420" y="205" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600">Server D</text>
  <text x="420" y="225" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.7">(PeerTube)</text>

  {/* Connection lines */}
  <line x1="140" y1="50" x2="360" y2="50" stroke="#6364FF" strokeWidth="2" strokeDasharray="5,3"/>
  <line x1="140" y1="210" x2="360" y2="210" stroke="#6364FF" strokeWidth="2" strokeDasharray="5,3"/>
  <line x1="80" y1="80" x2="80" y2="180" stroke="#6364FF" strokeWidth="2" strokeDasharray="5,3"/>
  <line x1="420" y1="80" x2="420" y2="180" stroke="#6364FF" strokeWidth="2" strokeDasharray="5,3"/>

  {/* ActivityPub label */}
  <rect x="180" y="35" width="140" height="28" rx="14" fill="#6364FF"/>
  <text x="250" y="54" textAnchor="middle" fill="white" fontSize="12" fontWeight="500">ActivityPub</text>

  {/* Arrows */}
  <polygon points="145,47 155,50 145,53" fill="#6364FF"/>
  <polygon points="355,47 345,50 355,53" fill="#6364FF"/>
</svg>

Each server (also called an "instance") runs software that implements the **ActivityPub** protocol. This protocol defines how servers:

- Discover and identify users across servers
- Send and receive posts, likes, follows, and other social activities
- Handle privacy and access control

## Key Concepts

### Federation
Federation means that independent servers can communicate with each other. When you post something on your Mastodon server, it can be seen by users on Pixelfed, Lemmy, or any other ActivityPub-compatible platform.

### Decentralization
No single entity controls the Fediverse. Each server is independently operated with its own:
- Terms of service
- Moderation policies
- Server resources
- Community culture

### Interoperability
Different software platforms can interact because they all speak the same protocol (ActivityPub). A Mastodon user can:
- Follow a Pixelfed photographer
- Comment on a PeerTube video
- Participate in a Lemmy community

## The Protocol Stack

The Fediverse relies on a handful of open standards — ActivityPub and Activity Streams from the W3C, WebFinger (IETF RFC 7033), and HTTP Signatures. Most servers still sign with an older IETF draft ([draft-cavage-http-signatures](https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12)); its standardized successor, [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), is being adopted alongside it ([details](/docs/specs/http-signatures/overview)):

| Protocol | Purpose |
|----------|---------|
| [ActivityPub](/docs/specs/activitypub/overview) | Federation protocol for social networking |
| [ActivityStreams 2.0](/docs/specs/activitystreams/overview) | JSON format for representing social data |
| [WebFinger](/docs/specs/webfinger/overview) | User discovery across servers |
| [HTTP Signatures](/docs/specs/http-signatures/overview) | Message authentication |

## Popular Fediverse Platforms

| Platform | Type | Description |
|----------|------|-------------|
| **Mastodon** | Microblogging | Twitter-like platform, most popular |
| **Lemmy** | Link aggregation | Reddit-like communities |
| **Pixelfed** | Photo sharing | Instagram-like experience |
| **PeerTube** | Video hosting | YouTube alternative |
| **Misskey** | Microblogging | Feature-rich Japanese platform |
| **Pleroma** | Microblogging | Lightweight alternative to Mastodon |
| **GoToSocial** | Microblogging | Privacy-focused, lightweight |
| **Friendica** | Social network | Facebook-like features |

## Why Build for the Fediverse?

### For Users
- **Choice of server**: Users can pick a server whose rules suit them, move to another, or self-host
- **Timelines**: Most microblogging servers show the home timeline in chronological order
- **Community-driven moderation**: Each server sets its own rules
- **No single owner**: No one company controls the network, its data or its ranking

### For Developers
- **Open standards**: Build on W3C recommendations
- **Interoperability**: Your software works with the entire ecosystem
- **Less platform lock-in**: Users can move accounts and take their followers with them (posts don't move automatically — see [Account Migration](/docs/guides/account-migration))
- **Growing ecosystem**: Millions of users, thousands of servers

## Scale of the Fediverse

As of October 2026, [FediDB](https://fedidb.org/) counts:
- **About 14 million** registered accounts, of which about 1.34 million were active in the last month
- **Roughly 36,000–42,000** servers (FediDB's server count varies from day to day as servers come and go)
- **Hundreds** of different software implementations

These are lower bounds: FediDB only counts servers it can discover, and not every server publishes user counts.

## Next Steps

Ready to start building? Here's your path:

1. **[Core Concepts](/docs/getting-started/core-concepts)** - Understand Actors, Activities, and Objects
2. **[Your First ActivityPub Server](/docs/getting-started/your-first-activitypub-server)** - Build a minimal implementation
3. **[Understanding Federation](/docs/getting-started/understanding-federation)** - Learn how servers communicate

## External Resources

- [ActivityPub Specification (W3C)](https://www.w3.org/TR/activitypub/)
- [Fediverse.info](https://fediverse.info/) - User-friendly introduction
- [FediDB](https://fedidb.org/) - Fediverse statistics
