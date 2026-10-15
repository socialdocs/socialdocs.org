import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, createSign} from 'node:crypto';
import {
  parseRequest,
  parseCavageSignature,
  cavageSigningString,
  mastodonCavageProblems,
  checkDigest,
  checkContentDigest,
  signatureBase,
  mastodonRfc9421Problems,
  verifySignature,
} from '../../src/components/tools/lib/httpsig.js';

// RFC 9421 Appendix B.2 test-request
const RFC_REQUEST = `POST /foo?param=Value&Pet=dog HTTP/1.1
Host: example.com
Date: Tue, 20 Apr 2021 02:07:55 GMT
Content-Type: application/json
Content-Digest: sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:
Content-Length: 18

{"hello": "world"}`;
const RFC_TARGET = 'https://example.com/foo?param=Value&Pet=dog';

// RFC 9421 Appendix B.1.4 test-key-ed25519
const ED25519_PUBLIC = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAJrQLj5P/89iXES9+vFgrIy29clF9CC/oPPsw3c5D0bs=
-----END PUBLIC KEY-----`;

test('parses a raw request', () => {
  const req = parseRequest(RFC_REQUEST);
  assert.equal(req.method, 'POST');
  assert.equal(req.target, '/foo?param=Value&Pet=dog');
  assert.deepEqual(req.headers.get('host'), ['example.com']);
  assert.equal(req.body, '{"hello": "world"}');
});

test('rejects input without a request line', () => {
  assert.throws(() => parseRequest('Host: example.com'), /request line/);
});

test('RFC 9421 B.2.2 signature base (selective components, @query-param)', () => {
  const req = parseRequest(RFC_REQUEST);
  const input = 'sig-b22=("@authority" "content-digest" "@query-param";name="Pet");created=1618884473;keyid="test-key-rsa-pss";tag="header-example"';
  const {base} = signatureBase(req, input, {targetUri: RFC_TARGET});
  assert.equal(base, [
    '"@authority": example.com',
    '"content-digest": sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:',
    '"@query-param";name="Pet": dog',
    '"@signature-params": ("@authority" "content-digest" "@query-param";name="Pet");created=1618884473;keyid="test-key-rsa-pss";tag="header-example"',
  ].join('\n'));
});

test('RFC 9421 B.2.3 signature base (full coverage)', () => {
  const req = parseRequest(RFC_REQUEST);
  const input = 'sig-b23=("date" "@method" "@path" "@query" "@authority" "content-type" "content-digest" "content-length");created=1618884473;keyid="test-key-rsa-pss"';
  const {base} = signatureBase(req, input, {targetUri: RFC_TARGET});
  assert.equal(base, [
    '"date": Tue, 20 Apr 2021 02:07:55 GMT',
    '"@method": POST',
    '"@path": /foo',
    '"@query": ?param=Value&Pet=dog',
    '"@authority": example.com',
    '"content-type": application/json',
    '"content-digest": sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:',
    '"content-length": 18',
    '"@signature-params": ("date" "@method" "@path" "@query" "@authority" "content-type" "content-digest" "content-length");created=1618884473;keyid="test-key-rsa-pss"',
  ].join('\n'));
});

test('RFC 9421 B.2.6 Ed25519 signature base and verification', async () => {
  const req = parseRequest(RFC_REQUEST);
  const input = 'sig-b26=("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"';
  const {base, params} = signatureBase(req, input, {targetUri: RFC_TARGET});
  assert.equal(base, [
    '"date": Tue, 20 Apr 2021 02:07:55 GMT',
    '"@method": POST',
    '"@path": /foo',
    '"@authority": example.com',
    '"content-type": application/json',
    '"content-length": 18',
    '"@signature-params": ("date" "@method" "@path" "@authority" "content-type" "content-length");created=1618884473;keyid="test-key-ed25519"',
  ].join('\n'));
  assert.equal(params.keyid, 'test-key-ed25519');

  const signature = 'wqcAqbmYJ2ji2glfAMaRy4gruYYnx2nEFN2HN6jrnDnQCK1u02Gb04v9EDgwUPiu4A0w6vuQv5lIp5WPpBKRCw==';
  assert.equal(await verifySignature({data: base, signature, pem: ED25519_PUBLIC, kind: 'ed25519'}), true);
  assert.equal(await verifySignature({data: `${base} `, signature, pem: ED25519_PUBLIC, kind: 'ed25519'}), false);
});

test('RFC 9421 Content-Digest check (sha-512 from Appendix B.2)', async () => {
  const req = parseRequest(RFC_REQUEST);
  assert.equal((await checkContentDigest(req.body, req.headers.get('content-digest')?.[0])).ok, true);
  assert.equal((await checkContentDigest('{"hello": "World"}', req.headers.get('content-digest')?.[0])).ok, false);
});

test('signature base refuses a covered header the request lacks', () => {
  const req = parseRequest(RFC_REQUEST);
  assert.throws(
    () => signatureBase(req, 'sig=("signature-agent");created=1', {targetUri: RFC_TARGET}),
    /not present/,
  );
});

test('Mastodon RFC 9421 requirements', () => {
  assert.deepEqual(mastodonRfc9421Problems('POST', ['@method', '@target-uri', 'content-digest'], {created: 1, keyid: 'k'}), []);
  const problems = mastodonRfc9421Problems('POST', ['@authority'], {});
  assert.equal(problems.length, 4);
});

const {publicKey, privateKey} = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {type: 'spki', format: 'pem'},
  privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
});

function cavageRequest(body = '{"type":"Follow"}') {
  return parseRequest(`POST /users/alice/inbox?x=1 HTTP/1.1
