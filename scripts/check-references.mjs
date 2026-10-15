#!/usr/bin/env node
// Verify that every package, crate, gem, module and repository named in the
// docs actually exists. Fails (exit 1) on names that resolve to "not found";
// network errors and rate limits are reported as warnings only.
//
// Usage: node scripts/check-references.mjs [files...]
//   With no arguments, scans docs/ and blog/.
//   GITHUB_TOKEN raises the GitHub API rate limit.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE_FILE = path.join(ROOT, '.cache', 'check-references.json');
const ALLOWLIST_FILE = path.join(ROOT, 'scripts', 'reference-allowlist.txt');
const OK_TTL = 7 * 24 * 3600 * 1000;
const MISSING_TTL = 24 * 3600 * 1000;
const UA = 'socialdocs-reference-check (+https://github.com/socialdocs/socialdocs.org)';

// ---------- collect ----------

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const PLACEHOLDER = /[<>{}$*]|\byour[-_]|\bexample\b|\.example\b|^\.|^\//i;

function cleanNpm(tok) {
  // strip version: name@1.2, @scope/name@1.2
  const m = tok.match(/^(@[^/@\s]+\/[^@\s]+|[^@\s]+)/);
  return m ? m[1] : tok;
}

const COMMANDS = [
  // [regex for the command prefix, kind, token cleaner]
  [/\b(?:npm\s+(?:install|i|add)|yarn\s+(?:global\s+)?add|pnpm\s+(?:add|install)|npx)\s+(.+)/, 'npm', cleanNpm],
  [/\b(?:pip3?|python3?\s+-m\s+pip|uv\s+(?:pip\s+install|add)|poetry\s+add)\s+(?:install\s+)?(.+)/, 'pypi', t => t.replace(/\[.*?\]/, '').split(/[=<>!~;]/)[0]],
  [/\bcargo\s+(?:add|install)\s+(.+)/, 'crates', t => t.split('@')[0]],
  [/\bgem\s+install\s+(.+)/, 'gem', t => t],
  [/\bcomposer\s+require\s+(.+)/, 'packagist', t => t.split(':')[0]],
  [/\bgo\s+(?:get|install)\s+(.+)/, 'go', t => t.split('@')[0]],
];

const LINKS = [
  [/https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/g, 'github', m => `${m[1]}/${m[2].replace(/\.git$/, '')}`],
  [/https?:\/\/codeberg\.org\/([\w.-]+)\/([\w.-]+)/g, 'codeberg', m => `${m[1]}/${m[2].replace(/\.git$/, '')}`],
  [/https?:\/\/(?:www\.)?npmjs\.com\/package\/((?:@[\w.-]+\/)?[\w.-]+)/g, 'npm', m => m[1]],
  [/https?:\/\/pypi\.org\/project\/([\w.-]+)/g, 'pypi', m => m[1]],
  [/https?:\/\/crates\.io\/crates\/([\w-]+)/g, 'crates', m => m[1]],
  [/https?:\/\/docs\.rs\/([\w-]+)/g, 'crates', m => m[1]],
  [/https?:\/\/rubygems\.org\/gems\/([\w.-]+)/g, 'gem', m => m[1]],
  [/https?:\/\/packagist\.org\/packages\/([\w.-]+\/[\w.-]+)/g, 'packagist', m => m[1]],
  [/https?:\/\/pkg\.go\.dev\/([\w.\-/]+)/g, 'go', m => m[1].replace(/\/+$/, '')],
];

// GitHub paths that are not repositories
const GH_NON_REPO = new Set(['orgs', 'topics', 'sponsors', 'features', 'marketplace', 'settings', 'search', 'about', 'apps', 'collections', 'explore', 'login', 'notifications', 'pulls', 'issues', 'users', 'enterprise', 'security', 'advisories', 'site', 'readme', 'trending']);

function collect(files) {
  const refs = new Map(); // key -> {kind, name, where: []}
  const add = (kind, name, where) => {
    if (!name || PLACEHOLDER.test(name)) return;
    name = name.replace(/[.,;:)'"`\]]+$/, '');
    if (!name) return;
    const key = `${kind}:${kind === 'github' || kind === 'codeberg' ? name.toLowerCase() : name}`;
    if (!refs.has(key)) refs.set(key, {kind, name, where: []});
    refs.get(key).where.push(where);
  };
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const where = `${rel}:${i + 1}`;
      for (const [re, kind, clean] of COMMANDS) {
        const m = line.match(re);
        if (!m) continue;
        // tokens until a shell separator or comment
        const rest = m[1].split(/\s*(?:&&|\|\||;|\||#|`|\))/)[0];
        const isNpx = /\bnpx\s/.test(m[0]);
        for (const tok of rest.trim().split(/\s+/)) {
          if (!tok || tok.startsWith('-') || /^[a-z]+:\/\//i.test(tok)) continue;
          if (tok.includes('=') && kind !== 'pypi') continue;
          if (/^(install|add|global|i)$/.test(tok)) continue;
          add(kind, clean(tok), where);
          if (isNpx) break; // npx <pkg> <args...>: only the package is a reference
        }
      }
      for (const [re, kind, pick] of LINKS) {
        for (const m of line.matchAll(re)) {
          if (kind === 'github' && GH_NON_REPO.has(m[1].toLowerCase())) continue;
          add(kind, pick(m), where);
        }
      }
    });
  }
  return refs;
}

// ---------- resolve ----------

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

async function get(url, headers = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {'User-Agent': UA, ...headers},
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        if (attempt === 2) return {status: res.status};
        continue;
      }
      return {status: res.status, res};
    } catch (err) {
      if (attempt === 2) return {status: 0, error: String(err.message || err)};
    }
  }
}

