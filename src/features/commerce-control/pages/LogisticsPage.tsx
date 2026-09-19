import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Loader2,
  PackageSearch,
  RefreshCw,
  Route,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import {
  HOP_OFFER_STATE_LABEL,
  REPLAN_REASON_LABEL,
  ReplanReason,
  stylemintLogisticsApi,
  type HopOffer,
} from '../api/stylemint-logistics.api';

/**
 * Delivery operations: what is stuck, how routing is performing, and what the guardian is doing.
 *
 * These are one page rather than three because they are one job. Replan and the fulfilment reads
 * both need a packageId and nothing else hands one out — the stuck queue is what makes them
 * reachable at all, so it sits beside them.
 */

type Tab = 'stuck' | 'metrics' | 'guardian';

const TABS: Array<{ id: Tab; label: string; icon: typeof Route }> = [
  { id: 'stuck', label: 'Stuck packages', icon: PackageSearch },
  { id: 'metrics', label: 'Routing metrics', icon: Activity },
  { id: 'guardian', label: 'Guardian', icon: ShieldAlert },
];

export function LogisticsPage() {
  const [tab, setTab] = useState<Tab>('stuck');

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <Route className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Delivery operations
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Packages no courier took, how offers are converting, and what the guardian is
          intervening on.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
              tab === id
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'stuck' && <StuckTab />}
      {tab === 'metrics' && <MetricsTab />}
      {tab === 'guardian' && <GuardianTab />}
    </div>
  );
}

function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
      <p className="text-sm text-text-secondary">
        {error instanceof Error ? error.message : 'Something went wrong.'}
      </p>
    </div>
  );
}

function Loading({ what }: { what: string }) {
  return (
    <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
      Loading {what}…
    </div>
  );
}

function StuckTab() {
  const client = useQueryClient();
  const stuck = useQuery({
    queryKey: ['stylemint-routing-stuck'],
    queryFn: () => stylemintLogisticsApi.stuck({ pageSize: 25 }),
  });

  if (stuck.isError) return <ErrorBox error={stuck.error} />;
  if (stuck.isLoading) return <Loading what="stuck packages" />;

  const items = stuck.data?.items ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {stuck.data?.totalCount ?? 0} stuck {stuck.data?.totalCount === 1 ? 'offer' : 'offers'}
        </span>
        <button
          onClick={() => stuck.refetch()}
          className="flex items-center gap-1.5 text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${stuck.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <PackageSearch className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">Nothing is stuck in routing.</p>
        </div>
      ) : (
        items.map((offer) => (
          <StuckRow
            key={offer.id}
            offer={offer}
            onReplanned={() =>
              client.invalidateQueries({ queryKey: ['stylemint-routing-stuck'] })
            }
          />
        ))
      )}
    </div>
  );
}

