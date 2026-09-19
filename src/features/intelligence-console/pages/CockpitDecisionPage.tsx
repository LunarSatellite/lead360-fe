import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Route as RouteIcon } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { useCockpitDecision } from '../hooks/intelligence.queries';
import {
  Absent,
  Field,
  MoneyBuckets,
  Panel,
  SurfaceHeader,
  formatUtc,
} from '../components/ReportPrimitives';

/**
 * One decision, end to end.
 *
 * The three links in the chain — the signal behind it, the decision itself,
 * the money that followed — are shown as three separate blocks, and any of
 * them may be absent. A missing settled outcome is labelled with the server's
 * `attribution` and `attributionNote`, so the reader learns *why* the money is
 * not there: the decision was never executed, or its target is not a kind any
 * money module owns, or nothing settled against it. Those are three different
 * sentences and this page prints whichever one the server sent.
 */
function CockpitDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const decision = useCockpitDecision(id);

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<RouteIcon size={20} strokeWidth={1.6} className="text-brand" />}
        title="Decision trace"
        blurb="One governed decision, the observation that preceded it, and the settled money that did or did not follow."
        actions={
          <Link
            to={ROUTES.dashboard.intelCockpit}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <ArrowLeft size={13} strokeWidth={1.6} />
            Back to cockpit
          </Link>
        }
      />

      {decision.isError && (
        <GovernanceRefusalNotice error={decision.error} onRefresh={() => void decision.refetch()} />
      )}
      {decision.isPending && (
        <p className="text-xs font-medium text-text-muted">Reading the trace…</p>
      )}

      {decision.data && (
        <>
          <Panel testId="choice-panel" title="The decision">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Action key">
                <span className="font-mono font-extrabold">{decision.data.actionKey}</span>
              </Field>
              <Field label="Target">
                <span className="font-mono">
                  {decision.data.targetKind}/{decision.data.targetId}
                </span>
              </Field>
              <Field label="Requesting agent">{decision.data.requestingAgent}</Field>
              <Field label="Status">
                <span className="font-mono">{decision.data.status}</span>
              </Field>
              <Field label="Risk tier">
                <span className="font-mono">{decision.data.riskTier}</span>
              </Field>
              <Field label="Requested">{formatUtc(decision.data.requestedUtc)}</Field>
              <Field label="Decided" testId="decided-at">
                {decision.data.decidedUtc ? (
                  formatUtc(decision.data.decidedUtc)
                ) : (
                  <Absent state="NotDecided" meaning="Nobody has decided this action yet." />
                )}
              </Field>
              <Field label="Executed" testId="executed-at">
                {decision.data.executedUtc ? (
                  formatUtc(decision.data.executedUtc)
                ) : (
                  <Absent state="NotExecuted" meaning="This action was never carried out." />
                )}
              </Field>
              <Field label="Rolled back" testId="rolled-back-at">
                {decision.data.rolledBackUtc ? (
                  formatUtc(decision.data.rolledBackUtc)
                ) : (
                  <Absent state="NotRolledBack" />
                )}
              </Field>
              <Field label="Approved by" testId="approved-by">
                {decision.data.approvedByAccountId ? (
                  <span className="font-mono">{decision.data.approvedByAccountId}</span>
                ) : (
                  <Absent
                    state="NoApproverRecorded"
                    meaning="No account is recorded as having approved this action."
                  />
                )}
              </Field>
            </div>
          </Panel>

          <Panel testId="signal-panel" title="The signal behind it">
            {decision.data.observedSignal ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Observations">
                  <span className="font-mono text-lg font-black tabular-nums">
                    {decision.data.observedSignal.observationCount.toLocaleString('en-US')}
                  </span>
                </Field>
                <Field label="Source">{decision.data.observedSignal.source}</Field>
                <Field label="Matched by">{decision.data.observedSignal.matchMethod}</Field>
                <Field label="Observed between">
                  {formatUtc(decision.data.observedSignal.firstObservedUtc)} →{' '}
                  {formatUtc(decision.data.observedSignal.lastObservedUtc)}
                </Field>
              </div>
            ) : (
              <Absent
                state="NoObservedSignalMatched"
                meaning="Nothing recorded links an observation to this decision. That does not mean no signal existed — it means none was matched."
              />
            )}
          </Panel>

          <Panel testId="money-panel" title="The money that followed">
            {decision.data.settledOutcome ? (
              <>
                <MoneyBuckets
                  testId="decision-settled"
                  buckets={[
                    {
                      currency: decision.data.settledOutcome.currency,
                      amount: decision.data.settledOutcome.amount,
                      count: 1,
                    },
                  ]}
                  emptyState="NoSettledOutcomeRecorded"
                />
                <p className="text-2xs font-medium text-text-muted">
                  Settled {formatUtc(decision.data.settledOutcome.settledUtc)} against{' '}
                  {decision.data.settledOutcome.targetKind}/{decision.data.settledOutcome.targetId}{' '}
                  · source {decision.data.settledOutcome.source}
                </p>
              </>
            ) : (
              <Absent
                testId="no-settled-outcome"
                state={decision.data.attribution}
                meaning={decision.data.attributionNote}
              />
            )}
          </Panel>

          <Link
            to={ROUTES.dashboard.intelLedgerEntry(decision.data.decisionId)}
            className="w-fit rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            Open this decision in the memory ledger
          </Link>
        </>
      )}
    </div>
  );
}

export { CockpitDecisionPage as Component };
export default CockpitDecisionPage;
