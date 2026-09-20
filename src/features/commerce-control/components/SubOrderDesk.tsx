import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckSquare,
  Loader2,
  PackageCheck,
  Printer,
  RefreshCw,
  Square,
  Truck,
} from 'lucide-react';
import {
  availableSteps,
  REJECTION_REASON_LABEL,
  SUB_ORDER_STATE_LABEL,
  stylemintSubOrdersApi,
  SubOrderState,
  VendorRejectionReason,
  type SubOrderStep,
  type VendorRejectionReasonValue,
  type VendorSubOrder,
} from '../api/stylemint-suborders.api';
import { PackingSlipSheet } from './PackingSlipSheet';

/**
 * The fulfilment desk: the sub-orders waiting on a vendor step, and the step itself.
 *
 * It sits with delivery operations because it is the same job seen one stage earlier — the stuck
 * queue is what happens after a handover goes wrong, and this is where the handover is made.
 *
 * Only the steps the backend will actually accept from a row's current state are offered. A
 * button that is guaranteed to 409 teaches an operator to ignore errors, which is worse than no
 * button at all.
 *
 * Bulk accept and bulk ready-to-ship act on the selected rows, and are enabled only when every
 * selected row is in a state that step is legal from — a partial bulk would half-succeed and
 * leave the operator guessing which half.
 */

/**
 * The states worth filtering to, in the order work flows through them.
 *
 * Every state `availableSteps` offers an action from has a chip here. That is the rule, not a
 * convenience: a queue exists to show what is waiting, so a state with a pending step and no way
 * to filter to it is work an operator can only find by scrolling "All". Setting tracking sends an
 * order to Shipped, and Shipped is where the in-transit step is taken — both were missing, so an
 * order handed to a courier fell out of the chips entirely.
 */
const FILTERS: Array<{ label: string; state?: number }> = [
  { label: 'All' },
  { label: 'Paid', state: SubOrderState.Paid },
  { label: 'Awaiting fulfilment', state: SubOrderState.AwaitingFulfillment },
  { label: 'Accepted', state: SubOrderState.Accepted },
  { label: 'Packed', state: SubOrderState.Packed },
  { label: 'Ready to ship', state: SubOrderState.ReadyToShip },
  { label: 'Awaiting tracking', state: SubOrderState.AwaitingTracking },
  { label: 'Shipped', state: SubOrderState.Shipped },
  { label: 'Handed over', state: SubOrderState.HandedOver },
  { label: 'In transit', state: SubOrderState.InTransit },
  { label: 'Out for delivery', state: SubOrderState.OutForDelivery },
  { label: 'Delivered', state: SubOrderState.Delivered },
];

