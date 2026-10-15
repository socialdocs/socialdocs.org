// draft-cavage-http-signatures-12: the `Signature` header scheme most of
// the Fediverse still sends. https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12
import crypto from 'node:crypto';

export class SignatureError extends Error {}

/** Parse `keyId="…",algorithm="…",headers="…",signature="…"`. */
export function parseSignatureHeader(value) {
  const params = {};
  const re = /\s*([a-zA-Z]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|(\d+))\s*(?:,|$)/y;
  let m;
  while (re.lastIndex < value.length && (m = re.exec(value))) {
    params[m[1]] = m[2] !== undefined ? m[2].replace(/\\(.)/g, '$1') : m[3];
  }
  if (re.lastIndex !== value.length) throw new SignatureError('Malformed Signature header');
  if (!params.keyId || !params.signature) throw new SignatureError('keyId and signature are required');
  return params;
}

/** The string that was signed, rebuilt from the request as received. */
export function signingString(signedHeaders, { method, url, headers }, params = {}) {
  const u = new URL(url);
  return signedHeaders.map((name) => {
    if (name === '(request-target)') {
      // Path AND query string, exactly as requested.
      return `(request-target): ${method.toLowerCase()} ${u.pathname}${u.search}`;
    }
    if (name === '(created)' || name === '(expires)') {
      const v = params[name.slice(1, -1)];
      if (!v) throw new SignatureError(`${name} signed but parameter missing`);
      return `${name}: ${v}`;
    }
    const value = headers[name];
    if (value === undefined) throw new SignatureError(`Signed header "${name}" is missing`);
    return `${name}: ${Array.isArray(value) ? value.join(', ') : value}`;
  }).join('\n');
}

/**
 * Verify a cavage signature. `headers` must have lower-case names.
 * Returns {keyId, created, expires, signedHeaders}; throws on failure.
 * Call `checkKey(publicKey)` style via the `verifyWith` callback so that the
 * caller can retry with a refreshed key.
 */
export function prepareCavage(req) {
  const params = parseSignatureHeader(req.headers.signature);
  const algorithm = (params.algorithm || 'hs2019').toLowerCase();
  if (!['rsa-sha256', 'hs2019'].includes(algorithm)) {
    throw new SignatureError(`Unsupported algorithm ${algorithm}`);
  }
  const signedHeaders = (params.headers || (algorithm === 'hs2019' ? '(created)' : 'date'))
    .toLowerCase().split(/\s+/).filter(Boolean);

  // Required coverage. Without these an attacker can replay a signature on a
  // different path, host or body.
  const required = ['(request-target)', 'host'];
  if (req.method.toUpperCase() === 'POST') required.push('digest');
  for (const h of required) {
    if (!signedHeaders.includes(h)) throw new SignatureError(`"${h}" must be signed`);
  }
  if (!signedHeaders.includes('date') && !signedHeaders.includes('(created)')) {
    throw new SignatureError('"date" or "(created)" must be signed');
  }

  let created;
  if (algorithm === 'hs2019' && params.created) created = new Date(Number(params.created) * 1000);
  else if (req.headers.date) created = new Date(req.headers.date);
  if (!created || Number.isNaN(created.getTime())) throw new SignatureError('No valid Date/(created)');
  const expires = params.expires ? new Date(Number(params.expires) * 1000) : undefined;

  const data = Buffer.from(signingString(signedHeaders, req, params));
  const signature = Buffer.from(params.signature, 'base64');
  return {
    scheme: 'draft-cavage',
    keyId: params.keyId,
    created,
    expires,
    covers: signedHeaders,
    verify(publicKey) {
      // Ed25519 keys sign the raw string; RSA uses RSASSA-PKCS1-v1_5 SHA-256.
      if (publicKey.asymmetricKeyType === 'ed25519') {
        if (algorithm !== 'hs2019') return false;
        return crypto.verify(null, data, publicKey, signature);
      }
      if (publicKey.asymmetricKeyType !== 'rsa') return false;
      return crypto.verify('sha256', data, publicKey, signature);
    },
  };
}
