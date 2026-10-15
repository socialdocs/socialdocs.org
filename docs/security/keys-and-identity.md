---
sidebar_position: 4
title: Keys and identity
description: How ActivityPub actors publish keys in 2026 (FEP-521a Multikey, RSA, Ed25519, ML-DSA-44), how to rotate them safely, and why the actor id — not the WebFinger handle — is the identity.
last_verified: 2026-10-15
verified_against: "FEP-521a, FEP-2c59, FEP-7628, FEP-1580 (codeberg, 2026-10-15); Mastodon v4.7.3 source and CHANGELOG; Mastodon admin docs"
---

# Keys and identity

Every signature check answers two questions: *which key made this signature*, and *which account does that key speak for*. In 2026 the answers have changed in two ways:

- An actor can publish **several keys of different types**, not just one RSA key.
- The **actor `id`** is the identity. A WebFinger handle is a name that points at it and can change.

This page covers both. For the verification code itself, see [Verifying incoming requests](/docs/security/verifying-requests).

## Publishing keys

### The legacy `publicKey`

Most servers still publish exactly one RSA key, in `publicKey`, at a `#main-key` fragment of the actor id:

```json
{
  "id": "https://social.example/users/alice",
  "type": "Person",
  "publicKey": {
    "id": "https://social.example/users/alice#main-key",
    "owner": "https://social.example/users/alice",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n"
  }
}
```

Mastodon 4.7.3 still publishes local accounts this way: one RSA key, in `publicKey` ([actor_serializer.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/serializers/activitypub/actor_serializer.rb)). Keep publishing it. It is what every other server understands.

### FEP-521a: Multikey in `assertionMethod`

