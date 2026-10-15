---
sidebar_position: 18
title: Lemmy Compatibility
description: Implementing federation with Lemmy, the link aggregator for the fediverse
---

# Lemmy Compatibility

:::info Verified against
Lemmy 0.19.20 (stable) and 1.0.0-beta.2, checked 2026-10-15 against Lemmy's own [federation fixtures](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy) and [federation docs](https://join-lemmy.org/docs/contributors/05-federation.html). When in doubt, those fixtures are the source of truth.
:::

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
  "attributedTo": "https://lemmy.example/c/technology/moderators",
  "postingRestrictedToMods": false,
  "endpoints": {
    "sharedInbox": "https://lemmy.example/inbox"
  }
}
```

### Community Properties

| Property | Description |
|----------|-------------|
| `attributedTo` | URL of the community's moderators collection |
| `postingRestrictedToMods` | Whether only mods can post |

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
  "attachment": [
    {
      "type": "Link",
      "href": "https://example.com/cool-project"
    }
  ],
  "image": {
    "type": "Image",
    "url": "https://lemmy.example/pictrs/image/thumbnail.jpg"
  },
  "sensitive": false,
  "language": {
    "identifier": "en",
    "name": "English"
  },
  "published": "2024-01-15T10:00:00Z"
}
```

### Post Properties

| Property | Description |
|----------|-------------|
| `name` | Post title (required) |
| `attachment` | For link posts: `[{"type": "Link", "href": "..."}]`. Lemmy reads only the **first** attachment (it also accepts `Image` and `Document` attachments) |
| `content` | Post body as HTML (optional); `source` carries the Markdown |
| `audience` | The community this was posted to |
| `image` | Thumbnail image |
| `language` | `{identifier, name}` language tag |

:::warning Lemmy ignores top-level `url`
Lemmy 0.19's `Page` has no `url` field, so a link sent as `"url": "..."` is silently dropped and the post arrives as a plain text post. Put the link in `attachment`. See [`page.rs`](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/src/protocol/objects/page.rs) and the [`page.json` fixture](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/objects/page.json).
:::

Locking is not a property of the Page — it is a separate [`Lock` activity](#locking-posts).

### Link Posts vs Text Posts

**Link Post:**
```json
{
  "type": "Page",
  "name": "Interesting Article",
  "attachment": [
    { "type": "Link", "href": "https://example.com/article" }
  ]
}
```

**Text Post:**
```json
{
  "type": "Page",
  "name": "Discussion Topic",
  "content": "<p>Let's discuss this topic...</p>",
  "mediaType": "text/html"
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

Lemmy uses Like and Dislike activities for voting. Votes are sent to the **community**, which re-announces them to its followers; they carry `audience` rather than public addressing (see the [voting fixtures](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities/voting)):

### Upvote

```json
{
  "type": "Like",
  "id": "https://lemmy.example/activities/like/123",
  "actor": "https://lemmy.example/u/bob",
  "object": "https://lemmy.example/post/12345",
  "audience": "https://lemmy.example/c/technology"
}
```

### Downvote

```json
{
  "type": "Dislike",
  "id": "https://lemmy.example/activities/dislike/456",
  "actor": "https://lemmy.example/u/charlie",
  "object": "https://lemmy.example/post/12345",
  "audience": "https://lemmy.example/c/technology"
}
```

Instances can disable downvotes, in which case incoming `Dislike` activities are ignored.

### Removing Vote

```json
{
  "type": "Undo",
  "id": "https://lemmy.example/activities/undo/789",
  "actor": "https://lemmy.example/u/bob",
  "object": {
    "type": "Like",
    "id": "https://lemmy.example/activities/like/123",
    "actor": "https://lemmy.example/u/bob",
    "object": "https://lemmy.example/post/12345",
    "audience": "https://lemmy.example/c/technology"
  },
  "audience": "https://lemmy.example/c/technology"
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

Communities redistribute **every** post- and comment-related activity they receive — `Create`, `Update`, `Like`, `Dislike`, `Delete`, `Remove`, `Lock`, `Undo` and so on — by wrapping it in an `Announce` (see [`announce_create_page.json`](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities/community/announce_create_page.json)):

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
    // Lemmy uses the first attachment as the post's link
    const first = Array.isArray(object.attachment) ? object.attachment[0] : undefined;
    const link = first?.type === 'Link' ? first.href : first?.url;
    await createLemmyPost({
      id: object.id,
      title: object.name,
      url: link ?? null,
      content: object.content, // remote HTML: sanitize before display
      author: object.attributedTo,
      community: object.audience,
      published: object.published
    });
  } else if (object.type === 'Note') {
    // A reply is a Lemmy comment only if its thread root is a Page;
    // plain replies from Mastodon etc. also have inReplyTo.
    if (object.inReplyTo && await threadRootIsPage(object.inReplyTo)) {
      await createComment(object);
    } else {
      await createMicroblogPost(object);
    }
  }
}
```

### Handling Community Announces

```javascript
// `activity` has already passed HTTP-signature verification, and the
// signer is activity.actor (the community).
async function processAnnounce(activity) {
  const actor = await fetchActor(activity.actor);

  if (actor.type === 'Group') {
    // Community redistribution. The embedded activity is NOT signed by its
    // author, so don't trust it as-is: re-fetch it from its own origin
    // (or verify that its id, actor and object share an origin with a
    // signed copy) before processing.
    const embedded = activity.object;
    const innerId = typeof embedded === 'string' ? embedded : embedded.id;
    const inner = await fetchFromOrigin(innerId); // dereference by id
    if (new URL(inner.id).origin !== new URL(inner.actor).origin) {
      throw new Error('Inner activity origin mismatch');
    }

    // Communities announce many types, not just Create
    switch (inner.type) {
      case 'Create': return processIncomingCreate(inner);
      case 'Update': return processUpdate(inner);
      case 'Like':   return processLike(inner);
      case 'Dislike':return processDislike(inner);
      case 'Delete': return processDelete(inner);
      case 'Lock':   return processLock(inner);
      case 'Undo':   return processUndo(inner);
      default:       return; // ignore what you don't support
    }
  } else {
    // Regular boost/reblog
    await processBoost(activity);
  }
}
```

### Handling Votes

```javascript
// One vote per (actor, object): a Dislike replaces an earlier Like and
// vice versa. Key the upsert on actor+object, not on the vote type.
async function recordVote(activity, value) {
  const objectUrl = typeof activity.object === 'string'
    ? activity.object
    : activity.object.id;

  await db.votes.upsert(
    { actor: activity.actor, object: objectUrl }, // unique key
    { value }                                      // +1 or -1
  );
  await updateVoteCount(objectUrl);
}

