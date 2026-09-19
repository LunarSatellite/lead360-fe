import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Compass,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  FEATURED_STATE_LABEL,
  stylemintDiscoveryApi,
  type FeaturedMatchCandidate,
  type PopularSearch,
  type UpsertPopularSearch,
} from '../api/stylemint-discovery.api';

/**
 * What the platform promotes before a shopper searches, and the check on whether it promotes
 * fairly.
 *
 * Four surfaces on one page because they are one lever: the suggestion chips, the creator/brand
 * pairings the matcher proposes, the fairness audit over those pairings, and the reach pipeline
 * that publishes them.
 */

type Tab = 'searches' | 'featured' | 'fairness' | 'reach';

const TABS: Array<{ id: Tab; label: string; icon: typeof Search }> = [
  { id: 'searches', label: 'Popular searches', icon: Search },
  { id: 'featured', label: 'Featured matches', icon: Sparkles },
  { id: 'fairness', label: 'Fairness audit', icon: Scale },
  { id: 'reach', label: 'Reach pipeline', icon: Zap },
];

export function DiscoveryPage() {
  const [tab, setTab] = useState<Tab>('searches');

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <Compass className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Discovery
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          What gets promoted before anyone searches — and whether it is promoted evenly.
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

      {tab === 'searches' && <SearchesTab />}
      {tab === 'featured' && <FeaturedTab />}
      {tab === 'fairness' && <FairnessTab />}
      {tab === 'reach' && <ReachTab />}
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

function SearchesTab() {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);

  const searches = useQuery({
    queryKey: ['stylemint-popular-searches'],
    queryFn: () => stylemintDiscoveryApi.popularSearches(),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-popular-searches'] });

  if (searches.isError) return <ErrorBox error={searches.error} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {searches.data?.length ?? 0} suggestion chips
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-card bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.6} /> New chip
          </button>
          <button
            onClick={() => searches.refetch()}
            className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-brand"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${searches.isFetching ? 'animate-spin' : ''}`}
              strokeWidth={1.6}
            />
            Refresh
          </button>
        </div>
      </div>

      {creating && (
        <SearchEditor
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {searches.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading…
        </div>
      ) : (searches.data?.length ?? 0) === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <Search className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">No suggestion chips are configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...searches.data!]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((search) => (
              <SearchRow key={search.id} search={search} onChanged={refresh} />
            ))}
        </div>
      )}
    </div>
  );
}

