import { describe, expect, it } from 'vitest';

/**
 * A list that cannot tell "it failed" from "there are none".
 *
 * Almost every list in this admin reads a query like this:
 *
 *   const { data, isLoading } = useInvoices(filter);
 *   ...
 *   {isLoading ? <spinner/> : !items.length ? <Empty/> : <table/>}
 *
 * `isError` is never taken off the query, so there are only two states to
 * land in. A failed request has no items, so it lands in the empty one.
 * With the API unreachable, the invoices page said "No invoices found"
 * under a heading reading "0 total", and contacts said "No contacts
 * found" while its subtitle stayed on "Loading..." permanently. Both were
 * confident, calm, and false.
 *
 * That is worse than a spinner. An operator has no reason to doubt a
 * plain statement, so they go looking for who deleted the invoices.
 *
 * 365 data reads, 20 of which handled failure. That is not fixable in one
 * branch, so this is a ratchet: the number may fall and must never rise.
 * `ListState` and `ResultCount` exist to make the correct version shorter
 * to write than the wrong one.
 */

const PAGES = import.meta.glob('/src/features/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** `const { … } = useSomething(…)` */
const DESTRUCTURE = /const\s*\{([^}]*)\}\s*=\s*(use[A-Z]\w*)\s*\(/g;

function blindReadsIn(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(DESTRUCTURE)) {
    const fields = match[1];
    // Only reads. A mutation has no emptiness to be confused with.
    if (!/\bdata\b/.test(fields)) continue;
    const handlesLoading = /\bis(Loading|Pending|Fetching)\b/.test(fields);
    const handlesFailure = /\bisError\b|\berror\b/.test(fields);
    if (handlesLoading && !handlesFailure) found.push(match[2]);
  }
  return found;
}

/**
 * 180 when `ListState` was introduced; 163 after the fourteen uniform
 * CRM lists moved onto it. Lower this number; never raise it.
 */
const BUDGET_BLIND_READS = 163;

describe('a failed list is not an empty list', () => {
  it('is reading the pages at all', () => {
    expect(Object.keys(PAGES).length).toBeGreaterThan(200);
  });

  it('has no more reads that handle loading but not failure than the budget', () => {
    const blind = Object.entries(PAGES).flatMap(([path, source]) =>
      blindReadsIn(source).map((hook) => `${path}: ${hook}`),
    );
    expect(blind.length).toBeLessThanOrEqual(BUDGET_BLIND_READS);
  });

  it('keeps the two pages that were verified against a dead API migrated', () => {
    /**
     * These are the two whose wrong answers were seen on screen rather
     * than inferred from source, so they are the two worth pinning.
     */
    for (const name of ['CrmInvoicesPage', 'ContactsPage']) {
      const [, source] = Object.entries(PAGES).find(([path]) => path.endsWith(`${name}.tsx`))!;
      expect(blindReadsIn(source), `${name} regressed to a blind read`).toEqual([]);
      expect(source, `${name} should render through ListState`).toContain('<ListState');
    }
  });

  it('recognises both the broken shape and the fixed one', () => {
    /**
     * Proof the matcher works, so the budget cannot be met by a regex
     * that quietly stopped matching anything.
     */
    expect(blindReadsIn('const { data, isLoading } = useInvoices(f);')).toEqual(['useInvoices']);
    expect(blindReadsIn('const { data, isLoading, isError } = useInvoices(f);')).toEqual([]);
    expect(blindReadsIn('const { data } = useInvoices(f);')).toEqual([]);
    expect(blindReadsIn('const { mutate, isPending } = useCreateInvoice();')).toEqual([]);
  });
});