const processLike = (activity) => recordVote(activity, +1);
const processDislike = (activity) => recordVote(activity, -1);

async function processUndoVote(undo) {
  const vote = undo.object;
  if (vote.actor !== undo.actor) throw new Error('Actor mismatch');
  const objectUrl = typeof vote.object === 'string' ? vote.object : vote.object.id;
  await db.votes.delete({ actor: undo.actor, object: objectUrl });
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
    ...(post.body && {
      content: formatMarkdown(post.body),
      mediaType: 'text/html',
      source: { content: post.body, mediaType: 'text/markdown' }
    }),
    // Lemmy reads the link from the first attachment, not `url`
    ...(post.url && { attachment: [{ type: 'Link', href: post.url }] }),
    published: new Date().toISOString()
  };

  // Wrap in Create
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Create',
    id: `${page.id}/activity`,
    actor: author.id,
    to: page.to,
    cc: [community],
    audience: community,
    object: page
  };

  // Send to community inbox
  await deliverActivity(activity, communityActor.inbox, author);

  return page;
}
```

## Moderation

All moderation activities are sent by the **moderator** (a `Person`), addressed to the community, and then announced by the community.

### Removing Content

A mod removal is a `Delete` with a `summary` (the reason); see [`remove_note.json`](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities/deletion/remove_note.json):

```json
{
  "type": "Delete",
  "id": "https://lemmy.example/activities/delete/1",
  "actor": "https://lemmy.example/u/mod",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://lemmy.example/c/technology"],
  "object": "https://lemmy.example/post/12345",
  "audience": "https://lemmy.example/c/technology",
  "summary": "Removed for rule violation"
}
```

### Banning Users

A ban is a `Block` sent **by the moderator**, with `target` naming the community (or the instance, for a site-wide ban); see [`block_user.json`](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities/block/block_user.json):

```json
{
  "type": "Block",
  "id": "https://lemmy.example/activities/block/2",
  "actor": "https://lemmy.example/u/mod",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://lemmy.example/c/technology"],
  "object": "https://other.example/u/spammer",
  "target": "https://lemmy.example/c/technology",
  "audience": "https://lemmy.example/c/technology",
  "removeData": true,
  "summary": "spam",
  "expires": "2026-11-01T00:00:00Z"
}
```

An unban is `Undo` wrapping the `Block`.

### Locking Posts

Locking uses a dedicated `Lock` activity, and unlocking is `Undo` of that `Lock` — not an `Update` of the Page; see [`lock_page.json`](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities/community/lock_page.json) and [`undo_lock_page.json`](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities/community/undo_lock_page.json):

```json
{
  "type": "Lock",
  "id": "https://lemmy.example/activities/lock/3",
  "actor": "https://lemmy.example/u/mod",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://lemmy.example/c/technology"],
  "object": "https://lemmy.example/post/12345",
  "audience": "https://lemmy.example/c/technology"
}
```

### Other Community Activities

Lemmy also federates `Add`/`Remove` for moderators and featured (pinned) posts, `Flag` for reports, and `Update` of the Group for community settings — see the [community fixtures](https://github.com/LemmyNet/lemmy/tree/0.19.20/crates/apub/assets/lemmy/activities/community). Private messages are `Create` of a `ChatMessage` object.

## Common Differences from Mastodon

| Feature | Mastodon | Lemmy |
|---------|----------|-------|
| Posts | Note | Page with `name` title |
| Communities | N/A | Group actors |
| Addressing | To followers | To community |
| Voting | Like only | Like and Dislike (sent via the community) |
| Distribution | Direct | Via community Announce |
| Content | HTML | Markdown source + HTML |

## Displaying Lemmy Content

### Rendering Posts

```javascript
// Everything from a remote server is untrusted: escape text, allow only
// http(s) links, and sanitize HTML (e.g. with DOMPurify / sanitize-html).
function safeHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

