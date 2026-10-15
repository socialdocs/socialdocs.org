---
sidebar_position: 12
title: Account Migration
description: Implementing account migration using the ActivityPub Move activity
---

# Account Migration

:::info Verified against
Mastodon 4.7.3 ([`move.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/move.rb), [`move_worker.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/move_worker.rb)) and [FEP-7628: Move actor](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md) (FINAL, 2026-08-26), checked 2026-10-15.
:::

Account migration allows users to move their identity and followers from one server to another. ActivityPub uses the **Move** activity along with `movedTo` and `alsoKnownAs` properties to facilitate this. The behaviour is standardised in [FEP-7628](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md), which became FINAL in August 2026. This guide covers implementing migration support.

## Migration Overview

```
┌────────────────────────────────────────────────────────┐
│                   MIGRATION FLOW                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1. User creates new account on new server             │
│     ↓                                                  │
│  2. New account sets alsoKnownAs → old account         │
│     ↓                                                  │
│  3. Old account sets movedTo → new account             │
│     ↓                                                  │
│  4. Old server sends Move activity to followers        │
│     ↓                                                  │
│  5. Followers' servers unfollow old, follow new        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Actor Properties

Both properties are in the ActivityStreams namespace and are IRIs. Mastodon declares them in its `@context` as:

```json
{
  "movedTo": { "@id": "as:movedTo", "@type": "@id" },
  "alsoKnownAs": { "@id": "as:alsoKnownAs", "@type": "@id" }
}
```

### movedTo

Indicates where the account has moved to:

```json
{
  "type": "Person",
  "id": "https://old.example/users/alice",
  "movedTo": "https://new.example/users/alice"
}
```

### alsoKnownAs

Lists aliases for the account (used to verify migration):

```json
{
  "type": "Person",
  "id": "https://new.example/users/alice",
  "alsoKnownAs": [
    "https://old.example/users/alice"
  ]
}
```

## The Move Activity

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://old.example/activities/move-123",
  "type": "Move",
  "actor": "https://old.example/users/alice",
  "object": "https://old.example/users/alice",
  "target": "https://new.example/users/alice"
}
```

| Property | Description |
|----------|-------------|
| `actor` | The old account initiating the move |
| `object` | The old account (same as actor) |
| `target` | The new account to migrate to |

## Implementing Migration

### Step 1: Setup New Account

On the new server, create the account with `alsoKnownAs`:

```javascript
async function createMigrationTarget(username, oldAccountId) {
  const actor = await createActor(username);

  // Add the old account as an alias
  await db.actors.update(
    { id: actor.id },
    {
      $set: {
        alsoKnownAs: [oldAccountId]
      }
    }
  );

  return actor;
}
```

### Step 2: Mark Old Account as Moved

On the old server:

```javascript
async function initiateMove(oldActor, newAccountId) {
  // Verify the new account accepts this migration
  const newActor = await fetchActor(newAccountId);

  if (!newActor.alsoKnownAs?.includes(oldActor.id)) {
    throw new Error('New account must list old account in alsoKnownAs');
  }

  // Mark the old account as moved
  await db.actors.update(
    { id: oldActor.id },
    {
      $set: {
        movedTo: newAccountId
      }
    }
  );

  // Send Move activity to all followers
  await sendMoveActivity(oldActor, newAccountId);

  return { success: true, newAccount: newAccountId };
}
```

### Step 3: Send Move Activity

```javascript
async function sendMoveActivity(oldActor, newAccountId) {
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Move',
    actor: oldActor.id,
    object: oldActor.id,
    target: newAccountId
  };

  // Get all followers
  const followers = await db.followers.find({ actor: oldActor.id });

  // Deliver to each follower
  for (const follower of followers) {
    try {
      const followerActor = await fetchActor(follower.follower);
      await deliverActivity(activity, followerActor.inbox, oldActor);
    } catch (error) {
      console.log(`Failed to notify ${follower.follower}:`, error);
    }
  }
}
```

## Processing Incoming Move

