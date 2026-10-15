# verify-requests

Tested reference code for verifying signed ActivityPub requests. It's what
[socialdocs.org/docs/security/verifying-requests](https://socialdocs.org/docs/security/verifying-requests)
shows. The page imports these files directly, so the code you read is the
code that runs in the tests.

- `src/verify.js`: verify an inbound request (draft-cavage or RFC 9421) and bind it to `activity.actor`
- `src/keys.js`: resolve `keyId` to a key and its owner (`publicKey` or FEP-521a Multikey); refetch once on failure
- `src/safe-fetch.js`: SSRF-safe fetching (public IPs only, pinned connection, redirects re-validated, size and time caps, ActivityPub Content-Type)
- `src/origin.js`: FEP-fe34 origin rules for Create, Update, Delete, Undo and Announce
- `src/sign.js`: outbound signing (draft-cavage, plus RFC 9421 for double-knocking)

```sh
npm ci
npm test
```

This is teaching code. Prefer a maintained framework in production (for example
[Fedify](https://fedify.dev/) or
[activitypub-federation-rust](https://github.com/LemmyNet/activitypub-federation-rust)),
and use this module to check what that framework does for you.

License: AGPL-3.0, like the other code samples on socialdocs.org.