[FEP-521a: Representing actor's public keys](https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md) is **FINAL** (finalized 2025-06-14). It adds any number of keys, of any type, as `Multikey` objects in the actor's `assertionMethod` array. Its own example:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://www.w3.org/ns/cid/v1"
  ],
  "type": "Person",
  "id": "https://server.example/users/alice",
  "inbox": "https://server.example/users/alice/inbox",
  "outbox": "https://server.example/users/alice/outbox",
  "assertionMethod": [
    {
      "id": "https://server.example/users/alice#ed25519-key",
      "type": "Multikey",
      "controller": "https://server.example/users/alice",
      "publicKeyMultibase": "z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2"
    }
  ]
}
```

The rules that matter:

- `controller` **MUST** be the actor id. A receiver ignores a key whose controller is anyone else.
- `publicKeyMultibase` is a multicodec prefix plus the raw key, encoded **base58btc** (the leading `z`).
- Key ids **SHOULD** be fragments of the actor id, so one fetch returns the actor and all its keys. Each fragment must be unique.
- Receivers **SHOULD** ignore `assertionMethod` entries that don't follow the FEP.
- An actor **MAY** have no keys at all.

The FEP also notes that `publicKey` is not in the latest Security Vocabulary. Treat it as legacy, but keep it for compatibility.

### Key types

The multicodec prefix tells the receiver what kind of key it is. These are the types Mastodon 4.7.3 decodes ([multibase.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/multibase.rb)):

| Multicodec | Prefix | Key | Notes |
|---|---|---|---|
| `rsa-pub` | `0x1205` | RSA (PKCS#1 DER) | The same key you put in `publicKey` |
| `ed25519-pub` | `0xed` | Ed25519, 32 bytes | Encodes to a `z6Mk…` string |
| `mldsa-44-pub` | `0x1210` | ML-DSA-44, 1312 bytes | Post-quantum. Only used for object integrity proofs |

What each key type can be used for, as a **receiver**, in Mastodon 4.7.3 ([signed_request.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/signed_request.rb), [keypair.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/models/keypair.rb), [object_integrity_proof.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/lib/activitypub/object_integrity_proof.rb)):

| Key | draft-cavage HTTP signature | RFC 9421 HTTP signature | [Object integrity proof](/docs/security/object-integrity-proofs) |
|---|---|---|---|
| RSA | ✅ (`rsa-sha256` / `hs2019`) | ✅ | — |
| Ed25519 | — | ✅ (since 4.7.0) | ✅ `eddsa-jcs-2022` |
| ML-DSA-44 | — | — | ✅ `mldsa44-jcs-2024` (needs OpenSSL ≥ 3.5) |

So: sign HTTP requests with RSA if you want every server to accept them. Add an Ed25519 key in `assertionMethod` for RFC 9421 and for integrity proofs.

Mastodon's support arrived in steps ([CHANGELOG](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md)):

- **4.6.0** (2026-06-17): multiple keypairs per remote account. Before this, Mastodon kept one key per remote actor.
- **4.7.0** (2026-08-20): inbound FEP-521a, Ed25519 in RFC 9421 signatures, FEP-8b32 proof verification. Local keypairs moved to a dedicated table, encrypted at rest. The changelog says this "will allow for key rotation in the future"; Mastodon itself doesn't rotate keys yet.

Mastodon reads at most 10 keys from `publicKey` and 10 from `assertionMethod` (`MAX_PUBLIC_KEYS` in [process_account_service.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb)).

## Rotating keys

Receivers cache your keys. Rotation works because of one convention: **when a signature fails against a cached key, the receiver refetches the key once and tries again.** Mastodon does this (`keypair_refresh_key!` in [signature_verification.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/controllers/concerns/signature_verification.rb)), and so does the [reference verifier's `KeyStore`](/docs/security/verifying-requests).

To rotate:

1. **Add** the new key next to the old one. Publish an `Update` of your actor so followers' servers see it.
2. Start signing with the new key.
3. **Later**, remove the old key.

Never replace every key at once. When *all* of a remote actor's keys change, and the update wasn't signed with one of the old keys, Mastodon treats it as a possible new identity behind the same URL and runs `RefollowWorker`, which re-sends follows ([process_account_service.rb](https://github.com/mastodon/mastodon/blob/v4.7.3/app/services/activitypub/process_account_service.rb)). Overlapping keys avoid that.

If the key can't be fetched at all (your server is down, or the receiver's circuit breaker is open), Mastodon answers **503**, not 401, so you retry later. This changed in 4.5.4 ([#37221](https://github.com/mastodon/mastodon/pull/37221)).

## Identity: the actor id, not the handle

A WebFinger handle such as `@alice@example.com` is how people find an actor. The actor's **`id`** is what servers store and compare.

**Mastodon 4.7.0** made this explicit ([#39785](https://github.com/mastodon/mastodon/pull/39785), [CHANGELOG](https://github.com/mastodon/mastodon/blob/v4.7.3/CHANGELOG.md)):

- The ActivityPub actor `id` is now the primary identifier, instead of the WebFinger handle.
- A remote actor that changes its handle is **renamed**. Before, Mastodon created a duplicate account and later merged the two.
- Mastodon doesn't let its own users change handle yet.
- An account whose handle can't currently be verified is kept, flagged with the REST API attribute [`invalid_handle`](https://docs.joinmastodon.org/entities/Account/#invalid_handle).

What this means for your server:

- **Never change an actor `id`.** Changing the handle is now survivable. Changing the id makes you a different account.
- **Key on `id` in your own database**, not on `user@host`.

### How a handle is checked

The id-to-handle direction needs proof. Otherwise `idiot.example` could publish a WebFinger record `pompous@idiot.example` pointing at someone else's actor. [FEP-2c59](https://codeberg.org/fediverse/fep/src/branch/main/fep/2c59/fep-2c59.md) (DRAFT) describes the classic Mastodon check:

1. Build `preferredUsername@<host of the actor id>`.
2. Look that up with WebFinger.
3. Accept the handle only if the result links back to the **same actor id**.

FEP-2c59 adds an explicit `webfinger` property to the actor, so the server doesn't have to guess:

```json
{
  "@context": [
    "https://www.w3.org/ns/activitystreams",
    "https://purl.archive.org/socialweb/webfinger"
  ],
  "id": "https://social.example.com/evanp",
  "type": "Person",
  "webfinger": "evanp@example.com"
}
```

The WebFinger record for that address **MUST** link to the actor URL verbatim, without redirects or aliases. **Mastodon 4.6.0** publishes `webfinger` on its own actors and uses it for the initial lookup of remote ones. Redirects are still followed, and "the actor ID still has to match in the end" ([#38239](https://github.com/mastodon/mastodon/pull/38239)).

### Split domains

The `webfinger` property is what makes **split-domain** setups clean: handles on `example.com`, server on `social.example.com`. Without it, the classic check builds `evanp@social.example.com`, the longer handle.

Mastodon's own split-domain setup is `LOCAL_DOMAIN=example.com` plus `WEB_DOMAIN=mastodon.example.com`. The apex domain must redirect `/.well-known/webfinger` to the server, **with CORS headers** ([Mastodon docs: `WEB_DOMAIN`](https://docs.joinmastodon.org/admin/config/#web_domain)):

```nginx
location /.well-known/webfinger {
  add_header Access-Control-Allow-Origin '*';
  return 301 https://mastodon.example.com$request_uri;
}
```

Mastodon's docs warn that neither `LOCAL_DOMAIN` nor `WEB_DOMAIN` can safely be changed once remote servers have seen them.

## Moving accounts

When a person changes servers, their identity moves to a **new actor id**. [FEP-7628: Move actor](https://codeberg.org/fediverse/fep/src/branch/main/fep/7628/fep-7628.md) has been **FINAL** since 2026-08-26:

- Two actors belong to the same person only if they are **linked**: by `alsoKnownAs`, by [FEP-c390](https://codeberg.org/fediverse/fep/src/branch/main/fep/c390/fep-c390.md) identity proofs, or by verified rel-me links to the same website.
- A `Move` (with `object` = old id, `target` = new id) is valid only if those two actors are linked.
- **Push mode:** the old actor sends the `Move` to its followers. The old server must be online.
- **Pull mode:** the new actor sends it, to the followers of the new actor, from a saved copy of the follower list. The old server can be gone.
- A deactivated old actor carries `movedTo`. If it stays active, it carries `copiedTo` instead.

Mastodon handles push mode only. The step-by-step guide, with Mastodon's checks, is [Account migration](/docs/guides/account-migration).

`Move` migrates followers, not posts. [FEP-1580](https://codeberg.org/fediverse/fep/src/branch/main/fep/1580/fep-1580.md) (DRAFT, received 2025-10-09) proposes moving the actor's objects too: the new server publishes a `migration` collection mapping old object URIs to new ones, plus a `moves` collection of the `Move` activities that prove the migration. [FEP-ef61](https://codeberg.org/fediverse/fep/src/branch/main/fep/ef61/fep-ef61.md) (DRAFT) takes the other route: identifiers that aren't tied to one server. Neither is in Mastodon.

## Checklist

- [ ] Publish an RSA key in `publicKey` at `#main-key`.
- [ ] Optionally add an Ed25519 `Multikey` in `assertionMethod`, with `controller` set to the actor id.
- [ ] When verifying, accept a key only if the **actor document lists it** and the key's owner or controller is that actor (see [Verifying incoming requests](/docs/security/verifying-requests)).
- [ ] On a failed signature with a cached key, refetch the key **once**.
- [ ] Rotate by overlapping keys, never by replacing all of them.
- [ ] Store and compare actors by `id`. Treat the handle as a display name that must be re-verified.
- [ ] Publish `webfinger` (FEP-2c59) if your handles live on a different domain from your actors.

## See also

- [HTTP signatures in 2026](/docs/specs/http-signatures/overview): cavage vs RFC 9421, and which key types each accepts
- [Object integrity proofs](/docs/security/object-integrity-proofs): signing objects with these keys
- [Authorized fetch and the instance actor](/docs/security/authorized-fetch)
- [WebFinger](/docs/specs/webfinger/overview)
