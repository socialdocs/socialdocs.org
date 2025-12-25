---
sidebar_position: 13
title: Content Moderation
description: Implementing moderation tools using ActivityPub Block, Flag, and domain controls
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

  // Remove any existing follow relationship
  await db.followers.remove({
    actor: blocker.id,
    follower: blockedId
  });
  await db.following.remove({
    actor: blocker.id,
    following: blockedId
  });

  // Create Block activity
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Block',
    actor: blocker.id,
    object: blockedId
  };

  // Optionally notify the blocked user's server
  // Note: The spec says servers SHOULD NOT deliver Block
  // but Mastodon does to hide the blocker's profile
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
  const blockedId = activity.object;

  // Find local user being blocked
  const localUser = await db.actors.findOne({ id: blockedId });
  if (!localUser) return;

  // Remove the blocker from local user's followers
  await db.followers.remove({
    actor: blockedId,
    follower: blockerId
  });

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
  if (!reportedUserId.startsWith(`https://${config.domain}`)) {
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

```javascript
async function processFlag(activity, signer) {
  // Extract reported user and posts
  const objects = Array.isArray(activity.object)
    ? activity.object
    : [activity.object];

  // First object should be the user
  const reportedUserId = objects[0];
  const reportedPostIds = objects.slice(1);

  // Verify this is about a local user
  const localUser = await db.actors.findOne({ id: reportedUserId });
  if (!localUser) {
    return; // Not our user
  }

  // Store the report for admin review
  await db.adminReports.insert({
    fromServer: new URL(signer.id).hostname,
    reportedUser: reportedUserId,
    reportedPosts: reportedPostIds,
    reason: activity.content || '',
    activityId: activity.id,
    status: 'pending',
    createdAt: new Date()
  });

  // Notify admins
  await notifyAdmins('new_report', {
    user: reportedUserId,
    reason: activity.content
  });
}
```

## Domain-Level Moderation

### Domain Block (Defederation)

```javascript
async function blockDomain(domain, options = {}) {
  await db.domainBlocks.insert({
    domain,
    severity: options.severity || 'suspend', // suspend, silence
    reason: options.reason,
    createdAt: new Date()
  });

  // Clean up existing data from this domain
  if (options.severity === 'suspend') {
    // Remove all cached actors
    await db.cachedActors.remove({
      id: { $regex: new RegExp(`^https://${domain}/`) }
    });

    // Remove all cached posts
    await db.cachedNotes.remove({
      id: { $regex: new RegExp(`^https://${domain}/`) }
    });

    // Remove follows from that domain
    await db.followers.remove({
      follower: { $regex: new RegExp(`^https://${domain}/`) }
    });
  }
}

// Check before federation
async function shouldFederateWith(domain) {
  const block = await db.domainBlocks.findOne({ domain });

  if (!block) return { allowed: true };

  if (block.severity === 'suspend') {
    return { allowed: false, reason: 'Domain suspended' };
  }

  if (block.severity === 'silence') {
    return { allowed: true, silenced: true };
  }

  return { allowed: true };
}
```

### Domain Silence

Silenced domains can still federate, but their content is hidden from public:

```javascript
async function getPublicTimeline(options = {}) {
  // Get silenced domains
  const silencedDomains = await db.domainBlocks.find({
    severity: 'silence'
  });
  const silencedHosts = silencedDomains.map(d => d.domain);

  return db.notes.find({
    'to': 'https://www.w3.org/ns/activitystreams#Public',
    // Exclude silenced domains from public timeline
    attributedTo: {
      $not: {
        $regex: new RegExp(`^https://(${silencedHosts.join('|')})/`)
      }
    }
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

  // Reject all inbox activities from this user
  // Hide their content from public
  // Optionally send Delete activities for their content
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

```javascript
async function applyFilters(userId, content) {
  const filters = await db.filters.find({ userId });

  for (const filter of filters) {
    const regex = new RegExp(filter.keyword, 'i');

    if (regex.test(content)) {
      return {
        filtered: true,
        action: filter.action, // warn, hide, drop
        filter: filter.keyword
      };
    }
  }

  return { filtered: false };
}

async function displayNote(note, viewerId) {
  const filterResult = await applyFilters(viewerId, note.content);

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

Some servers share blocklists:

```javascript
async function importBlocklist(url) {
  const response = await fetch(url);
  const blocklist = await response.json();

  for (const entry of blocklist.domains) {
    const existing = await db.domainBlocks.findOne({
      domain: entry.domain
    });

    if (!existing) {
      await db.domainBlocks.insert({
        domain: entry.domain,
        severity: entry.severity,
        reason: entry.reason,
        source: url,
        createdAt: new Date()
      });
    }
  }
}
```

### Authorized Fetch

Prevent suspended users from fetching content:

```javascript
async function authorizedFetch(req, res, next) {
  const signature = parseSignature(req);

  if (signature) {
    const signer = await fetchActor(signature.keyId.split('#')[0]);

    // Check if signer's domain is blocked
    const domain = new URL(signer.id).hostname;
    const domainBlock = await db.domainBlocks.findOne({
      domain,
      severity: 'suspend'
    });

    if (domainBlock) {
      return res.status(403).json({ error: 'Domain blocked' });
    }

    // Check if actor is suspended
    const actor = await db.actors.findOne({ id: signer.id });
    if (actor?.suspended) {
      return res.status(403).json({ error: 'Actor suspended' });
    }
  }

  next();
}
```

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
