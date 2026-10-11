import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, within } from '@testing-library/react';

import { MemoryRouter } from 'react-router-dom';
import { allNavItems, navSections } from '@/app/navigation/nav-model';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Same stubs as mobile-more-sheet.test.tsx: the layout drags in token refresh,

// lead alerts and the bell's own queries at module load, none of which is what

// this test is about.

vi.mock('@/features/auth/hooks/useTokenAutoRefresh', () => ({
  useTokenAutoRefresh: () => undefined,
}));

vi.mock('@/features/crm/hooks/useLeadAlerts', () => ({ useLeadAlerts: () => undefined }));

vi.mock('@/features/crm/components/NotificationBell', () => ({ NotificationBell: () => null }));

vi.mock('@/features/auth/api/auth.queries', () => ({
  useProfile: () => ({ data: { firstName: 'Ada', lastName: 'Ops', email: 'ada@example.com' } }),

  useLogout: () => ({ mutate: () => undefined, isPending: false }),
}));

vi.mock('@/features/commerce-control/api/stylemint-commerce.api', () => ({
  stylemintCommerceApi: { tenantSettings: () => Promise.resolve(null) },
}));

vi.mock('@/shared/lib/tenant-theme', () => ({ applyTenantAccent: () => undefined }));

/**

 * `SHOW_LEGACY_PLATFORM_TOOLS` is decided when the module evaluates, so each

 * build needs its own module instance — hence the reset and dynamic import.

 */

async function renderShellFor(product: 'lead360' | 'stylemint') {
  vi.resetModules();

  vi.stubEnv('VITE_CONSOLE_PRODUCT', product);

  const { DashboardLayout } = await import('./DashboardLayout');

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard/commerce-control']}>
        <DashboardLayout />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Every href the shell renders — the desktop rail and the mobile sheet both. */

function renderedHrefs(): Set<string> {
  fireEvent.click(screen.getByRole('button', { name: 'More options' }));

  return new Set(
    screen

      .getAllByRole('link')

      .map((a) => a.getAttribute('href'))

      .filter((h): h is string => h !== null),
  );
}

afterEach(() => vi.unstubAllEnvs());

/**
 * What `VITE_CONSOLE_PRODUCT` is still allowed to change.
 *
 * It used to choose the navigation: `SHOW_LEGACY_PLATFORM_TOOLS` showed the
 * CRM rail or the commerce rail and never both, so each build behaved as
 * though it were the whole product and a StyleMint operator had no route to a
 * CRM page at all. That is the split the merge removed, and this file is the
 * test that used to enforce it — rewritten to assert the opposite, because
 * the premise changed and a test that no longer matches the product is worse
 * than no test.
 *
 * The flag now decides branding and nothing else.
 */
describe('both builds render the same navigation', () => {
  for (const product of ['stylemint', 'lead360'] as const) {
    it(`reaches every page in the model from the ${product} build`, async () => {
      await renderShellFor(product);
      const hrefs = renderedHrefs();

      // The bottom tab bar carries four; the sheet carries the rest.
      const missing = allNavItems.map((i) => i.href).filter((href) => !hrefs.has(href));
      expect(missing, 'a build that cannot reach part of its own admin').toEqual([]);
    });
  }

  it('shows the StyleMint build the CRM and the bot, which it used to hide', async () => {
    await renderShellFor('stylemint');
    const hrefs = renderedHrefs();

    for (const href of [
      '/dashboard/crm/leads',
      '/dashboard/crm/deals',
      '/dashboard/flows',
      '/dashboard/agents',
      '/dashboard/conversations',
    ]) {
      expect(hrefs.has(href), `${href} missing from the StyleMint build`).toBe(true);
    }
  });

  it('heads the CRM as its own section rather than mixing it into commerce', async () => {
    // Merged does not mean blended: an operator still needs to know which
    // product a page belongs to, because Sales orders and Orders & fulfilment
    // are different pages against different backends.
    await renderShellFor('stylemint');
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const sheet = screen.getByRole('dialog', { name: 'More options' });

    for (const section of navSections) {
      expect(within(sheet).getByText(section.label)).toBeInTheDocument();
    }
  });

  it('leaves behind none of the old section headings', async () => {
    await renderShellFor('stylemint');
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const sheet = screen.getByRole('dialog', { name: 'More options' });

    // "Bot & AI", "Build" and "Configure" named arrays that no longer exist.
    for (const heading of ['Bot & AI', 'Build', 'Configure']) {
      expect(within(sheet).queryByText(heading)).toBeNull();
    }
  });
});

describe('the flag still decides the brand', () => {
  it('names itself StyleMint where the shell falls back to a name', async () => {
    await renderShellFor('stylemint');
    expect(screen.getAllByAltText('StyleMint').length).toBeGreaterThan(0);
    expect(screen.queryByAltText('Lead360')).toBeNull();
  });

  it('still falls back to the Lead360 name', async () => {
    await renderShellFor('lead360');
    expect(screen.getAllByAltText('Lead360').length).toBeGreaterThan(0);
  });
});
