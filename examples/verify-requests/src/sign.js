// Sign outgoing requests the way Mastodon 4.7 does: draft-cavage first,
// and RFC 9421 for the retry when the receiver answers 400/401
// ("double-knocking"; see Mastodon's app/lib/request.rb).
import crypto from 'node:crypto';
import { serializeInnerList } from 'structured-headers';
import { contentDigestHeader, digestHeader } from './digest.js';
import { signatureBase } from './rfc9421.js';

function sign(privateKey, data) {
  return privateKey.asymmetricKeyType === 'ed25519'
    ? crypto.sign(null, data, privateKey)
    : crypto.sign('sha256', data, privateKey);
}

/** Headers for a draft-cavage signed POST (or GET when body is undefined). */
export function signCavage({ method = 'POST', url, body, keyId, privateKey, date = new Date() }) {
  const u = new URL(url);
  const headers = { host: u.host, date: date.toUTCString() };
  const covered = ['(request-target)', 'host', 'date'];
  if (body !== undefined) {
    headers.digest = digestHeader(body);
    covered.push('digest');
  }
  const lines = covered.map((h) => h === '(request-target)'
    ? `(request-target): ${method.toLowerCase()} ${u.pathname}${u.search}`
    : `${h}: ${headers[h]}`);
  const algorithm = privateKey.asymmetricKeyType === 'ed25519' ? 'hs2019' : 'rsa-sha256';
  const signature = sign(privateKey, Buffer.from(lines.join('\n'))).toString('base64');
  headers.signature =
    `keyId="${keyId}",algorithm="${algorithm}",headers="${covered.join(' ')}",signature="${signature}"`;
  return headers;
}

/** Headers for an RFC 9421 signed POST (or GET when body is undefined). */
export function signRfc9421({ method = 'POST', url, body, keyId, privateKey, date = new Date(), label = 'sig1' }) {
  const headers = {};
  const components = ['@method', '@target-uri'];
  if (body !== undefined) {
    headers['content-digest'] = contentDigestHeader(body);
    components.push('content-digest');
  }
  const params = new Map([['created', Math.floor(date.getTime() / 1000)], ['keyid', keyId]]);
  const innerList = [components.map((c) => [c, new Map()]), params];
  const base = signatureBase(innerList, { method, url, headers });
  const signature = sign(privateKey, Buffer.from(base)).toString('base64');
  headers['signature-input'] = `${label}=${serializeInnerList(innerList)}`;
  headers.signature = `${label}=:${signature}:`;
  return headers;
}
