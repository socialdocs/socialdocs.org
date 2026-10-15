// Activity Streams 2.0 / ActivityPub object linter. Pure functions, no I/O.
// Every finding links the spec section or Mastodon source it comes from.

import {SOURCES} from './sources.js';

export const AS_CONTEXT = 'https://www.w3.org/ns/activitystreams';
export const PUBLIC_IRI = 'https://www.w3.org/ns/activitystreams#Public';

/** Activity Vocabulary types (https://www.w3.org/TR/activitystreams-vocabulary/#types) */
export const CORE_TYPES = [
  'Object', 'Link', 'Activity', 'IntransitiveActivity', 'Collection',
  'OrderedCollection', 'CollectionPage', 'OrderedCollectionPage',
];
export const ACTIVITY_TYPES = [
  'Accept', 'Add', 'Announce', 'Arrive', 'Block', 'Create', 'Delete', 'Dislike',
  'Flag', 'Follow', 'Ignore', 'Invite', 'Join', 'Leave', 'Like', 'Listen', 'Move',
  'Offer', 'Question', 'Reject', 'Read', 'Remove', 'TentativeReject',
  'TentativeAccept', 'Travel', 'Undo', 'Update', 'View',
];
export const ACTOR_TYPES = ['Application', 'Group', 'Organization', 'Person', 'Service'];
export const OBJECT_TYPES = [
  'Article', 'Audio', 'Document', 'Event', 'Image', 'Note', 'Page', 'Place',
  'Profile', 'Relationship', 'Tombstone', 'Video',
];
export const LINK_TYPES = ['Mention'];

const AS2_TYPES = new Set([
  ...CORE_TYPES, ...ACTIVITY_TYPES, ...ACTOR_TYPES, ...OBJECT_TYPES, ...LINK_TYPES,
]);

/** Widely used extension types and where they are defined. */
const EXTENSION_TYPES = {
  Hashtag: SOURCES.mastoExtensions,
  Emoji: SOURCES.mastoExtensions,
  PropertyValue: SOURCES.mastoExtensions,
  QuoteRequest: SOURCES.fep044f,
  QuoteAuthorization: SOURCES.fep044f,
  Multikey: SOURCES.fep521a,
};

// Mastodon only turns these into statuses (activity.rb SUPPORTED_TYPES + CONVERTED_TYPES)
const MASTODON_STATUS_TYPES = ['Note', 'Question', 'Image', 'Audio', 'Video', 'Article', 'Page', 'Event'];

const ADDRESSING = ['to', 'cc', 'bto', 'bcc', 'audience'];
const DATE_PROPERTIES = ['published', 'updated', 'startTime', 'endTime', 'deleted'];

// RFC 3339 date-time; AS2 allows omitting seconds and requires uppercase T and Z
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * @typedef {'error' | 'warning' | 'info'} Level
 * @typedef {{level: Level, path: string, message: string, source?: {label: string, url: string}}} Finding
 */

/** @param {unknown} value */
function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** @param {unknown} value @returns {string | undefined} */
function idOf(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (/** @type {any} */ (value).id) === 'string') {
    return /** @type {any} */ (value).id;
  }
  return undefined;
}

/** @param {string} url */
function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return undefined;
  }
}

/** @param {unknown} value */
function isPublic(value) {
  return value === PUBLIC_IRI || value === 'as:Public' || value === 'Public';
}

/** @param {unknown} context */
function includesAsContext(context) {
  return asArray(context).some((c) => c === AS_CONTEXT || c === `${AS_CONTEXT}/`);
}

