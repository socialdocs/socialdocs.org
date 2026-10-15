#!/usr/bin/env node
// Refresh src/data/stats.json: fediverse totals and per-platform account
// counts from FediDB, latest stable versions from each project's releases.
//
// Usage: node scripts/generate-stats.mjs   (GITHUB_TOKEN optional, raises rate limits)
//
// The file is only rewritten (and asOf only moves) when a number or version
// actually changed, so the weekly workflow opens a PR only for real changes.
// If FediDB can't be reached the script exits 1 without touching the file.

import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const OUT = fileURLToPath(new URL('../src/data/stats.json', import.meta.url));
const FEDIDB = 'https://api.fedidb.org/v1';
const UA = 'socialdocs.org stats (+https://github.com/socialdocs/socialdocs.org)';

/** Platforms on the homepage: FediDB slug and where releases are published. */
const PLATFORMS = {
  Mastodon: {slug: 'mastodon', releases: {github: 'mastodon/mastodon'}},
  Lemmy: {slug: 'lemmy', releases: {github: 'LemmyNet/lemmy'}},
  Pixelfed: {slug: 'pixelfed', releases: {github: 'pixelfed/pixelfed'}},
  PeerTube: {slug: 'peertube', releases: {github: 'Chocobozzz/PeerTube'}},
  Misskey: {slug: 'misskey', releases: {github: 'misskey-dev/misskey'}},
  Pleroma: {slug: 'pleroma', releases: {gitlab: 'https://git.pleroma.social', project: 'pleroma/pleroma'}},
  GoToSocial: {slug: 'gotosocial', releases: {codeberg: 'superseriousbusiness/gotosocial'}},
  Friendica: {slug: 'friendica', releases: {github: 'friendica/friendica'}},
};

async function getJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {'User-Agent': UA, Accept: 'application/json', ...headers},
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function latestRelease(source) {
  try {
    if (source.github) {
      const headers = process.env.GITHUB_TOKEN ? {Authorization: `Bearer ${process.env.GITHUB_TOKEN}`} : {};
      const r = await getJson(`https://api.github.com/repos/${source.github}/releases/latest`, headers);
      return {version: r.tag_name.replace(/^v/, ''), released: r.published_at.slice(0, 10), url: r.html_url};
    }
    if (source.codeberg) {
      const r = await getJson(`https://codeberg.org/api/v1/repos/${source.codeberg}/releases/latest`);
      return {version: r.tag_name.replace(/^v/, ''), released: r.published_at.slice(0, 10), url: r.html_url};
    }
    if (source.gitlab) {
      const list = await getJson(`${source.gitlab}/api/v4/projects/${encodeURIComponent(source.project)}/releases?per_page=1`);
      const r = list[0];
      if (!r) return null;
      return {version: r.tag_name.replace(/^v/, ''), released: r.released_at.slice(0, 10), url: r._links?.self ?? null};
    }
  } catch (e) {
    console.warn(`  version unavailable: ${e.message}`);
  }
  return null;
}

async function main() {
  console.log('FediDB totals…');
  const totals = await getJson(`${FEDIDB}/stats`);

  const platforms = {};
  for (const [name, {slug, releases}] of Object.entries(PLATFORMS)) {
    console.log(`${name}…`);
    const software = await getJson(`${FEDIDB}/software/${slug}`);
    const release = await latestRelease(releases);
    platforms[name] = {
      accounts: software.user_count,
      instances: software.instance_count,
      version: release?.version ?? null,
      released: release?.released ?? null,
      releaseUrl: release?.url ?? null,
    };
  }

  const data = {
    fediverse: {
      accounts: totals.total_users,
      monthlyActive: totals.monthly_active_users,
      instances: totals.total_instances,
    },
    platforms,
  };

  let previous = null;
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    // first run
  }
  if (previous && JSON.stringify({...previous, asOf: undefined, sources: undefined}) === JSON.stringify({...data, asOf: undefined, sources: undefined})) {
    console.log('No changes.');
    return;
  }

  const out = {
    asOf: new Date().toISOString().slice(0, 10),
    sources: {
      accounts: 'https://api.fedidb.org/v1/stats and /v1/software/{slug} (FediDB)',
      versions: 'Latest non-prerelease release on GitHub, Codeberg or GitLab',
    },
    ...data,
  };
  await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
