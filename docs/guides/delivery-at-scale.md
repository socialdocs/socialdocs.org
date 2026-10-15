---
title: Delivery at scale
description: How to deliver activities to thousands of inboxes without hammering dead servers — Mastodon's real retry schedule, which responses are terminal, unavailable domains, circuit breakers, shared inboxes, followers synchronization (FEP-8fcf) and batching (FEP-49eb).
last_verified: 2026-10-15
verified_against: "Mastodon 4.7.3 source (DeliveryWorker, LowPriorityDeliveryWorker, JsonLdHelper, DeliveryFailureTracker, RequestPool, Request, InboxesController, config/sidekiq.yml), Fedify 2.4 manual and CHANGES.md, FEP-8fcf (FINAL), FEP-49eb (DRAFT)"
---

# Delivery at scale

One public post from an account with 50,000 followers becomes one POST per *distinct inbox* those followers live behind. Most of those servers are fine. Some are slow, some are gone for good, and some come back after a week. A delivery system's job is to get the activity to the live ones quickly, keep trying the flaky ones for a while, and stop wasting work on the dead ones.

This page describes how Mastodon 4.7 does that, from its source, and where [Fedify](https://fedify.dev/) differs. For the request format itself, see the spec-level [Delivery](/docs/specs/activitypub/delivery) page.

## Shape of the work

1. **Resolve recipients to inboxes**, preferring each actor's `endpoints.sharedInbox`. Mastodon selects `coalesce(shared_inbox_url, inbox_url)` per account and de-duplicates ([account.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/account.rb), `inboxes`). 50,000 followers on 3,000 servers is about 3,000 requests, not 50,000.
2. **Drop inboxes on unavailable domains** before queueing ([below](#unavailable-domains)).
3. **Enqueue one job per (activity, inbox).** Mastodon's `DeliveryWorker` takes `(json, sender_id, inbox_url)`, and fan-out code uses `push_bulk` in batches of 1,000.
4. **Each job signs and POSTs once.** On failure the job, not the whole fan-out, is retried.

Keeping jobs per inbox means one slow server can't hold up delivery to everyone else, and a retry resends to one server only.

## Retry schedule

Mastodon's `ActivityPub::DeliveryWorker` runs on the `push` queue with **16 retries** and `dead: false` (after the last retry the job is dropped, not parked) ([delivery_worker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/delivery_worker.rb)). The delay before retry *n* (counting from 0) is:

```
delay = n⁴ + 15 seconds
      + rand(0 … 0.5·n⁴)          # Mastodon's own jitter
      + rand(0 … 9)·(n + 1)       # Sidekiq's built-in jitter
```

| Retry | Base delay |
|---|---|
| 0–2 | 15–31 s |
| 4 | ~4.5 min |
| 8 | ~1.1 h |
| 12 | ~5.8 h |
| 15 | ~14 h |

Summed over all 16 retries that is **about 2 to 3 days** before Mastodon gives up on one delivery. The low-priority worker (used for the wide second wave of an [account deletion](/docs/guides/deletion#deleting-an-actor)) runs on the `pull` queue with **8 retries**, about 1.3–2.1 hours in total ([low_priority_delivery_worker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/low_priority_delivery_worker.rb)).

Fedify defaults to exponential backoff with at most 10 retries for outgoing activities, configurable with `outboxRetryPolicy`; if your message queue retries natively, Fedify defers to it ([Fedify: Sending activities](https://fedify.dev/manual/send)).

## Which responses are terminal

Retrying a request that will never succeed wastes days of queue time. Mastodon classifies responses like this ([json_ld_helper.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb)):

| Response | Mastodon | Fedify (default) |
|---|---|---|
| 2xx | Success | Success |
| 401 | **Retry** (unless the *sending* account is permanently gone) | Retry |
| 408, 429 | **Retry** | 429 retried; `Retry-After` respected by the circuit breaker |
| 404, 410 | Give up | Give up, call the permanent-failure handler |
| Other 4xx | Give up | Retry (unless added to `permanentFailureStatusCodes`) |
| 501 | Give up | Retry |
| Other 5xx, timeout, connection error | Retry | Retry |

Fedify's permanent failures default to 404 and 410 and can be extended, for example with 451 ([Fedify: permanent failure handling](https://fedify.dev/manual/send)). Use the handler to clean up: a 410 from an inbox usually means the actor is gone, and you can drop that follower.

Two details from Mastodon worth copying:

- **401 is not terminal.** It often means the receiver couldn't fetch *your* key yet, or wants a different signature scheme. Mastodon 4.7 signs with draft-cavage first and, on a 400 or 401, immediately retries the same request signed with RFC 9421 ("double-knocking", [request.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/request.rb)) before the job counts as failed. See [HTTP signatures](/docs/specs/http-signatures/overview).
- **Timeouts are bounded per request.** Mastodon allows 5 s to connect, 10 s per read or write, and a 30 s overall read deadline ([request.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/request.rb), `TIMEOUT`). A delivery worker waiting minutes on one server is a worker not delivering to anyone else.

## Unavailable domains

Retries handle a server that is down for an afternoon. For a server that is gone, Mastodon stops trying altogether ([delivery_failure_tracker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/delivery_failure_tracker.rb)):

1. Every delivery attempt that doesn't succeed (and isn't terminal) adds **today's date** to a per-host Redis set.
2. When the set holds **7 distinct days**, the host becomes an `UnavailableDomain`.
3. Deliveries to an unavailable domain are skipped at enqueue time (`without_unavailable`) and again when a job runs.
4. **Any successful delivery** clears the record. So does **any signed request from that server**: the inbox controller resets the tracker for the signing actor's inbox ([inboxes_controller.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/inboxes_controller.rb), `upgrade_account`). A server that comes back and talks to you is immediately deliverable again.

Counting *days* rather than attempts matters: a server that fails 50 times in one bad hour is not dead, but one that has failed on 7 separate days probably is.

## Circuit breakers

An unavailable-domains list reacts in days. A circuit breaker reacts in seconds, so a server that just went down doesn't absorb every worker thread.

- **Mastodon** wraps each delivery in a [Stoplight](https://github.com/bolshakov/stoplight) circuit keyed by **inbox URL**: after **10** failures the circuit opens and requests fail fast for a **60-second** cool-off ([delivery_worker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/delivery_worker.rb), `STOPLIGHT_*`). A fast failure is just another failed attempt, so the job is retried on the normal schedule.
- **Fedify 2.3+** has an outbound circuit breaker, on by default for queued delivery, keyed by **remote host** (including port). It counts network errors and 5xx responses, not 429s. Activities for an open circuit are held and requeued rather than sent, with a TTL; when the TTL expires the permanent-failure handler runs with `reason: "circuit-breaker-ttl"`. It can be tuned or turned off with `circuitBreaker: false` ([Fedify CHANGES, 2.3.0](https://github.com/fedify-dev/fedify/blob/main/CHANGES.md)).

## Concurrency and connections

Mastodon has no per-host rate limiter. Delivery concurrency is the number of Sidekiq threads serving the `push` queue (`SIDEKIQ_CONCURRENCY`, default 5 per process, with `push` weighted 6 against `default` 8 and `ingress` 4; [config/sidekiq.yml](https://github.com/mastodon/mastodon/blob/v4.7.3/config/sidekiq.yml)). Connections are persistent per site and shared through a pool of up to 512 (`MAX_REQUEST_POOL_SIZE`, [request_pool.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/request_pool.rb)), so a burst to one server reuses a few keep-alive connections instead of opening hundreds.

If you build your own, cap in-flight requests **per host** as well as globally. Otherwise a fan-out to a big instance can look like an attack to it and earn you 429s.

## Followers synchronization (FEP-8fcf)

When you deliver a followers-only post to a shared inbox, the receiving server decides which of *its* users see it based on what it thinks your followers are. If the two sides disagree — a lost `Undo Follow`, a database restore — posts can reach people who unfollowed you.

[FEP-8fcf](https://codeberg.org/fediverse/fep/src/branch/main/fep/8fcf/fep-8fcf.md) (FINAL since 2022) detects drift cheaply. The sender MAY add a header to any delivery (the FEP recommends it at least for a `Create` addressed to the sender's followers):

```http
Collection-Synchronization: collectionId="https://example.org/users/1/followers",
  url="https://example.org/users/1/followers_synchronization",
  digest="c33f48cd341ef046a206b8a72ec97af65079f9a3a9b90eef79c5920dce45c61f"
```

`digest` is the XOR of the SHA-256 of each follower id **on the receiving server**. On receipt:

1. The header must be covered by the request's signature.
2. `collectionId` MUST be the sender's `followers` id, and `url` MUST be on the same authority — otherwise a server could trick you into fetching a third party's follower list. If either check fails, ignore the header.
3. Compute the digest from your own records. If it differs, fetch `url` with a signed request and reconcile your follow records against it. Mastodon sends the header on deliveries made with its `synchronize_followers` option and processes it on receipt, unless `DISABLE_FOLLOWERS_SYNCHRONIZATION=true` ([delivery_worker.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/delivery_worker.rb), [inboxes_controller.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/inboxes_controller.rb)).

The FEP has preconditions: each server's actors must share one scheme and authority for their `id`, `inbox` and `sharedInbox`. Two implementations on one domain can't both use it.

## Batching: not yet

Don't POST a `Collection` of activities to an inbox. Mastodon 4.7 **removed** inbox processing of collections of activities ([v4.7.0 changelog](https://github.com/mastodon/mastodon/releases/tag/v4.7.0), #39932).

[FEP-49eb](https://codeberg.org/fediverse/fep/src/branch/main/fep/49eb/fep-49eb.md) (DRAFT, received 2026-08-22) proposes a `DeliverBatch` activity carrying up to 50 activities, each individually signed when using FEP-8b32 proofs. It grew out of PieFed's batched `Announce`s for groups ([FEP-1a11](https://codeberg.org/fediverse/fep/src/branch/main/fep/1a11/fep-1a11.md)). Treat both as experiments: only send batches to servers that advertise support, and keep per-activity delivery as the default.

## A delivery job

A minimal job that follows Mastodon's rules. `signCavage` and `signRfc9421` come from the tested [verify-requests module](/docs/security/verifying-requests); the inbox URL came from a remote actor document, so check it before connecting.

```javascript
import { lookup } from 'node:dns/promises';
import { signCavage, signRfc9421, isBlockedAddress } from './verify-requests/src/index.js';

// Mirrors Mastodon's JsonLdHelper#response_error_unsalvageable?
function classify(status) {
  if (status >= 200 && status < 300) return 'success';
  if (status === 501) return 'permanent';
  if (status >= 400 && status < 500 && ![401, 408, 429].includes(status)) return 'permanent';
  return 'retry';
}

// Mastodon DeliveryWorker: n⁴ + 15 s, plus up to 50% jitter
export function retryDelaySeconds(n) {
  return n ** 4 + 15 + Math.random() * 0.5 * n ** 4;
}

async function assertDeliverable(inboxUrl) {
  const url = new URL(inboxUrl);
  if (url.protocol !== 'https:') throw new Error('Inbox must be https');
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error('Inbox resolves to a private address');
  }
  // Note: this check is not pinned to the connection. To rule out DNS
  // rebinding, connect to the checked address as safe-fetch.js does.
}

async function post(inboxUrl, body, { host, ...signed }) {
  // fetch sets Host itself (to the same value that was signed)
  return fetch(inboxUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/activity+json', ...signed },
    body,
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
}

export async function deliver({ inboxUrl, body, keyId, privateKey }) {
  await assertDeliverable(inboxUrl);

  let res = await post(inboxUrl, body, signCavage({ url: inboxUrl, body, keyId, privateKey }));
  if (res.status === 400 || res.status === 401) {
    // Double-knock with RFC 9421, as Mastodon 4.7 does
    res = await post(inboxUrl, body, signRfc9421({ url: inboxUrl, body, keyId, privateKey }));
  }
  return classify(res.status); // 'success' | 'permanent' | 'retry'
}
```

Your queue then retries `'retry'` results with `retryDelaySeconds(attempt)` up to your limit, records the day for [unavailable-domain tracking](#unavailable-domains), and treats `'permanent'` as done (cleaning up the follower on 410).

## What to measure

| Signal | Why | Mastodon | Fedify 2.3+ |
|---|---|---|---|
| Queue backlog and latency | Is delivery keeping up? | `ruby_sidekiq_queue_backlog`, `ruby_sidekiq_queue_latency_seconds` via [prometheus_exporter](/docs/ecosystem/monitoring-tools) | `fedify.queue.task.*` metrics and `MessageQueue.getDepth()` |
| Failed and dropped jobs | Retries exhausting, servers lost | `ruby_sidekiq_failed_jobs_total` | `activitypub.delivery.*` counters, permanent-failure handler |
| Circuit state | Which hosts are being shed | Stoplight (logs) | `activitypub.circuit_breaker.state_change` |
| Unavailable domains | Who you've stopped trying | `UnavailableDomain` table | Your permanent-failure handler |

Fedify's metric names are from its [2.3.0 changelog](https://github.com/fedify-dev/fedify/blob/main/CHANGES.md); pass a `meterProvider` to `createFederation()` to export them.

## See also

- [Delivery](/docs/specs/activitypub/delivery) — the spec-level view: addressing, shared inbox, `bto`/`bcc`
- [Deletion](/docs/guides/deletion) — the widest fan-out most servers ever do
- [HTTP signatures](/docs/specs/http-signatures/overview) — draft-cavage, RFC 9421 and double-knocking
- [Monitoring tools](/docs/ecosystem/monitoring-tools)
