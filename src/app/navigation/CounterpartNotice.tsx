import { ArrowRight, GitCompareArrows } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { counterpartOf } from './nav-model';

/**
 * Four page names appear twice in this admin, and that is the confusion.
 *
 * "Orders" is in the sidebar under CRM and again under Commerce. So are
 * Returns, Deliveries/Logistics and Vendors. Merging the nav on href
 * rather than label is what surfaced them, but merging cannot remove
 * them: the two sides read genuinely different objects out of different
 * backends. CRM orders are sales orders raised against an account and a
 * deal; Stylemint orders are sub-orders from the Kin Marche storefront.
 * Collapsing them would lose data rather than clean anything up.
 *
 * What was actually wrong was not that both exist — it is that neither
 * page said which one it was, or that the other one existed. Someone
 * arriving on "Orders" from the sidebar had no way to tell they were in
 * the wrong place and no way to find the right one.
 *
 * So each of the eight states what it holds and links to its opposite
 * number. The pairing comes from `navCounterparts`, so a pair added
 * there is covered here; and this renders from the layout rather than
 * from eight pages, so it cannot be forgotten on one of them.
 */

/** What each side actually reads, taken from its API calls, not invented. */
const WHAT_THIS_PAGE_HOLDS: Record<string, string> = {
  '/dashboard/crm/orders': 'Sales orders raised in the CRM against an account and a deal.',
  '/dashboard/stylemint/orders': 'Sub-orders placed by shoppers in the Kin Marche marketplace.',

  '/dashboard/crm/returns': 'Returns recorded against a CRM sales order.',
  '/dashboard/stylemint/returns': 'The marketplace support queue for shopper return requests.',

  '/dashboard/crm/deliveries': 'Delivery records attached to CRM sales orders.',
  '/dashboard/stylemint/logistics':
    'Courier dispatch, routing and delivery guardian for marketplace parcels.',

  '/dashboard/crm/vendors':
    'Suppliers you buy from — purchase orders, goods receipts, supplier invoices.',
  '/dashboard/stylemint/vendor':
    'Marketplace vendors who sell on Kin Marche — their stores, products and payouts.',
};

export function productOf(href: string): 'CRM' | 'Stylemint' | undefined {
  if (href.startsWith('/dashboard/crm/')) return 'CRM';
  if (href.startsWith('/dashboard/stylemint/')) return 'Stylemint';
  return undefined;
}

export function CounterpartNotice() {
  const { pathname } = useLocation();
  const counterpart = counterpartOf(pathname);
  if (!counterpart) return null;

  const here = WHAT_THIS_PAGE_HOLDS[pathname];
  const there = WHAT_THIS_PAGE_HOLDS[counterpart.href];
  const thereProduct = productOf(counterpart.href);
  if (!here || !thereProduct) return null;

  return (
    <aside
      aria-label="This page has a similarly named counterpart"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 text-xs lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex min-w-0 items-start gap-2">
        <GitCompareArrows className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
        <p className="min-w-0 text-text-secondary">
          {here}{' '}
          <span className="text-text-muted">
            {thereProduct} has its own “{counterpart.label}”
            {there ? `: ${there.charAt(0).toLowerCase()}${there.slice(1)}` : '.'}
          </span>
        </p>
      </div>
      <Link
        to={counterpart.href}
        className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-brand/30 px-3 py-1.5 font-bold text-brand hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:self-auto"
      >
        Go to {thereProduct} {counterpart.label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </aside>
  );
}
