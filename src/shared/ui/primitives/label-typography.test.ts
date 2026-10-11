import { describe, expect, it } from 'vitest';

/**
 * A label must not restyle the text typed into the control it wraps.
 *
 * Nesting a control inside its label is how this admin associates the
 * two — it needs no id and so cannot collide. The cost is inheritance.
 * Tailwind's preflight sets `font-weight` and `letter-spacing` to
 * `inherit` on `input`, `select` and `textarea`, so a label styled
 *
 *     <label className="text-xs font-semibold uppercase tracking-wider">
 *
 * hands its 600 weight and 0.6px tracking to whatever the user types,
 * unless the control puts them back. Measured in a browser against the
 * compiled stylesheet, not inferred: a nested input came out
 * `font-weight: 600`, `letter-spacing: 0.6px`.
 *
 * `text-transform` is the one that looks like it should be here and is
 * not. The browser's own stylesheet sets `text-transform: none` on form
 * controls, so `uppercase` on the label does not reach the field. That
 * was worth measuring, because assuming it did is what made an earlier
 * pass revert 57 correct edits.
 *
 * Only controls that display typed text are checked. A checkbox or a
 * file button renders no text of its own, so inheriting a font weight
 * costs nothing, and labels wrapping those are the common case here.
 */

const TSX = import.meta.glob('/src/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Properties a form control inherits through preflight. */
const INHERITED =
  /(?<![\w-])(tracking-[\w.[\]]+|font-(thin|extralight|light|medium|semibold|bold|extrabold|black)|italic)(?![\w-])/g;
/**
 * Any explicit weight or tracking on the control counts, not only the
 * `normal` ones: a field that says `font-medium` has made its own
 * decision and is not inheriting anything.
 */
const SETS_WEIGHT =
  /(?<![\w-])font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)(?![\w-])/;
const SETS_TRACKING = /(?<![\w-])tracking-[\w.[\]]+(?![\w-])/;
const SETS_UPRIGHT = /(?<![\w-])not-italic(?![\w-])/;
const NO_TYPED_TEXT = /type=\s*["'](checkbox|radio|file|color|range|submit|button|image)["']/;

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

function classesOf(tag: string): string {
  const m = /className=(?:"([^"]*)"|\{`([^`]*)`\})/.exec(tag);
  return m ? (m[1] ?? m[2] ?? '') : '';
}

export function restylingLabelsIn(file: string, source: string): string[] {
  const found: string[] = [];
  for (let at = source.indexOf('<label'); at !== -1; at = source.indexOf('<label', at + 1)) {
    const gt = tagEnd(source, at);
    const close = source.indexOf('</label>', at);
    if (gt === -1 || close === -1) continue;

    const body = source.slice(gt + 1, close);
    const control = /<\s*(input|textarea|select)\b/.exec(body);
    if (!control) continue;

    /**
     * The control's whole opening tag. A fixed-size window is not good
     * enough — one textarea here carries a 180-character placeholder
     * before its className, and a 600-character slice cut the className
     * off and reported a field that was already fine.
     */
    const controlAt = gt + 1 + control.index;
    const controlTag = source.slice(controlAt, tagEnd(source, controlAt) + 1);
    if (control[1] === 'input' && NO_TYPED_TEXT.test(controlTag)) continue;

    const inherited = [...new Set([...classesOf(source.slice(at, gt + 1)).matchAll(INHERITED)].map((m) => m[1]))];
    if (!inherited.length) continue;

    const on = classesOf(controlTag);
    const unreset = inherited.filter((cls) => {
      if (cls.startsWith('tracking-')) return !SETS_TRACKING.test(on);
      if (cls === 'italic') return !SETS_UPRIGHT.test(on);
      return !SETS_WEIGHT.test(on);
    });
    if (unreset.length) {
      found.push(`${file.replace('/src/', '')}: label has ${unreset.join(', ')} and the <${control[1]}> does not reset it`);
    }
  }
  return found;
}

describe('a label does not restyle what you type into it', () => {
  it('is reading the source tree', () => {
    expect(Object.keys(TSX).length).toBeGreaterThan(200);
  });

  it('has no label that hands its own typography to a text control', () => {
    const offenders = Object.entries(TSX).flatMap(([file, source]) =>
      file.endsWith('label-typography.test.ts') ? [] : restylingLabelsIn(file, source),
    );
    expect(offenders).toEqual([]);
  });

  it('catches the shape it exists for', () => {
    expect(
      restylingLabelsIn('/src/x.tsx', '<label className="font-bold">N<input className="text-sm" /></label>'),
    ).toHaveLength(1);
    expect(
      restylingLabelsIn('/src/x.tsx', '<label className="tracking-wider">N<textarea className="text-sm" /></label>'),
    ).toHaveLength(1);
  });

  it('accepts a control that puts the properties back', () => {
    expect(
      restylingLabelsIn(
        '/src/x.tsx',
        '<label className="font-bold tracking-wider">N<input className="text-sm font-normal tracking-normal" /></label>',
      ),
    ).toEqual([]);
  });

  it('accepts a control that chose its own weight, not only "normal"', () => {
    expect(
      restylingLabelsIn(
        '/src/x.tsx',
        '<label className="font-bold">N<input className="text-sm font-medium" /></label>',
      ),
    ).toEqual([]);
  });

  it('reads the whole opening tag, however long', () => {
    /** A 600-character window used to cut off before the className. */
    const long = `<label className="font-bold">N<textarea placeholder="${'x'.repeat(700)}" className="text-sm font-medium" /></label>`;
    expect(restylingLabelsIn('/src/x.tsx', long)).toEqual([]);
  });

  it('ignores uppercase, which does not reach a form control', () => {
    expect(
      restylingLabelsIn('/src/x.tsx', '<label className="uppercase">N<input className="text-sm" /></label>'),
    ).toEqual([]);
  });

  it('ignores controls that show no typed text', () => {
    expect(
      restylingLabelsIn('/src/x.tsx', '<label className="font-bold">N<input type="checkbox" /></label>'),
    ).toEqual([]);
  });
});
