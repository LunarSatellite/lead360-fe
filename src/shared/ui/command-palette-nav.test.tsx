import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The palette searches leads, contacts and deals over the network. None of
// that is what these tests are about.
vi.mock('@/features/crm/api/crm.api', () => ({
  crmApi: {
    getLeads: () => Promise.resolve({ items: [] }),
    getContacts: () => Promise.resolve({ items: [] }),
    getDeals: () => Promise.resolve({ items: [] }),
  },
}));

import { CommandPalette, openCommandPalette } from './CommandPalette';
import { allNavItems, navAliases } from '@/app/navigation/nav-model';

/**
 * Cmd+K has to reach the same admin the rail does.
 *
 * Before the merge the palette carried its own hand-written list of
 * twenty-four pages, every one of them CRM, so an operator could not jump to
 * a single commerce page. It was the eighth copy of the navigation in this
 * codebase, and it had drifted like the others.
 */

// The palette debounces its query by 250ms, so every search here has to let
// that elapse before asserting on what it offers.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

function openPalette() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  // Dispatched through act, or React never flushes the open state.
  act(() => openCommandPalette());
  return screen.getByRole('dialog');
}

const search = () => screen.getByPlaceholderText(/search leads/i);

function setQuery(value: string) {
  fireEvent.change(search(), { target: { value } });
  act(() => {
    vi.advanceTimersByTime(300);
  });
}
const rowLabels = () =>
  within(screen.getByRole('dialog'))
    .getAllByRole('button')
    .map((b) => b.textContent ?? '');

describe('the command palette is reachable at all', () => {
  it('is mounted by the dashboard shell', async () => {
    /**
     * It was not. The file says "Mounted once in the dashboard shell" and
     * nothing in the application imported it, so Cmd+K did nothing and the
     * whole component was dead code — which is also why its navigation list
     * could sit twenty-four CRM-only entries out of date without anyone
     * noticing.
     *
     * Asserted against the layout source rather than by rendering it: the
     * shell drags in token refresh, lead alerts and several live queries, and
     * stubbing all of that to prove one import would test the stubs.
     */
    const layout = (await import('@/app/layouts/DashboardLayout.tsx?raw')).default as string;

    expect(layout).toContain("from '@/shared/ui/CommandPalette'");
    expect(layout).toContain('<CommandPalette />');
  });
});

describe('the command palette offers the whole admin', () => {
  it('can reach every page in the model, commerce included', () => {
    openPalette();

    // Typed in full, each page must be offered. The palette caps its list, so
    // this asks for them one at a time rather than scraping an unfiltered dump.
    const unreachable = allNavItems
      .filter((item) => {
        setQuery(item.label);
        return !rowLabels().some((text) => text.startsWith(item.label));
      })
      .map((item) => item.label);

    expect(unreachable, 'a page the rail lists and Cmd+K cannot find').toEqual([]);
  });

  it('finds a commerce page, which it previously could not do at all', () => {
    openPalette();
    setQuery('payouts');
    expect(rowLabels().some((t) => t.startsWith('Payouts'))).toBe(true);
  });

  it('tells you the other product has its own version of this page', () => {
    // Four ideas exist once per product against different backends. Short
    // of merging those backends, saying so is the remedy: someone looking
    // at CRM orders learns commerce has its own, here, rather than a week
    // later.
    openPalette();
    setQuery('orders');

    const labels = rowLabels();
    expect(labels.some((t) => t.includes('also in'))).toBe(true);
  });

  it('says which product a page belongs to, for the names both use', () => {
    openPalette();
    setQuery('orders');

    const labels = rowLabels();
    expect(labels.some((t) => t.includes('Commerce · Orders & fulfillment'))).toBe(true);
    expect(labels.some((t) => t.includes('CRM · Orders & stock'))).toBe(true);
  });

  it('finds a page by the name the other product used for it', () => {
    openPalette();
    for (const alias of navAliases) {
      setQuery(alias.alsoKnownAs);
      expect(
        rowLabels().some((t) => t.startsWith(alias.label)),
        `searching "${alias.alsoKnownAs}" should offer ${alias.label}`,
      ).toBe(true);
    }
  });

  it('matches a group or section name, not only a page name', () => {
    openPalette();
    setQuery('procurement');
    // No page is called Procurement; the group is.
    expect(rowLabels().some((t) => t.startsWith('Purchase orders'))).toBe(true);
  });

  it('caps the list and says how many more matched', () => {
    openPalette();
    setQuery('');

    const dialog = screen.getByRole('dialog');
    // 130 rows would be the scrolling column this work exists to remove.
    expect(within(dialog).getAllByRole('button').length).toBeLessThanOrEqual(9);
    expect(within(dialog).getByText(/more pages match/i)).toBeInTheDocument();
  });

  it('puts every name match above every page that merely sits in a matching group', () => {
    // "settings" names four pages and is also the name of two groups, so
    // without an order the four get pushed off the end of a capped list by
    // pages that only happen to live under one of them.
    openPalette();
    setQuery('settings');

    // Each row reads "<page name><group> · <section>", so the page name is
    // what precedes the context line.
    const named = rowLabels()
      .filter((t) => t.length > 0)
      .map((t) => t.toLowerCase().split('·')[0].includes('settings'));

    expect(named.filter(Boolean).length).toBeGreaterThan(1);
    expect(named, 'a context match outranked a name match').toEqual(
      [...named].sort((a, b) => Number(b) - Number(a)),
    );
  });
});
