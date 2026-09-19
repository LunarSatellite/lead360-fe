import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPinOff,
  RefreshCw,
  Search,
  Store,
  X,
} from 'lucide-react';
import {
  stylemintFulfillmentApi,
  type VendorSubOrderRow,
} from '../api/stylemint-fulfillment.api';
import {
  collectionDestination,
  counterReference,
  FulfillmentChannel,
  HANDOVER_CONSEQUENCES,
  handoverReadiness,
  SUB_ORDER_STATE_LABEL,
  type HandoverOutcome,
} from '../lib/counter-handover';

/**
 * Recording a counter handover from the operations console.
 *
 * In-store collection shipped with a mobile client for the seller and nothing
 * for the operator, so a store that rang the desk could not have the handover
 * recorded for them. The only workaround wrote down a courier journey that
 * never happened.
 *
 * Three things this screen is careful about, all of them places where an
 * earlier client invented something:
 *
 *  - the confirmation NAMES the consequences rather than asking "are you
 *    sure?" — this completes the order, opens the return window and releases
 *    the seller's earnings, and cannot be undone from here;
 *  - a delivery sub-order shows the refusal, it does not hide the control;
 *  - an absent counter renders as absent. Never "Store", never the seller.
 */

const COLLECTION_FILTERS: { label: string; state?: number }[] = [
  { label: 'Awaiting collection' },
  { label: 'Paid', state: 2 },
  { label: 'Accepted', state: 12 },
  { label: 'Packed', state: 13 },
  { label: 'Completed', state: 7 },
];

/** The pre-handover states a collection order sits in while it waits at a counter. */
const AWAITING = new Set([2, 3, 12, 13, 4, 5]);

function formatInstant(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString();
}

