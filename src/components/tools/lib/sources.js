// Primary sources cited by the tools. Mastodon source links are pinned to
// the release the rules were checked against.

const MASTODON = 'https://github.com/mastodon/mastodon/blob/v4.7.3';

/** @typedef {{label: string, url: string}} Source */

/** @type {Record<string, Source>} */
export const SOURCES = {
  apObjectIds: {
    label: 'ActivityPub §3.1 Object Identifiers',
    url: 'https://www.w3.org/TR/activitypub/#x3-1-object-identifiers',
  },
  apRetrieving: {
    label: 'ActivityPub §3.2 Retrieving objects',
    url: 'https://www.w3.org/TR/activitypub/#retrieving-objects',
  },
  apActors: {
    label: 'ActivityPub §4.1 Actor objects',
    url: 'https://www.w3.org/TR/activitypub/#actor-objects',
  },
  apPublic: {
    label: 'ActivityPub §5.6 Public Addressing',
    url: 'https://www.w3.org/TR/activitypub/#public-addressing',
  },
  apBtoBcc: {
    label: 'ActivityPub: remove bto and bcc before delivery',
    url: 'https://www.w3.org/TR/activitypub/#remove-bto-bcc-before-delivery',
  },
  as2Jsonld: {
    label: 'Activity Streams 2.0 Core §2.1 JSON-LD',
    url: 'https://www.w3.org/TR/activitystreams-core/#jsonld',
  },
  as2Dates: {
    label: 'Activity Streams 2.0 Core §2.3 Date and Times',
    url: 'https://www.w3.org/TR/activitystreams-core/#dates',
  },
  as2Types: {
    label: 'Activity Vocabulary §3 Core Types and Extended Types',
    url: 'https://www.w3.org/TR/activitystreams-vocabulary/#types',
  },
  mastoActorFetch: {
    label: 'Mastodon fetch_remote_actor_service.rb',
    url: `${MASTODON}/app/services/activitypub/fetch_remote_actor_service.rb#L31-L34`,
  },
  mastoInbox: {
    label: 'Mastodon process_account_service.rb',
    url: `${MASTODON}/app/services/activitypub/process_account_service.rb#L24`,
  },
  mastoCreate: {
    label: 'Mastodon activity/create.rb and activity.rb',
    url: `${MASTODON}/app/lib/activitypub/activity/create.rb#L18`,
  },
  mastoObjectTypes: {
    label: 'Mastodon activity.rb (supported and converted object types)',
    url: `${MASTODON}/app/lib/activitypub/activity.rb#L9-L10`,
  },
  mastoContentType: {
    label: 'Mastodon json_ld_helper.rb (valid_activitypub_content_type?)',
    url: `${MASTODON}/app/helpers/json_ld_helper.rb#L351-L361`,
  },
  mastoMention: {
    label: 'Mastodon docs: Mentions for addressing and notifications',
    url: 'https://docs.joinmastodon.org/spec/activitypub/#Mention',
  },
  mastoPublicKey: {
    label: 'Mastodon docs: Public key',
    url: 'https://docs.joinmastodon.org/spec/activitypub/#publicKey',
  },
  mastoExtensions: {
    label: 'Mastodon docs: JSON-LD contexts and extensions',
    url: 'https://docs.joinmastodon.org/spec/activitypub/#contexts',
  },
  mastoWebfinger: {
    label: 'Mastodon docs: WebFinger',
    url: 'https://docs.joinmastodon.org/spec/webfinger/',
  },
  mastoSignedRequest: {
    label: 'Mastodon signed_request.rb',
    url: `${MASTODON}/app/lib/signed_request.rb#L55-L58`,
  },
  mastoSecurity: {
    label: 'Mastodon docs: Security (HTTP Signatures)',
    url: 'https://docs.joinmastodon.org/spec/security/',
  },
  fep044f: {
    label: 'FEP-044f: Consent-respecting quote posts',
    url: 'https://codeberg.org/fediverse/fep/src/branch/main/fep/044f/fep-044f.md',
  },
  fep521a: {
    label: "FEP-521a: Representing actor's public keys",
    url: 'https://codeberg.org/fediverse/fep/src/branch/main/fep/521a/fep-521a.md',
  },
  rfc7033: {
    label: 'RFC 7033 WebFinger',
    url: 'https://www.rfc-editor.org/rfc/rfc7033',
  },
  rfc9421: {
    label: 'RFC 9421 HTTP Message Signatures §2.5',
    url: 'https://www.rfc-editor.org/rfc/rfc9421#name-creating-the-signature-base',
  },
  cavage: {
    label: 'draft-cavage-http-signatures-12 §2.3',
    url: 'https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12#section-2.3',
  },
};
