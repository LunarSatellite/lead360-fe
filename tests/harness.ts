import type { Page } from '@playwright/test';

/**
 * The shared browser harness: a signed-in session and an API that
 * answers.
 *
 * It lived inside the accessibility spec until a second spec needed the
 * same signed-in page. Copying it would have meant two definitions of
 * "logged in" drifting apart, and the first symptom of that is a suite
 * that silently audits a login screen.
 */

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

export async function stubTheApi(page: Page) {
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
