import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  verifyRequest, parseActivityFrom, KeyStore, signCavage, signRfc9421,
} from '../src/index.js';
import { prepareRfc9421 } from '../src/rfc9421.js';

const NOW = Date.parse('2026-10-15T12:00:00Z');
const INBOX = 'https://receiver.example/users/bob/inbox';

const rsa = () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const ed = () => crypto.generateKeyPairSync('ed25519');

function actorDoc(id, keys) {
  return {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
    id,
    type: 'Person',
    inbox: `${id}/inbox`,
    publicKey: keys.rsa ? {
      id: `${id}#main-key`, owner: id,
      publicKeyPem: keys.rsa.export({ type: 'spki', format: 'pem' }),
    } : undefined,
    assertionMethod: keys.multikey ? [{
      id: `${id}#ed25519-key`, type: 'Multikey', controller: id,
      publicKeyMultibase: keys.multikey,
    }] : undefined,
  };
}

// In-memory "network": URL -> document. No real fetches in tests.
function fakeFetch(docs) {
  const calls = [];
  const fetchJson = async (url) => {
    calls.push(url);
    if (!(url in docs)) throw Object.assign(new Error(`404 ${url}`), { status: 404 });
    return { url, json: typeof docs[url] === 'function' ? docs[url]() : docs[url] };
  };
  return { fetchJson, calls };
}

function ed25519Multikey(publicKey) {
  const raw = Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url');
  const bytes = Buffer.concat([Buffer.from([0xed, 0x01]), raw]);
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let n = BigInt('0x' + bytes.toString('hex')); let s = '';
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  return 'z' + s;
}

const ALICE = 'https://sender.example/users/alice';
const aliceKeys = rsa();
const body = Buffer.from('{"@context":"https://www.w3.org/ns/activitystreams",  "id":"https://sender.example/a/1","type":"Follow","actor":"https://sender.example/users/alice","object":"https://receiver.example/users/bob"}');

function setup(extraDocs = {}) {
  const net = fakeFetch({ [ALICE]: actorDoc(ALICE, { rsa: aliceKeys.publicKey }), ...extraDocs });
  return { ...net, keyStore: new KeyStore(net.fetchJson) };
}

function cavageReq({ url = INBOX, raw = body, keyId = `${ALICE}#main-key`, key = aliceKeys.privateKey, date = new Date(NOW) } = {}) {
  return { method: 'POST', url, rawBody: raw, headers: signCavage({ url, body: raw, keyId, privateKey: key, date }) };
}

test('accepts a valid draft-cavage POST and binds it to the actor', async () => {
  const { keyStore } = setup();
  const req = cavageReq();
  const signer = await verifyRequest(req, { keyStore, now: NOW });
  assert.equal(signer.actorId, ALICE);
  assert.equal(signer.scheme, 'draft-cavage');
  assert.equal(parseActivityFrom(signer, req.rawBody).type, 'Follow');
});

test('accepts a valid RFC 9421 POST (RSA, as Mastodon double-knocks)', async () => {
  const { keyStore } = setup();
  const headers = signRfc9421({ url: INBOX, body, keyId: `${ALICE}#main-key`, privateKey: aliceKeys.privateKey, date: new Date(NOW) });
  const signer = await verifyRequest({ method: 'POST', url: INBOX, rawBody: body, headers }, { keyStore, now: NOW });
  assert.equal(signer.scheme, 'rfc9421');
  assert.equal(signer.actorId, ALICE);
});

test('accepts RFC 9421 with an Ed25519 FEP-521a Multikey', async () => {
  const k = ed();
  const id = 'https://ed.example/users/carol';
  const { keyStore } = setup({ [id]: actorDoc(id, { multikey: ed25519Multikey(k.publicKey) }) });
  const headers = signRfc9421({ url: INBOX, body, keyId: `${id}#ed25519-key`, privateKey: k.privateKey, date: new Date(NOW) });
  const signer = await verifyRequest({ method: 'POST', url: INBOX, rawBody: body, headers }, { keyStore, now: NOW });
  assert.equal(signer.actorId, id);
});

test('matches the RFC 9421 Appendix B.2.6 Ed25519 test vector', () => {
  const publicKey = crypto.createPublicKey('-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAJrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=\n-----END PUBLIC KEY-----\n');
  const req = {
    method: 'POST',
    url: 'https://example.com/foo?param=Value&Pet=dog',
    headers: {
      date: 'Tue, 20 Apr 2021 02:07:55 GMT',
      'content-type': 'application/json',
      'content-length': '18',
      'signature-input': 'sig-b26=("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"',
      signature: 'sig-b26=:wqcAqbmYJ2ji2glfAMaRy4gruYYnx2nEFN2HN6jrnDnQCK1u02Gb04v9EDgwUPiu4A0w6vuQv5lIp5WPpBKRCw==:',
    },
  };
  // The vector covers neither @target-uri nor content-digest, so the
  // ActivityPub policy rightly rejects it…
  assert.throws(() => prepareRfc9421(req), /must be covered/);
  // …but the signature base and Ed25519 verification must match the RFC.
  const prepared = prepareRfc9421(req, { requireCoverage: false });
  assert.equal(prepared.verify(publicKey), true);
});

