---
sidebar_position: 18
title: Lemmy Compatibility
description: Implementing federation with Lemmy, the link aggregator for the fediverse
---

# Lemmy Compatibility

Lemmy is a federated link aggregator similar to Reddit. It uses ActivityPub with a community-based structure that differs significantly from microblogging platforms like Mastodon. This guide covers federating with Lemmy instances.

## Lemmy's Federation Model

```
┌────────────────────────────────────────────────────────────┐
│                   LEMMY STRUCTURE                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Instance                                                  │
│  └── Communities (Group actors)                            │
│      └── Posts (Page objects)                              │
│          └── Comments (Note objects)                       │
│                                                            │
│  Key Difference from Mastodon:                             │
│  - Posts are addressed TO communities                      │
│  - Communities are Group actors that redistribute          │
│  - Voting uses Like/Dislike activities                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Actor Types

### Person (User)

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "lemmy": "https://join-lemmy.org/ns#"
    }
  ],
  "type": "Person",
  "id": "https://lemmy.example/u/alice",
  "preferredUsername": "alice",
  "name": "Alice",
  "inbox": "https://lemmy.example/u/alice/inbox",
  "outbox": "https://lemmy.example/u/alice/outbox",
  "publicKey": {
    "id": "https://lemmy.example/u/alice#main-key",
    "owner": "https://lemmy.example/u/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

### Group (Community)

Lemmy communities are represented as Group actors:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://w3id.org/security/v1",
    {
      "lemmy": "https://join-lemmy.org/ns#",
      "moderators": "lemmy:moderators",
      "postingRestrictedToMods": "lemmy:postingRestrictedToMods"
    }
  ],
  "type": "Group",
  "id": "https://lemmy.example/c/technology",
  "preferredUsername": "technology",
  "name": "Technology",
  "summary": "<p>A community for tech discussion</p>",
  "inbox": "https://lemmy.example/c/technology/inbox",
  "outbox": "https://lemmy.example/c/technology/outbox",
  "followers": "https://lemmy.example/c/technology/followers",
  "publicKey": {
    "id": "https://lemmy.example/c/technology#main-key",
    "owner": "https://lemmy.example/c/technology",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "moderators": "https://lemmy.example/c/technology/moderators",
  "postingRestrictedToMods": false,
  "endpoints": {
    "sharedInbox": "https://lemmy.example/inbox"
  }
}
```

### Community Properties

| Property | Description |
|----------|-------------|
| `moderators` | Collection of community moderators |
| `postingRestrictedToMods` | Whether only mods can post |
| `attributedTo` | Array of moderator actor IDs |

## Posts (Page Objects)

Lemmy posts use the `Page` type rather than `Note`:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Page",
  "id": "https://lemmy.example/post/12345",
  "attributedTo": "https://lemmy.example/u/alice",
  "to": [
    "https://www.w3.org/ns/activitystreams#Public",
    "https://lemmy.example/c/technology"
  ],
  "cc": [],
  "audience": "https://lemmy.example/c/technology",
  "name": "Check out this cool project",
  "content": "<p>I found this interesting open source project...</p>",
  "mediaType": "text/html",
  "source": {
    "content": "I found this interesting open source project...",
    "mediaType": "text/markdown"
  },
  "url": "https://example.com/cool-project",
  "image": {
    "type": "Image",
    "url": "https://lemmy.example/pictrs/image/thumbnail.jpg"
  },
  "commentsEnabled": true,
  "sensitive": false,
  "published": "2024-01-15T10:00:00Z",
  "updated": null
}
```

### Post Properties

| Property | Description |
|----------|-------------|
| `name` | Post title (required) |
| `url` | External link (for link posts) |
| `content` | Post body text (optional) |
| `audience` | The community this was posted to |
| `image` | Thumbnail image |
| `commentsEnabled` | Whether comments are allowed |

### Link Posts vs Text Posts

**Link Post:**
```json
{
  "type": "Page",
  "name": "Interesting Article",
  "url": "https://example.com/article",
  "content": null
}
```

**Text Post:**
```json
{
  "type": "Page",
  "name": "Discussion Topic",
  "url": null,
  "content": "<p>Let's discuss this topic...</p>"
}
```

## Comments (Note Objects)

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Note",
  "id": "https://lemmy.example/comment/67890",
  "attributedTo": "https://lemmy.example/u/bob",
  "to": [
    "https://www.w3.org/ns/activitystreams#Public",
    "https://lemmy.example/c/technology"
  ],
  "cc": [
    "https://lemmy.example/u/alice"
  ],
  "content": "<p>Great find! I've been looking for something like this.</p>",
  "mediaType": "text/html",
  "source": {
    "content": "Great find! I've been looking for something like this.",
    "mediaType": "text/markdown"
  },
  "inReplyTo": "https://lemmy.example/post/12345",
  "published": "2024-01-15T10:30:00Z"
}
```

