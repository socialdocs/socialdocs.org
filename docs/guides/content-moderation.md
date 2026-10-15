---
sidebar_position: 13
title: Content Moderation
description: Implementing moderation tools using ActivityPub Block, Flag, and domain controls
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (activity/block.rb, block_service.rb, activity/flag.rb, flag_serializer.rb, domain_block.rb, export_domain_blocks_controller.rb, custom_filter.rb), ActivityPub REC §6.9, IFTAS DNI list page, FediMod FIRES site"
---

# Content Moderation

Content moderation is essential for healthy federated communities. ActivityPub provides **Block** and **Flag** activities, while implementations add domain-level controls. This guide covers implementing moderation tools.

## Moderation Levels

```
┌────────────────────────────────────────────────────────┐
│               MODERATION HIERARCHY                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  User Level:                                           │
│  - Block individual users                              │
│  - Mute users (hide without blocking)                  │
│  - Filter content by keyword                           │
│                                                        │
│  Server Level:                                         │
│  - Suspend/silence local users                         │
│  - Domain blocks (defederation)                        │
│  - Domain silencing (hide from public)                 │
│                                                        │
│  Reports:                                              │
│  - Flag activity for remote reports                    │
│  - Local report system for admins                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Block Activity

### User Blocking User

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/activities/block-123",
  "type": "Block",
  "actor": "https://example.com/users/alice",
  "object": "https://other.example/users/bob"
}
```

### Sending a Block

```javascript
async function blockUser(blocker, blockedId) {
  // Store the block locally
  await db.blocks.insert({
    actor: blocker.id,
    target: blockedId,
    createdAt: new Date()
  });

  // End follow relationships in both directions first, as Mastodon does
  // (it sends Undo Follow / Reject Follow, and rejects pending requests)
  // — see block_service.rb
  await unfollow(blocker, blockedId);          // sends Undo(Follow) if following
  await removeFollower(blocker, blockedId);    // sends Reject(Follow) if followed
  await rejectPendingFollowRequest(blocker, blockedId);

  // Create Block activity
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Block',
    actor: blocker.id,
    object: blockedId
  };

  // The spec says servers SHOULD NOT deliver Block to its object
  // (ActivityPub §6.9), but Mastodon does deliver it to remote accounts,
  // and Mastodon receivers use it to cut follows and record the block
  try {
    const blockedActor = await fetchActor(blockedId);
    await deliverActivity(activity, blockedActor.inbox, blocker);
  } catch (error) {
    // Delivery failure is acceptable for blocks
  }
}
```

### Receiving a Block

```javascript
async function processBlock(activity, signer) {
  if (activity.actor !== signer.id) {
    throw new Error('Actor mismatch');
  }

  const blockerId = activity.actor;
  const blockedId = typeof activity.object === 'string' ? activity.object : activity.object?.id;

  // Only blocks of our own users matter
  const localUser = await db.actors.findOne({ id: blockedId, local: true });
  if (!localUser) return;

  // Like Mastodon (activity/block.rb): drop follows both ways and any
  // pending follow request
  await db.followers.remove({ actor: blockedId, follower: blockerId });
  await db.followers.remove({ actor: blockerId, follower: blockedId });
  await db.followRequests.remove({ from: blockedId, to: blockerId });

  // Record the block for reference
  await db.incomingBlocks.insert({
    from: blockerId,
    to: blockedId,
    createdAt: new Date()
  });

  // Hide blocker's profile from local user
  // Implementation specific...
}
```

### Enforcing Blocks

```javascript
async function canInteract(actorA, actorB) {
  // Check if either has blocked the other
  const block = await db.blocks.findOne({
    $or: [
      { actor: actorA, target: actorB },
      { actor: actorB, target: actorA }
    ]
  });

  return !block;
}

// Apply to inbox delivery
async function processInboxActivity(activity, signer) {
  const targetActors = extractTargetActors(activity);

  for (const targetId of targetActors) {
    if (!await canInteract(signer.id, targetId)) {
      // Silently ignore activities from blocked users
      return;
    }
  }

  // Process normally...
}
```

