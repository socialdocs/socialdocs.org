---
sidebar_position: 5
title: PeerTube
description: ActivityPub implementation details for PeerTube
---

# PeerTube

PeerTube is a decentralized video hosting platform, similar to YouTube.

## Overview

| Property | Value |
|----------|-------|
| Language | TypeScript (Node.js) |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/Chocobozzz/PeerTube](https://github.com/Chocobozzz/PeerTube) |
| Documentation | [docs.joinpeertube.org](https://docs.joinpeertube.org/) |

## ActivityPub Implementation

### Actor Types

**Person (User)**:
```json
{
  "type": "Person",
  "id": "https://peertube.example/accounts/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "inbox": "https://peertube.example/accounts/alice/inbox",
  "outbox": "https://peertube.example/accounts/alice/outbox"
}
```

**Group (Channel)**:
```json
{
  "type": "Group",
  "id": "https://peertube.example/video-channels/tech_reviews",
  "preferredUsername": "tech_reviews",
  "name": "Tech Reviews",
  "attributedTo": "https://peertube.example/accounts/alice",
  "inbox": "https://peertube.example/video-channels/tech_reviews/inbox"
}
```

### Video Object

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    { "pt": "https://joinpeertube.org/ns#" }
  ],
  "type": "Video",
  "id": "https://peertube.example/videos/watch/abc123",
  "name": "Introduction to ActivityPub",
  "duration": "PT15M30S",
  "published": "2024-01-15T10:00:00Z",
  "attributedTo": "https://peertube.example/video-channels/tech_reviews",
  "content": "<p>In this video we explore...</p>",
  "mediaType": "text/html",
  "url": [
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/videos/abc123.mp4",
      "height": 1080,
      "size": 150000000,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "application/x-mpegURL",
      "href": "https://peertube.example/static/streaming/abc123/master.m3u8"
    }
  ],
  "icon": [
    {
      "type": "Image",
      "url": "https://peertube.example/static/thumbnails/abc123.jpg",
      "width": 560,
      "height": 315
    }
  ],
  "tag": [
    { "type": "Hashtag", "name": "#activitypub" }
  ],
  "views": 1500,
  "likes": "https://peertube.example/videos/watch/abc123/likes",
  "dislikes": "https://peertube.example/videos/watch/abc123/dislikes",
  "comments": "https://peertube.example/videos/watch/abc123/comments"
}
```

### Comments

Video comments are Notes:

```json
{
  "type": "Note",
  "id": "https://peertube.example/videos/watch/abc123/comments/456",
  "inReplyTo": "https://peertube.example/videos/watch/abc123",
  "attributedTo": "https://mastodon.social/users/bob",
  "content": "<p>Great video!</p>"
}
```

## Supported Activities

| Activity | Context | Notes |
|----------|---------|-------|
| Create | Video, Note | Upload, comment |
| Update | Video | Edit metadata |
| Delete | Video, Note | Removal |
| Like | Video | Upvote |
| Dislike | Video | Downvote |
| Follow | Person, Group | Subscribe |
| Announce | Video | Share |
| View | Video | View tracking |

### View Activity

PeerTube tracks views via ActivityPub:

```json
{
  "type": "View",
  "actor": "https://peertube.example/accounts/alice",
  "object": "https://peertube.example/videos/watch/abc123"
}
```

## Custom Extensions

PeerTube uses its own namespace for video properties:

| Property | Namespace | Description |
|----------|-----------|-------------|
| `pt:uuid` | PeerTube | Unique video ID |
| `pt:category` | PeerTube | Video category |
| `pt:licence` | PeerTube | Content license |
| `pt:language` | PeerTube | Video language |
| `pt:downloadEnabled` | PeerTube | Allow downloads |
| `pt:waitTranscoding` | PeerTube | Transcoding status |

## Video Streaming

PeerTube supports multiple formats:

```json
{
  "url": [
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "...",
      "height": 1080
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "...",
      "height": 720
    },
    {
      "type": "Link",
      "mediaType": "application/x-mpegURL",
      "href": "..."
    },
    {
      "type": "Link",
      "mediaType": "application/x-bittorrent",
      "href": "..."
    }
  ]
}
```

## Federation

### With Mastodon

- Videos appear as posts with video attachments
- Comments federate as replies
- Likes/dislikes become favorites

### Channel Following

Users can follow PeerTube channels:
```
Actor (Mastodon) → Follow → Group (PeerTube Channel)
```

## See Also

- **[PeerTube Documentation](https://docs.joinpeertube.org/)**
- **[JavaScript Libraries](/docs/ecosystem/javascript-libraries)**
- **[Server Software Overview](/docs/ecosystem/server-software)**

