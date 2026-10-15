---
title: Threads, Replies and Backfill
description: How conversations are grouped and backfilled across servers with inReplyTo, replies collections, context (FEP-7888, FEP-f228) and conversation containers (FEP-171b), and what Mastodon, Lemmy and NodeBB actually do
last_verified: 2026-10-15
verified_against: "FEP-7888, FEP-f228, FEP-171b (codeberg, 2026-10-15); Mastodon v4.7.3 source and CHANGELOG; Lemmy 0.19.20 and 1.0.0-beta.2 fixtures, PR #5856; live mastodon.social and community.nodebb.org output (2026-10-15)"
---

# Threads, Replies and Backfill

The most common complaint about the fediverse is **missing replies**. You open a post and see three replies when the author sees forty. That happens because no server receives everything: each one only gets the activities addressed to its users. Reconstructing the rest is called **backfill**.

This page covers the three mechanisms in use, from oldest to newest:

1. **`inReplyTo` and `replies`**: a reply tree you walk one post at a time.
2. **`context`**: a single collection for the whole conversation ([FEP-7888](https://codeberg.org/fediverse/fep/src/branch/main/fep/7888/fep-7888.md), [FEP-f228](https://codeberg.org/fediverse/fep/src/branch/main/fep/f228/fep-f228.md)).
3. **Conversation containers**: an owner-moderated collection of activities ([FEP-171b](https://codeberg.org/fediverse/fep/src/branch/main/fep/171b/fep-171b.md)).

All three FEPs are **DRAFT** as of October 2026.

## The reply tree: `inReplyTo` and `replies`

Every reply points to its parent with `inReplyTo`. A post *may* expose a `replies` collection listing its direct replies. Walking down from a root post means fetching each reply's `replies`, recursively.

Here is the `replies` collection of a public mastodon.social post (fetched 2026-10-15):

```json
{
  "id": "https://mastodon.social/users/Mastodon/statuses/117411420916699261/replies",
  "type": "Collection",
  "first": {
    "type": "CollectionPage",
    "next": "https://mastodon.social/users/Mastodon/statuses/117411420916699261/replies?only_other_accounts=true&page=true",
    "partOf": "https://mastodon.social/users/Mastodon/statuses/117411420916699261/replies",
    "items": []
  }
}
```

This shape comes from [`note_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/note_serializer.rb) and the [Mastodon docs](https://docs.joinmastodon.org/spec/activitypub/#as):

- The **first page is embedded** and holds up to 5 of the author's **own** replies (self-threads).
- **Later pages hold other people's replies** (`only_other_accounts=true`).
- Mastodon only includes `replies` on its own local posts.

The reply tree has two structural weaknesses ([FEP-f228](https://codeberg.org/fediverse/fep/src/branch/main/fep/f228/fep-f228.md#summary)):

- **It's slow.** Every level of nesting costs another round of requests.
- **It breaks.** If any post in the middle becomes unreachable (deleted, server down, defederated), everything below it is lost.

### What Mastodon fetches when it sees a new post

When Mastodon receives a `Create` for a post that has a `replies` collection, it looks at the embedded first page without making new requests. It schedules a fetch of at most **5** replies, and only those on the **same host as the post's author**. The code comment says this is to avoid amplification attacks. If the collection is not embedded, it queues a background worker instead ([`create.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb), [`fetch_replies_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/fetch_replies_service.rb)).

**Implication for your server:** embed the first page of `replies` and put the author's own replies there. That is how self-threads show up complete on Mastodon.

### Mastodon's "fetch all replies"

Mastodon 4.4 added an experimental server-side feature that recursively fetches replies, behind a `FETCH_REPLIES_ENABLED` flag. Mastodon 4.5 added web UI support for fetching and refreshing replies ([CHANGELOG](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md)). In v4.7.3 the API controller no longer checks a flag ([`contexts_controller.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/api/v1/statuses/contexts_controller.rb)):

- **Trigger:** a **logged-in user** loads the thread of a remote post (`GET /api/v1/statuses/:id/context`).
- **Debounce:** not within 5 minutes of the post's creation, and at most once every 15 minutes per post ([`fetch_replies_concern.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/concerns/status/fetch_replies_concern.rb)).
- **Walk:** a background job on the `pull` queue walks `replies` collections recursively, across hosts, until it reaches **1,000 replies** or **500 collection pages** for the whole tree, taking at most **500 replies per post** ([`fetch_all_replies_worker.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/fetch_all_replies_worker.rb), [`fetch_all_replies_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/fetch_all_replies_service.rb)).
- **Client notification:** the API response carries a `Mastodon-Async-Refresh` header so clients know new replies may appear.

**Load implications.** A popular post on your server can now be crawled by every Mastodon server whose users open it, each walking your `replies` pages and fetching every reply object. To keep that cheap:

- paginate `replies`, and serve pages from cache (Mastodon caches its own context responses for 3 minutes);
- return **only items the requester may see**, never followers-only or direct replies to an unauthenticated fetch;
- make each reply object cheap to serve, because each one is fetched individually;
- rate-limit per remote server rather than per IP. Many requests come from a few large instances.

## One collection per conversation: `context`

The ActivityStreams `context` property is "intentionally vague" in the spec. [FEP-7888](https://codeberg.org/fediverse/fep/src/branch/main/fep/7888/fep-7888.md) gives it a practical meaning:

- **Publishing.** Put the same `context` on every object in a conversation. It SHOULD resolve to something useful: ideally a collection of the conversation's items, with `attributedTo` naming whoever is in charge of it.
- **Consuming.** Group objects by `context` id instead of rebuilding the tree. Don't assume an object belongs to an authoritative context just because it *claims* that `context`; verify that the context's collection actually contains it.
- **Interacting.** You may reuse someone else's `context` for your reply. If you do, you SHOULD also address the context's owner (`context.attributedTo`), the same way you address the author of the post you reply to.

[FEP-f228](https://codeberg.org/fediverse/fep/src/branch/main/fep/f228/fep-f228.md) builds the backfill algorithm on top of this. There are two flavours of context collection:

| Flavour | Items | How it's linked | Implementations (per FEP-f228) |
|---|---|---|---|
| Collection of **posts** | `Note`, `Article`, … in chronological order; must include the top-level post | `context` on the posts | NodeBB, Iceshrimp.NET, WordPress, Discourse, Mitra, Decodon, PieFed, Mastodon, tootik, Lemmy |
| Collection of **activities** | `Create`, `Update`, `Delete`, `Like`, … | `contextHistory` on the top-level post | Streams, Hubzilla, Forte |

The posts collection represents the thread **as the conversation owner sees it**. The owner may leave out some replies, so it can legitimately differ from the reply tree.

### The f228 backfill algorithm

Once you have the top-level post ([FEP-f228, "Reading collections"](https://codeberg.org/fediverse/fep/src/branch/main/fep/f228/fep-f228.md#reading-collections)):

1. If it has `contextHistory`, read that collection of activities. Done.
2. Otherwise, if it has `context`, read that collection of posts. Done.
3. Otherwise, fall back to `replies`, recursively.

```js
import { safeFetchJson, sameOrigin } from './verify-requests/src/index.js';

const idOf = (v) => (typeof v === 'string' ? v : v?.id);
const MAX_ITEMS = 1000;
const MAX_PAGES = 50;

/** Yield every item URI of a (possibly paged) collection, with limits. */
async function* collectionItems(collectionOrUri) {
  let page = typeof collectionOrUri === 'string'
    ? await safeFetchJson(collectionOrUri)
    : collectionOrUri;
  if (page.first) {
    page = typeof page.first === 'string' ? await safeFetchJson(page.first) : page.first;
  }
  for (let pages = 0, count = 0; page && pages < MAX_PAGES; pages++) {
    for (const item of page.orderedItems ?? page.items ?? []) {
      if (++count > MAX_ITEMS) return;
      yield idOf(item);
    }
    page = page.next ? await safeFetchJson(idOf(page.next)) : null;
  }
}

/**
 * Return URIs of posts in the conversation rooted at `root` (an already
 * fetched, origin-checked top-level post). Each URI must still be fetched
 * from its own origin before you store it: never trust embedded copies.
 */
export async function conversationUris(root) {
  if (root.context) {
    const context = await safeFetchJson(idOf(root.context));
    // Only use it if the context really is a collection that contains the root
    if (context.id === idOf(root.context) && (context.first || context.items || context.orderedItems)) {
      const uris = [];
      for await (const uri of collectionItems(context)) if (uri) uris.push(uri);
      if (uris.includes(root.id)) return uris;
    }
  }
  // Fallback: the reply tree (breadth-first, bounded)
  const seen = new Set([root.id]);
  const queue = [root];
  while (queue.length && seen.size < MAX_ITEMS) {
    const post = queue.shift();
    if (!post.replies) continue;
    for await (const uri of collectionItems(post.replies)) {
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);
      const reply = await safeFetchJson(uri).catch(() => null);
      // A reply must live on the origin its id claims
      if (reply && reply.id === uri && sameOrigin(uri, idOf(reply.attributedTo))) queue.push(reply);
    }
  }
  return [...seen];
}
```

`safeFetchJson` is the SSRF-safe fetcher from [Verifying incoming requests](/docs/security/verifying-requests). The `contextHistory` branch is omitted here because activities collections must be authenticated item by item (see [FEP-171b](#fep-171b-conversation-containers)).

:::caution Accept both collection types
FEP-f228 says a context collection is an `OrderedCollection`. In practice:

- **Mastodon** serves a plain `Collection` with `items`;
- **Lemmy 1.0** and **NodeBB** serve `OrderedCollection` with `orderedItems`.

Read whichever of `items` and `orderedItems` is present.
:::

## What each platform does

### Mastodon

Mastodon 4.5.0 added "support for exposing conversation context for new public conversations according to FEP-7888", and 4.5.4 fixed the serialization of context pages ([CHANGELOG](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md)). Every local post now carries `context`, with the same URI also in its legacy `conversation` property (fetched 2026-10-15):

```json
{
  "id": "https://mastodon.social/users/Mastodon/statuses/117411420916699261",
  "type": "Note",
  "context": "https://mastodon.social/contexts/13179-117411420916699261",
  "conversation": "https://mastodon.social/contexts/13179-117411420916699261"
}
```

Dereferencing it gives a `Collection` attributed to the author of the conversation's root post:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://mastodon.social/contexts/13179-117411420916699261",
  "type": "Collection",
  "attributedTo": "https://mastodon.social/users/Mastodon",
  "first": {
    "type": "CollectionPage",
    "partOf": "https://mastodon.social/contexts/13179-117411420916699261",
    "items": [
      "https://mastodon.social/users/Mastodon/statuses/117411420916699261",
      "https://livellosegreto.it/users/prex/statuses/117411435210642137",
      "https://mastodon.social/users/Gargron/statuses/117411528571228874"
    ]
  }
}
```

The `items` above are shortened; the live page had more. From [`contexts_controller.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/contexts_controller.rb):

- pages hold **60** items and include remote replies Mastodon knows about;
- only posts with public or unlisted visibility are listed;
- responses are cached for 3 minutes;
- in authorized-fetch mode, the endpoint requires a signed request.

**On the receiving side, Mastodon does not read `context`.** It groups incoming posts by the legacy OStatus `conversation` property ([`create.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb), `conversation_from_uri`), and backfills only through `replies`. If you want threads to group correctly on Mastodon, publish `conversation` with the same value as `context`, as Mastodon does.

### Lemmy

A Lemmy comment's `inReplyTo` is either the post (a top-level comment) or the parent comment, and `audience` is the community. Lemmy 0.19.x publishes **no** `context`. Its comment objects ([`note.json` fixture, 0.19.20](https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/objects/note.json)) look like this:

```json
{
  "id": "https://enterprise.lemmy.ml/comment/38741",
  "type": "Note",
  "attributedTo": "https://enterprise.lemmy.ml/u/picard",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://enterprise.lemmy.ml/c/tenforward", "https://enterprise.lemmy.ml/u/picard"],
  "audience": "https://enterprise.lemmy.ml/c/tenforward",
  "inReplyTo": "https://enterprise.lemmy.ml/post/55143",
  "content": "<p>first comment!</p>\n",
  "mediaType": "text/html"
}
```

**Lemmy 1.0** (in beta as of October 2026) adds `context` to posts and comments, for example `https://enterprise.lemmy.ml/comment/38741/context` ([`comment.json` fixture, 1.0.0-beta.2](https://github.com/LemmyNet/lemmy/blob/1.0.0-beta.2/crates/apub/apub/assets/lemmy/objects/comment.json)). The context resolves to an `OrderedCollection` of every comment the server knows in that post ([PR #5856](https://github.com/LemmyNet/lemmy/pull/5856)).

### NodeBB

NodeBB maps a forum topic directly onto `context`. A topic's first post is an `Article` whose `context` is the topic URL and whose `audience` is the category (fetched from community.nodebb.org on 2026-10-15):

```json
{
  "id": "https://community.nodebb.org/post/104809",
  "type": "Article",
  "name": "Backfilling Conversations: Two Major Approaches",
  "context": "https://community.nodebb.org/topic/18844",
  "audience": "https://community.nodebb.org/category/30",
  "attributedTo": "https://community.nodebb.org/uid/2",
  "inReplyTo": null
}
```

The topic URL resolves to a paged `OrderedCollection`, `attributedTo` the category, whose `orderedItems` include replies from Mastodon and other servers. A NodeBB thread is one fetch away for any server that implements f228.

## FEP-171b conversation containers

[FEP-171b](https://codeberg.org/fediverse/fep/src/branch/main/fep/171b/fep-171b.md) takes the "owner" idea further. A conversation is controlled by one actor, who decides what is in it:

- Participants deliver their replies and reactions **only to the conversation owner**.
- The owner wraps each accepted activity in an `Add` whose `target` is the container (an `OrderedCollection` of activities, `attributedTo` the owner), and distributes it to the audience.
- The top-level post links the container with `contextHistory`.
- Replies **copy the audience** of the conversation root.
- The owner can restrict repliers with a `canReply` array of actors or collections. Note this is a plain array, not the GoToSocial sub-policy object described in [Quote posts and interaction policies](/docs/guides/quote-posts-and-interaction-policies).
- Moderation is the owner simply not `Add`-ing something, or distributing an `Add(Delete)` to remove it.

The container doubles as the backfill source.

:::danger Authenticate every `Add`ed activity
An `Add` from the owner can wrap an activity by someone else. FEP-171b requires [FEP-fe34](/docs/security/origin-model) origin checks. Accept an embedded activity only if its actor has the same origin as the `Add`'s actor, or it carries a valid [FEP-8b32](https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md) proof, or you re-fetch it from its own `id`. Otherwise a malicious owner can forge `Update`s and poison your cache.
:::

The FEP lists Streams and Forte (the reference implementation), Hubzilla, and Mitra (private conversations only) as implementations.

## Publishing checklist

- [ ] Set `inReplyTo` on replies and expose a `replies` collection with an **embedded first page**.
- [ ] Put a resolvable `context` on every post in a conversation. Serve it as a paged collection of posts, `attributedTo` the conversation owner, and include the root post.
- [ ] Also set `conversation` to the same value if you want Mastodon to group your threads.
- [ ] When replying inside someone else's `context`, keep it and address `context.attributedTo`.
- [ ] Filter context and replies collections by what the requester may see, and cache them.
- [ ] Serve these collections as `application/activity+json` (see [Content-Type requirements](/docs/specs/activitypub/overview)).

## Consuming checklist

- [ ] Prefer `contextHistory`, then `context`, then the `replies` tree (FEP-f228 order).
- [ ] Accept both `items` and `orderedItems`, and both `Collection` and `OrderedCollection`.
- [ ] Cap pages and items, and fetch every post **from its own origin** with an SSRF-safe client.
- [ ] Don't treat a claimed `context` as proof of inclusion; check the collection.
- [ ] Render remote `content` only after sanitizing it (see [Content security](/docs/reference/content-security)).

## See also

- [Posts and Replies](/docs/guides/posts-and-replies)
- [Quote Posts and Interaction Policies](/docs/guides/quote-posts-and-interaction-policies)
- [Origin model (FEP-fe34)](/docs/security/origin-model)
- [NodeBB: Backfilling conversations, two major approaches](https://community.nodebb.org/topic/18844/backfilling-conversations-two-major-approaches)
