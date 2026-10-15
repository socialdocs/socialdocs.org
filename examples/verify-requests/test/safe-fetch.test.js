import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeFetchJson, isBlockedAddress } from '../src/safe-fetch.js';

const lookupFrom = (table) => async (host) => {
  if (!(host in table)) throw new Error(`ENOTFOUND ${host}`);
  return table[host].map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));
};
const ok = (doc, type = 'application/activity+json') =>
  ({ status: 200, headers: { 'content-type': type }, body: Buffer.from(JSON.stringify(doc)) });

test('blocks private, loopback, link-local and mapped addresses', () => {
  for (const a of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '::1', '::', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1',
    '::ffff:10.0.0.1', '::10.0.0.1', '64:ff9b::a00:1', 'ff02::1']) {
    assert.equal(isBlockedAddress(a), true, a);
  }
  for (const a of ['93.184.215.14', '2606:4700::6810:84e5']) assert.equal(isBlockedAddress(a), false, a);
});

test('fetches a public URL and connects to the validated address', async () => {
  let connectedTo;
  const res = await safeFetchJson('https://sender.example/users/alice', {
    lookup: lookupFrom({ 'sender.example': ['93.184.215.14'] }),
    transport: async ({ address }) => { connectedTo = address.address; return ok({ id: 'x' }); },
  });
  assert.equal(res.json.id, 'x');
  assert.equal(connectedTo, '93.184.215.14');
});

test('rejects a keyId host that resolves to a private address', async () => {
  let called = false;
  await assert.rejects(safeFetchJson('https://evil.example/key', {
    lookup: lookupFrom({ 'evil.example': ['10.0.0.5'] }),
    transport: async () => { called = true; return ok({}); },
  }), /not a public address/);
  assert.equal(called, false);
});

test('rejects if any resolved address is private', async () => {
  await assert.rejects(safeFetchJson('https://mixed.example/', {
    lookup: lookupFrom({ 'mixed.example': ['93.184.215.14', '127.0.0.1'] }),
    transport: async () => ok({}),
  }), /not a public address/);
});

test('rejects literal private IPs, IPv6 and IPv4-mapped included', async () => {
  for (const url of ['https://127.0.0.1/', 'https://[::1]/', 'https://[::ffff:169.254.169.254]/']) {
    await assert.rejects(safeFetchJson(url, { transport: async () => ok({}) }), /not a public address/, url);
  }
});

test('re-validates every redirect hop', async () => {
  await assert.rejects(safeFetchJson('https://sender.example/users/alice', {
    lookup: lookupFrom({ 'sender.example': ['93.184.215.14'], 'internal.example': ['192.168.0.10'] }),
    transport: async ({ url }) => url.hostname === 'sender.example'
      ? { status: 302, headers: { location: 'https://internal.example/admin' }, body: Buffer.alloc(0) }
      : ok({}),
  }), /not a public address/);
});

test('refuses non-https schemes and credentials in URLs', async () => {
  await assert.rejects(safeFetchJson('http://sender.example/'), /scheme/);
  await assert.rejects(safeFetchJson('file:///etc/passwd'), /scheme/);
  await assert.rejects(safeFetchJson('https://user:pw@sender.example/'), /credentials/);
});

test('caps response size', async () => {
  await assert.rejects(safeFetchJson('https://sender.example/', {
    maxBytes: 100,
    lookup: lookupFrom({ 'sender.example': ['93.184.215.14'] }),
    transport: async () => ({ status: 200, headers: { 'content-type': 'application/activity+json' }, body: Buffer.alloc(101, 0x20) }),
  }), /larger than/);
});

test('limits redirect chains', async () => {
  await assert.rejects(safeFetchJson('https://loop.example/0', {
    lookup: lookupFrom({ 'loop.example': ['93.184.215.14'] }),
    transport: async ({ url }) => ({ status: 302, headers: { location: `${url.href}x` }, body: Buffer.alloc(0) }),
  }), /Too many redirects/);
});

test('signs each request (including redirect hops) when signRequest is given', async () => {
  const signedUrls = [];
  await safeFetchJson('https://a.example/x', {
    lookup: lookupFrom({ 'a.example': ['93.184.215.14'], 'b.example': ['93.184.215.15'] }),
    signRequest: async ({ url }) => { signedUrls.push(url); return { signature: 'sig' }; },
    transport: async ({ url, headers }) => {
      assert.equal(headers.signature, 'sig');
      return url.hostname === 'a.example'
        ? { status: 301, headers: { location: 'https://b.example/y' }, body: Buffer.alloc(0) }
        : ok({});
    },
  });
  assert.deepEqual(signedUrls, ['https://a.example/x', 'https://b.example/y']);
});

test('requires an ActivityPub Content-Type (CVE-2024-25623 class)', async () => {
  const opts = (type) => ({
    lookup: lookupFrom({ 'cdn.example': ['93.184.215.14'] }),
    transport: async () => ok({ id: 'https://cdn.example/x' }, type),
  });
  await assert.rejects(safeFetchJson('https://cdn.example/x', opts('application/json')), /Content-Type/);
  await assert.rejects(safeFetchJson('https://cdn.example/x', opts('text/plain')), /Content-Type/);
  await safeFetchJson('https://cdn.example/x', opts('application/activity+json; charset=utf-8'));
  await safeFetchJson('https://cdn.example/x', opts('application/ld+json; profile="https://www.w3.org/ns/activitystreams"'));
});

test('allowPrivateAddresses opts in to private networks (tests/dev only)', async () => {
  const res = await safeFetchJson('https://ap.test/users/tester', {
    lookup: lookupFrom({ 'ap.test': ['172.30.0.10'] }),
    transport: async () => ok({ id: 'https://ap.test/users/tester' }),
    allowPrivateAddresses: true,
  });
  assert.equal(res.json.id, 'https://ap.test/users/tester');
});

test('resolveAddress blocks private addresses by default', async () => {
  const { resolveAddress } = await import('../src/safe-fetch.js');
  await assert.rejects(resolveAddress('ap.test', { lookup: lookupFrom({ 'ap.test': ['10.0.0.1'] }) }), /not a public address/);
  const ok4 = await resolveAddress('pub.example', { lookup: lookupFrom({ 'pub.example': ['93.184.215.14'] }) });
  assert.equal(ok4.address, '93.184.215.14');
});
