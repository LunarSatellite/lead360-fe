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

const ROUTES = navGroups
  .flatMap((g) => g.items.map((i) => ({ href: i.href, label: i.label })))
  .filter((r) => !r.href.includes(':'))
  .sort((a, b) => a.href.localeCompare(b.href));

/** Set by the survey that introduced this file. Lower it; never raise it. */
const BUDGET_OFF_SIZE_HEADINGS = 50;
const BUDGET_PAGES_WITH_NO_HEADING = 9;

/**
 * Pages whose heading is not what the nav calls them.
 *
 * "Automations" in the sidebar opens a page headed "Workflows".
 * "Catalogue sync" opens one headed "Pipeline". "Control center" opens
 * one headed "Kin Marche". A third of the admin answers to two names,
 * which is the same confusion the duplicate Orders pages caused, in a
 * place nobody had looked.
 *
 * Budgeted, not absolute, because closing one means choosing which name
 * is right -- "Delivery ops" or "Delivery operations" -- and that is an
 * editorial call per page, not something to settle in a codemod. Some
 * were only a spelling convention apart; the admin wrote visible text
 * in American English 39 times and British 5, and the routes agreed
 * (`/dashboard/crm/organizations` was listed as "Organisations"), so
 * those were brought into line separately.
 */
const BUDGET_NAME_DISAGREEMENTS = 36;
const HOUSE_SIZE = '20px';

test('the page heading is converging on one size', async ({ page }) => {
  test.setTimeout(400_000);
  await stubTheApi(page);

  const offSize: string[] = [];
  const missing: string[] = [];
  const tinier: string[] = [];
  const disagreeing: string[] = [];

  for (const { href, label } of ROUTES) {
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

    // A page the signed-in test user may not open shows a permission
    // notice where its heading would be. That is the role, not a name.
    const isPermissionNotice = /access required/i.test(found.text);
    const same = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!isPermissionNotice && same(found.text) !== same(label)) {
      disagreeing.push(`${href} — nav "${label}" vs heading "${found.text}"`);
    }
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
    disagreeing.length,
    disagreeing.length > BUDGET_NAME_DISAGREEMENTS
      ? `a page is named one thing in the nav and another on the page:\n${disagreeing.join('\n')}`
      : `${BUDGET_NAME_DISAGREEMENTS - disagreeing.length} fewer than the budget — lower BUDGET_NAME_DISAGREEMENTS to ${disagreeing.length}`,
  ).toBe(BUDGET_NAME_DISAGREEMENTS);

  expect(
    offSize.length,
    offSize.length > BUDGET_OFF_SIZE_HEADINGS
      ? `a new page heading is off the house size (${HOUSE_SIZE}):\n${offSize.join('\n')}`
      : `${BUDGET_OFF_SIZE_HEADINGS - offSize.length} fewer than the budget — lower BUDGET_OFF_SIZE_HEADINGS to ${offSize.length}`,
  ).toBe(BUDGET_OFF_SIZE_HEADINGS);
});
