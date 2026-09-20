import { useState } from 'react';
import { Gauge, Plus, RefreshCcw } from 'lucide-react';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import {
  useActionLimits,
  useDeclareExpectation,
  useDeclareMaintenanceWindow,
  useMaintenanceWindows,
  useOperationMonitor,
} from '../hooks/intelligence.queries';
import type {
  OperationExpectationComparison,
  OperationMonitorRow,
  OperationOutcomeComparisonView,
} from '../types/intelligence.types';
import {
  Absent,
  Field,
  Panel,
  SurfaceHeader,
  formatUtc,
} from '../components/ReportPrimitives';
import { MeasuredValue } from '../components/FigureValue';

/**
 * Autonomous operations: what ran on its own, what was expected of it, and
 * what nobody checked.
 *
 * The monitor's headline counts are the two gaps, and the server reports both
 * as first-class numbers rather than leaving them to be inferred:
 *
 *   - `decisionsWithNoExpectationDeclared` — it ran and nobody said in advance
 *     what it was supposed to achieve. There is nothing to hold it to.
 *   - `expectationsWithNoMeasurementRecorded` — someone said what it should
 *     achieve and nobody went back to check.
 *
 * Both are shown before the rows, as sent. This page computes no rate, no
 * coverage figure and no composite health number out of them; each count
 * carries the window it covers and the source it came from.
 */
