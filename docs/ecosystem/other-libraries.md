---
sidebar_position: 17
title: Other Libraries
description: ActivityPub libraries for other programming languages
---

# Other Libraries

ActivityPub libraries for additional programming languages.

## Elixir

### ActivityPub (Pleroma/Akkoma)

The ActivityPub library used by Pleroma and Akkoma.

| Property | Value |
|----------|-------|
| Repository | [git.pleroma.social/pleroma/pleroma](https://git.pleroma.social/pleroma/pleroma) |
| Key Path | `lib/pleroma/web/activity_pub/` |

### Notable Patterns

```elixir
defmodule Pleroma.Web.ActivityPub.ObjectValidator do
  def validate(object, meta) do
    with {:ok, object} <- validate_type(object),
         {:ok, object} <- validate_actor(object),
         {:ok, object} <- validate_content(object) do
      {:ok, object, meta}
    end
  end
end
```

### HTTPSignatures

```elixir
defmodule Pleroma.Signature do
  def sign(actor, headers) do
    # Build signing string
    # Sign with actor's private key
  end

  def validate(headers, public_key) do
    # Verify HTTP Signature
  end
end
```

## C# / .NET

### FediNet

ActivityPub library for .NET.

| Property | Value |
|----------|-------|
| Repository | [github.com/rytmis/FediNet](https://github.com/rytmis/FediNet) |
| NuGet | `FediNet` |
| Status | Experimental |

### Example

```csharp
using FediNet.ActivityStreams;

var note = new Note
{
    Id = new Uri("https://example.com/notes/123"),
    Content = "Hello from .NET!",
    AttributedTo = new Uri("https://example.com/users/alice")
};
```

## Java / Kotlin

### jActivityPub

Java ActivityPub implementation.

| Property | Value |
|----------|-------|
| Repository | [github.com/ibm-research/jActivityPub](https://github.com/ibm-research/jActivityPub) |
| Status | Experimental |

### Example

```java
import org.w3c.activitystreams.*;

Note note = new Note.Builder()
    .id("https://example.com/notes/123")
    .content("Hello from Java!")
    .attributedTo("https://example.com/users/alice")
    .build();
```

## Swift

### ActivityPubSwift

Swift ActivityPub library.

| Property | Value |
|----------|-------|
| Status | Various experimental projects |

### Example Pattern

```swift
struct Note: Codable {
    let context = "https://www.w3.org/ns/activitystreams"
    let type = "Note"
    let id: URL
    let content: String
    let attributedTo: URL

    enum CodingKeys: String, CodingKey {
        case context = "@context"
        case type, id, content, attributedTo
    }
}
```

## Haskell

No mature libraries, but reference implementations exist in various projects.

### Pattern

```haskell
data Activity = Activity
    { activityContext :: Text
    , activityType :: Text
    , activityActor :: URI
    , activityObject :: Object
    }

instance ToJSON Activity where
    toJSON (Activity ctx typ actor obj) = object
        [ "@context" .= ctx
        , "type" .= typ
        , "actor" .= actor
        , "object" .= obj
        ]
```

## Dart / Flutter

### flutter_activitypub

Experimental Flutter client.

| Property | Value |
|----------|-------|
| Status | Experimental |

### Pattern

```dart
class Actor {
  final String id;
  final String type;
  final String preferredUsername;
  final String inbox;
  final String outbox;

  Actor({
    required this.id,
    required this.type,
    required this.preferredUsername,
    required this.inbox,
    required this.outbox,
  });

  factory Actor.fromJson(Map<String, dynamic> json) {
    return Actor(
      id: json['id'],
      type: json['type'],
      preferredUsername: json['preferredUsername'],
      inbox: json['inbox'],
      outbox: json['outbox'],
    );
  }
}
```

## Building Your Own

If no library exists for your language:

### 1. Start with Types

```
Define structures for:
- Actor (Person, Group, Service)
- Object (Note, Article, Image)
- Activity (Create, Follow, Like)
- Collection (OrderedCollection)
```

### 2. Implement HTTP Signatures

```
1. Build signing string from headers
2. Sign with RSA-SHA256
3. Format as Signature header
```

### 3. WebFinger

```
GET /.well-known/webfinger?resource=acct:{user}@{domain}
Return links to actor
```

### 4. Basic Endpoints

```
GET /users/{username}        → Actor
POST /users/{username}/inbox → Receive activities
GET /users/{username}/outbox → Published activities
```

## Community Resources

- **[SocialHub](https://socialhub.activitypub.rocks/)** - Developer forum
- **[FEP Repository](https://codeberg.org/fediverse/fep)** - Enhancement proposals
- **[ActivityPub Dev Matrix](https://matrix.to/#/#activitypub-dev:matrix.org)** - Real-time chat

## See Also

- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
- **[Building an Actor](/docs/guides/building-an-actor)**

