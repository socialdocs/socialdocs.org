---
sidebar_position: 16
title: PHP Libraries
description: ActivityPub libraries for PHP
---

# PHP Libraries

PHP libraries for implementing ActivityPub.

## ActivityPub for WordPress

Official WordPress ActivityPub plugin.

| Property | Value |
|----------|-------|
| Repository | [github.com/Automattic/wordpress-activitypub](https://github.com/Automattic/wordpress-activitypub) |
| License | MIT |
| Status | Active |

### Features

- WordPress integration
- Automatic actor creation
- Post federation
- WebFinger support

### Usage

Install via WordPress plugins, then configure in Settings → ActivityPub.

## ActivityPhp

ActivityPub/ActivityStreams library.

| Property | Value |
|----------|-------|
| Repository | [github.com/landrok/activitypub](https://github.com/landrok/activitypub) |
| Packagist | `landrok/activitypub` |
| License | MIT |
| Status | Active |

### Example

```php
use ActivityPhp\Type;
use ActivityPhp\Server\Server;

// Create a Note
$note = Type::create('Note', [
    'id' => 'https://example.com/notes/123',
    'content' => 'Hello from PHP!',
    'attributedTo' => 'https://example.com/users/alice'
]);

echo json_encode($note->toArray(), JSON_PRETTY_PRINT);
```

### Server Implementation

```php
use ActivityPhp\Server\Server;

$server = new Server([
    'instance' => [
        'host' => 'example.com',
        'port' => 443,
    ],
    'actor' => [
        'preferredUsername' => 'alice'
    ]
]);

// Handle incoming activity
$server->inbox()->handle($request);
```

## Pixelfed Source

Reference for Laravel-based implementation.

| Property | Value |
|----------|-------|
| Repository | [github.com/pixelfed/pixelfed](https://github.com/pixelfed/pixelfed) |
| Key Paths | `app/Util/ActivityPub/`, `app/Services/` |

### Notable Patterns

```
pixelfed/
├── app/Util/ActivityPub/
│   ├── Inbox.php          # Inbox handling
│   ├── Outbox.php         # Outbox handling
│   ├── HttpSignature.php  # Signing
│   └── Helpers.php        # Utilities
├── app/Services/
│   └── ActivityPubFetchService.php
```

## phpseclib

RSA cryptography for HTTP Signatures.

| Property | Value |
|----------|-------|
| Repository | [github.com/phpseclib/phpseclib](https://github.com/phpseclib/phpseclib) |
| Packagist | `phpseclib/phpseclib` |
| Status | Active |

### HTTP Signature Signing

```php
use phpseclib3\Crypt\RSA;

function signRequest($privateKeyPem, $keyId, $method, $path, $headers, $body) {
    $privateKey = RSA::loadPrivateKey($privateKeyPem);

    // Build signing string
    $signingParts = [];
    $signingParts[] = "(request-target): " . strtolower($method) . " " . $path;
    $signingParts[] = "host: " . $headers['Host'];
    $signingParts[] = "date: " . $headers['Date'];
    $signingParts[] = "digest: SHA-256=" . base64_encode(hash('sha256', $body, true));

    $signingString = implode("\n", $signingParts);

    // Sign
    $signature = $privateKey->sign($signingString);

    return sprintf(
        'keyId="%s",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="%s"',
        $keyId,
        base64_encode($signature)
    );
}
```

## json-ld (PHP)

JSON-LD processor.

| Property | Value |
|----------|-------|
| Repository | [github.com/lanthaler/JsonLD](https://github.com/lanthaler/JsonLD) |
| Packagist | `ml/json-ld` |
| Status | Stable |

### Example

```php
use ML\JsonLD\JsonLD;

// Expand
$expanded = JsonLD::expand($document);

// Compact
$compacted = JsonLD::compact(
    $expanded,
    'https://www.w3.org/ns/activitystreams'
);
```

## Laravel Integration

### Actor Controller

```php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ActorController extends Controller
{
    public function show($username)
    {
        $user = User::where('username', $username)->firstOrFail();

        return response()->json([
            '@context' => [
                'https://www.w3.org/ns/activitystreams',
                'https://w3id.org/security/v1'
            ],
            'type' => 'Person',
            'id' => route('actor', $username),
            'preferredUsername' => $user->username,
            'inbox' => route('inbox', $username),
            'outbox' => route('outbox', $username),
            'publicKey' => [
                'id' => route('actor', $username) . '#main-key',
                'owner' => route('actor', $username),
                'publicKeyPem' => $user->public_key
            ]
        ], 200, [
            'Content-Type' => 'application/activity+json'
        ]);
    }
}
```

### Inbox Handler

```php
public function inbox(Request $request, $username)
{
    // Verify HTTP Signature
    $this->verifySignature($request);

    $activity = json_decode($request->getContent(), true);

    switch ($activity['type']) {
        case 'Follow':
            $this->handleFollow($activity);
            break;
        case 'Create':
            $this->handleCreate($activity);
            break;
        case 'Undo':
            $this->handleUndo($activity);
            break;
    }

    return response('', 202);
}
```

## Comparison

| Library | Framework | Completeness |
|---------|-----------|--------------|
| ActivityPub for WordPress | WordPress | Plugin |
| ActivityPhp | Any | Comprehensive |
| Pixelfed source | Laravel | Reference |

## Recommendations

**For WordPress**: Use the official plugin.

**For Laravel**: Study Pixelfed patterns.

**For other PHP**: Use ActivityPhp.

## See Also

- **[Pixelfed](/docs/ecosystem/pixelfed)**
- **[Libraries Overview](/docs/ecosystem/libraries-overview)**

