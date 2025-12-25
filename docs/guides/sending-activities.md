---
sidebar_position: 3
title: Sending Activities
description: Delivering activities to other ActivityPub servers
---

# Sending Activities

This guide covers how to create and deliver activities to other servers. You'll learn about activity construction, addressing, signing, and reliable delivery.

## Creating Activities

### Basic Activity Structure

```javascript
function createActivity(type, actor, object, recipients) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type,
    id: `https://${DOMAIN}/activities/${uuid()}`,
    actor,
    object,
    published: new Date().toISOString(),
    to: recipients.to || [],
    cc: recipients.cc || []
  };
}
```

### Creating a Post

```javascript
async function createPost(username, content, options = {}) {
  const actor = `https://${DOMAIN}/users/${username}`;

  // Create the Note object
  const note = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Note',
    id: `https://${DOMAIN}/notes/${uuid()}`,
    attributedTo: actor,
    content: sanitizeHtml(content),
    published: new Date().toISOString(),
    to: options.to || ['https://www.w3.org/ns/activitystreams#Public'],
    cc: options.cc || [`${actor}/followers`],
    sensitive: options.sensitive || false,
    summary: options.contentWarning || null,
    inReplyTo: options.inReplyTo || null,
    tag: extractTags(content),
    attachment: options.attachments || []
  };

  // Wrap in Create activity
  const activity = createActivity('Create', actor, note, {
    to: note.to,
    cc: note.cc
  });

  // Store locally
  await db.objects.insert(note);
  await db.activities.insert(activity);

  // Deliver to recipients
  await deliverActivity(activity, username);

  return { activity, object: note };
}
```

## Addressing

### Public Post

```javascript
const publicRecipients = {
  to: ['https://www.w3.org/ns/activitystreams#Public'],
  cc: [`https://${DOMAIN}/users/${username}/followers`]
};
```

### Followers Only

```javascript
const followersRecipients = {
  to: [`https://${DOMAIN}/users/${username}/followers`],
  cc: []
};
```

### Direct Message

```javascript
const directRecipients = {
  to: ['https://remote.example/users/bob'],
  cc: []
};
```

### With Mentions

```javascript
function getRecipientsWithMentions(content, baseRecipients) {
  const mentions = extractMentions(content);
  const mentionedActors = mentions.map(m => m.href);

  return {
    to: [...baseRecipients.to, ...mentionedActors],
    cc: baseRecipients.cc
  };
}
```

## Delivery Pipeline

```javascript
async function deliverActivity(activity, username) {
  // Get all recipients
  const recipients = [...(activity.to || []), ...(activity.cc || [])];

  // Resolve to inboxes
  const inboxes = await resolveInboxes(recipients, username);

  // Deduplicate
  const uniqueInboxes = [...new Set(inboxes)];

  // Remove private addressing before sending
  const deliverableActivity = { ...activity };
  delete deliverableActivity.bto;
  delete deliverableActivity.bcc;

  // Queue for delivery
  for (const inbox of uniqueInboxes) {
    await queueDelivery(inbox, deliverableActivity, username);
  }
}
```

## Resolving Inboxes

```javascript
async function resolveInboxes(recipients, username) {
  const inboxes = [];

  for (const recipient of recipients) {
    // Skip public address
    if (recipient === 'https://www.w3.org/ns/activitystreams#Public') {
      continue;
    }

    // Check if it's our followers collection
    if (recipient === `https://${DOMAIN}/users/${username}/followers`) {
      const followers = await db.followers.find({
        actor: `https://${DOMAIN}/users/${username}`
      });

      for (const follow of followers) {
        const actor = await fetchActorCached(follow.follower);
        if (actor) {
          inboxes.push(getInbox(actor));
        }
      }
      continue;
    }

    // It's an individual actor
    const actor = await fetchActorCached(recipient);
    if (actor) {
      inboxes.push(getInbox(actor));
    }
  }

  return inboxes;
}

