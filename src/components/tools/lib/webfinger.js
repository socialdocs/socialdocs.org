// WebFinger helpers for the actor inspector. Pure functions, no I/O.

import {SOURCES} from './sources.js';

const AP_TYPES = ['application/activity+json', 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'];

/**
 * Turn user input into what to fetch.
 * Accepts @user@host, user@host, acct:user@host, or an https:// actor URL.
 * @param {string} input
 * @returns {{kind: 'acct', resource: string, host: string, webfingerUrl: string} | {kind: 'url', url: string}}
 */
export function parseTarget(input) {
  const value = input.trim();
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    return {kind: 'url', url: url.href};
  }
  const m = /^(?:acct:)?@?([^@\s/]+)@([^@\s/]+)$/i.exec(value);
  if (!m) throw new Error('Enter a handle like @alice@example.social or an https:// actor URL.');
  const [, user, host] = m;
  const resource = `acct:${user}@${host}`;
  const webfingerUrl = `https://${host}/.well-known/webfinger?resource=${encodeURIComponent(resource)}`;
  return {kind: 'acct', resource, host, webfingerUrl};
}

/**
 * @typedef {import('./as2-lint.js').Finding} Finding
 */

/**
 * Check a WebFinger JRD the way Mastodon does (docs: spec/webfinger).
 * @param {unknown} jrd
 * @param {{resource: string, contentType?: string}} options
 * @returns {{findings: Finding[], actorUrl?: string}}
 */
export function lintWebFinger(jrd, {resource, contentType}) {
  /** @type {Finding[]} */
  const findings = [];
  if (typeof jrd !== 'object' || jrd === null || Array.isArray(jrd)) {
    findings.push({level: 'error', path: '$', message: 'The WebFinger response is not a JSON object.', source: SOURCES.rfc7033});
    return {findings};
  }
  const doc = /** @type {Record<string, any>} */ (jrd);

  if (contentType !== undefined && !contentType.toLowerCase().startsWith('application/jrd+json')) {
    findings.push({level: 'info', path: 'Content-Type', message: `Served as "${contentType}". The JRD media type is application/jrd+json.`, source: SOURCES.rfc7033});
  }
  if (typeof doc.subject !== 'string') {
    findings.push({level: 'error', path: 'subject', message: 'No subject. Mastodon requires the subject to be present.', source: SOURCES.mastoWebfinger});
  } else if (doc.subject.toLowerCase() !== resource.toLowerCase()) {
    findings.push({level: 'info', path: 'subject', message: `subject is ${doc.subject}, not ${resource}. Mastodon then repeats the lookup for ${doc.subject} and requires it to point at the same actor.`, source: SOURCES.mastoWebfinger});
  }

  const links = Array.isArray(doc.links) ? doc.links : [];
  const self = links.find(
    (l) => l && l.rel === 'self' && typeof l.href === 'string' && AP_TYPES.includes(String(l.type)),
  );
  if (!self) {
    findings.push({level: 'error', path: 'links', message: 'No link with rel="self" and type application/activity+json (or application/ld+json with the Activity Streams profile). Mastodon cannot find the actor.', source: SOURCES.mastoWebfinger});
    return {findings};
  }
  return {findings, actorUrl: self.href};
}
