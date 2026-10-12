import { describe, expect, it } from 'vitest';

/**
 * `RecordAuditTrail` was written, reviewed and merged, and then imported by
 * nothing. `CRM-REMAINING-GAPS.md` recorded it twice over: once as dead code,
 * once as the Tier C gap "no 'who changed this deal's value and when'". A
 * component that exists but is mounted nowhere looks exactly like a feature
 * that was never built, and that is how it stayed unbuilt for months.
 *
 * This reads source rather than rendering, on purpose: the failure it guards
 * against is not "the component is broken" — it never was — it is "nobody
 * uses it". Rendering it in isolation would pass happily while no page shows
 * it.
 *
 * `import.meta.glob` rather than `node:fs`, as the rest of this project's
 * source-scanning tests do, because no node types are shipped.
 */
const pages = import.meta.glob('/src/features/crm/pages/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const MOUNTS: { file: string; kind: string }[] = [
  { file: 'DealDetailPage.tsx', kind: 'CrmActivityEntityKind.Deal' },
  { file: 'ContactDetailPage.tsx', kind: 'CrmActivityEntityKind.Contact' },
  { file: 'LeadDetailPage.tsx', kind: 'CrmActivityEntityKind.Lead' },
];

function sourceOf(file: string): string {
  const key = Object.keys(pages).find((p) => p.endsWith(`/${file}`));
  expect(key, `${file} is not under src/features/crm/pages`).toBeTruthy();
  return pages[key!];
}

describe('the record audit trail is actually on the records', () => {
  it.each(MOUNTS)('$file mounts it for $kind', ({ file, kind }) => {
    const src = sourceOf(file);
    expect(src).toContain('RecordAuditTrail');
    expect(src).toContain(kind);
  });

  it('passes the entity id, not a placeholder', () => {
    for (const { file } of MOUNTS) {
      const mount = /<RecordAuditTrail[\s\S]{0,160}?\/>/.exec(sourceOf(file));
      expect(mount, `${file} has no <RecordAuditTrail .../>`).not.toBeNull();
      expect(mount![0]).toMatch(/entityId=\{[^}]*id[^}]*\}/);
    }
  });
});
