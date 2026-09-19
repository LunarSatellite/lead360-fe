import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, RefreshCcw, TrendingUp } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { useCockpitChain, useCockpitDecisions } from '../hooks/intelligence.queries';
import {
  ATTRIBUTION_IS_TRACED,
  type AttributionCountDto,
  type ExecutiveDecisionTraceDto,
} from '../types/intelligence.types';
import {
  Absent,
  CountedFigure,
  Field,
  Limitations,
  MethodNote,
  MoneyBuckets,
  MoneyFigureCard,
  Panel,
  SurfaceHeader,
  WindowNote,
  formatUtc,
} from '../components/ReportPrimitives';

/**
 * The executive cockpit: signal → decision → settled money, and the size of
 * the gap between them.
 *
 * The headline of this screen is not a success figure. Today every registered
 * executor targets an abstract fingerprint rather than an order, a payout or
 * anything else a money module owns, so essentially every decision lands in
 * `TargetKindNotMoneyBearing` or `NoSettledOutcomeRecorded`. **That is the
 * finding.** It is shown at the top, in full, with the server's own label and
 * note for each bucket — not buried, not rounded away, and not turned into a
 * "coverage %" this console has no right to compute.
 *
 * Accordingly there is no total anywhere on this page. The server sends four
 * attribution counts; this page prints four attribution counts. Adding them up
 * to show a denominator would produce a number the server never asserted.
 */
