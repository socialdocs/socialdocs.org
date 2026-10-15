---
sidebar_position: 20
title: PeerTube Compatibility
description: Implementing federation with PeerTube, the video platform
last_verified: 2026-10-15
verified_against: "Mastodon 4.7.3, Lemmy 0.19.20 / 1.0.0-beta.2, PeerTube 8.3.1, Pixelfed 0.14.4 source; FEP-7628 (Oct 2026 audit)"
---

# PeerTube Compatibility

:::info Verified against
PeerTube 8.x (8.3.1), checked 2026-10-15 against PeerTube's official [ActivityPub documentation](https://docs.joinpeertube.org/api/activitypub), which includes the TypeScript models and example payloads. Treat that page as the source of truth.
:::

PeerTube is a decentralized video hosting platform that uses ActivityPub for federation. It has its own requirements for video objects, channels, and HLS streaming. This guide covers federating with PeerTube instances.

## PeerTube's Federation Model

```
┌────────────────────────────────────────────────────────────┐
│                  PEERTUBE STRUCTURE                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Actor Types:                                              │
│  - Person (user accounts)                                  │
│  - Group (video channels)                                  │
│                                                            │
│  Content Types:                                            │
│  - Video (main content)                                    │
│  - Note (comments)                                         │
│  - Playlist (video collections)                            │
│                                                            │
│  Special Features:                                         │
│  - Multiple video resolutions                              │
│  - Web Videos (MP4 files) and HLS streaming               │
│  - Live streaming support                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Actor Types

### Person (User Account)

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "pt": "https://joinpeertube.org/ns#"
    }
  ],
  "type": "Person",
  "id": "https://peertube.example/accounts/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "summary": "<p>Video creator</p>",
  "inbox": "https://peertube.example/accounts/alice/inbox",
  "outbox": "https://peertube.example/accounts/alice/outbox",
  "following": "https://peertube.example/accounts/alice/following",
  "followers": "https://peertube.example/accounts/alice/followers",
  "url": "https://peertube.example/accounts/alice",
  "publicKey": {
    "id": "https://peertube.example/accounts/alice#main-key",
    "owner": "https://peertube.example/accounts/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "endpoints": {
    "sharedInbox": "https://peertube.example/inbox"
  }
}
```

