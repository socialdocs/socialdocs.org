import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  jcs, verifyEddsaJcs2022, signEddsaJcs2022, verifyObjectProof, base58btcEncode, ProofError,
} from '../src/proof.js';
import { multikeyToKeyObject, KeyResolutionError } from '../src/keys.js';

// --- W3C test vector: https://www.w3.org/TR/vc-di-eddsa/#representation-eddsa-jcs-2022

const W3C_PUBLIC_KEY = 'z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2';
const W3C_SIGNED = {
  '@context': ['https://www.w3.org/ns/credentials/v2', 'https://www.w3.org/ns/credentials/examples/v2'],
  id: 'urn:uuid:58172aac-d8ba-11ed-83dd-0b3aef56cc33',
  type: ['VerifiableCredential', 'AlumniCredential'],
  name: 'Alumni Credential',
  description: 'A minimum viable example of an Alumni Credential.',
  issuer: 'https://vc.example/issuers/5678',
  validFrom: '2023-01-01T00:00:00Z',
  credentialSubject: { id: 'did:example:abcdefgh', alumniOf: 'The School of Examples' },
  proof: {
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-jcs-2022',
    created: '2023-02-24T23:36:38Z',
    verificationMethod: 'did:key:z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2#z6MkrJVnaZkeFzdQyMZu1cgjg7k1pZZ6pvBQ7XJPt4swbTQ2',
    proofPurpose: 'assertionMethod',
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://www.w3.org/ns/credentials/examples/v2'],
    proofValue: 'z2HnFSSPPBzR36zdDgK8PbEHeXbR56YF24jwMpt3R1eHXQzJDMWS93FCzpvJpwTWd3GAVFuUfjoJdcnTMuVor51aX',
  },
};

const sha256hex = (s) => crypto.createHash('sha256').update(s).digest('hex');

test('JCS matches the W3C vector hashes', () => {
  const { proof, ...unsecured } = W3C_SIGNED;
  const { proofValue, ...proofOptions } = proof;
  assert.equal(sha256hex(jcs(unsecured)), '59b7cb6251b8991add1ce0bc83107e3db9dbbab5bd2c28f687db1a03abc92f19');
  assert.equal(sha256hex(jcs(proofOptions)), '66ab154f5c2890a140cb8388a22a160454f80575f6eae09e5a097cabe539a1db');
});

test('verifies the W3C eddsa-jcs-2022 test vector', () => {
  assert.equal(verifyEddsaJcs2022(W3C_SIGNED, multikeyToKeyObject(W3C_PUBLIC_KEY)), true);
});

test('rejects the W3C vector after tampering', () => {
  const tampered = { ...W3C_SIGNED, name: 'Forged Credential' };
  assert.equal(verifyEddsaJcs2022(tampered, multikeyToKeyObject(W3C_PUBLIC_KEY)), false);
});

test('rejects a proof whose @context is not a prefix of the document @context', () => {
  const doc = { ...W3C_SIGNED, '@context': ['https://www.w3.org/ns/credentials/v2'] };
  assert.throws(() => verifyEddsaJcs2022(doc, multikeyToKeyObject(W3C_PUBLIC_KEY)), ProofError);
});

// --- FEP-8b32 on ActivityPub objects

const ALICE = 'https://server.example/users/alice';
const KEY_ID = `${ALICE}#ed25519-key`;
const CTX = ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/data-integrity/v2'];
const keys = crypto.generateKeyPairSync('ed25519');
const otherKeys = crypto.generateKeyPairSync('ed25519');

function multibaseOf(publicKey) {
  const raw = Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url');
  return `z${base58btcEncode(Buffer.concat([Buffer.from([0xed, 0x01]), raw]))}`;
}

function actor(id, publicKey, keyId = `${id}#ed25519-key`) {
  return {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://www.w3.org/ns/cid/v1'],
    id, type: 'Person', inbox: `${id}/inbox`, outbox: `${id}/outbox`,
    assertionMethod: [{ id: keyId, type: 'Multikey', controller: id, publicKeyMultibase: multibaseOf(publicKey) }],
  };
}

function fakeFetch(docs) {
  return async (url) => {
    if (!(url in docs)) throw Object.assign(new Error(`404 ${url}`), { status: 404 });
    return { url, json: docs[url] };
  };
}

const note = {
  '@context': CTX,
  id: 'https://server.example/objects/1',
  type: 'Note',
  attributedTo: ALICE,
  content: 'Hello world',
};
const sign = (doc, privateKey = keys.privateKey, verificationMethod = KEY_ID) =>
  signEddsaJcs2022(doc, { privateKey, verificationMethod, created: '2026-10-15T12:00:00Z' });
const network = fakeFetch({ [ALICE]: actor(ALICE, keys.publicKey) });

test('verifies a signed Note and returns its owner', async () => {
  const result = await verifyObjectProof(sign(note), network);
  assert.deepEqual(result, { owner: ALICE, keyId: KEY_ID });
});

test('verifies a signed Create relayed by someone else', async () => {
  const create = { '@context': CTX, id: 'https://server.example/activities/1', type: 'Create', actor: ALICE, object: note };
  const result = await verifyObjectProof(sign(create), network);
  assert.equal(result.owner, ALICE);
});

test('ignores a legacy LD signature when verifying', async () => {
  const signed = { ...sign(note), signature: { type: 'RsaSignature2017', signatureValue: 'x' } };
  assert.equal((await verifyObjectProof(signed, network)).owner, ALICE);
});

test('rejects a modified object', async () => {
  const forged = { ...sign(note), content: 'Send me your password' };
  await assert.rejects(verifyObjectProof(forged, network), /verification failed/);
});

test('rejects a proof made with a key the actor does not list', async () => {
  const forged = sign(note, otherKeys.privateKey, `${ALICE}#other-key`);
  await assert.rejects(verifyObjectProof(forged, network), KeyResolutionError);
});

test('rejects a valid proof by an actor who does not own the object', async () => {
  const MALLORY = 'https://evil.example/users/mallory';
  const net = fakeFetch({ [MALLORY]: actor(MALLORY, otherKeys.publicKey) });
  const forged = sign(note, otherKeys.privateKey, `${MALLORY}#ed25519-key`);
  await assert.rejects(verifyObjectProof(forged, net), /belongs to/);
});

test('rejects an expired proof', async () => {
  const signed = sign(note);
  signed.proof.expires = '2026-01-01T00:00:00Z';
  await assert.rejects(verifyObjectProof(signed, network, { now: Date.parse('2026-10-15T12:00:00Z') }), /expired/);
});

test('rejects a proof with the wrong purpose', async () => {
  const signed = sign(note);
  signed.proof.proofPurpose = 'authentication';
  await assert.rejects(verifyObjectProof(signed, network), /assertionMethod/);
});
