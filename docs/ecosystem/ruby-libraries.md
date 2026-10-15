---
sidebar_position: 15
title: Ruby Libraries
description: ActivityPub libraries for Ruby
last_verified: 2026-10-15
verified_against: "Package registries and forge APIs (npm, PyPI, crates.io, RubyGems, Packagist, Go proxy, GitHub, Codeberg) on 2026-10-15; @fedify/* 2.4.4"
---

# Ruby Libraries

Ruby libraries for implementing ActivityPub.

Status and versions below were taken from RubyGems, GitHub and GitLab on **2026-10-15**. *Active* = a release or commit in the last 12 months; *Dormant* = 12–36 months; *Unmaintained* = no release for over 3 years.

| Gem | Latest release | Status |
|-----|----------------|--------|
| [fedipub](#fedipub-formerly-federails) (formerly `federails`) | 0.10.0 (2026-09-22) | Active |
| [linzer](#linzer) | 0.8.1 (2026-08-25) | Active |
| [json-ld](#json-ld) | 3.3.2 (2024-07-29; commits 2026-06) | Active |
| [webfinger](#webfinger) | 2.1.3 (2023-12-27; commits 2026-09) | Active |
| [http_signatures](#http_signatures) | 1.1.0 (2019-07-22) | Unmaintained |

## Fedipub (formerly Federails)

A Rails engine that adds ActivityPub to an existing Rails application. The project was renamed from Federails to Fedipub; the old `federails` gem (last release 0.8.0, March 2026) points to the same GitLab project.

| Property | Value |
|----------|-------|
| Repository | [gitlab.com/fedipub/fedipub](https://gitlab.com/fedipub/fedipub) |
| gem | `fedipub` |
| License | MIT |

## linzer

An implementation of [RFC 9421 HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421), with Rack middleware for verifying requests and helpers for signing with `Net::HTTP`, the `http` gem and Faraday. Supports Ed25519, ECDSA (P-256/P-384), RSA-PSS, RSASSA-PKCS1-v1_5 (SHA-256), HMAC-SHA256 and post-quantum ML-DSA. Its README notes Mastodon has accepted RFC 9421 signatures since 4.5.

| Property | Value |
|----------|-------|
| Repository | [github.com/nomadium/linzer](https://github.com/nomadium/linzer) |
| gem | `linzer` |
| License | MIT |

linzer implements RFC 9421 only — not the older draft-cavage format that most fediverse servers still send and expect — so pair it with a cavage implementation if you need to talk to everyone. See the [README](https://github.com/nomadium/linzer#readme) for signing and verification examples.

## json-ld

The ruby-rdf JSON-LD processor.

| Property | Value |
|----------|-------|
| Repository | [github.com/ruby-rdf/json-ld](https://github.com/ruby-rdf/json-ld) |
| gem | `json-ld` |

```ruby
require 'json/ld'

expanded  = JSON::LD::API.expand(document)
compacted = JSON::LD::API.compact(expanded, 'https://www.w3.org/ns/activitystreams')
```

## webfinger

WebFinger client by nov.

| Property | Value |
|----------|-------|
| Repository | [github.com/nov/webfinger](https://github.com/nov/webfinger) |
| gem | `webfinger` |

```ruby
require 'webfinger'

resource = WebFinger.discover!('acct:alice@example.com')

ap_link = resource.links.find do |link|
  link['rel'] == 'self' && link['type'] == 'application/activity+json'
end

puts ap_link['href']
```

## http_signatures

99designs' draft-cavage implementation (HMAC and RSA).

:::caution Unmaintained
No release since 2019. Prefer Mastodon's own implementation as a reference, or linzer for RFC 9421.
:::

| Property | Value |
|----------|-------|
| Repository | [github.com/99designs/http-signatures-ruby](https://github.com/99designs/http-signatures-ruby) |
| gem | `http_signatures` |

```ruby
require 'http_signatures'

context = HttpSignatures::Context.new(
  keys: { 'https://example.com/users/alice#main-key' => { private_key: private_key_pem } },
  algorithm: 'rsa-sha256',
  headers: ['(request-target)', 'host', 'date', 'digest'],
)

# `message` is a Net::HTTPRequest with Host, Date and Digest already set
context.signer.sign(message)
```

## Reference: Mastodon

Mastodon is the most widely deployed Ruby ActivityPub implementation and the de facto interop target.

| Property | Value |
|----------|-------|
| Repository | [github.com/mastodon/mastodon](https://github.com/mastodon/mastodon) |
| License | AGPL-3.0 |
| Key paths | `app/lib/activitypub/`, `app/services/activitypub/`, `app/lib/request.rb` |

```
mastodon/
├── app/lib/activitypub/
│   ├── activity.rb              # Base class for inbound activity handlers
│   ├── adapter.rb               # JSON serialization
│   ├── linked_data_signature.rb # LD Signatures
│   └── tag_manager.rb           # Object references
├── app/services/activitypub/
│   ├── process_account_service.rb
│   └── fetch_remote_status_service.rb
└── app/lib/request.rb           # Outgoing signed requests
```

Outgoing requests are signed in [`app/lib/request.rb`](https://github.com/mastodon/mastodon/blob/main/app/lib/request.rb). Mastodon first signs with draft-cavage HTTP Signatures (`perform_cavage_signed_request`); if the remote server rejects that, it retries ("double-knocks") with RFC 9421 HTTP Message Signatures (`perform_rfc9421_signed_request`). Read that file for the exact headers and fallback rules rather than relying on a summary.

## Rails: Serving an Actor

```ruby
class ActorsController < ApplicationController
  def show
    user = User.find_by!(username: params[:username])

    # render json: alone sends application/json, which Mastodon ignores.
    render json: actor_json(user), content_type: 'application/activity+json'
  end

  private

  def actor_json(user)
    {
      '@context' => ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
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

An inbox controller must verify the request signature, the body digest, and that the signing key belongs to the activity's `actor` before acting on anything — see [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).

## Choosing

- **Rails app**: Fedipub.
- **Signatures only**: linzer (RFC 9421) plus a draft-cavage implementation for compatibility.
- **Learning**: read the Mastodon source.

## See Also

- **[Mastodon](/docs/ecosystem/mastodon)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
