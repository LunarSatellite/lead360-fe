/**
 * Every page in this admin was called "Lead360".
 *
 * All 131 of them served the `<title>` out of index.html and nothing ever
 * changed it, so an operator with the pipeline, an invoice and a vendor
 * open had three identical tabs, a history list of 131 entries reading
 * "Lead360", and bookmarks that all had to be renamed by hand.
 *
 * It is also an accessibility defect, and one axe cannot see: WCAG 2.4.2
 * asks for a title that describes the page, and a title does exist — it
 * is simply the same one everywhere. In a single-page app the practical
 * consequence is worse than a bad label, because changing route updates
 * no title and therefore announces nothing. A screen reader user clicks
 * "Invoices" and is told nothing happened.
 *
 * The title is built from the same breadcrumb the sticky bar shows, so
 * the tab and the page cannot disagree, and it names the product because
 * naming the product is the whole point here: "Orders & fulfilment ·
 * Commerce" and "Sales orders · CRM" are two tabs a person can tell
 * apart, where "Lead360" and "Lead360" are not.
 */

export const APP_NAME = 'Lead360';

/**
 * `[section, group, page]` from the nav model, most specific last — the
 * same array the breadcrumb renders.
 *
 * Browsers truncate tabs from the right, so the page name goes first:
 * the part that is still readable at 120px is the part that identifies
 * the tab. The section follows, because telling CRM "Orders" from
 * Commerce "Orders" is exactly the confusion this admin has. The group
 * in the middle ("Deals & pipeline") is dropped — it is the least
 * distinguishing of the three and the first thing to cost a reader.
 */
export function documentTitleFor(breadcrumb: readonly string[]): string {
  const parts = breadcrumb.filter(Boolean);
  if (!parts.length) return APP_NAME;

  const page = parts[parts.length - 1];
  const section = parts.length > 1 ? parts[0] : undefined;

  return [page, section, APP_NAME].filter(Boolean).join(' · ');
}