function renderLemmyPost(page) {
  const first = Array.isArray(page.attachment) ? page.attachment[0] : undefined;
  const link = safeHttpUrl(first?.type === 'Link' ? first.href : first?.url);
  return `
    <article class="lemmy-post">
      <h2>${escapeHtml(page.name)}</h2>
      ${link ? `<a href="${escapeHtml(link)}" class="external-link" rel="nofollow noopener">🔗 ${escapeHtml(link)}</a>` : ''}
      ${page.content ? `<div class="post-body">${sanitizeHtml(page.content)}</div>` : ''}
      <footer>
        Posted to ${escapeHtml(getCommunityName(page.audience))}
        by ${escapeHtml(getActorName(page.attributedTo))}
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

## Lemmy 1.0 (beta) changes

Lemmy 1.0 is in beta (1.0.0-beta.2, September 2026) with no release date. Compared with 0.19, its [`page.json` fixture](https://github.com/LemmyNet/lemmy/blob/1.0.0-beta.2/crates/apub/apub/assets/lemmy/objects/page.json) adds:

- `context` — a URL for the post's conversation collection
- `tag` entries of type `CommunityPostTag` (community post tags) and a `Mention` of the community
- `audience` is still sent, so audience-based handling keeps working

The client API changes to v4 (with a v3 compatibility layer); see [Breaking Changes in Lemmy 1.0](https://join-lemmy.org/news/2025-02-03_-_Breaking_Changes_in_Lemmy_1.0). Handle both 0.19 and 1.0 servers until 0.19 instances age out.

## Testing Lemmy Federation

```javascript
describe('Lemmy Compatibility', () => {
  it('should handle Page objects', async () => {
    const page = {
      type: 'Page',
      id: 'https://lemmy.example/post/1',
      name: 'Test Post',
      content: '<p>Content</p>',
      attributedTo: 'https://lemmy.example/u/alice',
      attachment: [{ type: 'Link', href: 'https://example.com/a' }]
    };

    await processIncomingCreate({ type: 'Create', object: page });

    const stored = await db.posts.findOne({ id: page.id });
    expect(stored.title).toBe('Test Post');
    expect(stored.url).toBe('https://example.com/a');
  });

  it('should handle community Announces', async () => {
    const create = {
      type: 'Create',
      id: 'https://lemmy.example/activities/create/2',
      actor: 'https://lemmy.example/u/alice',
      object: {
        type: 'Page',
        id: 'https://lemmy.example/post/2',
        name: 'Announced Post',
        attributedTo: 'https://lemmy.example/u/alice'
      }
    };
    const announce = {
      type: 'Announce',
      actor: 'https://lemmy.example/c/test',
      object: create
    };

    // processAnnounce re-fetches the inner activity from its origin
    mockFetchFromOrigin(create.id, create);
    await processAnnounce(announce);

    const stored = await db.posts.findOne({ id: create.object.id });
    expect(stored.title).toBe('Announced Post');
  });
});
```

## Next Steps

- **[Pixelfed Compatibility](/docs/guides/pixelfed-compatibility)** - Photo sharing federation
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Microblogging federation
- **[Content Moderation](/docs/guides/content-moderation)** - Moderation tools