### Group (Video Channel)

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "pt": "https://joinpeertube.org/ns#",
      "support": "pt:support"
    }
  ],
  "type": "Group",
  "id": "https://peertube.example/video-channels/tech_reviews",
  "preferredUsername": "tech_reviews",
  "name": "Tech Reviews",
  "summary": "<p>Latest technology reviews and tutorials</p>",
  "inbox": "https://peertube.example/video-channels/tech_reviews/inbox",
  "outbox": "https://peertube.example/video-channels/tech_reviews/outbox",
  "followers": "https://peertube.example/video-channels/tech_reviews/followers",
  "url": "https://peertube.example/video-channels/tech_reviews",
  "attributedTo": [
    {
      "type": "Person",
      "id": "https://peertube.example/accounts/alice"
    }
  ],
  "support": "https://patreon.com/alice",
  "publicKey": {
    "id": "https://peertube.example/video-channels/tech_reviews#main-key",
    "owner": "https://peertube.example/video-channels/tech_reviews",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

## Video Object

### Complete Video Structure

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "pt": "https://joinpeertube.org/ns#",
      "sc": "http://schema.org#",
      "category": "pt:category",
      "language": "pt:language",
      "licence": "pt:licence",
      "subtitleLanguage": "pt:subtitleLanguage",
      "sensitive": "as:sensitive",
      "downloadEnabled": "pt:downloadEnabled",
      "commentsPolicy": "pt:commentsPolicy",
      "canReply": "pt:canReply",
      "isLiveBroadcast": "pt:isLiveBroadcast",
      "liveSaveReplay": "pt:liveSaveReplay",
      "permanentLive": "pt:permanentLive",
      "support": "pt:support"
    }
  ],
  "type": "Video",
  "id": "https://peertube.example/videos/watch/abc123",
  "name": "Getting Started with ActivityPub",
  "duration": "PT15M30S",
  "uuid": "9c2e5a1e-4b0f-4c7a-9f1e-2d3b4a5c6d7e",
  "published": "2024-01-15T10:00:00Z",
  "updated": "2024-01-15T12:00:00Z",
  "attributedTo": [
    {
      "type": "Group",
      "id": "https://peertube.example/video-channels/tech_reviews"
    },
    {
      "type": "Person",
      "id": "https://peertube.example/accounts/alice"
    }
  ],
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://peertube.example/video-channels/tech_reviews/followers"],
  "content": "<p>In this tutorial, we explore implementing ActivityPub...</p>",
  "mediaType": "text/html",
  "category": {
    "identifier": "15",
    "name": "Science & Technology"
  },
  "language": {
    "identifier": "en",
    "name": "English"
  },
  "licence": {
    "identifier": "1",
    "name": "Attribution"
  },
  "sensitive": false,
  "commentsPolicy": 1,
  "canReply": null,
  "downloadEnabled": true,
  "isLiveBroadcast": false,
  "views": 1234,
  "likes": "https://peertube.example/videos/watch/abc123/likes",
  "dislikes": "https://peertube.example/videos/watch/abc123/dislikes",
  "shares": "https://peertube.example/videos/watch/abc123/announces",
  "comments": "https://peertube.example/videos/watch/abc123/comments",
  "url": [
    {
      "type": "Link",
      "mediaType": "text/html",
      "href": "https://peertube.example/videos/watch/abc123"
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/web-videos/abc123-720.mp4",
      "height": 720,
      "size": 123456789,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/web-videos/abc123-480.mp4",
      "height": 480,
      "size": 67890123,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "application/x-mpegURL",
      "href": "https://peertube.example/static/streaming-playlists/hls/abc123/master.m3u8",
      "tag": [
        {
          "type": "Infohash",
          "name": "abc123def456"
        }
      ]
    }
  ],
  "icon": [
    {
      "type": "Image",
      "url": "https://peertube.example/static/thumbnails/abc123.jpg",
      "mediaType": "image/jpeg",
      "width": 560,
      "height": 315
    }
  ],
  "preview": [
    {
      "type": "Image",
      "rel": ["storyboard"],
      "url": [
        {
          "mediaType": "image/jpeg",
          "href": "https://peertube.example/lazy-static/storyboards/abc123.jpg",
          "width": 1920,
          "height": 1080,
          "tileWidth": 192,
          "tileHeight": 108,
          "tileDuration": "PT63S"
        }
      ]
    }
  ],
  "tag": [
    {
      "type": "Hashtag",
      "name": "activitypub"
    },
    {
      "type": "Hashtag",
      "name": "tutorial"
    }
  ],
  "subtitleLanguage": [
    {
      "identifier": "en",
      "name": "English",
      "automaticallyGenerated": false,
      "url": [
        {
          "type": "Link",
          "mediaType": "text/vtt",
          "href": "https://peertube.example/lazy-static/video-captions/abc123-en.vtt"
        }
      ]
    }
  ]
}
```

### Video Properties

| Property | Description |
|----------|-------------|
| `duration` | ISO 8601 duration (e.g., PT15M30S) |
| `category` | Content category with id and name |
| `language` | Video language |
| `licence` | Content license |
| `views` | View count |
| `isLiveBroadcast` | Whether this is a live stream |
| `commentsPolicy` | `1` = enabled, `2` = disabled, `3` = requires approval ([enum](https://github.com/Chocobozzz/PeerTube/blob/develop/packages/models/src/videos/comment/video-comment-policy.enum.ts)) |
| `canReply` | Who may reply without approval (`as:Public`, or `null` when comments need approval or are off); approved replies get an `ApproveReply` |
| `downloadEnabled` | Whether downloads are allowed |
| `preview` | A **storyboard** sprite sheet (`rel: ["storyboard"]`), not a preview video |
| `tag` | `Hashtag` objects; names are sent **without** the leading `#` |
| `subtitleLanguage` | Captions; each `url` is an **array** of Links (WebVTT, plus an HLS playlist) |

:::note Older fields
PeerTube 6 renamed "WebTorrent" files to **Web Videos** (served under `/static/web-videos/`), and `commentsEnabled` was replaced by `commentsPolicy` + `canReply`. Older payloads may still use the legacy names, so accept both when parsing but emit the current ones.
:::

## Video Resolutions

PeerTube provides multiple video quality options:

