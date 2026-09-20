import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The layout pulls a lot of live machinery in at module load — token refresh,
// lead alerts, the notification bell's own queries. None of it is what this
// test is about, so it is stubbed down to nothing.
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

import { DashboardLayout, primaryNav, primaryMobileTabs } from './DashboardLayout';

function renderLayout() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard/commerce-control']}>
        <DashboardLayout />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function openMoreSheet() {
  renderLayout();
  fireEvent.click(screen.getByRole('button', { name: 'More options' }));
  return screen.getByRole('dialog', { name: 'More options' });
}

describe('the mobile "More" sheet reaches the commerce console', () => {
  it('lists a Commerce section, so the sheet named "Commerce tools" contains some', () => {
    const sheet = openMoreSheet();
    expect(within(sheet).getByText('Commerce')).toBeInTheDocument();
  });

  it('leaves no commerce surface unreachable from a phone', () => {
    const sheet = openMoreSheet();

    // A phone reaches a surface either from the bottom tab bar or from the sheet.
    const inBottomBar = new Set(primaryMobileTabs.map((t) => t.href));
    const inSheet = new Set(
      within(sheet)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    );

    const unreachable = primaryNav
      .filter((item) => !inBottomBar.has(item.href) && !inSheet.has(item.href))
      .map((item) => item.label);

    expect(unreachable).toEqual([]);
  });

  it('does not repeat the four surfaces already in the bottom tab bar', () => {
    const sheet = openMoreSheet();
    const commerceHeading = within(sheet).getByText('Commerce');
    const section = commerceHeading.closest('section');
    expect(section).not.toBeNull();

    const hrefs = within(section as HTMLElement)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));

    for (const tab of primaryMobileTabs) {
      expect(hrefs).not.toContain(tab.href);
    }
  });

  it('shows the commerce rail to every operator — the nav carries no role gate', () => {
    // The one filter that existed, `item.label !== 'Clients' || role === 1`,
    // never matched an item and so never hid anything. Nothing replaced it:
    // if a real gate is wanted it has to be designed, not inferred.
    const sheet = openMoreSheet();
    const section = within(sheet).getByText('Commerce').closest('section') as HTMLElement;
    expect(within(section).getAllByRole('link')).toHaveLength(
      primaryNav.length - primaryMobileTabs.length,
    );
  });
});