## Flag Activity (Reports)

### Report Format

Mastodon sends a `Flag` from its **instance actor** (so the reporter isn't revealed), with the reported account and any reported posts in `object` and the comment in `content` ([`flag_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/flag_serializer.rb)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/reports/456",
  "type": "Flag",
  "actor": "https://example.com/actor",
  "object": [
    "https://other.example/users/badactor",
    "https://other.example/notes/offensive-post"
  ],
  "content": "This user is posting spam"
}
```

### Sending a Report

```javascript
async function submitReport(reporter, reportedUserId, postIds, reason) {
  // Store report locally
  const report = await db.reports.insert({
    reporter: reporter.id,
    reportedUser: reportedUserId,
    reportedPosts: postIds,
    reason,
    status: 'pending',
    createdAt: new Date()
  });

  // If remote user, send Flag to their server
  // (compare origins: startsWith() would also match example.com.evil)
  if (new URL(reportedUserId).origin !== `https://${config.domain}`) {
    const activity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `https://${config.domain}/reports/${report._id}`,
      type: 'Flag',
      actor: `https://${config.domain}/actor`, // Instance actor
      object: [reportedUserId, ...postIds],
      content: reason
    };

    const reportedActor = await fetchActor(reportedUserId);
    await deliverActivity(activity, reportedActor.inbox, getInstanceActor());
  }

  return report;
}
```

### Receiving a Report

Don't rely on the order of `object`: Mastodon looks up **each** entry and groups reported posts under their author ([`flag.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/flag.rb)). It files a report for each reported local account, skips servers whose domain block has "reject reports" set, and truncates the comment to 5,000 characters:

```javascript
async function processFlag(activity, signer) {
  const fromDomain = new URL(signer.id).hostname;
  if (await domainRule(fromDomain)?.rejectReports) return;

  const uris = [].concat(activity.object || [])
    .map(o => (typeof o === 'string' ? o : o?.id))
    .filter(Boolean);

  const accounts = await db.actors.find({ id: { $in: uris }, local: true });
  const posts = await db.notes.find({ id: { $in: uris } });

  for (const account of accounts) {
    await db.adminReports.insert({
      fromServer: fromDomain,
      reportedUser: account.id,
      reportedPosts: posts.filter(p => p.attributedTo === account.id).map(p => p.id),
      reason: String(activity.content || '').slice(0, 5000),
      activityId: activity.id,
      status: 'pending',
      createdAt: new Date()
    });
    await notifyAdmins('new_report', { user: account.id });
  }
}
```

Mastodon additionally accepts a report about a *remote* account when the reported posts replied to one of its local users.

## Domain-Level Moderation

### Domain Block (Defederation)

Mastodon's domain blocks have a severity of `suspend`, `silence` (shown as "Limit" in its UI) or `noop`, plus independent `reject_media` and `reject_reports` flags, and a block on `example.com` also covers `*.example.com` ([`domain_block.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/domain_block.rb)). Store each actor's and note's host when you ingest it, and match hosts exactly — never build a regular expression from a domain name (the dots in `example.com` match any character):

```javascript
async function blockDomain(domain, options = {}) {
  await db.domainBlocks.insert({
    domain: domain.toLowerCase(),
    severity: options.severity || 'suspend', // suspend | silence | noop
    rejectMedia: !!options.rejectMedia,
    rejectReports: !!options.rejectReports,
    reason: options.reason,
    createdAt: new Date()
  });

  if ((options.severity || 'suspend') === 'suspend') {
    const hosts = { $in: await hostsUnder(domain) }; // domain + known subdomains
    await db.cachedActors.remove({ host: hosts });
    await db.cachedNotes.remove({ host: hosts });
    await db.followers.remove({ followerHost: hosts });
  }
}

// The most specific rule for a host or any parent domain, like Mastodon's rule_for
async function domainRule(host) {
  const parts = host.toLowerCase().split('.');
  const variants = parts.map((_, i) => parts.slice(i).join('.'));
  const rules = await db.domainBlocks.find({ domain: { $in: variants } });
  return rules.sort((a, b) => b.domain.length - a.domain.length)[0] || null;
}

async function shouldFederateWith(host) {
  const rule = await domainRule(host);
  if (rule?.severity === 'suspend') return { allowed: false, reason: 'Domain suspended' };
  return { allowed: true, silenced: rule?.severity === 'silence', rejectMedia: !!rule?.rejectMedia };
}
```