```json
{
  "url": [
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/web-videos/abc123-1080.mp4",
      "height": 1080,
      "size": 500000000,
      "fps": 60
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/web-videos/abc123-720.mp4",
      "height": 720,
      "size": 250000000,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/web-videos/abc123-480.mp4",
      "height": 480,
      "size": 100000000,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/web-videos/abc123-360.mp4",
      "height": 360,
      "size": 50000000,
      "fps": 30
    }
  ]
}
```

## Comments on Videos

### Comment Structure

A comment from a remote user keeps its **origin** id (here, Bob's server), even though it replies to a PeerTube video:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://mastodon.example/users/bob/statuses/456",
  "attributedTo": "https://mastodon.example/users/bob",
  "inReplyTo": "https://peertube.example/videos/watch/abc123",
  "content": "<p>Great tutorial! Very helpful for getting started.</p>",
  "published": "2024-01-15T11:00:00Z",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": [
    "https://peertube.example/accounts/alice",
    "https://peertube.example/video-channels/tech_reviews"
  ],
  "tag": [
    {
      "type": "Mention",
      "href": "https://peertube.example/accounts/alice",
      "name": "@alice@peertube.example"
    }
  ]
}
```

### Threaded Comments

```json
{
  "type": "Note",
  "id": "https://mastodon.example/notes/789",
  "inReplyTo": "https://mastodon.example/users/bob/statuses/456",
  "content": "<p>I agree! The examples were very clear.</p>"
}
```

## Implementing PeerTube Support

### Processing Video Objects

```javascript
async function processVideo(activity) {
  const video = activity.object;

  // Extract video URLs
  const videoUrls = (video.url || [])
    .filter(u => u.type === 'Link' && u.mediaType?.startsWith('video/'))
    .map(u => ({
      url: u.href,
      height: u.height,
      size: u.size,
      fps: u.fps,
      mediaType: u.mediaType
    }));

  // Get HLS stream if available
  const hlsUrl = (video.url || []).find(u =>
    u.mediaType === 'application/x-mpegURL'
  );

  // Get thumbnail
  const thumbnail = video.icon?.[0]?.url || video.icon?.url;

  // Parse duration
  const duration = parseDuration(video.duration); // PT15M30S -> 930 seconds

  // Comments: current servers send commentsPolicy (1 enabled, 2 disabled,
  // 3 requires approval); older ones send commentsEnabled
  const commentsPolicy = video.commentsPolicy
    ?? (video.commentsEnabled === false ? 2 : 1);

  const record = {
    id: video.id,
    title: video.name,
    description: video.content,
    author: extractAuthor(video.attributedTo),
    channel: extractChannel(video.attributedTo),
    published: video.published,
    duration,
    views: video.views || 0,
    thumbnail,
    videoUrls,
    hlsUrl: hlsUrl?.href,
    tags: extractTags(video.tag),
    category: video.category?.name,
    language: video.language?.identifier,
    isLive: video.isLiveBroadcast || false,
    sensitive: video.sensitive || false,
    commentsPolicy,
    captions: extractCaptions(video.subtitleLanguage)
  };
  await db.videos.insert(record);
  return record;
}

function extractCaptions(subtitleLanguage = []) {
  return subtitleLanguage.map(c => {
    // url is an array of Links (VTT + HLS); older servers sent a string
    const links = Array.isArray(c.url) ? c.url : [{ mediaType: 'text/vtt', href: c.url }];
    const vtt = links.find(l => l.mediaType === 'text/vtt');
    return { language: c.identifier, name: c.name, url: vtt?.href };
  }).filter(c => c.url);
}

