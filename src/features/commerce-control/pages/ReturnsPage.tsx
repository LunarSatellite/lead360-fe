import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageOpen,
  RefreshCw,
} from 'lucide-react';
import {
  RETURN_STATE_LABEL,
  ReturnState,
  stylemintReturnsApi,
  type ReturnQueueItem,
  type ReturnStateValue,
} from '../api/stylemint-returns.api';

/**
 * The platform returns queue, and the evidence snapshot behind any one return.
 *
 * Read-only on purpose: approving or rejecting a return is the vendor's decision, taken on the
 * vendor surface. Support's job here is to see what was claimed and what evidence exists when a
 * return is disputed — which previously could only be done one id at a time, with no way to find
 * the ids.
 */

const PAGE_SIZE = 25;

const STATE_TONE: Record<number, string> = {
  1: 'text-amber-300 border-amber-400/25 bg-amber-400/5',
  2: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/5',
  3: 'text-rose-300 border-rose-400/25 bg-rose-400/5',
  4: 'text-text-secondary border-border-subtle bg-glass-2',
};

export function ReturnsPage() {
  const [state, setState] = useState<ReturnStateValue>(ReturnState.Submitted);
  const [skip, setSkip] = useState(0);
  const [selected, setSelected] = useState<ReturnQueueItem | null>(null);

  const queue = useQuery({
    queryKey: ['stylemint-returns', state, skip],
    queryFn: () => stylemintReturnsApi.queue({ state, skip, take: PAGE_SIZE }),
  });

  const pick = (next: ReturnStateValue) => {
    setState(next);
    setSkip(0);
    setSelected(null);
  };

  const data = queue.data;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <PackageOpen className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Returns
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Every return raised across the platform, and the evidence behind a disputed one.
            Deciding a return stays with the vendor.
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
        {(Object.values(ReturnState) as ReturnStateValue[]).map((value) => (
          <button
            key={value}
            onClick={() => pick(value)}
            className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
              state === value
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
            }`}
          >
            {RETURN_STATE_LABEL[value]}
          </button>
        ))}
      </div>

      {queue.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(queue.error as Error).message}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2">
          {queue.isLoading ? (
            <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
              Loading returns…
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
              <PackageOpen className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
              <p className="mt-3 text-sm text-text-secondary">
                No {RETURN_STATE_LABEL[state].toLowerCase()} returns.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-muted">
                {data.totalCount} {data.totalCount === 1 ? 'return' : 'returns'}
              </p>
              {data.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`flex w-full items-start gap-3 rounded-card border-thin p-3 text-left ${
                    selected?.id === item.id
                      ? 'border-border-glow bg-brand-soft'
                      : 'border-border-subtle bg-glass-1 hover:border-border-medium hover:bg-glass-2'
                  }`}
                >
                  {item.thumbnailUrlSnapshot ? (
                    <img
                      src={item.thumbnailUrlSnapshot}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-glass-2">
                      <PackageOpen className="h-4 w-4 text-text-muted" strokeWidth={1.6} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {item.productTitleSnapshot || 'Item'}
                      {item.variantLabelSnapshot ? ` · ${item.variantLabelSnapshot}` : ''}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {item.orderNumber} · ×{item.quantity} · {item.reason}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                        STATE_TONE[item.state] ?? STATE_TONE[4]
                      }`}
                    >
                      {RETURN_STATE_LABEL[item.state] ?? item.state}
                    </span>
                    <p className="mt-1 text-[11px] text-text-muted">
                      {new Date(item.submittedUtc).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  disabled={skip === 0 || queue.isFetching}
                  onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
                  className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.6} /> Previous
                </button>
                <button
                  disabled={skip + PAGE_SIZE >= data.totalCount || queue.isFetching}
                  onClick={() => setSkip(skip + PAGE_SIZE)}
                  className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
                </button>
              </div>
            </>
          )}
        </div>

        <EvidencePanel item={selected} />
      </div>
    </div>
  );
}

function EvidencePanel({ item }: { item: ReturnQueueItem | null }) {
  const evidence = useQuery({
    queryKey: ['stylemint-return-evidence', item?.id],
    queryFn: () => stylemintReturnsApi.evidence(item!.id),
    enabled: !!item,
  });

  if (!item) {
    return (
      <div className="grid place-items-center rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
        <div>
          <PackageOpen className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            Pick a return to see its evidence snapshot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div>
        <p className="text-sm font-black text-text-primary">
          {item.productTitleSnapshot || 'Item'}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {item.orderNumber} · ×{item.quantity}
        </p>
      </div>

      <dl className="grid gap-2 text-xs">
        <Row label="Reason" value={item.reason} />
        <Row label="State" value={RETURN_STATE_LABEL[item.state] ?? String(item.state)} />
        <Row label="Submitted" value={new Date(item.submittedUtc).toLocaleString()} />
        {item.resolvedUtc && (
          <Row label="Resolved" value={new Date(item.resolvedUtc).toLocaleString()} />
        )}
        {item.rejectionNote && <Row label="Rejection note" value={item.rejectionNote} />}
        <Row label="Vendor" value={item.vendorAccountId} mono />
        <Row label="Customer" value={item.customerAccountId} mono />
      </dl>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Evidence snapshot
        </p>
        {evidence.isLoading ? (
          <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} /> Loading…
          </div>
        ) : evidence.isError ? (
          <p className="mt-1 text-xs text-rose-300">{(evidence.error as Error).message}</p>
        ) : !evidence.data ? (
          <p className="mt-1 text-xs text-text-muted">
            This return carries no snapshot — the same absence the buyer and vendor see.
          </p>
        ) : (
          <pre className="mt-1 max-h-72 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {JSON.stringify(evidence.data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-text-muted">{label}</dt>
      <dd className={`min-w-0 break-all text-text-primary ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

export { ReturnsPage as Component };