function AutonomousOperationsPage() {
  const monitor = useOperationMonitor({ skip: 0, take: 50 });
  const maintenance = useMaintenanceWindows();
  const limits = useActionLimits();

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<Gauge size={20} strokeWidth={1.6} className="text-brand" />}
        title="Autonomous operations"
        blurb="Decisions that executed without a person in the loop, the expectations declared for them in advance, and whether anyone measured what actually happened."
        actions={
          <button
            type="button"
            onClick={() => {
              void monitor.refetch();
              void maintenance.refetch();
              void limits.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <RefreshCcw size={13} strokeWidth={1.6} />
            Refresh
          </button>
        }
      />

      {monitor.isError && (
        <GovernanceRefusalNotice error={monitor.error} onRefresh={() => void monitor.refetch()} />
      )}
      {monitor.isPending && (
        <p className="text-xs font-medium text-text-muted">Reading the monitor…</p>
      )}

      {monitor.data && (
        <>
          <Panel
            testId="monitor-counts"
            title="What ran, and what nobody checked"
            subtitle={
              <span className="block text-2xs font-medium leading-relaxed text-text-muted">
                <span className="font-bold text-text-secondary">Window</span> ·{' '}
                {formatUtc(monitor.data.windowFromUtc)} → {formatUtc(monitor.data.windowToUtc)}
              </span>
            }
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <MonitorCount
                testId="executed-decisions"
                label="Executed decisions in window"
                value={monitor.data.executedDecisionsInWindow}
                source={monitor.data.decisionSource}
                from={monitor.data.windowFromUtc}
                to={monitor.data.windowToUtc}
              />
              <MonitorCount
                testId="expectations-declared"
                label="Expectations declared in window"
                value={monitor.data.expectationsDeclaredInWindow}
                source={monitor.data.expectationSource}
                from={monitor.data.windowFromUtc}
                to={monitor.data.windowToUtc}
              />
              <MonitorCount
                testId="no-expectation-declared"
                label="Decisions with no expectation declared"
                value={monitor.data.decisionsWithNoExpectationDeclared}
                source={monitor.data.decisionSource}
                from={monitor.data.windowFromUtc}
                to={monitor.data.windowToUtc}
                tone="finding"
                note="They ran, and nobody said in advance what they were supposed to achieve."
              />
              <MonitorCount
                testId="no-measurement-recorded"
                label="Expectations with no measurement recorded"
                value={monitor.data.expectationsWithNoMeasurementRecorded}
                source={monitor.data.outcomeSource}
                from={monitor.data.windowFromUtc}
                to={monitor.data.windowToUtc}
                tone="finding"
                note="Someone said what should happen. Nobody went back to check."
              />
              <MonitorCount
                testId="not-yet-observable"
                label="Expectations not yet observable"
                value={monitor.data.expectationsNotYetObservable}
                source={monitor.data.expectationSource}
                from={monitor.data.windowFromUtc}
                to={monitor.data.windowToUtc}
                note="The observation window has not closed yet. Nobody is late."
              />
              <MonitorCount
                testId="compared-to-measurement"
                label="Expectations compared to a measurement"
                value={monitor.data.expectationsComparedToAMeasurement}
                source={monitor.data.outcomeSource}
                from={monitor.data.windowFromUtc}
                to={monitor.data.windowToUtc}
              />
            </div>
          </Panel>

          <Panel testId="monitor-rows" title="Executed decisions">
            {monitor.data.rows.length === 0 ? (
              <Absent
                state="NoDecisionsExecutedInWindow"
                meaning="Nothing executed autonomously in this window."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {monitor.data.rows.map((row) => (
                  <MonitorRow key={row.decisionId} row={row} />
                ))}
              </ul>
            )}
          </Panel>

          <Panel testId="maintenance-panel" title="Maintenance windows">
            {maintenance.isError && (
              <GovernanceRefusalNotice
                error={maintenance.error}
                onRefresh={() => void maintenance.refetch()}
              />
            )}
            {maintenance.data?.length === 0 && (
              <Absent
                state="NoMaintenanceWindowDeclared"
                meaning="No maintenance window has been declared."
              />
            )}
            {maintenance.data && maintenance.data.length > 0 && (
              <ul className="flex flex-col gap-2">
                {maintenance.data.map((window) => (
                  <li
                    key={window.id}
                    data-testid={`maintenance-${window.id}`}
                    data-lifted={window.liftedUtc !== null}
                    className="flex flex-col gap-1.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3"
                  >
                    <span className="font-mono text-xs font-extrabold text-text-primary">
                      {window.actionKey}
                    </span>
                    <span className="text-2xs font-medium text-text-secondary">
                      {formatUtc(window.startsUtc)} → {formatUtc(window.endsUtc)} · {window.reason}
                    </span>
                    <Field label="Lifted">
                      {window.liftedUtc ? (
                        formatUtc(window.liftedUtc)
                      ) : (
                        <Absent state="NotLifted" meaning="This window is still in force." />
                      )}
                    </Field>
                  </li>
                ))}
              </ul>
            )}
            <DeclareMaintenanceWindowForm />
          </Panel>

          <Panel testId="limits-panel" title="Action limits">
            {limits.isError && (
              <GovernanceRefusalNotice error={limits.error} onRefresh={() => void limits.refetch()} />
            )}
            {limits.data?.length === 0 && (
              <Absent
                state="NoActionLimitDeclared"
                meaning="No execution limit has been declared for any action."
              />
            )}
            {limits.data && limits.data.length > 0 && (
              <ul className="flex flex-col gap-2">
                {limits.data.map((limit) => (
                  <li
                    key={limit.id}
                    data-testid={`limit-${limit.actionKey}`}
                    className="flex flex-col gap-1.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3"
                  >
                    <span className="font-mono text-xs font-extrabold text-text-primary">
                      {limit.actionKey}
                    </span>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <Field label="Permitted executions">
                        <span className="font-mono tabular-nums">
                          {limit.permittedExecutions} per {limit.windowMinutes} min
                        </span>
                      </Field>
                      <Field label="Counted in window">
                        <span className="font-mono text-lg font-black tabular-nums">
                          {limit.executionsCountedInWindow}
                        </span>
                      </Field>
                      <Field label="Counted between">
                        {formatUtc(limit.countedFromUtc)} → {formatUtc(limit.countedToUtc)}
                      </Field>
                    </div>
                    <span className="text-2xs font-medium text-text-muted">
                      Counted from {limit.countedFromSource}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

/**
 * One of the monitor's counts, always with its window and its source.
 *
 * `tone="finding"` marks the two gap counts. It changes colour and nothing
 * else — it adds no threshold, no target and no judgement about whether the
 * number is acceptable.
 */
function MonitorCount({
  label,
  value,
  source,
  from,
  to,
  tone = 'normal',
  note,
  testId,
}: {
  label: string;
  value: number;
  source: string;
  from: string;
  to: string;
  tone?: 'normal' | 'finding';
  note?: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      data-count={value}
      className={`flex flex-col gap-1 rounded-card border-thin p-3 ${
        tone === 'finding' ? 'border-warning/40 bg-warning-soft' : 'border-border-subtle bg-bg-card'
      }`}
    >
      <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">{label}</span>
      <span
        className={`font-mono text-2xl font-black tabular-nums ${
          tone === 'finding' ? 'text-warning' : 'text-text-primary'
        }`}
      >
        {value.toLocaleString('en-US')}
      </span>
      {note ? (
        <span className="text-2xs font-medium leading-relaxed text-text-secondary">{note}</span>
      ) : null}
      <span className="block text-2xs font-medium leading-relaxed text-text-muted">
        {formatUtc(from)} → {formatUtc(to)} · source: {source}
      </span>
    </div>
  );
}

const COMPARISON_WORDING: Record<
  OperationExpectationComparison,
  { headline: string; tone: string }
> = {
  Unspecified: {
    headline: 'The server sent no comparison state for this expectation.',
    tone: 'border-danger/40 bg-danger-soft text-danger',
  },
  NotYetObservable: {
    headline: 'The observation window has not closed yet, so there is nothing to compare.',
    tone: 'border-border-medium bg-glass-2 text-text-secondary',
  },
  NoMeasurementRecorded: {
    headline: 'The window closed and nobody recorded a measurement.',
    tone: 'border-warning/40 bg-warning-soft text-warning',
  },
  MeasurementRecorded: {
    headline: 'A measurement was recorded against this expectation.',
    tone: 'border-success/40 bg-success-soft text-success',
  },
};

function ComparisonBlock({ comparison }: { comparison: OperationOutcomeComparisonView }) {
  const wording = COMPARISON_WORDING[comparison.comparison];
  return (
    <li
      data-testid={`comparison-${comparison.measureKey}`}
      data-comparison={comparison.comparison}
      className={`flex flex-col gap-2 rounded-sm border-thin p-2.5 ${wording.tone}`}
    >
      <span className="font-mono text-2xs font-black uppercase tracking-wide">
        {comparison.comparison}
      </span>
      <p className="text-xs font-bold leading-relaxed">{wording.headline}</p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Expected">
          <span className="font-mono tabular-nums">
            {comparison.expectedValue.toLocaleString('en-US')} {comparison.expectedUnit}
          </span>
          <span className="block text-2xs font-medium text-text-muted">
            {comparison.measureKey} · to be measured by {comparison.expectedMeasurementSource} ·
            observe {formatUtc(comparison.observeFromUtc)} → {formatUtc(comparison.observeToUtc)}
          </span>
        </Field>
        <Field label="Measured" testId={`measured-${comparison.measureKey}`}>
          {comparison.measuredValue !== null &&
          comparison.measuredUnit !== null &&
          comparison.measurementSource !== null &&
          comparison.observedFromUtc !== null &&
          comparison.observedToUtc !== null ? (
            <MeasuredValue
              figure={{
                measureKey: comparison.measureKey,
                unit: comparison.measuredUnit,
                measuredValue: comparison.measuredValue,
                measurementSource: comparison.measurementSource,
                observedFromUtc: comparison.observedFromUtc,
                observedToUtc: comparison.observedToUtc,
              }}
            />
          ) : (
            <Absent state={comparison.comparison} meaning={wording.headline} />
          )}
        </Field>
      </div>

      <Field label="Difference from expected" testId={`difference-${comparison.measureKey}`}>
        {comparison.differenceFromExpected !== null ? (
          <span className="font-mono tabular-nums">
            {comparison.differenceFromExpected.toLocaleString('en-US')} {comparison.expectedUnit}{' '}
            <span className="text-2xs font-medium text-text-muted">(computed by the server)</span>
          </span>
        ) : (
          <Absent
            state="DifferenceNotComputable"
            meaning="There is no measurement to subtract an expectation from, and this console does not subtract one for the server."
          />
        )}
      </Field>
    </li>
  );
}

function MonitorRow({ row }: { row: OperationMonitorRow }) {
  return (
    <li
      data-testid={`monitor-row-${row.decisionId}`}
      className="flex flex-col gap-2.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm font-extrabold text-text-primary">{row.actionKey}</span>
        <span className="rounded-xs border-thin border-border-medium px-1.5 py-0.5 font-mono text-2xs font-bold text-text-secondary">
          {row.status}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Target">
          <span className="font-mono">
            {row.targetKind}/{row.targetId}
          </span>
        </Field>
        <Field label="Requesting agent">{row.requestingAgent}</Field>
        <Field label="Executed">{formatUtc(row.executedUtc)}</Field>
        <Field label="Approved by" testId={`approver-${row.decisionId}`}>
          {row.approvedByAccountId ? (
            <span className="font-mono">{row.approvedByAccountId}</span>
          ) : (
            <Absent
              state="NoApproverRecorded"
              meaning="This ran without a recorded human approver."
            />
          )}
        </Field>
      </div>

      {row.expectationsDeclaredCount === 0 ? (
        <Absent
          testId={`no-expectation-${row.decisionId}`}
          state="NoExpectationDeclared"
          meaning="Nobody declared in advance what this action was supposed to achieve, so there is nothing to hold it to."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {row.comparisons.map((comparison) => (
            <ComparisonBlock key={comparison.measureKey} comparison={comparison} />
          ))}
        </ul>
      )}

      <DeclareExpectationForm decisionId={row.decisionId} />
    </li>
  );
}

/**
 * Declare in advance what a decision was supposed to achieve.
 *
 * This is the one write on this surface, and it is the write the whole screen
 * argues for: a `decisionsWithNoExpectationDeclared` count only falls when
 * someone states an expectation. Nothing here edits, lifts or removes a
 * maintenance window or an action limit — those are read-only on this console.
 */
/**
 * Pause one action for a stated span and a stated reason.
 *
 * The read side of this panel arrived with the console; the write did not, and lived on a tab of
 * the old Intelligence page. That tab is gone, so it moves here, beside the windows it creates.
 *
 * End is required and validated against start: a window with no end is an action switched off,
 * which is a different decision and is not made from here.
 */
function DeclareMaintenanceWindowForm() {
  const declare = useDeclareMaintenanceWindow();
  const [open, setOpen] = useState(false);
  const [actionKey, setActionKey] = useState('');
  const [startsUtc, setStartsUtc] = useState('');
  const [endsUtc, setEndsUtc] = useState('');
  const [reason, setReason] = useState('');

  const inputClass =
    'rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1';
  const labelClass = 'flex flex-1 flex-col gap-1 text-2xs font-bold text-text-secondary';
  const buttonClass =
    'inline-flex w-fit items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-50';

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <Plus size={13} strokeWidth={1.8} />
        Pause an action
      </button>
    );
  }

  const ends = endsUtc && startsUtc && endsUtc <= startsUtc;

  return (
    <form
      className="flex flex-col gap-2 rounded-card border-thin border-border-medium bg-bg-card p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ends) return;
        declare.mutate(
          {
            actionKey,
            startsUtc: new Date(startsUtc).toISOString(),
            endsUtc: new Date(endsUtc).toISOString(),
            reason,
          },
          { onSuccess: () => setOpen(false) },
        );
      }}
    >
      <div className="flex flex-wrap gap-2">
        <label className={labelClass}>
          Action key
          <input
            required
            value={actionKey}
            onChange={(e) => setActionKey(e.target.value)}
            placeholder="e.g. pricing.reprice"
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className={labelClass}>
          Starts
          <input
            required
            type="datetime-local"
            value={startsUtc}
            onChange={(e) => setStartsUtc(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Ends
          <input
            required
            type="datetime-local"
            value={endsUtc}
            onChange={(e) => setEndsUtc(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        Reason
        <input
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this action is paused"
          className={inputClass}
        />
      </label>
      {ends && (
        <p className="text-2xs font-medium text-rose-300">The window has to end after it starts.</p>
      )}
      {declare.isError && (
        <GovernanceRefusalNotice error={declare.error} onRefresh={() => declare.reset()} />
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={declare.isPending || !!ends} className={buttonClass}>
          {declare.isPending ? 'Declaring…' : 'Declare window'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function DeclareExpectationForm({ decisionId }: { decisionId: string }) {
  const declare = useDeclareExpectation(decisionId);
  const [open, setOpen] = useState(false);
  const [measureKey, setMeasureKey] = useState('');
  const [measureUnit, setMeasureUnit] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [expectedMeasurementSource, setExpectedMeasurementSource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const inputClass =
    'rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1';
  const labelClass = 'flex flex-1 flex-col gap-1 text-2xs font-bold text-text-secondary';
  const buttonClass =
    'inline-flex w-fit items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-50';

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <Plus size={13} strokeWidth={1.8} />
        Declare an expectation
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-card border-thin border-border-medium bg-bg-card p-3"
      onSubmit={(event) => {
        event.preventDefault();
        declare.mutate(
          {
            measureKey,
            measureUnit,
            expectedValue: Number(expectedValue),
            expectedMeasurementSource,
            observeFromUtc: new Date(from).toISOString(),
            observeToUtc: new Date(to).toISOString(),
          },
          { onSuccess: () => setOpen(false) },
        );
      }}
    >
      <div className="flex flex-wrap gap-2">
        <label className={labelClass}>
          Measure key
          <input
            required
            value={measureKey}
            onChange={(e) => setMeasureKey(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Unit
          <input
            required
            value={measureUnit}
            onChange={(e) => setMeasureUnit(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Expected value
          <input
            required
            type="number"
            step="any"
            value={expectedValue}
            onChange={(e) => setExpectedValue(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className={labelClass}>
          Observe from (UTC)
          <input
            required
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Observe to (UTC)
          <input
            required
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          To be measured by
          <input
            required
            value={expectedMeasurementSource}
            onChange={(e) => setExpectedMeasurementSource(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      {declare.isError && <GovernanceRefusalNotice error={declare.error} />}
      <div className="flex gap-2">
        <button type="submit" disabled={declare.isPending} className={buttonClass}>
          {declare.isPending ? 'Declaring…' : 'Declare expectation'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export { AutonomousOperationsPage as Component };
export default AutonomousOperationsPage;
