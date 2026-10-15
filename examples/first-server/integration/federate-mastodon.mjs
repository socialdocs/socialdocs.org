// Drives the Mastodon federation test from inside the compose network.
//   node integration/federate-mastodon.mjs wait      wait until both servers answer
//   node integration/federate-mastodon.mjs federate  follow ap.test from Mastodon,
//                                                    then post and check delivery
const MASTODON = 'https://mastodon.test';
const AP = 'https://ap.test';
const { ADMIN_TOKEN, MASTODON_TOKEN } = process.env;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(what, fn, { timeoutMs = 180_000, everyMs = 2_000 } = {}) {
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

async function waitForServers() {
  await poll('Mastodon /health', async () => (await fetch(`${MASTODON}/health`)).ok, { timeoutMs: 300_000 });
  await poll('ap.test WebFinger', async () =>
    (await fetch(`${AP}/.well-known/webfinger?resource=acct:tester@ap.test`)).ok);
  console.log('Both servers are up');
}

async function federate() {
  if (!MASTODON_TOKEN) throw new Error('MASTODON_TOKEN is not set');
  const api = (path, init = {}) => fetch(`${MASTODON}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${MASTODON_TOKEN}`, 'content-type': 'application/json', ...init.headers },
  }).then(json);

  // 1. Mastodon resolves @tester@ap.test (WebFinger + actor fetch).
  const found = await poll('account lookup', async () =>
    (await api(`/api/v2/search?${new URLSearchParams({ q: '@tester@ap.test', resolve: 'true', type: 'accounts', limit: '1' })}`)).accounts[0],
  { timeoutMs: 90_000 });
  console.log(`Resolved ${found.acct} (${found.id})`);

  // 2. Follow it: Mastodon delivers a signed Follow to our inbox, our
  //    server verifies it and answers with a signed Accept.
  await api(`/api/v1/accounts/${found.id}/follow`, { method: 'POST', body: '{}' });
  const rel = await poll('the Follow to be accepted', async () => {
    const [r] = await api(`/api/v1/accounts/relationships?id[]=${found.id}`);
    return r.following ? r : null;
  }, { timeoutMs: 120_000 });
  console.log(`Mastodon now follows ${found.acct} (requested=${rel.requested})`);

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
  { timeoutMs: 120_000 });
  if (status.account.acct !== 'tester@ap.test') throw new Error(`Unexpected author ${status.account.acct}`);
  console.log(`Note arrived on Mastodon: ${status.uri}`);
}

const step = process.argv[2];
try {
  if (step === 'wait') await waitForServers();
  else if (step === 'federate') await federate();
  else throw new Error('Usage: federate-mastodon.mjs wait|federate');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
