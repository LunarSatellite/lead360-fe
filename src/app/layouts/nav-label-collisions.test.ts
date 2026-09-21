import { describe, it, expect } from 'vitest';

/**
 * Two nav entries may share a label only when they lead to the same page.
 *
 * Repeating a rail entry in the mobile "More" sheet is normal and shares a label by design.
 * What is not normal is two *different* pages under one name. The console had three such
 * pairs at once, each a commerce surface and a CRM surface that happened to be about the
 * same noun:
 *
 *   Campaigns  — storefront hero placements      vs  B2B outreach and ad spend
 *   Orders     — marketplace orders & fulfilment vs  manually created sales orders
 *   Returns    — the read-only platform queue    vs  RMA handling
 *
 * Two of those sat in the same rail with the same icon. They are not duplicates to merge —
 * each side is a real capability — so the fix was naming, and this test is what keeps the
 * names apart.
 */

// `import.meta.glob` rather than `node:fs`, matching no-hardcoded-origins.test.ts:
// this project ships no node types, so a `node:path` import fails typecheck.
const LAYOUT_SOURCES = import.meta.glob('/src/app/layouts/{DashboardLayout.tsx,crm-nav.ts}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** `{ label: 'Orders & fulfilment', href: ROUTES.dashboard.stylemintOrders, ... }` */
const NAV_ENTRY = /\{\s*label: '([^']+)',\s*href: ([^,]+),/g;

function navEntries(): { label: string; href: string; file: string }[] {
  return Object.entries(LAYOUT_SOURCES).flatMap(([file, source]) =>
    [...source.matchAll(NAV_ENTRY)].map((m) => ({
      label: m[1],
      href: m[2].trim(),
      file,
    })),
  );
}

describe('no two nav entries share a label while leading somewhere different', () => {
  it('finds nav entries to check (the regex still matches the source)', () => {
    expect(navEntries().length).toBeGreaterThan(50);
  });

  it('gives every label exactly one destination', () => {
    const destinations = new Map<string, Set<string>>();
    for (const { label, href } of navEntries()) {
      if (!destinations.has(label)) destinations.set(label, new Set());
      destinations.get(label)!.add(href);
    }

    const collisions = [...destinations.entries()]
      .filter(([, hrefs]) => hrefs.size > 1)
      .map(([label, hrefs]) => `"${label}" → ${[...hrefs].join(' and ')}`);

    expect(collisions).toEqual([]);
  });
});
