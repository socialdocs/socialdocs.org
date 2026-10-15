// SSRF-safe fetching of remote ActivityPub documents (actors, keys).
//
// Every URL we fetch while verifying a request (keyId, actor) is chosen by
// the sender, so it must never reach internal services. This module:
//   - only allows https: (http: optionally, for local development)
//   - resolves DNS itself and rejects private, loopback, link-local,
//     multicast and other special-purpose addresses (IPv4 and IPv6,
//     including IPv4-mapped and NAT64 forms)
//   - connects to the exact address it validated (no second DNS lookup,
//     so DNS rebinding cannot swap in a private address)
//   - follows redirects manually, re-validating every hop
//   - caps response size and total time
//   - requires an ActivityPub Content-Type (FEP-fe34; Mastodon CVE-2024-25623:
//     a JSON file uploaded as media must not be accepted as an actor)
import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

export class UnsafeUrlError extends Error {}

// Separate lists: a BlockList also matches IPv4 addresses against IPv6
// rules (as IPv4-mapped), which would make ::/96 block everything.
const blocked4 = new net.BlockList();
const blocked6 = new net.BlockList();
for (const [addr, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked4.addSubnet(addr, prefix, 'ipv4');
for (const [addr, prefix] of [
  ['::', 96],          // unspecified, loopback and IPv4-compatible
  ['::ffff:0:0', 96],  // IPv4-mapped (also checked as IPv4 below)
  ['64:ff9b::', 96], ['64:ff9b:1::', 48], // NAT64
  ['100::', 64], ['2001::', 23], ['2001:db8::', 32], ['2002::', 16],
  ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
]) blocked6.addSubnet(addr, prefix, 'ipv6');

export function isActivityPubContentType(value = '') {
  const [type, ...params] = String(value).toLowerCase().split(';').map((s) => s.trim());
  if (type === 'application/activity+json') return true;
  return type === 'application/ld+json' &&
    params.some((p) => p.replace(/\s/g, '') === 'profile="https://www.w3.org/ns/activitystreams"');
}

/** True if the address must never be fetched. */
export function isBlockedAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return blocked4.check(address, 'ipv4');
  if (family !== 6) return true;
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return blocked4.check(mapped[1], 'ipv4');
  return blocked6.check(address, 'ipv6');
}

async function resolvePublic(hostname, lookup) {
  const host = hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(host)
    ? [{ address: host, family: net.isIP(host) }]
    : await lookup(host, { all: true, verbatim: true });
  if (addresses.length === 0) throw new UnsafeUrlError(`No addresses for ${host}`);
  // Reject if *any* address is private: an attacker controls which one a
  // client library would pick.
  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      throw new UnsafeUrlError(`Refusing to fetch ${host}: ${address} is not a public address`);
    }
  }
  return addresses[0];
}

// Default transport: node:https / node:http, pinned to the validated address.
function nodeTransport({ url, address, headers, timeoutMs, maxBytes }) {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(url, {
      method: 'GET',
      headers,
      timeout: timeoutMs,
      // Connect to the address we already validated.
      lookup: (_host, opts, cb) =>
        opts && opts.all
          ? cb(null, [{ address: address.address, family: address.family }])
          : cb(null, address.address, address.family),
    }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxBytes) {
          req.destroy(new UnsafeUrlError(`Response larger than ${maxBytes} bytes`));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks),
      }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error(`Timed out after ${timeoutMs} ms`)));
    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetch a URL and return its parsed JSON body, refusing anything unsafe.
 * `lookup` and `transport` are injectable for tests.
 */
export async function safeFetchJson(rawUrl, {
  accept = 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
  headers = {},
  // Some servers (e.g. lemmy.ml) drop requests without a User-Agent.
  userAgent = 'socialdocs-verify-requests/1.0 (+https://socialdocs.org)',
  allowHttp = false,
  maxRedirects = 3,
  maxBytes = 1024 * 1024, // Mastodon's HTTP client also defaults to a 1 MB body limit
  timeoutMs = 10_000,
  lookup = dns.lookup,
  transport = nodeTransport,
  // Servers in "secure mode" / authorized fetch (e.g. mastodon.social)
  // answer 401 to unsigned GETs. Pass a function that returns signature
  // headers for your instance actor, e.g.
  //   ({ url }) => signCavage({ method: 'GET', url, keyId, privateKey })
  signRequest,
} = {}) {
  let url = new URL(rawUrl);
  const deadline = Date.now() + timeoutMs;
  for (let hop = 0; ; hop++) {
    if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
      throw new UnsafeUrlError(`Refusing scheme ${url.protocol}`);
    }
    if (url.username || url.password) throw new UnsafeUrlError('Refusing URL with credentials');
    const address = await resolvePublic(url.hostname, lookup);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error(`Timed out after ${timeoutMs} ms`);

    const res = await transport({
      url, address, timeoutMs: remaining, maxBytes,
      headers: {
        'user-agent': userAgent,
        ...headers,
        ...(signRequest ? await signRequest({ method: 'GET', url: url.href }) : {}),
        accept,
      },
    });
    if (res.body && res.body.length > maxBytes) {
      throw new UnsafeUrlError(`Response larger than ${maxBytes} bytes`);
    }
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      if (hop >= maxRedirects) throw new UnsafeUrlError('Too many redirects');
      const location = res.headers.location;
      if (!location) throw new Error('Redirect without Location');
      url = new URL(location, url); // re-validated at the top of the loop
      continue;
    }
    if (res.status !== 200) {
      const err = new Error(`GET ${url} returned ${res.status}`);
      err.status = res.status;
      throw err;
    }
    if (!isActivityPubContentType(res.headers['content-type'])) {
      throw new UnsafeUrlError(`Unexpected Content-Type ${res.headers['content-type']} from ${url}`);
    }
    return { url: url.href, json: JSON.parse(res.body.toString('utf8')) };
  }
}
