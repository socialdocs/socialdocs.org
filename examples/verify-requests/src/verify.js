// Verify an incoming signed ActivityPub request, end to end.
//
//   const signer = await verifyRequest(req, { keyStore });
//   const activity = parseActivityFrom(signer, rawBody);
//
// `req` is { method, url, headers, rawBody }:
//   - url: the full URL as requested, including the query string
//   - headers: lower-cased header names
//   - rawBody: the exact bytes received (a Buffer), never re-serialised JSON
import { checkContentDigest, checkDigest } from './digest.js';
import { prepareCavage, SignatureError } from './cavage.js';
import { prepareRfc9421 } from './rfc9421.js';

export { SignatureError };

// Mastodon's window (app/lib/signed_request.rb): a signature without an
// explicit expiry is valid for 5 minutes after it was created, any expiry is
// capped at 12 hours, and 1 hour of clock skew is tolerated either way.
export const DEFAULT_VALIDITY_MS = 5 * 60 * 1000;
export const MAX_VALIDITY_MS = 12 * 60 * 60 * 1000;
export const CLOCK_SKEW_MS = 60 * 60 * 1000;

export function checkTimeWindow({ created, expires }, now = Date.now()) {
  const c = created.getTime();
  const e = Math.min(expires ? expires.getTime() : c + DEFAULT_VALIDITY_MS, c + MAX_VALIDITY_MS);
  if (c > now + CLOCK_SKEW_MS) throw new SignatureError('Signature created in the future');
  if (now > e + CLOCK_SKEW_MS) throw new SignatureError('Signature expired');
}

/**
 * @returns {Promise<{actorId: string, keyId: string, scheme: string}>}
 * Throws SignatureError (respond 401) or a fetch error (respond 503 so the
 * sender retries later, as Mastodon does since 4.5.4).
 */
export async function verifyRequest(req, { keyStore, now = Date.now() }) {
  const sig = req.headers['signature-input'] ? prepareRfc9421(req) : null;
  const prepared = sig ?? (req.headers.signature ? prepareCavage(req) : null);
  if (!prepared) throw new SignatureError('Request is not signed');

  checkTimeWindow(prepared, now);

  // The body must match the digest that was signed.
  if (req.method.toUpperCase() === 'POST') {
    const ok = prepared.scheme === 'rfc9421'
      ? checkContentDigest(req.headers['content-digest'], req.rawBody)
      : checkDigest(req.headers.digest, req.rawBody);
    if (!ok) throw new SignatureError('Body digest does not match');
  }

  // Verify with the cached key; on failure refetch the key once (the sender
  // may have rotated it) and try again.
  let key = await keyStore.get(prepared.keyId);
  if (!prepared.verify(key.publicKey)) {
    if (!key.cached) throw new SignatureError('Invalid signature');
    key = await keyStore.get(prepared.keyId, { refresh: true });
    if (!prepared.verify(key.publicKey)) throw new SignatureError('Invalid signature');
  }
  return { actorId: key.actorId, keyId: key.keyId, scheme: prepared.scheme };
}

/**
 * Parse the activity from the raw body and require that the verified signer
 * IS the activity's actor. Without this, any server with a valid key can
 * post activities "from" anyone.
 */
export function parseActivityFrom(signer, rawBody) {
  const activity = JSON.parse(rawBody.toString('utf8'));
  const actor = typeof activity.actor === 'string' ? activity.actor : activity.actor?.id;
  if (!actor || actor !== signer.actorId) {
    throw new SignatureError(`Signed by ${signer.actorId} but activity.actor is ${actor}`);
  }
  return activity;
}
