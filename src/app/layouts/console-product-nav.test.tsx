import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

describe('the StyleMint console shows no chatbot or CRM navigation', () => {
  it('renders no link into the bot builder or the CRM', async () => {
    await renderShellFor('stylemint');
    const hrefs = renderedHrefs();

    // Two CRM routes stay on purpose: the commerce rail lists them itself, as
    // "Campaigns" and "Stores", because commerce has no page of its own for
    // either. They are doors the commerce nav owns, not leftovers of the CRM
    // section, so hiding that section must not take them with it.
    const keptOnPurpose = new Set(['/dashboard/crm/campaigns', '/dashboard/crm/organizations']);

    const legacy = [...hrefs].filter(
      (href) =>
        !keptOnPurpose.has(href) &&
        (href.startsWith('/dashboard/crm/') ||
          ['/dashboard/chat', '/dashboard/flows', '/dashboard/agents', '/dashboard/channels',
            '/dashboard/intents', '/dashboard/test-channel', '/dashboard/conversations',
            '/dashboard/api-connection', '/dashboard/catalog'].includes(href)),
    );
    expect(legacy).toEqual([]);
  });

  it('leaves behind no section heading with nothing under it', async () => {
    await renderShellFor('stylemint');
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const sheet = screen.getByRole('dialog', { name: 'More options' });

    for (const heading of ['Bot & AI', 'CRM', 'Build', 'Configure']) {
      expect(within(sheet).queryByText(heading)).toBeNull();
    }
  });

  it('still shows the commerce rail it exists for', async () => {
    await renderShellFor('stylemint');
    const hrefs = renderedHrefs();
    expect(hrefs.has('/dashboard/commerce-control')).toBe(true);
    expect(hrefs.has('/dashboard/stylemint/orders')).toBe(true);
    expect(hrefs.has('/dashboard/settings')).toBe(true);
  });

  it('names itself StyleMint, not Lead360, where the shell falls back to a name', async () => {
    await renderShellFor('stylemint');
    expect(screen.getAllByAltText('StyleMint').length).toBeGreaterThan(0);
    expect(screen.queryByAltText('Lead360')).toBeNull();
  });
});

describe('the lead360 console keeps every section it had', () => {
  it('still links into the bot builder and the CRM', async () => {
    await renderShellFor('lead360');
    const hrefs = renderedHrefs();
    expect(hrefs.has('/dashboard/chat')).toBe(true);
    expect(hrefs.has('/dashboard/flows')).toBe(true);
    expect(hrefs.has('/dashboard/crm/leads')).toBe(true);
    expect(hrefs.has('/dashboard/crm/deals')).toBe(true);
  });

  it('still heads those sections in the mobile sheet', async () => {
    await renderShellFor('lead360');
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const sheet = screen.getByRole('dialog', { name: 'More options' });

    for (const heading of ['Commerce', 'Build', 'Configure', 'Bot & AI', 'CRM', 'Workspace']) {
      expect(within(sheet).getByText(heading)).toBeInTheDocument();
    }
  });

  it('still falls back to the Lead360 name', async () => {
    await renderShellFor('lead360');
    expect(screen.getAllByAltText('Lead360').length).toBeGreaterThan(0);
  });
});
