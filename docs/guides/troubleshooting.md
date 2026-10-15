---
sidebar_position: 20
title: Troubleshooting by Symptom
description: Diagnose common federation failures with Mastodon and Lemmy, starting from what you see
last_verified: 2026-10-15
verified_against: "Mastodon v4.7.3 source (signature verification, inbox, Create/Accept/Follow/Delete handlers, WebFinger client, delivery worker); Mastodon v4.5.4 release notes; Lemmy 0.19.20 fixtures"
---

# Troubleshooting by Symptom

Start from what you see, not from the spec. Each section lists the likely causes, most common first, with how to confirm each and how to fix it. Mastodon behaviour is cited to its [v4.7.3 source][src]; most other servers are stricter or looser in similar places.

## Before you start

**Get the error text.** When Mastodon rejects a signed request it returns the reason as JSON in the response body, for example `{"error":"Signed request date outside acceptable time window"}` ([signature_verification.rb L85-90][sv-fail]). Log the status code *and* body of every outgoing delivery.

**`202 Accepted` does not mean "processed".** Mastodon's inbox only verifies the signature, queues the payload and returns `202`; parsing and storing happen later in a Sidekiq job ([inboxes_controller.rb L12-17, L92-94][inbox]). Activities dropped at that stage leave no trace on your side.

**Read the receiving server's logs** when you run it (or ask its admin). On a standard Mastodon install the processes run as the `mastodon-web` and `mastodon-sidekiq` systemd units ([dist/][dist]), logging at `info` by default ([production.rb L55][prod]):

```bash
# Rejected Create/Announce payloads are logged at info level
journalctl -u mastodon-sidekiq --since "1 hour ago" | grep "Rejected"
journalctl -u mastodon-web --since "1 hour ago" | grep -i "inbox"
```

**Look at your own objects the way a server does:**

```bash
# Actor / object: must be 200 with an ActivityPub media type
curl -s -D- -H 'Accept: application/activity+json' https://your.example/users/alice | head -20

# WebFinger
curl -s 'https://your.example/.well-known/webfinger?resource=acct:alice@your.example'
```

