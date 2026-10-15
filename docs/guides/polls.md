---
sidebar_position: 10
title: Polls
description: Implementing polls using ActivityPub Question type
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (activity/create.rb poll_vote?, vote_validator.rb, vote_serializer.rb, note_serializer.rb, distribute_poll_update_worker.rb), AS2 Vocabulary (Question, oneOf, anyOf, closed, endTime)"
---

# Polls

Polls in ActivityPub use the `Question` type from ActivityStreams. A poll is a special kind of Note with answer options that users can vote on. This guide covers implementing polls and handling votes.

## Poll Structure

### Basic Poll

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://example.com/polls/123",
  "type": "Question",
  "attributedTo": "https://example.com/users/alice",
  "content": "<p>What's your favorite programming language?</p>",
  "published": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-16T10:00:00Z",
  "oneOf": [
    {
      "type": "Note",
      "name": "JavaScript",
      "replies": {
        "type": "Collection",
        "totalItems": 42
      }
    },
    {
      "type": "Note",
      "name": "Python",
      "replies": {
        "type": "Collection",
        "totalItems": 38
      }
    },
    {
      "type": "Note",
      "name": "Rust",
      "replies": {
        "type": "Collection",
        "totalItems": 25
      }
    }
  ],
  "votersCount": 105,
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://example.com/users/alice/followers"]
}
```

## Single vs Multiple Choice

### Single Choice (oneOf)

Users can select only one option:

```json
{
  "type": "Question",
  "content": "<p>Pick one:</p>",
  "oneOf": [
    { "type": "Note", "name": "Option A" },
    { "type": "Note", "name": "Option B" },
    { "type": "Note", "name": "Option C" }
  ]
}
```

### Multiple Choice (anyOf)

Users can select multiple options:

```json
{
  "type": "Question",
  "content": "<p>Select all that apply:</p>",
  "anyOf": [
    { "type": "Note", "name": "Option A" },
    { "type": "Note", "name": "Option B" },
    { "type": "Note", "name": "Option C" }
  ]
}
```

## Poll Properties

| Property | Description |
|----------|-------------|
| `type` | Must be `"Question"` |
| `oneOf` | Array of single-choice options |
| `anyOf` | Array of multiple-choice options |
| `endTime` | When voting closes (ISO 8601) |
| `closed` | Timestamp when poll closed (if ended) |
| `votersCount` | Total unique voters — a Mastodon extension (`toot:votersCount`), not AS2 |

Each option's vote count is its `replies.totalItems`. `Question`, `oneOf`, `anyOf`, `closed` and `endTime` are defined in the [Activity Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-question).

## Creating a Poll

```javascript
async function createPoll(author, question, options, settings = {}) {
  const pollId = `https://${config.domain}/polls/${uuid()}`;
  const published = new Date().toISOString();

  // Calculate end time
  const duration = settings.duration || 24 * 60 * 60 * 1000; // 24 hours default
  const endTime = new Date(Date.now() + duration).toISOString();

  // Build options
  const pollOptions = options.map(name => ({
    type: 'Note',
    name,
    replies: {
      type: 'Collection',
      totalItems: 0
    }
  }));

  const poll = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: pollId,
    type: 'Question',
    attributedTo: author.id,
    content: sanitizeHtml(question),
    published,
    endTime,
    [settings.multiple ? 'anyOf' : 'oneOf']: pollOptions,
    votersCount: 0,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [author.followers]
  };

  // Store poll
  await db.polls.insert({
    ...poll,
    votes: [],
    options: options.map(name => ({ name, count: 0 }))
  });

  // Create activity
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${pollId}/activity`,
    type: 'Create',
    actor: author.id,
    published,
    to: poll.to,
    cc: poll.cc,
    object: poll
  };

  await deliverToRecipients(activity, author);

  return poll;
}
```

## Voting on Polls

### Vote Format

