---
sidebar_position: 5
title: PeerTube
description: ActivityPub implementation details for PeerTube
last_verified: 2026-10-15
verified_against: "PeerTube 8.3.1 (live JSON from framatube.org), docs.joinpeertube.org/api/activitypub, GitHub API"
---

# PeerTube

PeerTube is a decentralized video hosting platform, similar to YouTube. For implementation code see the [PeerTube compatibility guide](/docs/guides/peertube-compatibility).

## Overview

| Property | Value |
|----------|-------|
| Language | TypeScript (Node.js) |
| Database | PostgreSQL |
| License | AGPL-3.0 |
| Repository | [github.com/Chocobozzz/PeerTube](https://github.com/Chocobozzz/PeerTube) |
| Documentation | [docs.joinpeertube.org](https://docs.joinpeertube.org/) ([ActivityPub](https://docs.joinpeertube.org/api/activitypub)) |
| Latest release | [v8.3.1](https://github.com/Chocobozzz/PeerTube/releases/tag/v8.3.1) (2026-09-28) |

## ActivityPub Implementation

The JSON below is trimmed from a live PeerTube 8.3.1 server.

### Actor Types

- **Person** — an account, at `/accounts/{name}`
- **Group** — a video channel, at `/video-channels/{name}`, with `attributedTo` pointing to the owning account and a `playlists` collection
- **Application** — the instance actor, used for server-to-server follows

```json
{
  "type": "Group",
  "id": "https://peertube.example/video-channels/tech_reviews",
  "preferredUsername": "tech_reviews",
  "name": "Tech Reviews",
  "attributedTo": ["https://peertube.example/accounts/alice"],
  "inbox": "https://peertube.example/video-channels/tech_reviews/inbox",
  "playlists": "https://peertube.example/video-channels/tech_reviews/playlists"
}
```

### Video Object

```json
{
  "type": "Video",
  "id": "https://peertube.example/videos/watch/6a19252f-e799-404f-913f-1014c3a52fb6",
  "uuid": "6a19252f-e799-404f-913f-1014c3a52fb6",
  "name": "Introduction to ActivityPub",
  "duration": "PT15M30S",
  "attributedTo": [
    { "type": "Person", "id": "https://peertube.example/accounts/alice" },
    { "type": "Group", "id": "https://peertube.example/video-channels/tech_reviews" }
  ],
  "content": "In this video we explore...",
  "mediaType": "text/markdown",
  "category": { "identifier": "15", "name": "Science & Technology" },
  "licence": { "identifier": "2", "name": "Attribution - Share Alike" },
  "language": { "identifier": "en", "name": "English" },
  "commentsPolicy": 1,
  "downloadEnabled": true,
  "state": 1,
  "views": 1500,
  "url": [
    { "type": "Link", "mediaType": "text/html", "href": "https://peertube.example/w/e6TjfMBXc5jAsLs1co4zHh" },
    { "type": "Link", "mediaType": "video/mp4", "href": "https://peertube.example/static/web-videos/70d78e59-…-1080.mp4", "height": 1080 },
    { "type": "Link", "mediaType": "application/x-mpegURL", "href": "https://peertube.example/static/streaming-playlists/hls/6a19252f-…/", "tag": ["…per-resolution Link entries…"] }
  ],
  "likes": "https://peertube.example/videos/watch/6a19252f-…/likes",
  "dislikes": "https://peertube.example/videos/watch/6a19252f-…/dislikes",
  "shares": "https://peertube.example/videos/watch/6a19252f-…/announces",
  "comments": "https://peertube.example/videos/watch/6a19252f-…/comments"
}
```

Notes on the real format:

- Video files are **Web Videos** under `/static/web-videos/`; HLS playlists are under `/static/streaming-playlists/hls/`, with one `Link` per resolution in the playlist's `tag`. `.torrent` and magnet links are still published under `/lazy-static/torrents/`.
- `category`, `licence` and `language` are `{identifier, name}` objects mapped to schema.org terms.
- `commentsPolicy` replaces the old `commentsEnabled` (1 = enabled, 2 = disabled, 3 = requires approval; see the [compatibility guide](/docs/guides/peertube-compatibility)).
- `preview` holds storyboard images, not a thumbnail; thumbnails are in `icon`.

### Comments

Comments are `Note`s whose `inReplyTo` is the video or a parent comment.

## Supported Activities and Objects

From [PeerTube's ActivityPub docs](https://docs.joinpeertube.org/api/activitypub):

| Activities | Objects |
|------------|---------|
| Create, Update, Delete, Follow, Accept, Reject, Announce, Undo, Like, Dislike, Flag, View, ApproveReply | Video, CacheFile (redundancy), Playlist, PlaylistElement, Actor, Note (comment), WatchAction |

### View Activity

PeerTube sends a `View` to the origin server each time a user watches a video, so it can count views. A `View` carrying `expires` means the user is still watching, and may be sent repeatedly ([docs](https://docs.joinpeertube.org/api/activitypub)).

## Federation

- A video is created by the account and **announced by the channel**; following a channel (`Group`) delivers its videos.
- Mastodon users can follow channels and accounts; replies from Mastodon become comments.
- Instances can follow each other (via their `Application` actors) to share their video catalogues.

## See Also

- **[PeerTube Compatibility Guide](/docs/guides/peertube-compatibility)**
- **[PeerTube ActivityPub docs](https://docs.joinpeertube.org/api/activitypub)**
- **[Server Software Overview](/docs/ecosystem/server-software)**
