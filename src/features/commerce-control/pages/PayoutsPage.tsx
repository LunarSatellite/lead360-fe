import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldQuestion,
} from 'lucide-react';
import {
  PAYEE_KIND_LABEL,
  PAYOUT_DESTINATION_LABEL,
  PAYOUT_STATE_LABEL,
  PayoutState,
  formatMoney,
  stylemintPayoutsApi,
  type Payout,
  type PayoutStateValue,
} from '../api/stylemint-payouts.api';
import { InsuranceClaimsPanel } from '../components/InsuranceClaimsPanel';

/**
 * The platform payout queue, with the two money actions an operator can actually take here.
 *
 * Hold and release carry no step-up MFA, so they work from Lead360. Force-paid and force-failed
 * do carry it and are deliberately absent rather than shown broken — a Lead360 operator token
 * asserts no step-up, so they would 401 every time. The page says so instead of hiding it.
 *
 * No default state filter: unlike a ticket queue there is no single "needs attention" state.
 * Held and Failed both do, for different reasons, and Requested is what a release acts on.
 */

const PAGE_SIZE = 25;

const STATE_TONE: Record<number, string> = {
  1: 'text-blue-300 border-blue-400/25 bg-blue-400/5',
  2: 'text-amber-300 border-amber-400/25 bg-amber-400/5',
  3: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/5',
  4: 'text-rose-300 border-rose-400/25 bg-rose-400/5',
  5: 'text-amber-300 border-amber-400/25 bg-amber-400/5',
};

type Tab = 'queue' | 'insurance';

/**
 * Payouts and insurance claims share this page because they are one job done by one role:
 * money the platform owes, decided by PayoutsOps.
 */
export function PayoutsPage() {
  const [tab, setTab] = useState<Tab>('queue');

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <Banknote className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Payouts
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          What the platform owes vendors, creators and couriers — what is held or failing, and the
          insurance claims filed against partnership cover.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={tab === 'queue'} onClick={() => setTab('queue')}>
          <span className="flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5" strokeWidth={1.6} /> Payout queue
          </span>
        </FilterChip>
        <FilterChip active={tab === 'insurance'} onClick={() => setTab('insurance')}>
          <span className="flex items-center gap-1.5">
            <ShieldQuestion className="h-3.5 w-3.5" strokeWidth={1.6} /> Insurance claims
          </span>
        </FilterChip>
      </div>

      {tab === 'queue' ? <PayoutQueue /> : <InsuranceClaimsPanel />}
    </div>
  );
}