A vote is a `Create` of a `Note` whose `name` is the chosen option and whose `inReplyTo` is the poll. One `Create` per choice; Mastodon addresses votes only to the poll's author ([`vote_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/vote_serializer.rb)):

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://voter.example/activities/vote-123",
  "type": "Create",
  "actor": "https://voter.example/users/bob",
  "to": ["https://example.com/users/alice"],
  "object": {
    "id": "https://voter.example/votes/456",
    "type": "Note",
    "name": "JavaScript",
    "inReplyTo": "https://example.com/polls/123",
    "attributedTo": "https://voter.example/users/bob",
    "to": ["https://example.com/users/alice"]
  }
}
```

### Identifying a Vote

Mastodon's rule: a `Create` whose object replies to one of **its own** polls and whose `name` exactly matches one of that poll's options is a vote ([`create.rb` `poll_vote?`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb)). Anything else is an ordinary reply.

```javascript
async function findVotedPoll(activity) {
  const object = activity.object;
  if (activity.type !== 'Create' || object?.type !== 'Note') return null;
  if (typeof object.name !== 'string' || !object.inReplyTo) return null;

  const poll = await db.polls.findOne({ id: object.inReplyTo, local: true });
  if (!poll) return null;

  const options = poll.oneOf || poll.anyOf;
  return options.some(opt => opt.name === object.name) ? poll : null;
}
```

### Sending a Vote

```javascript
async function submitVote(voter, pollId, choices) {
  // Fetch the poll
  const poll = await fetchObject(pollId);

  // Check if poll is still open
  if (poll.closed || (poll.endTime && new Date(poll.endTime) < new Date())) {
    throw new Error('Poll is closed');
  }

  // Get valid options
  const options = poll.oneOf || poll.anyOf;
  const isMultiple = !!poll.anyOf;

  // Validate choices
  if (!isMultiple && choices.length > 1) {
    throw new Error('Single choice poll allows only one vote');
  }

  for (const choice of choices) {
    if (!options.find(opt => opt.name === choice)) {
      throw new Error(`Invalid choice: ${choice}`);
    }
  }

  // Create vote activities
  const pollAuthor = await fetchActor(poll.attributedTo);

  for (const choice of choices) {
    const vote = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `https://${config.domain}/votes/${uuid()}`,
      type: 'Note',
      name: choice, // The choice text
      inReplyTo: pollId,
      attributedTo: voter.id,
      to: [poll.attributedTo]
    };

    const activity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `https://${config.domain}/activities/${uuid()}`,
      type: 'Create',
      actor: voter.id,
      to: [poll.attributedTo],
      object: vote
    };

    await deliverActivity(activity, pollAuthor.inbox, voter);
  }

  // Store vote locally
  await db.votes.insert({
    pollId,
    voter: voter.id,
    choices,
    createdAt: new Date()
  });
}
```

### Receiving Votes

Mirror Mastodon's [`VoteValidator`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/validators/vote_validator.rb): no votes after expiry, no voting on your own poll, one vote per voter on a `oneOf` poll, and one vote per voter **per option** on an `anyOf` poll:

```javascript
async function processVote(activity, signer) {
  const vote = activity.object;
  if (activity.actor !== signer.id || vote.attributedTo !== signer.id) return;

  const poll = await findVotedPoll(activity);
  if (!poll) return; // not a vote: handle as an ordinary reply

  if (poll.closed || (poll.endTime && new Date(poll.endTime) < new Date())) return;
  if (poll.attributedTo === signer.id) return; // no self-votes

  const options = poll.oneOf || poll.anyOf;
  const choiceIndex = options.findIndex(opt => opt.name === vote.name);
  const mine = poll.votes.filter(v => v.voter === signer.id);

  if (poll.oneOf && mine.length > 0) return;                          // single choice
  if (poll.anyOf && mine.some(v => v.choice === vote.name)) return;   // same option twice

  await db.polls.update(
    { id: poll.id },
    {
      $push: { votes: { voter: signer.id, choice: vote.name, id: vote.id } },
      $inc: {
        [`options.${choiceIndex}.count`]: 1,
        votersCount: mine.length === 0 ? 1 : 0
      }
    }
  );

  // Debounced: Mastodon sends an Update of the Question ~3 minutes after a
  // vote, to everyone who voted, boosted or was mentioned (plus followers
  // for public polls) — see distribute_poll_update_worker.rb
  schedulePollUpdate(poll.id, { delayMs: 3 * 60 * 1000 });
}
```

## Closing Polls

### Automatic Closure

```javascript
async function checkExpiredPolls() {
  const now = new Date();

  const expiredPolls = await db.polls.find({
    closed: { $exists: false },
    endTime: { $lte: now.toISOString() }
  });

  for (const poll of expiredPolls) {
    await closePoll(poll);
  }
}

