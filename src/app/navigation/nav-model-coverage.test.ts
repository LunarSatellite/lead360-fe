import { isValidElement } from 'react';
import { Navigate } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routeObjects } from '@/app/router/route-table';
import { allNavItems, navAliases, navGroups } from './nav-model';

/**
 * The guarantees that make regrouping the navigation safe.
 *
 * Collapsing four flat lists into grouped sections is exactly the kind of
 * change that loses a page quietly: the route still resolves, the component
 * still renders, and the only way in is to type the URL. That is
 * indistinguishable from the feature having been deleted, and it is what the
 * original `crm-nav-coverage.test.ts` was written to catch for the CRM
 * section. These checks extend the same guarantee to the whole admin.
 */

/**
 * Routes opened from inside another page rather than from the nav.
 *
 * A `:param` is a detail page reached from its list, `/new` is its create
 * form, and a `*` is a sub-view of a page that carries its own menu — the
 * vendor console's 31 sections, for instance. In each case the parent is in
 * the nav and is the way in, so requiring a second entry for the child would
 * mean putting all 31 vendor sections in the product-level rail.
 */
const isReachedFromAList = (path: string) =>
  path.includes(':') || path.endsWith('/new') || path.endsWith('/*');

/** Deliberate omissions, each with a stated reason — not a backlog. */
const INTENTIONALLY_UNLINKED = new Map<string, string>([
  ['crm/analytics', 'Lives once in Overview as the unified Analytics page.'],
  ['crm/support', 'Lives once in Support as the unified Support page.'],
]);

type Child = { path?: string; element?: unknown };

function dashboardChildren(): Child[] {
  return routeObjects.flatMap((r) => (r.path === '/dashboard' ? (r.children ?? []) : []));
}

/**
 * A route whose whole element is a `<Navigate>` has no page to reach — it is
 * an old URL kept working. Detected rather than listed by hand, so retiring a
 * URL does not also mean remembering to annotate a test.
 */
const isRedirect = (c: Child) => isValidElement(c.element) && c.element.type === Navigate;

/** Every path the router answers, redirects included — a link there works. */
function dashboardRoutePaths(): string[] {
  return dashboardChildren()
    .map((c) => c.path)
    .filter((p): p is string => typeof p === 'string' && p.length > 0);
}

/** Only the paths that render a page, so only these need a way in. */
function dashboardPagePaths(): string[] {
  return dashboardChildren()
    .filter((c) => !isRedirect(c))
    .map((c) => c.path)
    .filter((p): p is string => typeof p === 'string' && p.length > 0);
}

describe('unified navigation model', () => {
  it('carries every page the seven old lists reached, exactly once', () => {
    // The seven arrays held 135 entries describing 123 distinct pages: six
    // pages were listed twice under two names (see navAliases), and four were
    // in a mobile sheet only. Plus the seven that had a page and no entry
    // anywhere, found by the unreachable-route check below. A drop here means
    // a page lost its only way in.
    expect(allNavItems).toHaveLength(131);
  });

  it('lists each page once, under one name', () => {
    /**
     * Two entries for one href is how the old admin got into this state: a
     * page acquires a second name in a second rail, the two names drift, and
     * an operator cannot tell whether they are one feature or two. It had six
     * such pairs — Products & catalogue against Business catalogue, Stores
     * against Organisations, Bot flows against Conversation Map.
     *
     * The inverse — one name over two different pages — is the distinct-label
     * check below. The console had three of those at once, each a commerce
     * surface and a CRM surface that happened to be about the same noun:
     * Campaigns, Orders and Returns. Those are real separate capabilities, so
     * the fix was naming, and both halves of it are held here.
     */
    const seen = new Map<string, string[]>();
    for (const item of allNavItems) {
      seen.set(item.href, [...(seen.get(item.href) ?? []), item.label]);
    }

    const twice = [...seen.entries()]
      .filter(([, labels]) => labels.length > 1)
      .map(([href, labels]) => `${href} is listed as ${labels.join(' and ')}`);

    expect(twice, 'record the discarded name in navAliases instead').toEqual([]);
  });

  it('points each discarded name at a page that is still listed', () => {
    // The merge kept one name per page. The others have to stay findable by
    // search, which means they have to keep matching something real.
    const labels = new Set(allNavItems.map((i) => i.label));

    const dangling = navAliases.filter((a) => !labels.has(a.label)).map((a) => a.alsoKnownAs);
    expect(dangling, 'an alias for a label nothing uses can never be found').toEqual([]);

    const notActuallyAliases = navAliases.filter((a) => labels.has(a.alsoKnownAs));
    expect(notActuallyAliases, 'both names are listed — this is not a merge').toEqual([]);
  });

  it('gives every item a distinct label', () => {
    const seen = new Map<string, number>();
    for (const item of allNavItems) seen.set(item.label, (seen.get(item.label) ?? 0) + 1);

    const duplicated = [...seen.entries()].filter(([, n]) => n > 1).map(([l]) => l);
    expect(duplicated, 'the same label in two groups is a coin flip for the user').toEqual([]);
  });

  it('points every item at a route that exists', () => {
    const known = new Set(dashboardRoutePaths().map((p) => `/dashboard/${p}`));
    // Routes declared outside the dashboard child list, reached by absolute path.
    const outsideDashboard = new Set(['/dashboard', '/dashboard/home', '/dashboard/chat']);

    const broken = allNavItems
      .map((i) => i.href)
      .filter((href) => !known.has(href) && !outsideDashboard.has(href));

    expect(broken, 'a nav entry pointing nowhere is worse than no entry').toEqual([]);
  });

  it('leaves no dashboard route unreachable', () => {
    const linked = new Set(allNavItems.map((i) => i.href.replace('/dashboard/', '')));

    const unreachable = dashboardPagePaths()
      .filter((p) => !isReachedFromAList(p))
      .filter((p) => !INTENTIONALLY_UNLINKED.has(p))
      .filter((p) => !linked.has(p));

    expect(
      unreachable,
      'these routes render a page that nothing links to — add a nav entry or an explicit reason',
    ).toEqual([]);
  });

  it('keeps every group small enough to scan', () => {
    // The failure being fixed was a 115-item rail. A group that grows past
    // about twenty is the same problem in a smaller box, and wants splitting.
    const oversized = navGroups
      .filter((g) => g.items.length > 20)
      .map((g) => `${g.label} (${g.items.length})`);

    expect(oversized).toEqual([]);
  });

  it('has no empty groups and no duplicate group ids', () => {
    expect(navGroups.filter((g) => g.items.length === 0).map((g) => g.label)).toEqual([]);
    expect(new Set(navGroups.map((g) => g.id)).size).toBe(navGroups.length);
  });
});
