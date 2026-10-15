---
sidebar_position: 13
title: Go Libraries
description: ActivityPub libraries for Go
---

# Go Libraries

Go libraries for implementing ActivityPub.

Status and versions below were taken from the Go module proxy, GitHub and Codeberg on **2026-10-15**. *Active* = a release or commit in the last 12 months; *Dormant* = 12–36 months; *Unmaintained* = no activity for over 3 years.

| Library | Latest version | Status |
|---------|----------------|--------|
| [go-ap](#go-ap) | rolling pseudo-versions (commits 2026-10-15) | Active |
| [code.superseriousbusiness.org/activity](#gotosocials-forks) | v1.19.0 (2026-01-29) | Active |
| [code.superseriousbusiness.org/httpsig](#gotosocials-forks) | v1.5.0 (2025-10-14; commits 2026-06) | Active |
| [go-fed/httpsig](#gotosocials-forks) | v1.1.0 (2020-07-11; last commit 2024-01) | Dormant |
| [go-fed/activity](#go-fedactivity) | v1.0.0 (2020-07-09; last commit 2022-12) | Unmaintained |
| [webfinger.net/go/webfinger](#webfinger) | v0.1.0 (2019-06-09; last commit 2022-12) | Unmaintained |

## go-ap

A family of modular packages by Marius Orcsik: core vocabulary types, a client, request processing, authorization, filters, and several storage backends. Its reference server is [FedBOX](https://github.com/go-ap/fedbox) (not to be confused with the Node.js [Fedbox](/docs/ecosystem/fedbox)).

| Property | Value |
|----------|-------|
| Organisation | [github.com/go-ap](https://github.com/go-ap) |
| Core module | `github.com/go-ap/activitypub` |
| License | MIT |

### Packages

- `go-ap/activitypub` — vocabulary types and JSON(-LD) (un)marshalling
- `go-ap/client` — HTTP client for fetching and posting
- `go-ap/processing` — C2S and S2S activity processing
- `go-ap/auth`, `go-ap/authorize` — authentication and authorization
- `go-ap/storage-*` — storage backends (SQLite, PostgreSQL, BoltDB, Badger, filesystem)

### Example

```go
import (
    "encoding/json"

    vocab "github.com/go-ap/activitypub"
)

note := vocab.Note{ // Note is an alias for Object
    Type:    vocab.NoteType,
    Content: vocab.NaturalLanguageValues{vocab.English: vocab.Content("Hello!")},
}

data, err := json.Marshal(note)
```

`NaturalLanguageValues` is a map keyed by language tag in current versions; older tutorials that use a slice literal no longer compile.

## GoToSocial's Forks

When go-fed went quiet, the GoToSocial team forked its two core libraries and maintains them on Codeberg. **For new Go code, use these forks rather than the go-fed originals.**

| Module | Fork of | Repository |
|--------|---------|------------|
| `code.superseriousbusiness.org/activity` | go-fed/activity | [codeberg.org/superseriousbusiness/activity](https://codeberg.org/superseriousbusiness/activity) |
| `code.superseriousbusiness.org/httpsig` | go-fed/httpsig | [codeberg.org/superseriousbusiness/httpsig](https://codeberg.org/superseriousbusiness/httpsig) |

Both forks keep the original APIs, so go-fed examples translate by changing the import path. The httpsig fork implements **draft-cavage only**, not RFC 9421.

### Signing a request (httpsig fork)

```go
import "code.superseriousbusiness.org/httpsig"

signer, _, err := httpsig.NewSigner(
    []httpsig.Algorithm{httpsig.RSA_SHA256},
    httpsig.DigestSha256,
    []string{httpsig.RequestTarget, "host", "date", "digest"},
    httpsig.Signature,
    120, // expires in (seconds)
)
if err != nil {
    return err
}

// Adds Digest and Signature headers; body must be the exact bytes you send.
err = signer.SignRequest(privateKey, keyID, req, body)
```

### Verifying a request

```go
verifier, err := httpsig.NewVerifier(req)
if err != nil {
    return err
}
keyID := verifier.KeyId()

// Fetch the key for keyID (with an SSRF-safe client), then:
err = verifier.Verify(publicKey, httpsig.RSA_SHA256)
```

`Verify` only checks the cryptography. You must also require the right signed headers, check the `Digest` against the raw body, and confirm the key's owner is the activity's `actor` — see [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).

## go-fed/activity

The original code-generated ActivityStreams vocabulary and ActivityPub middleware for Go.

:::caution Unmaintained
No commits since December 2022 and the project website (go-fed.org) is offline. Use [GoToSocial's maintained fork](#gotosocials-forks), which keeps the same API.
:::

| Property | Value |
|----------|-------|
| Repository | [github.com/go-fed/activity](https://github.com/go-fed/activity) |
| License | BSD-3-Clause |

```go
import (
    "code.superseriousbusiness.org/activity/streams"     // or github.com/go-fed/activity/streams
    "code.superseriousbusiness.org/activity/streams/vocab"
)

func createNote(actorIRI *url.URL) vocab.ActivityStreamsNote {
    note := streams.NewActivityStreamsNote()

    content := streams.NewActivityStreamsContentProperty()
    content.AppendXMLSchemaString("Hello from Go!")
    note.SetActivityStreamsContent(content)

    attributedTo := streams.NewActivityStreamsAttributedToProperty()
    attributedTo.AppendIRI(actorIRI)
    note.SetActivityStreamsAttributedTo(attributedTo)

    return note
}
```

## WebFinger

`webfinger.net/go/webfinger` is a small WebFinger client. It has not changed since 2022, but the protocol hasn't either.

| Property | Value |
|----------|-------|
| Repository | [github.com/webfinger/go-webfinger](https://github.com/webfinger/go-webfinger) |
| Module | `webfinger.net/go/webfinger` |
| License | MIT |

```go
import "webfinger.net/go/webfinger"

client := webfinger.NewClient(nil)

jrd, err := client.Lookup("alice@example.com", nil)
if err != nil {
    log.Fatal(err)
}

for _, link := range jrd.Links {
    if link.Rel == "self" && link.Type == "application/activity+json" {
        fmt.Println(link.Href)
    }
}
```

## Reference: GoToSocial

GoToSocial is the most complete maintained ActivityPub server in Go, and a good codebase to study.

| Property | Value |
|----------|-------|
| Repository | [codeberg.org/superseriousbusiness/gotosocial](https://codeberg.org/superseriousbusiness/gotosocial) |
| Key paths | `internal/ap/`, `internal/federation/` |

## Choosing

- **Full server, want a framework**: go-ap.
- **Need the go-fed APIs**: GoToSocial's forks, not go-fed itself.
- **Learning**: read the GoToSocial source.

## See Also

- **[GoToSocial](/docs/ecosystem/gotosocial)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