export function SubOrderDesk() {
  const client = useQueryClient();
  const [state, setState] = useState<number | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Null means the sheet is closed. Opening it is what triggers the fetch, so the slips are
  // never loaded for rows nobody asked to print.
  const [printing, setPrinting] = useState<string[] | null>(null);

  const queue = useQuery({
    queryKey: ['stylemint-sub-orders', state],
    queryFn: () => stylemintSubOrdersApi.list({ state, pageSize: 50 }),
    retry: false,
  });

  const items = queue.data?.items ?? [];

  const refresh = () => {
    setSelected(new Set());
    client.invalidateQueries({ queryKey: ['stylemint-sub-orders'] });
  };

  const report = (caught: unknown, fallback: string) => {
    setNotice(null);
    setError(caught instanceof Error ? describe(caught) : fallback);
  };

  const bulk = useMutation({
    mutationFn: ({ step }: { step: 'accept' | 'readyToShip' }) => {
      const ids = [...selected];
      return step === 'accept'
        ? stylemintSubOrdersApi.bulkAccept(ids)
        : stylemintSubOrdersApi.bulkReadyToShip(ids);
    },
    onSuccess: (_result, { step }) => {
      setError(null);
      setNotice(
        `${selected.size} ${selected.size === 1 ? 'sub-order' : 'sub-orders'} moved to ${
          step === 'accept' ? 'accepted' : 'ready to ship'
        }.`,
      );
      refresh();
    },
    onError: (caught) => report(caught, 'The bulk step could not be applied.'),
  });

  const slips = useQuery({
    queryKey: ['stylemint-packing-slips', printing],
    queryFn: async () => {
      const ids = printing!;
      // One id still goes through the single read: it returns the slip directly, where the bulk
      // endpoint wraps it in a per-item envelope this would then have to unwrap for no reason.
      if (ids.length === 1) {
        const slip = await stylemintSubOrdersApi.packingSlip(ids[0]);
        return { slips: [slip], failures: [] as Array<{ index: number; message: string }> };
      }

      const result = await stylemintSubOrdersApi.bulkPackingSlips(ids);
      return {
        slips: result.items.flatMap((item) => (item.success && item.value ? [item.value] : [])),
        // A refused id is reported, not silently dropped: printing four slips for five selected
        // parcels is how a parcel ships without one.
        failures: result.items
          .filter((item) => !item.success)
          .map((item) => ({
            index: item.index,
            message: item.errorMessage ?? item.errorCode ?? 'No slip was returned.',
          })),
      };
    },
    enabled: printing !== null,
    retry: false,
  });

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // A bulk step is only offered when every selected row can actually take it.
  const selectedRows = items.filter((row) => selected.has(row.id));
  const canBulkAccept =
    selectedRows.length > 0 &&
    selectedRows.every(
      (row) =>
        row.state === SubOrderState.Paid || row.state === SubOrderState.AwaitingFulfillment,
    );
  const canBulkReadyToShip =
    selectedRows.length > 0 && selectedRows.every((row) => row.state === SubOrderState.Packed);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => {
                setState(filter.state);
                setSelected(new Set());
              }}
              className={`rounded-sm border-thin px-2.5 py-1 text-[11px] font-bold ${
                state === filter.state
                  ? 'border-border-glow bg-brand-soft text-brand'
                  : 'border-border-subtle text-text-secondary hover:bg-glass-2'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => queue.refetch()}
          className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3 w-3 ${queue.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border-thin border-border-glow bg-brand-soft p-2.5">
          <span className="text-[11px] font-bold text-brand">
            {selected.size} selected
          </span>
          <button
            disabled={!canBulkAccept || bulk.isPending}
            onClick={() => bulk.mutate({ step: 'accept' })}
            className="rounded-sm bg-brand px-2.5 py-1 text-[11px] font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            Accept all
          </button>
          <button
            disabled={!canBulkReadyToShip || bulk.isPending}
            onClick={() => bulk.mutate({ step: 'readyToShip' })}
            className="rounded-sm bg-brand px-2.5 py-1 text-[11px] font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            Ready to ship all
          </button>
          {/* A read, so unlike the bulk steps it applies to any selection whatever state the
              rows are in — an operator printing a run of slips does not sort them first. */}
          <button
            onClick={() => setPrinting([...selected])}
            className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
          >
            <Printer className="h-3 w-3" strokeWidth={1.6} /> Packing slips
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
          >
            Clear
          </button>
          {!canBulkAccept && !canBulkReadyToShip && (
            <span className="text-[11px] text-text-muted">
              The selected rows are not all in one state, so no bulk step applies to all of them.
            </span>
          )}
        </div>
      )}

      {error && <Banner tone="error" message={error} />}
      {notice && <Banner tone="ok" message={notice} />}

      {queue.isError ? (
        <Banner tone="error" message={describe(queue.error)} />
      ) : queue.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading sub-orders…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <PackageCheck className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            Nothing is waiting in this state.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((row) => (
            <SubOrderRow
              key={row.id}
              row={row}
              selected={selected.has(row.id)}
              onToggle={() => toggle(row.id)}
              onDone={(message) => {
                setError(null);
                setNotice(message);
                refresh();
              }}
              onError={(caught) => report(caught, 'The step could not be applied.')}
              onPrint={() => setPrinting([row.id])}
            />
          ))}
        </div>
      )}

      {printing && (
        <PackingSlipSheet
          slips={slips.data?.slips ?? []}
          failures={slips.data?.failures ?? []}
          loading={slips.isLoading}
          error={slips.isError ? describe(slips.error) : null}
          onClose={() => setPrinting(null)}
        />
      )}
    </div>
  );
}

function SubOrderRow({
  row,
  selected,
  onToggle,
  onDone,
  onError,
  onPrint,
}: {
  row: VendorSubOrder;
  selected: boolean;
  onToggle: () => void;
  onDone: (message: string) => void;
  onError: (caught: unknown) => void;
  onPrint: () => void;
}) {
  // Reject, handover and tracking each need input, so the row expands rather than acting at once.
  const [form, setForm] = useState<'reject' | 'handover' | 'tracking' | null>(null);

  const step = useMutation({
    mutationFn: (key: SubOrderStep) => stylemintSubOrdersApi.step(row.id, key),
    onSuccess: () => onDone(`${row.orderNumber} moved on.`),
    onError,
  });

  const steps = availableSteps(row.state);

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3">
      <div className="flex flex-wrap items-start gap-3">
        <button onClick={onToggle} className="mt-0.5 shrink-0 text-text-secondary hover:text-brand">
          {selected ? (
            <CheckSquare className="h-4 w-4 text-brand" strokeWidth={1.6} />
          ) : (
            <Square className="h-4 w-4" strokeWidth={1.6} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black text-text-primary">
              {row.orderNumber}
            </span>
            <StateBadge state={row.state} />
            <span className="text-[11px] text-text-muted">
              {row.itemCount} {row.itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-secondary">
            {row.receiverName} · {formatMoney(row.subtotalAmount, row.subtotalCurrency)} · placed{' '}
            {new Date(row.placedUtc).toLocaleString()}
          </p>
          {(row.carrier || row.trackingNumber) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
              <Truck className="h-3 w-3" strokeWidth={1.6} />
              {row.carrier ?? 'courier not named'}
              {row.trackingNumber ? ` · ${row.trackingNumber}` : ' · no tracking number yet'}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {steps.length === 0 && (
            <span className="text-[11px] text-text-muted">No step from here</span>
          )}
          {/* Always offered: a slip is a read, and a parcel can need reprinting at any stage. */}
          <button
            onClick={onPrint}
            title="Packing slip"
            className="rounded-sm border-thin border-border-medium p-1 text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <Printer className="h-3 w-3" strokeWidth={1.6} />
          </button>
          {steps.map((action) => (
            <button
              key={action.key}
              disabled={step.isPending}
              onClick={() => {
                if (action.key === 'reject') setForm('reject');
                else if (action.key === 'handover') setForm('handover');
                else if (action.key === 'tracking') setForm('tracking');
                else step.mutate(action.key);
              }}
              className={`rounded-sm px-2.5 py-1 text-[11px] font-bold disabled:opacity-40 ${
                action.destructive
                  ? 'border-thin border-rose-400/30 text-rose-300 hover:bg-rose-400/10'
                  : 'bg-brand text-bg hover:bg-brand-light'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {form === 'reject' && (
        <RejectForm
          subOrderId={row.id}
          onCancel={() => setForm(null)}
          onDone={() => {
            setForm(null);
            onDone(`${row.orderNumber} rejected.`);
          }}
          onError={onError}
        />
      )}
      {form === 'handover' && (
        <HandoverForm
          subOrderId={row.id}
          onCancel={() => setForm(null)}
          onDone={() => {
            setForm(null);
            onDone(`${row.orderNumber} handed over.`);
          }}
          onError={onError}
        />
      )}
      {form === 'tracking' && (
        <TrackingForm
          subOrderId={row.id}
          onCancel={() => setForm(null)}
          onDone={() => {
            setForm(null);
            onDone(`Tracking set on ${row.orderNumber}.`);
          }}
          onError={onError}
        />
      )}
    </div>
  );
}