### Nested Comments

Comments can reply to other comments:

```json
{
  "type": "Note",
  "id": "https://lemmy.example/comment/67891",
  "inReplyTo": "https://lemmy.example/comment/67890",
  "content": "<p>I agree!</p>"
}
```

## Voting

Lemmy uses Like and Dislike activities for voting:

### Upvote

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Like",
  "id": "https://lemmy.example/activities/like/123",
  "actor": "https://lemmy.example/u/bob",
  "object": "https://lemmy.example/post/12345",
  "to": [
    "https://www.w3.org/ns/activitystreams#Public"
  ],
  "cc": [
    "https://lemmy.example/c/technology"
  ]
}
```

### Downvote

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Dislike",
  "id": "https://lemmy.example/activities/dislike/456",
  "actor": "https://lemmy.example/u/charlie",
  "object": "https://lemmy.example/post/12345"
}
```

### Removing Vote

```json
{
  "type": "Undo",
  "actor": "https://lemmy.example/u/bob",
  "object": {
    "type": "Like",
    "actor": "https://lemmy.example/u/bob",
    "object": "https://lemmy.example/post/12345"
  }
}
```

## Community Federation

### Following a Community

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Follow",
  "id": "https://mastodon.example/activities/follow/789",
  "actor": "https://mastodon.example/users/alice",
  "object": "https://lemmy.example/c/technology"
}
```

### Accept Response

```json
{
  "type": "Accept",
  "actor": "https://lemmy.example/c/technology",
  "object": {
    "type": "Follow",
    "actor": "https://mastodon.example/users/alice",
    "object": "https://lemmy.example/c/technology"
  }
}
```

### Community Announce

When someone posts to a community, Lemmy wraps it in an Announce:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Announce",
  "id": "https://lemmy.example/activities/announce/abc",
  "actor": "https://lemmy.example/c/technology",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://lemmy.example/c/technology/followers"],
  "object": {
    "type": "Create",
    "actor": "https://lemmy.example/u/alice",
    "object": {
      "type": "Page",
      "id": "https://lemmy.example/post/12345",
      "name": "New Post Title"
    }
  }
}
```

## Implementing Lemmy Support

### Handling Page Objects

```javascript
async function processIncomingCreate(activity) {
  const object = activity.object;

  if (object.type === 'Page') {
    // Lemmy post
    await createLemmyPost({
      id: object.id,
      title: object.name,
      url: object.url,
      content: object.content,
      author: object.attributedTo,
      community: object.audience,
      published: object.published
    });
  } else if (object.type === 'Note') {
    if (isLemmyComment(object)) {
      await createComment(object);
    } else {
      await createMicroblogPost(object);
    }
  }
}

function isLemmyComment(note) {
  // Lemmy comments have inReplyTo pointing to Page or Note
  return note.inReplyTo != null;
}
```

### Handling Community Announces

```javascript
async function processAnnounce(activity) {
  const actor = await fetchActor(activity.actor);

  if (actor.type === 'Group') {
    // This is a community redistribution
    const innerActivity = activity.object;

    // Process the inner activity
    if (innerActivity.type === 'Create') {
      await processIncomingCreate(innerActivity);
    }
  } else {
    // Regular boost/reblog
    await processBoost(activity);
  }
}
```

### Handling Votes

