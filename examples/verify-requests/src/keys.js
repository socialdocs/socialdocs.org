// Resolve a signature's keyId to a public key AND the actor that owns it.
//
// The owner is what you compare with `activity.actor`. Never trust a key
// document's `owner`/`controller` on its own: an attacker can publish a key
// claiming any owner. The owner's actor document must list the key itself.
import crypto from 'node:crypto';

export class KeyResolutionError extends Error {}

const stripFragment = (u) => u.split('#')[0];
const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const idOf = (v) => (typeof v === 'string' ? v : v && v.id);

// --- FEP-521a Multikey (publicKeyMultibase) --------------------------------

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58btcDecode(str) {
  let n = 0n;
  for (const ch of str) {
    const i = B58.indexOf(ch);
    if (i < 0) throw new KeyResolutionError('Invalid base58 character');
    n = n * 58n + BigInt(i);
  }
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n & 0xffn)); n >>= 8n; }
  for (const ch of str) { if (ch === '1') bytes.unshift(0); else break; }
  return Buffer.from(bytes);
}

export function multikeyToKeyObject(publicKeyMultibase) {
  if (!publicKeyMultibase.startsWith('z')) {
    throw new KeyResolutionError('Only base58btc (z) multibase is supported');
  }
  const bytes = base58btcDecode(publicKeyMultibase.slice(1));
  // Multicodec prefixes: ed25519-pub = 0xed (varint ed 01),
  // rsa-pub = 0x1205 (varint 85 24, PKCS#1 DER).
  if (bytes[0] === 0xed && bytes[1] === 0x01) {
    const x = bytes.subarray(2);
    if (x.length !== 32) throw new KeyResolutionError('Bad Ed25519 key length');
    return crypto.createPublicKey({
      key: { kty: 'OKP', crv: 'Ed25519', x: x.toString('base64url') },
      format: 'jwk',
    });
  }
  if (bytes[0] === 0x85 && bytes[1] === 0x24) {
    return crypto.createPublicKey({ key: bytes.subarray(2), format: 'der', type: 'pkcs1' });
  }
  throw new KeyResolutionError('Unsupported multikey type');
}

/** Find `keyId` among an actor's publicKey and assertionMethod entries. */
export function findKeyInActor(actor, keyId) {
  for (const k of asArray(actor.publicKey)) {
    if (k && typeof k === 'object' && k.id === keyId && k.publicKeyPem) {
      if (idOf(k.owner) !== actor.id) return null;
      return crypto.createPublicKey(k.publicKeyPem);
    }
  }
  for (const k of asArray(actor.assertionMethod)) {
    if (k && typeof k === 'object' && k.id === keyId && k.publicKeyMultibase) {
      if (idOf(k.controller) !== actor.id) return null;
      return multikeyToKeyObject(k.publicKeyMultibase);
    }
  }
  return null;
}

/**
 * Fetch the key and its owner.
 * @param {string} keyId
 * @param {(url: string) => Promise<{url: string, json: object}>} fetchJson
 *   An SSRF-safe fetcher such as safeFetchJson.
 * @returns {Promise<{keyId: string, actorId: string, publicKey: crypto.KeyObject}>}
 */
export async function resolveKey(keyId, fetchJson) {
  const first = await fetchJson(stripFragment(keyId));
  let actor;

  if (first.json.id === stripFragment(keyId) && !first.json.owner && !first.json.controller) {
    // keyId is a fragment of the actor document (the Mastodon `#main-key` style).
    actor = first.json;
    assertServedFromOwnOrigin(actor, first.url);
  } else if (first.json.id === keyId && (first.json.owner || first.json.controller)) {
    // keyId is a standalone key document. Fetch the claimed owner and make
    // sure the owner lists this key: a key cannot vouch for itself.
    assertServedFromOwnOrigin(first.json, first.url);
    const ownerId = idOf(first.json.owner || first.json.controller);
    const second = await fetchJson(ownerId);
    actor = second.json;
    if (actor.id !== ownerId) throw new KeyResolutionError('Owner document id mismatch');
    assertServedFromOwnOrigin(actor, second.url);
  } else if (first.json.id !== keyId && findKeyInActor(first.json, keyId)) {
    // keyId is served as a stub of its owner (GoToSocial: .../users/x/main-key
    // returns { id: .../users/x, publicKey }). The stub only names the owner;
    // fetch the full owner document and require that it lists the key.
    assertServedFromOwnOrigin(first.json, first.url);
    const ownerId = first.json.id;
    const second = await fetchJson(ownerId);
    actor = second.json;
    if (actor.id !== ownerId) throw new KeyResolutionError('Owner document id mismatch');
    assertServedFromOwnOrigin(actor, second.url);
  } else {
    throw new KeyResolutionError(`Document at ${keyId} is neither the key nor its owner`);
  }

  const publicKey = findKeyInActor(actor, keyId);
  if (!publicKey) throw new KeyResolutionError(`Actor ${actor.id} does not list key ${keyId}`);
  return { keyId, actorId: actor.id, publicKey };
}

// A document is only authoritative for ids on the origin it was served from
// (after redirects). Otherwise evil.example could serve a "victim" actor.
function assertServedFromOwnOrigin(doc, servedFrom) {
  if (typeof doc.id !== 'string' || new URL(doc.id).origin !== new URL(servedFrom).origin) {
    throw new KeyResolutionError(`Document id ${doc.id} does not match origin of ${servedFrom}`);
  }
}

/**
 * A tiny key cache with the "refetch once" behaviour remote servers rely on
 * for key rotation: a cached key that fails verification is refreshed once.
 */
export class KeyStore {
  constructor(fetchJson) {
    this.fetchJson = fetchJson;
    this.cache = new Map();
  }

  async get(keyId, { refresh = false } = {}) {
    if (!refresh && this.cache.has(keyId)) return { ...this.cache.get(keyId), cached: true };
    const key = await resolveKey(keyId, this.fetchJson);
    this.cache.set(keyId, key);
    return { ...key, cached: false };
  }
}
