import { describe, expect, it } from 'vitest';
import { APP_NAME, documentTitleFor } from './document-title';
import { navGroups, navSections } from '@/app/navigation/nav-model';

/**
 * The title has one job the rest of this admin keeps failing at: saying
 * which of the two products you are in. These assertions are mostly
 * about that.
 */

/** The same `[section, group, page]` the sticky bar builds. */
function breadcrumbFor(href: string): string[] {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href !== href) continue;
      const section = navSections.find((s) => s.id === group.section)?.label ?? '';
      return [section, group.label, item.label].filter(
        (part, index, all) => part && all.indexOf(part) === index,
      );
    }
  }
  throw new Error(`${href} is not in the nav model`);
}

describe('documentTitleFor', () => {
  it('leads with the page, because tabs truncate from the right', () => {
    expect(documentTitleFor(['CRM', 'Deals & pipeline', 'Quotes'])).toBe('Quotes · CRM · Lead360');
  });

  it('tells the two "Orders" pages apart', () => {
    /**
     * The whole reason the section is in the title. These two were
     * byte-identical tabs before.
     */
    const crm = documentTitleFor(breadcrumbFor('/dashboard/crm/orders'));
    const commerce = documentTitleFor(breadcrumbFor('/dashboard/stylemint/orders'));
    expect(crm).not.toBe(commerce);
    expect(crm).toMatch(/CRM/);
    expect(commerce).toMatch(/Commerce/);
  });

  it('falls back to the app name rather than rendering an empty tab', () => {
    expect(documentTitleFor([])).toBe(APP_NAME);
    expect(documentTitleFor(['', ''])).toBe(APP_NAME);
  });

  it('does not repeat a one-part breadcrumb', () => {
    expect(documentTitleFor(['Settings'])).toBe('Settings · Lead360');
  });

  it('gives every page in the nav a title that is not just the app name', () => {
    const everyHref = navGroups.flatMap((g) => g.items.map((i) => i.href));
    expect(everyHref.length).toBeGreaterThan(100);
    for (const href of everyHref) {
      const title = documentTitleFor(breadcrumbFor(href));
      expect(title, `${href} has a bare title`).not.toBe(APP_NAME);
      expect(title.endsWith(APP_NAME), `${href} does not end with the app name`).toBe(true);
    }
  });

  it('gives pages with the same name different titles when they are in different products', () => {
    /**
     * Guards the choice to keep the section rather than the group. Drop
     * the section and all four duplicate pairs collide again.
     */
    const pairs = [
      ['/dashboard/crm/orders', '/dashboard/stylemint/orders'],
      ['/dashboard/crm/returns', '/dashboard/stylemint/returns'],
      ['/dashboard/crm/deliveries', '/dashboard/stylemint/logistics'],
      ['/dashboard/crm/vendors', '/dashboard/stylemint/vendor'],
    ];
    for (const [a, b] of pairs) {
      expect(
        documentTitleFor(breadcrumbFor(a)),
        `${a} and ${b} produce the same tab title`,
      ).not.toBe(documentTitleFor(breadcrumbFor(b)));
    }
  });
});