/** @param {unknown} obj @returns {obj is Record<string, any>} */
function isObject(obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

/**
 * Lint one Activity Streams document.
 * @param {unknown} doc Parsed JSON
 * @param {{contentType?: string}} [options] contentType of the HTTP response, if fetched
 * @returns {Finding[]}
 */
export function lintObject(doc, options = {}) {
  /** @type {Finding[]} */
  const findings = [];
  const add = (/** @type {Level} */ level, path, message, source) =>
    findings.push({level, path, message, ...(source ? {source} : {})});

  if (!isObject(doc)) {
    add('error', '$', 'The document must be a JSON object.', SOURCES.as2Jsonld);
    return findings;
  }

  if (options.contentType !== undefined) {
    lintContentType(options.contentType, add);
  }

  if (doc['@context'] === undefined) {
    add('warning', '@context', 'No @context. JSON-LD processors (and Mastodon, for actors) need the Activity Streams context to interpret the document.', SOURCES.as2Jsonld);
  } else if (!includesAsContext(doc['@context'])) {
    add('warning', '@context', `@context does not include ${AS_CONTEXT}. Mastodon rejects actors whose context lacks it ("Unsupported JSON-LD context").`, SOURCES.mastoActorFetch);
  }

  lintNode(doc, '$', add, true);
  return findings;
}

/**
 * @param {string} contentType
 * @param {(level: Level, path: string, message: string, source?: any) => void} add
 */
function lintContentType(contentType, add) {
  const [mime, ...params] = contentType.split(';').map((s) => s.trim());
  const type = (mime || '').toLowerCase();
  if (type === 'application/activity+json') return;
  if (type === 'application/ld+json') {
    const profile = params.find((p) => p.toLowerCase().startsWith('profile='));
    const value = profile ? profile.slice(8).replace(/^"|"$/g, '') : '';
    if (value.split(/\s+/).includes(AS_CONTEXT)) return;
    add('error', 'Content-Type', `Served as application/ld+json without profile="${AS_CONTEXT}". Mastodon discards the response.`, SOURCES.mastoContentType);
    return;
  }
  add('error', 'Content-Type', `Served as "${contentType || '(none)'}". Mastodon only accepts application/activity+json or application/ld+json with the Activity Streams profile, and discards anything else.`, SOURCES.mastoContentType);
}

/**
 * @param {Record<string, any>} node
 * @param {string} path
 * @param {(level: Level, path: string, message: string, source?: any) => void} add
 * @param {boolean} topLevel
 */
function lintNode(node, path, add, topLevel) {
  const at = (/** @type {string} */ prop) => (path === '$' ? prop : `${path}.${prop}`);
  const types = asArray(node.type).filter((t) => typeof t === 'string');

  if (node.type === undefined) {
    add('error', at('type'), 'Missing type. All objects have a type.', SOURCES.apObjectIds);
  }
  for (const type of types) {
    if (AS2_TYPES.has(type)) continue;
    const extension = EXTENSION_TYPES[type];
    if (extension) {
      add('info', at('type'), `"${type}" is an extension type, not part of the Activity Vocabulary. Receivers that don't include its context will ignore it.`, extension);
    } else {
      add('warning', at('type'), `"${type}" is not an Activity Vocabulary type. Unless you define it in your @context, most receivers will ignore this object.`, SOURCES.as2Types);
    }
  }

  const isLink = types.some((t) => t === 'Link' || t === 'Mention' || t === 'Hashtag');
  if (node.id === undefined && !isLink) {
    const actor = types.some((t) => ACTOR_TYPES.includes(t));
    add(actor || topLevel ? 'error' : 'warning', at('id'), 'Missing id. Objects distributed by ActivityPub MUST have a unique global identifier unless intentionally transient.', SOURCES.apObjectIds);
  } else if (node.id !== null && node.id !== undefined) {
    if (typeof node.id !== 'string') {
      add('error', at('id'), 'id must be a string URI (or null for an anonymous object).', SOURCES.apObjectIds);
    } else if (!/^https?:\/\//i.test(node.id)) {
      add('warning', at('id'), `id "${node.id}" is not an HTTP(S) URI. Other servers can't dereference it, and relative ids are invalid.`, SOURCES.apObjectIds);
    } else if (/^http:\/\//i.test(node.id)) {
      add('info', at('id'), 'Publicly facing content SHOULD use HTTPS URIs.', SOURCES.apObjectIds);
    }
  }

  for (const prop of DATE_PROPERTIES) {
    if (node[prop] === undefined) continue;
    if (typeof node[prop] !== 'string' || !DATE_TIME.test(node[prop])) {
      add('error', at(prop), `${prop} "${node[prop]}" is not an RFC 3339 date-time with an uppercase T and a Z or numeric offset (e.g. 2026-10-15T12:00:00Z).`, SOURCES.as2Dates);
    }
  }

  if (types.some((t) => ACTOR_TYPES.includes(t))) lintActor(node, at, add);
  lintAddressing(node, at, add, types);

  if (types.includes('Create')) lintCreate(node, at, add);

  // Embedded objects (one level is enough for activities wrapping objects)
  if (topLevel && isObject(node.object)) {
    lintNode(node.object, at('object'), add, false);
  }
}

/**
 * @param {Record<string, any>} actor
 * @param {(prop: string) => string} at
 * @param {(level: Level, path: string, message: string, source?: any) => void} add
 */
function lintActor(actor, at, add) {
  for (const prop of ['inbox', 'outbox']) {
    if (!idOf(actor[prop])) {
      add('error', at(prop), `Actors MUST have an ${prop}.${prop === 'inbox' ? ' Mastodon rejects actors without one.' : ''}`, prop === 'inbox' ? SOURCES.mastoInbox : SOURCES.apActors);
    }
  }
  for (const prop of ['followers', 'following']) {
    if (!idOf(actor[prop])) {
      add('info', at(prop), `Actors SHOULD have a ${prop} collection.`, SOURCES.apActors);
    }
  }
  if (!actor.preferredUsername && !actor.webfinger) {
    add('error', at('preferredUsername'), 'No preferredUsername (or FEP-2c59 webfinger). Mastodon rejects the actor: "has neither \'preferredUsername\' nor `webfinger`".', SOURCES.mastoActorFetch);
  }

  const keys = asArray(actor.publicKey);
  const methods = asArray(actor.assertionMethod);
  if (keys.length === 0 && methods.length === 0) {
    add('warning', at('publicKey'), 'No publicKey or assertionMethod. Servers cannot verify HTTP signatures from this actor, so Mastodon will reject its deliveries.', SOURCES.mastoPublicKey);
  }
  keys.forEach((key, i) => {
    const keyPath = keys.length > 1 ? `${at('publicKey')}[${i}]` : at('publicKey');
    if (!isObject(key)) {
      add('warning', keyPath, 'publicKey should be embedded (an object with id, owner and publicKeyPem) so receivers can verify without another fetch.', SOURCES.mastoPublicKey);
      return;
    }
    if (typeof key.id !== 'string') add('error', `${keyPath}.id`, 'The key needs an id; it is what keyId in a signature points to.', SOURCES.mastoPublicKey);
    if (idOf(key.owner) && actor.id && idOf(key.owner) !== actor.id) {
      add('error', `${keyPath}.owner`, `Key owner ${idOf(key.owner)} is not this actor (${actor.id}). Verifiers must reject a key not owned by the actor that publishes it.`, SOURCES.mastoPublicKey);
    } else if (!key.owner) {
      add('warning', `${keyPath}.owner`, 'The key has no owner. Mastodon checks the owner when the key is fetched on its own.', SOURCES.mastoPublicKey);
    }
    if (typeof key.publicKeyPem !== 'string' || !/-----BEGIN (RSA )?PUBLIC KEY-----/.test(key.publicKeyPem)) {
      add('error', `${keyPath}.publicKeyPem`, 'publicKeyPem must be a PEM-encoded public key ("-----BEGIN PUBLIC KEY-----").', SOURCES.mastoPublicKey);
    } else if (key.publicKeyPem.includes('-----BEGIN RSA PUBLIC KEY-----')) {
      // Mastodon parses PKCS#1 with OpenSSL, but WebCrypto (used by many JS
      // servers) can only import SPKI keys.
      add('warning', `${keyPath}.publicKeyPem`, 'This is a PKCS#1 key ("BEGIN RSA PUBLIC KEY"). Mastodon accepts it, but implementations using WebCrypto can only import SPKI ("BEGIN PUBLIC KEY"); publish SPKI.', SOURCES.mastoPublicKey);
    }
    if (typeof key.id === 'string' && actor.id && hostOf(key.id) !== hostOf(actor.id)) {
      add('warning', `${keyPath}.id`, 'The key id is on a different host from the actor. Most servers expect actor#main-key style ids on the same origin.', SOURCES.mastoPublicKey);
    }
  });
}

/**
 * @param {Record<string, any>} node
 * @param {(prop: string) => string} at
 * @param {(level: Level, path: string, message: string, source?: any) => void} add
 * @param {string[]} types
 */
function lintAddressing(node, at, add, types) {
  for (const prop of ADDRESSING) {
    for (const value of asArray(node[prop])) {
      if (value === 'as:Public' || value === 'Public') {
        add('info', at(prop), `"${value}" is a valid compacted form of the Public collection, but JSON-only implementations may only recognise "${PUBLIC_IRI}". Prefer the full IRI.`, SOURCES.apPublic);
      }
    }
  }
  for (const prop of ['bto', 'bcc']) {
    if (node[prop] !== undefined) {
      add('warning', at(prop), `${prop} must be removed before delivery. It's fine in a client-to-server submission, but should never appear in a delivered or served object.`, SOURCES.apBtoBcc);
    }
  }

  const isStatus = types.some((t) => MASTODON_STATUS_TYPES.includes(t));
  if (!isStatus) return;

  const recipients = [...asArray(node.to), ...asArray(node.cc)].map(idOf).filter(Boolean);
  if (recipients.length === 0) {
    add('info', at('to'), 'No to or cc. Nobody will receive this object, and Mastodon will not show it.', SOURCES.mastoMention);
    return;
  }
  const hasPublic = recipients.some(isPublic);
  const looksLikeCollection = (/** @type {string} */ r) => /\/(followers|following)$/.test(r) || r === idOf(node.audience);
  if (hasPublic || recipients.some(looksLikeCollection)) return;

  const mentioned = new Set(
    asArray(node.tag)
      .filter((t) => isObject(t) && asArray(t.type).includes('Mention'))
      .map((t) => idOf(t.href))
      .filter(Boolean),
  );
  const unmentioned = recipients.filter((r) => !mentioned.has(r));
  if (unmentioned.length > 0) {
    add('warning', at('tag'), `Addressed only to specific actors, but ${unmentioned.join(', ')} ${unmentioned.length === 1 ? 'has' : 'have'} no Mention tag. Mastodon will treat this as "limited", not a direct message, and won't notify ${unmentioned.length === 1 ? 'them' : 'those recipients'}.`, SOURCES.mastoMention);
  }
}

/**
 * @param {Record<string, any>} activity
 * @param {(prop: string) => string} at
 * @param {(level: Level, path: string, message: string, source?: any) => void} add
 */
function lintCreate(activity, at, add) {
  const object = activity.object;
  if (typeof object === 'string') {
    add('info', at('object'), 'Create carries only the object URI. Mastodon fetches it (it must be on the actor\'s origin), which costs every receiver an extra request; embed the object instead.', SOURCES.mastoDereference);
    return;
  }
  if (!isObject(object)) {
    add('error', at('object'), 'Create needs an object.', SOURCES.mastoCreate);
    return;
  }
  const objectTypes = asArray(object.type);
  if (!objectTypes.some((t) => MASTODON_STATUS_TYPES.includes(t))) {
    add('warning', at('object.type'), `Mastodon ignores a Create whose object type isn't one of ${MASTODON_STATUS_TYPES.join(', ')}.`, SOURCES.mastoObjectTypes);
  }
  const actor = idOf(activity.actor);
  const objectId = idOf(object);
  if (actor && objectId && hostOf(actor) && hostOf(objectId) && hostOf(actor) !== hostOf(objectId)) {
    add('error', at('object.id'), `The object is on ${hostOf(objectId)} but the actor is on ${hostOf(actor)}. Mastodon rejects a Create whose object id isn't on the actor's host.`, SOURCES.mastoCreate);
  }
  const attributedTo = asArray(object.attributedTo).map(idOf).filter(Boolean);
  if (actor && attributedTo.length > 0 && !attributedTo.includes(actor)) {
    add('warning', at('object.attributedTo'), `The object is attributed to ${attributedTo.join(', ')}, but the activity's actor is ${actor}. Mastodon ignores attributedTo here and files the post under the sending actor.`, SOURCES.mastoCreate);
  }
}

/** @param {Finding[]} findings */
export function summarize(findings) {
  return {
    errors: findings.filter((f) => f.level === 'error').length,
    warnings: findings.filter((f) => f.level === 'warning').length,
    infos: findings.filter((f) => f.level === 'info').length,
  };
}
