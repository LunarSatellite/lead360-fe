import { expect, test, type Page } from '@playwright/test';
import { navGroups } from '../src/app/navigation/nav-model';

/**
 * Visual quality, as two things a machine can actually decide.
 *
 * The accessibility suite measures the admin against WCAG, which is an
 * external standard and the reason it is worth having. But WCAG says nothing
 * about the complaint this work started from — that the admin looked poor —
 * and "looks poor" needs to be turned into something checkable or it stays
 * an opinion that each new page gets to re-litigate.
 *
 * Two properties, both of which the admin measurably failed:
 *
 *   A bounded vocabulary. The original fault was 219 distinct spellings of
 *   one button: 22 paddings, 11 radii, 8 text sizes. Nothing was wrong on
 *   any single screen and no two screens agreed. So: count the distinct
 *   rendered geometries across the whole admin and hold them to a budget.
 *   This is the complaint, measured.
 *
 *   No horizontal overflow on a phone. A page wider than its viewport is
 *   the most visible kind of broken, and it cannot be seen from a desktop
 *   browser, which is where all of this has been checked so far.
 */

const ROUTES = [...new Set(navGroups.flatMap((g) => g.items.map((i) => i.href)))]
  .filter((href) => !href.includes(':'))
  .sort();

/** A representative sample: every section, not every page, to keep this quick. */
const SAMPLE = navGroups.map((g) => g.items[0].href);

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
    let data: unknown = {
      items: ITEMS,
      totalCount: ITEMS.length,
      total: ITEMS.length,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
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

  await page.addInitScript(() => {
    const b64 = (o: unknown) =>
      btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    localStorage.setItem(
      'omniflow_token',
      `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'e2e', exp: Math.floor(Date.now() / 1000) + 86400 })}.x`,
    );
  });
}

test.describe('the admin has one visual vocabulary, not one per page', () => {
  test.beforeEach(async ({ page }) => {
    await stubTheApi(page);
  });

  // It walks all 131 routes, so it needs more than the default budget.
  test.slow();

  test('every button from the design system renders at one of three heights', async ({ page }) => {
    /**
     * Not "the admin has three button sizes" — it does not, and should not.
     * Many `<button>` elements here are tabs, chips, toggles and clickable
     * cards, which are legitimately their own shapes. Counting all of them
     * gave 58 distinct geometries, and migrating 328 buttons moved that to
     * 57: adding conforming buttons does not remove one-offs, and the
     * number says nothing useful about either.
     *
     * The two things that do say something are asserted here instead.
     *
     * First: controls that come from the design system must agree with each
     * other. If `Button` itself rendered at six heights the system would be
     * decorative. Three sizes, three heights, across all 131 pages.
     */
    const heights = new Map<string, string[]>();

    for (const href of ROUTES) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const found = await page.evaluate(() =>
        [...document.querySelectorAll('button, a')]
          .filter((el) => el.offsetParent !== null)
          // `data-ui="button"`, set by the primitive itself. Matching on
          // a class instead caught hand-written buttons that happen to use
          // `border-transparent`, and reported eight heights for a system
          // that has three.
          .filter((el) => el.getAttribute('data-ui') === 'button')
          .map((el) => {
            const c = getComputedStyle(el);
            return `h${Math.round(parseFloat(c.height))} r${c.borderRadius}`;
          }),
      );
      for (const g of found) {
        if (!heights.has(g)) heights.set(g, []);
        if (heights.get(g)!.length < 3) heights.get(g)!.push(href);
      }
    }

    const report = [...heights.entries()].sort().map(([g, w]) => `  ${g} — ${w.join(', ')}`);
    expect(heights.size, ['', ...report, ''].join('\n')).toBeLessThanOrEqual(3);
  });

  test.slow();

  test('a third of the visible buttons come from the design system', async ({ page }) => {
    /**
     * Second: adoption. This is the number that says whether there is one
     * vocabulary or 131, and unlike a geometry count it cannot be gamed by
     * adding more conforming buttons — the denominator grows too.
     *
     * The budget only moves up. It was 0 before any of this work.
     */
    // 43% today: 54 of 127 visible buttons across the sample. It was 0
    // before this work. The floor sits just under the measured figure so
    // ordinary variation between runs does not fail the build, and it is
    // raised when a migration lands — the same ratchet as the source-level
    // budgets, on the thing an operator actually sees.
    // 46% today: 417 of 898 visible buttons across all 131 pages. It was 0
    // before this work.
    //
    // Measured over every route, not a sample. An 18-page sample reported
    // 43% both before and after 97 tonal buttons were migrated, because
    // none of the 53 files involved happened to be in it — a number that
    // cannot move is not a measurement.
    //
    // The floor sits just under the figure so ordinary variation does not
    // fail a build, and it only ever goes up.
    const FLOOR = 0.45;
    let total = 0;
    let fromSystem = 0;

    for (const href of ROUTES) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const counts = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')].filter(
          (b) => b.offsetParent !== null && (b.textContent ?? '').trim(),
        );
        return {
          all: buttons.length,
          system: buttons.filter((b) => b.getAttribute('data-ui') === 'button').length,
        };
      });
      total += counts.all;
      fromSystem += counts.system;
    }

    const share = total ? fromSystem / total : 0;
    expect(
      share,
      `
${fromSystem} of ${total} visible buttons across ${ROUTES.length} pages (${(share * 100).toFixed(0)}%)
`,
    ).toBeGreaterThanOrEqual(FLOOR);
  });
});

