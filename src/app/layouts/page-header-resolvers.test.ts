import { describe, it, expect } from 'vitest';

/**
 * The page-header title and icon are picked by a run of `path.includes(...)` checks where the
 * first match wins. Two things go wrong with that shape, and both are silent:
 *
 *  1. A generic pattern above a more specific one that contains it makes the specific branch
 *     unreachable. `/dashboard/crm/analytics` contains `/analytics`, so CRM Analytics rendered
 *     under the analytics hub's title and icon. `/flows/experiments` under `/flows` likewise.
 *
 *  2. A path with no rule of its own falls into whichever earlier pattern happens to contain
 *     it. `/dashboard/crm/deals-hub` contains `/crm/deals`, so it rendered as "Deals" — two
 *     different pages presenting under one name, the same defect as a duplicate nav label.
 *
 * Nothing errors and nothing logs in either case. The page just claims to be another page.
 *
 * Read through import.meta.glob rather than node:fs, as no-hardcoded-origins.test.ts does,
 * because this project ships no node types.
 */

const SOURCES = import.meta.glob('/src/app/{layouts,router}/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const raw = (name: string): string =>
  Object.entries(SOURCES).find(([path]) => path.endsWith(`/${name}`))![1];

const LAYOUT = raw('DashboardLayout.tsx');
const CRM_NAV = raw('crm-nav.ts');
const ROUTE_PATHS = raw('route-paths.ts');

const BRANCH = /if \(path\.includes\('([^']+)'\)\) return ([^;]+);/g;

/**
 * Each resolver is one `const getPageX = () => {` block. Splitting on those rather than on
 * line numbers matters: the two resolvers repeat many of the same paths, so comparing a
 * branch in one against a branch in the other invents collisions that do not exist.
 */
function resolvers(): { name: string; rules: { pattern: string; value: string }[] }[] {
  const starts = [...LAYOUT.matchAll(/const (getPage[A-Za-z]+) = \(\) => \{/g)];
  return starts.map((start, i) => {
    const from = start.index!;
    const to = i + 1 < starts.length ? starts[i + 1].index! : LAYOUT.length;
    return {
      name: start[1],
      rules: [...LAYOUT.slice(from, to).matchAll(BRANCH)].map((m) => ({
        pattern: m[1],
        value: m[2].trim().replace(/^'|'$/g, ''),
      })),
    };
  });
}

/** Every path the nav can send an operator to. */
function navDestinations(): Set<string> {
  const paths = new Map(
    [...ROUTE_PATHS.matchAll(/^\s+([a-zA-Z][A-Za-z0-9]*): '(\/[^']*)'/gm)].map((m) => [m[1], m[2]]),
  );
  const out = new Set<string>();
  for (const source of [LAYOUT, CRM_NAV]) {
    for (const m of source.matchAll(/href: ROUTES\.dashboard\.([A-Za-z0-9]+),/g)) {
      const path = paths.get(m[1]);
      if (path) out.add(path);
    }
    for (const m of source.matchAll(/href: '(\/[^']+)',/g)) out.add(m[1]);
  }
  return out;
}

describe('the page header identifies the page you are actually on', () => {
  it('finds both resolvers, and the nav destinations to check them against', () => {
    const found = resolvers();
    expect(found.map((r) => r.name)).toContain('getPageTitle');
    for (const r of found) expect(r.rules.length).toBeGreaterThan(10);
    expect(navDestinations().size).toBeGreaterThan(50);
  });

  it.each(resolvers())('$name tests every specific path before the generic one', ({ rules }) => {
    const unreachable = rules
      .map(({ pattern }, i) => {
        const shadow = rules
          .slice(0, i)
          .find((e) => e.pattern !== pattern && pattern.includes(e.pattern));
        return shadow ? `'${pattern}' can never match — '${shadow.pattern}' is tested first` : null;
      })
      .filter((x): x is string => x !== null);

    expect(unreachable).toEqual([]);
  });

  it('gives no two nav destinations the same header title', () => {
    const rules = resolvers().find((r) => r.name === 'getPageTitle')!.rules;
    const titleOf = (path: string) => rules.find((r) => path.includes(r.pattern))?.value ?? null;

    const byTitle = new Map<string, string[]>();
    for (const path of navDestinations()) {
      const title = titleOf(path);
      // A destination matching no rule falls through to 'Dashboard'. That is a separate and
      // much larger gap — 50 of them do — so it is not what this assertion is about.
      if (!title) continue;
      byTitle.set(title, [...(byTitle.get(title) ?? []), path]);
    }

    const shared = [...byTitle.entries()]
      .filter(([, paths]) => paths.length > 1)
      .map(([title, paths]) => `"${title}" is the header for ${paths.join(' and ')}`);

    expect(shared).toEqual([]);
  });
});
