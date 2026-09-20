import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BrainCircuit,
  Dna,
  FlaskConical,
  GitBranch,
  Loader2,
  RefreshCw,
  Search,
  Telescope,
} from 'lucide-react';
import { stylemintIntelligenceApi, type Report } from '../api/stylemint-intelligence.api';

/**
 * Decision intelligence: what the platform noticed, what it decided, and whether the decision
 * worked.
 *
 * These endpoints return rich, evolving report shapes rather than fixed records, so the page
 * renders them as reports rather than inventing a narrow layout that would drift the first time
 * a field is added. The structure that IS stable — which report, over what window, and the
 * actions that regenerate them — is what the page provides.
 *
 * The multi-field writes on the decision ledger (recording an option, declaring an implementation
 * window, filing an outcome measurement) and on simulation runs are deliberately not here: each
 * is a long structured form that belongs with the decision it documents, and the governed
 * operations console already reaches them. Building half a form for them would be worse than
 * pointing at the one that works.
 */

type Tab = 'cockpit' | 'ledger' | 'genome' | 'aurora' | 'simulation';

const TABS: Array<{ id: Tab; label: string; icon: typeof BrainCircuit }> = [
  { id: 'cockpit', label: 'Executive cockpit', icon: Telescope },
  { id: 'ledger', label: 'Decision ledger', icon: GitBranch },
  { id: 'genome', label: 'Commerce genome', icon: Dna },
  { id: 'aurora', label: 'Aurora signals', icon: BrainCircuit },
  { id: 'simulation', label: 'Retail simulation', icon: FlaskConical },
];

const WINDOWS = [7, 30, 90];

