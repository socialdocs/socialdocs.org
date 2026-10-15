// Origin-based authorization for incoming activities, following
// FEP-fe34 (https://codeberg.org/fediverse/fep/src/branch/main/fep/fe34/fep-fe34.md).
//
// Run this AFTER verifyRequest + parseActivityFrom have established that the
// signer is activity.actor. It answers: is this actor allowed to do this to
// that object, and can embedded copies be trusted or must they be refetched?

export class AuthorizationError extends Error {}

const idOf = (v) => (typeof v === 'string' ? v : v && typeof v === 'object' ? v.id : undefined);

export function origin(uri) {
  const u = new URL(uri);
  return `${u.protocol}//${u.host.toLowerCase()}`; // URL already normalises default ports
}

export const sameOrigin = (a, b) => origin(a) === origin(b);

/** Owner of an object per FEP-fe34: actor -> id, activity -> actor, else attributedTo. */
export function ownerOf(object) {
  if (object.owner || object.controller) return idOf(object.owner || object.controller);
  if (object.inbox && object.outbox) return object.id;
  if (object.actor) return idOf(object.actor);
  return idOf(object.attributedTo);
}

/**
 * Decide what to do with an activity whose actor is already authenticated.
 * Returns { trustEmbedded: boolean } — when false, refetch `object` from its
 * own id (with safeFetchJson) instead of trusting the copy in the activity.
 * Throws AuthorizationError when the activity must be rejected.
 */
export function authorizeActivity(activity) {
  const actor = idOf(activity.actor);
  if (!actor) throw new AuthorizationError('Activity has no actor');
  if (activity.id && !sameOrigin(activity.id, actor)) {
    throw new AuthorizationError('Activity id and actor have different origins');
  }
  const object = activity.object;
  const objectId = idOf(object);
  const embedded = object && typeof object === 'object';

  switch (activity.type) {
    case 'Create': {
      // The creator must own the new object, on the same origin.
      if (!embedded) return { trustEmbedded: false };
      if (idOf(object.attributedTo) !== actor) throw new AuthorizationError('Create of an object attributed to someone else');
      if (objectId && !sameOrigin(objectId, actor)) throw new AuthorizationError('Created object is on another origin');
      return { trustEmbedded: true };
    }
    case 'Update':
    case 'Delete': {
      // Only the owner may modify or delete. If we only have an id, the
      // object must at least live on the actor's origin.
      if (!objectId) throw new AuthorizationError(`${activity.type} without an object id`);
      if (!sameOrigin(objectId, actor)) throw new AuthorizationError(`${activity.type} of an object on another origin`);
      if (embedded && activity.type === 'Update' && ownerOf(object) !== actor) {
        throw new AuthorizationError('Update of an object owned by someone else');
      }
      return { trustEmbedded: embedded && activity.type === 'Update' };
    }
    case 'Undo': {
      if (embedded && idOf(object.actor) !== actor) throw new AuthorizationError('Undo of someone else’s activity');
      if (objectId && !sameOrigin(objectId, actor)) throw new AuthorizationError('Undo of an activity on another origin');
      return { trustEmbedded: embedded };
    }
    case 'Announce':
    case 'Like':
      // These don't modify their object, so owners may differ — but an
      // embedded object from another origin is just a claim: refetch it.
      return { trustEmbedded: Boolean(embedded && objectId && sameOrigin(objectId, actor)) };
    default:
      return { trustEmbedded: Boolean(embedded && (!objectId || sameOrigin(objectId, actor))) };
  }
}
