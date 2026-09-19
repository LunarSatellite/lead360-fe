import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Network, RefreshCcw } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceRefusalNotice } from '@/features/agent-governance/components/GovernanceRefusalNotice';
import { SimulatedValue } from '@/features/intelligence-console/components/FigureValue';
import {
  Absent,
  Field,
  Limitations,
  Panel,
  SurfaceHeader,
  formatUtc,
} from '@/features/intelligence-console/components/ReportPrimitives';
import { useDecisionTwinStudy, useRecordDecisionTwinOutcome } from '../hooks/decision-twin.queries';
import {
  ArmSpread,
  EmptySection,
  HorizonValue,
  Reproducibility,
  SimulationBanner,
  StatedValue,
} from '../components/TwinPrimitives';
import type {
  DecisionTwinArm,
  DecisionTwinComparisonRow,
  DecisionTwinConstraint,
  DecisionTwinLearning,
  DecisionTwinSensitivity,
  DecisionTwinStudy,
} from '../types/decision-twin.types';

/**
 * Compare and Learn — one decision twin study, whole.
 *
 * What this page will not do, and why each refusal is deliberate:
 *
 *   - **No ranking, no score, no winner.** The server computes no
 *     difference-from-baseline and no ordering, because subtracting one
 *     simulated spread from another produces a figure that reads as an effect
 *     and carries the caveats of neither side. Sorting the arms here would
 *     reintroduce exactly that composite through the back door, so the arms
 *     are listed in the server's order and the baseline is labelled rather
 *     than moved.
 *   - **No "apply this arm" control.** §5.9: AI will not set prices, reserve
 *     stock or move money. A twin simulates; a button that executed an arm
 *     would present a simulated action as a taken one.
 *   - **No chart.** A spread drawn as a bar acquires a visual midpoint nobody
 *     computed, and two bars side by side read as an effect size.
 */
function DecisionTwinStudyPage() {
  const { studyId } = useParams<{ studyId: string }>();
  const study = useDecisionTwinStudy(studyId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <SurfaceHeader
        icon={<Network size={20} strokeWidth={1.6} className="text-brand" />}
        title={study.data ? study.data.name : 'Decision twin study'}
        blurb="Define, Simulate, Compare, Learn. Every alternative here is an ordinary retail simulation run over the declared seeds; every figure is simulated and says so."
        actions={
          <>
            <Link
              to={ROUTES.dashboard.decisionTwin}
              className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <ArrowLeft size={13} strokeWidth={1.6} />
              Studies
            </Link>
            <button
              type="button"
              onClick={() => void study.refetch()}
              className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
            >
              <RefreshCcw size={13} strokeWidth={1.6} />
              Refresh
            </button>
          </>
        }
      />

      <SimulationBanner />

      {study.isError && (
        <GovernanceRefusalNotice error={study.error} onRefresh={() => void study.refetch()} />
      )}
      {study.isPending && studyId && (
        <p className="text-xs font-medium text-text-muted">Reading the study…</p>
      )}
      {!studyId && (
        <EmptySection
          state="NoStudyIdInRoute"
          meaning="This page needs a study id. Open a study from the decision twin page."
          testId="no-study-id"
        />
      )}

      {study.data && <StudyBody study={study.data} />}
    </div>
  );
}

