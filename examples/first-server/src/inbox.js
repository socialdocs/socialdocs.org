// Handling POSTs to the inbox.
//
// Order matters: verify the signature over the raw body, require that the
// signer IS activity.actor, apply the origin rules, and only then act.
import {
  verifyRequest, parseActivityFrom, authorizeActivity,
  SignatureError, KeyResolutionError, AuthorizationError, UnsafeUrlError,
} from '../../verify-requests/src/index.js';
import { accept } from './documents.js';

const idOf = (v) => (typeof v === 'string' ? v : v?.id);

export function makeInbox({ cfg, urls, store, keyStore, fetchJson, deliver, log = console }) {
  async function onFollow(activity) {
    if (idOf(activity.object) !== urls.actor) return; // not a follow of us
    // Fetch the follower ourselves: never take an inbox URL from the activity.
    const { json: follower } = await fetchJson(activity.actor);
    if (follower.id !== activity.actor || !follower.inbox) throw new Error('Unusable follower actor');
    store.addFollower(follower.id, {
      inbox: follower.inbox,
      sharedInbox: follower.endpoints?.sharedInbox,
    });
    const status = await deliver(follower.inbox, accept(urls, activity));
    log.info?.(`Accepted follow from ${follower.id} (HTTP ${status})`);
  }

  function onUndo(activity) {
    const inner = activity.object;
    if (inner?.type === 'Follow' && idOf(inner.object) === urls.actor) {
      store.removeFollower(activity.actor); // authorizeActivity checked inner.actor
    }
  }

  /** Returns [status, body]. Work that talks to other servers runs after we answer. */
  return async function handleInbox({ method, path, headers, rawBody }) {
    let activity;
    try {
      const signer = await verifyRequest({
        method,
        url: `https://${cfg.domain}${path}`, // the URL the sender signed, query string included
        headers,
        rawBody,
      }, { keyStore });
      activity = parseActivityFrom(signer, rawBody);
      authorizeActivity(activity);
    } catch (err) {
      if (err instanceof SignatureError || err instanceof KeyResolutionError ||
          err instanceof AuthorizationError || err instanceof UnsafeUrlError ||
          err instanceof SyntaxError) {
        log.warn?.(`Rejected inbox POST: ${err.message}`);
        return [401, { error: err.message }];
      }
      // Couldn't reach the sender's key: ask them to retry later.
      log.warn?.(`Could not verify inbox POST: ${err.message}`);
      return [503, { error: 'Temporarily unable to verify' }];
    }

    const work = activity.type === 'Follow' ? () => onFollow(activity)
      : activity.type === 'Undo' ? () => onUndo(activity)
      : null; // a real server would handle Create, Like, Delete, ... here
    if (work) {
      setImmediate(() => Promise.resolve().then(work)
        .catch((err) => log.error?.(`${activity.type} from ${activity.actor} failed: ${err.message}`)));
    }
    return [202, null];
  };
}
