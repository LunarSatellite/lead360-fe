import { expect, test, type Page } from '@playwright/test';
import { navGroups } from '../src/app/navigation/nav-model';
import { APP_NAME, documentTitleFor } from '../src/app/layouts/document-title';
import { stubTheApi } from './harness';

/**
 * Every tab in this admin said "Lead360".
 *
 * All 131 pages served the `<title>` straight out of index.html and
 * nothing ever changed it. An operator with the pipeline, an invoice and
 * a vendor open had three identical tabs; browser history was 131 rows
 * of the same word.
 *
 * axe cannot catch this. WCAG 2.4.2 asks for a title that describes the
 * page, and a title did exist — it was simply the same one everywhere,
 * which is a rule no automated check expresses. So it gets its own.
 *
 * Measured in a real browser rather than from the pure function, because
 * the function being right proves nothing if nobody calls it: the first
 * version of the fix could have computed a perfect string and never
 * assigned `document.title`, and every unit test would still be green.
 */

const ROUTES = [...new Set(navGroups.flatMap((g) => g.items.map((i) => i.href)))]
  .filter((href) => !href.includes(':'))
  .sort();

/**
 * Wait for the dashboard shell, not for the title.
 *
 * The first version waited for `document.title !== ''`, which is true
 * the moment index.html parses — so it waited for nothing and read the
 * static title off a page that had not finished mounting. It reported
 * /dashboard/analytics as untitled when the only slow thing about it was
 * its lazy chunk.
 */
async function settled(page: Page) {
  await page.waitForSelector('nav[aria-label="Breadcrumb"]', { timeout: 15_000 });
}

test.describe('every page says which page it is', () => {
  test.beforeEach(async ({ page }) => {
    await stubTheApi(page);
  });

  test('no two pages in the nav share a tab title', async ({ page }) => {
    // One test that walks all 131 routes, rather than 131 tests: the
    // assertion is about the set, not about any single page.
    test.setTimeout(300_000);
    /**
     * The duplicate-name pairs are the reason this is a hard assertion
     * rather than a sampled one. CRM "Orders" and Commerce "Orders" are
     * the two tabs most likely to be open at once and were previously
     * impossible to tell apart.
     */
    const seen = new Map<string, string>();
    const collisions: string[] = [];

    for (const href of ROUTES) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await settled(page);
      const title = await page.title();

      expect(title, `${href} still has the bare app name as its title`).not.toBe(APP_NAME);
      expect(title, `${href} has no title`).toBeTruthy();

      const already = seen.get(title);
      if (already) collisions.push(`${title}  ←  ${already} and ${href}`);
      else seen.set(title, href);
    }

    expect(collisions, 'these pages are indistinguishable in a browser tab').toEqual([]);
    expect(seen.size).toBe(ROUTES.length);
  });

  test('the tab agrees with the breadcrumb the page shows', async ({ page }) => {
    /**
     * A title built from a second source would drift from the one on
     * screen. Checking a handful is enough to catch that; checking all
     * 131 twice is not worth the minutes.
     */
    for (const href of ['/dashboard/crm/orders', '/dashboard/stylemint/orders', '/dashboard/crm/quotes']) {
      await page.goto(href, { waitUntil: 'domcontentloaded' });
      await settled(page);

      const crumbs = await page.getByLabel('Breadcrumb').locator('li, a, span').allInnerTexts();
      const visible = crumbs.map((c) => c.trim()).filter(Boolean);
      const title = await page.title();

      const page_ = title.split(' · ')[0];
      expect(
        visible.some((c) => c === page_),
        `${href}: tab says "${page_}" but the breadcrumb says ${JSON.stringify(visible)}`,
      ).toBe(true);
    }
  });

  test('announces the new page to a screen reader on navigation', async ({ page }) => {
    /**
     * A single-page app does not reload, so without a live region a
     * screen reader user clicks "Invoices" and hears nothing at all.
     */
    await page.goto('/dashboard/crm/quotes', { waitUntil: 'domcontentloaded' });
    const live = page.locator('[aria-live="polite"]').first();
    await expect(live).toHaveText('Quotes');

    await page.goto('/dashboard/crm/invoices', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[aria-live="polite"]').first()).toHaveText('Invoices');
  });

  test('the browser agrees with the pure function', async ({ page }) => {
    await page.goto('/dashboard/crm/quotes', { waitUntil: 'domcontentloaded' });
    await settled(page);
    expect(await page.title()).toBe(documentTitleFor(['CRM', 'Deals & pipeline', 'Quotes']));
  });
});