[BrowserPub](https://browser.pub/) and `fedify lookup` from the [Fedify CLI](https://fedify.dev/cli) fetch and render objects the way a federating server would. `fedify inbox` starts a throwaway public actor and inbox so you can follow your server and see exactly what it sends; `fedify tunnel` exposes a local dev server over HTTPS (see [Testing & debugging tools](/docs/tools/overview)).

**Developing on localhost?** Mastodon refuses to fetch private or loopback addresses: you'll see `Requests to private network addresses are disallowed (tried to query …)` ([signature_verification.rb L109-110][sv-key]). Use a public tunnel.

## "401 from Mastodon" when delivering

Read the `error` field of the response body; it maps directly to a cause.

| Error message | Cause | Fix |
|---|---|---|
| `Request not signed` | No `Signature` header | Sign every POST ([HTTP signatures](/docs/specs/http-signatures/overview)) |
| `Mastodon requires the Digest header to be signed when doing a POST request` | `digest` not in the signed `headers` list | Sign `(request-target) host date digest` |
| `Digest header missing` | Signed `digest` but didn't send the header | Send `Digest: SHA-256=…` |
| `Invalid Digest value. Computed SHA-256 digest: X; given: Y` | Digest computed over a different body than the bytes sent — usually re-serialising the JSON after hashing it | Hash the exact bytes you send ([signed_request.rb L63-79][sr-digest]) |
| `Signed request date outside acceptable time window` | `Date` too old or in the future. A draft-cavage signature is valid for 5 minutes after its date, plus 1 hour of clock skew ([signed_request.rb L256-263][sr-window]) | Sign with the current time, sync your clock (NTP), and don't sign once then retry hours later |
| `Unsupported signature algorithm (only rsa-sha256 and hs2019 are supported)` | Unknown `algorithm` value ([L244-246][sr-verify]) | Use `rsa-sha256` or `hs2019` |
| `Public key not found for key …` / `Unable to fetch key JSON at …` | Mastodon couldn't fetch your `keyId`: wrong URL, 404, or served with a non-ActivityPub content type | Make `keyId` dereferenceable and served as `application/activity+json` |
| ``Actor … has neither 'preferredUsername' nor `webfinger` …``, `Webfinger response for … does not loop back to …` | Fetching your key triggers a full actor fetch, *including the WebFinger round-trip*; those errors surface as 401s ([signature_verification.rb L102-112][sv-key]) | Fix the actor/WebFinger — see [Mastodon can't find or show my profile](#mastodon-cant-find-or-show-my-profile) |
| `publicKey id for … does not correspond to …` | The key document's `owner` actor doesn't list that key ([fetch_remote_key_service.rb L25-28][frks]) | `publicKey.id` on the actor must equal the `keyId` you sign with |
| `Verification failed for …` | Key found and refreshed once, but the signature still doesn't match ([L60-68][sv-fail]) | Rebuild the signing string exactly: lower-case header names, `(request-target)` is `post /path?query`, `host` matches the URL you POST to, headers in the order listed |

Mastodon refetches your key once before failing, so a rotated key fixes itself if your actor already serves the new key ([signature_verification.rb L60-66][sv-fail]). Mastodon retries 401s (up to 16 times with a growing back-off) but treats most other 4xx responses as permanent and drops the delivery ([delivery_worker.rb L11-21, L61-79][dw]).

Full background, including RFC 9421: [HTTP signatures in 2026](/docs/specs/http-signatures/overview#why-did-i-get-a-401).

## "503 when Mastodon fetches my key"

Since **Mastodon 4.5.4**, a *temporary* failure to fetch the signer's actor or key returns **503 instead of 401** ([v4.5.4 release notes][r454]). The body is one of ([signature_verification.rb L74-82][sv-fail]):

- `Failed to fetch remote data: …` — connection error, timeout or TLS failure reaching your server.
- `Failed to fetch remote data (got unexpected reply from server)` — your actor/key URL returned an error status.
- `Fetching attempt skipped because of recent connection failure` — after a single connection or TLS failure from your IP, Mastodon stops trying for **5 minutes** ([signature_verification.rb L10-11, L120-127][sv-stoplight]).

**Fix:** make your actor URL reliably reachable over valid HTTPS, then wait out the 5-minute cool-off before retesting. A 503 is retried by the sender, so nothing is lost if the outage is short.

## "Follow stays pending"

### A Mastodon user follows my actor, and it never completes

1. **You never sent an `Accept`.** Mastodon only completes the follow when it receives an `Accept` from the followed actor.
2. **The `Accept` doesn't reference the Follow.** Mastodon looks up the pending request by `object` id — the `id` of the `Follow` it sent you, exactly ([activity.rb L148-150][act-follow], [accept.rb L4-26][accept]). If you embed the `Follow` object instead, its `actor` must be the Mastodon account. A freshly minted Follow id won't match.
3. **The `Accept` is signed by a different actor** than its `actor` property. Mastodon drops activities whose `actor` isn't the signer, unless they carry a valid LD signature or integrity proof ([process_activity_service.rb L36-58][pas]).
4. **The delivery itself failed** — check the response body as in [401 from Mastodon](#401-from-mastodon-when-delivering).

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://your.example/activities/accept/1",
  "type": "Accept",
  "actor": "https://your.example/users/alice",
  "object": "https://mastodon.example/2b8e…"
}
```

Here `object` is the `id` of the `Follow` you received. Send it to the follower's `inbox`.

### My actor follows a Mastodon user, and it stays "requested"

1. **The account is locked.** Mastodon waits for its owner to approve ([follow.rb L32-38][follow]).
2. **Mastodon sent an `Accept` and your inbox rejected or ignored it.** Mastodon sends `Accept { object: <your Follow> }` to your actor's personal `inbox` ([authorize_follow_service.rb L20-26][afs]), signed by the followed account. Your inbox must verify that signature (see [Verifying incoming requests](/docs/security/verifying-requests)) and match `object.id` against the Follow you sent.
3. **You got a `Reject`.** Mastodon rejects follows when the target blocks you or your domain, has moved, or is the instance actor ([follow.rb L18-21][follow]).
4. **Your `Follow`'s `object` isn't the account's actor URI.** Use the `id` from the actor document, not a profile page URL.
5. **Mastodon stopped delivering to you.** After deliveries to your server are exhausted on 7 different days, Mastodon marks your domain unavailable and stops sending ([delivery_failure_tracker.rb L6-19, L111-113][dft]). Any successfully verified request *from* your server to its inbox clears this ([inboxes_controller.rb L73-80][inbox-reset]).

## Mastodon can't find or show my profile

Searching `@alice@your.example` triggers a WebFinger lookup, then an actor fetch. Every step must pass:

1. **WebFinger has no usable `self` link.** The JRD needs `subject` and a link with `rel: "self"` and `type` either `application/activity+json` or `application/ld+json; profile="https://www.w3.org/ns/activitystreams"` ([webfinger.rb L9, L38-46][wf]). Errors: `Missing subject in response for …`, `Missing self link in response for …`.
2. **The actor doesn't come back as ActivityPub.** Mastodon requires HTTP **200** with `Content-Type: application/activity+json` (or `application/ld+json` with the ActivityStreams profile); anything else — including `application/json` — is treated as no document ([json_ld_helper.rb L272-282, L351-361][jsonld-fetch]).
3. **The actor's `id` isn't the URL it was fetched from.** Mastodon refetches by `id` and discards documents whose `id` doesn't match ([json_ld_helper.rb L242-252][jsonld-id]).
4. **Missing `@context`, wrong `type`, or no handle.** The actor must include `https://www.w3.org/ns/activitystreams` in `@context`, be one of `Application`, `Group`, `Organization`, `Person`, `Service`, and have `preferredUsername` (or an FEP-2c59 `webfinger` property) ([fetch_remote_actor_service.rb L9, L30-34][fras]). Usernames must match `[a-z0-9_]+([.-]+[a-z0-9_]+)*` ([account.rb L75-78][acct-re]).
5. **WebFinger doesn't "loop back".** Mastodon WebFingers `preferredUsername@<actor host>` (or the FEP-2c59 `webfinger` value) and checks that the `self` link equals the actor `id`; otherwise: `Webfinger response for … does not loop back to …` ([process_account_service.rb L133-182][pas-wf]). With split domains (actor on `ap.example.com`, handle `@alice@example.com`), the actor host's WebFinger may answer with `subject: acct:alice@example.com`; Mastodon then queries `example.com`, which must return the same subject and a `self` link to the same actor. Setting `webfinger: "alice@example.com"` on the actor skips the first hop.
6. **Your domain is blocked** by that server's admin. Signed requests from blocked domains get **403** ([signature_verification.rb L95-97][sv-key]).
7. **The search isn't resolving remotely.** Mastodon only resolves remote accounts for authenticated searches with `resolve` set; anonymous resolve requests get `401` ([api/v2/search_controller.rb L12-14, L38-40][search]). Search for the full `@user@domain` or the actor URL while logged in.

Profile changes don't show up immediately: Mastodon re-fetches a known remote account after about a day ([account.rb L71, L284-286][acct-stale]). Send an `Update` of your actor to your followers to refresh it straight away.

Guide: [WebFinger implementation](/docs/guides/webfinger-implementation#common-issues), [Mastodon compatibility](/docs/guides/mastodon-compatibility#actor-requirements).

## My posts don't show up for Mastodon followers

The delivery got `202`, but the post never appears. Check the receiving Sidekiq log for `Rejected Create activity <id> from <actor>` ([activity.rb L188-191][act-reject]). Causes, in order:

1. **The object type isn't supported.** Mastodon stores `Note` and `Question`, and converts `Article`, `Page`, `Image`, `Video`, `Audio` and `Event` into simplified statuses ([activity.rb L8-10][act-types]). Anything else is rejected.
2. **The object `id` is on a different host from the actor** ([create.rb L17-19][create]).
3. **The post isn't "related to local activity".** A delivered public or unlisted post is only kept if a local account follows you, it replies to a local or followed account's post, it addresses a local account, or it came through a relay. Followers-only posts need a local follower or addressee; direct messages need a local addressee ([create.rb L464-485][create-related]).
4. **No ActivityStreams `@context`** on the activity ([process_activity_service.rb L34][pas]).
5. **Signer ≠ `actor`** — e.g. a shared bot key signing for many actors ([process_activity_service.rb L36-58][pas]).
6. **A Tombstone exists for that id.** Once you've deleted an id, Mastodon won't accept a `Create` for it again ([create.rb L17-19][create]). Use new ids.
7. **Payload over 1 MB** returns `413` from the inbox ([inboxes_controller.rb L21-23][inbox], [activity.rb L8][act-types]).

Check visibility too: `to: as:Public` makes a post public, `cc: as:Public` unlisted, followers collection only means followers-only ([Mastodon compatibility](/docs/guides/mastodon-compatibility#visibility-levels)).

## My actor shows on Mastodon, but older posts are missing

This is expected. Mastodon does **not** import a remote actor's `outbox`. It shows only posts it already has: ones delivered to it after someone there followed you, or ones a user fetched by pasting the post URL into search. It loads your `featured` (pinned) collection when processing your actor ([process_account_service.rb L93-95][pas-featured]). The profile links to your server for the full history.

To get a post onto a server, deliver it to a follower there, or have someone search for its URL. The object must be fetchable: HTTP 200, ActivityPub content type, and `id` equal to the URL.

## "Replies don't thread"

1. **`inReplyTo` doesn't hold the parent's `id`.** Mastodon matches the parent by URI (an object with an `id` also works) ([create.rb L434-448][create-reply]). A link to an HTML page, or a fragment of a different URL, won't match.
2. **Mastodon can't fetch the parent.** When it doesn't have the parent, it queues a `ThreadResolveWorker` to fetch it ([create.rb L382-386][create-thread], [thread_resolve_worker.rb][trw]). The parent must be publicly fetchable as described above. If your server requires signed fetches, it must accept requests signed by Mastodon's instance actor; Mastodon signs fetches on behalf of that actor by default ([json_ld_helper.rb L272-275][jsonld-fetch]).
3. **You aren't delivering the reply to the parent's author.** Include the parent author in `cc`, add a `Mention` tag for them, and deliver to their inbox. A reply to a local post is what lets the receiving server keep it (see above) and forward it to its followers ([create.rb L491-495][create-forward]).
4. **Reply collections for backfill.** Mastodon reads an object's `replies` collection to pull in replies it missed ([create.rb L400-411][create-replies]), so publish a `replies` collection for your posts.

## "Mentions don't notify"

A Mastodon user gets a notification only when the mention is **both tagged and addressed**:

1. **Add a `Mention` tag** whose `href` is the mentioned actor's `id`: `{ "type": "Mention", "href": "https://mastodon.example/users/bob", "name": "@bob@mastodon.example" }` ([create.rb L255-266][create-mention]).
2. **Address them in `to` or `cc`.** Tagged accounts that aren't in the audience are silenced: they get no notification ([create.rb L153-155][create-audience]). Addressed accounts with no `Mention` tag get a *silent* mention: they can see the post but aren't notified ([create.rb L140-145][create-audience]).
3. **Deliver to their inbox.** The mention only reaches them if their server receives the post.

Putting a link to `@bob` in `content` does nothing on its own.

## "Delete didn't propagate"

1. **The `Delete` didn't go everywhere the post went.** Each server only learns about a delete if it's delivered there. Record where you delivered each post, or deliver the `Delete` to all followers' inboxes and anyone mentioned.
2. **The `object` id doesn't match.** Mastodon looks the status up by `uri` and author ([delete.rb L19-56][delete]). Send the post's exact `id` (a `Tombstone` with that `id` is fine).
3. **The `Delete` doesn't come from the author.** Mastodon only removes a status when the signing actor wrote it, and only records a tombstone for ids on the actor's own host ([delete.rb L19-56][delete]).
4. **Your fetch endpoint still serves the post.** After deleting, return `410 Gone` (or `404`) for the object URL, so servers that re-fetch it see that it's gone.

A `Delete` that arrives *before* its `Create` is remembered for 6 hours, and the late `Create` is discarded ([activity.rb L98-104][act-delete-first], [create.rb L32][create]). Deleting an actor uses `Delete` with `object` equal to the actor's own `id` ([delete.rb L4-17][delete]). If an actor Mastodon has never seen sends a `Delete` or `Update` of *itself*, Mastodon returns `202` and skips it ([inboxes_controller.rb L29-38][inbox]).

## "Images / attachments don't appear"

1. **The attachment uses `href`.** Mastodon treats any attachment with an `href` as a link (preview card), not media. Media must use `url` ([create.rb L300-311][create-media]).
2. **Unsupported `mediaType`.** Images: `image/jpeg`, `png`, `gif`, `heic`, `heif`, `webp`, `avif`. Video: `video/webm`, `mp4`, `quicktime`, `ogg`. Plus a list of audio types ([media_attachment.rb L64-68][media-types]). Unsupported types become a link, not inline media.
3. **More than 4 attachments.** The rest are ignored ([status.rb L62][status-limit], [create.rb L314][create-media]).
4. **Too large.** Images over 16 MB, video and audio over 99 MB ([media_attachment.rb L46-47][media-types]).
5. **The file URL isn't publicly fetchable.** Mastodon downloads media with a plain, unsigned GET ([remotable.rb L24][remotable]), so media must not require HTTP signatures, cookies or private IPs. Failed downloads are retried later ([create.rb L328-337][create-media]).
6. **The receiving server rejects media from your domain** (an admin "reject media" domain block) ([create.rb L454-458][create-media]).

Add `name` (alt text), and optionally `blurhash` and `focalPoint`. See [Media attachments](/docs/guides/media-attachments).

## "Lemmy community posts aren't appearing"

1. **You never completed the follow.** Follow the community's `Group` actor and wait for its `Accept` ([Following a community](/docs/guides/lemmy-compatibility#following-a-community)). Lemmy only delivers to subscribed instances, and only from the moment you subscribe. Earlier posts are in the community's `outbox`.
2. **You're looking for `Create`, but Lemmy sends `Announce`.** The community wraps every post, comment, vote, edit and delete in an `Announce` signed by the community ([Community announce](/docs/guides/lemmy-compatibility#community-announce), [fixture][lemmy-announce]). Unwrap the inner activity. Re-fetch it from its own origin before trusting it, because the announcer isn't its author ([Handling community announces](/docs/guides/lemmy-compatibility#handling-community-announces)).
3. **Posts are `Page`, not `Note`.** Link posts carry the link in `attachment[{type: "Link", href}]` ([Posts](/docs/guides/lemmy-compatibility#posts-page-objects)).
4. **Your inbox rejected the community's signature.** Check your own logs for verification failures on requests from the community actor.

## Response codes at a glance

How Mastodon reacts to the status your inbox returns ([delivery_worker.rb][dw], [json_ld_helper.rb L377-379][jsonld-unsalvageable]):

| Your response | Mastodon's delivery worker |
|---|---|
| 2xx | Success |
| 401, 408, 429, 5xx | Retried with back-off, up to 16 times |
| Other 4xx (400, 403, 404, 410, …) and 501 | Treated as permanent and dropped |

When *you* receive deliveries, return `202` once a request is accepted for processing. Return `401` for bad signatures and `400` for malformed JSON. Don't return `5xx` for things a retry can't fix.

## General debugging workflow

1. **Find the failing step:** WebFinger, actor fetch, key fetch, inbox POST, or async processing.
2. **Capture the exact request and response:** headers, raw body bytes, status, and the response body.
3. **Reproduce against a known-good peer.** Fetch a real Mastodon actor and post with `fedify lookup` or BrowserPub and compare field by field with yours. Use `fedify inbox` to capture what your server sends.
4. **Check the receiving side's logs** if you control it, or a test instance you run yourself.

Log the **raw body** (bytes, not re-serialised JSON) next to the headers for both incoming and outgoing requests. Most signature and digest bugs are visible in that diff.

Low-level checks:

```bash
# Verbose request/response, including TLS
curl -v -H 'Accept: application/activity+json' https://your.example/users/alice

# DNS and certificate
dig your.example
openssl s_client -connect your.example:443 -servername your.example </dev/null
```

Online helpers: [webfinger.net](https://webfinger.net/) for WebFinger, the [JSON-LD playground](https://json-ld.org/playground/) for expansion, and [RequestBin](https://requestbin.com/) to inspect raw requests.

## See also

- [HTTP signatures in 2026](/docs/specs/http-signatures/overview)
- [Verifying incoming requests](/docs/security/verifying-requests)
- [Mastodon compatibility](/docs/guides/mastodon-compatibility)
- [Lemmy compatibility](/docs/guides/lemmy-compatibility)
- [Testing your implementation](/docs/guides/testing-your-implementation)
- [Testing & debugging tools](/docs/tools/overview)

[src]: https://github.com/mastodon/mastodon/tree/v4.7.3
[dist]: https://github.com/mastodon/mastodon/tree/v4.7.3/dist
[prod]: https://github.com/mastodon/mastodon/blob/v4.7.3/config/environments/production.rb#L55
[sv-fail]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/concerns/signature_verification.rb#L49-L90
[sv-key]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/concerns/signature_verification.rb#L92-L113
[sv-stoplight]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/concerns/signature_verification.rb#L10-L11
[sr-digest]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/signed_request.rb#L54-L80
[sr-window]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/signed_request.rb#L252-L264
[sr-verify]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/signed_request.rb#L242-L251
[frks]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/fetch_remote_key_service.rb#L11-L28
[r454]: https://github.com/mastodon/mastodon/releases/tag/v4.5.4
[inbox]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/inboxes_controller.rb
[inbox-reset]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/activitypub/inboxes_controller.rb#L73-L80
[pas]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_activity_service.rb#L34-L58
[act-types]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb#L8-L10
[act-follow]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb#L148-L150
[act-reject]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb#L188-L191
[act-delete-first]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity.rb#L98-L104
[accept]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/accept.rb#L4-L26
[follow]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/follow.rb
[afs]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/authorize_follow_service.rb#L20-L26
[dft]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/delivery_failure_tracker.rb
[dw]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/activitypub/delivery_worker.rb
[wf]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/webfinger.rb#L9-L47
[jsonld-fetch]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb#L272-L282
[jsonld-id]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb#L242-L252
[jsonld-unsalvageable]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/helpers/json_ld_helper.rb#L373-L379
[fras]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/fetch_remote_actor_service.rb#L9-L34
[acct-re]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/account.rb#L75-L78
[acct-stale]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/account.rb#L284-L286
[pas-wf]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb#L133-L183
[pas-featured]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb#L93-L95
[create]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L17-L44
[create-related]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L464-L485
[create-reply]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L434-L448
[create-thread]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L382-L386
[create-replies]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L400-L411
[create-forward]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L491-L495
[create-mention]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L255-L266
[create-audience]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L126-L156
[create-media]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/create.rb#L300-L345
[search]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/api/v2/search_controller.rb#L12-L40
[trw]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/workers/thread_resolve_worker.rb
[delete]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/activity/delete.rb
[media-types]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/media_attachment.rb#L46-L68
[status-limit]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/status.rb#L62
[remotable]: https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/concerns/remotable.rb#L24
[lemmy-announce]: https://github.com/LemmyNet/lemmy/blob/0.19.20/crates/apub/assets/lemmy/activities/community/announce_create_page.json
