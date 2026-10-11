import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { allNavItems, navAliases, navGroups, navSections } from './nav-model';

/**
 * What the grouped rail has to do that the flat one did not.
 *
 * nav-model-coverage.test.ts proves the model lists every page. That is a
 * different claim from "an operator can get to every page", which is what this
 * file is for: a group that never opens hides its items just as completely as
 * leaving them out of the model.
 */

function renderNav(pathname: string, expanded = true) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <SidebarNav expanded={expanded} />
    </MemoryRouter>,
  );
}

/** Exact, because "Settings" and "CRM settings" both exist on purpose. */
const groupButton = (label: string) => screen.getByRole('button', { name: (name) => name === label });

const expandedGroupIds = () =>
  navGroups.filter((g) => groupButton(g.label).getAttribute('aria-expanded') === 'true').map((g) => g.id);

/** queryAll, not getAll: clicking the open group shut leaves no links at all. */
const hrefs = () =>
  screen
    .queryAllByRole('link')
    .map((a) => a.getAttribute('href'))
    .filter((h): h is string => h !== null);

describe('commerce is the main surface and the CRM is beside it', () => {
  it('draws Commerce first, then the CRM, then the shared workspace', () => {
    renderNav('/dashboard');
    const rail = screen.getByRole('navigation', { name: 'Sections' });
    const text = rail.textContent ?? '';

    const order = navSections.map((s) => text.indexOf(s.label));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(navSections.map((s) => s.id)).toEqual(['commerce', 'crm', 'workspace']);
  });

  it('opens a commerce group on a page that belongs to no group', () => {
    // Landing on an all-closed rail makes an operator open something just to
    // learn what the admin is for. The answer is commerce.
    renderNav('/dashboard');

    const open = expandedGroupIds();
    expect(open).toHaveLength(1);
    expect(navGroups.find((g) => g.id === open[0])?.section).toBe('commerce');
  });

  it('leaves every CRM group shut while you are working in commerce', () => {
    renderNav('/dashboard/stylemint/orders');

    const crmOpen = expandedGroupIds().filter((id) => navGroups.find((g) => g.id === id)?.section === 'crm');
    expect(crmOpen).toEqual([]);
    expect(expandedGroupIds()).toEqual(['orders']);
  });

  it('still opens the CRM when that is where you are', () => {
    // Side does not mean hidden: the 68 CRM pages are all still here.
    renderNav('/dashboard/crm/leads');
    expect(expandedGroupIds()).toEqual(['crm-contacts']);
    expect(hrefs()).toContain('/dashboard/crm/leads');
  });
});