export function IntelligencePage() {
  const [tab, setTab] = useState<Tab>('cockpit');
  const [days, setDays] = useState(30);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <BrainCircuit className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Decision intelligence
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          What the platform noticed, what it decided, and whether the decision worked.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
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

        {(tab === 'cockpit' || tab === 'ledger') && (
          <div className="flex items-center gap-1">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setDays(w)}
                className={`rounded-sm border-thin px-2.5 py-1 text-[11px] font-bold ${
                  days === w
                    ? 'border-border-glow bg-brand-soft text-brand'
                    : 'border-border-subtle text-text-secondary hover:bg-glass-2'
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'cockpit' && <CockpitTab days={days} />}
      {tab === 'ledger' && <LedgerTab days={days} />}
      {tab === 'genome' && <GenomeTab />}
      {tab === 'aurora' && <AuroraTab />}
      {tab === 'simulation' && <SimulationTab />}
    </div>
  );
}

/** Renders whatever the backend returned, without pretending to know its shape. */
function ReportPanel({
  title,
  query,
  emptyNote,
}: {
  title: string;
  query: { isLoading: boolean; isError: boolean; error: unknown; data: unknown; refetch: () => void; isFetching: boolean };
  emptyNote?: string;
}) {
  const notFound =
    query.isError && query.error instanceof Error && query.error.message === 'NOT_FOUND';

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          {title}
        </p>
        <button
          onClick={() => query.refetch()}
          className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3 w-3 ${query.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {query.isLoading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} /> Loading…
        </div>
      ) : notFound ? (
        <p className="mt-2 text-xs text-text-muted">
          {emptyNote ?? 'Nothing has been recorded here yet.'}
        </p>
      ) : query.isError ? (
        <div className="mt-2 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-rose-300">
            {query.error instanceof Error ? query.error.message : 'Something went wrong.'}
          </p>
        </div>
      ) : isEmptyReport(query.data) ? (
        <p className="mt-2 text-xs text-text-muted">
          {serverStatement(query.data) ?? emptyNote ?? 'Nothing has been recorded here yet.'}
        </p>
      ) : (
        <pre className="mt-2 max-h-[28rem] overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
          {JSON.stringify(query.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * An empty array, or an object whose every value is empty, reads better as a
 * sentence.
 *
 * The arrays are the payload; scalars beside them describe the *query*, not the
 * result. A paged response carries `pageSize: 25` and `hasMore: false` whether
 * or not it found anything, and an incrementality readout carries its minimum
 * and its horizon the same way. Treating those as content is what put a raw
 * JSON dump on screen where a written sentence belonged: `values.every(...)`
 * went false the moment any scalar sat beside the empty array, so the decision
 * twin and the cart-offer readout both rendered as developer output.
 *
 * So when a response contains arrays at all, they decide. Only a response with
 * no array anywhere falls back to the older, stricter rule.
 */
export function isEmptyReport(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    const values = Object.values(data as Report);
    if (values.length === 0) return true;

    const collections = values.filter(Array.isArray) as unknown[][];
    if (collections.length > 0) return collections.every((c) => c.length === 0);

    return values.every((v) => v == null || (Array.isArray(v) && v.length === 0));
  }
  return false;
}

/**
 * The server's own words for why a report is empty, when it supplies them.
 *
 * These surfaces were deliberately written to explain an absence rather than
 * show a zero - "That is an absence of measurement, not a result" is the
 * server's sentence, not ours. Falling straight through to a generic note
 * would throw that away and say something weaker in its place.
 */
export function serverStatement(data: unknown): string | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  for (const key of ['statement', 'summary', 'note', 'explanation', 'reason']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
}

function CockpitTab({ days }: { days: number }) {
  const chain = useQuery({
    queryKey: ['stylemint-cockpit-chain', days],
    queryFn: () => stylemintIntelligenceApi.cockpitChain({ days }),
    retry: false,
  });
  const decisions = useQuery({
    queryKey: ['stylemint-cockpit-decisions', days],
    queryFn: () => stylemintIntelligenceApi.cockpitDecisions({ days }),
    retry: false,
  });

  return (
    <div className="space-y-3">
      <ReportPanel
        title={`Signal to outcome chain — last ${days} days`}
        query={chain}
        emptyNote="No chain has been assembled for this window."
      />
      <ReportPanel
        title="Decisions in the window"
        query={decisions}
        emptyNote="No decisions were recorded in this window."
      />
    </div>
  );
}

function LedgerTab({ days }: { days: number }) {
  const [decisionId, setDecisionId] = useState('');
  const [lookup, setLookup] = useState('');

  const list = useQuery({
    queryKey: ['stylemint-ledger', days],
    queryFn: () => stylemintIntelligenceApi.ledger({ days }),
    retry: false,
  });

  const detail = useQuery({
    queryKey: ['stylemint-ledger-decision', lookup],
    queryFn: () => stylemintIntelligenceApi.ledgerDecision(lookup),
    enabled: !!lookup,
    retry: false,
  });

  return (
    <div className="space-y-3">
      <ReportPanel
        title={`Decisions on the record — last ${days} days`}
        query={list}
        emptyNote="No decisions were recorded in this window."
      />

      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Open one decision
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={decisionId}
            onChange={(e) => setDecisionId(e.target.value)}
            placeholder="Decision id from the list above"
            className="flex-1 rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          />
          <button
            disabled={!decisionId.trim()}
            onClick={() => setLookup(decisionId.trim())}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} /> Open
          </button>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          Recording an option, declaring an implementation window or filing an outcome measurement
          are long structured forms that belong with the decision they document — use the
          operations console for those.
        </p>
      </div>

      {lookup && (
        <ReportPanel
          title={`Decision ${lookup}`}
          query={detail}
          emptyNote="No decision with that id."
        />
      )}
    </div>
  );
}

function GenomeTab() {
  const [error, setError] = useState<string | null>(null);

  const diagnosis = useQuery({
    queryKey: ['stylemint-genome-diagnosis'],
    queryFn: () => stylemintIntelligenceApi.genomeDiagnosis(),
    retry: false,
  });
  const threshold = useQuery({
    queryKey: ['stylemint-genome-threshold'],
    queryFn: () => stylemintIntelligenceApi.genomeThreshold(),
    retry: false,
  });

  const diagnose = useMutation({
    mutationFn: () => stylemintIntelligenceApi.genomeDiagnose(),
    onSuccess: () => {
      setError(null);
      diagnosis.refetch();
    },
    onError: (caught: unknown) =>
      setError(caught instanceof Error ? caught.message : 'Diagnosis could not be run.'),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5">
        <div>
          <p className="text-sm font-bold text-text-primary">Re-run diagnosis</p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            Groups recorded failures by fingerprint so the recurring ones separate from the noise.
          </p>
        </div>
        <button
          disabled={diagnose.isPending}
          onClick={() => diagnose.mutate()}
          className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
        >
          {diagnose.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
          ) : (
            <Dna className="h-3.5 w-3.5" strokeWidth={1.6} />
          )}
          Diagnose
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      )}

      <ReportPanel
        title="Diagnosis"
        query={diagnosis}
        emptyNote="No failures have been diagnosed."
      />
      <ReportPanel
        title="Threshold"
        query={threshold}
        emptyNote="No threshold is configured."
      />
    </div>
  );
}

function AuroraTab() {
  const signals = useQuery({
    queryKey: ['stylemint-aurora-signals'],
    queryFn: () => stylemintIntelligenceApi.auroraSignals(),
    retry: false,
  });
  const owners = useQuery({
    queryKey: ['stylemint-aurora-owners'],
    queryFn: () => stylemintIntelligenceApi.auroraOwners(),
    retry: false,
  });

  return (
    <div className="space-y-3">
      <ReportPanel
        title="Related signals"
        query={signals}
        emptyNote="No signals have been related yet."
      />
      <ReportPanel
        title="Decision owners"
        query={owners}
        emptyNote="No decision owners are registered."
      />
    </div>
  );
}

function SimulationTab() {
  const [runId, setRunId] = useState('');
  const [lookup, setLookup] = useState('');

  const scenarios = useQuery({
    queryKey: ['stylemint-simulation-scenarios'],
    queryFn: () => stylemintIntelligenceApi.simulationScenarios(),
    retry: false,
  });

  const run = useQuery({
    queryKey: ['stylemint-simulation-run', lookup],
    queryFn: () => stylemintIntelligenceApi.simulationRun(lookup),
    enabled: !!lookup,
    retry: false,
  });

  return (
    <div className="space-y-3">
      <ReportPanel
        title="Available scenarios"
        query={scenarios}
        emptyNote="No simulation scenarios are defined."
      />

      <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          Open one run
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            placeholder="Run id"
            className="flex-1 rounded-sm border-thin border-border-subtle bg-bg-input px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:outline-none"
          />
          <button
            disabled={!runId.trim()}
            onClick={() => setLookup(runId.trim())}
            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-2 text-xs font-bold text-bg hover:bg-brand-light disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={1.6} /> Open
          </button>
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          Starting a study takes a scenario definition with its parameters — that form lives on the
          operations console, where the scenario contract is generated from the live schema.
        </p>
      </div>

      {lookup && (
        <ReportPanel title={`Run ${lookup}`} query={run} emptyNote="No run with that id." />
      )}
    </div>
  );
}

export { IntelligencePage as Component };
