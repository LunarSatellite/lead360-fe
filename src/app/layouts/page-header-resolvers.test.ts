import { describe, it, expect } from 'vitest';
import { allNavItems } from '@/app/navigation/nav-model';

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

const raw = (name: string): string => Object.entries(SOURCES).find(([path]) => path.endsWith(`/${name}`))![1];

const LAYOUT = raw('DashboardLayout.tsx');

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

/**
 * Every `[href, label]` the nav offers.
 *
 * Read from the model rather than scraped out of the layout source, which is
 * what this did while the nav was four arrays of literals across two files.
 * The resolver chain below is still read as source, because its defect — a
 * generic pattern shadowing a specific one — is a property of the order the
 * branches are written in and exists nowhere else.
 */
function navEntries(): [string, string][] {
  return allNavItems.map((i) => [i.href, i.label]);
}

/** Every path the nav can send an operator to. */
function navDestinations(): Set<string> {
  return new Set(navEntries().map(([href]) => href));
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
        const shadow = rules.slice(0, i).find((e) => e.pattern !== pattern && pattern.includes(e.pattern));
        return shadow ? `'${pattern}' can never match — '${shadow.pattern}' is tested first` : null;
      })
      .filter((x): x is string => x !== null);

    expect(unreachable).toEqual([]);
  });

  /**
   * `getPageTitle` consults three things in order, and this mirrors all three: an exact nav
   * match, then the explicit chain, then the longest matching nav destination.
   *
   * The exact match is first because the chain matches on substrings. Four settings pages
   * — Custom domains, Video conferencing, Calendar, Booking page — all sit under `/settings`
   * and were all titled "Settings" by the generic rule, which is how this assertion first
   * failed. They had no nav entry before the merge, so nothing had ever asked.
   */
  function titleOf(path: string): string | null {
    const exact = navEntries().find(([href]) => href === path);
    if (exact) return exact[1];

    const rules = resolvers().find((r) => r.name === 'getPageTitle')!.rules;
    const explicit = rules.find((r) => path.includes(r.pattern))?.value;
    if (explicit) return explicit;

    let best: string | null = null;
    let bestLength = 0;
    for (const [href, label] of navEntries()) {
      if ((path === href || path.startsWith(`${href}/`)) && href.length > bestLength) {
        best = label;
        bestLength = href.length;
      }
    }
    return best;
  }

  /**
   * Asserted against the source, not against `titleOf` above. `titleOf` reimplements the nav
   * fallback, so every nav destination resolves through it by construction — an assertion
   * phrased over it would hold even with the fallback deleted from the layout, which is
   * exactly what a first draft of this test did.
   */
  it('asks the nav for an exact match before running either chain', () => {
    // Asserted against the source for the same reason as the fallback below:
    // `titleOf` mirrors this rule, so every assertion phrased over `titleOf`
    // would still hold if the rule were deleted from the layout.
    for (const resolver of ['const getPageTitle', 'const getPageIcon']) {
      const body = LAYOUT.slice(LAYOUT.indexOf(resolver));
      const head = body.slice(0, body.indexOf('if (path.includes'));
      expect(head, `${resolver} runs its chain before consulting the nav`).toContain(
        'EXACT_NAV_PAGE.get(path)',
      );
    }
  });

  it('still falls back to the nav rather than to the literal "Dashboard"', () => {
    const body = LAYOUT.slice(LAYOUT.indexOf('const getPageTitle'));
    const resolver = body.slice(0, body.indexOf('};'));
    expect(resolver).toContain("return navTitleFor(path) ?? 'Dashboard';");
  });

  it('gives no two nav destinations the same header title', () => {
    const byTitle = new Map<string, string[]>();
    for (const path of navDestinations()) {
      const title = titleOf(path);
      if (!title) continue;
      byTitle.set(title, [...(byTitle.get(title) ?? []), path]);
    }

    const shared = [...byTitle.entries()]
      .filter(([, paths]) => paths.length > 1)
      .map(([title, paths]) => `"${title}" is the header for ${paths.join(' and ')}`);

    expect(shared).toEqual([]);
  });
});
