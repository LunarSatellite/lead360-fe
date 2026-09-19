import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  FileSearch,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Undo2,
  X,
} from 'lucide-react';
import {
  DEMAND_KIND_LABEL,
  DEMAND_STATE_LABEL,
  DemandContentState,
  isPublishable,
  stylemintDemandContentApi,
  type DemandContentStateValue,
  type DemandContentUnit,
} from '../api/stylemint-demand-content.api';

/**
 * Demand content — the answer pages the platform publishes about its own products.
 *
 * The gates are the whole point: a unit cannot go live until every required one is cleared, and
 * each is a different sign-off (a claim substantiated, legal and brand approved, a translation
 * checked). The page leads with what is outstanding, because that is what stands between a draft
 * and publication.
 *
 * Refusals are shown as prominently as the content: they are what the generator declined to
 * assert, and an operator publishing without reading them is publishing blind.
 */

const STATE_TONE: Record<number, string> = {
  1: 'text-text-secondary border-border-subtle bg-glass-2',
  2: 'text-amber-300 border-amber-400/25 bg-amber-400/5',
  3: 'text-brand border-border-glow bg-brand-soft',
  4: 'text-rose-300 border-rose-400/25 bg-rose-400/5',
  5: 'text-emerald-300 border-emerald-400/25 bg-emerald-400/5',
  6: 'text-text-muted border-border-subtle bg-glass-2',
  7: 'text-text-muted border-border-subtle bg-glass-2',
};

