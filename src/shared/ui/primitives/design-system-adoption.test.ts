import { describe, expect, it } from 'vitest';

/**
 * The design system only works if the admin actually uses it.
 *
 * Adding primitives does not remove the 174 pages that already rebuild them
 * by hand, and a rewrite of all 174 in one branch would be unreviewable. So
 * two kinds of check live here.
 *
 * The first kind is absolute: things that must never appear again, because
 * they are defects rather than inconsistencies.
 *
 * The second kind is a budget. Each counts hand-rolled copies of something
 * the primitives now provide, and asserts the count has not gone up. A budget
 * may only ever be lowered — when a page is migrated, drop the number in the
 * same commit. That turns "we should use the design system" from an
 * intention into something a build can tell you about, without blocking on a
 * rewrite nobody can review.
 */

const TSX = import.meta.glob('/src/features/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const CLASS_STRING = /className="([^"]*)"/g;

/** Every className literal in src/features, with the file it came from. */
function classStrings(): { file: string; value: string }[] {
  return Object.entries(TSX).flatMap(([file, source]) =>
    [...source.matchAll(CLASS_STRING)].map((m) => ({ file, value: m[1] })),
  );
}

/** A brand fill, not `bg-brand-dark` or `bg-brand-soft`. */
const isBrandFilled = (value: string) => /\bbg-brand\b(?!-)/.test(value);

describe('defects that must not come back', () => {
  it('never puts white or black text on a brand fill', () => {
    /**
     * The brand is #00D98A on Lead360. White on it is about 1.8:1, which is
     * unreadable, and it was on 32 controls. `text-black` was another 39:
     * readable, but a literal colour in a codebase whose Tailwind config
     * resolves every colour through a custom property so that one set of
     * class names can paint both products.
     *
     * `text-text-inverted` is the token for exactly this, and each product
     * defines its own near-black for it.
     */
    const offenders = classStrings()
      .filter((c) => isBrandFilled(c.value) && /\btext-(white|black)\b/.test(c.value))
      .map((c) => `${c.file.replace('/src/features/', '')}: ${c.value.slice(0, 60)}…`);

    expect(offenders, 'use text-text-inverted on a brand background').toEqual([]);
  });

  it('never removes the focus outline without putting one back', () => {
    // A control with `focus:outline-none` and no ring of its own cannot be
    // used from a keyboard: the cursor is invisible. The primitives carry
    // FOCUS_RING, so this only catches hand-rolled controls.
    const offenders = classStrings()
      .filter(
        (c) =>
          /\bfocus:outline-none\b/.test(c.value) &&
          !/focus(-visible)?:(ring|border|shadow)/.test(c.value) &&
          !/focus-within:(ring|border|shadow)/.test(c.value),
      )
      .map((c) => `${c.file.replace('/src/features/', '')}: ${c.value.slice(0, 60)}…`);

    expect(offenders, 'removing the outline leaves keyboard users with no cursor').toEqual([]);
  });
});

/**
 * Hand-rolled copies of a primitive, by kind.
 *
 * Lower a number when you migrate a page. Never raise one: if a count has
 * gone up, the page that did it should be using the primitive.
 */
const BUDGET = {
  /** A brand-filled control with its own padding — i.e. a <Button variant="primary">. */
  brandButton: 302,
  /** `block text-xs font-semibold …` above an input — i.e. a <Field>. */
  fieldLabel: 235,
  /** A bare search box with a hand-positioned icon — i.e. a <SearchInput>. */
  searchBox: 145,
} as const;

const COUNTERS: Record<keyof typeof BUDGET, (value: string) => boolean> = {
  brandButton: (v) => isBrandFilled(v) && /\bpx-[\d.]+\b/.test(v),
  fieldLabel: (v) => /^block text-xs font-semibold text-text-(secondary|muted) mb-1(\.5)?$/.test(v),
  searchBox: (v) => /absolute left-3 top-1\/2 -translate-y-1\/2/.test(v),
};

describe('migration to the shared primitives', () => {
  const all = classStrings();

  for (const kind of Object.keys(BUDGET) as (keyof typeof BUDGET)[]) {
    it(`has no more than ${BUDGET[kind]} hand-rolled ${kind}s left`, () => {
      const found = all.filter((c) => COUNTERS[kind](c.value)).length;

      expect(
        found,
        found > BUDGET[kind]
          ? `a new hand-rolled ${kind} was added — import it from @/shared/ui/primitives instead`
          : `${BUDGET[kind] - found} fewer than the budget — lower BUDGET.${kind} to ${found}`,
      ).toBe(BUDGET[kind]);
    });
  }

  it('finds the source to count (the globs and patterns still match)', () => {
    // Every budget above reads zero if the glob breaks, which would look like
    // total success.
    expect(Object.keys(TSX).length).toBeGreaterThan(100);
    expect(all.length).toBeGreaterThan(1000);
  });
});
