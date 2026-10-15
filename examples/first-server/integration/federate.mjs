// Drives the federation test from inside the compose network.
//   node integration/federate.mjs wait      wait until both servers answer
//   node integration/federate.mjs federate  follow ap.test from GoToSocial,
//                                           then post and check delivery
const GTS = 'https://gts.test';
const AP = 'https://ap.test';
const OOB = 'urn:ietf:wg:oauth:2.0:oob';
const { ADMIN_TOKEN, GTS_EMAIL, GTS_PASSWORD } = process.env;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(what, fn, { timeoutMs = 120_000, everyMs = 2_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try { const v = await fn(); if (v) return v; } catch (err) { last = err; }
    await sleep(everyMs);
  }
  throw new Error(`Timed out waiting for ${what}${last ? `: ${last.message}` : ''}`);
}

async function json(res) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.url}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

// --- OAuth "out of band" flow, as in GoToSocial's docs/api/authentication.md
async function getToken() {
  const app = await json(await fetch(`${GTS}/api/v1/apps`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_name: 'federation-test', redirect_uris: OOB, scopes: 'read write' }),
  }));

  const cookies = new Map();
  async function browse(url, init = {}) {
    for (let hop = 0; hop < 10; hop++) {
      const res = await fetch(url, {
        ...init,
        redirect: 'manual',
        headers: { ...init.headers, cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; ') },
      });
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(';');
        const i = pair.indexOf('=');
        cookies.set(pair.slice(0, i), pair.slice(i + 1));
      }
      if (![301, 302, 303, 307, 308].includes(res.status)) return res;
      url = new URL(res.headers.get('location'), url).href;
      init = {}; // follow redirects with GET
    }
    throw new Error('Too many redirects');
  }

  const authorize = `${GTS}/oauth/authorize?` + new URLSearchParams({
    client_id: app.client_id, redirect_uri: OOB, response_type: 'code', scope: 'read write',
  });
  await browse(authorize); // sets the session, lands on the sign-in form
  const form = { 'content-type': 'application/x-www-form-urlencoded' };
  await browse(`${GTS}/auth/sign_in`, {
    method: 'POST', headers: form,
    body: new URLSearchParams({ username: GTS_EMAIL, password: GTS_PASSWORD }).toString(),
  });
  const oob = await browse(`${GTS}/oauth/authorize`, { method: 'POST', headers: form, body: '' });
  const page = await oob.text();
  const code = page.match(/<code>([^<]+)<\/code>/)?.[1];
  if (!code) throw new Error(`No out-of-band code (HTTP ${oob.status}): ${page.slice(0, 500)}`);

  const token = await json(await fetch(`${GTS}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      redirect_uri: OOB, client_id: app.client_id, client_secret: app.client_secret,
      grant_type: 'authorization_code', code,
    }),
  }));
  return token.access_token;
}

async function waitForServers() {
  await poll('GoToSocial /readyz', async () => (await fetch(`${GTS}/readyz`)).ok);
  await poll('ap.test WebFinger', async () =>
    (await fetch(`${AP}/.well-known/webfinger?resource=acct:tester@ap.test`)).ok);
  console.log('Both servers are up');
}

async function federate() {
  const token = await getToken();
  const api = (path, init = {}) => fetch(`${GTS}${path}`, {
    ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...init.headers },
  }).then(json);
  console.log('Got a GoToSocial API token');

  // 1. GoToSocial resolves @tester@ap.test (WebFinger + signed actor fetch).
  const found = await poll('account lookup', async () =>
    (await api(`/api/v2/search?${new URLSearchParams({ q: '@tester@ap.test', resolve: 'true', type: 'accounts', limit: '1' })}`)).accounts[0],
  { timeoutMs: 60_000 });
  console.log(`Resolved ${found.acct} (${found.id})`);

  // 2. Follow it: GoToSocial delivers a signed Follow to our inbox, our
  //    server verifies it and answers with a signed Accept.
  await api(`/api/v1/accounts/${found.id}/follow`, { method: 'POST', body: '{}' });
  const rel = await poll('the Follow to be accepted', async () => {
    const [r] = await api(`/api/v1/accounts/relationships?id[]=${found.id}`);
    return r.following ? r : null;
  }, { timeoutMs: 60_000 });
  console.log(`GoToSocial now follows ${found.acct} (requested=${rel.requested})`);

  const followers = await json(await fetch(`${AP}/users/tester/followers`, { headers: { accept: 'application/activity+json' } }));
  if (followers.totalItems !== 1) throw new Error(`Expected 1 follower on ap.test, got ${followers.totalItems}`);

  // 3. Post from ap.test; it must arrive in the follower's home timeline.
  const marker = `Federation test ${Date.now()}`;
  const published = await json(await fetch(`${AP}/admin/notes`, {
    method: 'POST',
    headers: { authorization: `Bearer ${ADMIN_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: marker }),
  }));
  console.log('Deliveries:', JSON.stringify(published.deliveries));
  if (!published.deliveries.every((d) => d.status >= 200 && d.status < 300)) {
    throw new Error('A delivery was not accepted');
  }
  const status = await poll('the Note in the home timeline', async () =>
    (await api('/api/v1/timelines/home?limit=20')).find((s) => s.content.includes(marker)),
  { timeoutMs: 60_000 });
  if (status.account.acct !== 'tester@ap.test') throw new Error(`Unexpected author ${status.account.acct}`);
  console.log(`Note arrived on GoToSocial: ${status.uri}`);
}

const step = process.argv[2];
try {
  if (step === 'wait') await waitForServers();
  else if (step === 'federate') await federate();
  else throw new Error('Usage: federate.mjs wait|federate');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
