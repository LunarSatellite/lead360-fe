import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Every tab opens a query the moment it renders. This test is about which tab
// the URL selects, so the API is stubbed to a pending promise: no fixtures, no
// invented figures, nothing that could be mistaken for data.
vi.mock('../api/stylemint-intelligence.api', () => {
  const pending = () => new Promise(() => undefined);
  return {
    stylemintIntelligenceApi: new Proxy({}, { get: () => pending }),
  };
});

import { IntelligencePage, isIntelligenceTab, DEFAULT_TAB } from './IntelligencePage';

const TAB_LABELS: Record<string, string> = {
  simulation: 'Retail simulation',
  constitution: 'Commerce constitution',
};

/**
 * Tabs this page used to own, which now answer on their own pages in `intelligence-console` and
 * `decision-twin`. They were built twice; the pages won because a decision, a fingerprint or a
 * study each get a real URL there instead of an id pasted into a box.
 *
 * The URLs are kept in this test because bookmarks to them exist: each one has to land on a real
 * tab rather than render a blank page under a path that lies.
 */
const RETIRED_TABS = ['cockpit', 'ledger', 'genome', 'aurora', 'autonomy', 'twin', 'cartOffers'];

function WhereAmI() {
  const location = useLocation();
  return <span data-testid="landed">{location.pathname}</span>;
}

function openAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/stylemint/intelligence" element={<IntelligencePage />} />
          <Route path="/dashboard/stylemint/intelligence/:tab" element={<IntelligencePage />} />
          <Route path="*" element={<WhereAmI />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** The selected tab is the one carrying the active treatment. */
function selectedTab(): string | undefined {
  return Object.entries(TAB_LABELS).find(([, label]) => {
    const button = screen.queryByRole('button', { name: label });
    return button?.className.includes('bg-brand-soft');
  })?.[0];
}

describe('each decision-intelligence report answers on its own URL', () => {
  for (const [tab, label] of Object.entries(TAB_LABELS)) {
    it(`/dashboard/stylemint/intelligence/${tab} opens ${label}`, () => {
      openAt(`/dashboard/stylemint/intelligence/${tab}`);
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
      expect(selectedTab()).toBe(tab);
    });
  }

  it('opens the default when the URL names no tab, so old bookmarks still work', () => {
    openAt('/dashboard/stylemint/intelligence');
    expect(selectedTab()).toBe(DEFAULT_TAB);
  });

  it('rewrites an unknown tab to the default instead of rendering nothing', () => {
    openAt('/dashboard/stylemint/intelligence/not-a-tab');
    expect(selectedTab()).toBe(DEFAULT_TAB);
  });

  for (const tab of RETIRED_TABS) {
    it(`a bookmark to the retired ${tab} tab still lands somewhere real`, () => {
      openAt(`/dashboard/stylemint/intelligence/${tab}`);
      expect(selectedTab()).toBe(DEFAULT_TAB);
      expect(isIntelligenceTab(tab)).toBe(false);
    });
  }

  it('keeps the tab in the URL rather than in component state', () => {
    // The selected tab has to survive a reload and a copied link. That is only
    // true if the path itself names it.
    expect(isIntelligenceTab('simulation')).toBe(true);
    expect(isIntelligenceTab('billing')).toBe(false);
    expect(isIntelligenceTab(undefined)).toBe(false);
  });
});
