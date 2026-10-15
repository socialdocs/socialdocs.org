import React, {useId, useState, type ReactNode} from 'react';
import styles from './tools.module.css';
import {Findings, type Finding} from './Findings';
import {lintObject} from './lib/as2-lint.js';

const EXAMPLE_ACTOR = {
  '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
  id: 'https://social.example/users/alice',
  type: 'Person',
  preferredUsername: 'alice',
  inbox: 'https://social.example/users/alice/inbox',
  outbox: 'https://social.example/users/alice/outbox',
  followers: 'https://social.example/users/alice/followers',
  publicKey: {
    id: 'https://social.example/users/alice#main-key',
    owner: 'https://social.example/users/alice',
    publicKeyPem: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
  },
};

const EXAMPLE_DM = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  id: 'https://social.example/users/alice/statuses/2/activity',
  type: 'Create',
  actor: 'https://social.example/users/alice',
  to: ['https://other.example/users/bob'],
  object: {
    id: 'https://social.example/users/alice/statuses/2',
    type: 'Note',
    attributedTo: 'https://social.example/users/alice',
    content: '<p>Hi Bob</p>',
    published: '2026-10-15 12:00:00',
    to: ['https://other.example/users/bob'],
  },
};

export default function ObjectLinter(): ReactNode {
  const inputId = useId();
  const [text, setText] = useState('');
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function lint(source: string) {
    setParseError(null);
    try {
      setFindings(lintObject(JSON.parse(source)) as Finding[]);
    } catch (e) {
      setFindings(null);
      setParseError(`Not valid JSON: ${(e as Error).message}`);
    }
  }

  function load(example: object) {
    const source = JSON.stringify(example, null, 2);
    setText(source);
    lint(source);
  }

  return (
    <div className={styles.tool}>
      <div className={styles.field}>
        <label htmlFor={inputId} className={styles.label}>
          Activity Streams JSON
        </label>
        <span className={styles.hint}>Runs entirely in your browser. Nothing you paste is sent anywhere.</span>
        <textarea
          id={inputId}
          className={styles.textarea}
          value={text}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          placeholder='{"@context": "https://www.w3.org/ns/activitystreams", "type": "Note", ...}'
        />
      </div>
      <div className={styles.actions}>
        <button type="button" className="button button--primary" onClick={() => lint(text)} disabled={!text.trim()}>
          Lint
        </button>
        <button type="button" className="button button--secondary" onClick={() => load(EXAMPLE_ACTOR)}>
          Example: actor
        </button>
        <button type="button" className="button button--secondary" onClick={() => load(EXAMPLE_DM)}>
          Example: broken DM
        </button>
      </div>
      <div className={styles.results} aria-live="polite">
        {parseError && <p role="alert">{parseError}</p>}
        {findings && <Findings findings={findings} okMessage="No problems found by these rules." />}
      </div>
    </div>
  );
}
