import { expect, test } from '@playwright/test';
import { navGroups } from '../src/app/navigation/nav-model';
import { stubTheApi } from './harness';

/**
 * The page title, written eight different ways.
 *
 * Surveyed across all 131 pages, the heading each page gives itself came
 * out at 20px on 68 of them, 24px on 40, 30px on 6, 36px on 3, and once
 * each at 44px, 18px, 17px and 15px — with nine pages having no heading
 * at all. Three of those were smaller than the body text underneath
 * them, and one was a 44px sentence: "Every sale, settlement and payout.
 * One trusted workspace." — the product pitch where the page name should
 * be.
 *
 * `PageHeader` has said `text-xl` since it was written, and exactly one
 * page in the admin uses it. The 68 that match it do so by coincidence.
 *
 * A budget, not an absolute: 24px for a page title is a defensible
 * choice and changing 60 pages' typography in one branch would be
 * unreviewable. What is not defensible is that the number keeps
 * climbing, so it is pinned here and can only come down.
 *
 * Measured in a browser because that is the only place the answer
 * exists. Half of these sizes come from a Tailwind class, some from an
 * inline `style={{ fontSize: 15 }}`, and the rest from whatever a parent
 * sets; no source scan reconciles that.
 */

const ROUTES = [...new Set(navGroups.flatMap((g) => g.items.map((i) => i.href)))]
  .filter((href) => !href.includes(':'))
  .sort();

/** Set by the survey that introduced this file. Lower it; never raise it. */
const BUDGET_OFF_SIZE_HEADINGS = 50;
const BUDGET_PAGES_WITH_NO_HEADING = 9;
const HOUSE_SIZE = '20px';

test('the page heading is converging on one size', async ({ page }) => {
  test.setTimeout(400_000);
  await stubTheApi(page);

  const offSize: string[] = [];
  const missing: string[] = [];
  const tinier: string[] = [];

  for (const href of ROUTES) {
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav[aria-label="Breadcrumb"]', { timeout: 15_000 });

    const found = await page.evaluate(() => {
      const h = document.querySelector('main[tabindex] h1, main[tabindex] h2');
      if (!h) return null;
      const body = document.querySelector('main[tabindex] p');
      return {
        size: Number.parseFloat(getComputedStyle(h).fontSize),
        body: body ? Number.parseFloat(getComputedStyle(body).fontSize) : null,
        text: (h.textContent ?? '').trim().slice(0, 40),
      };
    });

    if (!found) {
      missing.push(href);
      continue;
    }
    if (`${found.size}px` !== HOUSE_SIZE) offSize.push(`${href} — ${found.size}px "${found.text}"`);
    // A heading smaller than the prose beneath it is not a style choice.
    if (found.body !== null && found.size < found.body) {
      tinier.push(`${href} — heading ${found.size}px under body ${found.body}px`);
    }
  }

  expect(tinier, 'a page heading must not be smaller than the text under it').toEqual([]);
  expect(missing.length, `pages with no heading at all:\n${missing.join('\n')}`).toBeLessThanOrEqual(
    BUDGET_PAGES_WITH_NO_HEADING,
  );
  expect(
    offSize.length,
    offSize.length > BUDGET_OFF_SIZE_HEADINGS
      ? `a new page heading is off the house size (${HOUSE_SIZE}):\n${offSize.join('\n')}`
      : `${BUDGET_OFF_SIZE_HEADINGS - offSize.length} fewer than the budget — lower BUDGET_OFF_SIZE_HEADINGS to ${offSize.length}`,
  ).toBe(BUDGET_OFF_SIZE_HEADINGS);
});