Host: social.example
Date: Thu, 15 Oct 2026 12:00:00 GMT
Digest: SHA-256=PLACEHOLDER
Content-Type: application/activity+json

${body}`);
}

test('cavage signing string includes the query string in (request-target)', () => {
  const req = cavageRequest();
  const params = parseCavageSignature('keyId="https://a.example/actor#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="abc"');
  const {signingString, missing} = cavageSigningString(req, params);
  assert.equal(signingString, [
    '(request-target): post /users/alice/inbox?x=1',
    'host: social.example',
    'date: Thu, 15 Oct 2026 12:00:00 GMT',
    'digest: SHA-256=PLACEHOLDER',
  ].join('\n'));
  assert.deepEqual(missing, []);
});

test('cavage signing string reports missing headers', () => {
  const req = cavageRequest();
  const {missing} = cavageSigningString(req, {headers: '(request-target) host date accept'});
  assert.deepEqual(missing, ['accept']);
});

test('cavage defaults to date when headers is absent', () => {
  const {signingString} = cavageSigningString(cavageRequest(), {});
  assert.equal(signingString, 'date: Thu, 15 Oct 2026 12:00:00 GMT');
});

test('cavage rsa-sha256 signature verifies with WebCrypto', async () => {
  const req = cavageRequest();
  const params = {headers: '(request-target) host date digest'};
  const {signingString} = cavageSigningString(req, params);
  const signature = createSign('RSA-SHA256').update(signingString).sign(privateKey, 'base64');
  assert.equal(await verifySignature({data: signingString, signature, pem: publicKey, kind: 'rsa'}), true);
  assert.equal(await verifySignature({data: signingString.replace('alice', 'bob'), signature, pem: publicKey, kind: 'rsa'}), false);
});

test('legacy Digest check', async () => {
  const body = '{"type":"Follow"}';
  const {expected} = await checkDigest(body, undefined);
  assert.equal((await checkDigest(body, expected)).ok, true);
  assert.equal((await checkDigest(`${body}\n`, expected)).ok, false);
  assert.equal((await checkDigest(body, 'SHA-512=abc')).ok, false);
  assert.equal((await checkDigest(body, expected?.replace('SHA-256', 'sha-256'))).ok, true);
});

test('Mastodon cavage requirements', () => {
  assert.deepEqual(mastodonCavageProblems('POST', ['(request-target)', 'host', 'date', 'digest']), []);
  assert.deepEqual(mastodonCavageProblems('POST', ['(request-target)', 'host', 'date']), [
    'Mastodon requires the Digest header to be signed when doing a POST request',
  ]);
  assert.deepEqual(mastodonCavageProblems('GET', ['(request-target)', 'date']), [
    'Mastodon requires the Host header to be signed when doing a GET request',
  ]);
  assert.equal(mastodonCavageProblems('GET', ['host']).length, 2);
});
