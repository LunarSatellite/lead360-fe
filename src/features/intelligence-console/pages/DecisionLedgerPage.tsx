import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RefreshCcw } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { useDecisionLedger } from '../hooks/intelligence.queries';
import {
  Absent,
  CountedFigure,
  Limitations,
  Panel,
  SurfaceHeader,
  WindowNote,
  formatUtc,
} from '../components/ReportPrimitives';
import { WindowPicker } from './ExecutiveCockpitPage';

/**
 * The decision memory ledger.
 *
 * Four things are recorded about a decision: what was chosen, who owned it,
 * what else was considered, and what was measured afterwards. The platform can
 * derive the first two from the governed action. It cannot derive the other
 * two, so unless an operator wrote them down the ledger reads `NotRecorded` —
 * and this page shows that rather than an empty column.
 *
 * `unrecordedElements` at the top is the **server's** count of those gaps.
 * This page prints it as sent; it does not walk the items and tally them
 * itself, because the server's count covers the whole window while the page
 * holds one page of it.
 */
function DecisionLedgerPage() {
  const [days, setDays] = useState(30);
  const ledger = useDecisionLedger({ days, page: 1, pageSize: 25 });

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<BookOpen size={20} strokeWidth={1.6} className="text-brand" />}
        title="Decision memory ledger"
        blurb="What was decided, what else was on the table, when the work was meant to run, and what was measured afterwards. The last three are things only a person can record — where nobody has, the ledger says so."
        actions={
          <>
            <WindowPicker days={days} onChange={setDays} />
            <button
              type="button"
              onClick={() => void ledger.refetch()}
              className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <RefreshCcw size={13} strokeWidth={1.6} />
              Refresh
            </button>
          </>
        }
      />

      {ledger.isError && (
        <GovernanceRefusalNotice error={ledger.error} onRefresh={() => void ledger.refetch()} />
      )}
      {ledger.isPending && (
        <p className="text-xs font-medium text-text-muted">Reading the ledger…</p>
      )}

      {ledger.data && (
        <>
          <Panel
            testId="unrecorded-panel"
            title="What has not been recorded"
            subtitle={
              <>
                <WindowNote period={ledger.data.period} />
                <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-text-secondary">
                  Counted by the server across the whole window, not by this page across one page
                  of results.
                </p>
              </>
            }
          >
            {ledger.data.unrecordedElements.length === 0 ? (
              <Absent
                state="NoUnrecordedElementsReported"
                meaning="The server reported no gap counts for this window."
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {ledger.data.unrecordedElements.map((figure) => (
                  <CountedFigure
                    key={figure.key}
                    figure={figure}
                    emphasis="finding"
                    testId={`unrecorded-${figure.key}`}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            testId="ledger-list"
            title="Decisions in the window"
            subtitle={<WindowNote period={ledger.data.period} />}
          >
            {ledger.data.items.length === 0 ? (
              <Absent
                state="NoDecisionsInWindow"
                meaning="No governed decision was requested in this window."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {ledger.data.items.map((entry) => (
                  <li
                    key={entry.decisionId}
                    data-testid={`ledger-row-${entry.decisionId}`}
                    className="flex flex-wrap items-center gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-3"
                  >
                    <Link
                      to={ROUTES.dashboard.intelLedgerEntry(entry.decisionId)}
                      className="font-mono text-sm font-extrabold text-text-primary underline decoration-border-medium underline-offset-4 hover:text-brand"
                    >
                      {entry.choiceMade.actionKey}
                    </Link>
                    <span className="font-mono text-2xs text-text-muted">
                      {entry.choiceMade.targetKind}/{entry.choiceMade.targetId}
                    </span>
                    <span className="ml-auto flex flex-wrap items-center gap-1.5">
                      <StateChip value={entry.optionsConsidered.state} />
                      <StateChip value={entry.implementationWindow.state} />
                      <StateChip
                        value={entry.measuredResult.state}
                        testId={`outcome-chip-${entry.decisionId}`}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-2xs font-medium text-text-muted">
              Page {ledger.data.page} · page size {ledger.data.pageSize} ·{' '}
              {ledger.data.hasMore ? 'more entries exist beyond this page' : 'this is the last page'}{' '}
              · generated {formatUtc(ledger.data.generatedUtc)}
            </p>
          </Panel>

          <Limitations items={ledger.data.limitations} testId="ledger-limitations" />
        </>
      )}
    </div>
  );
}

/**
 * A state token, printed verbatim.
 *
 * Every "not recorded" variant gets the same amber treatment but keeps its own
 * word, so `OptionsNotRecorded`, `WindowNotDeclared`, `OutcomeNotMeasured` and
 * `DecisionNotExecuted` stay four distinguishable things at a glance.
 */
function StateChip({ value, testId }: { value: string; testId?: string }) {
  const settled = value === 'OptionsRecorded' || value === 'WindowDeclared';
  const measured = value === 'OutcomeMeasured';
  const neutral = value === 'DecisionNotExecuted';
  return (
    <span
      data-testid={testId}
      data-state={value}
      className={`rounded-xs border-thin px-1.5 py-0.5 font-mono text-2xs font-bold ${
        measured || settled
          ? 'border-success/40 bg-success-soft text-success'
          : neutral
            ? 'border-border-medium bg-glass-2 text-text-secondary'
            : 'border-warning/40 border-dashed bg-warning-soft text-warning'
      }`}
    >
      {value}
    </span>
  );
}

export { DecisionLedgerPage as Component };
export default DecisionLedgerPage;
