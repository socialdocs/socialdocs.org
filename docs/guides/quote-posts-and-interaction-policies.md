---
title: Quote Posts and Interaction Policies
description: Consent-respecting quote posts (FEP-044f), interactionPolicy with canQuote, canReply and canFeature, and how Mastodon and GoToSocial actually behave
last_verified: 2026-10-15
verified_against: "FEP-044f and FEP-7aa9 (codeberg, 2026-10-15); Mastodon v4.7.3 source and docs.joinmastodon.org/spec/activitypub; GoToSocial v0.22.2 source and interaction controls docs; live mastodon.social output (2026-10-15)"
---

# Quote Posts and Interaction Policies

Quote posts arrived in Mastodon 4.5 (November 2025) with a twist: quoting someone requires their **consent**, granted by an approval stamp that third-party servers can check. The same machinery, an `interactionPolicy` object borrowed from GoToSocial, now also describes who may reply to a post and who may add an account to a curated collection.

This page covers what goes over the wire, what each sub-policy defaults to, and how the two largest implementations behave.

| Piece | Defined by | Status (October 2026) | Implemented by |
|---|---|---|---|
| `quote`, `QuoteRequest`, `QuoteAuthorization`, `quoteAuthorization`, `canQuote` | [FEP-044f](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md) | DRAFT | Mastodon 4.5+ (4.4 could already verify and display remote quotes; authoring and approving arrived in 4.5) |
| `interactionPolicy`, `canLike`, `canReply`, `canAnnounce`, `LikeRequest`/`ReplyRequest`/`AnnounceRequest`, `*Authorization` | [GoToSocial interaction controls](https://docs.gotosocial.org/en/latest/federation/interaction_controls/) | GoToSocial extension (`https://gotosocial.org/ns`) | GoToSocial |
| `canFeature`, `FeatureRequest`, `FeatureAuthorization` | [FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md) | DRAFT (received 2026-06-12) | Mastodon 4.6+ (collections) |
| Legacy `quoteUri`, `quoteUrl`, `_misskey_quote` | No spec; listed as compatibility fallbacks in FEP-044f | De facto | Fedibird, Misskey-family software; read by Mastodon |

:::caution GoToSocial does not do quote posts
GoToSocial invented `interactionPolicy`, but as of v0.22.2 it does **not** support quote posts. It publishes `canQuote` with only the author's own URI (self-quotes only), with the source comment "GtS doesn't support quote posts yet" ([`internaltoas.go`](https://codeberg.org/superseriousbusiness/gotosocial/src/tag/v0.22.2/internal/typeutils/internaltoas.go)).
:::

## The `interactionPolicy` model

An `interactionPolicy` is an object property containing **sub-policies**, one per kind of interaction. Each sub-policy has two arrays ([GoToSocial docs](https://docs.gotosocial.org/en/latest/federation/interaction_controls/#interaction-policy), [FEP-044f](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md#advertising-a-quote-policy)):

- **`automaticApproval`**: actors, or collections of actors, whose interaction is approved without the author looking at it.
- **`manualApproval`**: actors or collections whose interaction the author will review; it may be approved or rejected.

Anyone in neither list is never approved. In practice the only values used are:

- the Public collection, `https://www.w3.org/ns/activitystreams#Public`. FEP-7aa9 notes that `as:Public` and `Public` also appear, and Mastodon's parser accepts all three spellings ([`interaction_policy_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/interaction_policy_parser.rb));
- the author's `followers` or `following` collection;
- individual actor URIs.

**"Nobody" is spelled as the author's own URI.** To say "only I may do this", put the author's actor URI as the single value of `automaticApproval`. An empty array won't do, because under JSON-LD processing an empty array is the same as a missing property. A missing property means something else entirely (see the defaults below).

| Sub-policy | Lives on | Governs | Defined by |
|---|---|---|---|
| `canLike` | post | `Like` with the post as `object` | GoToSocial |
| `canReply` | post | posts with `inReplyTo` set to the post | GoToSocial |
| `canAnnounce` | post | `Announce` of the post | GoToSocial |
| `canQuote` | post | posts whose `quote` is the post | FEP-044f |
| `canFeature` | **actor** | adding the actor to a featured collection | FEP-7aa9 |

### A missing policy means different things per sub-policy

This is the single most important interop detail, and it is easy to get backwards.

| Sub-policy missing | Meaning | Source |
|---|---|---|
| `canLike`, `canReply`, `canAnnounce` | **Anyone who can see the post may interact**, as if `automaticApproval: [Public]` | [GoToSocial docs, "Defaults per sub-policy"](https://docs.gotosocial.org/en/latest/federation/interaction_controls/#defaults-per-sub-policy) |
| `canQuote` | **Nobody but the author may quote.** Mastodon stores a zero policy, and `quote_policy_for_account` returns `:denied` for everyone but the author | [`status_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/status_parser.rb), [`interaction_policy_concern.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/concerns/status/interaction_policy_concern.rb) |
| `canFeature` | **No consent**: the actor "MUST NOT be added to featured collections ever" | [FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md#interaction-policies-for-curated-collections) |

The asymmetry is deliberate. Likes, replies and boosts already happen on every server that has never heard of interaction policies, so a missing policy has to mean "the de facto default". Quotes and featuring are opt-in from the start. If your posts carry no `canQuote`, **Mastodon users will not be offered a quote button for them.**

### Presence of a sub-policy is a promise

GoToSocial treats publishing a sub-policy as a statement that your server **enforces** it and can handle the matching `Accept`/`Reject` flow. If you only implement reply controls, publish `canReply` and leave the others out ([GoToSocial docs, "Indicating that verification is required"](https://docs.gotosocial.org/en/latest/federation/interaction_controls/#indicating-that-verification-is-required-not-required-per-sub-policy)).

### The policy is advisory, never proof

FEP-044f is explicit: the policy "SHOULD be used to provide user interface hints … but it MUST NOT be used to verify whether a quote post is valid". A policy can change after the fact, and third parties cannot see whether someone is in the author's followers collection. Proof comes from **authorization stamps**, described below.

## What Mastodon publishes

A public post from mastodon.social (fetched 2026-10-15), trimmed to the relevant parts:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "quote": { "@id": "https://w3id.org/fep/044f#quote", "@type": "@id" },
      "quoteUri": "http://fedibird.com/ns#quoteUri",
      "_misskey_quote": "https://misskey-hub.net/ns#_misskey_quote",
      "quoteAuthorization": { "@id": "https://w3id.org/fep/044f#quoteAuthorization", "@type": "@id" },
      "gts": "https://gotosocial.org/ns#",
      "interactionPolicy": { "@id": "gts:interactionPolicy", "@type": "@id" },
      "canQuote": { "@id": "gts:canQuote", "@type": "@id" },
      "automaticApproval": { "@id": "gts:automaticApproval", "@type": "@id" },
      "manualApproval": { "@id": "gts:manualApproval", "@type": "@id" }
    }
  ],
  "id": "https://mastodon.social/users/Mastodon/statuses/117411420916699261",
  "type": "Note",
  "interactionPolicy": {
    "canQuote": {
      "automaticApproval": ["https://www.w3.org/ns/activitystreams#Public"]
    }
  }
}
```

Constraints from Mastodon's [`note_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/note_serializer.rb) and its [ActivityPub docs](https://docs.joinmastodon.org/spec/activitypub/#Quote):

- **Outgoing posts carry only `canQuote.automaticApproval`.** The value is some combination of Public, the author's followers and the author's following collection, or just the author's URI ("nobody"). Mastodon never publishes `canReply`, `canLike` or `canAnnounce`, and does not enforce them on incoming replies.
- **Incoming policies are reduced to four settings:** public, followers, following and nobody. Any other entry, such as an individual actor, is flagged as an "unsupported policy" ([`interaction_policy.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/interaction_policy.rb)).
- **Self-quotes are always allowed.**

## Representing a quote post

A quote post is an ordinary object with a `quote` property pointing at the quoted object ([FEP-044f §quote](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md#quote)). Add a plain-text fallback for software that doesn't render quotes:

```json
{
  "type": "Note",
  "id": "https://example.com/users/bob/statuses/1",
  "attributedTo": "https://example.com/users/bob",
  "to": ["https://www.w3.org/ns/activitystreams#Public", "https://example.com/users/alice"],
  "content": "I am quoting alice's post<span class=\"quote-inline\"><br/>RE: <a href=\"https://example.com/users/alice/statuses/1\">https://example.com/users/alice/statuses/1</a></span>",
  "quote": "https://example.com/users/alice/statuses/1",
  "quoteUri": "https://example.com/users/alice/statuses/1",
  "_misskey_quote": "https://example.com/users/alice/statuses/1",
  "quoteAuthorization": "https://example.com/users/alice/stamps/1"
}
```

**Reading quotes.** Mastodon accepts `quote`, `_misskey_quote`, `quoteUrl` and `quoteUri`, takes the first one present, and uses only the first quote if there are several. A post that has a legacy property but no `quote` is stored as a *legacy* quote ([`status_parser.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/parser/status_parser.rb)).

**Writing quotes.** Mastodon emits `quote`, plus `_misskey_quote` and `quoteUri` while the quoted post still exists. Once the quoted post is deleted it emits `"quote": {"type": "Tombstone"}`. It does not emit `quoteUrl`.

## The approval flow

```text
Bob's server                    Alice's server                 Third-party servers
     |-- QuoteRequest ------------->|
     |   object: alice's post       |
     |   instrument: bob's quote    |
     |                              |  policy allows it, or Alice approves
     |<-- Accept -------------------|
     |   result: QuoteAuthorization |
     |-- Create/Update Note {quote, quoteAuthorization} ----------------->|
     |                              |<---- GET QuoteAuthorization --------|  verify
     |                              |
     |<-- Reject -------------------|  (if not allowed)
```

### 1. Request

The quoting server sends a `QuoteRequest` to the quoted post's author. `object` is the quoted post and `instrument` is the quote post, ideally inlined so the author can inspect it ([FEP-044f §QuoteRequest](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md#QuoteRequest)):

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "QuoteRequest": "https://w3id.org/fep/044f#QuoteRequest",
      "quote": { "@id": "https://w3id.org/fep/044f#quote", "@type": "@id" }
    }
  ],
  "type": "QuoteRequest",
  "id": "https://example.com/users/bob/statuses/1/quote",
  "actor": "https://example.com/users/bob",
  "object": "https://example.com/users/alice/statuses/1",
  "instrument": {
    "type": "Note",
    "id": "https://example.com/users/bob/statuses/1",
    "attributedTo": "https://example.com/users/bob",
    "to": ["https://www.w3.org/ns/activitystreams#Public", "https://example.com/users/alice"],
    "content": "I am quoting alice's post<br/>RE: https://example.com/users/alice/statuses/1",
    "quote": "https://example.com/users/alice/statuses/1"
  }
}
```

A server may wait for the answer before sending the `Create`, or send the `Create` first and an `Update` once approved. Clients built on C2S can only do the latter.

### 2. Accept with a stamp, or Reject

If the quote is acceptable, the quoted author replies with an `Accept` whose `object` is the `QuoteRequest` and whose `result` is the URI of a **`QuoteAuthorization`**. Otherwise it should send a `Reject`.

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    { "QuoteRequest": "https://w3id.org/fep/044f#QuoteRequest" }
  ],
  "type": "Accept",
  "id": "https://example.com/users/alice/activities/1234",
  "to": "https://example.com/users/bob",
  "actor": "https://example.com/users/alice",
  "object": {
    "type": "QuoteRequest",
    "id": "https://example.com/users/bob/statuses/1/quote",
    "actor": "https://example.com/users/bob",
    "object": "https://example.com/users/alice/statuses/1",
    "instrument": "https://example.com/users/bob/statuses/1"
  },
  "result": "https://example.com/users/alice/stamps/1"
}
```

:::warning Echo the QuoteRequest `id`
Since 4.7.0, Mastodon no longer processes an `Accept` or `Reject` of a `QuoteRequest` that it cannot find **by `id`** ([CHANGELOG 4.7.0](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md)). Always include the original request's `id` in the `object` you send back.
:::

The stamp itself must be dereferenceable by everyone allowed to see the quoted post. It must **not** embed the quote post, to avoid leaking it:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    {
      "QuoteAuthorization": "https://w3id.org/fep/044f#QuoteAuthorization",
      "gts": "https://gotosocial.org/ns#",
      "interactingObject": { "@id": "gts:interactingObject", "@type": "@id" },
      "interactionTarget": { "@id": "gts:interactionTarget", "@type": "@id" }
    }
  ],
  "type": "QuoteAuthorization",
  "id": "https://example.com/users/alice/stamps/1",
  "attributedTo": "https://example.com/users/alice",
  "interactingObject": "https://example.org/users/bob/statuses/1",
  "interactionTarget": "https://example.com/users/alice/statuses/1"
}
```

Mastodon serves stamps at `/users/:username/quote_authorizations/:id` ([`quote_authorization_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/quote_authorization_serializer.rb)). On an accepted request it also silently mentions the quoted author on the quote post, so they keep access to it ([`quote_request.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/quote_request.rb)).

### 3. Publish with `quoteAuthorization`

The quoting server copies `result` into the post's `quoteAuthorization` and sends the `Create`, or an `Update` if it already sent one.

## Verifying someone else's quote post

When your server receives a quote post from a remote actor, FEP-044f says to treat it as **unapproved** unless one of these holds:

1. it is a self-quote (same `attributedTo` on both posts), or
2. `quoteAuthorization` resolves to a valid `QuoteAuthorization` for this exact pair.

Mastodon's [`verify_quote_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/verify_quote_service.rb) checks that:

- the stamp's host matches the host of its `attributedTo`;
- its type is `QuoteAuthorization`;
- `interactingObject` is the quote post being processed;
- `interactionTarget` is the quoted post;
- `attributedTo` is the quoted post's author.

A sketch of the same checks, using the SSRF-safe fetcher from [Verifying incoming requests](/docs/security/verifying-requests):

```js
import { safeFetchJson, sameOrigin } from './verify-requests/src/index.js';

const idOf = (v) => (typeof v === 'string' ? v : v?.id);

/**
 * quotePost: the incoming Note (already authenticated as coming from its author).
 * quoted: the quoted Note, fetched from its own origin.
 * Returns true only if the quote is approved.
 */
export async function isQuoteApproved(quotePost, quoted) {
  // Self-quotes need no stamp
  if (idOf(quotePost.attributedTo) === idOf(quoted.attributedTo)) return true;

  const stampUri = idOf(quotePost.quoteAuthorization);
  if (!stampUri) return false;

  // The stamp must live on the quoted author's server
  if (!sameOrigin(stampUri, idOf(quoted.attributedTo))) return false;

  const stamp = await safeFetchJson(stampUri);
  const types = [].concat(stamp.type);
  return (
    stamp.id === stampUri &&
    types.includes('QuoteAuthorization') &&
    idOf(stamp.interactingObject) === quotePost.id &&
    idOf(stamp.interactionTarget) === quoted.id &&
    idOf(stamp.attributedTo) === idOf(quoted.attributedTo)
  );
}
```

Mastodon 4.5.8 fixed "insufficient checks on quote authorizations" ([GHSA-q4g8-82c5-9h33](https://github.com/mastodon/mastodon/security/advisories/GHSA-q4g8-82c5-9h33)). Treat every field of the stamp as attacker-controlled until it matches.

When you display a quote, the fallback `content` and the quoted post's `content` are remote HTML. Sanitize them like any other remote content (see [Content security](/docs/reference/content-security)).

## Revocation

The quoted author can withdraw consent at any time by **`Delete`-ing the stamp**. Recipients must then treat the quote as unapproved, and the quote's own server must forward the `Delete` to the quote's audience ([FEP-044f, Revocation](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md#revocation-of-a-quote-post)).

Mastodon's revocation ([`revoke_quote_service.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/revoke_quote_service.rb), [`delete_quote_authorization_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/delete_quote_authorization_serializer.rb)):

- sends a `Delete` whose `id` is the stamp URI plus `#delete`;
- embeds the stamp, which still holds only URIs, and addresses it to Public;
- signs it and delivers it to every inbox that the quote and the quoted post reached.

Because a `Delete` may never arrive, FEP-044f recommends re-checking a stamp when an already-known quote is accessed again. Mastodon schedules a background refresh for stamps older than one week ([`quote.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/quote.rb), `BACKGROUND_REFRESH_INTERVAL`). Mastodon's quote states are `pending`, `accepted`, `rejected`, `revoked` and `deleted`.

## Reply controls: `canReply` and friends

GoToSocial enforces `canReply`, `canLike` and `canAnnounce` with the same request-and-stamp pattern ([GoToSocial docs](https://docs.gotosocial.org/en/latest/federation/interaction_controls/#requesting-obtaining-and-proving-interaction-authorization)):

| Interaction | Request activity | Stamp type | Property on the interaction |
|---|---|---|---|
| Reply | `ReplyRequest` | `ReplyAuthorization` | `replyAuthorization` |
| Like | `LikeRequest` | `LikeAuthorization` | `likeAuthorization` |
| Boost | `AnnounceRequest` | `AnnounceAuthorization` | `announceAuthorization` |

Key rules from the GoToSocial spec:

- **When to ask.** Send a request when you fall under `manualApproval`, **or** when you are approved only by being in a followers or following collection, because third parties can't verify membership. If `automaticApproval` contains Public, no request is needed.
- **Implicit permissions.** Mentioned and replied-to actors can always reply, and an author can always interact with their own post. GoToSocial applies both even if the policy says otherwise.
- **"Impolite" interactions.** Servers that don't know about policies just send a `Create`. GoToSocial stores these as pending requests the author can approve or reject. Third parties that see no `replyAuthorization` on a reply needing approval should drop it.
- **Older property names.** Before v0.20.0 the properties were `always` and `approvalRequired`; GoToSocial v0.21.0+ sends and reads only `automaticApproval`/`manualApproval`.

Mastodon (as of 4.7.3) neither publishes nor enforces `canReply`. Replies to a GoToSocial post from Mastodon are therefore "impolite" interactions, and the GoToSocial author decides what to do with them.

[FEP-171b conversation containers](/docs/guides/threads-replies-and-backfill#fep-171b-conversation-containers) also use a property named `canReply`, but there it is a **plain array** of actors or collections on the top-level post, not a sub-policy object.

## `canFeature`: consent to be featured (FEP-7aa9)

Mastodon 4.6's curated collections (lists of recommended accounts) use the same idea at the **actor** level. An actor publishes `interactionPolicy.canFeature`. Before adding someone to a collection, the collection owner sends a `FeatureRequest` and keeps the resulting `FeatureAuthorization` as `featureAuthorization` on the collection item ([FEP-7aa9](https://codeberg.org/fediverse/fep/src/branch/main/fep/7aa9/fep-7aa9.md)).

Mastodon's actors (v4.7.3, [`actor_serializer.rb`](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/actor_serializer.rb)) derive the value from account settings:

| Account setting | `canFeature.automaticApproval` |
|---|---|
| Not discoverable | the actor's own URI (nobody) |
| Discoverable, locked | the actor's followers collection |
| Discoverable, not locked | Public |

Note the term: Mastodon maps `canFeature` to `https://w3id.org/fep/7aa9#canFeature`, not into the `gts:` namespace like `canQuote`.

## Interop checklist

- [ ] Publish `interactionPolicy.canQuote` on every post you are willing to have quoted. Without it, Mastodon users can't quote you.
- [ ] To forbid an interaction, use the author's URI, never an empty array.
- [ ] Publish a sub-policy only if you enforce it and can send `Accept`/`Reject` for it.
- [ ] Send `QuoteRequest` before quoting non-self posts, and include `quoteAuthorization` once accepted.
- [ ] Reply to `QuoteRequest`s with `Accept` + `result` (stamp URI) or `Reject`, echoing the request's `id`.
- [ ] Serve stamps at their `id`, without embedding the quote post.
- [ ] Verify stamps on incoming quotes: origin, type, both ends and author. Never treat the policy as proof.
- [ ] Handle `Delete` of a stamp, and re-check stamps periodically.
- [ ] Emit `quoteUri` and `_misskey_quote` alongside `quote` for older software, and keep a plain-text `RE:` fallback in `content`.

## See also

- [Threads, Replies and Backfill](/docs/guides/threads-replies-and-backfill)
- [Mastodon Compatibility](/docs/guides/mastodon-compatibility)
- [FEP-044f: Consent-respecting quote posts](https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md)
- [GoToSocial: Interaction Controls](https://docs.gotosocial.org/en/latest/federation/interaction_controls/)
- [Mastodon: Quote posts and quote controls](https://docs.joinmastodon.org/spec/activitypub/#Quote)
