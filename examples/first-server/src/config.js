// Settings come from the environment so the same code runs locally, in
// tests and in the Docker federation test.
export function loadConfig(env = process.env) {
  const domain = env.DOMAIN;
  if (!domain) throw new Error('Set DOMAIN to the public hostname of this server (e.g. social.example)');
  return {
    domain,
    username: env.USERNAME || 'alice',
    displayName: env.DISPLAY_NAME || 'Alice',
    port: Number(env.PORT || 8443),
    tlsCert: env.TLS_CERT,   // PEM paths; omit them behind a TLS-terminating proxy
    tlsKey: env.TLS_KEY,
    dataDir: env.DATA_DIR,   // keys and followers persist here when set
    adminToken: env.ADMIN_TOKEN, // enables POST /admin/notes when set
    // Lets the server fetch and deliver to private IPs. ONLY for local
    // development and the Docker integration test, never in production.
    allowPrivateAddresses: env.ALLOW_PRIVATE_ADDRESSES === 'true',
  };
}

/** All public URLs of the server's single actor. */
export function urlsFor({ domain, username }) {
  const base = `https://${domain}`;
  const actor = `${base}/users/${username}`;
  return {
    base,
    actor,
    keyId: `${actor}#main-key`,
    inbox: `${actor}/inbox`,
    outbox: `${actor}/outbox`,
    followers: `${actor}/followers`,
    following: `${actor}/following`,
    sharedInbox: `${base}/inbox`,
  };
}
