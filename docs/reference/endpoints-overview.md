---
sidebar_position: 1
title: Endpoints Overview
description: Overview of all ActivityPub endpoints
---

# Endpoints Overview

ActivityPub defines several endpoints for federation and client interaction.

## Core Endpoints

<svg viewBox="0 0 520 280" style={{maxWidth: '520px', width: '100%', height: 'auto'}}>
  <defs>
    <linearGradient id="endpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{stopColor: '#6364FF', stopOpacity: 0.12}}/>
      <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.12}}/>
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="510" height="270" rx="12" fill="none" stroke="#6364FF" strokeWidth="2"/>
  <rect x="5" y="5" width="510" height="28" rx="12" fill="url(#endpGrad)"/>
  <text x="260" y="24" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">ACTIVITYPUB ENDPOINTS</text>

  {/* Discovery */}
  <rect x="20" y="45" width="230" height="50" rx="8" fill="url(#endpGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="35" y="65" fill="#6364FF" fontSize="12" fontWeight="600">Discovery</text>
  <text x="35" y="83" fill="currentColor" fontSize="10" fontFamily="monospace">/.well-known/webfinger</text>

  {/* Actor */}
  <rect x="265" y="45" width="230" height="50" rx="8" fill="url(#endpGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="280" y="65" fill="#6364FF" fontSize="12" fontWeight="600">Actor</text>
  <text x="280" y="83" fill="currentColor" fontSize="10" fontFamily="monospace">/users/{'{username}'}</text>

  {/* Collections */}
  <rect x="20" y="105" width="350" height="110" rx="8" fill="url(#endpGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="35" y="125" fill="#6364FF" fontSize="12" fontWeight="600">Collections</text>
  <text x="35" y="145" fill="currentColor" fontSize="10" fontFamily="monospace">/users/{'{username}'}/inbox</text>
  <text x="35" y="162" fill="currentColor" fontSize="10" fontFamily="monospace">/users/{'{username}'}/outbox</text>
  <text x="35" y="179" fill="currentColor" fontSize="10" fontFamily="monospace">/users/{'{username}'}/followers</text>
  <text x="35" y="196" fill="currentColor" fontSize="10" fontFamily="monospace">/users/{'{username}'}/following</text>

  {/* Shared */}
  <rect x="385" y="105" width="110" height="50" rx="8" fill="url(#endpGrad)" stroke="#6364FF" strokeWidth="1.5"/>
  <text x="400" y="125" fill="#6364FF" fontSize="12" fontWeight="600">Shared</text>
  <text x="400" y="143" fill="currentColor" fontSize="10" fontFamily="monospace">/inbox</text>

  {/* Legend */}
  <rect x="20" y="225" width="475" height="40" rx="6" fill="url(#endpGrad)" stroke="#6364FF" strokeWidth="1" opacity="0.6"/>
  <text x="35" y="245" fill="currentColor" fontSize="10" fontWeight="500">Required:</text>
  <text x="95" y="245" fill="currentColor" fontSize="10" opacity="0.8">WebFinger, Actor, Inbox</text>
  <text x="280" y="245" fill="currentColor" fontSize="10" fontWeight="500">Recommended:</text>
  <text x="365" y="245" fill="currentColor" fontSize="10" opacity="0.8">Outbox, Shared Inbox</text>
</svg>

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
