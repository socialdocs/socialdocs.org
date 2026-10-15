import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeActivity, sameOrigin } from '../src/origin.js';

const A = 'https://a.example/users/alice';
const note = (id, by = A) => ({ id, type: 'Note', attributedTo: by, content: 'hi' });

test('origins compare scheme, host (case-insensitive) and port', () => {
  assert.equal(sameOrigin('https://A.example/x', 'https://a.example:443/y'), true);
  assert.equal(sameOrigin('https://a.example/x', 'http://a.example/x'), false);
  assert.equal(sameOrigin('https://a.example/x', 'https://a.example:8443/x'), false);
});

test('Create: object must be attributed to the actor, on the same origin', () => {
  assert.deepEqual(authorizeActivity({ type: 'Create', actor: A, object: note('https://a.example/n/1') }), { trustEmbedded: true });
  assert.throws(() => authorizeActivity({ type: 'Create', actor: A, object: note('https://a.example/n/1', 'https://a.example/users/bob') }));
  // CVE-2024-23832 class: overwriting another server's object by id
  assert.throws(() => authorizeActivity({ type: 'Create', actor: A, object: note('https://victim.example/n/1') }));
});

test('Update/Delete: only same-origin objects owned by the actor', () => {
  assert.deepEqual(authorizeActivity({ type: 'Update', actor: A, object: note('https://a.example/n/1') }), { trustEmbedded: true });
  assert.throws(() => authorizeActivity({ type: 'Delete', actor: A, object: 'https://victim.example/n/1' }));
  assert.throws(() => authorizeActivity({ type: 'Update', actor: A, object: note('https://a.example/n/1', 'https://a.example/users/bob') }));
  assert.deepEqual(authorizeActivity({ type: 'Delete', actor: A, object: 'https://a.example/n/1' }), { trustEmbedded: false });
});

test('Announce of a remote object: allowed, but the embedded copy must be refetched', () => {
  const r = authorizeActivity({ type: 'Announce', actor: A, object: note('https://b.example/n/9', 'https://b.example/users/bob') });
  assert.deepEqual(r, { trustEmbedded: false });
});

test('Undo: only your own activities', () => {
  assert.throws(() => authorizeActivity({ type: 'Undo', actor: A, object: { id: 'https://a.example/f/1', type: 'Follow', actor: 'https://a.example/users/bob' } }));
});

test('activity id must be on the actor’s origin', () => {
  assert.throws(() => authorizeActivity({ id: 'https://evil.example/a/1', type: 'Like', actor: A, object: 'https://b.example/n/1' }));
});
