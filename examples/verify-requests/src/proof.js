// FEP-8b32 Object Integrity Proofs with the eddsa-jcs-2022 cryptosuite.
//
// https://codeberg.org/fediverse/fep/src/branch/main/fep/8b32/fep-8b32.md
// https://www.w3.org/TR/vc-di-eddsa/#eddsa-jcs-2022
//
// A proof travels with the object, so it can be checked after relaying or
// inbox forwarding, when the HTTP signature belongs to someone else.
import crypto from 'node:crypto';
import { resolveKey, base58btcDecode } from './keys.js';
import { ownerOf } from './origin.js';

export class ProofError extends Error {}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58btcEncode(bytes) {
  let n = BigInt(`0x${Buffer.from(bytes).toString('hex') || '0'}`);
  let out = '';
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b === 0) out = `1${out}`; else break; }
  return out;
}

/**
 * JSON Canonicalization Scheme (RFC 8785) for values produced by JSON.parse.
 * JSON.stringify already serialises strings and numbers the way RFC 8785
 * requires; JCS adds key ordering by UTF-16 code units (the default sort).
 */
export function jcs(value) {
  if (Array.isArray(value)) return `[${value.map(jcs).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort()
      .filter((k) => value[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${jcs(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest();

function without(obj, key) {
  const { [key]: _removed, ...rest } = obj;
  return rest;
}

// proofConfigHash || transformedDocumentHash (vc-di-eddsa §3.3.4)
function hashData(unsecured, proofOptions) {
  return Buffer.concat([sha256(jcs(proofOptions)), sha256(jcs(unsecured))]);
}

// vc-di-eddsa §3.3.2 steps 4.1-4.2: the proof's @context must be a prefix of
// the document's, and then replaces it.
function applyProofContext(unsecured, proofOptions) {
  if (proofOptions['@context'] === undefined) return unsecured;
  const docCtx = Array.isArray(unsecured['@context']) ? unsecured['@context'] : [unsecured['@context']];
  const proofCtx = Array.isArray(proofOptions['@context']) ? proofOptions['@context'] : [proofOptions['@context']];
  if (proofCtx.some((c, i) => jcs(c) !== jcs(docCtx[i]))) {
    throw new ProofError('Proof @context is not a prefix of the document @context');
  }
  return { ...unsecured, '@context': proofOptions['@context'] };
}

/** Low-level check: does `document.proof` verify against `publicKey`? */
export function verifyEddsaJcs2022(document, publicKey) {
  const proof = document.proof;
  if (!proof || proof.type !== 'DataIntegrityProof' || proof.cryptosuite !== 'eddsa-jcs-2022') {
    throw new ProofError('Not an eddsa-jcs-2022 DataIntegrityProof');
  }
  if (typeof proof.proofValue !== 'string' || !proof.proofValue.startsWith('z')) {
    throw new ProofError('proofValue must be base58btc multibase');
  }
  const proofOptions = without(proof, 'proofValue');
  const unsecured = applyProofContext(without(document, 'proof'), proofOptions);
  const signature = base58btcDecode(proof.proofValue.slice(1));
  return crypto.verify(null, hashData(unsecured, proofOptions), publicKey, signature);
}

/** Add an eddsa-jcs-2022 proof (for outbound objects and for tests). */
export function signEddsaJcs2022(document, { privateKey, verificationMethod, created }) {
  const proofOptions = {
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-jcs-2022',
    verificationMethod,
    proofPurpose: 'assertionMethod',
    created,
  };
  if (document['@context'] !== undefined) proofOptions['@context'] = document['@context'];
  const unsecured = without(document, 'proof');
  const signature = crypto.sign(null, hashData(unsecured, proofOptions), privateKey);
  return { ...unsecured, proof: { ...proofOptions, proofValue: `z${base58btcEncode(signature)}` } };
}

/**
 * Verify an object's FEP-8b32 proof and return its authenticated owner.
 *
 * - drops a legacy LD `signature` first (FEP-8b32 "Backward compatibility")
 * - requires proofPurpose assertionMethod and an unexpired proof
 * - resolves verificationMethod through the controller's actor document,
 *   which must list it under assertionMethod (FEP-521a) — never trust the
 *   key document alone
 * - requires the key's controller to be the object's owner (FEP-fe34)
 *
 * @param {object} object - the received JSON (activity or object)
 * @param {(url: string) => Promise<{url: string, json: object}>} fetchJson - SSRF-safe fetcher
 * @returns {Promise<{owner: string, keyId: string}>}
 */
export async function verifyObjectProof(object, fetchJson, { now = Date.now() } = {}) {
  const document = without(object, 'signature');
  const proof = document.proof;
  if (!proof || typeof proof !== 'object' || Array.isArray(proof)) {
    throw new ProofError('Missing proof (or more than one)');
  }
  if (proof.proofPurpose !== 'assertionMethod') throw new ProofError('proofPurpose must be assertionMethod');
  if (proof.expires && Date.parse(proof.expires) <= now) throw new ProofError('Proof has expired');
  if (typeof proof.verificationMethod !== 'string') throw new ProofError('Missing verificationMethod');

  const { actorId, publicKey } = await resolveKey(proof.verificationMethod, fetchJson);
  if (!verifyEddsaJcs2022(document, publicKey)) throw new ProofError('Proof verification failed');

  const owner = ownerOf(document);
  if (owner !== actorId) {
    throw new ProofError(`Proof was made by ${actorId}, but the object belongs to ${owner}`);
  }
  return { owner, keyId: proof.verificationMethod };
}
