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

/**
 * className literals that belong to a `<button>`, rather than to any element.
 *
 * The first version of the brand-button budget counted every className with a
 * brand fill and a padding, which swept in brand-coloured badges and chips —
 * `<span class="px-1.5 py-0.5 … bg-brand">` — that are not buttons and will
 * never become one. The number it reported was therefore a mix of work to do
 * and work that does not exist.
 *
 * Finding where the opening tag ends needs a scan rather than a regex. A
 * lazy match up to the first `>` stops inside `onClick={() => …}`, which cuts
 * the tag in half before `className` and makes this report zero — a very
 * convincing way to look finished.
 */
function openingTag(source: string, start: number): string {
  let depth = 0;
  let quote: string | null = null;

  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
    } else if (c === '{') {
      depth += 1;
    } else if (c === '}') {
      depth -= 1;
    } else if (c === '>' && depth === 0) {
      return source.slice(start, i);
    }
  }
  return source.slice(start);
}

function buttonClassStrings(): { file: string; value: string }[] {
  const found: { file: string; value: string }[] = [];

  for (const [file, source] of Object.entries(TSX)) {
    for (let at = source.indexOf('<button'); at !== -1; at = source.indexOf('<button', at + 1)) {
      const m = /className="([^"]*)"/.exec(openingTag(source, at));
      if (m) found.push({ file, value: m[1] });
    }
  }
  return found;
}

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

  it('adds no new label that names nothing', () => {
    /**
     * A `<label>` that neither wraps its control nor carries `htmlFor` names
     * nothing: a screen reader announces the input unnamed, and clicking the
     * label does not focus the field. Every styled form label in this admin
     * was one — 503 at the start.
     *
     * 318 are fixed, by nesting the control inside the label, which
     * associates them implicitly and needs no ids. `htmlFor`/`id` would have
     * to invent ids, and a static one collides the moment a component
     * renders twice on a page.
     *
     * The rest are not a codemod. They are labels with an inline or absent
     * className, where nesting the control changes the flow, or labels
     * separated from their control by a wrapper whose contents vary. Each
     * needs someone to look at the layout, so this is a budget rather than
     * an absolute check — unlike the contrast and focus rules above, which
     * are absolute because their fixes were unambiguous.
     *
     * Sixty of them look unambiguous and are not, which is worth writing
     * down because the trap is invisible in a diff. They are exactly
     *
     *     <label className="... uppercase tracking-wider font-semibold">
     *       Title *
     *     </label>
     *     <input className={inputCls} … />
     *
     * — one native control, immediately after, nothing in between. Nesting
     * that input compiles, passes every test here, passes axe, and renders
     * what the user types in uppercase. Tailwind's preflight sets
     * `letter-spacing` and `font-weight` to `inherit` on form elements, and
     * `text-transform` inherits on its own, so the control picks up the
     * label's styling; the shared input classes set a font size and none of
     * the other three, so nothing overrides it. 57 sites were converted and
     * reverted on finding this.
     *
     * The fix that does work is to move the text into a `<span>` and leave
     * the `<label>` carrying only layout classes — but the spacing then has
     * to be reproduced per site, because it currently comes from whatever
     * wrapper the pair sits in. That is the per-site look this budget is
     * about.
     *
     * Lower it when you fix some. It may not go up.
     */
    const BUDGET_ORPHAN_LABELS = 185;
    const orphans: string[] = [];

    for (const [file, source] of Object.entries(TSX)) {
      for (let at = source.indexOf('<label'); at !== -1; at = source.indexOf('<label', at + 1)) {
        const tag = openingTag(source, at);
        if (/\bhtmlFor\b/.test(tag)) continue;

        const close = source.indexOf('</label>', at);
        if (close === -1) continue;

        const body = source.slice(at, close);
        if (!/<(input|select|textarea|Input|SearchInput)\b/.test(body)) {
          orphans.push(`${file.replace('/src/', '')}: ${body.replace(/\s+/g, ' ').slice(0, 70)}…`);
        }
      }
    }

    expect(
      orphans.length,
      orphans.length > BUDGET_ORPHAN_LABELS
        ? 'a new label names nothing — wrap the control in it, or use Field from @/shared/ui/primitives'
        : `${BUDGET_ORPHAN_LABELS - orphans.length} fewer than the budget — lower BUDGET_ORPHAN_LABELS to ${orphans.length}`,
    ).toBe(BUDGET_ORPHAN_LABELS);
  });

  it('adds no new control that nothing names', () => {
    /**
     * A control outside any label, with no `aria-label` and nothing else to
     * name it, is announced as just "textbox". There were 775; 329 of them
     * had a placeholder that reads as a prompt rather than a sample value,
     * and `aria-label` from that is the right fix for a toolbar search box
     * or a filter, which has no visible label by design.
     *
     * A third source closed most of the rest: the state a control is bound
     * to. `value={form.intentName}` is the intent name, and 274 controls
     * were named that way. The result is not always what a writer would
     * choose — "Config JSON" rather than "Agent configuration" — but it is
     * specific and never wrong, and a person can improve any of them.
     *
     * A fourth source closed more of it: react-hook-form carries the field
     * name as the argument to `register()`, which is the best name in these
     * files. That and reading the head of a defaulted binding —
     * `value={form.notifyPhone ?? ''}`, which an earlier pattern required
     * to be a bare identifier and so skipped 65 times — took another 56.
     *
     * 59 are left, and two things should be said about that number.
     *
     * It over-counts. This reads source, so it cannot see a label supplied
     * by a wrapper component: `<FF l="Page Size"><input …/></FF>` renders a
     * label around the control and counts here as unnamed. The browser
     * audit is the measure that matters, and it reports zero unnamed
     * controls on all 131 pages. What this number is good for is stopping
     * the count climbing, not describing the product.
     *
     * And what remains is genuinely not derivable: a bare `<select>` with
     * no binding, an index, a loop variable. Those need someone to decide
     * what the control is for.
     */
    const BUDGET_UNNAMED_CONTROLS = 59;
    const CONTROL = /<(input|select|textarea|Input|SearchInput)\b/g;
    let unnamed = 0;

    for (const source of Object.values(TSX)) {
      const spans: [number, number][] = [];
      for (let at = source.indexOf('<label'); at !== -1; at = source.indexOf('<label', at + 1)) {
        const close = source.indexOf('</label>', at);
        if (close !== -1) spans.push([at, close]);
      }

      // A label elsewhere in the file can name a control through `htmlFor`,
      // which the first version of this check did not look for — it counted
      // eight correctly-named controls as defects. A budget that over-counts
      // hides the progress it exists to measure.
      const pointedAt = new Set([
        ...[...source.matchAll(/htmlFor="([^"]+)"/g)].map((m) => m[1]),
        ...[...source.matchAll(/htmlFor=\{([^}]+)\}/g)].map((m) => m[1]),
      ]);

      for (const m of source.matchAll(CONTROL)) {
        const at = m.index ?? 0;
        if (spans.some(([a, b]) => a < at && at < b)) continue;

        const tag = openingTag(source, at);
        if (/\baria-label(?:ledby)?\b/.test(tag)) continue;

        const id = /\bid="([^"]+)"/.exec(tag) ?? /\bid=\{([^}]+)\}/.exec(tag);
        if (id && pointedAt.has(id[1])) continue;

        unnamed += 1;
      }
    }

    expect(
      unnamed,
      unnamed > BUDGET_UNNAMED_CONTROLS
        ? 'a new control has nothing to name it — give it a label, or an aria-label'
        : `${BUDGET_UNNAMED_CONTROLS - unnamed} fewer — lower BUDGET_UNNAMED_CONTROLS to ${unnamed}`,
    ).toBe(BUDGET_UNNAMED_CONTROLS);
  });

  it('adds no new icon-only button that nothing names', () => {
    /**
     * A button whose whole body is one icon, with no aria-label and no
     * title, is announced as "button". 231 matched that shape; 204 draw an
     * icon whose meaning is unambiguous — a close cross, a bin, a pencil —
     * and those are named from it.
     *
     * A looser count over the same code says 591, by also catching bodies
     * like `{saving ? <Loader2/> : 'Save'}` whose text is in an expression.
     * Those are named already; this check reads the narrow shape on purpose,
     * so it cannot be satisfied by a button that merely looks empty to a
     * regex.
     *
     * The chevrons are deliberately not: the same glyph is expand, collapse,
     * next and previous in this codebase, and putting a wrong name in front
     * of someone who cannot see the screen is worse than the nothing they
     * get now. They are in the budget until a person decides.
     */
    const BUDGET_UNNAMED_ICON_BUTTONS = 27;
    const ONLY_ICON = /^\s*<[A-Z]\w*\b[^<>]*\/>\s*$/;
    let unnamed = 0;

    for (const source of Object.values(TSX)) {
      for (let at = source.indexOf('<button'); at !== -1; at = source.indexOf('<button', at + 1)) {
        const tag = openingTag(source, at);
        if (/\baria-label\b|\btitle=/.test(tag)) continue;

        const gt = at + tag.length;
        const close = source.indexOf('</button>', gt);
        if (close === -1) continue;

        const body = source.slice(gt + 1, close);
        const text = body.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').trim();
        if (!text && (ONLY_ICON.test(body) || !body.includes('{'))) unnamed += 1;
      }
    }

    expect(
      unnamed,
      unnamed > BUDGET_UNNAMED_ICON_BUTTONS
        ? 'a new icon-only button has no name — use IconButton, which requires one'
        : `${BUDGET_UNNAMED_ICON_BUTTONS - unnamed} fewer — lower the budget to ${unnamed}`,
    ).toBe(BUDGET_UNNAMED_ICON_BUTTONS);
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
  /**
   * A brand-filled control with its own padding — i.e. a <Button>.
   *
   * Zero, and it is meant to stay zero: every one of the 302 is migrated.
   * The budget stays here rather than becoming a plain "must be empty"
   * assertion because the other two are not done, and one shape of check
   * reading the same way for all three is worth more than a tidier assertion
   * for the one that finished first.
   */
  brandButton: 0,
  /** `block text-xs font-semibold …` above an input — i.e. a <Field>. */
  fieldLabel: 235,
  /** A bare search box with a hand-positioned icon — i.e. a <SearchInput>. */
  searchBox: 42,
} as const;

const COUNTERS: Record<keyof typeof BUDGET, (value: string) => boolean> = {
  // Either axis: a full-width button sets only `py-`, and requiring `px-`
  // made 44 of them invisible to this count — which read as zero left to do.
  brandButton: (v) => isBrandFilled(v) && /\bp[xy]-[\d.]+\b/.test(v),
  fieldLabel: (v) => /^block text-xs font-semibold text-text-(secondary|muted) mb-1(\.5)?$/.test(v),
  searchBox: (v) => /absolute left-3 top-1\/2 -translate-y-1\/2/.test(v),
};

describe('migration to the shared primitives', () => {
  const all = classStrings();
  const buttons = buttonClassStrings();

  for (const kind of Object.keys(BUDGET) as (keyof typeof BUDGET)[]) {
    it(`has no more than ${BUDGET[kind]} hand-rolled ${kind}s left`, () => {
      const source = kind === 'brandButton' ? buttons : all;
      const found = source.filter((c) => COUNTERS[kind](c.value)).length;

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
    // total success. The brandButton budget IS zero, so this is the only
    // thing standing between a broken scan and a green run.
    expect(Object.keys(TSX).length).toBeGreaterThan(100);
    expect(all.length).toBeGreaterThan(1000);
    expect(buttons.length, 'the <button> scan found nothing — it is broken').toBeGreaterThan(400);
  });

  it('actually routes brand-filled buttons through the primitive', () => {
    /**
     * The counter reading zero is only good news if the buttons went
     * somewhere. An earlier version of this file reported zero because its
     * regex stopped at the `>` inside `onClick={() => …}` and never reached
     * className — a very convincing way to look finished.
     */
    const usages = Object.values(TSX).reduce((n, source) => n + (source.match(/<Button\b/g) ?? []).length, 0);
    expect(usages).toBeGreaterThan(300);
  });
});
