---
sidebar_position: 16
title: PHP Libraries
description: ActivityPub libraries for PHP
---

# PHP Libraries

PHP libraries for implementing ActivityPub.

Status and versions below were taken from Packagist, WordPress.org and GitHub on **2026-10-15**. *Active* = a release or commit in the last 12 months; *Dormant* = 12–36 months.

| Library | Latest release | Status |
|---------|----------------|--------|
| [ActivityPub for WordPress](#activitypub-for-wordpress) | 9.3.1 (2026-09-02) | Active |
| [phpseclib](#phpseclib) | 4.0.2 (2026-10-07); 3.0.57 (2026-08-26) | Active |
| [ActivityPhp](#activityphp) (`landrok/activitypub`) | 0.8.1 (2025-10-16) | Active |
| [ml/json-ld](#mljson-ld) | 1.2.1 (2022-09-29; last commit 2025-09) | Dormant |

## ActivityPub for WordPress

The ActivityPub plugin for WordPress, developed by Automattic. Turns a WordPress site (and optionally each author) into fediverse actors, federates posts, and receives replies; recent versions also support two-way interactions and a client API.

| Property | Value |
|----------|-------|
| Repository | [github.com/Automattic/wordpress-activitypub](https://github.com/Automattic/wordpress-activitypub) |
| Plugin | [wordpress.org/plugins/activitypub](https://wordpress.org/plugins/activitypub/) |
| License | MIT |

Install it from the WordPress plugin directory and configure it under Settings → ActivityPub.

## ActivityPhp

ActivityStreams types and an ActivityPub server/client toolkit.

| Property | Value |
|----------|-------|
| Repository | [github.com/landrok/activitypub](https://github.com/landrok/activitypub) |
| Packagist | `landrok/activitypub` |
| Documentation | [landrok.github.io/activitypub](https://landrok.github.io/activitypub) |
| License | MIT |

```php
use ActivityPhp\Type;

$note = Type::create('Note', [
    'id' => 'https://example.com/notes/123',
    'content' => 'Hello from PHP!',
    'attributedTo' => 'https://example.com/users/alice',
]);

echo json_encode($note->toArray(), JSON_PRETTY_PRINT);
```

```php
use ActivityPhp\Server;

$server = new Server();

// WebFinger lookup through the server instance
$webfinger = $server->actor('bob@example.org')->webfinger();
print_r($webfinger->toArray());
```

See the documentation for [server configuration](https://landrok.github.io/activitypub/activitypub-server-usage.html) and [verifying HTTP signatures](https://landrok.github.io/activitypub/activitypub-server-verify-http-signatures.html).

## phpseclib

Pure-PHP cryptography, commonly used for RSA HTTP Signatures. The 4.x line uses the `phpseclib4` namespace; the 3.x line (`phpseclib3`) is still maintained.

| Property | Value |
|----------|-------|
| Repository | [github.com/phpseclib/phpseclib](https://github.com/phpseclib/phpseclib) |
| Packagist | `phpseclib/phpseclib` |

### Signing a draft-cavage HTTP Signature (phpseclib 3.x)

```php
use phpseclib3\Crypt\RSA;

function signRequest(string $privateKeyPem, string $keyId, string $method, string $pathAndQuery, array $headers): string
{
    // phpseclib defaults to PSS padding; rsa-sha256 HTTP Signatures need PKCS#1 v1.5.
    $privateKey = RSA::loadPrivateKey($privateKeyPem)
        ->withPadding(RSA::SIGNATURE_PKCS1)
        ->withHash('sha256');

    // $headers['Digest'] must already be "SHA-256=" . base64 of the exact body bytes.
    $signingString = implode("\n", [
        '(request-target): ' . strtolower($method) . ' ' . $pathAndQuery,
        'host: ' . $headers['Host'],
        'date: ' . $headers['Date'],
        'digest: ' . $headers['Digest'],
    ]);

    return sprintf(
        'keyId="%s",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="%s"',
        $keyId,
        base64_encode($privateKey->sign($signingString))
    );
}
```

## ml/json-ld

JSON-LD processor for PHP.

| Property | Value |
|----------|-------|
| Repository | [github.com/lanthaler/JsonLD](https://github.com/lanthaler/JsonLD) |
| Packagist | `ml/json-ld` |

```php
use ML\JsonLD\JsonLD;

$expanded  = JsonLD::expand($document);
$compacted = JsonLD::compact($expanded, 'https://www.w3.org/ns/activitystreams');
```

## Reference: Pixelfed

Pixelfed is a large Laravel ActivityPub server and a good reference for PHP.

| Property | Value |
|----------|-------|
| Repository | [github.com/pixelfed/pixelfed](https://github.com/pixelfed/pixelfed) |
| Key paths | `app/Util/ActivityPub/`, `app/Services/` |

```
pixelfed/
├── app/Util/ActivityPub/
│   ├── Inbox.php          # Inbox handling
│   ├── Outbox.php         # Outbox handling
│   ├── HttpSignature.php  # Signing and verification
│   └── Helpers.php        # Utilities
└── app/Services/
    └── ActivityPubFetchService.php
```

## Laravel: Serving an Actor

```php
namespace App\Http\Controllers;

class ActorController extends Controller
{
    public function show(string $username)
    {
        $user = User::where('username', $username)->firstOrFail();
        $id = route('actor', $username);

        return response()->json([
            '@context' => [
                'https://www.w3.org/ns/activitystreams',
                'https://w3id.org/security/v1',
            ],
            'type' => 'Person',
            'id' => $id,
            'preferredUsername' => $user->username,
            'inbox' => route('inbox', $username),
            'outbox' => route('outbox', $username),
            'publicKey' => [
                'id' => $id . '#main-key',
                'owner' => $id,
                'publicKeyPem' => $user->public_key,
            ],
        ], 200, ['Content-Type' => 'application/activity+json']);
    }
}
```

An inbox endpoint must verify the request signature, the body digest, and that the signing key belongs to the activity's `actor` before acting on anything — see [issue #37](https://github.com/socialdocs/socialdocs.org/issues/37).

## Choosing

- **WordPress site**: the ActivityPub plugin.
- **Laravel app**: study Pixelfed's `app/Util/ActivityPub/`.
- **Other PHP**: ActivityPhp.

## See Also

- **[Pixelfed](/docs/ecosystem/pixelfed)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**