function extractTags(tags = []) {
  return tags.filter(t => t.type === 'Hashtag').map(t => t.name.replace(/^#/, ''));
}

function extractAuthor(attributedTo) {
  if (Array.isArray(attributedTo)) {
    const person = attributedTo.find(a => a.type === 'Person');
    return person?.id;
  }
  return attributedTo;
}

function extractChannel(attributedTo) {
  if (Array.isArray(attributedTo)) {
    const group = attributedTo.find(a => a.type === 'Group');
    return group?.id;
  }
  return null;
}

function parseDuration(iso8601) {
  // Parse PT15M30S format
  if (typeof iso8601 !== 'string') return 0;
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}
```

### Rendering Video Player

Everything here comes from a remote server: escape every value you put into HTML (including attributes) and only allow `http(s)` URLs. `application/x-mpegURL` plays natively only in Safari; other browsers need a library such as [hls.js](https://github.com/video-dev/hls.js).

```javascript
// escapeHtml must also escape quotes (" and ') for use in attributes
const attr = (v) => escapeHtml(String(v ?? ''));

function safeHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

function renderVideoPlayer(video) {
  // Choose appropriate quality
  const defaultQuality = video.videoUrls.find(v => v.height === 720)
    || video.videoUrls[0];

  return `
    <div class="video-player">
      <video
        controls
        poster="${attr(safeHttpUrl(video.thumbnail))}"
        preload="metadata"
      >
        ${video.hlsUrl ? `
          <source src="${attr(safeHttpUrl(video.hlsUrl))}" type="application/x-mpegURL">
        ` : ''}
        ${video.videoUrls.map(v => `
          <source
            src="${attr(safeHttpUrl(v.url))}"
            type="${attr(v.mediaType)}"
            label="${attr(v.height)}p"
          >
        `).join('')}
        ${video.captions.map(c => `
          <track
            kind="subtitles"
            src="${attr(safeHttpUrl(c.url))}"
            srclang="${attr(c.language)}"
            label="${attr(c.name)}"
          >
        `).join('')}
      </video>
      <div class="video-info">
        <h1>${escapeHtml(video.title)}</h1>
        <div class="meta">
          ${formatViews(video.views)} views •
          ${formatDate(video.published)} •
          ${formatDuration(video.duration)}
        </div>
      </div>
    </div>
  `;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
```

### Quality Selector

```javascript
function renderQualitySelector(videoUrls) {
  const qualities = videoUrls
    .filter(v => v.height)
    .sort((a, b) => b.height - a.height);

  return `
    <select class="quality-selector" onchange="changeQuality(this.value)">
      ${qualities.map(q => `
        <option value="${attr(safeHttpUrl(q.url))}">${attr(q.height)}p${q.fps > 30 ? ` ${q.fps}fps` : ''}</option>
      `).join('')}
    </select>
  `;
}
```

## Following Channels

### Follow a PeerTube Channel

```javascript
async function followChannel(follower, channelUrl) {
  const channel = await fetchActor(channelUrl);

  if (channel.type !== 'Group') {
    throw new Error('Not a PeerTube channel');
  }

  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Follow',
    id: `https://${config.domain}/activities/${uuid()}`,
    actor: follower.id,
    object: channel.id
  };

  await deliverActivity(activity, channel.inbox, follower);
}
```

### Receive Channel Updates

A PeerTube video is **created by the account and announced by the channel**. The `Announce` carries the video as a **URI string**, so you must dereference it (see [Announce](https://docs.joinpeertube.org/api/activitypub#announce)):

```json
{
  "type": "Announce",
  "id": "https://peertube.example/videos/watch/abc123/announces/1",
  "actor": "https://peertube.example/video-channels/tech_reviews",
  "object": "https://peertube.example/videos/watch/abc123",
  "to": [
    "https://www.w3.org/ns/activitystreams#Public",
    "https://peertube.example/video-channels/tech_reviews/followers"
  ],
  "cc": []
}
```

```javascript
async function processAnnounce(activity) {
  const objectId = typeof activity.object === 'string'
    ? activity.object
    : activity.object?.id;
  if (!objectId) return;

  // Fetch the object from its own origin (with an SSRF-safe fetcher)
  // rather than trusting an embedded copy.
  const object = await fetchObject(objectId);
  if (object?.type === 'Video') {
    await processVideo({ object });
  }
}
```

PeerTube also sends `View` activities to count views (with `expires` while someone is watching a live video), `Flag` for reports, `CacheFile` for redundancy, and `ApproveReply`/`RejectReply` for moderated comments. See the [ActivityPub documentation](https://docs.joinpeertube.org/api/activitypub) for their shapes.

## Live Streaming

### Live Video Object

```json
{
  "type": "Video",
  "id": "https://peertube.example/videos/watch/live123",
  "name": "Live Q&A Session",
  "isLiveBroadcast": true,
  "liveSaveReplay": true,
  "permanentLive": false,
  "state": 1,
  "url": [
    {
      "type": "Link",
      "mediaType": "application/x-mpegURL",
      "href": "https://peertube.example/static/streaming-playlists/hls/live123/master.m3u8"
    }
  ]
}
```

`state` is a number. The HLS path above is illustrative; always use the `href` the server sends.

### Video States

The common values are below; PeerTube defines more (see `VideoStateType` in the [models](https://github.com/Chocobozzz/PeerTube/tree/develop/packages/models/src/videos)).

| State ID | Label | Description |
|----------|-------|-------------|
| 1 | Published | Published (or, for a live, currently live) |
| 2 | To Transcode | Processing |
| 3 | To Import | Being imported |
| 4 | Waiting For Live | Waiting to start |
| 5 | Live Ended | Stream ended |

## Voting

### Video Likes

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Like",
  "actor": "https://mastodon.example/users/alice",
  "object": "https://peertube.example/videos/watch/abc123"
}
```

### Video Dislikes

PeerTube accepts `Dislike` (and other PeerTube instances send it); Mastodon never sends one.

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Dislike",
  "actor": "https://peertube-two.example/accounts/bob",
  "object": "https://peertube.example/videos/watch/abc123"
}
```

## Playlists

A PeerTube `Playlist` extends `OrderedCollectionPage`. Its items are the ids of **`PlaylistElement`** objects, not bare video URLs; each element points at the video and carries its `position` and optional start/stop timestamps (see [Playlist](https://docs.joinpeertube.org/api/activitypub#playlist) and [PlaylistElement](https://docs.joinpeertube.org/api/activitypub#playlistelement)):

```json
{
  "type": "Playlist",
  "id": "https://peertube.example/video-playlists/fav123",
  "name": "My Favorite Videos",
  "uuid": "4f0c2b1a-7d3e-4b5a-9c8d-1e2f3a4b5c6d",
  "attributedTo": ["https://peertube.example/video-channels/tech_reviews"],
  "totalItems": 2,
  "videoChannelPosition": 1,
  "orderedItems": [
    "https://peertube.example/video-playlists/fav123/videos/1",
    "https://peertube.example/video-playlists/fav123/videos/2"
  ]
}
```

```json
{
  "type": "PlaylistElement",
  "id": "https://peertube.example/video-playlists/fav123/videos/1",
  "url": "https://peertube.example/videos/watch/video1",
  "position": 1,
  "startTimestamp": 30
}
```

## Display Considerations

### Video Embeds in Mastodon

When PeerTube videos appear in Mastodon:

```javascript
function renderPeerTubeEmbed(video) {
  return `
    <div class="peertube-embed">
      <a href="${attr(safeHttpUrl(video.url))}" target="_blank" rel="noopener">
        <img src="${attr(safeHttpUrl(video.thumbnail))}" alt="${attr(video.title)}">
        <div class="play-overlay">▶</div>
      </a>
      <div class="video-meta">
        <strong>${escapeHtml(video.title)}</strong>
        <span>${formatDuration(video.duration)}</span>
      </div>
    </div>
  `;
}
```

### CSS for Video Cards

```css
.peertube-embed {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.peertube-embed img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}
```

## Testing PeerTube Federation

```javascript
describe('PeerTube Compatibility', () => {
  it('should process Video objects', async () => {
    const video = {
      type: 'Video',
      id: 'https://peertube.example/videos/watch/test',
      name: 'Test Video',
      duration: 'PT5M30S',
      url: [{
        type: 'Link',
        mediaType: 'video/mp4',
        href: 'https://peertube.example/static/web-videos/test-720.mp4',
        height: 720
      }]
    };

    await processVideo({ object: video });

    const stored = await db.videos.findOne({ id: video.id });
    expect(stored.duration).toBe(330); // 5m30s in seconds
  });

  it('should handle multiple resolutions', async () => {
    const video = {
      type: 'Video',
      id: 'https://peertube.example/videos/watch/multi',
      name: 'Multi-resolution',
      duration: 'PT1M',
      url: [
        { type: 'Link', mediaType: 'video/mp4', href: 'https://peertube.example/static/web-videos/m-1080.mp4', height: 1080 },
        { type: 'Link', mediaType: 'video/mp4', href: 'https://peertube.example/static/web-videos/m-720.mp4', height: 720 },
        { type: 'Link', mediaType: 'video/mp4', href: 'https://peertube.example/static/web-videos/m-480.mp4', height: 480 }
      ]
    };

    const result = await processVideo({ object: video });
    expect(result.videoUrls).toHaveLength(3);
  });
});
```

## Next Steps

- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Microblogging federation
- **[Lemmy Compatibility](/docs/guides/lemmy-compatibility)** - Link aggregator federation
- **[Media Attachments](/docs/guides/media-attachments)** - Media handling
