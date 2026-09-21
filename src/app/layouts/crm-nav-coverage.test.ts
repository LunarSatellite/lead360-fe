import { describe, it, expect } from 'vitest';
import { routeObjects } from '@/app/router/route-table';
import { crmNav } from './crm-nav';

/**
 * Every CRM page that has a route should be reachable from the CRM navigation.
 *
 * Twenty-one of them were not: the route existed, the page rendered, and the only way to
 * open it was to type the URL. That is how a merged feature looks exactly like a missing
 * one. This test fails when a route is added without a way to reach it.
 */

/**
 * Routes with a parameter segment, and the `/new` create forms, are opened from the list
 * page above them rather than from the nav.
 */
const isReachedFromAList = (path: string) => path.includes(':') || path.endsWith('/new');

/**
 * Deliberate omissions, each for a stated reason — not a backlog.
 */
const INTENTIONALLY_UNLINKED = new Map<string, string>([
  ['crm/analytics', 'Lives once in the primary rail as the unified Analytics page.'],
  ['crm/support', 'Lives once in the primary rail as the unified Support page.'],
  ['crm/audit-log', 'Redirects to crm/audit — one page, one URL.'],
]);

function crmRoutePaths(): string[] {
  const dashboard = routeObjects
    .flatMap((r) => (r.path === '/dashboard' ? (r.children ?? []) : []));
  return dashboard
    .map((c) => c.path)
    .filter((p): p is string => typeof p === 'string')
    .filter((p) => p.startsWith('crm/'))
    .filter((p) => !isReachedFromAList(p));
}

describe('the CRM navigation reaches every CRM page', () => {
  const linked = new Set(
    crmNav.map((item) => item.href.replace(/^\/dashboard\//, '')),
  );

  it.each(crmRoutePaths())('%s is in the nav, or is listed as deliberately absent', (path) => {
    if (INTENTIONALLY_UNLINKED.has(path)) {
      expect(linked.has(path)).toBe(false);
      return;
    }
    expect(linked).toContain(path);
  });

  it('lists no nav entry whose route does not exist', () => {
    const routed = new Set(crmRoutePaths());
    const crmLinks = [...linked].filter((h) => h.startsWith('crm/'));
    expect(crmLinks.filter((h) => !routed.has(h))).toEqual([]);
  });
});
