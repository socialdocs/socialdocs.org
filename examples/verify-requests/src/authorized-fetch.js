// Authorized fetch ("secure mode"): actor and object documents are served
// only to signed GETs, so a server can withhold them from actors and domains
// it blocks.
//
// Both sides need an instance (application) actor: a server-level actor
// whose own document is served WITHOUT a signature. You sign your outgoing
// GETs with its key. If every actor document required a signed GET, two
// servers in this mode could never fetch each other's keys: each would need
// the other's key to verify the very request asking for it.
import { signCavage } from './sign.js';
import { verifyRequest, SignatureError } from './verify.js';

/** The instance actor document, modelled on Mastodon's /actor. */
export function instanceActor({ origin, publicKeyPem }) {
  const id = `${origin}/actor`;
  return {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
    id,
    type: 'Application',
    preferredUsername: new URL(origin).host,
    inbox: `${id}/inbox`,
    outbox: `${id}/outbox`,
    publicKey: { id: `${id}#main-key`, owner: id, publicKeyPem },
    manuallyApprovesFollowers: true,
  };
}

/**
 * FEP-d556: WebFinger answer for `resource=<origin>/`, so other servers can
 * discover the server-level actor.
 */
export function serverActorWebfinger(origin) {
  return {
    subject: `${origin}/`,
    links: [{
      rel: 'https://www.w3.org/ns/activitystreams#Service',
      type: 'application/activity+json',
      href: `${origin}/actor`,
    }],
  };
}

/** FEP-2677: the extra link for /.well-known/nodeinfo. */
export function applicationActorNodeinfoLink(origin) {
  return { rel: 'https://www.w3.org/ns/activitystreams#Application', href: `${origin}/actor` };
}

/**
 * A `signRequest` hook for safeFetchJson: every outgoing GET is signed by
 * the instance actor, as Mastodon does by default (Account.representative).
 */
export function instanceActorSigner({ keyId, privateKey }) {
  return ({ url }) => signCavage({ method: 'GET', url, keyId, privateKey });
}

/**
 * Gate for GET routes that serve actors, objects and collections in
 * authorized-fetch mode. Returns the signer ({ actorId, keyId, scheme });
 * throws SignatureError, which you answer with 401.
 *
 * Never put this in front of the instance actor route itself.
 */
export async function requireSignedFetch(req, { keyStore, now }) {
  if (req.method.toUpperCase() !== 'GET' && req.method.toUpperCase() !== 'HEAD') {
    throw new SignatureError('requireSignedFetch is for GET/HEAD requests');
  }
  return verifyRequest(req, { keyStore, now });
}

/**
 * Response headers for a document whose content depends on who signed the
 * request (e.g. empty for blocked actors). `Vary: Signature` keeps shared
 * caches from mixing signers; because every signature is unique it is also
 * useless as a cache key, so signed responses are marked private.
 * Your own server-side caches must follow the same rule: Mastodon's
 * CVE-2026-25540 cached signer-dependent collections under a key that
 * ignored the signer.
 */
export function signerDependentHeaders({ requestSigned }) {
  return {
    vary: 'Accept, Signature',
    'cache-control': requestSigned ? 'private, no-store' : 'public, max-age=180',
  };
}