test('rejects a cavage signature that covers only some headers', async () => {
  const { keyStore } = setup();
  const req = cavageReq();
  const date = req.headers.date;
  const sig = crypto.sign('sha256', Buffer.from(`date: ${date}`), aliceKeys.privateKey).toString('base64');
  req.headers.signature = `keyId="${ALICE}#main-key",algorithm="rsa-sha256",headers="date",signature="${sig}"`;
  await assert.rejects(verifyRequest(req, { keyStore, now: NOW }), /must be signed/);
});

test('rejects a POST whose signature does not cover the digest', async () => {
  const { keyStore } = setup();
  const req = cavageReq();
  const u = new URL(INBOX);
  const str = `(request-target): post ${u.pathname}\nhost: ${req.headers.host}\ndate: ${req.headers.date}`;
  const sig = crypto.sign('sha256', Buffer.from(str), aliceKeys.privateKey).toString('base64');
  req.headers.signature = `keyId="${ALICE}#main-key",algorithm="rsa-sha256",headers="(request-target) host date",signature="${sig}"`;
  delete req.headers.digest;
  await assert.rejects(verifyRequest(req, { keyStore, now: NOW }), /"digest" must be signed/);
});

test('rejects a swapped body (digest over raw bytes)', async () => {
  const { keyStore } = setup();
  const req = cavageReq();
  req.rawBody = Buffer.from(body.toString().replace('Follow', 'Delete'));
  await assert.rejects(verifyRequest(req, { keyStore, now: NOW }), /digest/);
});

test('digest is checked over the raw body, not re-serialised JSON', async () => {
  const { keyStore } = setup();
  // A verifier that recomputes the digest from JSON.stringify(JSON.parse(body))
  // gets a different value, because the raw body has extra whitespace.
  assert.notEqual(JSON.stringify(JSON.parse(body)), body.toString());
  const req = cavageReq();
  await verifyRequest(req, { keyStore, now: NOW }); // raw body: accepted
  const reserialised = { ...req, rawBody: Buffer.from(JSON.stringify(JSON.parse(body))) };
  await assert.rejects(verifyRequest(reserialised, { keyStore, now: NOW }), /digest/);
});

test('rejects a signature replayed on a different query string', async () => {
  const { keyStore } = setup();
  const req = cavageReq(); // signed for /inbox with no query
  req.url = `${INBOX}?replayed=1`;
  await assert.rejects(verifyRequest(req, { keyStore, now: NOW }), /Invalid signature/);
});

test('rejects an activity whose actor is not the key owner', async () => {
  const { keyStore } = setup();
  const forged = Buffer.from(body.toString().replace(ALICE, 'https://victim.example/users/vic'));
  const req = cavageReq({ raw: forged });
  const signer = await verifyRequest(req, { keyStore, now: NOW }); // Alice's signature is valid…
  assert.throws(() => parseActivityFrom(signer, req.rawBody), /activity\.actor/); // …but not for vic
});

test('rejects a key document that claims an owner who does not list it', async () => {
  const evil = rsa();
  const evilKey = 'https://evil.example/keys/1';
  const { keyStore } = setup({
    [evilKey]: { id: evilKey, owner: ALICE, publicKeyPem: evil.publicKey.export({ type: 'spki', format: 'pem' }) },
  });
  const req = cavageReq({ keyId: evilKey, key: evil.privateKey });
  await assert.rejects(verifyRequest(req, { keyStore, now: NOW }), /does not list key/);
});

test('rejects an actor document served from another origin', async () => {
  const { keyStore } = setup({ 'https://evil.example/users/alice': actorDoc(ALICE, { rsa: aliceKeys.publicKey }) });
  const req = cavageReq({ keyId: 'https://evil.example/users/alice#main-key' });
  await assert.rejects(verifyRequest(req, { keyStore, now: NOW }));
});

test('time window matches Mastodon: ~65 minutes past, 1 hour future', async () => {
  const { keyStore } = setup();
  const minutes = (m) => new Date(NOW + m * 60_000);
  await verifyRequest(cavageReq({ date: minutes(-30) }), { keyStore, now: NOW });
  await verifyRequest(cavageReq({ date: minutes(50) }), { keyStore, now: NOW });
  await assert.rejects(verifyRequest(cavageReq({ date: minutes(-70) }), { keyStore, now: NOW }), /expired/);
  await assert.rejects(verifyRequest(cavageReq({ date: minutes(70) }), { keyStore, now: NOW }), /future/);
});

test('refetches the key once when a cached key fails (key rotation)', async () => {
  const rotated = rsa();
  let current = aliceKeys.publicKey;
  const net = fakeFetch({ [ALICE]: () => actorDoc(ALICE, { rsa: current }) });
  const keyStore = new KeyStore(net.fetchJson);
  await verifyRequest(cavageReq(), { keyStore, now: NOW }); // caches old key
  current = rotated.publicKey;
  await verifyRequest(cavageReq({ key: rotated.privateKey }), { keyStore, now: NOW });
  assert.equal(net.calls.length, 2);
  // A bad signature costs at most one refetch, never a loop.
  const bad = cavageReq({ key: rsa().privateKey });
  await assert.rejects(verifyRequest(bad, { keyStore, now: NOW }), /Invalid signature/);
  assert.equal(net.calls.length, 3);
});

test('rejects unsigned requests', async () => {
  const { keyStore } = setup();
  await assert.rejects(
    verifyRequest({ method: 'POST', url: INBOX, rawBody: body, headers: {} }, { keyStore, now: NOW }),
    /not signed/,
  );
});
