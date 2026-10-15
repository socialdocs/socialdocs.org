// Signed delivery of activities to remote inboxes.
//
// Inbox URLs come from remote actor documents, so they are attacker-chosen:
// resolve the host, refuse private addresses and connect to exactly the
// address we checked (the same SSRF rules as for fetching keys).
import https from 'node:https';
import { signCavage, signRfc9421, resolveAddress } from '../../verify-requests/src/index.js';

function post({ url, address, headers, body, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { ...headers, 'content-length': body.length },
      timeout: timeoutMs,
      lookup: (_host, opts, cb) => (opts && opts.all
        ? cb(null, [{ address: address.address, family: address.family }])
        : cb(null, address.address, address.family)),
    }, (res) => {
      res.resume(); // we only need the status
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('timeout', () => req.destroy(new Error(`Timed out delivering to ${url}`)));
    req.on('error', reject);
    req.end(body);
  });
}

/**
 * Deliver one activity to one inbox. Signs with draft-cavage first (what
 * most servers verify) and retries once with RFC 9421 when the receiver
 * answers 400 or 401, which is how Mastodon 4.7 "double-knocks".
 * Returns the final HTTP status.
 */
export function makeDeliver({ keyId, privateKey, allowPrivateAddresses = false, timeoutMs = 10_000, send = post }) {
  return async function deliver(inbox, activity) {
    const url = new URL(inbox);
    if (url.protocol !== 'https:') throw new Error(`Refusing to deliver to ${url.protocol} inbox`);
    const address = await resolveAddress(url.hostname, { allowPrivateAddresses });
    const body = Buffer.from(JSON.stringify(activity));
    const base = {
      'content-type': 'application/activity+json',
      'user-agent': 'socialdocs-first-server/1.0 (+https://socialdocs.org)',
    };
    const status = await send({
      url, address, body, timeoutMs,
      headers: { ...base, ...signCavage({ url: url.href, body, keyId, privateKey }) },
    });
    if (status !== 400 && status !== 401) return status;
    return send({
      url, address, body, timeoutMs,
      headers: { ...base, ...signRfc9421({ url: url.href, body, keyId, privateKey }) },
    });
  };
}