function SearchRow({ search, onChanged }: { search: PopularSearch; onChanged: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: async (kind: 'toggle' | 'delete') => {
      if (kind === 'toggle')
        await stylemintDiscoveryApi.setPopularSearchActive(search.id, !search.isActive);
      else await stylemintDiscoveryApi.deletePopularSearch(search.id);
    },
    onSuccess: () => {
      setConfirmDelete(false);
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The chip could not be changed.'),
  });

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-text-primary">{search.label}</span>
            <span className="font-mono text-[11px] text-text-muted">“{search.query}”</span>
            {search.regionCode && (
              <span className="rounded-xs border-thin border-border-subtle bg-glass-2 px-1.5 py-0.5 text-[10px] text-text-muted">
                {search.regionCode}
              </span>
            )}
            <span className="text-[11px] text-text-muted">order {search.displayOrder}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            disabled={act.isPending}
            onClick={() => act.mutate('toggle')}
            className={`flex items-center gap-1.5 rounded-sm border-thin px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
              search.isActive
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-medium text-text-secondary hover:bg-glass-2'
            }`}
          >
            {search.isActive ? (
              <ToggleRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            ) : (
              <ToggleLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            )}
            {search.isActive ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => { setConfirmDelete(true); setError(null); }}
            className="rounded-sm border-thin border-border-medium p-1.5 text-text-secondary hover:bg-glass-2 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mt-2 rounded-sm border-thin border-rose-400/25 bg-rose-400/5 p-2.5">
          <p className="text-xs text-text-secondary">
            Delete “{search.label}” permanently? Deactivating keeps it for later.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              disabled={act.isPending}
              onClick={() => act.mutate('delete')}
              className="rounded-sm bg-rose-400/20 px-3 py-1 text-xs font-bold text-rose-200 hover:bg-rose-400/30 disabled:opacity-40"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-sm border-thin border-border-medium px-3 py-1 text-xs font-bold text-text-secondary hover:bg-glass-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

function SearchEditor({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<UpsertPopularSearch>({
    label: '',
    query: '',
    displayOrder: 1,
    regionCode: '',
  });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      stylemintDiscoveryApi.createPopularSearch({
        ...form,
        regionCode: form.regionCode?.trim() || null,
      }),
    onSuccess: () => {
      setError(null);
      onSaved();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The chip could not be saved.'),
  });

  const valid = form.label.trim() && form.query.trim();

  return (
    <div className="rounded-card border-thin border-border-glow bg-brand-soft p-3.5">
      <p className="text-xs font-bold text-text-primary">New suggestion chip</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Label shown"
          className={inputClass}
        />
        <input
          value={form.query}
          onChange={(e) => setForm({ ...form, query: e.target.value })}
          placeholder="Search it runs"
          className={inputClass}
        />
        <input
          type="number"
          value={form.displayOrder}
          onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
          placeholder="Order"
          className={inputClass}
        />
        <input
          value={form.regionCode ?? ''}
          onChange={(e) => setForm({ ...form, regionCode: e.target.value })}
          placeholder="Region (optional)"
          className={inputClass}
        />
      </div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button
          disabled={!valid || save.isPending}
          onClick={() => save.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {save.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Create
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Cancel
        </button>
      </div>
    </div>
  );
}

function FeaturedTab() {
  const client = useQueryClient();
  const pending = useQuery({
    queryKey: ['stylemint-featured-pending'],
    queryFn: () => stylemintDiscoveryApi.featuredPending(50),
  });

  if (pending.isError) return <ErrorBox error={pending.error} />;

  const items = pending.data?.items ?? [];

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">
        {pending.data?.totalCount ?? 0} pairings awaiting review
      </p>
      {pending.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            The matcher has nothing waiting for review.
          </p>
        </div>
      ) : (
        items.map((candidate) => (
          <FeaturedRow
            key={candidate.id}
            candidate={candidate}
            onChanged={() =>
              client.invalidateQueries({ queryKey: ['stylemint-featured-pending'] })
            }
          />
        ))
      )}
    </div>
  );
}

function FeaturedRow({
  candidate,
  onChanged,
}: {
  candidate: FeaturedMatchCandidate;
  onChanged: () => void;
}) {
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = useMutation({
    mutationFn: async (kind: 'approve' | 'reject') => {
      if (kind === 'approve') await stylemintDiscoveryApi.approveFeatured(candidate.id, note.trim());
      else await stylemintDiscoveryApi.rejectFeatured(candidate.id, note.trim());
    },
    onSuccess: () => {
      setMode(null);
      setNote('');
      setError(null);
      onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The pairing could not be reviewed.'),
  });

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xs border-thin border-border-subtle bg-glass-2 px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">
              {FEATURED_STATE_LABEL[candidate.state] ?? candidate.state}
            </span>
            <span className="font-mono text-xs text-text-primary">
              snapshot {candidate.matchSnapshotId}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Proposed {new Date(candidate.proposedUtc).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => { setMode('approve'); setError(null); }}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.6} /> Approve
          </button>
          <button
            onClick={() => { setMode('reject'); setError(null); }}
            className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Reject
          </button>
        </div>
      </div>

      {mode && (
        <div className="mt-3 rounded-sm border-thin border-border-glow bg-brand-soft p-3">
          <p className="text-xs font-bold text-text-primary">
            {mode === 'approve' ? 'Approve this pairing' : 'Reject this pairing'}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {mode === 'approve'
              ? 'A note is optional.'
              : 'A note is required — the matcher learns from why this was wrong.'}
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === 'approve' ? 'Note (optional)' : 'Why this pairing is wrong'}
            className={`mt-2 ${inputClass}`}
          />
          {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button
              disabled={act.isPending || (mode === 'reject' && !note.trim())}
              onClick={() => act.mutate(mode)}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              {act.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
              Confirm
            </button>
            <button
              onClick={() => { setMode(null); setNote(''); }}
              className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FairnessTab() {
  const [error, setError] = useState<string | null>(null);
  const latest = useQuery({
    queryKey: ['stylemint-fairness-latest'],
    queryFn: () => stylemintDiscoveryApi.fairnessLatest(),
    retry: false,
  });

  const run = useMutation({
    mutationFn: () => stylemintDiscoveryApi.runFairnessAudit(),
    onSuccess: () => {
      setError(null);
      latest.refetch();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The audit could not be run.'),
  });

  const neverRun = latest.isError && (latest.error as Error).message === 'NOT_FOUND';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
        <div>
          <p className="text-sm font-bold text-text-primary">Run a fairness audit</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Checks whether the matcher is distributing exposure evenly rather than favouring the
            same accounts.
          </p>
        </div>
        <button
          disabled={run.isPending}
          onClick={() => run.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {run.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Scale className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Run audit
        </button>
      </div>

      {error && <ErrorBox error={new Error(error)} />}

      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Latest report
        </p>
        {latest.isLoading ? (
          <p className="mt-2 text-xs text-text-muted">Loading…</p>
        ) : neverRun ? (
          <p className="mt-2 text-xs text-text-muted">
            No audit has been run yet. Run one to establish a baseline.
          </p>
        ) : latest.isError ? (
          <p className="mt-2 text-xs text-rose-300">{(latest.error as Error).message}</p>
        ) : (
          <pre className="mt-2 max-h-96 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {JSON.stringify(run.data ?? latest.data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function ReachTab() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const alerts = useQuery({
    queryKey: ['stylemint-reach-alerts'],
    queryFn: () => stylemintDiscoveryApi.policyAlerts(),
  });

  const tick = useMutation({
    mutationFn: () => stylemintDiscoveryApi.reachTick(100),
    onSuccess: (count) => {
      setError(null);
      setMessage(`Decision loop processed ${count} owners.`);
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The tick could not be run.'),
  });

  const drain = useMutation({
    mutationFn: () => stylemintDiscoveryApi.reachDrain(50),
    onSuccess: (count) => {
      setError(null);
      setMessage(`Publish queue drained ${count} jobs.`);
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The drain could not be run.'),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
        <div>
          <p className="text-sm font-bold text-text-primary">Run the pipeline by hand</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Both normally run on a schedule. Use these when something is backed up.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={tick.isPending}
            onClick={() => tick.mutate()}
            className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-40"
          >
            {tick.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
            Decision tick
          </button>
          <button
            disabled={drain.isPending}
            onClick={() => drain.mutate()}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            {drain.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />}
            Drain publishes
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-card border-thin border-border-glow bg-brand-soft p-3 text-xs text-text-secondary">
          {message}
        </div>
      )}
      {error && <ErrorBox error={new Error(error)} />}

      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Policy alerts
        </p>
        {alerts.isLoading ? (
          <p className="mt-2 text-xs text-text-muted">Loading…</p>
        ) : alerts.isError ? (
          <p className="mt-2 text-xs text-rose-300">{(alerts.error as Error).message}</p>
        ) : (alerts.data?.length ?? 0) === 0 ? (
          <p className="mt-2 text-xs text-text-muted">No policy alerts outstanding.</p>
        ) : (
          <pre className="mt-2 max-h-96 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
            {JSON.stringify(alerts.data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none';

export { DiscoveryPage as Component };