function StuckRow({ offer, onReplanned }: { offer: HopOffer; onReplanned: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const replan = useMutation({
    mutationFn: () =>
      stylemintLogisticsApi.replan(offer.packageId, ReplanReason.AdminReplan, note.trim()),
    onSuccess: () => {
      setOpen(false);
      setNote('');
      setError(null);
      onReplanned();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The replan could not be started.'),
  });

  const assessment = useQuery({
    queryKey: ['stylemint-fulfilment-assessment', offer.packageId],
    queryFn: () => stylemintLogisticsApi.fulfilmentAssessment(offer.packageId),
    enabled: open,
  });

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xs border-thin border-amber-400/25 bg-amber-400/5 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              {HOP_OFFER_STATE_LABEL[offer.state] ?? offer.state}
            </span>
            <span className="font-mono text-xs text-text-primary">{offer.packageId}</span>
            <span className="text-[11px] text-text-muted">
              hop {offer.hopIndex} · round {offer.roundNumber} · {offer.fromGeohash} →{' '}
              {offer.toGeohash}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Offered {new Date(offer.offeredUtc).toLocaleString()} · expired{' '}
            {new Date(offer.expiresUtc).toLocaleString()} · payout{' '}
            {offer.proposedPayoutAmount} {offer.proposedPayoutCurrency}
            {offer.declineNote ? ` · "${offer.declineNote}"` : ''}
          </p>
        </button>

        <button
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light"
        >
          <Zap className="h-3.5 w-3.5" strokeWidth={1.6} /> Replan
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="rounded-sm border-thin border-border-glow bg-brand-soft p-3">
            <p className="text-xs font-bold text-text-primary">
              Replan as {REPLAN_REASON_LABEL[ReplanReason.AdminReplan]}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              A fresh routing pass runs for this package and new offers go out.
            </p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="mt-2 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
            />
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-2 flex items-center gap-2">
              <button
                disabled={replan.isPending}
                onClick={() => replan.mutate()}
                className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
              >
                {replan.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
                )}
                Confirm replan
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                Close
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              Fulfilment assessment
            </p>
            {assessment.isLoading ? (
              <p className="mt-1 text-xs text-text-muted">Loading…</p>
            ) : assessment.isError ? (
              <p className="mt-1 text-xs text-rose-300">
                {(assessment.error as Error).message}
              </p>
            ) : (
              <pre className="mt-1 max-h-56 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
                {JSON.stringify(assessment.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricsTab() {
  const metrics = useQuery({
    queryKey: ['stylemint-routing-metrics'],
    queryFn: () => stylemintLogisticsApi.metrics(),
  });

  if (metrics.isError) return <ErrorBox error={metrics.error} />;
  if (metrics.isLoading) return <Loading what="routing metrics" />;

  const m = metrics.data;
  if (!m) return null;

  const cards: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Total offers', value: m.totalOffers.toLocaleString() },
    { label: 'Accepted', value: m.accepted.toLocaleString(), tone: 'text-emerald-300' },
    { label: 'Declined', value: m.declined.toLocaleString(), tone: 'text-rose-300' },
    { label: 'Expired', value: m.expired.toLocaleString(), tone: 'text-amber-300' },
    { label: 'Superseded', value: m.superseded.toLocaleString() },
    { label: 'Pending', value: m.pending.toLocaleString() },
    {
      label: 'Acceptance rate',
      value: `${(m.acceptanceRate * 100).toFixed(1)}%`,
      tone: 'text-brand',
    },
    { label: 'Expiry rate', value: `${(m.expiryRate * 100).toFixed(1)}%`, tone: 'text-amber-300' },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
            {card.label}
          </p>
          <p className={`mt-1 text-xl font-black ${card.tone ?? 'text-text-primary'}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function GuardianTab() {
  const [error, setError] = useState<string | null>(null);

  const interventions = useQuery({
    queryKey: ['stylemint-guardian-interventions'],
    queryFn: () => stylemintLogisticsApi.guardianInterventions(),
  });
  const constraints = useQuery({
    queryKey: ['stylemint-guardian-constraints'],
    queryFn: () => stylemintLogisticsApi.guardianConstraints(),
  });

  const sweep = useMutation({
    mutationFn: () => stylemintLogisticsApi.guardianSweep(200),
    onSuccess: () => {
      setError(null);
      interventions.refetch();
      constraints.refetch();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The sweep could not be run.'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
        <div>
          <p className="text-sm font-bold text-text-primary">Run a guardian sweep</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Runs the guardian now over up to 200 parcels rather than waiting for its schedule.
          </p>
        </div>
        <button
          disabled={sweep.isPending}
          onClick={() => sweep.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {sweep.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Zap className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Sweep now
        </button>
      </div>

      {error && <ErrorBox error={new Error(error)} />}
      {sweep.data && (
        <Panel title="Last sweep report">
          <pre className="max-h-56 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {JSON.stringify(sweep.data, null, 2)}
          </pre>
        </Panel>
      )}

      <Panel title="Constraints blocking the guardian">
        {constraints.isLoading ? (
          <p className="text-xs text-text-muted">Loading…</p>
        ) : constraints.isError ? (
          <p className="text-xs text-rose-300">{(constraints.error as Error).message}</p>
        ) : (constraints.data?.length ?? 0) === 0 ? (
          <p className="text-xs text-text-muted">Nothing is blocking it.</p>
        ) : (
          <pre className="max-h-64 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {JSON.stringify(constraints.data, null, 2)}
          </pre>
        )}
      </Panel>

      <Panel title="Intervention ledger">
        {interventions.isLoading ? (
          <p className="text-xs text-text-muted">Loading…</p>
        ) : interventions.isError ? (
          <p className="text-xs text-rose-300">{(interventions.error as Error).message}</p>
        ) : (interventions.data?.length ?? 0) === 0 ? (
          <p className="text-xs text-text-muted">No interventions recorded.</p>
        ) : (
          <pre className="max-h-96 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {JSON.stringify(interventions.data, null, 2)}
          </pre>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export { LogisticsPage as Component };