```javascript
async function processLike(activity) {
  const objectUrl = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  await db.votes.upsert({
    actor: activity.actor,
    object: objectUrl,
    type: 'upvote'
  });

  // Update vote count
  await updateVoteCount(objectUrl);
}

async function processDislike(activity) {
  const objectUrl = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  await db.votes.upsert({
    actor: activity.actor,
    object: objectUrl,
    type: 'downvote'
  });

  await updateVoteCount(objectUrl);
}
```

### Posting to Lemmy Communities

```javascript
async function postToCommunity(author, community, post) {
  // Fetch community actor
  const communityActor = await fetchActor(community);

  if (communityActor.type !== 'Group') {
    throw new Error('Target is not a community');
  }

  // Create the Page object
  const page = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Page',
    id: `https://${config.domain}/posts/${uuid()}`,
    attributedTo: author.id,
    to: [
      'https://www.w3.org/ns/activitystreams#Public',
      community
    ],
    audience: community,
    name: post.title,
    content: post.body ? formatMarkdown(post.body) : null,
    url: post.url || null,
    published: new Date().toISOString()
  };

  // Wrap in Create
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Create',
    id: `${page.id}/activity`,
    actor: author.id,
    to: page.to,
    object: page
  };

  // Send to community inbox
  await deliverActivity(activity, communityActor.inbox, author);

  return page;
}
```

## Moderation

### Removing Content

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Delete",
  "actor": "https://lemmy.example/u/mod",
  "object": "https://lemmy.example/post/12345",
  "audience": "https://lemmy.example/c/technology",
  "summary": "Removed for rule violation"
}
```

### Banning Users

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Block",
  "actor": "https://lemmy.example/c/technology",
  "object": "https://lemmy.example/u/spammer",
  "removeData": true
}
```

### Locking Posts

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Update",
  "actor": "https://lemmy.example/u/mod",
  "object": {
    "type": "Page",
    "id": "https://lemmy.example/post/12345",
    "commentsEnabled": false
  }
}
```

## Common Differences from Mastodon

| Feature | Mastodon | Lemmy |
|---------|----------|-------|
| Posts | Note | Page with `name` title |
| Communities | N/A | Group actors |
| Addressing | To followers | To community |
| Voting | Like only | Like and Dislike |
| Distribution | Direct | Via community Announce |
| Content | HTML | Markdown source + HTML |

## Displaying Lemmy Content

### Rendering Posts

```javascript
function renderLemmyPost(page) {
  return `
    <article class="lemmy-post">
      <h2>${escapeHtml(page.name)}</h2>
      ${page.url ? `<a href="${page.url}" class="external-link">🔗 ${page.url}</a>` : ''}
      ${page.content ? `<div class="post-body">${page.content}</div>` : ''}
      <footer>
        Posted to ${getCommunityName(page.audience)}
        by ${getActorName(page.attributedTo)}
      </footer>
    </article>
  `;
}
```

### Handling Vote Counts

```javascript
async function getVoteScore(objectId) {
  const upvotes = await db.votes.count({
    object: objectId,
    type: 'upvote'
  });

  const downvotes = await db.votes.count({
    object: objectId,
    type: 'downvote'
  });

  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes
  };
}
```

## Testing Lemmy Federation

```javascript
describe('Lemmy Compatibility', () => {
  it('should handle Page objects', async () => {
    const page = {
      type: 'Page',
      id: 'https://lemmy.example/post/1',
      name: 'Test Post',
      content: '<p>Content</p>',
      attributedTo: 'https://lemmy.example/u/alice'
    };

    await processIncomingCreate({ type: 'Create', object: page });

    const stored = await db.posts.findOne({ id: page.id });
    expect(stored.title).toBe('Test Post');
  });

  it('should handle community Announces', async () => {
    const announce = {
      type: 'Announce',
      actor: 'https://lemmy.example/c/test',
      object: {
        type: 'Create',
        object: {
          type: 'Page',
          id: 'https://lemmy.example/post/2',
          name: 'Announced Post'
        }
      }
    };

    await processAnnounce(announce);
    // Verify post was stored
  });
});
```

## Next Steps

- **[Pixelfed Compatibility](/docs/guides/pixelfed-compatibility)** - Photo sharing federation
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Microblogging federation
- **[Content Moderation](/docs/guides/content-moderation)** - Moderation tools
