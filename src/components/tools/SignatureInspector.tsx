import React, {useId, useState, type ReactNode} from 'react';
import clsx from 'clsx';
import styles from './tools.module.css';
import {
  parseRequest,
  header,
  parseCavageSignature,
  cavageSigningString,
  mastodonCavageProblems,
  checkDigest,
  checkContentDigest,
  parseDictionary,
  signatureBase,
  mastodonRfc9421Problems,
  verifySignature,
  keyKindFor,
} from './lib/httpsig.js';
import {SOURCES} from './lib/sources.js';

type Check = {ok: boolean; message: string};

type Analysis = {
  scheme: 'cavage' | 'rfc9421';
  data: string;
  signature: string;
  algorithm?: string;
  keyId?: string;
  problems: string[];
  digest?: Check;
};

const EXAMPLE = `POST /users/alice/inbox HTTP/1.1
Host: social.example
Date: Thu, 15 Oct 2026 12:00:00 GMT
Digest: SHA-256=GYwYnH3BiO6aICFt0ThC5bUIJ4byvqdpWtR8m5fNkww=
Content-Type: application/activity+json
Signature: keyId="https://remote.example/users/bob#main-key",algorithm="rsa-sha256",headers="(request-target) host date",signature="c2lnbmF0dXJl"

{"type":"Follow"}`;

async function analyse(raw: string, targetOverride: string): Promise<Analysis> {
  const req = parseRequest(raw);
  const input = header(req, 'signature-input');
  const signatureHeader = header(req, 'signature');
  if (!signatureHeader) throw new Error('No Signature header in the request.');

  if (input) {
    const host = header(req, 'host');
    const targetUri = targetOverride.trim() || (host ? `https://${host}${req.target}` : '');
    if (!targetUri) throw new Error('RFC 9421 needs the full target URI: add a Host header or fill in "Target URI".');
    const {label, base, params, components, unsupported} = signatureBase(req, input, {targetUri});
    const sig = parseDictionary(signatureHeader).get(label);
    const signature = sig?.value?.type === 'bytes' ? String(sig.value.value) : '';
    const problems = mastodonRfc9421Problems(req.method, components, params);
    if (unsupported.length) problems.push(`Not computed here (left blank in the base): ${unsupported.join(', ')}`);
    if (!signature) problems.push(`Signature header has no byte-sequence value for "${label}".`);
    const digest = components.includes('content-digest')
      ? await checkContentDigest(req.body, header(req, 'content-digest'))
      : undefined;
    return {
      scheme: 'rfc9421',
      data: base,
      signature,
      algorithm: typeof params.alg === 'string' ? params.alg : undefined,
      keyId: typeof params.keyid === 'string' ? params.keyid : undefined,
      problems,
      digest,
    };
  }

  const params = parseCavageSignature(signatureHeader);
  if (!params.signature) throw new Error('The Signature header has no signature parameter.');
  const {signingString, missing} = cavageSigningString(req, params);
  const signed = (params.headers || 'date').toLowerCase().split(/\s+/);
  const problems = mastodonCavageProblems(req.method, signed);
  for (const name of missing) problems.push(`Signed header "${name}" is missing from the request.`);
  const digest = signed.includes('digest') || header(req, 'digest')
    ? await checkDigest(req.body, header(req, 'digest'))
    : undefined;
  return {
    scheme: 'cavage',
    data: signingString,
    signature: params.signature,
    algorithm: params.algorithm,
    keyId: params.keyId,
    problems,
    digest,
  };
}

