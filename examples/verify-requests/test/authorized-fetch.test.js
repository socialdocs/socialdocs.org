import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  instanceActor, serverActorWebfinger, applicationActorNodeinfoLink,
  instanceActorSigner, requireSignedFetch, signerDependentHeaders,
} from '../src/authorized-fetch.js';
import { KeyStore } from '../src/keys.js';
import { SignatureError } from '../src/verify.js';

const NOW = Date.parse('2026-10-15T12:00:00Z');
const SENDER = 'https://sender.example';
const TARGET = 'https://receiver.example/users/bob';
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const actorDoc = instanceActor({ origin: SENDER, publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }) });

// The receiver resolves the sender's key from the unsigned instance actor.
const keyStore = new KeyStore(async (url) => {
  if (url !== actorDoc.id) throw new Error(`404 ${url}`);
  return { url, json: actorDoc };
});

const sign = instanceActorSigner({ keyId: actorDoc.publicKey.id, privateKey });
const signedGet = (url) => ({ method: 'GET', url, headers: sign({ url }), rawBody: Buffer.alloc(0) });

test('instance actor is an Application with its own key', () => {
  assert.equal(actorDoc.id, 'https://sender.example/actor');
  assert.equal(actorDoc.type, 'Application');
  assert.equal(actorDoc.preferredUsername, 'sender.example');
  assert.equal(actorDoc.publicKey.owner, actorDoc.id);
});

test('a GET signed by the instance actor passes requireSignedFetch', async () => {
  const req = signedGet(TARGET);
  const signer = await requireSignedFetch(req, { keyStore, now: Date.parse(req.headers.date) });
  assert.equal(signer.actorId, 'https://sender.example/actor');
});

test('an unsigned GET is rejected', async () => {
  const req = { method: 'GET', url: TARGET, headers: { host: 'receiver.example' }, rawBody: Buffer.alloc(0) };
  await assert.rejects(requireSignedFetch(req, { keyStore, now: NOW }), SignatureError);
});

test('a signed GET for a different URL is rejected', async () => {
  const req = signedGet(TARGET);
  req.url = 'https://receiver.example/users/alice';
  await assert.rejects(requireSignedFetch(req, { keyStore, now: Date.parse(req.headers.date) }), SignatureError);
});

test('requireSignedFetch refuses to gate POSTs', async () => {
  const req = { ...signedGet(TARGET), method: 'POST' };
  await assert.rejects(requireSignedFetch(req, { keyStore, now: NOW }), /GET\/HEAD/);
});

test('FEP-d556 and FEP-2677 discovery documents', () => {
  assert.deepEqual(serverActorWebfinger(SENDER).links[0], {
    rel: 'https://www.w3.org/ns/activitystreams#Service',
    type: 'application/activity+json',
    href: 'https://sender.example/actor',
  });
  assert.equal(applicationActorNodeinfoLink(SENDER).rel, 'https://www.w3.org/ns/activitystreams#Application');
});

test('signer-dependent responses vary on Signature and are not shared-cached', () => {
  assert.deepEqual(signerDependentHeaders({ requestSigned: true }), {
    vary: 'Accept, Signature', 'cache-control': 'private, no-store',
  });
  assert.match(signerDependentHeaders({ requestSigned: false }).vary, /Signature/);
});
