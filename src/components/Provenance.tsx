import React, {type ReactNode} from 'react';
import Admonition from '@theme/Admonition';
import Link from '@docusaurus/Link';

// Front matter fields (see CONTRIBUTING.md):
//   last_verified: 2026-10-15          date the page was checked against sources
//   verified_against: "Mastodon 4.7.3"  what it was checked against
//   reviewed_by: "Jane Doe"             optional, the human reviewer
export type ProvenanceFields = {
  last_verified?: string | Date;
  verified_against?: string;
  reviewed_by?: string;
};

const STALE_AFTER_MONTHS = 6;

function parseDate(value: string | Date | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isStale(date: Date, now: Date = new Date()): boolean {
  const limit = new Date(now);
  limit.setUTCMonth(limit.getUTCMonth() - STALE_AFTER_MONTHS);
  return date < limit;
}

export default function Provenance({fields}: {fields: ProvenanceFields}): ReactNode {
  const verified = parseDate(fields.last_verified);

  if (!verified) {
    return (
      <Admonition type="caution" title="Not yet verified">
        This page has not been re-verified against primary sources since the{' '}
        <Link to="https://github.com/socialdocs/socialdocs.org/issues/37">October 2026 audit</Link>.
        Check claims against the linked specs and platform docs before relying on them.
      </Admonition>
    );
  }

  const against = fields.verified_against ? ` against ${fields.verified_against}` : '';
  const by = fields.reviewed_by ? ` by ${fields.reviewed_by}` : '';

  if (isStale(verified)) {
    return (
      <Admonition type="caution" title="Verification out of date">
        Last verified{against} on {formatDate(verified)}{by}, more than {STALE_AFTER_MONTHS} months ago.
        Details may have changed since.
      </Admonition>
    );
  }

  return (
    <p className="provenance-note">
      <small>
        Verified{against} on {formatDate(verified)}{by}.
      </small>
    </p>
  );
}