function ExecutiveCockpitPage() {
  const [days, setDays] = useState(30);
  const chain = useCockpitChain({ days });
  const decisions = useCockpitDecisions({ days, page: 1, pageSize: 25 });

  const link = chain.data?.decisionToSettledMoney;
  const traced = link?.byAttribution.filter((a) => ATTRIBUTION_IS_TRACED[a.attribution]) ?? [];
  const untraced = link?.byAttribution.filter((a) => !ATTRIBUTION_IS_TRACED[a.attribution]) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<TrendingUp size={20} strokeWidth={1.6} className="text-brand" />}
        title="Executive cockpit"
        blurb="What the platform observed, what was decided about it, and which of those decisions can be traced to money that actually moved. The last link is the weak one, and this page says so rather than filling it in."
        actions={
          <>
            <WindowPicker days={days} onChange={setDays} />
            <button
              type="button"
              onClick={() => {
                void chain.refetch();
                void decisions.refetch();
              }}
              className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <RefreshCcw size={13} strokeWidth={1.6} />
              Refresh
            </button>
          </>
        }
      />

      {chain.isError && (
        <GovernanceRefusalNotice error={chain.error} onRefresh={() => void chain.refetch()} />
      )}
      {chain.isPending && <p className="text-xs font-medium text-text-muted">Reading the chain…</p>}

      {chain.data && (
        <>
          {/* ── The finding, first ── */}
          <Panel
            testId="attribution-panel"
            title="Decisions traced to settled money"
            subtitle={
              <>
                <WindowNote period={link!.period} />
                <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-text-secondary">
                  Each decision in the window falls into exactly one of the four buckets below.
                  They are the server&apos;s counts and its labels. This page does not add them
                  together, and it does not express any of them as a percentage of the others.
                </p>
              </>
            }
          >
            <MethodNote method={link!.method} />

            <div className="flex flex-col gap-2">
              <h3 className="text-2xs font-bold uppercase tracking-wide text-success">
                Traced to money that moved
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {traced.map((bucket) => (
                  <AttributionCard key={bucket.attribution} bucket={bucket} traced />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-2xs font-bold uppercase tracking-wide text-warning">
                Not traceable to money that moved
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {untraced.map((bucket) => (
                  <AttributionCard key={bucket.attribution} bucket={bucket} traced={false} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-2xs font-bold uppercase tracking-wide text-text-muted">
                Settled money actually traced to a decision
              </h3>
              <MoneyBuckets
                testId="traced-settled"
                buckets={link!.tracedSettledByCurrency}
                emptyState="NoSettledMoneyTracedToAnyDecision"
              />
              <span className="text-2xs font-medium text-text-muted">
                Source: {link!.tracedSettledSource}
              </span>
            </div>
          </Panel>

          {/* ── Signals observed ── */}
          <Panel
            testId="signals-panel"
            title="Signals observed"
            subtitle={<WindowNote period={chain.data.signals.period} />}
          >
            {chain.data.signals.bySource.length === 0 ? (
              <Absent
                state="NoSignalSourcesReported"
                meaning="No source recorded an observation in this window."
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {chain.data.signals.bySource.map((figure) => (
                  <CountedFigure
                    key={figure.key}
                    figure={figure}
                    testId={`signal-${figure.key}`}
                  />
                ))}
              </div>
            )}
          </Panel>

          {/* ── Decisions taken ── */}
          <Panel
            testId="decisions-panel"
            title="Decisions taken"
            subtitle={<WindowNote period={chain.data.decisions.period} />}
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-2xs font-bold uppercase tracking-wide text-text-muted">
                By status
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {chain.data.decisions.byStatus.map((figure) => (
                  <CountedFigure key={figure.key} figure={figure} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xs font-bold uppercase tracking-wide text-text-muted">
                By lifecycle event
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {chain.data.decisions.byLifecycleEvent.map((figure) => (
                  <CountedFigure key={figure.key} figure={figure} />
                ))}
              </div>
            </div>
          </Panel>

          {/* ── Signal → decision ── */}
          <Panel
            testId="signal-to-decision-panel"
            title="Decisions with an observed signal behind them"
            subtitle={<WindowNote period={chain.data.signalToDecision.period} />}
          >
            <MethodNote method={chain.data.signalToDecision.method} />
            <div className="grid gap-2 sm:grid-cols-2">
              <CountedFigure
                testId="with-signal"
                figure={chain.data.signalToDecision.decisionsWithObservedSignal}
              />
              <CountedFigure
                testId="without-signal"
                figure={chain.data.signalToDecision.decisionsWithoutObservedSignal}
                emphasis="finding"
              />
            </div>
          </Panel>

          {/* ── Money the platform holds ── */}
          <Panel title="Money recorded in the window">
            <div className="grid gap-2 lg:grid-cols-2">
              {chain.data.money.map((figure) => (
                <MoneyFigureCard key={figure.key} figure={figure} />
              ))}
            </div>
          </Panel>

          <Limitations items={chain.data.limitations} testId="cockpit-limitations" />
          <p className="text-2xs font-medium text-text-muted">
            Generated {formatUtc(chain.data.generatedUtc)}
          </p>
        </>
      )}

      {/* ── Per-decision traces ── */}
      <Panel
        testId="traces-panel"
        title="Decision traces"
        subtitle={
          decisions.data ? (
            <WindowNote period={decisions.data.period} source={decisions.data.source} />
          ) : undefined
        }
      >
        {decisions.isError && (
          <GovernanceRefusalNotice
            error={decisions.error}
            onRefresh={() => void decisions.refetch()}
          />
        )}
        {decisions.data?.items.length === 0 && (
          <Absent
            state="NoDecisionsInWindow"
            meaning="No governed decision was requested in this window."
          />
        )}
        {decisions.data && decisions.data.items.length > 0 && (
          <>
            <ul className="flex flex-col gap-2">
              {decisions.data.items.map((trace) => (
                <TraceRow key={trace.decisionId} trace={trace} />
              ))}
            </ul>
            <p className="text-2xs font-medium text-text-muted">
              Page {decisions.data.page} · page size {decisions.data.pageSize} ·{' '}
              {decisions.data.hasMore
                ? 'more traces exist beyond this page'
                : 'this is the last page'}
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}

function AttributionCard({
  bucket,
  traced,
}: {
  bucket: AttributionCountDto;
  traced: boolean;
}) {
  return (
    <div
      data-testid={`attribution-${bucket.attribution}`}
      data-attribution={bucket.attribution}
      data-count={bucket.count}
      className={`flex flex-col gap-1 rounded-card border-thin p-3 ${
        traced ? 'border-success/40 bg-success-soft' : 'border-warning/40 bg-warning-soft'
      }`}
    >
      <span className="font-mono text-2xs font-black uppercase tracking-wide text-text-muted">
        {bucket.attribution}
      </span>
      <span
        className={`font-mono text-2xl font-black tabular-nums ${
          traced ? 'text-success' : 'text-warning'
        }`}
      >
        {bucket.count.toLocaleString('en-US')}
      </span>
      <span className="text-2xs font-medium leading-relaxed text-text-secondary">
        {bucket.label}
      </span>
    </div>
  );
}

function TraceRow({ trace }: { trace: ExecutiveDecisionTraceDto }) {
  return (
    <li
      data-testid={`trace-${trace.decisionId}`}
      className="flex flex-col gap-2 rounded-card border-thin border-border-subtle bg-glass-1 p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={ROUTES.dashboard.intelCockpitDecision(trace.decisionId)}
          className="font-mono text-sm font-extrabold text-text-primary underline decoration-border-medium underline-offset-4 hover:text-brand"
        >
          {trace.actionKey}
        </Link>
        <span className="flex items-center gap-2">
          <span className="rounded-xs border-thin border-border-medium px-1.5 py-0.5 font-mono text-2xs font-bold text-text-secondary">
            {trace.status}
          </span>
          <span className="rounded-xs border-thin border-border-medium px-1.5 py-0.5 font-mono text-2xs font-bold text-text-secondary">
            {trace.riskTier}
          </span>
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Target">
          <span className="font-mono">
            {trace.targetKind}/{trace.targetId}
          </span>
        </Field>
        <Field label="Requested by">{trace.requestingAgent}</Field>
        <Field label="Observed signal" testId={`signal-${trace.decisionId}`}>
          {trace.observedSignal ? (
            <>
              {trace.observedSignal.observationCount.toLocaleString('en-US')} observation
              {trace.observedSignal.observationCount === 1 ? '' : 's'} from{' '}
              {trace.observedSignal.source}, matched by {trace.observedSignal.matchMethod}
            </>
          ) : (
            <Absent
              state="NoObservedSignalMatched"
              meaning="Nothing recorded links an observation to this decision."
            />
          )}
        </Field>
        <Field label="Settled outcome" testId={`settled-${trace.decisionId}`}>
          {trace.settledOutcome ? (
            <span className="font-mono font-black">
              {trace.settledOutcome.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
              {trace.settledOutcome.currency}
              <span className="block text-2xs font-medium text-text-muted">
                settled {formatUtc(trace.settledOutcome.settledUtc)} · {trace.settledOutcome.source}
              </span>
            </span>
          ) : (
            <Absent state={trace.attribution} meaning={trace.attributionNote} />
          )}
        </Field>
      </div>
    </li>
  );
}

/**
 * The lookback. The server defaults to 30 days and labels every figure with
 * the window it produced, so changing this changes the label too — the reader
 * is never left guessing which period a number covers.
 */
export function WindowPicker({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <Activity size={13} strokeWidth={1.6} className="text-text-muted" />
      <span className="sr-only">Lookback window</span>
      <select
        value={days}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-sm border-thin border-border-medium bg-bg-input px-2 py-2 text-xs font-bold text-text-secondary"
      >
        <option value={7}>Last 7 days</option>
        <option value={30}>Last 30 days</option>
        <option value={90}>Last 90 days</option>
      </select>
    </label>
  );
}

export { ExecutiveCockpitPage as Component };
export default ExecutiveCockpitPage;
