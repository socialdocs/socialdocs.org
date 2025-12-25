---
sidebar_position: 1
title: Endpoints Overview
description: Overview of all ActivityPub endpoints
---

# Endpoints Overview

ActivityPub defines several endpoints for federation and client interaction.

## Core Endpoints

```
┌────────────────────────────────────────────────────────────┐
│              ACTIVITYPUB ENDPOINTS                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Discovery                                                 │
│  └── /.well-known/webfinger                               │
│                                                            │
│  Actor                                                     │
│  └── /users/{username}                                    │
│                                                            │
│  Collections                                               │
│  ├── /users/{username}/inbox                              │
│  ├── /users/{username}/outbox                             │
│  ├── /users/{username}/followers                          │
│  └── /users/{username}/following                          │
│                                                            │
│  Shared                                                    │
│  └── /inbox (shared inbox)                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Endpoint Reference

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| WebFinger | GET | Actor discovery | No |
| Actor | GET | Fetch profile | No* |
| Inbox | POST | Receive activities | HTTP Signature |
| Outbox | GET | List activities | No |
| Outbox | POST | Create (C2S) | OAuth |
| Followers | GET | List followers | Varies |
| Following | GET | List following | Varies |

*Requires Accept header for content negotiation

## Required vs Optional

**Required for Federation:**
- WebFinger - Actor discovery
- Actor endpoint - Profile data
- Inbox - Receiving activities

**Recommended:**
- Outbox - Activity history
- Shared Inbox - Efficient delivery
- Followers/Following - Social graph

## See Also

- **[Inbox Endpoint](/docs/reference/inbox-endpoint)**
- **[Outbox Endpoint](/docs/reference/outbox-endpoint)**
- **[WebFinger Endpoint](/docs/reference/webfinger-endpoint)**
