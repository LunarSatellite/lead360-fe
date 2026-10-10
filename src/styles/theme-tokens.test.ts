import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Read as text rather than imported — see node-fs-shim.d.ts for why this is
// not the `import.meta.glob(..., { query: '?raw' })` the rest of the repo uses.
const css = readFileSync(`${__dirname}/globals.css`, 'utf8');
const tailwindConfig = readFileSync(`${__dirname}/../../tailwind.config.js`, 'utf8');

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

  it('records the Lead360 pairs that already fall short of AA', () => {
    // Pre-existing and deliberately left alone: the Lead360 build has to
    // render exactly as it does today, so this is a record rather than a fix.
    // It is here so the debt is visible and, more to the point, so the list
    // cannot grow — a fourth entry means someone lightened a Lead360 surface.
    const below = pairs(defaults)
      .filter(({ ratio }) => ratio < 4.5)
      .map(({ label }) => label);

    expect(below).toEqual([
      'text-muted on surface-elevated',
      'text-muted on glass-2',
      'text-muted on glass-3',
    ]);
  });

  it('does not make the muted ramp harder to read than Lead360', () => {
    // Muted helper text is the ramp that moves when a palette lightens its
    // surfaces, and the one with no headroom to spare. StyleMint lightens
    // every surface, so this is where a bad swap would show first.
    const before = new Map(pairs(defaults).map(({ label, ratio }) => [label, ratio]));

    const regressions = pairs(stylemint)
      .filter(({ label, ratio }) => label.startsWith('text-muted') && ratio < before.get(label)!)
      .map(({ label, ratio }) => `${label}: ${before.get(label)!.toFixed(2)} → ${ratio.toFixed(2)}`);

    expect(regressions).toEqual([]);
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
