---
sidebar_position: 1
title: What is the Fediverse?
description: An introduction to the Fediverse, ActivityPub, and the decentralized social web
---

# What is the Fediverse?

The **Fediverse** (a portmanteau of "federation" and "universe") is a network of interconnected, independently-operated social media servers that can communicate with each other. Unlike traditional social networks where a single company controls everything, the Fediverse is decentralized — anyone can run their own server and still interact with users on other servers.

## How It Works

```
┌─────────────┐     ActivityPub      ┌─────────────┐
│  Server A   │◄────────────────────►│  Server B   │
│ (Mastodon)  │                      │  (Pixelfed) │
└─────────────┘                      └─────────────┘
       ▲                                    ▲
       │                                    │
       ▼                                    ▼
┌─────────────┐                      ┌─────────────┐
│  Server C   │◄────────────────────►│  Server D   │
│  (Lemmy)    │                      │ (PeerTube)  │
└─────────────┘                      └─────────────┘
```

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

The Fediverse relies on several W3C standards:

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
- **Data ownership**: Users can move between servers or self-host
- **No algorithmic manipulation**: Chronological feeds by default
- **Community-driven moderation**: Each community sets its own rules
- **Privacy**: No ads, no tracking, no data harvesting

### For Developers
- **Open standards**: Build on W3C recommendations
- **Interoperability**: Your software works with the entire ecosystem
- **No platform lock-in**: Users can migrate with their social graph
- **Growing ecosystem**: Millions of users, thousands of servers

## Scale of the Fediverse

As of 2024, the Fediverse includes:
- **10+ million** active users
- **20,000+** independent servers
- **100+** different software implementations
- Growing daily with new users and platforms

## Next Steps

Ready to start building? Here's your path:

1. **[Core Concepts](/docs/getting-started/core-concepts)** - Understand Actors, Activities, and Objects
2. **[Your First ActivityPub Server](/docs/getting-started/your-first-activitypub-server)** - Build a minimal implementation
3. **[Understanding Federation](/docs/getting-started/understanding-federation)** - Learn how servers communicate

## External Resources

- [ActivityPub Specification (W3C)](https://www.w3.org/TR/activitypub/)
- [Fediverse.info](https://fediverse.info/) - User-friendly introduction
- [FediDB](https://fedidb.org/) - Fediverse statistics
- [The-Federation.info](https://the-federation.info/) - Network statistics