async function closePoll(poll) {
  const closed = new Date().toISOString();

  // Update local record
  await db.polls.update(
    { id: poll.id },
    { $set: { closed } }
  );

  // Send Update activity
  const updatedPoll = await db.polls.findOne({ id: poll.id });
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `https://${config.domain}/activities/${uuid()}`,
    type: 'Update',
    actor: poll.attributedTo,
    to: poll.to,
    cc: poll.cc,
    object: formatPollForFederation(updatedPoll)
  };

  const author = await db.actors.findOne({ id: poll.attributedTo });
  await deliverToRecipients(activity, author);
}
```

### Poll with Closed Property

```json
{
  "type": "Question",
  "id": "https://example.com/polls/123",
  "content": "<p>Poll question</p>",
  "endTime": "2024-01-16T10:00:00Z",
  "closed": "2024-01-16T10:00:00Z",
  "oneOf": [
    {
      "type": "Note",
      "name": "Option A",
      "replies": { "type": "Collection", "totalItems": 42 }
    },
    {
      "type": "Note",
      "name": "Option B",
      "replies": { "type": "Collection", "totalItems": 38 }
    }
  ],
  "votersCount": 80
}
```

## Displaying Polls

Option names and the poll id come from remote servers — escape them, and attach the submit handler in client code rather than inline:

```javascript
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function renderPoll(poll, currentUser) {
  const options = poll.oneOf || poll.anyOf;
  const isMultiple = !!poll.anyOf;
  const isClosed = poll.closed || (poll.endTime && new Date(poll.endTime) < new Date());
  const hasVoted = poll.votes?.some(v => v.voter === currentUser?.id);

  const totalVotes = options.reduce(
    (sum, opt) => sum + (opt.replies?.totalItems || 0),
    0
  );

  return `
    <div class="poll ${isClosed ? 'closed' : ''}">
      <form class="poll-form" data-poll-id="${escapeHtml(poll.id)}">
        ${options.map((option, i) => {
          const count = option.replies?.totalItems || 0;
          const percentage = totalVotes > 0
            ? Math.round((count / totalVotes) * 100)
            : 0;

          return `
            <div class="poll-option">
              ${hasVoted || isClosed
                ? `<div class="poll-result">
                     <div class="poll-bar" style="width: ${percentage}%"></div>
                     <span class="poll-text">${escapeHtml(option.name)}</span>
                     <span class="poll-percentage">${percentage}%</span>
                   </div>`
                : `<label>
                     <input type="${isMultiple ? 'checkbox' : 'radio'}"
                            name="poll-choice"
                            value="${escapeHtml(option.name)}">
                     ${escapeHtml(option.name)}
                   </label>`
              }
            </div>
          `;
        }).join('')}

        ${!hasVoted && !isClosed
          ? '<button type="submit">Vote</button>'
          : ''
        }
      </form>

      <div class="poll-info">
        ${Number(poll.votersCount) || 0} voters ·
        ${isClosed
          ? 'Closed'
          : `Ends ${formatRelativeTime(poll.endTime)}`
        }
      </div>
    </div>
  `;
}
```

## Refreshing Results

Poll results may update. Periodically refresh:

```javascript
async function refreshPollResults(pollId) {
  const poll = await db.polls.findOne({ id: pollId });

  // Only refresh open polls from remote servers
  if (poll.closed) return;
  if (new URL(poll.id).origin === `https://${config.domain}`) return;

  try {
    const fresh = await fetchObject(pollId);
    const options = fresh.oneOf || fresh.anyOf;

    await db.polls.update(
      { id: pollId },
      {
        $set: {
          votersCount: fresh.votersCount,
          options: options.map(opt => ({
            name: opt.name,
            count: opt.replies?.totalItems || 0
          })),
          closed: fresh.closed
        }
      }
    );
  } catch (error) {
    console.log('Could not refresh poll:', error);
  }
}
```

## Common Issues

### Multiple Votes Per User

On an `anyOf` poll each choice arrives as its own `Create`, so a voter legitimately sends several. Count `votersCount` once per voter, and options once per voter per choice — `processVote` above does both.

### Vote vs Reply Ambiguity

Use the poll, not the shape of the Note: only a reply to one of your own polls whose `name` matches an option is a vote (`findVotedPoll` above). Everything else — including a reply that happens to have a `name` — is a normal reply.

### Timezone Handling

Always use UTC for endTime:

```javascript
function createPollEndTime(durationHours) {
  const end = new Date();
  end.setTime(end.getTime() + durationHours * 60 * 60 * 1000);
  return end.toISOString(); // Always UTC
}
```

## Next Steps

- **[Custom Emoji](/docs/guides/custom-emoji)** - Custom emoji support
- **[Content Moderation](/docs/guides/content-moderation)** - Handling reports
- **[Mastodon Compatibility](/docs/guides/mastodon-compatibility)** - Platform specifics
