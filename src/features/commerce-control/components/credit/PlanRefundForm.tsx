import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { stylemintCreditApi } from '../../api/stylemint-credit.api';
import { npr } from '../../lib/credit-console';
import { ErrorLine } from './CreditAgreementDetail';

/**
 * Refunding part of a plan order's price while the buyer keeps the item — the order refund screen,
 * for an order a payment plan pays for. Such an order has no single payment to refund: the plan
 * collected it in several, and decides how a refund splits. So the operator names an amount and a
 * reason, sees the server's quote of what it will do, and confirms it.
 */
export function PlanRefundForm({
  agreementId,
  orderNumber,
  onDone,
}: {
  agreementId: string;
  orderNumber: string;
  onDone: () => void;
}) {
  const client = useQueryClient();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  // One key per refund the operator means to make: a retry after a timeout with the same amount
  // and reason is the same refund, answered from the first; changing either is a new one.
  const [key, setKey] = useState(() => crypto.randomUUID());

  const value = Number(amount);
  const entered = amount.trim() !== '' && Number.isFinite(value) && value > 0;
  const settled = useDebounce(value, 350);

  const most = useQuery({
    queryKey: ['stylemint-credit', 'refund-quote', agreementId, 0],
    queryFn: () => stylemintCreditApi.refundQuote(agreementId, 0),
    retry: false,
  });
  const maximum = most.data?.maxAmount ?? 0;
  const withinMost = entered && value <= maximum;

  const quote = useQuery({
    queryKey: ['stylemint-credit', 'refund-quote', agreementId, settled],
    queryFn: () => stylemintCreditApi.refundQuote(agreementId, settled),
    enabled: withinMost && settled === value,
    retry: false,
  });

  const refund = useMutation({
    mutationFn: () => stylemintCreditApi.refundPlan(agreementId, value, reason, key),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['stylemint-credit'] });
      onDone();
    },
  });

  const change = (next: () => void) => {
    next();
    setConfirmed(false);
    setKey(crypto.randomUUID());
  };

  const ready =
    withinMost && reason.trim().length > 0 && confirmed && !!quote.data && quote.data.amount === value && !refund.isPending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) refund.mutate();
      }}
      className="mt-4 space-y-3"
    >
      <p className="text-xs leading-5 text-text-muted">
        A payment plan pays for this order. A refund here comes off what the buyer still owes first; only the rest goes
        back to them. The seller bears all of it.
      </p>

      {most.isLoading && <p className="text-xs text-text-muted">Checking the plan…</p>}
      {most.isError && <ErrorLine message={(most.error as Error).message} />}
      {most.data && (
        <p className="text-xs text-text-secondary">
          Order {orderNumber} · up to <strong className="text-text-primary">{npr(maximum)}</strong> can be refunded
          {most.data.priceReduced > 0 ? ` (${npr(most.data.priceReduced)} already refunded)` : ''}.
        </p>
      )}

      {most.data && maximum > 0 && (
        <>
          <label className="block text-xs font-semibold text-text-secondary">
            Amount to refund (NPR)
            <input
              aria-label="Amount to refund"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(event) => change(() => setAmount(event.target.value))}
              className="mt-1 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary focus:border-border-glow focus:bg-glass-1"
            />
          </label>
          {entered && value > maximum && (
            <p className="text-xs font-semibold text-danger">At most {npr(maximum)} can be refunded now.</p>
          )}
          <label className="block text-xs font-semibold text-text-secondary">
            Why
            <textarea
              aria-label="Why"
              value={reason}
              maxLength={500}
              onChange={(event) => change(() => setReason(event.target.value))}
              placeholder="Arrived scratched — ticket #"
              className="mt-1 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1"
            />
          </label>
        </>
      )}

      {quote.isError && <ErrorLine message={(quote.error as Error).message} />}
      {quote.data && quote.data.amount === value && (
        <dl className="space-y-1 rounded-card border-thin border-border-subtle bg-glass-1 p-3 text-xs" aria-label="What this refund does">
          <Row label="Off what the buyer still owes" value={npr(quote.data.credited)} />
          <Row
            label={`Back to the buyer${quote.data.payments.length > 1 ? `, across ${quote.data.payments.length} payments` : ''}`}
            value={npr(quote.data.cash)}
          />
          <Row label="Taken back from the seller's earnings" value={npr(quote.data.vendorClawback)} />
        </dl>
      )}

      {quote.data && quote.data.amount === value && (
        <label className="flex items-start gap-3 rounded-card border-thin border-danger/20 bg-danger-soft p-3 text-xs leading-5 text-text-secondary">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            Refund <strong>{npr(value)}</strong> on order <strong>{orderNumber}</strong>. Money goes back to the buyer and
            is taken from the seller; this cannot be undone.
          </span>
        </label>
      )}

      {refund.isError && <ErrorLine message={(refund.error as Error).message} />}
      <button
        type="submit"
        disabled={!ready}
        className="flex w-full items-center justify-center gap-2 rounded-sm bg-brand py-2.5 text-sm font-extrabold text-bg hover:bg-brand-light disabled:opacity-40"
      >
        {refund.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />} Refund part of the price
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-bold text-text-primary">{value}</dd>
    </div>
  );
}
