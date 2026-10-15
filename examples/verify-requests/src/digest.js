// Body digests, always computed over the RAW request bytes.
//
// Never recompute a digest from parsed-and-reserialised JSON
// (JSON.stringify(req.body)): key order, whitespace and escaping differ, so
// valid requests fail, and you are no longer checking what was signed.
import crypto from 'node:crypto';
import { parseDictionary } from 'structured-headers';

const sha = (alg, raw) => crypto.createHash(alg).update(raw).digest();

/** Value for the legacy `Digest` header (RFC 3230), used with draft-cavage. */
export function digestHeader(raw) {
  return `SHA-256=${sha('sha256', raw).toString('base64')}`;
}

/** Value for the `Content-Digest` header (RFC 9530), used with RFC 9421. */
export function contentDigestHeader(raw) {
  return `sha-256=:${sha('sha256', raw).toString('base64')}:`;
}

/** Check a `Digest` header against the raw body. Only SHA-256 is accepted. */
export function checkDigest(header, raw) {
  if (!header) return false;
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim().toLowerCase() !== 'sha-256') continue;
    const given = Buffer.from(part.slice(i + 1).trim(), 'base64');
    const actual = sha('sha256', raw);
    return given.length === actual.length && crypto.timingSafeEqual(given, actual);
  }
  return false;
}

/** Check a `Content-Digest` header (sha-256 or sha-512) against the raw body. */
export function checkContentDigest(header, raw) {
  if (!header) return false;
  let dict;
  try { dict = parseDictionary(header); } catch { return false; }
  for (const [alg, hashAlg] of [['sha-256', 'sha256'], ['sha-512', 'sha512']]) {
    const entry = dict.get(alg);
    if (!entry || !(entry[0] instanceof ArrayBuffer)) continue;
    const given = Buffer.from(entry[0]);
    const actual = sha(hashAlg, raw);
    return given.length === actual.length && crypto.timingSafeEqual(given, actual);
  }
  return false;
}
