// HTTP routing. Plain node:http, no framework, so every step is visible.
import crypto from 'node:crypto';
import { KeyStore, safeFetchJson, signCavage } from '../../verify-requests/src/index.js';
import { urlsFor } from './config.js';
import * as doc from './documents.js';
import { makeInbox } from './inbox.js';
import { makeDeliver } from './deliver.js';

const AP_TYPE = 'application/activity+json';
const MAX_BODY = 1024 * 1024;

function send(res, status, body, type = AP_TYPE, extra = {}) {
  res.writeHead(status, { 'content-type': type, vary: 'Accept', ...extra });
  res.end(body == null ? undefined : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Body too large'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const sameToken = (given, expected) => {
  const a = Buffer.from(given || '');
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * Build the request handler. `fetchJson` and `deliver` can be replaced in
 * tests; by default they sign with our key and refuse private addresses.
 */
export function createApp({ cfg, store, fetchJson, deliver, log = console }) {
  const urls = urlsFor(cfg);
  const sign = (opts) => signCavage({ ...opts, keyId: urls.keyId, privateKey: store.privateKey });
  // Signed GETs: servers in "secure mode" (GoToSocial always, Mastodon with
  // AUTHORIZED_FETCH) refuse unsigned requests for actors and keys.
  fetchJson ??= (url) => safeFetchJson(url, {
    signRequest: ({ url: u }) => sign({ method: 'GET', url: u }),
    allowPrivateAddresses: cfg.allowPrivateAddresses,
  });
  deliver ??= makeDeliver({
    keyId: urls.keyId, privateKey: store.privateKey, allowPrivateAddresses: cfg.allowPrivateAddresses,
  });
  const keyStore = new KeyStore(fetchJson);
  const handleInbox = makeInbox({ cfg, urls, store, keyStore, fetchJson, deliver, log });
  const userPath = `/users/${cfg.username}`;

  async function publish(text) {
    const note = doc.note(urls, text);
    store.addNote(note);
    const activity = doc.create(urls, note);
    // One delivery per server when it has a shared inbox.
    const inboxes = [...new Set(store.followers().map((f) => f.sharedInbox || f.inbox))];
    const results = await Promise.all(inboxes.map((inbox) => deliver(inbox, activity)
      .then((status) => ({ inbox, status }), (err) => ({ inbox, error: err.message }))));
    return { note, deliveries: results };
  }

  return async function handler(req, res) {
    const url = new URL(req.url, urls.base);
    try {
      if (req.method === 'GET' && url.pathname === '/.well-known/webfinger') {
        if (url.searchParams.get('resource') !== `acct:${cfg.username}@${cfg.domain}`) return send(res, 404, null);
        return send(res, 200, doc.webfinger(cfg, urls), 'application/jrd+json',
          { 'access-control-allow-origin': '*' }); // RFC 7033 §5: CORS MUST be allowed
      }
      if (req.method === 'GET' && url.pathname === userPath) return send(res, 200, doc.actor(cfg, urls, store));
      if (req.method === 'GET' && url.pathname === `${userPath}/outbox`) return send(res, 200, doc.outbox(urls, store.notes()));
      if (req.method === 'GET' && url.pathname === `${userPath}/followers`) {
        return send(res, 200, doc.countOnlyCollection(urls.followers, store.followers().length));
      }
      if (req.method === 'GET' && url.pathname === `${userPath}/following`) {
        return send(res, 200, doc.countOnlyCollection(urls.following, 0));
      }
      if (req.method === 'GET' && url.pathname.startsWith('/notes/')) {
        const note = store.note(`${urls.base}${url.pathname}`);
        return note ? send(res, 200, { '@context': 'https://www.w3.org/ns/activitystreams', ...note }) : send(res, 404, null);
      }
      if (req.method === 'POST' && (url.pathname === `${userPath}/inbox` || url.pathname === '/inbox')) {
        const rawBody = await readBody(req);
        const [status, body] = await handleInbox({ method: req.method, path: req.url, headers: req.headers, rawBody });
        return send(res, status, body, 'application/json');
      }
      if (req.method === 'POST' && url.pathname === '/admin/notes' && cfg.adminToken) {
        if (!sameToken(req.headers.authorization, `Bearer ${cfg.adminToken}`)) return send(res, 401, null);
        const { text } = JSON.parse((await readBody(req)).toString('utf8'));
        if (typeof text !== 'string' || !text) return send(res, 400, { error: 'text required' }, 'application/json');
        return send(res, 201, await publish(text), 'application/json');
      }
      return send(res, 404, null, 'text/plain');
    } catch (err) {
      log.error?.(err);
      return send(res, err.status || 500, null, 'text/plain');
    }
  };
}
