import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { openStore } from '../src/store.js';
import {
  signCavage, verifyRequest, parseActivityFrom, KeyStore,
} from '../../verify-requests/src/index.js';

const cfg = { domain: 'ap.test', username: 'tester', displayName: 'Tester', adminToken: 'secret' };
const ME = 'https://ap.test/users/tester';
const BOB = 'https://remote.example/users/bob';
const bobKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const bobActor = {
  id: BOB, type: 'Person', inbox: `${BOB}/inbox`, outbox: `${BOB}/outbox`,
  endpoints: { sharedInbox: 'https://remote.example/inbox' },
  publicKey: { id: `${BOB}#main-key`, owner: BOB, publicKeyPem: bobKeys.publicKey.export({ type: 'spki', format: 'pem' }) },
};

// Fake network for the server's outgoing fetches and deliveries.
const network = { [BOB]: bobActor };
const delivered = [];
const fetchJson = async (url) => {
  const doc = network[url.split('#')[0]];
  if (!doc) throw Object.assign(new Error(`404 ${url}`), { status: 404 });
  return { url, json: doc };
};
const deliver = async (inbox, activity) => { delivered.push({ inbox, activity }); return 202; };
const quiet = { info() {}, warn() {}, error() {} };

let server, port, store;
before(async () => {
  store = openStore();
  server = http.createServer(createApp({ cfg, store, fetchJson, deliver, log: quiet }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});
after(() => server.close());

// Send a request to the test server as if it arrived at https://ap.test.
function request(method, path, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path, headers: { host: 'ap.test', ...headers } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, headers: res.headers, json: text ? JSON.parse(text) : null });
      });
    });
    req.on('error', reject);
    req.end(body);
  });
}

function signedPost(path, activity, { keyId = `${BOB}#main-key`, privateKey = bobKeys.privateKey } = {}) {
  const body = Buffer.from(JSON.stringify(activity));
  const headers = signCavage({ url: `https://ap.test${path}`, body, keyId, privateKey });
  return request('POST', path, { headers: { ...headers, 'content-type': 'application/activity+json' }, body });
}

const waitFor = async (check) => {
  for (let i = 0; i < 50; i++) { if (check()) return; await new Promise((r) => setTimeout(r, 10)); }
  assert.fail('condition not met');
};

test('WebFinger answers only for our account, with CORS', async () => {
  const ok = await request('GET', '/.well-known/webfinger?resource=acct:tester@ap.test');
  assert.equal(ok.status, 200);
  assert.equal(ok.headers['content-type'], 'application/jrd+json');
  assert.equal(ok.headers['access-control-allow-origin'], '*');
  assert.equal(ok.json.links[0].href, ME);
  assert.equal((await request('GET', '/.well-known/webfinger?resource=acct:tester@other.example')).status, 404);
  assert.equal((await request('GET', '/.well-known/webfinger?resource=acct:admin@ap.test')).status, 404);
});

test('serves the actor as application/activity+json with its public key', async () => {
  const res = await request('GET', '/users/tester', { headers: { accept: 'application/activity+json' } });
  assert.equal(res.headers['content-type'], 'application/activity+json');
  assert.equal(res.json.id, ME);
  assert.equal(res.json.publicKey.owner, ME);
  assert.equal(res.json.publicKey.id, `${ME}#main-key`);
});

test('rejects an unsigned inbox POST', async () => {
  const body = JSON.stringify({ type: 'Follow', actor: BOB, object: ME });
  const res = await request('POST', '/users/tester/inbox', { body });
  assert.equal(res.status, 401);
});

test('rejects an activity signed by someone other than its actor', async () => {
  const res = await signedPost('/users/tester/inbox',
    { id: 'https://evil.example/f/1', type: 'Follow', actor: 'https://evil.example/users/eve', object: ME });
  assert.equal(res.status, 401);
});

test('a signed Follow stores the follower and delivers a signed Accept', async () => {
  delivered.length = 0;
  const follow = { '@context': 'https://www.w3.org/ns/activitystreams', id: 'https://remote.example/follows/1', type: 'Follow', actor: BOB, object: ME };
  const res = await signedPost('/users/tester/inbox', follow);
  assert.equal(res.status, 202);
  await waitFor(() => delivered.length === 1);
  assert.equal(delivered[0].inbox, `${BOB}/inbox`); // fetched from Bob's actor, not the activity
  assert.equal(delivered[0].activity.type, 'Accept');
  assert.deepEqual(delivered[0].activity.object, follow);
  assert.equal((await request('GET', '/users/tester/followers')).json.totalItems, 1);
});

test('publishing a note delivers a Create once per shared inbox', async () => {
  delivered.length = 0;
  assert.equal((await request('POST', '/admin/notes', { body: '{"text":"hi"}' })).status, 401);
  const res = await request('POST', '/admin/notes', {
    headers: { authorization: 'Bearer secret' }, body: JSON.stringify({ text: 'Hello <fediverse>' }),
  });
  assert.equal(res.status, 201);
  assert.equal(res.json.note.content, '<p>Hello &lt;fediverse&gt;</p>'); // escaped
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].inbox, 'https://remote.example/inbox');
  assert.equal(delivered[0].activity.type, 'Create');
  assert.equal(delivered[0].activity.object.attributedTo, ME);
  const note = await request('GET', new URL(res.json.note.id).pathname);
  assert.equal(note.json.id, res.json.note.id);
  assert.equal((await request('GET', '/users/tester/outbox')).json.totalItems, 1);
});

test('an Undo of the Follow removes the follower', async () => {
  const res = await signedPost('/inbox', {
    id: 'https://remote.example/undo/1', type: 'Undo', actor: BOB,
    object: { id: 'https://remote.example/follows/1', type: 'Follow', actor: BOB, object: ME },
  });
  assert.equal(res.status, 202);
  await waitFor(() => store.followers().length === 0);
});

test('our outgoing signatures verify with our published key', async () => {
  // Round trip: sign like makeDeliver does, verify like a remote server would.
  const actorDoc = (await request('GET', '/users/tester')).json;
  const body = Buffer.from(JSON.stringify({ id: `${ME}/x`, type: 'Create', actor: ME }));
  const headers = signCavage({ url: 'https://remote.example/inbox', body, keyId: `${ME}#main-key`, privateKey: store.privateKey });
  const keyStore = new KeyStore(async () => ({ url: ME, json: actorDoc }));
  const signer = await verifyRequest({ method: 'POST', url: 'https://remote.example/inbox', headers, rawBody: body }, { keyStore });
  assert.equal(parseActivityFrom(signer, body).actor, ME);
});
