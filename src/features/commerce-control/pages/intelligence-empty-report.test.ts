import { describe, expect, it } from 'vitest';
import { isEmptyReport, serverStatement } from '../components/ReportPanel';

/**
 * The decision twin and the cart-offer readout both rendered as raw JSON dumps
 * in the operator console. One predicate was the cause: it asked whether EVERY
 * value on the response was empty, and a paged response always carries
 * `pageSize` and `hasMore` beside its empty array. So `every(...)` went false,
 * and the component fell through to `<pre>{JSON.stringify(...)}</pre>`.
 */
describe('isEmptyReport', () => {
  it('treats a paged response with no items as empty despite its paging scalars', () => {
    // This exact shape is what the decision-twin studies endpoint returns.
    expect(
      isEmptyReport({ items: [], nextCursor: null, pageSize: 25, hasMore: false }),
    ).toBe(true);
  });

  it('treats an incrementality readout with no observations as empty', () => {
    expect(
      isEmptyReport({
        arms: [],
        uplift: null,
        conversionHorizonHours: 72,
        minimumObservationsPerArm: 30,
        statement: 'No cart-offer observations were recorded in this window.',
      }),
    ).toBe(true);
  });

  it('is not empty as soon as any collection has a row', () => {
    expect(isEmptyReport({ items: [{ id: 'a' }], pageSize: 25, hasMore: false })).toBe(false);
    expect(isEmptyReport({ arms: [{ key: 'control' }], uplift: null })).toBe(false);
  });

  it('still refuses to call a scalar-only payload empty', () => {
    // No array anywhere, so the older stricter rule applies and this is
    // real content that must render rather than be swallowed by a note.
    expect(isEmptyReport({ total: 5 })).toBe(false);
  });

  it('handles the plain cases', () => {
    expect(isEmptyReport(null)).toBe(true);
    expect(isEmptyReport([])).toBe(true);
    expect(isEmptyReport([{ id: 'a' }])).toBe(false);
    expect(isEmptyReport({})).toBe(true);
  });
});

/**
 * These surfaces were written to explain an absence rather than show a zero.
 * Falling through to a generic note would discard the server's own sentence
 * and say something weaker in its place.
 */
describe('serverStatement', () => {
  it('prefers the server sentence when one is supplied', () => {
    expect(
      serverStatement({
        arms: [],
        statement: 'That is an absence of measurement, not a result.',
      }),
    ).toBe('That is an absence of measurement, not a result.');
  });

  it('returns null when there is nothing worth quoting', () => {
    expect(serverStatement({ items: [] })).toBeNull();
    expect(serverStatement({ statement: '   ' })).toBeNull();
    expect(serverStatement(null)).toBeNull();
    expect(serverStatement([])).toBeNull();
  });
});
