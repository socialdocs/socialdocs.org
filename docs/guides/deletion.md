---
title: Deletion
description: Deleting posts and accounts over ActivityPub — Delete vs Undo, Tombstones, 404 vs 410, fan-out, Delete-before-Create "zombie posts", and what a receiver must check.
last_verified: 2026-10-15
verified_against: "ActivityPub REC §6.4/§7.4, Mastodon 4.7.3 source (Activity::Delete, Activity::Create, DeleteAccountService, RemoveStatusService, StatusReachFinder, InboxesController), FEP-fe34"
---

# Deletion

Deleting something you published is easy to get wrong in both directions. Send the `Delete` to too few servers and copies live on. Accept a `Delete` without checking who sent it and anyone can erase anyone else's posts.

There is also a hard limit: **once an object has left your server, nothing in ActivityPub can force another server to remove it.** The spec says the receiver "SHOULD remove its representation of the object" ([AP §7.4](https://www.w3.org/TR/activitypub/#delete-activity-inbox)). Deletion is a request that well-behaved servers honour, not a guarantee. Say so in your UI.

## Delete or Undo?

| You want to… | Send | Why |
|---|---|---|
| Remove a post, poll, or other object you created | `Delete` with the object | The object itself goes away |
| Remove your account | `Delete` whose object is your actor | See [Deleting an actor](#deleting-an-actor) |
| Take back a Like, boost, Follow, or Block | `Undo` wrapping the original activity | The object still exists; you are reversing your activity about it |

An un-boost is an `Undo` of the `Announce`, not a `Delete`. Mastodon's `RemoveStatusService` sends `UndoAnnounce` when the removed status is a reblog and `DeleteNote` otherwise ([remove_status_service.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/remove_status_service.rb)).

## Sending a Delete for a post

Mastodon's `Delete` for a status looks like this ([DeleteNoteSerializer](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/delete_note_serializer.rb)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.social/users/alice/statuses/1234#delete",
  "type": "Delete",
  "actor": "https://example.social/users/alice",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "object": {
    "id": "https://example.social/users/alice/statuses/1234",
    "type": "Tombstone"
  }
}
```

The object is a `Tombstone` carrying only the id. Don't embed the old content: the point is to stop distributing it.

### Who to send it to

Send the `Delete` to **everyone who received the original, plus everyone who interacted with it**, since some of them never followed you. Mastodon's `StatusReachFinder` (used with `unsafe: true` for deletes) collects ([status_reach_finder.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/status_reach_finder.rb)):

- your followers' inboxes (shared inbox preferred)
- the account replied to, mentioned accounts, and the quoted account
- accounts that boosted, favourited, quoted or replied to the post
- enabled relays

## Serving a deleted object

When someone fetches the id of something you deleted, the spec says to answer **410 Gone with a `Tombstone` body, or 404 Not Found** if you don't keep one ([AP §6.4](https://www.w3.org/TR/activitypub/#delete-activity-outbox)).

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.social/notes/72",
  "type": "Tombstone",
  "formerType": "Note",
  "deleted": "2026-10-15T09:00:00Z"
}
```

What Mastodon does:

| Resource | Response |
|---|---|
| Deleted post | **404** — deleted statuses are excluded by the model's default scope, and the lookup fails ([statuses_controller.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/statuses_controller.rb)) |
| Deleted or permanently suspended account | **410 Gone** ([account_owned_concern.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/concerns/account_owned_concern.rb)) |
| Temporarily suspended account | **403 Forbidden** |

**Only the origin server can answer for an id.** A 404 or 410 from `evil.example` about `https://victim.example/notes/1` tells you nothing. Treat a 410 as deletion only when it comes from the object's own origin ([Origin-based security](/docs/security/origin-model)).

## Deleting an actor

To delete an account, send a `Delete` whose `object` is the actor's own id. Mastodon's `DeleteAccountService` does it in two waves ([delete_account_service.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/delete_account_service.rb)):

1. **Followers' inboxes and enabled relays**, on the normal `push` delivery queue (16 retries).
2. **Every other inbox the server knows**, on the low-priority `pull` queue (8 retries). This is a deliberately wide fan-out, so that servers which only cached the account through boosts or replies also hear about it.

Both use each account's shared inbox where one exists, and skip domains already marked unavailable (see [Delivery at scale](/docs/guides/delivery-at-scale#unavailable-domains)).

Two practical consequences:

- **Keep the private key until the fan-out finishes.** Receivers verify the `Delete` with the key they already have cached, because your actor URL now returns 410 and can't be fetched. Signing needs the key for as long as retries run (days, with Mastodon's schedule).
- **Receivers ignore self-deletes from strangers.** Mastodon's inbox answers `202` without processing when a `Delete` or `Update` has `actor == object` and the actor is unknown locally ([inboxes_controller.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/inboxes_controller.rb), `skip_unknown_actor_activity`). There is nothing to delete, and fetching the actor's (now gone) key would be wasted work. Do the same; the low-priority wave sends many of these.

When the account being removed lives on *another* server (for example, an admin deletes a remote account), Mastodon also sends `Reject` for the follows it had and `Undo` for local follows of it, so both sides stop believing the relationship exists.

## Receiving a Delete

Your inbox has already [verified the signature and that the signer is `activity.actor`](/docs/security/verifying-requests). For a `Delete`, also check:

1. **The object is on the actor's origin.** An actor may only delete its own objects. Mastodon skips the deletion when the object id's host doesn't match the actor's (`non_matching_uri_hosts?` in [Activity::Delete](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/delete.rb)), and the tested [`authorizeActivity`](/docs/security/origin-model) rejects it.
2. **The object is attributed to that actor**, when you have it. Mastodon looks the status up by URI *and* account.
3. **Don't fetch the object.** It's gone; the origin will answer 404 or 410. Act on the id.

Then remove your copy and everything hanging off it: boosts of it, notifications, timeline entries, and cached media.

```javascript
// `signer` is the actor returned by verifyRequest(); the inbox has
// already checked activity.actor === signer.id.
import { authorizeActivity } from './verify-requests/src/origin.js';

async function handleDelete(activity, signer) {
  authorizeActivity(activity); // throws unless the object is on the signer's origin
  const objectId = typeof activity.object === 'string' ? activity.object : activity.object.id;

  if (objectId === signer.id) {
    return deleteRemoteAccount(signer.id); // the actor deleted itself
  }

  await db.transaction(async (tx) => {
    // Remember the deletion even if we never saw the object (see below)
    await tx.tombstones.upsert({ id: objectId, actor: signer.id, deletedAt: new Date() });

    const post = await tx.posts.findOne({ id: objectId, attributedTo: signer.id });
    if (post) await removePostAndDependents(tx, post); // boosts, notifications, media
  });
}
```

## Delete before Create: zombie posts

Activities can arrive out of order. If a `Delete` arrives before the `Create` (or while your server is still fetching the object), a naive server finds nothing to delete, then stores the post when the `Create` lands — and the "deleted" post lives on.

Mastodon guards against this two ways ([activity/delete.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/delete.rb), [activity/create.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb), [activity.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb)):

- **A permanent `Tombstone` record.** On a valid `Delete` it stores `Tombstone(uri, account)` whether or not the status exists. `Create` rejects any object whose URI has a tombstone.
- **A short-lived "delete upon arrival" marker.** `Delete` sets the Redis key `delete_upon_arrival:<account>:<uri>` for 6 hours, and `Create` checks it. Both run under the same `create:<uri>` lock, so a `Create` that is mid-save either finishes before the `Delete` looks for the status or sees the marker and stops.

The equivalent in your own code is the `tombstones` table above, checked inside the same transaction or lock that creates the object:

```javascript
async function handleCreate(activity, signer) {
  // ... origin and attribution checks ...
  await withLock(`create:${activity.object.id}`, async () => {
    if (await db.tombstones.exists({ id: activity.object.id })) return; // already deleted
    await storePost(activity.object);
  });
}
```

Also check tombstones when you fetch objects for other reasons (reply threads, boosts, quotes). Otherwise a reply backfill can resurrect a post its author deleted.

## Media

Delete the media files you stored for a deleted post. Mastodon destroys a removed status's attachments permanently, unless the status is preserved (for example, because it was reported) — then it makes the files private instead of deleting them ([remove_status_service.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/remove_status_service.rb), `remove_media`). Receivers should drop cached copies of remote media for deleted posts, including thumbnails and link-preview images that came with them.

## Checklist

**Sending**

- [ ] `Delete` with a `Tombstone` object carrying only the id; `Undo` for Likes, boosts and Follows
- [ ] Delivered to followers *and* everyone who interacted with the object, plus relays
- [ ] Deleted objects answer 410 with a `Tombstone` (or 404)
- [ ] Account deletion: keep signing until the fan-out's retries are exhausted

**Receiving**

- [ ] Signature verified and signer is `activity.actor`
- [ ] Object id on the actor's origin; object attributed to the actor
- [ ] No fetch of the deleted object
- [ ] Tombstone stored even when the object is unknown; `Create` refuses tombstoned ids
- [ ] Dependent data and cached media removed
- [ ] Self-`Delete` from an unknown actor ignored with 202

## See also

- [Origin-based security](/docs/security/origin-model) — who may delete what
- [Verifying incoming requests](/docs/security/verifying-requests)
- [Delivery at scale](/docs/guides/delivery-at-scale) — retries and unavailable domains for the fan-out
- [Posts and replies](/docs/guides/posts-and-replies)
