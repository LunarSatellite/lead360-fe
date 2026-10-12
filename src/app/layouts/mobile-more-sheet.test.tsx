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

import { DashboardLayout, primaryMobileTabs } from './DashboardLayout';
import { allNavItems, navGroups, navSections } from '@/app/navigation/nav-model';

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

/**
 * The phone and the desktop now render the same model, and this is the test
 * that keeps it that way.
 *
 * They used to render different hand-kept arrays. The drift was not
 * hypothetical: moreNav_configure was the only list naming four pages, so on
 * a desktop those pages could not be reached at all, and the sheet gated
 * three of its sections on the build flag while the bottom bar did not.
 */
describe('the mobile "More" sheet shows the same admin as the desktop rail', () => {
  it('leaves no page in the model unreachable from a phone', () => {
    const sheet = openMoreSheet();

    // A phone reaches a page either from the bottom tab bar or from the sheet.
    const inBottomBar = new Set<string>(primaryMobileTabs.map((t) => t.href));
    const inSheet = new Set(
      within(sheet)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    );

    const unreachable = allNavItems
      .filter((item) => !inBottomBar.has(item.href) && !inSheet.has(item.href))
      .map((item) => item.label);

    expect(unreachable).toEqual([]);
  });

  it('heads every section and every group, in the rail order', () => {
    const sheet = openMoreSheet();

    for (const section of navSections) {
      expect(within(sheet).getByText(section.label)).toBeInTheDocument();
    }
    for (const group of navGroups) {
      expect(within(sheet).getAllByText(group.label).length).toBeGreaterThan(0);
    }
  });

  it('does not repeat the four surfaces already in the bottom tab bar', () => {
    const sheet = openMoreSheet();
    const hrefs = within(sheet)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));

    for (const tab of primaryMobileTabs) {
      expect(hrefs).not.toContain(tab.href);
    }
  });

  it('carries the CRM too, which the StyleMint build used to drop here', () => {
    // These were behind SHOW_LEGACY_PLATFORM_TOOLS, so on a StyleMint phone
    // the CRM simply did not exist.
    const sheet = openMoreSheet();
    const hrefs = within(sheet)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/dashboard/crm/leads');
    expect(hrefs).toContain('/dashboard/flows');
  });

  it('shows the whole rail to every operator — the nav carries no role gate', () => {
    // The one filter that existed, `item.label !== 'Clients' || role === 1`,
    // never matched an item and so never hid anything. Nothing replaced it:
    // if a real gate is wanted it has to be designed, not inferred.
    const sheet = openMoreSheet();
    expect(within(sheet).getAllByRole('link')).toHaveLength(allNavItems.length - primaryMobileTabs.length);
  });
});
