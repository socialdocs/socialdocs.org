// The JSON documents other servers fetch from us.
import crypto from 'node:crypto';

const AS = 'https://www.w3.org/ns/activitystreams';
const PUBLIC = `${AS}#Public`;

/** WebFinger (RFC 7033): maps acct:alice@domain to the actor URL. */
export function webfinger(cfg, urls) {
  return {
    subject: `acct:${cfg.username}@${cfg.domain}`,
    aliases: [urls.actor],
    links: [{ rel: 'self', type: 'application/activity+json', href: urls.actor }],
  };
}

/** The actor. publicKey lets others verify the requests we sign. */
export function actor(cfg, urls, store) {
  return {
    '@context': [AS, 'https://w3id.org/security/v1'],
    id: urls.actor,
    type: 'Person',
    preferredUsername: cfg.username,
    name: cfg.displayName,
    inbox: urls.inbox,
    outbox: urls.outbox,
    followers: urls.followers,
    following: urls.following,
    endpoints: { sharedInbox: urls.sharedInbox },
    manuallyApprovesFollowers: false,
    publicKey: { id: urls.keyId, owner: urls.actor, publicKeyPem: store.publicKeyPem },
  };
}

/** A collection that only reveals its size. */
export function countOnlyCollection(id, totalItems) {
  return { '@context': AS, id, type: 'OrderedCollection', totalItems };
}

const escapeHtml = (s) => s.replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** A public Note. Plain text in, safe HTML out. */
export function note(urls, text, published = new Date()) {
  return {
    id: `${urls.base}/notes/${crypto.randomUUID()}`,
    type: 'Note',
    attributedTo: urls.actor,
    content: `<p>${escapeHtml(text)}</p>`,
    published: published.toISOString(),
    to: [PUBLIC],
    cc: [urls.followers],
  };
}

/** Wrap a Note in the Create we deliver; addressing mirrors the Note. */
export function create(urls, noteDoc) {
  return {
    '@context': AS,
    id: `${noteDoc.id}/activity`,
    type: 'Create',
    actor: urls.actor,
    published: noteDoc.published,
    to: noteDoc.to,
    cc: noteDoc.cc,
    object: noteDoc,
  };
}

/** Accept a Follow. The Follow is embedded so the receiver can match it. */
export function accept(urls, follow) {
  return {
    '@context': AS,
    id: `${urls.base}/accepts/${crypto.randomUUID()}`,
    type: 'Accept',
    actor: urls.actor,
    object: follow,
  };
}

/** The outbox: our public Creates, newest first. */
export function outbox(urls, notes) {
  const items = [...notes].reverse().map((n) => create(urls, n));
  return { '@context': AS, id: urls.outbox, type: 'OrderedCollection', totalItems: items.length, orderedItems: items };
}
