import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Scale, Search } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { stylemintIntelligenceApi } from '../api/stylemint-intelligence.api';
import { ReportPanel } from '../components/ReportPanel';
import { ConstitutionTab } from '../components/ConstitutionPanel';

/**
 * The two decision-intelligence surfaces that have no page of their own.
 *
 * This page used to carry nine tabs. Seven of them - the executive cockpit, the decision ledger,
 * failure diagnosis, related signals, autonomous operations, the decision twin and the cart-offer
 * readout - were built twice, once here as a tab and once in `intelligence-console` and
 * `decision-twin` as dedicated pages. The pages won: a decision, a fingerprint or a study each
 * get a real URL you can send to someone, where a tab asked you to paste an id into a box. They
 * also carry the multi-field ledger writes this page had deliberately skipped.
 *
 * What is left is what those pages do not cover:
 *
 *  - **Retail simulation** - the scenario catalogue, and one run by id. A run is not a study:
 *    every arm of a twin study IS an ordinary simulation run, so this is the surface that opens
 *    the arm the twin only summarises.
 *  - **Commerce constitution** - the rules an agent action is assessed against, and the dry run
 *    that reports what they would allow. Nothing else reaches it at all.
 *
 * The tab still lives in the URL rather than in state, so both stay linkable.
 */

type Tab = 'simulation' | 'constitution';

const TABS: Array<{ id: Tab; label: string; icon: typeof FlaskConical }> = [
  { id: 'simulation', label: 'Retail simulation', icon: FlaskConical },
  { id: 'constitution', label: 'Commerce constitution', icon: Scale },
];

/** The tab the page opens on when the URL does not name one. */
export const DEFAULT_TAB: Tab = 'simulation';

export function isIntelligenceTab(value: string | undefined): value is Tab {
  return TABS.some((t) => t.id === value);
}

export function IntelligencePage() {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  // A tab name that is not one of these - including the seven that moved to their own pages -
  // rewrites itself rather than rendering a blank page under a URL that lies, so an old link to
  // /intelligence/cockpit lands somewhere real instead of breaking.
  if (tabParam !== undefined && !isIntelligenceTab(tabParam)) {
    return <Navigate to={ROUTES.dashboard.intelligenceTab(DEFAULT_TAB)} replace />;
  }

  const tab: Tab = isIntelligenceTab(tabParam) ? tabParam : DEFAULT_TAB;
  const setTab = (next: Tab) => navigate(ROUTES.dashboard.intelligenceTab(next));

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
          Stylemint commerce platform
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
          <FlaskConical className="h-5 w-5 text-brand" strokeWidth={1.6} />
          Simulation and constitution
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          What a decision was modelled against, and the rules it had to satisfy. The cockpit,
          ledger, diagnosis, signals, autonomous operations and the decision twin each have their
          own page.
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

      {tab === 'simulation' && <SimulationTab />}
      {tab === 'constitution' && <ConstitutionTab />}
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
          Opening a study takes a scenario definition with its parameters - that form is on the
          decision twin, which generates it from the live scenario contract.
        </p>
      </div>

      {lookup && (
        <ReportPanel title={`Run ${lookup}`} query={run} emptyNote="No run with that id." />
      )}
    </div>
  );
}

export { IntelligencePage as Component };