export function DemandContentPage() {
  const client = useQueryClient();
  const [state, setState] = useState<DemandContentStateValue>(DemandContentState.Drafted);

  const units = useQuery({
    queryKey: ['stylemint-demand-content', state],
    queryFn: () => stylemintDemandContentApi.list(state, 50),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ['stylemint-demand-content'] });

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <FileSearch className="h-5 w-5 text-brand" strokeWidth={1.6} />
            Demand content
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Answer pages generated from approved facts. Nothing publishes until every required
            gate is cleared.
          </p>
        </div>
        <button
          onClick={() => units.refetch()}
          className="flex items-center gap-2 self-start rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${units.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.values(DemandContentState) as DemandContentStateValue[]).map((value) => (
          <button
            key={value}
            onClick={() => setState(value)}
            className={`rounded-sm border-thin px-3 py-1.5 text-xs font-bold ${
              state === value
                ? 'border-border-glow bg-brand-soft text-brand'
                : 'border-border-subtle text-text-secondary hover:bg-glass-2 hover:text-text-primary'
            }`}
          >
            {DEMAND_STATE_LABEL[value]}
          </button>
        ))}
      </div>

      {units.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{(units.error as Error).message}</p>
        </div>
      )}

      {units.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Loading units…
        </div>
      ) : (units.data?.length ?? 0) === 0 ? (
        <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-10 text-center">
          <FileSearch className="mx-auto h-7 w-7 text-text-muted" strokeWidth={1.6} />
          <p className="mt-3 text-sm text-text-secondary">
            Nothing is {DEMAND_STATE_LABEL[state].toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {units.data!.map((unit) => (
            <UnitRow key={unit.id} unit={unit} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function UnitRow({ unit, onChanged }: { unit: DemandContentUnit; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState<string | null>(null);
  const [mode, setMode] = useState<'reject' | 'withdraw' | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<Record<string, unknown> | null>(null);

  const reset = () => {
    setGate(null);
    setMode(null);
    setText('');
    setError(null);
  };

  const act = useMutation({
    mutationFn: async (kind: 'gate' | 'reject' | 'withdraw' | 'publish' | 'inspect') => {
      if (kind === 'gate') await stylemintDemandContentApi.clearGate(unit.id, gate!, text.trim());
      else if (kind === 'reject') await stylemintDemandContentApi.reject(unit.id, text.trim());
      else if (kind === 'withdraw') await stylemintDemandContentApi.withdraw(unit.id, text.trim());
      else if (kind === 'publish') await stylemintDemandContentApi.publish(unit.id);
      else setInspection(await stylemintDemandContentApi.inspect(unit.id));
    },
    onSuccess: (_data, kind) => {
      reset();
      if (kind !== 'inspect') onChanged();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'The unit could not be changed.'),
  });

  const publishable = isPublishable(unit);

  return (
    <div className="rounded-card border-thin border-border-subtle bg-glass-1">
      <div className="flex flex-wrap items-start justify-between gap-3 p-3.5">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
          {open ? (
            <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
          ) : (
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.6} />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-xs border-thin px-1.5 py-0.5 text-[10px] font-bold ${
                  STATE_TONE[unit.state] ?? STATE_TONE[1]
                }`}
              >
                {DEMAND_STATE_LABEL[unit.state] ?? unit.state}
              </span>
              <span className="text-sm font-bold text-text-primary">{unit.metaTitle}</span>
              <span className="text-[11px] text-text-muted">
                {DEMAND_KIND_LABEL[unit.kind] ?? 'Unit'} · {unit.locale}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-text-secondary">{unit.metaDescription}</p>
            <p className="mt-1 font-mono text-[11px] text-text-muted">{unit.canonicalSlug}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {unit.outstandingGates.length > 0 ? (
                unit.outstandingGates.map((g) => (
                  <span
                    key={g}
                    className="rounded-xs border-thin border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300"
                  >
                    {g} outstanding
                  </span>
                ))
              ) : (
                <span className="rounded-xs border-thin border-border-glow bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                  all gates cleared
                </span>
              )}
              {unit.refusals.length > 0 && (
                <span className="rounded-xs border-thin border-rose-400/30 bg-rose-400/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                  {unit.refusals.length} refusal{unit.refusals.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {unit.outstandingGates.map((g) => (
            <button
              key={g}
              onClick={() => { setGate(g); setMode(null); setError(null); }}
              className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-2.5 py-1.5 text-[11px] font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <ShieldCheck className="h-3 w-3" strokeWidth={1.6} /> Clear {g}
            </button>
          ))}
          {publishable && (
            <button
              disabled={act.isPending}
              onClick={() => act.mutate('publish')}
              className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.6} /> Publish
            </button>
          )}
          {unit.state === DemandContentState.Published && (
            <>
              <button
                disabled={act.isPending}
                onClick={() => act.mutate('inspect')}
                className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                Inspect
              </button>
              <button
                onClick={() => { setMode('withdraw'); setGate(null); setError(null); }}
                className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                <Undo2 className="h-3.5 w-3.5" strokeWidth={1.6} /> Withdraw
              </button>
            </>
          )}
          {unit.state !== DemandContentState.Published &&
            unit.state !== DemandContentState.Rejected && (
              <button
                onClick={() => { setMode('reject'); setGate(null); setError(null); }}
                className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.6} /> Reject
              </button>
            )}
        </div>
      </div>

      {(gate || mode) && (
        <div className="border-t-thin border-border-subtle p-3.5">
          <div className="rounded-sm border-thin border-border-glow bg-brand-soft p-3">
            <p className="text-xs font-bold text-text-primary">
              {gate
                ? `Clear the ${gate} gate`
                : mode === 'reject'
                  ? 'Reject this unit'
                  : 'Withdraw this unit'}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {gate
                ? 'The note is the substantiation for this sign-off and stays on the record.'
                : mode === 'reject'
                  ? 'The unit stops progressing. The reason stays on the record.'
                  : 'The page comes down. The reason stays on the record.'}
            </p>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={gate ? 'Substantiation (optional)' : 'Reason'}
              className="mt-2 w-full rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
            />
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-2 flex items-center gap-2">
              <button
                disabled={act.isPending || (!gate && !text.trim())}
                onClick={() => act.mutate(gate ? 'gate' : mode!)}
                className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
              >
                {act.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.6} />
                )}
                Confirm
              </button>
              <button
                onClick={reset}
                className="rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="space-y-3 border-t-thin border-border-subtle p-3.5">
          {unit.refusals.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-rose-300">
                Refused to assert
              </p>
              <ul className="mt-1 space-y-1">
                {unit.refusals.map((refusal, i) => (
                  <li key={i} className="text-xs text-text-secondary">
                    {refusal.reason ?? JSON.stringify(refusal)}
                    {refusal.detail ? ` — ${refusal.detail}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {unit.answers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                Answers
              </p>
              <dl className="mt-1 space-y-1.5">
                {unit.answers.map((answer, i) => (
                  <div key={i}>
                    <dt className="text-xs font-bold text-text-primary">
                      {answer.question ?? `Answer ${i + 1}`}
                    </dt>
                    <dd className="text-xs text-text-secondary">
                      {answer.answer ?? JSON.stringify(answer)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {unit.clearedGates.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                Cleared gates
              </p>
              <ul className="mt-1 space-y-0.5">
                {unit.clearedGates.map((cleared, i) => (
                  <li key={i} className="text-xs text-text-secondary">
                    <span className="font-bold text-brand">{cleared.gate}</span>
                    {cleared.clearedUtc &&
                      ` · ${new Date(cleared.clearedUtc).toLocaleString()}`}
                    {cleared.note ? ` · ${cleared.note}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {inspection && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                Freshness inspection
              </p>
              <pre className="mt-1 max-h-56 overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
                {JSON.stringify(inspection, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {error && !gate && !mode && <p className="px-3.5 pb-3 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

export { DemandContentPage as Component };
