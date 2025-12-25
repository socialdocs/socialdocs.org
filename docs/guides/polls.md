---
sidebar_position: 10
title: Polls
description: Implementing polls using ActivityPub Question type
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
| `votersCount` | Total unique voters |

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
    cc: [`${author.id}/followers`]
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

A vote is a Create activity with a Note that references the poll:

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

```javascript
function isVote(activity) {
  if (activity.type !== 'Create') return false;

  const object = activity.object;
  if (object.type !== 'Note') return false;

  // Has name (the vote choice) but no content
  if (!object.name) return false;
  if (object.content) return false;

  // Must reply to something
  if (!object.inReplyTo) return false;

  return true;
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

```javascript
async function processVote(activity, signer) {
  const vote = activity.object;

  // Verify it's a vote
  if (!isVote(activity)) return;

  // Find the poll
  const poll = await db.polls.findOne({ id: vote.inReplyTo });
  if (!poll) return;

  // Check if poll is open
  if (poll.closed || (poll.endTime && new Date(poll.endTime) < new Date())) {
    return; // Ignore votes on closed polls
  }

  // Check if already voted
  const existingVote = poll.votes.find(v => v.voter === signer.id);
  if (existingVote) {
    return; // Already voted (for single choice)
  }

  // Validate the choice
  const options = poll.oneOf || poll.anyOf;
  const choiceIndex = options.findIndex(opt => opt.name === vote.name);

  if (choiceIndex === -1) {
    return; // Invalid choice
  }

  // Record the vote
  await db.polls.update(
    { id: poll.id },
    {
      $push: { votes: { voter: signer.id, choice: vote.name } },
      $inc: {
        [`options.${choiceIndex}.count`]: 1,
        votersCount: existingVote ? 0 : 1
      }
    }
  );
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

```javascript
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
      <form onsubmit="submitVote(event, '${poll.id}')">
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
                     <span class="poll-text">${option.name}</span>
                     <span class="poll-percentage">${percentage}%</span>
                   </div>`
                : `<label>
                     <input type="${isMultiple ? 'checkbox' : 'radio'}"
                            name="poll-choice"
                            value="${option.name}">
                     ${option.name}
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
        ${poll.votersCount || 0} voters ·
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
  if (poll.id.startsWith(`https://${config.domain}`)) return;

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

For multiple choice polls, users can send multiple vote activities:

```javascript
async function processVote(activity, signer) {
  const vote = activity.object;
  const poll = await db.polls.findOne({ id: vote.inReplyTo });

  // For anyOf (multiple choice), allow multiple votes
  // but track which choices they've made
  if (poll.anyOf) {
    const existingChoices = poll.votes
      .filter(v => v.voter === signer.id)
      .map(v => v.choice);

    if (existingChoices.includes(vote.name)) {
      return; // Already voted for this choice
    }

    // Record additional vote
    await db.polls.update(
      { id: poll.id },
      {
        $push: { votes: { voter: signer.id, choice: vote.name } },
        $inc: {
          [`options.${choiceIndex}.count`]: 1,
          // Only increment votersCount if first vote
          votersCount: existingChoices.length === 0 ? 1 : 0
        }
      }
    );
  }
}
```

### Vote vs Reply Ambiguity

Distinguish votes from regular replies:

```javascript
function isVote(activity) {
  const object = activity.object;

  // Votes have name but no content
  return (
    activity.type === 'Create' &&
    object.type === 'Note' &&
    object.name && // Has choice text
    !object.content && // No message content
    object.inReplyTo // References the poll
  );
}
```

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