function StudyBody({ study }: { study: DecisionTwinStudy }) {
  return (
    <>
      <Panel testId="define-panel" title="Define — what was proposed, and over what">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Scope">
            <span className="leading-relaxed">{study.scope.scopeDescription}</span>
          </Field>
          <Field label="Horizon">
            <HorizonValue horizon={study.scope.horizon} testId="study-horizon" />
          </Field>
          <Field label="Scope keys">
            {study.scope.scopeKeys.length === 0 ? (
              <Absent
                state="NoScopeKeysRecorded"
                meaning="The study recorded no scope keys, so what its figures apply to cannot be checked."
                testId="scope-keys-absent"
              />
            ) : (
              <span className="font-mono">{study.scope.scopeKeys.join(', ')}</span>
            )}
          </Field>
          <Field label="Replicates per arm">
            <StatedValue
              quantity={study.replicatesPerArm}
              label="Seeds the operator declared"
              testId="replicates-per-arm"
            />
          </Field>
          <Field label="Scenario">
            <span className="font-mono">
              {study.scenarioKey} · {study.scenarioClass}
            </span>
          </Field>
          <Field label="Engine version">
            <span className="font-mono">{study.engineVersion}</span>
          </Field>
          <Field label="Opened">
            <span className="font-mono">{formatUtc(study.openedUtc)}</span>
          </Field>
          <Field label="Completed">
            <span className="font-mono">{formatUtc(study.completedUtc)}</span>
          </Field>
        </div>
      </Panel>

      <Panel
        testId="assumptions-panel"
        title="Premises"
        subtitle={
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            Every number the model was given, with the basis the operator named for it. A premise
            nobody stated is a missing premise; the server refuses the study rather than filling
            one in.
          </p>
        }
      >
        {study.assumptions.length === 0 ? (
          <EmptySection
            state="NoAssumptionsRecorded"
            meaning="No premises were recorded on this study. Its figures cannot be reproduced."
            testId="assumptions-empty"
          />
        ) : (
          <ul className="flex flex-wrap gap-3">
            {study.assumptions.map((assumption) => (
              <li key={assumption.assumptionKey} className="flex flex-col gap-1">
                <span className="font-mono text-2xs font-bold text-text-secondary">
                  {assumption.assumptionKey}
                </span>
                <StatedValue
                  quantity={assumption.quantity}
                  label={assumption.note ?? undefined}
                  testId={`assumption-${assumption.assumptionKey}`}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        testId="arms-panel"
        title="Simulate — the alternatives"
        subtitle={
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            Listed in the server's order. They are not ranked, and the no-change baseline is
            labelled where it falls rather than promoted to the top.
          </p>
        }
      >
        {study.arms.length === 0 ? (
          <EmptySection
            state="NoArmsRecorded"
            meaning="This study recorded no alternatives."
            testId="arms-empty"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {study.arms.map((arm) => (
              <ArmCard key={arm.armKey} arm={arm} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        testId="comparison-panel"
        title="Compare — one measure at a time"
        subtitle={
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            Each arm's lowest and highest replicate over the declared seeds, with the baseline as
            another row of the same shape. There is no mean, no midpoint and no
            difference-from-baseline: the reader compares the rows.
          </p>
        }
      >
        {study.comparison.length === 0 ? (
          <EmptySection
            state="NoComparisonRowsReturned"
            meaning="The server returned no measures for this study. Nothing is shown in their place."
            testId="comparison-empty"
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {study.comparison.map((row) => (
              <ComparisonCard key={row.measureKey} row={row} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        testId="constraints-panel"
        title="Declared limits"
        subtitle={
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            Limits declared before anything ran. A limit crossed in the model is not a limit crossed
            in the business, so there is no pass and no fail here — only in how many replicates it
            was crossed, over the stated denominator.
          </p>
        }
      >
        {study.declaredConstraints.length === 0 ? (
          <EmptySection
            state="NoLimitsDeclared"
            meaning="This study declared no limits. That is not the same as every limit having been respected."
            testId="constraints-empty"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {study.declaredConstraints.map((constraint) => (
              <ConstraintCard key={constraint.constraintKey} constraint={constraint} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        testId="sensitivity-panel"
        title="What moved when a premise moved"
        subtitle={
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            One premise moved, the rest held. Two figures side by side, never a delta and never an
            ordering of which premise matters most — an ordering of simulated figures is a ranking
            this platform does not produce.
          </p>
        }
      >
        {study.sensitivityDrivers.length === 0 ? (
          <EmptySection
            state="NoSensitivityRequested"
            meaning="No premise was nominated for variation when this study was opened, so nothing was varied."
            testId="sensitivity-empty"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {study.sensitivityDrivers.map((driver) => (
              <SensitivityCard key={`${driver.armKey}-${driver.assumptionKey}`} driver={driver} />
            ))}
          </ul>
        )}
      </Panel>

      <LearnPanel study={study} />

      <Limitations items={study.limitations} testId="study-limitations" />
    </>
  );
}

function ArmCard({ arm }: { arm: DecisionTwinArm }) {
  return (
    <li
      data-testid={`arm-${arm.armKey}`}
      className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle bg-glass-1 p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-extrabold text-text-primary">{arm.armLabel}</span>
        <span className="font-mono text-2xs font-bold text-text-muted">{arm.armKey}</span>
        {arm.isComparisonBaseline ? (
          <span className="rounded-xs border-thin border-border-medium px-1.5 py-0.5 font-mono text-2xs font-bold uppercase tracking-wide text-text-secondary">
            No-change baseline
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Proposed change">
          <span className="leading-relaxed">
            <span className="font-mono">
              {arm.proposedChange.kind} · {arm.proposedChange.changeKey}
            </span>
            <br />
            {arm.proposedChange.description}
          </span>
        </Field>
        <Field label="Magnitude">
          <StatedValue
            quantity={arm.proposedChange.magnitude}
            label="A premise of this arm, not an outcome of it"
            testId={`arm-${arm.armKey}-magnitude`}
          />
        </Field>
      </div>
      {arm.replicates.length === 0 ? (
        <Absent
          state="NoReplicatesRecorded"
          meaning="This arm recorded no replicates, so none of its figures can be re-run."
          testId={`arm-${arm.armKey}-replicates-absent`}
        />
      ) : (
        <details>
          <summary className="w-fit cursor-pointer text-2xs font-bold uppercase tracking-wide text-text-muted hover:text-text-secondary">
            Replicates ({arm.replicates.length}) — each one an ordinary simulation run
          </summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {arm.replicates.map((replicate) => (
              <li key={replicate.simulationRunId}>
                <Reproducibility reproducibility={replicate.reproducibility} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

function ComparisonCard({ row }: { row: DecisionTwinComparisonRow }) {
  return (
    <li
      data-testid={`measure-${row.measureKey}`}
      className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle p-3"
    >
      <span className="font-mono text-xs font-extrabold text-text-primary">
        {row.measureKey} <span className="text-text-muted">({row.unit})</span>
      </span>
      {row.arms.length === 0 ? (
        <EmptySection
          state="NoArmOutcomesForMeasure"
          meaning="No arm produced a figure for this measure."
          testId={`measure-${row.measureKey}-empty`}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {row.arms.map((outcome) => (
            <ArmSpread
              key={outcome.armKey}
              outcome={outcome}
              testId={`spread-${row.measureKey}-${outcome.armKey}`}
            />
          ))}
        </div>
      )}
    </li>
  );
}

const DIRECTION_LABEL: Record<string, string> = {
  MustNotExceed: 'must not go above',
  MustNotFallBelow: 'must not fall below',
};

function ConstraintCard({ constraint }: { constraint: DecisionTwinConstraint }) {
  return (
    <li
      data-testid={`constraint-${constraint.constraintKey}`}
      className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle p-3"
    >
      <span className="font-mono text-xs font-extrabold text-text-primary">
        {constraint.constraintKey}
      </span>
      <Field label={`${constraint.measureKey} ${DIRECTION_LABEL[constraint.direction] ?? constraint.direction}`}>
        <StatedValue
          quantity={constraint.limit}
          label="A premise of the study, declared before anything ran"
          testId={`constraint-${constraint.constraintKey}-limit`}
        />
      </Field>
      {constraint.arms.length === 0 ? (
        <EmptySection
          state="NoArmsEvaluatedAgainstLimit"
          meaning="No arm was evaluated against this limit."
          testId={`constraint-${constraint.constraintKey}-empty`}
        />
      ) : (
        <ul className="flex flex-wrap gap-3">
          {constraint.arms.map((outcome) => (
            <li key={outcome.armKey} className="flex flex-col gap-1">
              <span className="font-mono text-2xs font-bold text-text-secondary">
                {outcome.armKey} · {outcome.state}
              </span>
              <div className="flex flex-wrap items-start gap-2">
                <span className="flex flex-col gap-1">
                  <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
                    Replicates crossing the limit
                  </span>
                  <SimulatedValue
                    figure={outcome.replicatesCrossingLimit}
                    testId={`constraint-${constraint.constraintKey}-${outcome.armKey}-crossing`}
                  />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
                    Out of
                  </span>
                  <StatedValue quantity={outcome.replicatesExamined} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function SensitivityCard({ driver }: { driver: DecisionTwinSensitivity }) {
  return (
    <li
      data-testid={`sensitivity-${driver.armKey}-${driver.assumptionKey}`}
      className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle p-3"
    >
      <span className="font-mono text-xs font-extrabold text-text-primary">
        {driver.armKey} · {driver.assumptionKey}
      </span>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Premise as stated
          </span>
          <StatedValue quantity={driver.asStated} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Premise varied to
          </span>
          <StatedValue quantity={driver.varied} />
        </span>
      </div>
      {driver.measures.length === 0 ? (
        <EmptySection
          state="NoMeasuresMoved"
          meaning="The server returned no measures for this variation."
          testId={`sensitivity-${driver.armKey}-${driver.assumptionKey}-empty`}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {driver.measures.map((measure) => (
            <li key={measure.measureKey} className="flex flex-col gap-1">
              <span className="font-mono text-2xs font-bold text-text-secondary">
                {measure.measureKey} ({measure.unit})
              </span>
              <div className="flex flex-wrap items-start gap-2">
                <SimulatedValue figure={measure.withAssumptionAsStated} />
                <SimulatedValue figure={measure.withAssumptionVaried} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Reproducibility reproducibility={driver.reproducibility} />
    </li>
  );
}

// ── Learn ───────────────────────────────────────────────────────────────────

function LearnPanel({ study }: { study: DecisionTwinStudy }) {
  return (
    <Panel
      testId="learn-panel"
      title="Learn — what reality said afterwards"
      subtitle={
        <p className="text-xs font-medium leading-relaxed text-text-secondary">
          A recorded outcome is set beside the arm's simulated spread. The gap is never folded into
          one number and the model is never refitted onto it: moving a premise onto a single
          recorded outcome is how a model begins producing figures that look measured.
        </p>
      }
    >
      {study.learning.length === 0 ? (
        <EmptySection
          state="NoRecordedOutcomeSupplied"
          meaning="Nothing recorded has been supplied for any arm of this study, so it stands uncalibrated. That is not the same as the simulation having matched reality."
          testId="learning-empty"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {study.learning.map((row) => (
            <LearningCard key={`${row.armKey}-${row.measureKey}`} row={row} />
          ))}
        </ul>
      )}
      <RecordOutcomeForm study={study} />
    </Panel>
  );
}

function LearningCard({ row }: { row: DecisionTwinLearning }) {
  return (
    <li
      data-testid={`learning-${row.armKey}-${row.measureKey}`}
      className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle p-3"
    >
      <span className="font-mono text-xs font-extrabold text-text-primary">
        {row.armKey} · {row.measureKey} ({row.unit}) · {row.state}
      </span>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Simulated lowest
          </span>
          <SimulatedValue figure={row.lowest} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Simulated highest
          </span>
          <SimulatedValue figure={row.highest} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Out of
          </span>
          <StatedValue quantity={row.replicatesExamined} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Recorded outcome
          </span>
          {row.recordedOutcome === null ? (
            <Absent
              state="NoRecordedOutcomeSupplied"
              meaning="Nothing recorded was supplied for this measure. It is never approximated from a neighbouring one."
              testId={`learning-${row.armKey}-${row.measureKey}-absent`}
            />
          ) : (
            <StatedValue
              quantity={row.recordedOutcome}
              label="Observed after execution, cited by the operator who recorded it"
              testId={`learning-${row.armKey}-${row.measureKey}-recorded`}
            />
          )}
        </span>
      </div>
      <p className="text-xs font-medium leading-relaxed text-text-secondary">{row.note}</p>
      <span className="font-mono text-2xs font-medium text-text-muted">
        {row.recordedUtc ? `Recorded ${formatUtc(row.recordedUtc)}` : 'Not yet recorded'}
      </span>
    </li>
  );
}

const EMPTY_OUTCOME = {
  armKey: '',
  measureKey: '',
  recordedValue: '',
  unit: '',
  recordedSource: '',
  observedFromUtc: '',
  observedToUtc: '',
  note: '',
};

/**
 * `datetime-local` yields `2026-09-01T00:00` with no offset, and the server
 * binds a `DateTimeOffset`. Left as-is, a window the operator entered would be
 * bound against whatever offset the server assumed, silently naming a
 * different period than the one observed. The field says UTC, so it is sent as
 * UTC rather than trusting a default.
 */
const toUtcIso = (local: string) => {
  if (local === '') return '';
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return `${withSeconds}Z`;
};

const FIELD =
  'rounded-sm border-thin border-border-medium bg-bg-input px-2 py-2 text-xs font-medium text-text-primary';

/**
 * Record what was observed.
 *
 * This is the only write on the page and it records a *measurement the operator
 * made*, not an action the platform took. It moves nothing: §5.9 holds, and the
 * server's own limitations say the surface set no price, reserved no stock and
 * moved no money.
 *
 * Nothing is prefilled. There is no "today" default on the window and no zero
 * in the value: an observation window nobody stated is not an observation
 * window, and the server requires both ends.
 */
function RecordOutcomeForm({ study }: { study: DecisionTwinStudy }) {
  const [form, setForm] = useState(EMPTY_OUTCOME);
  const record = useRecordDecisionTwinOutcome(study.studyId);

  const set = (key: keyof typeof EMPTY_OUTCOME) => (value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submit = () => {
    record.mutate({
      armKey: form.armKey,
      body: {
        measureKey: form.measureKey,
        recordedValue: Number(form.recordedValue),
        unit: form.unit,
        recordedSource: form.recordedSource,
        observedFromUtc: toUtcIso(form.observedFromUtc),
        observedToUtc: toUtcIso(form.observedToUtc),
        note: form.note === '' ? null : form.note,
      },
    });
  };

  return (
    <form
      data-testid="record-outcome-form"
      className="mt-2 flex flex-col gap-3 rounded-sm border-thin border-border-subtle bg-glass-1 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-extrabold tracking-tight text-text-primary">
          Record an observed outcome
        </h3>
        <p className="text-xs font-medium leading-relaxed text-text-secondary">
          Records a measurement you made, beside the simulation. It executes nothing and changes no
          premise. Every field is required by the server; none is filled in for you.
        </p>
      </div>

      {record.isError && <GovernanceRefusalNotice error={record.error} />}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">Arm</span>
          <select
            required
            value={form.armKey}
            onChange={(event) => set('armKey')(event.target.value)}
            className={FIELD}
          >
            <option value="">Choose an arm…</option>
            {study.arms.map((arm) => (
              <option key={arm.armKey} value={arm.armKey}>
                {arm.armLabel} ({arm.armKey})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Measure key
          </span>
          <input
            required
            value={form.measureKey}
            onChange={(event) => set('measureKey')(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Recorded value
          </span>
          <input
            required
            type="number"
            step="any"
            value={form.recordedValue}
            onChange={(event) => set('recordedValue')(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">Unit</span>
          <input
            required
            value={form.unit}
            onChange={(event) => set('unit')(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Recorded source
          </span>
          <input
            required
            value={form.recordedSource}
            onChange={(event) => set('recordedSource')(event.target.value)}
            placeholder="What measured it"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">Note</span>
          <input
            value={form.note}
            onChange={(event) => set('note')(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Observed from (UTC)
          </span>
          <input
            required
            type="datetime-local"
            value={form.observedFromUtc}
            onChange={(event) => set('observedFromUtc')(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Observed to (UTC)
          </span>
          <input
            required
            type="datetime-local"
            value={form.observedToUtc}
            onChange={(event) => set('observedToUtc')(event.target.value)}
            className={FIELD}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={record.isPending}
        className="w-fit rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary disabled:opacity-50"
      >
        {record.isPending ? 'Recording…' : 'Record observed outcome'}
      </button>
    </form>
  );
}

export { DecisionTwinStudyPage as Component };
export default DecisionTwinStudyPage;
