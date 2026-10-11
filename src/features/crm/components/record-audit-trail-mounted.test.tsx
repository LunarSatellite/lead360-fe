import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `RecordAuditTrail` was written, reviewed and merged, and then imported by
 * nothing. `CRM-REMAINING-GAPS.md` recorded it twice over: once as dead code,
 * once as the Tier C gap "no 'who changed this deal's value and when'". A
 * component that exists but is mounted nowhere looks exactly like a feature
 * that was never built, and that is how it stayed unbuilt for months.
 *
 * This is a source check rather than a render test on purpose: the failure it
 * guards against is not "the component is broken", it is "nobody uses it".
 * Rendering it in isolation would pass happily while no page shows it.
 */

const PAGES = join(__dirname, '..', 'pages');

const MOUNTS: { file: string; kind: string }[] = [
  { file: 'DealDetailPage.tsx', kind: 'CrmActivityEntityKind.Deal' },
  { file: 'ContactDetailPage.tsx', kind: 'CrmActivityEntityKind.Contact' },
  { file: 'LeadDetailPage.tsx', kind: 'CrmActivityEntityKind.Lead' },
];

describe('the record audit trail is actually on the records', () => {
  it.each(MOUNTS)('$file mounts it for $kind', ({ file, kind }) => {
    const src = readFileSync(join(PAGES, file), 'utf8');
    expect(src).toContain('RecordAuditTrail');
    expect(src).toContain(kind);
  });

  it('passes the entity id, not a placeholder', () => {
    for (const { file } of MOUNTS) {
      const src = readFileSync(join(PAGES, file), 'utf8');
      const mount = /<RecordAuditTrail[\s\S]{0,160}?\/>/.exec(src);
      expect(mount, `${file} has no <RecordAuditTrail .../>`).not.toBeNull();
      expect(mount![0]).toMatch(/entityId=\{[^}]*id[^}]*\}/);
    }
  });
});
