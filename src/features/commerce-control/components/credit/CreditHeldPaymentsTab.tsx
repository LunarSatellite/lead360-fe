import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { CREDIT_LIST_LIMIT, stylemintCreditApi } from '../../api/stylemint-credit.api';
import { PURPOSE_LABEL, npr, shortId } from '../../lib/credit-console';
import { ErrorLine } from './CreditAgreementDetail';
import { Section } from './CreditBookTab';

/**
 * Payments that arrived and were not applied — paid from another account, for a different
 * amount, or for an agreement that had moved on. The buyer's money is real and nothing in the
 * console returns it yet, so this list is the operator's worklist for returning each one through
 * the payment provider.
 */
export function CreditHeldPaymentsTab() {
  const held = useQuery({
    queryKey: ['stylemint-credit', 'unapplied'],
    queryFn: stylemintCreditApi.unappliedPayments,
  });

  return (
    <Section
      title="Held payments — oldest first"
      note="Return each one through the payment provider using its intent id. There is no refund action in the console yet."
    >
      {held.isPending && (
        <p className="flex items-center gap-2 p-6 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading held payments…
        </p>
      )}
      {held.isError && (
        <div className="p-4">
          <ErrorLine message={(held.error as Error).message} />
        </div>
      )}
      {held.isSuccess && held.data.length === 0 && (
        <div className="p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success" strokeWidth={1.6} />
          <p className="mt-3 text-sm font-bold text-text-primary">Nothing held</p>
          <p className="mt-1 text-xs text-text-muted">Every payment received has been applied.</p>
        </div>
      )}
      {held.isSuccess && held.data.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-text-muted">
              <th className="px-3 py-2 font-bold">Held</th>
              <th className="px-3 py-2 font-bold">For</th>
              <th className="px-3 py-2 text-right font-bold">Asked for</th>
              <th className="px-3 py-2 font-bold">Why it was held</th>
              <th className="px-3 py-2 font-bold">Payment intent</th>
            </tr>
          </thead>
          <tbody>
            {held.data.map((p) => (
              <tr key={p.attemptId} className="border-t border-border-subtle align-top">
                <td className="px-3 py-2 text-text-secondary">
                  {p.heldUtc ? new Date(p.heldUtc).toLocaleString() : '—'}
                </td>
                <td className="px-3 py-2 text-text-primary">
                  {PURPOSE_LABEL[p.purpose] ?? 'Payment'}
                  <span className="block font-mono text-[11px] text-text-muted">
                    agreement {shortId(p.agreementId)} · buyer {shortId(p.buyerAccountId)}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-bold text-text-primary">
                  {npr(p.amountRequested)}
                </td>
                <td className="px-3 py-2 text-text-secondary">{p.reason || '—'}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-text-primary">
                  {p.paymentIntentId ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {held.isSuccess && held.data.length >= CREDIT_LIST_LIMIT && (
        <p className="border-t border-border-subtle px-3 py-2 text-xs text-warning">
          Showing the oldest {held.data.length}. Return these and the rest will follow.
        </p>
      )}
    </Section>
  );
}
