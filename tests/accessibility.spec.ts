import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { navGroups } from '../src/app/navigation/nav-model';

/**
 * Every page in the admin, measured against WCAG 2.1 AA in a real browser.
 *
 * The unit-test half of this (accessibility.test.tsx) covers the primitives,
 * but jsdom computes no layout, so axe skips colour-contrast there — and
 * colour contrast is where this admin's measurable defects have been. Those
 * were found by hand in a browser, once, on a handful of routes. This runs
 * the same check over every route in the navigation model, on every pull
 * request.
 *
 * It reads the route list from the nav model rather than a list kept here,
 * so a page added to the admin is audited without anyone remembering to add
 * it. That is the same argument as nav-model-coverage.test.ts: a list
 * maintained by hand beside the real one drifts from it.
 */

const require = createRequire(import.meta.url);
const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

/** Pages reached from a list, not from the nav — they need an id we have not got. */
const ROUTES = [...new Set(navGroups.flatMap((g) => g.items.map((i) => i.href)))]
  .filter((href) => !href.includes(':'))
  .sort();

/**
 * Enough of a record to satisfy a list page.
 *
 * Pages sort and format these, so a missing field is a crash rather than an
 * empty table. The spread of names is deliberate: different pages reach for
 * `name`, `title` or `label` for the same column.
 */
const record = (i: number) => ({
  id: `0000000${i}-0000-0000-0000-00000000000${i}`,
  name: `Record ${i}`,
  title: `Record ${i}`,
  label: `Record ${i}`,
  displayName: `Record ${i}`,
  customerName: `Customer ${i}`,
  code: `R-00${i}`,
  number: `R-00${i}`,
  reference: `REF-00${i}`,
  description: 'A synthetic row, for measuring the page rather than the data.',
  email: `ops${i}@example.com`,
  phone: `+243 81 000 000${i}`,
  status: 'Active',
  state: 'Active',
  stage: 'Open',
  isActive: i % 4 !== 0,
  currency: 'USD',
  amount: 100 + i,
  total: 100 + i,
  subtotal: 90 + i,
  rate: 1 + i,
  quantity: i + 1,
  percentage: 5,
  createdAt: new Date('2026-01-0' + ((i % 8) + 1)).toISOString(),
  updatedAt: new Date('2026-02-0' + ((i % 8) + 1)).toISOString(),
});

const ITEMS = Array.from({ length: 6 }, (_, i) => record(i));

async function stubTheApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const paged = {
      items: ITEMS,
      totalCount: ITEMS.length,
      total: ITEMS.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };

    let data: unknown = paged;
    if (/\/users\/me/.test(url)) {
      data = { id: 'u1', firstName: 'Ada', lastName: 'Ops', email: 'ada@example.com', role: 1 };
    } else if (/\/tenants\//.test(url)) {
      data = { id: 't1', name: 'Kin Marche', accentColor: '#00D98A' };
    } else if (/catalog|areas/.test(url)) {
      data = { areas: [] };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data }),
    });
  });

  // A token the guard accepts. Unsigned and local: it never leaves the
  // browser and the guard only reads `exp`.
  await page.addInitScript(() => {
    const b64 = (o: unknown) =>
      btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    localStorage.setItem(
      'omniflow_token',
      `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'e2e', exp: Math.floor(Date.now() / 1000) + 86400 })}.x`,
    );
  });
}

interface Violation {
  id: string;
  impact: string | null;
  nodes: { html: string; target: string[]; summary: string }[];
}

async function auditOpenPage(page: Page): Promise<Violation[]> {
  await page.addScriptTag({ content: AXE_SOURCE });
  // `[data-decorative]` is excluded, and only that attribute. WCAG 1.4.3
  // exempts "text that is part of an inactive user interface component, that
  // is pure decoration" — the one element carrying it is a 60px numeral at
  // 3.5% opacity behind a card, aria-hidden and pointer-events-none, which
  // repeats the position already in the list. axe measures it at 1.02:1 and
  // is right to: it cannot tell decoration from text. Marking it is the
  // honest way to say so, and it is greppable, unlike a rule disabled
  // globally in config.
  return page.evaluate(async () => {
    const results = await (
      window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: unknown[] }> } }
    ).axe.run(
      { include: [['body']], exclude: [['[data-decorative]']] },
      {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        resultTypes: ['violations'],
      },
    );
    return (results.violations as Violation[]).map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 3).map((n) => ({
        html: n.html.slice(0, 120),
        target: n.target,
        summary: (n as unknown as { any?: { message: string }[] }).any?.[0]?.message?.slice(0, 160) ?? '',
      })),
    }));
  });
}

function describeViolations(route: string, violations: Violation[]) {
  return violations
    .map(
      (v) =>
        `${route}\n  ${v.id} (${v.impact})\n` +
        v.nodes.map((n) => `    ${n.target.join(' ')} — ${n.summary}\n      ${n.html}`).join('\n'),
    )
    .join('\n\n');
}

test.describe('WCAG 2.1 AA, in a browser, on every page in the nav', () => {
  test.beforeEach(async ({ page }) => {
    await stubTheApi(page);
  });

  for (const href of ROUTES) {
    test(href, async ({ page }) => {
      const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${href} did not load`).toBeLessThan(400);

      // Let the page settle: these are all data-driven and most render a
      // spinner first. A violation found in a loading state is a different
      // page from the one an operator sees.
      await page.waitForTimeout(1200);

      // A page that threw is not a page this can score. Fail loudly rather
      // than audit a router error screen and call it clean — an earlier
      // hand-run audit scored six pages that way without noticing.
      const crashed = await page.getByText(/Unexpected Application Error/i).count();
      expect(crashed, `${href} threw while rendering; the audit below would be of the error screen`).toBe(0);

      const violations = await auditOpenPage(page);
      expect(violations.length, `\n${describeViolations(href, violations)}\n`).toBe(0);
    });
  }
});
