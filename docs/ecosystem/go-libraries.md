---
sidebar_position: 13
title: Go Libraries
description: ActivityPub libraries for Go
---

# Go Libraries

Go libraries for implementing ActivityPub.

## go-fed/activity

Comprehensive ActivityPub/ActivityStreams implementation.

| Property | Value |
|----------|-------|
| Repository | [github.com/go-fed/activity](https://github.com/go-fed/activity) |
| Documentation | [go-fed.org](https://go-fed.org/) |
| License | BSD-3 |
| Status | Unmaintained (no activity since 2022) |

:::caution Unmaintained
go-fed/activity has had no development since 2022. It remains widely used and feature-complete, but expect no fixes or updates. For new Go projects, consider [go-ap](https://github.com/go-ap) or studying [GoToSocial's codebase](https://codeberg.org/superseriousbusiness/gotosocial).
:::

### Features

- Complete ActivityStreams vocabulary
- ActivityPub C2S and S2S
- HTTP Signatures
- Extensible type system

### Example

```go
package main

import (
    "github.com/go-fed/activity/streams"
    "github.com/go-fed/activity/streams/vocab"
)

func createNote() vocab.ActivityStreamsNote {
    note := streams.NewActivityStreamsNote()

    // Set content
    contentProp := streams.NewActivityStreamsContentProperty()
    contentProp.AppendXMLSchemaString("Hello from Go!")
    note.SetActivityStreamsContent(contentProp)

    // Set attributedTo
    attrProp := streams.NewActivityStreamsAttributedToProperty()
    attrProp.AppendIRI(actorIRI)
    note.SetActivityStreamsAttributedTo(attrProp)

    return note
}
```

### S2S Federation

```go
import "github.com/go-fed/activity/pub"

// Implement required interfaces
type myActor struct{}

func (a *myActor) PostInbox(c context.Context, w http.ResponseWriter, r *http.Request) (bool, error) {
    // Handle incoming activities
}

func (a *myActor) GetOutbox(c context.Context, w http.ResponseWriter, r *http.Request) (bool, error) {
    // Return outbox collection
}
```

## go-ap

Collection of ActivityPub packages.

| Property | Value |
|----------|-------|
| Repository | [github.com/go-ap](https://github.com/go-ap) |
| License | MIT |
| Status | Active |

### Packages

- `go-ap/activitypub` - Core types
- `go-ap/client` - HTTP client
- `go-ap/handlers` - HTTP handlers
- `go-ap/storage` - Storage interface

### Example

```go
import (
    "github.com/go-ap/activitypub"
)

note := activitypub.Note{
    Type:    activitypub.NoteType,
    Content: activitypub.NaturalLanguageValues{{Value: "Hello!"}},
}

// Marshal to JSON
data, _ := json.Marshal(note)
```

## httpsig

HTTP Signature library.

| Property | Value |
|----------|-------|
| Repository | [github.com/go-fed/httpsig](https://github.com/go-fed/httpsig) |
| License | BSD-3 |
| Status | Stable (low activity; widely used) |

### Signing

```go
import "github.com/go-fed/httpsig"

signer, _ := httpsig.NewSigner(
    []httpsig.Algorithm{httpsig.RSA_SHA256},
    httpsig.DigestSha256,
    []string{httpsig.RequestTarget, "host", "date", "digest"},
    httpsig.Signature,
    0,
)

err := signer.SignRequest(privateKey, keyId, req, body)
```

### Verification

```go
verifier, _ := httpsig.NewVerifier(req)
pubKeyId := verifier.KeyId()

// Fetch public key using pubKeyId
err := verifier.Verify(publicKey, httpsig.RSA_SHA256)
```

## webfinger

WebFinger client library.

| Property | Value |
|----------|-------|
| Repository | [github.com/writeas/webfinger](https://github.com/writeas/webfinger) |
| License | MIT |
| Status | Stable |

### Example

```go
import "github.com/writeas/go-webfinger"

client := webfinger.NewClient(nil)

resource, err := client.Lookup("alice@example.com", nil)
if err != nil {
    log.Fatal(err)
}

// Get ActivityPub actor URL
for _, link := range resource.Links {
    if link.Rel == "self" &&
       link.Type == "application/activity+json" {
        fmt.Println(link.Href)
    }
}
```

## GoToSocial Source

Study the GoToSocial codebase for production patterns.

| Property | Value |
|----------|-------|
| Repository | [github.com/superseriousbusiness/gotosocial](https://github.com/superseriousbusiness/gotosocial) |
| Key Paths | `internal/ap/`, `internal/federation/` |

### Notable Patterns

- Clean separation of concerns
- Comprehensive test coverage
- Good documentation

## Comparison

| Library | Scope | Complexity | Use Case |
|---------|-------|------------|----------|
| go-fed/activity | Full | High | Production servers |
| go-ap | Modular | Medium | Custom implementations |
| httpsig | Signing only | Low | Any project |

## Quick Start

**For full servers**: Use go-fed/activity.

**For learning**: Study GoToSocial source.

**For custom needs**: Use go-ap packages.

## See Also

- **[GoToSocial](/docs/ecosystem/gotosocial)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**