### Domain Silence

Silenced domains can still federate, but their content is hidden from public:

```javascript
async function getPublicTimeline(options = {}) {
  // Notes store a `silenced` flag set at ingest from domainRule(host)
  return db.notes.find({
    to: 'https://www.w3.org/ns/activitystreams#Public',
    silenced: { $ne: true }
  }).sort({ published: -1 }).limit(20);
}
```

## User Suspension

```javascript
async function suspendUser(userId, reason) {
  await db.actors.update(
    { id: userId },
    {
      $set: {
        suspended: true,
        suspendedAt: new Date(),
        suspensionReason: reason
      }
    }
  );

  // Reject all inbox activities from this user and hide their content.
  // Mastodon tells other servers by sending an Update of the actor with
  // `suspended: true` (toot:suspended) — suspend_account_service.rb —
  // rather than deleting anything, so the suspension can be reversed.
}

async function processInboxActivity(activity, signer) {
  // Check if actor is suspended
  const actor = await db.actors.findOne({ id: signer.id });
  if (actor?.suspended) {
    return; // Ignore activities from suspended users
  }

  // Normal processing...
}
```

## Content Filtering

### Keyword Filters

Mastodon's filter actions are `warn`, `hide` and `blur` ([`custom_filter.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/custom_filter.rb)). Match keywords against the post's **text** (HTML stripped), and treat them as literal strings — compiling user input with `new RegExp()` invites broken patterns and catastrophic backtracking:

```javascript
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function applyFilters(userId, text) {
  const filters = await db.filters.find({ userId });

  for (const filter of filters) {
    const pattern = escapeRegExp(filter.keyword);
    const regex = filter.wholeWord
      ? new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, 'iu')
      : new RegExp(pattern, 'iu');

    if (regex.test(text)) {
      return { filtered: true, action: filter.action, filter: filter.keyword }; // warn | hide | blur
    }
  }

  return { filtered: false };
}

async function displayNote(note, viewerId) {
  const filterResult = await applyFilters(viewerId, htmlToText(note.content));

  if (filterResult.filtered) {
    if (filterResult.action === 'hide') {
      return null; // Don't show at all
    }
    if (filterResult.action === 'warn') {
      return {
        ...note,
        filtered: true,
        filterWarning: `Contains filtered word: ${filterResult.filter}`
      };
    }
  }

  return note;
}
```

## Admin Tools

### Moderation Queue

```javascript
app.get('/admin/reports', requireAdmin, async (req, res) => {
  const reports = await db.adminReports.find({
    status: 'pending'
  }).sort({ createdAt: -1 });

  res.render('admin/reports', { reports });
});

app.post('/admin/reports/:id/resolve', requireAdmin, async (req, res) => {
  const { action, note } = req.body;
  const report = await db.adminReports.findOne({ _id: req.params.id });

  // Take action based on admin decision
  switch (action) {
    case 'suspend_user':
      await suspendUser(report.reportedUser, note);
      break;
    case 'delete_posts':
      for (const postId of report.reportedPosts) {
        await deletePostAsAdmin(postId);
      }
      break;
    case 'warn_user':
      await warnUser(report.reportedUser, note);
      break;
    case 'dismiss':
      // No action needed
      break;
  }

  await db.adminReports.update(
    { _id: req.params.id },
    {
      $set: {
        status: 'resolved',
        resolution: action,
        adminNote: note,
        resolvedAt: new Date(),
        resolvedBy: req.admin.id
      }
    }
  );

  res.redirect('/admin/reports');
});
```

