import React, {useId, useState, type ReactNode} from 'react';
import styles from './tools.module.css';
import {Findings, type Finding} from './Findings';
import {lintObject} from './lib/as2-lint.js';
import {parseTarget, lintWebFinger} from './lib/webfinger.js';

type Step = {ok: boolean; text: string};

type FetchResult = {status: number; contentType: string; json: unknown};

const MAX_BYTES = 1_000_000;

/** Fetch JSON from the browser, translating the failure modes into plain language. */
const BLOCKED = {
  webfinger:
    'The browser could not read the WebFinger response. Either the server does not send Access-Control-Allow-Origin ' +
    '(RFC 7033 §5 says WebFinger MUST), or it is unreachable or blocking automated requests. ' +
    'Try `fedify lookup` with the handle and paste the actor JSON below.',
  actor:
    'The browser could not read the actor document. Either this endpoint does not send CORS headers ' +
    '(ActivityPub does not require them, and many servers omit them), or it is unreachable. ' +
    'Fetch it with `fedify lookup` or curl and paste the JSON below.',
};

async function fetchJson(url: string, accept: string, stage: keyof typeof BLOCKED): Promise<FetchResult> {
  let response: Response;
  try {
    // Only CORS-safelisted headers, so the browser makes a simple request (no preflight)
    response = await fetch(url, {headers: {Accept: accept}, redirect: 'follow', credentials: 'omit'});
  } catch {
    throw new Error(BLOCKED[stage]);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `HTTP ${response.status}: the server requires signed requests (Mastodon "secure mode" / authorized fetch). ` +
        'A browser cannot sign them. Use `fedify lookup` (which signs) and paste the JSON below.',
    );
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  const text = await response.text();
  if (text.length > MAX_BYTES) throw new Error('Response is larger than 1 MB; not parsing it.');
  try {
    return {status: response.status, contentType, json: JSON.parse(text)};
  } catch {
    throw new Error(`The response from ${url} is not JSON (Content-Type: ${contentType || 'none'}).`);
  }
}

export default function ActorInspector(): ReactNode {
  const targetId = useId();
  const pasteId = useId();
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [actorJson, setActorJson] = useState<string>('');
  const [paste, setPaste] = useState('');

  async function run() {
    setBusy(true);
    setFindings(null);
    setActorJson('');
    const log: Step[] = [];
    const push = (step: Step) => {
      log.push(step);
      setSteps([...log]);
    };
    const all: Finding[] = [];
    try {
      const parsed = parseTarget(target);
      let actorUrl: string;
      if (parsed.kind === 'acct') {
        push({ok: true, text: `GET ${parsed.webfingerUrl}`});
        const wf = await fetchJson(parsed.webfingerUrl, 'application/jrd+json', 'webfinger');
        const result = lintWebFinger(wf.json, {resource: parsed.resource, contentType: wf.contentType});
        all.push(...(result.findings as Finding[]).map((f) => ({...f, path: `webfinger: ${f.path}`})));
        if (!result.actorUrl) {
          push({ok: false, text: 'WebFinger response has no ActivityPub self link.'});
          setFindings(all);
          return;
        }
        actorUrl = result.actorUrl;
        push({ok: true, text: `WebFinger points to ${actorUrl}`});
      } else {
        actorUrl = parsed.url;
      }
      push({ok: true, text: `GET ${actorUrl} (Accept: application/activity+json)`});
      const actor = await fetchJson(actorUrl, 'application/activity+json', 'actor');
      push({ok: true, text: `HTTP ${actor.status}, Content-Type: ${actor.contentType || '(none)'}`});
      setActorJson(JSON.stringify(actor.json, null, 2));
      all.push(...(lintObject(actor.json, {contentType: actor.contentType}) as Finding[]));
      setFindings(all);
    } catch (e) {
      push({ok: false, text: (e as Error).message});
      if (all.length) setFindings(all);
    } finally {
      setBusy(false);
    }
  }

  function lintPasted() {
    setSteps([]);
    try {
      setFindings(lintObject(JSON.parse(paste)) as Finding[]);
    } catch (e) {
      setFindings(null);
      setSteps([{ok: false, text: `Not valid JSON: ${(e as Error).message}`}]);
    }
  }

  return (
    <div className={styles.tool}>
      <div className={styles.field}>
        <label htmlFor={targetId} className={styles.label}>
          Handle or actor URL
        </label>
        <span className={styles.hint}>
          Your browser fetches the WebFinger and actor documents directly from that server, unsigned. Nothing goes through SocialDocs.
        </span>
        <input
          id={targetId}
          className={styles.input}
          value={target}
          placeholder="@alice@social.example or https://social.example/users/alice"
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && target.trim() && !busy) run();
          }}
        />
      </div>
      <div className={styles.actions}>
        <button type="button" className="button button--primary" onClick={run} disabled={!target.trim() || busy}>
          {busy ? 'Fetching…' : 'Fetch and lint'}
        </button>
      </div>

      <div className={styles.results} aria-live="polite">
        {steps.length > 0 && (
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={i} role={s.ok ? undefined : 'alert'}>
                {s.ok ? '✓ ' : <strong>✗ </strong>}
                {s.text}
              </li>
            ))}
          </ol>
        )}
        {findings && <Findings findings={findings} okMessage="No problems found by these rules." />}
        {actorJson && (
          <details>
            <summary>Fetched actor JSON</summary>
            <pre className={styles.pre}>{actorJson}</pre>
          </details>
        )}
      </div>

      <div className={styles.field} style={{marginTop: '1rem'}}>
        <label htmlFor={pasteId} className={styles.label}>
          Or paste actor JSON
        </label>
        <span className={styles.hint}>For servers that block browser requests: paste the output of curl or `fedify lookup`.</span>
        <textarea
          id={pasteId}
          className={styles.textarea}
          style={{minHeight: '8rem'}}
          value={paste}
          spellCheck={false}
          onChange={(e) => setPaste(e.target.value)}
        />
      </div>
      <div className={styles.actions}>
        <button type="button" className="button button--secondary" onClick={lintPasted} disabled={!paste.trim()}>
          Lint pasted JSON
        </button>
      </div>
    </div>
  );
}
