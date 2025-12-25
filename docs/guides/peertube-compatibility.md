---
sidebar_position: 20
title: PeerTube Compatibility
description: Implementing federation with PeerTube, the video platform
---

# PeerTube Compatibility

PeerTube is a decentralized video hosting platform that uses ActivityPub for federation. It has unique requirements for video content, channels, and WebTorrent integration. This guide covers federating with PeerTube instances.

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
│  - WebTorrent / HLS streaming                              │
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
      "commentsEnabled": "pt:commentsEnabled",
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
  "uuid": "abc123-def456-ghi789",
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
  "commentsEnabled": true,
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
      "href": "https://peertube.example/static/webseed/abc123-720.mp4",
      "height": 720,
      "size": 123456789,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/static/webseed/abc123-480.mp4",
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
      "type": "Video",
      "url": "https://peertube.example/static/previews/abc123.mp4",
      "mediaType": "video/mp4"
    }
  ],
  "tag": [
    {
      "type": "Hashtag",
      "name": "#activitypub"
    },
    {
      "type": "Hashtag",
      "name": "#tutorial"
    }
  ],
  "subtitleLanguage": [
    {
      "identifier": "en",
      "name": "English",
      "url": "https://peertube.example/static/captions/abc123-en.vtt"
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
| `commentsEnabled` | Whether comments are allowed |
| `downloadEnabled` | Whether downloads are allowed |

## Video Resolutions

PeerTube provides multiple video quality options:

```json
{
  "url": [
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/videos/abc123-1080.mp4",
      "height": 1080,
      "size": 500000000,
      "fps": 60
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/videos/abc123-720.mp4",
      "height": 720,
      "size": 250000000,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/videos/abc123-480.mp4",
      "height": 480,
      "size": 100000000,
      "fps": 30
    },
    {
      "type": "Link",
      "mediaType": "video/mp4",
      "href": "https://peertube.example/videos/abc123-360.mp4",
      "height": 360,
      "size": 50000000,
      "fps": 30
    }
  ]
}
```

## Comments on Videos

### Comment Structure

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://peertube.example/videos/watch/abc123/comments/456",
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
  "inReplyTo": "https://peertube.example/videos/watch/abc123/comments/456",
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

  await db.videos.insert({
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
    commentsEnabled: video.commentsEnabled !== false,
    captions: extractCaptions(video.subtitleLanguage)
  });
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
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}
```

### Rendering Video Player

```javascript
function renderVideoPlayer(video) {
  // Choose appropriate quality
  const defaultQuality = video.videoUrls.find(v => v.height === 720)
    || video.videoUrls[0];

  return `
    <div class="video-player">
      <video
        controls
        poster="${video.thumbnail}"
        preload="metadata"
      >
        ${video.hlsUrl ? `
          <source src="${video.hlsUrl}" type="application/x-mpegURL">
        ` : ''}
        ${video.videoUrls.map(v => `
          <source
            src="${v.url}"
            type="${v.mediaType}"
            label="${v.height}p"
          >
        `).join('')}
        ${video.captions.map(c => `
          <track
            kind="subtitles"
            src="${c.url}"
            srclang="${c.language}"
            label="${c.name}"
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
        <option value="${q.url}">${q.height}p${q.fps > 30 ? ` ${q.fps}fps` : ''}</option>
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

```javascript
async function processAnnounce(activity) {
  const actor = await fetchActor(activity.actor);

  // PeerTube channels announce new videos
  if (actor.type === 'Group') {
    const innerObject = activity.object;

    if (typeof innerObject === 'object' && innerObject.type === 'Video') {
      await processVideo({ object: innerObject });
    }
  }
}
```

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
  "state": {
    "id": 1,
    "label": "Published"
  },
  "url": [
    {
      "type": "Link",
      "mediaType": "application/x-mpegURL",
      "href": "https://peertube.example/live/stream/live123/master.m3u8"
    }
  ]
}
```

### Live Stream States

| State ID | Label | Description |
|----------|-------|-------------|
| 1 | Published | Stream is live |
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

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Dislike",
  "actor": "https://mastodon.example/users/bob",
  "object": "https://peertube.example/videos/watch/abc123"
}
```

## Playlists

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Playlist",
  "id": "https://peertube.example/video-playlists/fav123",
  "name": "My Favorite Videos",
  "attributedTo": "https://peertube.example/accounts/alice",
  "orderedItems": [
    "https://peertube.example/videos/watch/video1",
    "https://peertube.example/videos/watch/video2",
    "https://peertube.example/videos/watch/video3"
  ],
  "totalItems": 3
}
```

## Display Considerations

### Video Embeds in Mastodon

When PeerTube videos appear in Mastodon:

```javascript
function renderPeerTubeEmbed(video) {
  return `
    <div class="peertube-embed">
      <a href="${video.url}" target="_blank" rel="noopener">
        <img src="${video.thumbnail}" alt="${video.title}">
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
        href: 'https://peertube.example/videos/test.mp4',
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
      url: [
        { type: 'Link', mediaType: 'video/mp4', height: 1080 },
        { type: 'Link', mediaType: 'video/mp4', height: 720 },
        { type: 'Link', mediaType: 'video/mp4', height: 480 }
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