function PayoutQueue() {
  const client = useQueryClient();
  const [state, setState] = useState<PayoutStateValue | undefined>(undefined);
  const [skip, setSkip] = useState(0);

  const page = useQuery({
    queryKey: ['stylemint-payouts', state, skip],
    queryFn: () => stylemintPayoutsApi.queue({ state, skip, take: PAGE_SIZE }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-payouts'] });

  const pick = (next?: PayoutStateValue) => {
    setState(next);
    setSkip(0);
  };

  const data = page.data;
  const held = data?.items.reduce(
    (sum, p) => (p.state === PayoutState.Held ? sum + p.netAmountValue : sum),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip active={state === undefined} onClick={() => pick(undefined)}>
          All
        </FilterChip>
        {(Object.values(PayoutState) as PayoutStateValue[]).map((value) => (
          <FilterChip key={value} active={state === value} onClick={() => pick(value)}>
            {PAYOUT_STATE_LABEL[value]}
          </FilterChip>
        ))}
        </div>
        <button
          onClick={() => page.refetch()}
          className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${page.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex items-start gap-2.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
        <p className="text-xs text-text-muted">
          Hold and release are available here. Force-marking a payout paid or failed needs a
          step-up MFA challenge, which a Lead360 session does not carry — do that on the Stylemint
          admin console.
        </p>
      </div>

      {page.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(page.error as Error).message}</p>
        </div>
      )}

      {page.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
          Loading payouts…
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <Banknote className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            {state ? `No ${PAYOUT_STATE_LABEL[state].toLowerCase()} payouts.` : 'No payouts yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
            <span>
              {data.totalCount} {data.totalCount === 1 ? 'payout' : 'payouts'}
            </span>
            {!!held && (
              <span className="text-amber-300">
                {formatMoney(held, data.items[0]?.netAmountCurrency ?? 'NPR')} held on this page
              </span>
            )}
          </div>

          <div className="space-y-2">
            {data.items.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} onChanged={refresh} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              disabled={skip === 0 || page.isFetching}
              onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
              className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.6} /> Previous
            </button>
            <button
              disabled={skip + PAGE_SIZE >= data.totalCount || page.isFetching}
              onClick={() => setSkip(skip + PAGE_SIZE)}
              className="flex items-center gap-1 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
        active
          ? 'border-border-glow bg-brand-soft text-brand'
          : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function PayoutRow({ payout, onChanged }: { payout: Payout; onChanged: () => void }) {
  const [acting, setActing] = useState<'hold' | 'release' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: async (kind: 'hold' | 'release') => {
      if (kind === 'hold') await stylemintPayoutsApi.hold(payout.id, reason.trim());
      else await stylemintPayoutsApi.release(payout.id, reason.trim());
    },
    onSuccess: () => {
      setActing(null);
      setReason('');
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The payout could not be changed.'),
  });

  // Holding only makes sense before the money moves; releasing only undoes a hold.
  const canHold = payout.state === PayoutState.Requested || payout.state === PayoutState.Processing;
  const canRelease = payout.state === PayoutState.Held;

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                STATE_TONE[payout.state] ?? STATE_TONE[1]
              }`}
            >
              {PAYOUT_STATE_LABEL[payout.state] ?? payout.state}
            </span>
            <span className="text-sm font-black text-text-primary">
              {formatMoney(payout.netAmountValue, payout.netAmountCurrency)}
            </span>
            <span className="text-xs text-text-muted">
              {PAYEE_KIND_LABEL[payout.payeeKind] ?? 'Payee'} ·{' '}
              {PAYOUT_DESTINATION_LABEL[payout.destination] ?? 'Destination'} ·{' '}
              {payout.destinationRef}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-text-muted">
            Requested {new Date(payout.requestedUtc).toLocaleString()}
            {payout.paidUtc && ` · paid ${new Date(payout.paidUtc).toLocaleString()}`}
            {payout.feeAmountValue > 0 &&
              ` · fee ${formatMoney(payout.feeAmountValue, payout.feeAmountCurrency)}`}
          </p>

          {payout.failureCode && (
            <p className="mt-1 text-xs text-rose-300">
              {payout.failureCode}
              {payout.failureMessage ? ` — ${payout.failureMessage}` : ''}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {canHold && (
            <button
              onClick={() => {
                setActing('hold');
                setError(null);
              }}
              className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <PauseCircle className="h-3.5 w-3.5" strokeWidth={1.6} /> Hold
            </button>
          )}
          {canRelease && (
            <button
              onClick={() => {
                setActing('release');
                setError(null);
              }}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light"
            >
              <PlayCircle className="h-3.5 w-3.5" strokeWidth={1.6} /> Release
            </button>
          )}
        </div>
      </div>

      {acting && (
        <div className="mt-3 rounded-sm border-thin border-border-glow bg-brand-soft p-3">
          <p className="text-xs font-bold text-text-primary">
            {acting === 'hold' ? 'Hold this payout' : 'Release this payout'}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {acting === 'hold'
              ? 'The payout stops before it is sent. The reason is recorded in the audit trail.'
              : 'The hold is lifted and the payout resumes on the next sweep.'}
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="mt-2 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          />
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button
              disabled={!reason.trim() || act.isPending}
              onClick={() => act.mutate(acting)}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
              Confirm {acting}
            </button>
            <button
              onClick={() => {
                setActing(null);
                setReason('');
                setError(null);
              }}
              className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { PayoutsPage as Component };