export default function SignatureInspector(): ReactNode {
  const requestId = useId();
  const targetId = useId();
  const pemId = useId();
  const kindId = useId();
  const [raw, setRaw] = useState('');
  const [target, setTarget] = useState('');
  const [pem, setPem] = useState('');
  const [kind, setKind] = useState<'auto' | 'rsa' | 'ed25519'>('auto');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Check | null>(null);

  async function inspect(source = raw) {
    setError(null);
    setVerdict(null);
    try {
      setAnalysis(await analyse(source, target));
    } catch (e) {
      setAnalysis(null);
      setError((e as Error).message);
    }
  }

  async function verify() {
    if (!analysis) return;
    const keyKind = kind === 'auto' ? keyKindFor(analysis.algorithm) : kind;
    if (!keyKind) {
      setVerdict({ok: false, message: `Algorithm "${analysis.algorithm ?? '(none)'}" doesn't say which key type; choose RSA or Ed25519.`});
      return;
    }
    try {
      const ok = await verifySignature({data: analysis.data, signature: analysis.signature, pem, kind: keyKind});
      setVerdict(ok
        ? {ok: true, message: 'Signature is valid for this key and signing string.'}
        : {ok: false, message: 'Signature does NOT verify with this key. Check the signing string above against what the sender signed.'});
    } catch (e) {
      setVerdict({ok: false, message: `Could not verify: ${(e as Error).message}`});
    }
  }

  const source = analysis?.scheme === 'rfc9421' ? SOURCES.rfc9421 : SOURCES.cavage;

  return (
    <div className={styles.tool}>
      <div className={styles.field}>
        <label htmlFor={requestId} className={styles.label}>
          Raw HTTP request
        </label>
        <span className={styles.hint}>
          Request line, headers, a blank line, then the body, exactly as received. Runs entirely in your browser.
        </span>
        <textarea
          id={requestId}
          className={styles.textarea}
          value={raw}
          spellCheck={false}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={'POST /inbox HTTP/1.1\nHost: …\nDate: …\nSignature: …\n\n{…}'}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={targetId} className={styles.label}>
          Target URI (RFC 9421 only, optional)
        </label>
        <span className={styles.hint}>Defaults to https:// + Host + request path.</span>
        <input id={targetId} className={styles.input} value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>
      <div className={styles.actions}>
        <button type="button" className="button button--primary" onClick={() => inspect()} disabled={!raw.trim()}>
          Inspect
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            setRaw(EXAMPLE);
            inspect(EXAMPLE);
          }}>
          Example
        </button>
      </div>

      <div className={styles.results} aria-live="polite">
        {error && <p role="alert">{error}</p>}
        {analysis && (
          <>
            <p className={styles.summary}>
              {analysis.scheme === 'rfc9421' ? 'RFC 9421 signature base' : 'draft-cavage signing string'}
              {analysis.keyId && <> for key <code>{analysis.keyId}</code></>}
            </p>
            <pre className={styles.pre}>{analysis.data}</pre>
            <a className={styles.source} href={source.url} target="_blank" rel="noopener noreferrer">
              How this is built: {source.label}
            </a>
            <ul className={styles.findings}>
              {analysis.digest && (
                <li className={clsx(styles.finding, analysis.digest.ok ? styles.ok : styles.error)}>
                  {analysis.digest.message}
                </li>
              )}
              {analysis.problems.map((p) => (
                <li key={p} className={clsx(styles.finding, styles.error)}>
                  {p}
                </li>
              ))}
              {analysis.problems.length === 0 && (
                <li className={clsx(styles.finding, styles.ok)}>Covers everything Mastodon requires.</li>
              )}
            </ul>
            <a className={styles.source} href={SOURCES.mastoSignedRequest.url} target="_blank" rel="noopener noreferrer">
              Requirements from: {SOURCES.mastoSignedRequest.label}
            </a>

            <h3>Verify with a public key</h3>
            <div className={styles.field}>
              <label htmlFor={pemId} className={styles.label}>
                Public key (PEM)
              </label>
              <span className={styles.hint}>The sender's publicKeyPem, from the actor document that keyId points to.</span>
              <textarea
                id={pemId}
                className={styles.textarea}
                style={{minHeight: '6rem'}}
                value={pem}
                spellCheck={false}
                onChange={(e) => setPem(e.target.value)}
                placeholder={'-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----'}
              />
            </div>
            <div className={styles.actions}>
              <label htmlFor={kindId} className={styles.label}>
                Key type
              </label>
              <select
                id={kindId}
                className={styles.select}
                value={kind}
                onChange={(e) => setKind(e.target.value as 'auto' | 'rsa' | 'ed25519')}>
                <option value="auto">From algorithm ({analysis.algorithm ?? 'not given'})</option>
                <option value="rsa">RSA (RSASSA-PKCS1-v1_5, SHA-256)</option>
                <option value="ed25519">Ed25519</option>
              </select>
              <button type="button" className="button button--primary" onClick={verify} disabled={!pem.trim()}>
                Verify
              </button>
            </div>
            {verdict && (
              <ul className={styles.findings}>
                <li className={clsx(styles.finding, verdict.ok ? styles.ok : styles.error)} role="status">
                  {verdict.message}
                </li>
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
