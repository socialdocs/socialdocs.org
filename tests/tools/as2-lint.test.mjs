import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lintObject, summarize, PUBLIC_IRI} from '../../src/components/tools/lib/as2-lint.js';

const ACTOR = 'https://social.example/users/alice';

const goodActor = {
  '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
  id: ACTOR,
  type: 'Person',
  preferredUsername: 'alice',
  inbox: `${ACTOR}/inbox`,
  outbox: `${ACTOR}/outbox`,
  followers: `${ACTOR}/followers`,
  following: `${ACTOR}/following`,
  publicKey: {
    id: `${ACTOR}#main-key`,
    owner: ACTOR,
    publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----',
  },
};

const goodCreate = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  id: `${ACTOR}/statuses/1/activity`,
  type: 'Create',
  actor: ACTOR,
  published: '2026-10-15T12:00:00Z',
  to: [PUBLIC_IRI],
  cc: [`${ACTOR}/followers`],
  object: {
    id: `${ACTOR}/statuses/1`,
    type: 'Note',
    attributedTo: ACTOR,
    content: '<p>Hello</p>',
    published: '2026-10-15T12:00:00Z',
    to: [PUBLIC_IRI],
    cc: [`${ACTOR}/followers`],
  },
};

const paths = (findings, level) => findings.filter((f) => !level || f.level === level).map((f) => f.path);

test('a complete actor has no errors or warnings', () => {
  const findings = lintObject(goodActor);
  assert.deepEqual(summarize(findings), {errors: 0, warnings: 0, infos: 0});
});

test('a well-formed public Create has no findings', () => {
  assert.deepEqual(lintObject(goodCreate), []);
});

test('every finding cites a source', () => {
  const findings = lintObject({type: 'Person', bto: ['x'], published: 'yesterday'});
  assert.ok(findings.length > 0);
  for (const f of findings) assert.ok(f.source?.url?.startsWith('https://'), f.path);
});

test('non-object input', () => {
  assert.equal(lintObject([1, 2])[0].level, 'error');
  assert.equal(lintObject(null)[0].level, 'error');
});

test('actor missing inbox, outbox, preferredUsername and keys', () => {
  const {inbox, outbox, preferredUsername, publicKey, ...actor} = goodActor;
  const findings = lintObject(actor);
  assert.deepEqual(paths(findings, 'error').sort(), ['inbox', 'outbox', 'preferredUsername'].sort());
  assert.deepEqual(paths(findings, 'warning'), ['publicKey']);
});

test('FEP-2c59 webfinger satisfies Mastodon instead of preferredUsername', () => {
  const {preferredUsername, ...actor} = goodActor;
  assert.ok(!paths(lintObject({...actor, webfinger: 'alice@social.example'})).includes('preferredUsername'));
});

test('key owned by another actor is an error', () => {
  const actor = {...goodActor, publicKey: {...goodActor.publicKey, owner: 'https://evil.example/users/m'}};
  assert.ok(paths(lintObject(actor), 'error').includes('publicKey.owner'));
});

test('malformed PEM is an error', () => {
  const actor = {...goodActor, publicKey: {...goodActor.publicKey, publicKeyPem: 'abc'}};
  assert.ok(paths(lintObject(actor), 'error').includes('publicKey.publicKeyPem'));
});

test('missing or foreign @context', () => {
  const {['@context']: _, ...noContext} = goodActor;
  assert.deepEqual(paths(lintObject(noContext), 'warning'), ['@context']);
  assert.deepEqual(paths(lintObject({...goodActor, '@context': 'https://schema.org'}), 'warning'), ['@context']);
});

test('unknown and extension types', () => {
  const findings = lintObject({...goodCreate, object: {...goodCreate.object, type: 'Tweet'}});
  assert.ok(paths(findings, 'warning').includes('object.type'));
  const hashtag = lintObject({id: 'https://a.example/tags/x', type: 'Hashtag'});
  assert.deepEqual(paths(hashtag, 'info'), ['type']);
});

test('dates must be RFC 3339 with uppercase T and Z', () => {
  for (const bad of ['2026-10-15 12:00:00Z', '2026-10-15t12:00:00z', '2026-10-15T12:00:00', 'Oct 15 2026']) {
    assert.ok(paths(lintObject({...goodCreate, published: bad}), 'error').includes('published'), bad);
  }
  for (const ok of ['2026-10-15T12:00Z', '2026-10-15T12:00:00.123+02:00']) {
    assert.ok(!paths(lintObject({...goodCreate, published: ok})).includes('published'), ok);
  }
});

test('missing id, relative id, http id', () => {
  const {id, ...noId} = goodCreate;
  assert.ok(paths(lintObject(noId), 'error').includes('id'));
  assert.ok(paths(lintObject({...goodCreate, id: '#create'}), 'warning').includes('id'));
  assert.ok(paths(lintObject({...goodCreate, id: 'http://social.example/a'}), 'info').includes('id'));
});

test('compacted Public forms are flagged as info', () => {
  const findings = lintObject({...goodCreate, to: ['as:Public']});
  assert.deepEqual(paths(findings, 'info'), ['to']);
});

test('bto and bcc must not be delivered', () => {
  assert.deepEqual(paths(lintObject({...goodCreate, bcc: ['https://x.example/u']}), 'warning'), ['bcc']);
});

test('direct message without Mention tags is limited on Mastodon', () => {
  const bob = 'https://other.example/users/bob';
  const dm = {'@context': 'https://www.w3.org/ns/activitystreams', ...goodCreate.object, to: [bob], cc: []};
  assert.deepEqual(paths(lintObject(dm), 'warning'), ['tag']);
  const tagged = {...dm, tag: [{type: 'Mention', href: bob, name: '@bob@other.example'}]};
  assert.deepEqual(lintObject(tagged), []);
});

test('Create with a bare object URI or unsupported type', () => {
  assert.ok(paths(lintObject({...goodCreate, object: `${ACTOR}/statuses/1`}), 'warning').includes('object'));
  const chat = lintObject({...goodCreate, object: {...goodCreate.object, type: 'Relationship'}});
  assert.ok(paths(chat, 'warning').includes('object.type'));
});

test('Create whose object lives on another host is an error', () => {
  const create = {...goodCreate, object: {...goodCreate.object, id: 'https://evil.example/notes/1'}};
  assert.ok(paths(lintObject(create), 'error').includes('object.id'));
});

test('Create whose object is attributed to someone else', () => {
  const create = {...goodCreate, object: {...goodCreate.object, attributedTo: 'https://social.example/users/bob'}};
  assert.ok(paths(lintObject(create), 'warning').includes('object.attributedTo'));
});

test('Content-Type checks', () => {
  assert.deepEqual(lintObject(goodActor, {contentType: 'application/activity+json; charset=utf-8'}), []);
  assert.deepEqual(lintObject(goodActor, {contentType: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'}), []);
  assert.deepEqual(paths(lintObject(goodActor, {contentType: 'application/json'}), 'error'), ['Content-Type']);
  assert.deepEqual(paths(lintObject(goodActor, {contentType: 'application/ld+json'}), 'error'), ['Content-Type']);
});