test.describe('the chrome says something the page does not', () => {
  test.beforeEach(async ({ page }) => {
    await stubTheApi(page);
  });

  test('the sticky bar is a breadcrumb, not a second copy of the heading', async ({ page }) => {
    /**
     * Measured across twelve pages before this: every one printed its own
     * name in the sticky bar and again in its <h1> forty pixels below. Two
     * headings, the same word, and neither the obvious one.
     *
     * The bar is the only place that can say which section and group a page
     * is in — the thing the merged rail knows and the page cannot show —
     * so it says that instead.
     */
    const checked = [
      { href: '/dashboard/crm/quotes', crumbs: ['CRM', 'Deals & pipeline', 'Quotes'] },
      { href: '/dashboard/stylemint/orders', crumbs: ['Commerce', 'Orders & fulfilment'] },
      { href: '/dashboard/agents', crumbs: ['Commerce', 'Automation & AI', 'Agents'] },
    ];

    for (const { href, crumbs } of checked) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(900);

      const trail = page.getByRole('navigation', { name: 'Breadcrumb' });
      await expect(trail, `${href} has no breadcrumb`).toBeVisible();

      const text = ((await trail.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      for (const crumb of crumbs) {
        expect(text, `${href} breadcrumb is "${text}"`).toContain(crumb);
      }

      // And it must not simply repeat the page's own heading. `count()`
      // first: a page with no h1 makes `textContent()` wait out the whole
      // timeout rather than return nothing.
      const headings = page.locator('main h1');
      const heading =
        (await headings.count()) > 0
          ? ((await headings.first().textContent()) ?? '').trim()
          : '';
      if (heading) {
        expect(text.toLowerCase(), `${href} bar is just the h1 again`).not.toBe(
          heading.toLowerCase(),
        );
      }
    }
  });
});

test.describe('the admin fits on a phone', () => {
  test.beforeEach(async ({ page }) => {
    await stubTheApi(page);
    await page.setViewportSize({ width: 375, height: 812 });
  });

  for (const href of SAMPLE) {
    test(`no sideways scrolling at 375px: ${href}`, async ({ page }) => {
      /**
       * A page wider than the phone it is on is the most visible kind of
       * broken, and every check in this work so far has run at 1440px.
       *
       * One pixel of slack: sub-pixel layout rounding can put
       * scrollWidth one above clientWidth on a page that looks perfect.
       */
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(900);

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const widest = [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({
            right: Math.round(el.getBoundingClientRect().right),
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.toString?.() ?? '').slice(0, 70),
          }))
          .filter((x) => x.right > doc.clientWidth + 1)
          .sort((a, b) => b.right - a.right)
          .slice(0, 3);

        return { page: doc.scrollWidth, viewport: doc.clientWidth, widest };
      });

      expect(
        overflow.page,
        `\nscrollWidth ${overflow.page} > viewport ${overflow.viewport}. Widest:\n` +
          overflow.widest.map((w) => `  ${w.tag}.${w.cls} ends at ${w.right}`).join('\n') +
          '\n',
      ).toBeLessThanOrEqual(overflow.viewport + 1);
    });
  }
});
