import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Read as text rather than imported — see node-fs-shim.d.ts for why this is
// not the `import.meta.glob(..., { query: '?raw' })` the rest of the repo uses.
const css = readFileSync(`${__dirname}/globals.css`, 'utf8');
const tailwindConfig = readFileSync(`${__dirname}/../../tailwind.config.js`, 'utf8');

/** Every component, for checking the classes they actually use. */
const sources = import.meta.glob('/src/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * The failure this suite exists for.
 *
 * `globals.css` carries two palettes: Lead360's in `:root` and StyleMint's in
 * `:root[data-console='stylemint']`. A token that the second block forgets does
 * not disappear — it keeps the *first* block's value. So one missing line puts
 * Lead360's near-black #0A1612 text on StyleMint's zinc card, or its green text
 * ramp over emerald, and the page is unreadable in a way that type-checks,
 * lints, builds and only shows up when someone opens that screen.
 *
 * Nothing else in the toolchain can catch it: CSS custom properties have no
 * schema, and Tailwind resolves `var(--x)` at paint time in the browser.
 */

/** Strip comments so hex annotations in the token table are never read as values. */
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations inside one top-level rule, as a name → value map. */
function readBlock(selector: string): Map<string, string> {
  const at = css.indexOf(`${selector} {`);
  if (at === -1) throw new Error(`globals.css has no \`${selector}\` block`);
  const open = css.indexOf('{', at);
  const close = css.indexOf('\n}', open);
  const body = stripComments(css.slice(open + 1, close));

  const out = new Map<string, string>();
  for (const line of body.split('\n')) {
    const match = /^\s*(--[a-z0-9-]+)\s*:\s*(.+?);\s*$/.exec(line);
    if (match) out.set(match[1], match[2].trim());
  }
  return out;
}

const defaults = readBlock(':root');
const stylemint = readBlock(":root[data-console='stylemint']");

/** A token is *derived* when its value is built from another token. */
const isDerived = (value: string) => value.includes('var(');

/** WCAG 2.1 relative luminance / contrast ratio, on opaque sRGB channels. */
function luminance([r, g, b]: [number, number, number]) {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: [number, number, number], b: [number, number, number]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_TOKENS = ['--color-text-primary', '--color-text-body', '--color-text-secondary', '--color-text-muted'];
const SURFACE_TOKENS = [
  '--color-surface-sunken',
  '--color-surface-app',
  '--color-surface-inset',
  '--color-surface-card',
  '--color-surface-elevated',
  '--color-glass-1',
  '--color-glass-2',
  '--color-glass-3',
];

/** Every text-on-surface pair a palette can produce, with its contrast ratio. */
function pairs(palette: Map<string, string>) {
  const read = (token: string) =>
    (palette.get(token) ?? defaults.get(token)!).split(/\s+/).map(Number) as [number, number, number];

  const out: { label: string; ratio: number }[] = [];
  for (const fg of TEXT_TOKENS) {
    for (const bg of SURFACE_TOKENS) {
      // --color-text-secondary duplicates --color-text-body in both palettes;
      // reporting it twice would only pad the failure list.
      if (fg === '--color-text-secondary' && palette.get(fg) === palette.get('--color-text-body')) continue;
      out.push({ label: `${fg.slice(8)} on ${bg.slice(8)}`, ratio: contrast(read(fg), read(bg)) });
    }
  }
  return out;
}

describe('console colour tokens', () => {
  it('finds both palettes', () => {
    expect(defaults.size).toBeGreaterThan(30);
    expect(stylemint.size).toBeGreaterThan(30);
  });

  it('gives StyleMint its own value for every literal token Lead360 defines', () => {
    const missing = [...defaults]
      .filter(([name, value]) => !isDerived(value) && !stylemint.has(name))
      .map(([name]) => name);

    // Naming the tokens matters more than the count: whoever adds a token to
    // `:root` should read which one they left half-themed.
    expect(missing).toEqual([]);
  });

  it('leaves derived aliases to follow, rather than restating them', () => {
    const restated = [...defaults]
      .filter(([name, value]) => isDerived(value) && stylemint.has(name))
      .map(([name]) => name);

    // A derived alias pinned in the StyleMint block would quietly stop
    // tracking the literal it was written to follow.
    expect(restated).toEqual([]);
  });

  it('defines every token StyleMint overrides', () => {
    const unknown = [...stylemint.keys()].filter((name) => !defaults.has(name));
    expect(unknown).toEqual([]);
  });

  it('resolves every token both palettes reference', () => {
    const referenced = new Set<string>();
    for (const value of [...defaults.values(), ...stylemint.values()]) {
      for (const [, name] of value.matchAll(/var\((--[a-z0-9-]+)\)/g)) referenced.add(name);
    }
    const dangling = [...referenced].filter((name) => !defaults.has(name));
    expect(dangling).toEqual([]);
  });

  it('keeps tailwind.config.js reading tokens rather than raw hex', () => {
    const body = stripComments(tailwindConfig);

    // A literal colour here would pin that utility class to one product.
    expect(body.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();

    const referenced = [...body.matchAll(/var\((--[a-z0-9-]+)\)/g)].map(([, name]) => name);
    expect(referenced.length).toBeGreaterThan(20);
    expect(referenced.filter((name) => !defaults.has(name))).toEqual([]);
  });

  it('meets AA for StyleMint text on every surface it can land on', () => {
    const below = pairs(stylemint).filter(({ ratio }) => ratio < 4.5);
    expect(below.map(({ label, ratio }) => `${label} = ${ratio.toFixed(2)}:1`)).toEqual([]);
  });

  it('uses no background class the config does not define', () => {
    /**
     * `bg-bg-surface` appeared 51 times and is not a class Tailwind emits:
     * the `bg` scale is DEFAULT, sunken, shell, card, elevated and input.
     * Those elements therefore had no background at all and fell through to
     * the user agent's, which on Linux is #EFEFEF — white text on it is
     * 1.14:1.
     *
     * It survived because it reads like a real token, it degrades silently,
     * and Windows Chromium paints a default <select> differently enough to
     * hide it. Only the Linux CI run found it. This is the cheaper way to
     * find the next one.
     */
    const defined = new Set(
      [...stripComments(tailwindConfig).matchAll(/\n        bg: \{([\s\S]*?)\n        \},/g)]
        .flatMap(([, body]) => [...body.matchAll(/(\w+):/g)].map(([, key]) => key))
        .map((key) => (key === 'DEFAULT' ? '' : `-${key}`)),
    );

    const used = new Set(
      Object.values(sources).flatMap((src) =>
        [...src.matchAll(/(?<![\w-])bg-bg(-[\w]+)?(?![\w-])/g)].map(([, suffix]) => suffix ?? ''),
      ),
    );

    const unknown = [...used].filter((suffix) => !defined.has(suffix)).map((s) => `bg-bg${s}`);
    expect(unknown, 'this class paints nothing; the browser default shows through').toEqual([]);
  });

  it('meets AA for Lead360 text on every surface it can land on', () => {
    /**
     * This used to be a record of three known failures rather than an
     * assertion — `text-muted` on surface-elevated, glass-2 and glass-3 —
     * kept so the debt was visible and could not grow.
     *
     * All three were the same token at #7A9B8E, which measured 4.44:1 on a
     * card. axe found it in a browser on eleven pages at once, because every
     * table header in the admin is muted text. #8BA99D is 5.32:1 there, and
     * the three recorded failures went with it.
     *
     * So it is an assertion now, matching the StyleMint one above. Both
     * palettes meet AA on every surface, and neither is allowed to stop.
     */
    const below = pairs(defaults).filter(({ ratio }) => ratio < 4.5);
    expect(below.map(({ label, ratio }) => `${label} = ${ratio.toFixed(2)}:1`)).toEqual([]);
  });

  it('keeps muted text readable in both palettes, not merely no worse', () => {
    /**
     * This compared StyleMint's muted ramp against Lead360's and failed if
     * StyleMint was lower. That made sense while Lead360 was the shipped
     * baseline and had known failures to measure against — but a relative
     * check passes happily when both sides are bad, and it broke the moment
     * the baseline improved.
     *
     * AA on both is the thing that was actually wanted.
     */
    const below = [...pairs(defaults), ...pairs(stylemint)]
      .filter(({ label, ratio }) => label.startsWith('text-muted') && ratio < 4.5)
      .map(({ label, ratio }) => `${label} = ${ratio.toFixed(2)}:1`);

    expect(below).toEqual([]);
  });

  it('keeps StyleMint off Lead360s green text ramp', () => {
    // The one substantive difference between the palettes, asserted so a
    // future merge cannot quietly reintroduce the green (or gold) cast.
    for (const token of ['--color-text-primary', '--color-text-body', '--color-text-secondary', '--color-text-muted']) {
      const [r, g, b] = stylemint.get(token)!.split(/\s+/).map(Number);
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      expect(spread, `${token} should be neutral, got ${r} ${g} ${b}`).toBeLessThanOrEqual(12);
    }
  });
});