function getInbox(actor) {
  // Prefer shared inbox for efficiency
  return actor.endpoints?.sharedInbox || actor.inbox;
}
```

## Signing and Sending

```javascript
async function sendSignedRequest(inbox, activity, username) {
  const body = JSON.stringify(activity);
  const user = await db.users.findOne({ username });

  const url = new URL(inbox);
  const date = new Date().toUTCString();

  // Create digest
  const digest = `SHA-256=${crypto
    .createHash('sha256')
    .update(body)
    .digest('base64')}`;

  // Create signing string
  const signedHeaders = '(request-target) host date digest';
  const signingString = [
    `(request-target): post ${url.pathname}`,
    `host: ${url.host}`,
    `date: ${date}`,
    `digest: ${digest}`
  ].join('\n');

  // Sign
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingString);
  const signature = signer.sign(user.privateKey, 'base64');

  const signatureHeader = [
    `keyId="https://${DOMAIN}/users/${username}#main-key"`,
    'algorithm="rsa-sha256"',
    `headers="${signedHeaders}"`,
    `signature="${signature}"`
  ].join(',');

  // Send
  const response = await fetch(inbox, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/activity+json',
      'Date': date,
      'Digest': digest,
      'Signature': signatureHeader,
      'Host': url.host,
      'User-Agent': 'MyActivityPubServer/1.0'
    },
    body,
    timeout: 10000 // 10 second timeout
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`Delivery failed: ${response.status}`);
  }

  return response;
}
```

## Reliable Delivery

### Job Queue

```javascript
const Queue = require('bull');
const deliveryQueue = new Queue('activity-delivery');

async function queueDelivery(inbox, activity, username) {
  await deliveryQueue.add({
    inbox,
    activity,
    username,
    attempt: 0
  }, {
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 60000 // Start with 1 minute
    }
  });
}

deliveryQueue.process(async (job) => {
  const { inbox, activity, username } = job.data;

  // Check if server is dead
  if (await isServerDead(inbox)) {
    throw new Error('Server is dead');
  }

  await sendSignedRequest(inbox, activity, username);
});

deliveryQueue.on('failed', async (job, error) => {
  console.error(`Delivery to ${job.data.inbox} failed:`, error.message);

  if (job.attemptsMade >= 10) {
    await markServerDead(job.data.inbox);
  }
});
```

### Dead Server Tracking

```javascript
async function isServerDead(inbox) {
  const domain = new URL(inbox).hostname;
  const dead = await db.deadServers.findOne({ domain });

  if (!dead) return false;

  // Check if enough time has passed to retry
  const hoursSinceDead = (Date.now() - dead.since) / (1000 * 60 * 60);
  return hoursSinceDead < 24; // Consider dead for 24 hours
}

async function markServerDead(inbox) {
  const domain = new URL(inbox).hostname;
  await db.deadServers.upsert({
    domain,
    since: Date.now()
  });
}
```

## Common Activities

### Follow Someone

```javascript
async function followActor(username, targetActorUrl) {
  const actor = `https://${DOMAIN}/users/${username}`;

  const activity = createActivity('Follow', actor, targetActorUrl, {
    to: [targetActorUrl],
    cc: []
  });

  // Store pending follow
  await db.pendingFollows.insert({
    actor,
    target: targetActorUrl,
    activityId: activity.id,
    createdAt: new Date()
  });

  // Deliver
  const targetActor = await fetchActor(targetActorUrl);
  await sendSignedRequest(targetActor.inbox, activity, username);
}
```

### Like a Post

```javascript
async function likeObject(username, objectUrl) {
  const actor = `https://${DOMAIN}/users/${username}`;

  const activity = createActivity('Like', actor, objectUrl, {
    to: [await getObjectAuthor(objectUrl)],
    cc: []
  });

  await db.likes.insert({
    actor,
    object: objectUrl,
    activityId: activity.id
  });

  const objectActor = await fetchActorOfObject(objectUrl);
  await sendSignedRequest(objectActor.inbox, activity, username);
}
```

### Boost a Post

```javascript
async function announceObject(username, objectUrl) {
  const actor = `https://${DOMAIN}/users/${username}`;

  const activity = createActivity('Announce', actor, objectUrl, {
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [
      `${actor}/followers`,
      await getObjectAuthor(objectUrl)
    ]
  });

  await db.announces.insert({
    actor,
    object: objectUrl,
    activityId: activity.id
  });

  await deliverActivity(activity, username);
}
```

### Undo an Activity

```javascript
async function undoActivity(username, originalActivityId) {
  const actor = `https://${DOMAIN}/users/${username}`;
  const original = await db.activities.findOne({ id: originalActivityId });

  if (!original || original.actor !== actor) {
    throw new Error('Cannot undo this activity');
  }

  const activity = createActivity('Undo', actor, original, {
    to: original.to,
    cc: original.cc
  });

  await deliverActivity(activity, username);

  // Clean up local state
  await db.activities.remove({ id: originalActivityId });
}
```

## Next Steps

- **[Following and Followers](/docs/guides/following-and-followers)** - Manage relationships
- **[Posts and Replies](/docs/guides/posts-and-replies)** - Create content
- **[Delivery Reference](/docs/specs/activitypub/delivery)** - Delivery spec
