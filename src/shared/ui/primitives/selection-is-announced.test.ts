import { describe, expect, it } from 'vitest';

/**
 * Buttons that look chosen and never say so.
 *
 * A filter chip, a tab, a view switch: the className carries a ternary
 * on `active` or `selected`, the colours change, and nothing else does.
 * A screen reader reads the same name whichever one is on, so the only
 * information the control exists to carry is the one that does not
 * arrive.
 *
 * The 131-page WCAG suite passes over all of them, correctly — a
 * `<button>` with no state attribute is valid markup, and nothing in
 * the DOM says it was meant to be a toggle. Only the ternary says that,
 * and axe does not read ternaries. So this check reads them.
 *
 * `Button`'s `selected` prop is the fix; it sets `aria-pressed` and
 * styles both cases. This is a ratchet because migrating 78 of them in
 * one branch would be unreviewable, and because a few are genuinely
 * navigation rather than toggles — those want `aria-current` and a
 * different answer per site.
 */

const TSX = import.meta.glob('/src/features/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Words that mean "this one is the chosen one". */
const CHOSEN =
  /(?<![\w$])(active|isActive|selected|isSelected|current|isCurrent|isChosen|chosen|isOpen|expanded|isExpanded)(?![\w$])/;
const ANNOUNCES = /aria-(pressed|selected|current|expanded)/;

/** `>` appears inside `onClick={() => …}`, so the tag end needs brace awareness. */
function tagEnd(source: string, start: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') depth += 1;
    else if (c === '}') depth -= 1;
    else if (c === '>' && depth === 0) return i;
  }
  return -1;
}

export function mutePressedIn(file: string, source: string): string[] {
  const found: string[] = [];
  for (let at = source.indexOf('<button'); at !== -1; at = source.indexOf('<button', at + 1)) {
    const gt = tagEnd(source, at);
    if (gt === -1) break;
    const tag = source.slice(at, gt + 1);

    const cls = /className=\{([\s\S]*)/.exec(tag);
    if (!cls || !cls[1].includes('?') || !CHOSEN.test(cls[1])) continue;
    if (ANNOUNCES.test(tag)) continue;
    found.push(file.replace('/src/features/', ''));
  }
  return found;
}

/**
 * 79 when `Button`'s `selected` prop was added; 10 after the ones whose
 * className branches on a plain boolean were given `aria-pressed`. The
 * remainder branch on something that is not plainly true or false -- a
 * nested ternary, two booleans at once -- and `aria-pressed="maybe"` is
 * worse than silence, so they want a person. Lower it; never raise.
 */
const BUDGET_MUTE_TOGGLES = 10;

describe('a button that looks chosen says so', () => {
  it('is reading the pages', () => {
    expect(Object.keys(TSX).length).toBeGreaterThan(200);
  });

  it('has no more silent toggles than the budget', () => {
    const silent = Object.entries(TSX).flatMap(([file, source]) => mutePressedIn(file, source));
    expect(
      silent.length,
      silent.length > BUDGET_MUTE_TOGGLES
        ? 'a new button shows its state only in colour — pass `selected` to Button'
        : `${BUDGET_MUTE_TOGGLES - silent.length} fewer — lower BUDGET_MUTE_TOGGLES to ${silent.length}`,
    ).toBe(BUDGET_MUTE_TOGGLES);
  });

  it('recognises the shape, and the fix', () => {
    const silent = '<button className={`px-2 ${active ? "bg-brand" : "text-muted"}`}>All</button>';
    expect(mutePressedIn('/src/features/x.tsx', silent)).toHaveLength(1);

    const fixed = '<button aria-pressed={active} className={`px-2 ${active ? "bg-brand" : "text-muted"}`}>All</button>';
    expect(mutePressedIn('/src/features/x.tsx', fixed)).toEqual([]);
  });

  it('ignores a button whose styling does not depend on being chosen', () => {
    expect(
      mutePressedIn('/src/features/x.tsx', '<button className={`px-2 ${busy ? "opacity-50" : ""}`}>Save</button>'),
    ).toEqual([]);
  });

  it('reads past a `>` inside an arrow function', () => {
    /**
     * The thing that has broken every tag scanner written in this repo.
     * A naive `[^>]*` stops at the arrow and sees no className at all.
     */
    const tag =
      '<button onClick={() => setTab("a")} className={`p-2 ${active ? "on" : "off"}`}>A</button>';
    expect(mutePressedIn('/src/features/x.tsx', tag)).toHaveLength(1);
  });
});