describe('the grouped sidebar rail', () => {
  it('offers every group, and opens only the one holding the current page', () => {
    renderNav('/dashboard/crm/leads');

    for (const group of navGroups) {
      expect(groupButton(group.label)).toBeInTheDocument();
    }
    expect(expandedGroupIds()).toEqual(['crm-contacts']);
  });

  it('picks the group by the longest matching href, not the first', () => {
    // `/dashboard` is itself a nav entry. Matching on prefix alone makes it
    // claim every page in the admin, and the rail then reports the wrong
    // group as the one you are in.
    renderNav('/dashboard/crm/deals-hub');
    expect(expandedGroupIds()).toEqual(['crm-deals']);
  });

  it('lets a closed group be opened, and closes the one that was open', () => {
    renderNav('/dashboard/crm/leads');
    expect(groupButton('Settings').getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(groupButton('Settings'));

    expect(expandedGroupIds()).toEqual(['settings']);
    expect(hrefs()).toContain('/dashboard/settings/custom-domains');
  });

  it('lets the open group be closed again', () => {
    renderNav('/dashboard/crm/leads');
    fireEvent.click(groupButton('Leads & contacts'));
    expect(expandedGroupIds()).toEqual([]);
  });

  it('reaches every page in the model by opening groups', () => {
    renderNav('/dashboard');
    const reachable = new Set<string>();

    for (const group of navGroups) {
      // One group is already open — clicking that one shuts it, so insist on
      // the state rather than on the click.
      if (groupButton(group.label).getAttribute('aria-expanded') !== 'true') {
        fireEvent.click(groupButton(group.label));
      }
      expect(groupButton(group.label).getAttribute('aria-expanded')).toBe('true');
      for (const href of hrefs()) reachable.add(href);
    }

    const unreachable = allNavItems.map((i) => i.href).filter((h) => !reachable.has(h));
    expect(unreachable, 'a page in the model that no group will show').toEqual([]);
  });
});

describe('filtering the rail', () => {
  const filter = () => screen.getByRole('searchbox', { name: 'Filter navigation' });

  it('narrows to matching items across every section at once', () => {
    // The same word lands in both products. Making an operator guess which
    // section owns the page is the problem this rail exists to end.
    renderNav('/dashboard');
    fireEvent.change(filter(), { target: { value: 'invoice' } });

    const shown = hrefs();
    expect(shown).toContain('/dashboard/crm/invoices');
    expect(shown).toContain('/dashboard/crm/supplier-invoices');
    expect(shown).not.toContain('/dashboard/crm/leads');
  });

  it('opens the groups it matched, so no match hides behind a closed header', () => {
    renderNav('/dashboard');
    fireEvent.change(filter(), { target: { value: 'invoice' } });

    const closed = screen
      .queryAllByRole('button', { expanded: false })
      .map((b) => b.getAttribute('aria-controls'));
    expect(closed).toEqual([]);
  });

  it('finds a page by every name it has ever had', () => {
    /**
     * The merge had to pick one name per page. Someone who learned another
     * one has not learned a wrong thing and should not be left searching.
     *
     * Driven from navAliases rather than naming a pair here: an earlier
     * version asserted that searching "organisations" surfaced the page
     * labelled "Stores", and when that call was made the other way round
     * the test failed for being out of date rather than for being wrong.
     */
    renderNav('/dashboard');

    for (const alias of navAliases) {
      fireEvent.change(filter(), { target: { value: alias.alsoKnownAs } });

      const labels = screen.queryAllByRole('link').map((a) => a.getAttribute('title'));
      expect(labels, `searching "${alias.alsoKnownAs}" should surface ${alias.label}`).toContain(
        alias.label,
      );
    }
  });

  it('says so when nothing matches, rather than showing an empty rail', () => {
    renderNav('/dashboard');
    fireEvent.change(filter(), { target: { value: 'zzzz' } });

    expect(screen.getByText(/no page matches/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  it('clears back to the full rail', () => {
    renderNav('/dashboard/crm/leads');
    fireEvent.change(filter(), { target: { value: 'invoice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));

    expect(expandedGroupIds()).toEqual(['crm-contacts']);
    expect(hrefs()).toContain('/dashboard/crm/leads');
  });
});

describe('the collapsed rail', () => {
  it('shows one icon per group instead of 130, and marks where you are', () => {
    renderNav('/dashboard/crm/leads', false);

    // One per group, not one per page: a 64px column cannot label 130 icons.
    expect(screen.getAllByRole('link')).toHaveLength(navGroups.length);

    expect(screen.getByTitle('CRM — Leads & contacts').getAttribute('aria-current')).toBe('true');
    expect(screen.getByTitle('Workspace — Settings').getAttribute('aria-current')).toBeNull();
  });

  it('makes each icon a link, so the rail is reachable from a keyboard', () => {
    /**
     * These were `<div>`s, which made the collapsed rail a scrollable region
     * with nothing focusable inside it: a keyboard user could neither reach
     * it nor scroll it. axe reported `scrollable-region-focusable` on all
     * 131 pages of the admin from this one element, because it is in the
     * shell.
     *
     * It was also just wrong as a product — clicking a group's icon should
     * go to that group — which is the usual way an accessibility defect
     * turns out to be a plain defect.
     */
    renderNav('/dashboard', false);

    for (const group of navGroups) {
      const section = navSections.find((s) => s.id === group.section);
      const link = screen.getByTitle(`${section?.label} — ${group.label}`);

      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', group.items[0].href);
      expect(link).toHaveAccessibleName(`${section?.label} — ${group.label}`);
    }
  });

  it('names every group it draws, and says which section it is in', () => {
    renderNav('/dashboard', false);
    for (const group of navGroups) {
      const section = navSections.find((s) => s.id === group.section);
      expect(screen.getByTitle(`${section?.label} — ${group.label}`)).toBeInTheDocument();
    }
  });
});

describe('the rail is the same rail in both builds', () => {
  it('shows CRM and chatbot pages beside commerce ones, with no product gate', () => {
    // The two rails used to be mutually exclusive, chosen by a build flag, and
    // that is the split this merge exists to end. One admin, one navigation.
    renderNav('/dashboard');
    fireEvent.click(groupButton('Leads & contacts'));
    expect(hrefs()).toContain('/dashboard/crm/leads');

    fireEvent.click(groupButton('Automation & AI'));
    const automation = hrefs();
    expect(automation).toContain('/dashboard/flows');
    expect(automation).toContain('/dashboard/agents');

    fireEvent.click(groupButton('Orders & fulfilment'));
    expect(hrefs()).toContain('/dashboard/stylemint/orders');
  });

  it('keeps the two products’ overlapping pages in their own sections', () => {
    // Sales orders (CRM) and Orders & fulfilment (commerce) are different
    // pages against different backends. Sectioning them says which product
    // each belongs to, which the old mutually-exclusive rails never could.
    renderNav('/dashboard/stylemint/orders');
    expect(hrefs()).toContain('/dashboard/stylemint/orders');
    expect(hrefs()).not.toContain('/dashboard/crm/orders');

    fireEvent.click(groupButton('Orders & stock'));
    expect(hrefs()).toContain('/dashboard/crm/orders');
  });
});