export function CounterHandoverPage() {
  const client = useQueryClient();
  const [filter, setFilter] = useState(0);
  const [selected, setSelected] = useState<VendorSubOrderRow | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<HandoverOutcome | null>(null);
  const [lookupDraft, setLookupDraft] = useState('');
  const [lookupId, setLookupId] = useState('');

  const queue = useQuery({
    queryKey: ['stylemint-collection-queue', filter],
    queryFn: () => stylemintFulfillmentApi.subOrders({ state: COLLECTION_FILTERS[filter].state }),
  });

  /**
   * The queue lists collection orders only, so a delivery sub-order would never
   * appear in it — and an operator who was told a handover was needed would be
   * left with a control that simply is not there. The lookup is the honest
   * answer: ask about any sub-order by id and the screen says what it is and,
   * when the action does not apply, why.
   */
  const lookup = useQuery({
    queryKey: ['stylemint-sub-order', lookupId],
    queryFn: () => stylemintFulfillmentApi.subOrder(lookupId),
    enabled: lookupId.length > 0,
  });

  const looked = lookup.data;
  useEffect(() => {
    if (!looked) return;
    setSelected(looked);
    setOutcome(null);
  }, [looked]);

  const rows = useMemo(() => {
    const items = queue.data?.items ?? [];
    const collection = items.filter(
      (row) => row.fulfillmentChannel === FulfillmentChannel.StorePickup,
    );
    return COLLECTION_FILTERS[filter].state === undefined
      ? collection.filter((row) => AWAITING.has(row.state) && !row.collectedUtc)
      : collection;
  }, [queue.data, filter]);

  const record = useMutation({
    mutationFn: (subOrderId: string) => stylemintFulfillmentApi.markCollected(subOrderId),
    onSuccess: async (result) => {
      setOutcome(result);
      setConfirming(false);
      if (result.kind === 'completed') {
        await client.invalidateQueries({ queryKey: ['stylemint-collection-queue'] });
        setSelected(null);
      }
    },
    onError: (error: Error) =>
      setOutcome({ kind: 'failed', message: error.message }),
  });

  const readiness = selected ? handoverReadiness(selected) : null;
  const counter = selected ? counterReference(selected.fulfillmentLocationId) : null;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <Store className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Counter handover
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Records that a buyer walked in and took the goods on a collection order. This is the
            operator twin of the seller&apos;s in-store action — it completes the order rather than
            walking it through a courier journey that never happened.
          </p>
        </div>
        <button
          onClick={() => queue.refetch()}
          className="flex items-center gap-2 self-start rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${queue.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COLLECTION_FILTERS.map((option, index) => (
          <button
            key={option.label}
            onClick={() => {
              setFilter(index);
              setSelected(null);
              setOutcome(null);
            }}
            className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
              filter === index
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setLookupId(lookupDraft.trim());
          setOutcome(null);
        }}
        className="flex flex-wrap items-center gap-2 rounded-frame border-thin border-border-subtle bg-bg-card p-3"
      >
        <label
          htmlFor="counter-handover-lookup"
          className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-text-muted"
        >
          Look up a sub-order
        </label>
        <input
          id="counter-handover-lookup"
          value={lookupDraft}
          onChange={(event) => setLookupDraft(event.target.value)}
          placeholder="Sub-order id"
          className="min-w-[19rem] flex-1 rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1"
        />
        <button
          type="submit"
          className="flex items-center gap-2 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.6} />
          Open
        </button>
        <p className="w-full text-xs text-text-muted">
          The queue lists collection orders only. Look one up by id to see what it is — a delivery
          sub-order will say why a counter handover is refused on it.
        </p>
      </form>

      {lookup.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(lookup.error as Error).message}</p>
        </div>
      )}

      {queue.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(queue.error as Error).message}</p>
        </div>
      )}

      {/* Outside the detail panel on purpose: a completed handover clears the
          selection, and the operator must still be told what happened. */}
      {outcome && (
        <div
          className={`flex items-start gap-3 rounded-frame border-thin p-4 ${
            outcome.kind === 'completed'
              ? 'border-emerald-400/25 bg-emerald-400/5'
              : 'border-rose-400/25 bg-rose-400/5'
          }`}
        >
          {outcome.kind === 'completed' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" strokeWidth={1.6} />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          )}
          <p className="text-sm text-text-secondary">
            {outcome.kind === 'completed'
              ? `Handover recorded${
                  formatInstant(outcome.collectedUtc)
                    ? ` at ${formatInstant(outcome.collectedUtc)}`
                    : ''
                }. The order is complete and the return window has started.`
              : outcome.message}
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2">
          {queue.isLoading ? (
            <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
              Loading collection orders…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
              <Store className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
              <p className="mt-3 text-sm text-text-secondary">
                No collection sub-orders in this view.
              </p>
            </div>
          ) : (
            rows.map((row) => (
              <button
                key={row.id}
                onClick={() => {
                  setSelected(row);
                  setOutcome(null);
                }}
                className={`flex w-full items-center justify-between gap-4 rounded-frame border-thin px-4 py-3 text-left ${
                  selected?.id === row.id
                    ? 'border-border-glow bg-brand-soft'
                    : 'border-border-subtle bg-bg-card hover:bg-glass-2'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-primary">{row.orderNumber}</p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {row.receiverName} · {row.itemCount} item{row.itemCount === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="shrink-0 rounded-sm border-thin border-border-subtle px-2 py-1 text-[11px] font-bold text-text-secondary">
                  {SUB_ORDER_STATE_LABEL[row.state] ?? `State ${row.state}`}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="space-y-3">
          {!selected ? (
            <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-center text-sm text-text-muted">
              Pick a collection sub-order to record its handover.
            </div>
          ) : (
            <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
              <div>
                <p className="text-sm font-bold text-text-primary">{selected.orderNumber}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {SUB_ORDER_STATE_LABEL[selected.state] ?? `State ${selected.state}`} ·{' '}
                  {selected.itemCount} item{selected.itemCount === 1 ? '' : 's'}
                </p>
              </div>

              {/* The counter, or its absence. Never a stand-in. */}
              <div className="rounded-card border-thin border-border-subtle bg-glass-2 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-text-muted">
                  Collection counter
                </p>
                {counter ? (
                  <p className="mt-1 break-all font-mono text-xs text-text-secondary">{counter}</p>
                ) : (
                  <p className="mt-1 flex items-start gap-2 text-xs text-text-muted">
                    <MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
                    <span>
                      Not recorded. This order names no collection point, so the counter is
                      unknown.
                    </span>
                  </p>
                )}
              </div>

              {/* A collection order has no destination, and this says so instead of
                  formatting an empty snapshot into a place. */}
              {collectionDestination(selected) === null && (
                <p className="text-xs text-text-muted">
                  No delivery address — nothing is shipped on a collection order, so none was
                  recorded.
                </p>
              )}

              {readiness?.kind === 'refused' && (
                <div className="flex items-start gap-3 rounded-card border-thin border-amber-400/25 bg-amber-400/5 p-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
                    strokeWidth={1.6}
                  />
                  <p className="text-xs text-text-secondary">{readiness.reason}</p>
                </div>
              )}

              {readiness?.kind === 'wrongState' && (
                <div className="flex items-start gap-3 rounded-card border-thin border-amber-400/25 bg-amber-400/5 p-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
                    strokeWidth={1.6}
                  />
                  <p className="text-xs text-text-secondary">{readiness.reason}</p>
                </div>
              )}

              {readiness?.kind === 'alreadyCollected' && (
                <div className="flex items-start gap-3 rounded-card border-thin border-emerald-400/25 bg-emerald-400/5 p-3">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                    strokeWidth={1.6}
                  />
                  <p className="text-xs text-text-secondary">
                    Already handed over
                    {formatInstant(readiness.collectedUtc)
                      ? ` on ${formatInstant(readiness.collectedUtc)}`
                      : ''}
                    .
                  </p>
                </div>
              )}

              {readiness?.kind === 'ready' && (
                <button
                  onClick={() => {
                    setConfirming(true);
                    setOutcome(null);
                  }}
                  className="w-full rounded-card border-thin border-border-glow bg-brand-soft px-3 py-2 text-xs font-bold text-brand hover:bg-glass-2"
                >
                  Record counter handover
                </button>
              )}

            </div>
          )}
        </div>
      </div>

      {confirming && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-frame border-thin border-border-subtle bg-bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-black tracking-tight text-text-primary">
                Record the counter handover for {selected.orderNumber}?
              </h2>
              <button
                onClick={() => setConfirming(false)}
                className="text-text-muted hover:text-text-primary"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </div>

            <p className="text-xs text-text-secondary">This does four things:</p>
            <ul className="space-y-2">
              {HANDOVER_CONSEQUENCES.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-xs text-text-secondary"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-text-muted">
              {counter
                ? `Counter on this order: ${counter}.`
                : 'This order names no collection counter, so none is recorded against the handover.'}
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={() => record.mutate(selected.id)}
                disabled={record.isPending}
                className="flex items-center gap-2 rounded-card border-thin border-border-glow bg-brand-soft px-3 py-2 text-xs font-bold text-brand disabled:opacity-60"
              >
                {record.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
                )}
                Complete the order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { CounterHandoverPage as Component };
