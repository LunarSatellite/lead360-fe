import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Undo2 } from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  CREDIT_LIST_LIMIT,
  HeldPaymentState,
  stylemintCreditApi,
  type UnappliedPayment,
} from '../../api/stylemint-credit.api';
import { formatMoney } from '../../api/stylemint-payouts.api';
import { PURPOSE_LABEL, npr, shortId } from '../../lib/credit-console';
import { ErrorLine } from './CreditAgreementDetail';
import { Section } from './CreditBookTab';

/**
 * Payments that arrived and were not applied — paid from another account, for a different
 * amount, or for an agreement that had moved on — and returning them.
 *
 * A refund returns what ARRIVED, in full, through Payments; the buyer is notified by Payments'
 * usual refund message. The list keeps a refund under way until Payments confirms it, and a
 * refused one comes back with the provider's reason.
 */
export function CreditHeldPaymentsTab() {
  const [showRefunded, setShowRefunded] = useState(false);
  const held = useQuery({
    queryKey: ['stylemint-credit', 'unapplied', showRefunded],
    queryFn: () => stylemintCreditApi.unappliedPayments(showRefunded),
  });

  return (
    <Section
      title={showRefunded ? 'Returned to buyers — newest first' : 'Held payments — oldest first'}
      note={
        showRefunded
          ? 'Refunds Payments has confirmed.'
          : 'Refund returns what arrived, in full, to the account that paid. Payments tells the buyer.'
      }
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
        <label className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <input
            type="checkbox"
            className="accent-brand"
            checked={showRefunded}
            onChange={(event) => setShowRefunded(event.target.checked)}
          />
          Show returned payments
        </label>
      </div>

      {held.isPending && (
        <p className="flex items-center gap-2 p-6 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading…
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
          <p className="mt-3 text-sm font-bold text-text-primary">
            {showRefunded ? 'Nothing returned yet' : 'Nothing held'}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {showRefunded
              ? 'No held payment has been refunded.'
              : 'Every payment received has been applied or returned.'}
          </p>
        </div>
      )}
      {held.isSuccess && held.data.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-text-muted">
              <th className="px-3 py-2 font-bold">Held</th>
              <th className="px-3 py-2 font-bold">For</th>
              <th className="px-3 py-2 text-right font-bold">Arrived</th>
              <th className="px-3 py-2 font-bold">Why it was held</th>
              <th className="px-3 py-2 font-bold">Payment intent</th>
              <th className="px-3 py-2 text-right font-bold">Refund</th>
            </tr>
          </thead>
          <tbody>
            {held.data.map((p) => (
              <HeldPaymentRow key={p.attemptId} payment={p} />
            ))}
          </tbody>
        </table>
      )}
      {held.isSuccess && held.data.length >= CREDIT_LIST_LIMIT && (
        <p className="border-t border-border-subtle px-3 py-2 text-xs text-warning">
          Showing {held.data.length}. {showRefunded ? 'Older ones are not listed.' : 'Return these and the rest will follow.'}
        </p>
      )}
    </Section>
  );
}

/** When it became owed back: when it was held, or when its plan was reversed. */
function owedSince(p: UnappliedPayment): string | null {
  return p.reversedUtc ?? p.heldUtc;
}

/** What a refund will return: what arrived, in the currency it arrived in. */
function arrived(p: UnappliedPayment): string {
  return p.amountReceived !== null
    ? formatMoney(p.amountReceived, p.currencyReceived || p.currency)
    : formatMoney(p.amountRequested, p.currency);
}

function HeldPaymentRow({ payment: p }: { payment: UnappliedPayment }) {
  const client = useQueryClient();
  // One key per refund of this payment: a retry after a timeout is the same refund.
  const [key, setKey] = useState(() => crypto.randomUUID());

  const refund = useMutation({
    mutationFn: (note: string) => stylemintCreditApi.refundHeldPayment(p.attemptId, note, key),
    onSettled: () => client.invalidateQueries({ queryKey: ['stylemint-credit'] }),
    // A refusal holds the payment again; the next attempt is a new refund with a new key.
    onError: () => setKey(crypto.randomUUID()),
  });

  const start = async () => {
    const ok = await confirmDialog({
      title: 'Refund this payment?',
      message:
        `Return ${arrived(p)} to the account that paid, through the payment provider ` +
        `(intent ${p.paymentIntentId ?? 'unknown'}). This cannot be undone.`,
      confirmText: 'Refund',
      danger: true,
    });
    if (ok) refund.mutate('');
  };

  const requested = p.state === HeldPaymentState.RefundRequested;
  const refunded = p.state === HeldPaymentState.Refunded;

  return (
    <tr className="border-t border-border-subtle align-top">
      <td className="px-3 py-2 text-text-secondary">
        {owedSince(p) ? new Date(owedSince(p)!).toLocaleString() : '—'}
      </td>
      <td className="px-3 py-2 text-text-primary">
        {PURPOSE_LABEL[p.purpose] ?? 'Payment'}
        {p.reversedUtc && (
          <span className="ml-1.5 rounded-xs border-thin border-info/25 bg-info-soft px-1.5 py-0.5 text-[10px] font-bold text-info">
            plan reversed
          </span>
        )}
        <span className="block font-mono text-[11px] text-text-muted">
          agreement {shortId(p.agreementId)} · buyer {shortId(p.buyerAccountId)}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-bold text-text-primary">
        {arrived(p)}
        {p.amountReceived !== null && p.amountReceived !== p.amountRequested && (
          <span className="block text-[11px] font-normal text-text-muted">
            asked {npr(p.amountRequested)}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-text-secondary">
        {p.reason || '—'}
        {p.lastRefundError && !refunded && (
          <span className="mt-1 block font-bold text-danger">Last refund: {p.lastRefundError}</span>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-text-primary">{p.paymentIntentId ?? '—'}</td>
      <td className="px-3 py-2 text-right">
        {refunded ? (
          <span className="text-success" role="status">
            Refunded{p.refundedUtc ? ` ${new Date(p.refundedUtc).toLocaleDateString()}` : ''}
            {p.providerRefundId && (
              <span className="block font-mono text-[11px] text-text-muted">{p.providerRefundId}</span>
            )}
          </span>
        ) : requested ? (
          <span className="text-warning" role="status">
            Refund under way
            <span className="block text-[11px] text-text-muted">waiting for Payments to confirm</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={refund.isPending || !p.paymentIntentId}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-danger/40 px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger-soft disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" strokeWidth={1.6} />
            {refund.isPending ? 'Refunding…' : 'Refund'}
          </button>
        )}
        {refund.isError && (
          <span className="mt-1 block text-left">
            <ErrorLine message={(refund.error as Error).message} />
          </span>
        )}
      </td>
    </tr>
  );
}