function RejectForm({
  subOrderId,
  onCancel,
  onDone,
  onError,
}: {
  subOrderId: string;
  onCancel: () => void;
  onDone: () => void;
  onError: (caught: unknown) => void;
}) {
  const [reason, setReason] = useState<VendorRejectionReasonValue>(
    VendorRejectionReason.OutOfStock,
  );
  const [note, setNote] = useState('');

  const reject = useMutation({
    mutationFn: () => stylemintSubOrdersApi.reject(subOrderId, reason, note),
    onSuccess: onDone,
    onError,
  });

  return (
    <ExpandedForm
      title="Reject this order"
      note="The buyer is told the order cannot be fulfilled. This cannot be undone from here."
      busy={reject.isPending}
      ready={reason !== VendorRejectionReason.Other || !!note.trim()}
      submitLabel="Reject"
      destructive
      onCancel={onCancel}
      onSubmit={() => reject.mutate()}
    >
      <select
        value={reason}
        onChange={(e) => setReason(Number(e.target.value) as VendorRejectionReasonValue)}
        className={field}
      >
        {Object.values(VendorRejectionReason).map((code) => (
          <option key={code} value={code}>
            {REJECTION_REASON_LABEL[code]}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={
          reason === VendorRejectionReason.Other ? 'Required for "Other"' : 'Note (optional)'
        }
        className={field}
      />
    </ExpandedForm>
  );
}

function HandoverForm({
  subOrderId,
  onCancel,
  onDone,
  onError,
}: {
  subOrderId: string;
  onCancel: () => void;
  onDone: () => void;
  onError: (caught: unknown) => void;
}) {
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');

  const handOver = useMutation({
    mutationFn: () => stylemintSubOrdersApi.handOver(subOrderId, carrier, tracking, note),
    onSuccess: onDone,
    onError,
  });

  return (
    <ExpandedForm
      title="Hand over to a courier"
      note="Carrier and tracking are optional — some couriers issue the number later, and a placeholder would show the buyer a tracking number that does not exist."
      busy={handOver.isPending}
      ready
      submitLabel="Hand over"
      onCancel={onCancel}
      onSubmit={() => handOver.mutate()}
    >
      <input
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        placeholder="Carrier"
        className={field}
      />
      <input
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="Tracking number"
        className={field}
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Handover note"
        className={field}
      />
    </ExpandedForm>
  );
}

function TrackingForm({
  subOrderId,
  onCancel,
  onDone,
  onError,
}: {
  subOrderId: string;
  onCancel: () => void;
  onDone: () => void;
  onError: (caught: unknown) => void;
}) {
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');

  const set = useMutation({
    mutationFn: () => stylemintSubOrdersApi.setTracking(subOrderId, carrier, tracking),
    onSuccess: onDone,
    onError,
  });

  return (
    <ExpandedForm
      title="Set tracking"
      note="Both are required here — this is the number the buyer follows."
      busy={set.isPending}
      ready={!!carrier.trim() && !!tracking.trim()}
      submitLabel="Set tracking"
      onCancel={onCancel}
      onSubmit={() => set.mutate()}
    >
      <input
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        placeholder="Carrier"
        className={field}
      />
      <input
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="Tracking number"
        className={field}
      />
    </ExpandedForm>
  );
}

function ExpandedForm({
  title,
  note,
  busy,
  ready,
  submitLabel,
  destructive,
  onCancel,
  onSubmit,
  children,
}: {
  title: string;
  note: string;
  busy: boolean;
  ready: boolean;
  submitLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2.5 rounded-sm border-thin border-border-subtle bg-bg-input p-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">{title}</p>
      <p className="mt-0.5 text-[11px] text-text-muted">{note}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">{children}</div>
      <div className="mt-2 flex gap-1.5">
        <button
          disabled={!ready || busy}
          onClick={onSubmit}
          className={`flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11px] font-bold disabled:opacity-40 ${
            destructive
              ? 'border-thin border-rose-400/30 text-rose-300 hover:bg-rose-400/10'
              : 'bg-brand text-bg hover:bg-brand-light'
          }`}
        >
          {busy && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.6} />}
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="rounded-sm border-thin border-border-medium px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:bg-glass-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: number }) {
  const tone =
    state === SubOrderState.Delivered
      ? 'border-emerald-400/25 text-emerald-300'
      : state === SubOrderState.Cancelled || state === SubOrderState.Returned
        ? 'border-rose-400/25 text-rose-300'
        : state === SubOrderState.Paid || state === SubOrderState.AwaitingFulfillment
          ? 'border-amber-400/25 text-amber-300'
          : 'border-border-medium text-text-secondary';

  return (
    <span className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>
      {SUB_ORDER_STATE_LABEL[state] ?? `State ${state}`}
    </span>
  );
}

function Banner({ tone, message }: { tone: 'error' | 'ok'; message: string }) {
  if (tone === 'ok') {
    return (
      <p className="rounded-frame border-thin border-border-glow bg-brand-soft p-3 text-xs text-text-secondary">
        {message}
      </p>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
      <p className="text-xs text-text-secondary">{message}</p>
    </div>
  );
}

/** The api client signals absence with codes rather than prose, so each caller says it its own way. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong.';
  if (error.message === 'NOT_DEPLOYED') {
    return 'This Stylemint build does not serve the vendor fulfilment surface yet.';
  }
  if (error.message === 'NOT_FOUND') return 'No sub-order matches that identifier.';
  return error.message;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    // An unknown or blank currency code throws rather than falling back, and a sub-order is
    // still worth showing without it.
    return `${amount} ${currency}`.trim();
  }
}

const field =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-card px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';
