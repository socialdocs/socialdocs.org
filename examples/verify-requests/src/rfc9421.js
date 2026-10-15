// RFC 9421 HTTP Message Signatures (`Signature-Input` + `Signature`).
// https://www.rfc-editor.org/rfc/rfc9421
import crypto from 'node:crypto';
import { parseDictionary, serializeInnerList } from 'structured-headers';
import { SignatureError } from './cavage.js';

function componentValue(name, params, { method, url, headers }) {
  if (params.size > 0) throw new SignatureError(`Component parameters on "${name}" are not supported`);
  const u = new URL(url);
  switch (name) {
    case '@method': return method.toUpperCase();
    case '@target-uri': return u.href;
    case '@authority': return u.host.toLowerCase();
    case '@scheme': return u.protocol.slice(0, -1);
    case '@path': return u.pathname;
    case '@query': return u.search || '?';
    case '@request-target': return `${u.pathname}${u.search}`;
    default: {
      if (name.startsWith('@')) throw new SignatureError(`Unsupported component ${name}`);
      const value = headers[name];
      if (value === undefined) throw new SignatureError(`Signed field "${name}" is missing`);
      // RFC 9421 §2.1: trim, and join multiple field lines with ", ".
      return (Array.isArray(value) ? value : [value]).map((v) => String(v).trim()).join(', ');
    }
  }
}

/** Build the RFC 9421 §2.5 signature base for one signature. */
export function signatureBase(innerList, req) {
  const [items] = innerList;
  const lines = items.map(([name, params]) =>
    `"${name}": ${componentValue(name, params, req)}`);
  lines.push(`"@signature-params": ${serializeInnerList(innerList)}`);
  return lines.join('\n');
}

/**
 * Parse and prepare verification of an RFC 9421 signature. If several
 * labels are present, the first one is used. Pass `label` to choose.
 */
export function prepareRfc9421(req, { label, requireCoverage = true } = {}) {
  let inputs, sigs;
  try {
    inputs = parseDictionary(req.headers['signature-input']);
    sigs = parseDictionary(req.headers.signature);
  } catch {
    throw new SignatureError('Malformed Signature-Input or Signature');
  }
  const name = label ?? [...inputs.keys()][0];
  const input = inputs.get(name);
  const sig = sigs.get(name);
  if (!input || !sig || !(sig[0] instanceof ArrayBuffer)) {
    throw new SignatureError(`No signature labelled "${name}"`);
  }
  const [items, params] = input;
  const covers = items.map(([n]) => n);

  // ActivityPub policy (matches Mastodon). requireCoverage: false exists only
  // to check the cryptography against the RFC's own test vectors.
  const required = requireCoverage ? ['@method', '@target-uri'] : [];
  if (requireCoverage && req.method.toUpperCase() === 'POST') required.push('content-digest');
  for (const c of required) {
    if (!covers.includes(c)) throw new SignatureError(`"${c}" must be covered`);
  }
  const keyId = params.get('keyid');
  const created = params.get('created');
  if (typeof keyId !== 'string') throw new SignatureError('keyid parameter is required');
  if (typeof created !== 'number') throw new SignatureError('created parameter is required');
  const expires = params.get('expires');
  const alg = params.get('alg'); // optional; otherwise inferred from the key

  const data = Buffer.from(signatureBase(input, req));
  const signature = Buffer.from(sig[0]);
  return {
    scheme: 'rfc9421',
    keyId,
    created: new Date(created * 1000),
    expires: typeof expires === 'number' ? new Date(expires * 1000) : undefined,
    covers,
    verify(publicKey) {
      const type = publicKey.asymmetricKeyType;
      if (type === 'ed25519' && (!alg || alg === 'ed25519')) {
        return crypto.verify(null, data, publicKey, signature);
      }
      if (type === 'rsa' && (!alg || alg === 'rsa-v1_5-sha256')) {
        return crypto.verify('sha256', data, publicKey, signature);
      }
      if ((type === 'rsa' || type === 'rsa-pss') && alg === 'rsa-pss-sha512') {
        return crypto.verify('sha512', data, {
          key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 64,
        }, signature);
      }
      return false;
    },
  };
}