function goEscape(mod) {
  return mod.replace(/[A-Z]/g, c => '!' + c.toLowerCase());
}

async function resolve({kind, name}) {
  switch (kind) {
    case 'npm': {
      const enc = name.startsWith('@') ? '@' + encodeURIComponent(name.slice(1)) : encodeURIComponent(name);
      return classify(await get(`https://registry.npmjs.org/${enc}`, {Accept: 'application/vnd.npm.install-v1+json'}));
    }
    case 'pypi':
      return classify(await get(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`));
    case 'crates':
      return classify(await get(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`));
    case 'gem':
      return classify(await get(`https://rubygems.org/api/v1/gems/${encodeURIComponent(name)}.json`));
    case 'packagist':
      return classify(await get(`https://repo.packagist.org/p2/${name.toLowerCase()}.json`));
    case 'go': {
      // The named path may be a package inside a module: try shorter prefixes.
      const parts = name.split('/');
      let last;
      for (let n = parts.length; n >= Math.min(parts.length, 2); n--) {
        last = classify(await get(`https://proxy.golang.org/${goEscape(parts.slice(0, n).join('/'))}/@latest`));
        if (last.state === 'ok') return last;
        if (last.state === 'error') return last;
      }
      return last;
    }
    case 'github': {
      const r = await get(`https://api.github.com/repos/${name}`, {
        Accept: 'application/vnd.github+json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      });
      if (r.status === 403 || r.status === 429) return {state: 'error', detail: `HTTP ${r.status} (rate limited?)`};
      const c = classify(r);
      if (c.state === 'ok') {
        const body = await r.res.json();
        const canonical = body.full_name;
        if (canonical && canonical.toLowerCase() !== name.toLowerCase()) c.detail = `moved to ${canonical}`;
        if (body.archived) c.detail = (c.detail ? c.detail + '; ' : '') + 'archived';
      }
      return c;
    }
    case 'codeberg': {
      const c = classify(await get(`https://codeberg.org/api/v1/repos/${name}`));
      return c;
    }
  }
  return {state: 'error', detail: 'unknown kind'};
}

function classify(r) {
  if (r.status >= 200 && r.status < 300) return {state: 'ok'};
  if (r.status === 404 || r.status === 410) return {state: 'missing', detail: `HTTP ${r.status}`};
  return {state: 'error', detail: r.error || `HTTP ${r.status}`};
}

// ---------- main ----------

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_FILE)) return [];
  return fs.readFileSync(ALLOWLIST_FILE, 'utf8').split('\n')
    .map(l => l.replace(/#.*/, '').trim()).filter(Boolean)
    .map(l => {
      const [kind, ...rest] = l.split(':');
      return {kind, re: new RegExp(`^${rest.join(':').replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`, 'i')};
    });
}

async function main() {
  const args = process.argv.slice(2).filter(a => /\.mdx?$/.test(a) && fs.existsSync(a));
  const files = args.length ? args.map(a => path.resolve(a)) : [...walk(path.join(ROOT, 'docs')), ...walk(path.join(ROOT, 'blog'))];
  const allow = loadAllowlist();
  const refs = [...collect(files).values()].filter(r => !allow.some(a => (a.kind === r.kind || a.kind === '*') && a.re.test(r.name)));

  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch {}
  const now = Date.now();

  const results = [];
  const queue = [...refs];
  const workers = Array.from({length: 6}, async () => {
    while (queue.length) {
      const ref = queue.shift();
      const key = `${ref.kind}:${ref.name}`;
      const hit = cache[key];
      let result;
      if (hit && now - hit.at < (hit.state === 'ok' ? OK_TTL : MISSING_TTL)) result = hit;
      else {
        result = await resolve(ref);
        if (result.state !== 'error') cache[key] = {...result, at: now};
      }
      results.push({...ref, ...result});
    }
  });
  await Promise.all(workers);

  fs.mkdirSync(path.dirname(CACHE_FILE), {recursive: true});
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));

  const by = s => results.filter(r => r.state === s).sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  const missing = by('missing'), errors = by('error');
  const notes = by('ok').filter(r => r.detail);
  const show = r => `  ${r.kind}:${r.name} — ${r.detail || r.state}\n${r.where.slice(0, 5).map(w => `      ${w}`).join('\n')}${r.where.length > 5 ? `\n      … ${r.where.length - 5} more` : ''}`;

  console.log(`Checked ${results.length} references in ${files.length} files.`);
  if (notes.length) console.log(`\nResolved with notes (${notes.length}):\n${notes.map(show).join('\n')}`);
  if (errors.length) console.log(`\nCould not check (${errors.length}) — not failing:\n${errors.map(show).join('\n')}`);
  if (missing.length) {
    console.log(`\nNOT FOUND (${missing.length}):\n${missing.map(show).join('\n')}`);
    console.log('\nIf a name is an intentional placeholder, add it to scripts/reference-allowlist.txt.');
    process.exit(1);
  }
  console.log('\nAll named references resolve.');
}

main().catch(err => { console.error(err); process.exit(2); });
