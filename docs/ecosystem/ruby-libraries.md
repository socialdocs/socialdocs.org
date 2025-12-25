---
sidebar_position: 15
title: Ruby Libraries
description: ActivityPub libraries for Ruby
---

# Ruby Libraries

Ruby libraries for implementing ActivityPub.

## Mastodon Source

The primary reference for Ruby ActivityPub implementation.

| Property | Value |
|----------|-------|
| Repository | [github.com/mastodon/mastodon](https://github.com/mastodon/mastodon) |
| License | AGPL-3.0 |
| Key Paths | `app/lib/activitypub/`, `app/services/` |

### Notable Components

```
mastodon/
├── app/lib/activitypub/
│   ├── activity.rb              # Base activity
│   ├── adapter.rb               # JSON serialization
│   ├── linked_data_signature.rb # LD Signatures
│   └── tag_manager.rb           # Object references
├── app/services/
│   ├── activitypub/
│   │   ├── process_account_service.rb
│   │   ├── process_collection_service.rb
│   │   └── fetch_remote_status_service.rb
│   └── delivery_service.rb
```

### HTTP Signatures

```ruby
# From Mastodon's request.rb
class Request
  def perform
    http_client.headers(
      'Signature' => signature_header,
      'Digest' => digest_header,
      'Date' => Time.now.utc.httpdate
    ).public_send(@verb, @url.to_s, body: @body)
  end

  def signature_header
    SignatureGenerator.new(@account, @verb, @url, @body).generate
  end
end
```

## http_signatures gem

HTTP Signature implementation.

| Property | Value |
|----------|-------|
| Repository | [github.com/99designs/http-signatures-ruby](https://github.com/99designs/http-signatures-ruby) |
| gem | `http_signatures` |
| Status | Maintenance |

### Example

```ruby
require 'http_signatures'

context = HttpSignatures::Context.new(
  keys: { 'key-1' => HttpSignatures::Key.new(id: 'key-1', secret: private_key) },
  algorithm: 'rsa-sha256',
  headers: ['(request-target)', 'host', 'date', 'digest']
)

signed_headers = context.signer.sign(
  method: 'POST',
  path: '/inbox',
  headers: request_headers
)
```

## json-ld gem

JSON-LD processor.

| Property | Value |
|----------|-------|
| Repository | [github.com/ruby-rdf/json-ld](https://github.com/ruby-rdf/json-ld) |
| gem | `json-ld` |
| Status | Active |

### Example

```ruby
require 'json/ld'

# Expand
expanded = JSON::LD::API.expand(document)

# Compact
compacted = JSON::LD::API.compact(
  expanded,
  { "@context" => "https://www.w3.org/ns/activitystreams" }
)
```

## webfinger gem

WebFinger client.

| Property | Value |
|----------|-------|
| Repository | [github.com/nov/webfinger](https://github.com/nov/webfinger) |
| gem | `webfinger` |
| Status | Stable |

### Example

```ruby
require 'webfinger'

resource = WebFinger.discover!('alice@example.com')

ap_link = resource.links.find do |link|
  link['rel'] == 'self' &&
  link['type'] == 'application/activity+json'
end

puts ap_link['href']
```

## Rails Integration

### Basic Controller

```ruby
class ActorsController < ApplicationController
  def show
    @user = User.find_by!(username: params[:username])

    respond_to do |format|
      format.html
      format.json { render json: actor_json(@user) }
    end
  end

  private

  def actor_json(user)
    {
      '@context' => 'https://www.w3.org/ns/activitystreams',
      'type' => 'Person',
      'id' => actor_url(user),
      'preferredUsername' => user.username,
      'inbox' => inbox_url(user),
      'outbox' => outbox_url(user),
      'publicKey' => {
        'id' => "#{actor_url(user)}#main-key",
        'owner' => actor_url(user),
        'publicKeyPem' => user.public_key
      }
    }
  end
end
```

### Inbox Controller

```ruby
class InboxController < ApplicationController
  def create
    verify_signature!
    activity = JSON.parse(request.body.read)

    case activity['type']
    when 'Follow'
      process_follow(activity)
    when 'Undo'
      process_undo(activity)
    when 'Create'
      process_create(activity)
    end

    head :accepted
  end

  private

  def verify_signature!
    # Verify HTTP Signature
  end
end
```

## Comparison

| Resource | Type | Use Case |
|----------|------|----------|
| Mastodon source | Reference | Learn patterns |
| http_signatures | Gem | Signing |
| json-ld | Gem | JSON-LD processing |
| webfinger | Gem | Discovery |

## Recommendations

**For learning**: Study Mastodon's codebase.

**For Rails apps**: Use Mastodon patterns with gems.

**For minimal implementations**: Combine webfinger + http_signatures.

## See Also

- **[Mastodon](/docs/ecosystem/mastodon)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**

