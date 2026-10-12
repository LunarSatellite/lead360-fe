import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CounterpartNotice, productOf } from './CounterpartNotice';
import { counterpartOf, navCounterparts } from './nav-model';

/**
 * The duplicate-name problem, held shut.
 *
 * Four page names exist twice — Orders, Returns, Deliveries/Logistics and
 * Vendors — because the CRM and the marketplace keep genuinely different
 * objects under the same words. That cannot be fixed by deleting one of
 * each; it is fixed by each page saying which one it is.
 *
 * The risk this guards is drift: a fifth pair added to `navCounterparts`
 * with no description written for it would render nothing at all, and the
 * nav would be back to two identically named entries explaining nothing.
 */

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CounterpartNotice />
    </MemoryRouter>,
  );
}

describe('CounterpartNotice', () => {
  it('covers both sides of every counterpart pair', () => {
    expect(navCounterparts.length).toBeGreaterThan(0);
    for (const href of navCounterparts.flat()) {
      const { container, unmount } = at(href);
      expect(container.textContent, `${href} has no description`).toBeTruthy();
      expect(
        container.querySelector('a[href]'),
        `${href} does not link to its counterpart`,
      ).toBeTruthy();
      unmount();
    }
  });

  it('links each page to the other side of its own pair', () => {
    for (const [a, b] of navCounterparts) {
      const { container, unmount } = at(a);
      expect(container.querySelector('a')?.getAttribute('href')).toBe(b);
      unmount();

      const second = at(b);
      expect(second.container.querySelector('a')?.getAttribute('href')).toBe(a);
      second.unmount();
    }
  });

  it('names the other product, so the two are told apart', () => {
    at('/dashboard/crm/orders');
    expect(screen.getByText(/Sales orders raised in the CRM/)).toBeTruthy();
    expect(screen.getByRole('link').textContent).toMatch(/Stylemint/);
  });

  it('says nothing on a page that has no counterpart', () => {
    const { container } = at('/dashboard/crm/quotes');
    expect(container.textContent).toBe('');
  });

  it('knows which product a path belongs to', () => {
    expect(productOf('/dashboard/crm/orders')).toBe('CRM');
    expect(productOf('/dashboard/stylemint/orders')).toBe('Stylemint');
    expect(productOf('/dashboard/settings')).toBeUndefined();
  });

  it('agrees with the nav model about what pairs with what', () => {
    /** If these ever disagree the notice would point somewhere wrong. */
    for (const [a, b] of navCounterparts) {
      expect(counterpartOf(a)?.href).toBe(b);
      expect(counterpartOf(b)?.href).toBe(a);
    }
  });
});