When receiving a Move activity (this is what Mastodon's [`move.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/move.rb) does):

1. The signer must be the `object` (the old account) — the old account moves itself.
2. Re-fetch the `target` **bypassing your cache** and check that its `alsoKnownAs` includes the old account. Also reject a target that is itself moved or suspended.
3. Take a per-account lock so duplicate Moves don't trigger repeated unfollow/follow storms (Mastodon locks for **7 days**).
4. Record `movedTo` on the old account yourself, then migrate followers in a **background job**.

You don't need to require `movedTo` on the old actor: Mastodon doesn't check it, and FEP-7628 doesn't treat it as part of linking the two accounts.

```javascript
const idOf = (v) => (typeof v === 'string' ? v : v?.id);

async function processMove(activity, signer) {
  const oldAccountId = idOf(activity.object);
  const newAccountId = idOf(activity.target);

  // 1. The old account must be the one moving itself
  if (activity.actor !== signer.id || oldAccountId !== activity.actor) {
    throw new Error('Move must be signed by the account being moved');
  }

  // 2. Fresh fetch (SSRF-safe, no cache) of the target, and check the link
  const newActor = await fetchActor(newAccountId, { force: true });
  if (!newActor?.alsoKnownAs?.includes(oldAccountId)) {
    throw new Error('Migration not verified: alsoKnownAs missing');
  }
  if (newActor.movedTo || await isSuspended(newActor.id)) {
    throw new Error('Target account is unavailable');
  }

  // 3. Idempotency: one Move per old account per 7 days
  const locked = await redis.set(`move_in_progress:${oldAccountId}`, '1',
    { NX: true, EX: 7 * 24 * 60 * 60 });
  if (!locked) return;

  // 4. Remember the redirect, then migrate off the request path
  await db.actors.update({ id: oldAccountId }, { $set: { movedTo: newAccountId } });
  await jobs.enqueue('migrateFollowers', { oldAccountId, newAccountId });
}

// Runs in a background worker
async function migrateFollowers({ oldAccountId, newAccountId }) {
  // Find local users following the old account
  const localFollowers = await db.following.find({
    following: oldAccountId
  });

  for (const record of localFollowers) {
    const localActor = await db.actors.findOne({ id: record.actor });
    if (!localActor) continue;

    // Unfollow old account
    await sendUnfollow(localActor, { id: oldAccountId });

    // Follow new account
    await sendFollow(localActor, { id: newAccountId });
  }
}
```

Mastodon's `MoveWorker` also carries over your **local users' blocks and mutes** of the old account to the new one, and adds an account note explaining why.

## Migration Validation

### Verify Before Processing

```javascript
async function validateMigration(oldAccountId, newAccountId) {
  const errors = [];

  // Fetch both accounts
  const [oldActor, newActor] = await Promise.all([
    fetchActor(oldAccountId).catch(() => null),
    fetchActor(newAccountId).catch(() => null)
  ]);

  if (!oldActor) {
    errors.push('Old account not found');
  }
  if (!newActor) {
    errors.push('New account not found');
  }

  if (oldActor && newActor) {
    // movedTo on the old account is expected after a push-mode move,
    // but receivers shouldn't require it (Mastodon and FEP-7628 don't)
    if (oldActor.movedTo && oldActor.movedTo !== newAccountId) {
      errors.push('Old account movedTo points somewhere else');
    }

    // Check alsoKnownAs
    if (!newActor.alsoKnownAs?.includes(oldAccountId)) {
      errors.push('New account alsoKnownAs does not include old account');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Displaying Moved Accounts

### Show Migration Notice

```javascript
function safeHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

function renderActor(actor) {
  if (actor.movedTo) {
    return `
      <div class="actor moved">
        <div class="migration-notice">
          This account has moved to
          <a href="${escapeHtml(safeHttpUrl(actor.movedTo))}">${escapeHtml(actor.movedTo)}</a>
        </div>
        <p>You can no longer follow this account.</p>
      </div>
    `;
  }

  return `
    <div class="actor">
      <!-- Normal actor display -->
    </div>
  `;
}
```

### Prevent Following Moved Accounts

```javascript
async function sendFollow(follower, followee) {
  // Check if target has moved
  const targetActor = await fetchActor(followee.id);

  if (targetActor.movedTo) {
    throw new Error(
      `This account has moved to ${targetActor.movedTo}. ` +
      `Please follow the new account instead.`
    );
  }

  // Normal follow process...
}
```

## Limitations

:::warning What Doesn't Migrate
Account migration has significant limitations:

- **Posts don't migrate**: Your old posts stay on the old server
- **Media doesn't migrate**: Images, videos remain on old server
- **Likes/boosts don't migrate**: Engagement history is lost
- **Your own blocks and mutes don't migrate automatically**: export and re-import them (Mastodon offers CSV export/import). Other users' blocks and mutes *of you* are carried over by Mastodon
- **If old server dies**: Migration may fail if old server is down
:::

## Pull Mode: Moving from the New Server (FEP-7628)

[FEP-7628](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md) defines two kinds of `Move`:

1. **Push mode** (everything above): the **old** actor sends the Move to its followers. The old server must be online.
2. **Pull mode**: the **new** actor sends the Move, so migration works even when the old server is gone. The user needs a saved copy of their follower list, and the Move is addressed to the **new** actor's followers.

In pull mode, `actor` is the **new** account — a server can only sign as its own actors. It can never send a Move with `actor` set to the old account:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://new.example/activities/9b496346",
  "type": "Move",
  "actor": "https://new.example/users/alice",
  "object": "https://old.example/users/alice",
  "target": "https://new.example/users/alice",
  "to": "https://www.w3.org/ns/activitystreams#Public",
  "cc": "https://new.example/users/alice/followers"
}
```

A Move is valid if the `object` and `target` actors are **linked**. FEP-7628 accepts `alsoKnownAs`, [FEP-c390](https://codeberg.org/fediverse/fep/src/branch/main/fep/c390/fep-c390.md) identity proofs with the same `subject`, or verified rel-me links. If the old actor still works after the move, it uses `copiedTo` instead of `movedTo`.

:::note Receiver support
Mastodon 4.7 processes **push mode only**: it ignores a Move unless the signer is the `object`. Pull mode is implemented by [Mitra](https://codeberg.org/silverpill/mitra/src/branch/main/FEDERATION.md) and other FEP-7628 adopters, so don't rely on it reaching Mastodon users.
:::

## Data Export/Import

### Export User Data

There is no standard ActivityPub export format. The shape below is just an example; real options include Mastodon's CSV/archive export and [FEP-1580](https://codeberg.org/fediverse/fep/src/branch/main/fep/1580/fep-1580.md) (moving objects with a migration collection, draft).

```javascript
// Illustrative, non-standard export shape
async function exportUserData(actor) {
  const [followers, following, posts, blocks] = await Promise.all([
    db.followers.find({ actor: actor.id }),
    db.following.find({ actor: actor.id }),
    db.notes.find({ attributedTo: actor.id }),
    db.blocks.find({ actor: actor.id })
  ]);

  return {
    actor: actor,
    followers: followers.map(f => f.follower),
    following: following.map(f => f.following),
    outbox: posts,
    blocks: blocks.map(b => b.target),
    exportedAt: new Date().toISOString()
  };
}
```

### Import Following List

```javascript
async function importFollowing(actor, followingList) {
  for (const targetId of followingList) {
    try {
      await sendFollow(actor, { id: targetId });
    } catch (error) {
      console.log(`Could not follow ${targetId}:`, error);
    }
  }
}
```

## Common Issues

### Race Conditions

A Move can arrive before the new account's `alsoKnownAs` change has propagated (for example, from a cached copy). Don't sleep and retry inside the inbox request. Keep all of `processMove`'s checks, and if only the `alsoKnownAs` check fails, schedule a background retry with a fresh fetch:

```javascript
async function processMoveWithRetry(activity, signer, attempt = 0) {
  try {
    await processMove(activity, signer); // all signer/object checks included
  } catch (error) {
    if (error.message.includes('alsoKnownAs') && attempt < 3) {
      await jobs.enqueue('processMove', { activity, signer, attempt: attempt + 1 },
        { delaySeconds: 60 * (attempt + 1) });
      return;
    }
    throw error;
  }
}
```

### Cooldown Period

Prevent abuse with migration cooldowns. Mastodon uses 30 days between outgoing migrations ([`account_migration.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/account_migration.rb)):

```javascript
async function canMigrate(actor) {
  const lastMigration = actor.lastMigratedAt;

  if (lastMigration) {
    const cooldown = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (Date.now() - lastMigration < cooldown) {
      return {
        allowed: false,
        reason: 'Must wait 30 days between migrations'
      };
    }
  }

  return { allowed: true };
}
```

## Next Steps

- **[Content Moderation](/docs/guides/content-moderation)** - Handling abuse
- **[Scaling and Performance](/docs/guides/scaling-and-performance)** - Infrastructure
- **[Authentication and Security](/docs/getting-started/authentication-and-security)** - Security model
- **[Move sequence diagram](https://github.com/boyter/activitypub/blob/main/move-post.md)** - External reference for the migration exchange
