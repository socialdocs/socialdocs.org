import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { makeDeliver } from '../src/deliver.js';

const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const keyId = 'https://ap.test/users/tester#main-key';
const activity = { id: 'https://ap.test/x', type: 'Create', actor: 'https://ap.test/users/tester' };

test('signs with draft-cavage, retries with RFC 9421 after a 401', async () => {
  const sent = [];
  const deliver = makeDeliver({
    keyId, privateKey, allowPrivateAddresses: true,
    send: async ({ headers }) => { sent.push(headers); return sent.length === 1 ? 401 : 202; },
  });
  // A literal IP needs no DNS; allowPrivateAddresses lets 127.0.0.1 through.
  assert.equal(await deliver('https://127.0.0.1/inbox', activity), 202);
  assert.equal(sent.length, 2);
  assert.match(sent[0].signature, /keyId="https:\/\/ap\.test\/users\/tester#main-key"/);
  assert.ok(sent[0].digest);
  assert.ok(sent[1]['signature-input']);
  assert.ok(sent[1]['content-digest']);
});

test('does not retry on success', async () => {
  let calls = 0;
  const deliver = makeDeliver({ keyId, privateKey, allowPrivateAddresses: true, send: async () => { calls++; return 202; } });
  await deliver('https://127.0.0.1/inbox', activity);
  assert.equal(calls, 1);
});

test('refuses non-https inboxes and private addresses', async () => {
  const deliver = makeDeliver({ keyId, privateKey, send: async () => assert.fail('should not send') });
  await assert.rejects(deliver('http://remote.example/inbox', activity), /Refusing/);
  await assert.rejects(deliver('https://10.0.0.1/inbox', activity), /not a public address/);
});
