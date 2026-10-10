import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import {
  RefundPaymentState,
  stylemintCreditApi,
  type CreditRefund,
  type CreditRefundPayment,
} from '../../api/stylemint-credit.api';
import { npr, shortId } from '../../lib/credit-console';

/**
 * The partial refunds made on a plan — made from the order's refund screen — and where each part
 * stands with Payments. A part the provider refused can be tried again here, after checking with
 * them; one the plan's reversal returned instead cannot.
 */
export function CreditPlanRefunds({ agreementId }: { agreementId: string }) {
  const refunds = useQuery({
    queryKey: ['stylemint-credit', 'refunds', agreementId],
    queryFn: () => stylemintCreditApi.refunds(agreementId),
  });

  if (!refunds.data || refunds.data.length === 0) return null;
  return (
    <div className="mt-5">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Partial refunds</h4>
      <ul className="mt-1.5 space-y-2">
        {refunds.data.map((r) => (
          <RefundItem key={r.id} refund={r} />
        ))}
      </ul>
    </div>
  );
}

function RefundItem({ refund: r }: { refund: CreditRefund }) {
  return (
    <li className="rounded-card border-thin border-border-subtle bg-glass-1 p-3 text-xs">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold text-text-primary">{npr(r.amount)}</span>
        <span className="text-text-muted">{new Date(r.requestedUtc).toLocaleString()}</span>
      </div>
      <p className="mt-0.5 text-text-secondary">{r.reason}</p>
      <p className="mt-1 text-text-muted">
        {npr(r.credited)} off what was owed · {npr(r.cash)} back to the buyer · {npr(r.vendorClawback)} from the seller
      </p>
      {r.payments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {r.payments.map((p) => (
            <RefundPart key={p.id} part={p} />
          ))}
        </ul>
      )}
    </li>
  );
}

const PART_LABEL: Record<number, string> = {
  [RefundPaymentState.Requested]: 'Sent to Payments',
  [RefundPaymentState.Pending]: 'Waiting for the provider',
  [RefundPaymentState.Completed]: 'Returned',
  [RefundPaymentState.Failed]: 'Did not go through',
};

function RefundPart({ part: p }: { part: CreditRefundPayment }) {
  const client = useQueryClient();
  // One key per retry the operator means to make; a timeout retried is the same retry.
  const [key] = useState(() => crypto.randomUUID());
  const retry = useMutation({
    mutationFn: () => stylemintCreditApi.retryRefundPayment(p.id, key),
    onSettled: () => client.invalidateQueries({ queryKey: ['stylemint-credit'] }),
  });

  const failed = p.state === RefundPaymentState.Failed;
  const tone =
    p.state === RefundPaymentState.Completed ? 'text-success' : failed ? 'text-danger' : 'text-warning';

  return (
    <li className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="font-bold text-text-primary">{npr(p.amount)}</span>{' '}
        <span className="font-mono text-[11px] text-text-muted">intent {shortId(p.paymentIntentId)}</span>
        <span className={`block ${tone}`}>
          {p.supersededUtc ? 'Returned with the plan’s reversal instead' : PART_LABEL[p.state] ?? 'Unknown'}
        </span>
        {failed && p.lastError && !p.supersededUtc && <span className="block text-danger">{p.lastError}</span>}
        {retry.isError && <span className="block text-danger">{(retry.error as Error).message}</span>}
      </span>
      {failed && !p.supersededUtc && (
        <button
          type="button"
          onClick={() => retry.mutate()}
          disabled={retry.isPending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border-thin border-border-medium px-2.5 py-1 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.6} />
          {retry.isPending ? 'Trying…' : 'Try again'}
        </button>
      )}
    </li>
  );
}