### Audit Log

```javascript
async function logModerationAction(admin, action, target, details) {
  await db.moderationLog.insert({
    admin: admin.id,
    action, // suspend, unsuspend, delete_post, domain_block, etc.
    target, // user ID or domain
    details,
    createdAt: new Date()
  });
}

// Use in all moderation functions
async function suspendUser(userId, reason, admin) {
  await db.actors.update(/* ... */);
  await logModerationAction(admin, 'suspend', userId, { reason });
}
```

## Federation Considerations

### Shared Blocklists

The common interchange format is Mastodon's domain-block CSV, with the header `#domain,#severity,#reject_media,#reject_reports,#public_comment,#obfuscate` ([`export_domain_blocks_controller.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/admin/export_domain_blocks_controller.rb)). The [IFTAS DNI ("Do Not Interact") list](https://about.iftas.org/library/iftas-dni-list/) is published in that format and via [FediMod FIRES](https://fires.fedimod.org/), a protocol for publishing moderation advisories that consumers choose whether to apply.

Import lists as **suggestions** for a moderator to review, not as rules applied automatically:

```javascript
import { parse } from 'csv-parse/sync';

async function importBlocklistCsv(csvText, source) {
  const rows = parse(csvText, { columns: true, skip_empty_lines: true });

  for (const row of rows) {
    const domain = (row['#domain'] || '').trim().toLowerCase();
    if (!domain) continue;

    await db.blocklistSuggestions.upsert({ domain, source }, {
      $set: {
        severity: row['#severity'] || 'suspend',
        rejectMedia: row['#reject_media'] === 'true',
        rejectReports: row['#reject_reports'] === 'true',
        comment: row['#public_comment'] || '',
        importedAt: new Date()
      }
    });
  }
}
```

### Authorized Fetch

Require a valid signature on GETs (Mastodon's "secure mode"), so suspended servers and actors can't fetch content:

```javascript
import { verifyRequest, SignatureError } from './verify-requests/src/index.js';
// keyStore: see /docs/security/verifying-requests

async function authorizedFetch(req, res, next) {
  // Authorized fetch means: no valid signature, no content.
  if (!req.headers.signature && !req.headers['signature-input']) {
    return res.status(401).json({ error: 'Signature required' });
  }

  let signer;
  try {
    signer = await verifyRequest({
      method: req.method,
      url: `https://${DOMAIN}${req.originalUrl}`,
      headers: req.headers,
      rawBody: Buffer.alloc(0),
    }, { keyStore });
  } catch (err) {
    return res.status(err instanceof SignatureError ? 401 : 503).json({ error: err.message });
  }

  // Check if the signer's domain is suspended
  const domain = new URL(signer.actorId).hostname;
  const domainBlock = await db.domainBlocks.findOne({ domain, severity: 'suspend' });
  if (domainBlock) {
    return res.status(403).json({ error: 'Domain blocked' });
  }

  // Check if the signing actor is suspended
  const actor = await db.actors.findOne({ id: signer.actorId });
  if (actor?.suspended) {
    return res.status(403).json({ error: 'Actor suspended' });
  }

  req.signer = signer;
  next();
}
```

Sign the GETs you make to such servers with your [instance actor](/docs/specs/activitypub/actors) key, or they will answer 401. Your own instance actor and its key must stay fetchable **without** a signature, or two servers in secure mode can deadlock fetching each other's keys.

## Best Practices

1. **Respond to reports promptly** - Set up notifications for admins
2. **Document decisions** - Keep audit logs
3. **Be transparent** - Publish moderation policies
4. **Allow appeals** - Provide a way to contest decisions
5. **Coordinate with other servers** - Share information about bad actors
6. **Protect reporter privacy** - Don't expose who reported

## Next Steps

- **[Scaling and Performance](/docs/guides/scaling-and-performance)** - Infrastructure
- **[Account Migration](/docs/guides/account-migration)** - Moving accounts
- **[Authentication and Security](/docs/getting-started/authentication-and-security)** - Security model
