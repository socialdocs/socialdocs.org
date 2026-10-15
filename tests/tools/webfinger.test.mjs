import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseTarget, lintWebFinger} from '../../src/components/tools/lib/webfinger.js';

test('parses handles and URLs', () => {
  for (const input of ['@alice@social.example', 'alice@social.example', 'acct:alice@social.example']) {
    const t = parseTarget(input);
    assert.equal(t.kind, 'acct');
    assert.equal(t.resource, 'acct:alice@social.example');
    assert.equal(t.webfingerUrl, 'https://social.example/.well-known/webfinger?resource=acct%3Aalice%40social.example');
  }
  assert.deepEqual(parseTarget('https://social.example/users/alice'), {kind: 'url', url: 'https://social.example/users/alice'});
  assert.throws(() => parseTarget('alice'), /handle/);
});

const resource = 'acct:alice@social.example';
const jrd = {
  subject: resource,
  links: [{rel: 'self', type: 'application/activity+json', href: 'https://social.example/users/alice'}],
};

test('finds the actor from a valid JRD', () => {
  assert.deepEqual(lintWebFinger(jrd, {resource, contentType: 'application/jrd+json; charset=utf-8'}), {
    findings: [],
    actorUrl: 'https://social.example/users/alice',
  });
});

test('accepts the ld+json profile link type', () => {
  const ld = {...jrd, links: [{...jrd.links[0], type: 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'}]};
  assert.equal(lintWebFinger(ld, {resource}).actorUrl, 'https://social.example/users/alice');
});

test('missing self link and subject are errors', () => {
  const {findings, actorUrl} = lintWebFinger({links: [{rel: 'self', type: 'text/html', href: 'https://x'}]}, {resource});
  assert.equal(actorUrl, undefined);
  assert.deepEqual(findings.map((f) => [f.level, f.path]), [['error', 'subject'], ['error', 'links']]);
});

test('different subject is reported as info', () => {
  const {findings} = lintWebFinger({...jrd, subject: 'acct:alice@example.com'}, {resource});
  assert.deepEqual(findings.map((f) => f.level), ['info']);
});
