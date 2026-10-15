import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import styles from './tools.module.css';

export type Finding = {
  level: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  source?: {label: string; url: string};
};

const LABELS = {error: 'Error', warning: 'Warning', info: 'Note'} as const;

export function Findings({findings, okMessage}: {findings: Finding[]; okMessage: string}): ReactNode {
  const counts = {
    error: findings.filter((f) => f.level === 'error').length,
    warning: findings.filter((f) => f.level === 'warning').length,
    info: findings.filter((f) => f.level === 'info').length,
  };
  if (findings.length === 0) {
    return (
      <ul className={styles.findings}>
        <li className={clsx(styles.finding, styles.ok)}>{okMessage}</li>
      </ul>
    );
  }
  return (
    <>
      <p className={styles.summary}>
        {counts.error} error{counts.error === 1 ? '' : 's'}, {counts.warning} warning
        {counts.warning === 1 ? '' : 's'}, {counts.info} note{counts.info === 1 ? '' : 's'}
      </p>
      <ul className={styles.findings}>
        {findings.map((f, i) => (
          <li key={i} className={clsx(styles.finding, styles[f.level])}>
            <span className={styles.badge}>{LABELS[f.level]}</span>
            <code className={styles.path}>{f.path}</code> — {f.message}
            {f.source && (
              <a className={styles.source} href={f.source.url} target="_blank" rel="noopener noreferrer">
                Source: {f.source.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
