---
sidebar_position: 12
title: Account Migration
description: Implementing account migration using the ActivityPub Move activity
---

# Account Migration

Account migration allows users to move their identity and followers from one server to another. ActivityPub uses the **Move** activity along with `movedTo` and `alsoKnownAs` properties to facilitate this. This guide covers implementing migration support.

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

When receiving a Move activity:

```javascript
async function processMove(activity, signer) {
  // Verify actor matches signer
  if (activity.actor !== signer.id) {
    throw new Error('Actor does not match signer');
  }

  // Verify object matches actor (moving themselves)
  if (activity.object !== activity.actor) {
    throw new Error('Can only move your own account');
  }

  const oldAccountId = activity.actor;
  const newAccountId = activity.target;

  // Fetch and verify the new account
  const newActor = await fetchActor(newAccountId);

  // Verify alsoKnownAs links back to old account
  if (!newActor.alsoKnownAs?.includes(oldAccountId)) {
    throw new Error('Migration not verified: alsoKnownAs missing');
  }

  // Verify the old account has movedTo set
  const oldActor = await fetchActor(oldAccountId);
  if (oldActor.movedTo !== newAccountId) {
    throw new Error('Migration not verified: movedTo mismatch');
  }

  // Process the migration for local followers
  await migrateFollowers(oldAccountId, newAccountId);
}

async function migrateFollowers(oldAccountId, newAccountId) {
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

    console.log(`Migrated ${localActor.id} from ${oldAccountId} to ${newAccountId}`);
  }
}
```

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
    // Check movedTo
    if (oldActor.movedTo !== newAccountId) {
      errors.push('Old account movedTo does not point to new account');
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
function renderActor(actor) {
  if (actor.movedTo) {
    return `
      <div class="actor moved">
        <div class="migration-notice">
          This account has moved to
          <a href="${actor.movedTo}">${actor.movedTo}</a>
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
- **Blocks may not migrate**: Block lists need manual recreation
- **If old server dies**: Migration may fail if old server is down
:::

## Alternative: Mitra-Style Migration

Mitra sends the Move from the new server, allowing migration even if the old server is down:

```javascript
// New server initiates the Move
async function initiateMoveFromNewServer(newActor, oldAccountId) {
  // Verify alsoKnownAs is set
  if (!newActor.alsoKnownAs?.includes(oldAccountId)) {
    throw new Error('Must set alsoKnownAs first');
  }

  // Try to verify with old server
  try {
    const oldActor = await fetchActor(oldAccountId);
    if (oldActor.movedTo !== newActor.id) {
      throw new Error('Old account does not have movedTo set');
    }
  } catch (error) {
    // Old server might be down - proceed with caution
    console.warn('Could not verify with old server:', error);
  }

  // Send Move activity
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${newActor.id}/move`,
    type: 'Move',
    actor: oldAccountId,
    object: oldAccountId,
    target: newActor.id
  };

  // Deliver to known followers (requires follower list export)
  // ...
}
```

## Data Export/Import

### Export User Data

```javascript
async function exportUserData(actor) {
  const [followers, following, posts, blocks] = await Promise.all([
    db.followers.find({ actor: actor.id }),
    db.following.find({ actor: actor.id }),
    db.notes.find({ attributedTo: actor.id }),
    db.blocks.find({ actor: actor.id })
  ]);

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
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

Handle the case where Move arrives before alsoKnownAs is set:

```javascript
async function processMove(activity, signer) {
  // Retry fetching new account a few times
  for (let i = 0; i < 3; i++) {
    const newActor = await fetchActor(activity.target, { force: true });

    if (newActor.alsoKnownAs?.includes(activity.actor)) {
      // Valid, proceed
      break;
    }

    if (i < 2) {
      await sleep(5000); // Wait 5 seconds
    } else {
      throw new Error('Migration validation failed after retries');
    }
  }
}
```

### Cooldown Period

Prevent abuse with migration cooldowns:

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
