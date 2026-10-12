import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { routeObjects } from '@/app/router/route-table';
import { VendorSideMenu } from './components/VendorSideMenu';
import {
  DEFAULT_VENDOR_SECTION,
  resolveVendorSection,
  vendorSectionGroups,
  vendorSections,
} from './vendor-sections';

/**
 * The vendor console used to be 31 cards above its content, with the open
 * section held in component state.
 *
 * These cover the three things that made it hard to use: the grid pushed the
 * content below the fold, the selection was not in the URL, and every card
 * showed a row count so all 31 endpoints were fetched before an operator had
 * chosen anything.
 */

const hrefFor = (key: string) => `/dashboard/stylemint/vendor/${key}`;

function renderMenu(currentKey = DEFAULT_VENDOR_SECTION, counts?: Record<string, number>) {
  const current = resolveVendorSection(currentKey);
  render(
    <MemoryRouter initialEntries={[hrefFor(currentKey)]}>
      <VendorSideMenu current={current} hrefFor={hrefFor} counts={counts} />
    </MemoryRouter>,
  );
  return current;
}

const groupButton = (label: string) =>
  screen.getByRole('button', { name: (name) => name === label });

const links = () =>
  screen.queryAllByRole('link').map((a) => a.getAttribute('href') ?? '');

describe('the vendor section model', () => {
  it('places every section in exactly one group', () => {
    const placed = vendorSectionGroups.flatMap((g) => g.sections.map((s) => s.key));

    expect(placed).toHaveLength(vendorSections.length);
    expect(new Set(placed).size).toBe(placed.length);
  });

  it('keeps every group small enough to scan', () => {
    // 31 in one list is what this replaced. A group that grows past about
    // ten is the same problem in a smaller box.
    const oversized = vendorSectionGroups
      .filter((g) => g.sections.length > 10)
      .map((g) => `${g.label} (${g.sections.length})`);

    expect(oversized).toEqual([]);
  });

  it('resolves a section from the URL, including the ones with a slash', () => {
    // 'pricing/flash-sales' and 'analytics/creators' contain a slash, which
    // is why the route is a splat rather than a single :param.
    expect(resolveVendorSection('pricing/flash-sales').label).toBe('Flash sales');
    expect(resolveVendorSection('analytics/creators').key).toBe('analytics/creators');
    expect(resolveVendorSection('/products/').key).toBe('products');
  });

  it('falls back to the default rather than rendering an empty console', () => {
    expect(resolveVendorSection(undefined).key).toBe(DEFAULT_VENDOR_SECTION);
    expect(resolveVendorSection('not-a-section').key).toBe(DEFAULT_VENDOR_SECTION);
  });

  it('has a route that can carry a section key', () => {
    const paths = routeObjects
      .flatMap((r) => (r.path === '/dashboard' ? (r.children ?? []) : []))
      .map((c) => c.path);

    expect(paths).toContain('stylemint/vendor');
    expect(paths, 'without a splat, a key containing a slash cannot route').toContain(
      'stylemint/vendor/*',
    );
  });
});

describe('the vendor side menu', () => {
  it('offers every group, and opens the one holding the current section', () => {
    renderMenu('products');

    for (const group of vendorSectionGroups) {
      expect(groupButton(group.label)).toBeInTheDocument();
    }

    const open = vendorSectionGroups.filter(
      (g) => groupButton(g.label).getAttribute('aria-expanded') === 'true',
    );
    expect(open.map((g) => g.id)).toEqual(['catalog']);
  });

  it('reaches every section by opening groups', () => {
    renderMenu();
    const reachable = new Set<string>();

    for (const group of vendorSectionGroups) {
      if (groupButton(group.label).getAttribute('aria-expanded') !== 'true') {
        fireEvent.click(groupButton(group.label));
      }
      for (const href of links()) reachable.add(href);
    }

    const missing = vendorSections.map((s) => hrefFor(s.key)).filter((h) => !reachable.has(h));
    expect(missing, 'a section the menu will not show').toEqual([]);
  });

  it('links each section rather than holding the choice in state', () => {
    // The whole point: a section can be linked to, bookmarked and reached
    // with the Back button. As component state none of that worked.
    renderMenu('products');
    const productsLink = screen.getByRole('link', { name: /Products/ });

    expect(productsLink).toHaveAttribute('href', '/dashboard/stylemint/vendor/products');
    expect(productsLink).toHaveAttribute('aria-current', 'page');
  });

  it('marks the default section on the bare vendor URL', () => {
    /**
     * The regression this caught: the menu used NavLink, which derives
     * `aria-current` from the URL and overrides the prop. On
     * /dashboard/stylemint/vendor the default section is open but its own
     * href is not in the URL, so NavLink marked nothing and the menu showed
     * no position at all. The page knows which section is open; it is the
     * one that should say so.
     *
     * Note the initial entry: the earlier tests all routed straight to the
     * section's own href, which is exactly the case NavLink got right.
     */
    render(
      <MemoryRouter initialEntries={['/dashboard/stylemint/vendor']}>
        <VendorSideMenu
          current={resolveVendorSection(undefined)}
          hrefFor={hrefFor}
        />
      </MemoryRouter>,
    );

    const current = screen.getAllByRole('link').filter(
      (a) => a.getAttribute('aria-current') === 'page',
    );
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('href', hrefFor(DEFAULT_VENDOR_SECTION));
  });

  it('filters across every group at once', () => {
    // "sales" names sections in Pricing, Partnerships and Intelligence. An
    // operator who knows the section should not have to know which of the
    // eight groups we filed it under — the same argument as the main rail.
    renderMenu();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter vendor sections' }), {
      target: { value: 'sales' },
    });

    const shown = links();
    const groupsHit = new Set(
      vendorSectionGroups
        .filter((g) => g.sections.some((s) => shown.includes(hrefFor(s.key))))
        .map((g) => g.id),
    );

    expect(shown).toContain('/dashboard/stylemint/vendor/pricing/flash-sales');
    expect(shown).not.toContain('/dashboard/stylemint/vendor/products');
    expect(groupsHit.size, 'the filter only searched one group').toBeGreaterThan(1);
  });

  it('says so when nothing matches', () => {
    renderMenu();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter vendor sections' }), {
      target: { value: 'zzzz' },
    });

    expect(screen.getByText(/no section matches/i)).toBeInTheDocument();
    expect(links()).toEqual([]);
  });

  it('shows a count only for sections that have been loaded', () => {
    /**
     * Every card used to show a count, which is why all 31 endpoints were
     * fetched on arrival. Counts now come from whatever the cache already
     * holds, so an unvisited section simply has none.
     */
    renderMenu('products', { products: 12 });

    expect(screen.getByRole('link', { name: /Products/ })).toHaveTextContent('12');
    expect(screen.getByRole('link', { name: /Collections/ })).not.toHaveTextContent(/\d/);
  });
});
