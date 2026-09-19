import { CircleDot, ListChecks, PlayCircle, Ruler } from 'lucide-react';
import type {
  DecisionImplementationWindowDto,
  DecisionOptionsDto,
  DecisionOutcomeDto,
  DecisionOutcomeState,
  DecisionSimulationsConsultedDto,
} from '../types/intelligence.types';
import { MeasuredValue } from './FigureValue';
import { Absent, Field, formatUtc } from './ReportPrimitives';

/**
 * The three parts of a decision memory that only a person can fill in.
 *
 * The ledger derives the choice and the owner from the governed action, but
 * the options that were weighed, the window the work was meant to run in and
 * the result that was measured are things the platform cannot observe. When
 * nobody has recorded them the server says so in a named state, and these
 * components print that state rather than an empty section.
 *
 * The distinction this file exists to protect: **`OutcomeNotMeasured` and
 * `DecisionNotExecuted` are not the same state.**
 *
 *   - `DecisionNotExecuted` — the action never ran. There was nothing to
 *     measure, and nobody is late. Asking for a measurement would be asking
 *     about something that did not happen.
 *   - `OutcomeNotMeasured` — the action ran and nobody measured what followed.
 *     A measurement is owed, and this is the one an operator should act on.
 *
 * They get different words, different icons and different `data-outcome-state`
 * values, and neither is ever rendered as `0`, as a dash, or as "no data".
 */

const OUTCOME_WORDING: Record<DecisionOutcomeState, { headline: string; tone: string }> = {
  OutcomeMeasured: {
    headline: 'Measured',
    tone: 'border-success/40 bg-success-soft text-success',
  },
  DecisionNotExecuted: {
    headline: 'The decision was never executed, so there is no result to measure',
    tone: 'border-border-medium bg-glass-1 text-text-secondary',
  },
  OutcomeNotMeasured: {
    headline: 'The decision was executed and nobody has measured what followed',
    tone: 'border-warning/40 bg-warning-soft text-warning',
  },
};

export function OutcomeBlock({
  outcome,
  testId,
}: {
  outcome: DecisionOutcomeDto;
  testId?: string;
}) {
  const wording = OUTCOME_WORDING[outcome.state];
  return (
    <div
      data-testid={testId ?? 'measured-result'}
      data-outcome-state={outcome.state}
      className={`flex flex-col gap-2 rounded-card border-thin p-3 ${wording.tone}`}
    >
      <span className="flex items-center gap-1.5 font-mono text-2xs font-black uppercase tracking-wide">
        <Ruler size={11} strokeWidth={2} />
        {outcome.state}
      </span>
      <p className="text-xs font-bold leading-relaxed">{wording.headline}</p>
      <p className="text-xs font-medium leading-relaxed text-text-secondary">{outcome.note}</p>

      {outcome.measurements.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {outcome.measurements.map((measurement) => (
            <li key={measurement.entryId}>
              <MeasuredValue
                testId={`measurement-${measurement.measureKey}`}
                figure={{
                  measureKey: measurement.measureKey,
                  unit: measurement.measureUnit,
                  measuredValue: measurement.measuredValue,
                  measurementSource: measurement.measurementSource,
                  observedFromUtc: measurement.observedFromUtc,
                  observedToUtc: measurement.observedToUtc,
                }}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <span className="text-2xs font-medium text-text-muted">Source: {outcome.source}</span>
    </div>
  );
}

export function OptionsBlock({
  options,
  testId,
}: {
  options: DecisionOptionsDto;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId ?? 'options-considered'}
      data-options-state={options.state}
      className={`flex flex-col gap-2 rounded-card border-thin p-3 ${
        options.state === 'OptionsRecorded'
          ? 'border-border-subtle bg-glass-1'
          : 'border-warning/40 bg-warning-soft'
      }`}
    >
      <span className="flex items-center gap-1.5 font-mono text-2xs font-black uppercase tracking-wide text-text-muted">
        <ListChecks size={11} strokeWidth={2} />
        {options.state}
      </span>
      <p className="text-xs font-medium leading-relaxed text-text-secondary">{options.note}</p>

      {options.options.length === 0 ? (
        <Absent
          state="NoAlternativesOnRecord"
          meaning="Nobody recorded what else was on the table when this was decided."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {options.options.map((option) => (
            <li
              key={option.entryId}
              data-chosen={option.wasChosen}
              className="flex items-start gap-2 rounded-sm border-thin border-border-subtle bg-bg-card px-2.5 py-2"
            >
              <CircleDot
                size={12}
                strokeWidth={2}
                className={`mt-0.5 shrink-0 ${option.wasChosen ? 'text-success' : 'text-text-muted'}`}
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-mono text-xs font-extrabold text-text-primary">
                  {option.optionKey}
                  {option.wasChosen ? (
                    <span className="ml-2 rounded-xs bg-success-soft px-1.5 py-0.5 text-2xs font-black uppercase text-success">
                      chosen
                    </span>
                  ) : null}
                </span>
                <span className="text-xs font-medium leading-relaxed text-text-secondary">
                  {option.description}
                </span>
                {option.note ? (
                  <span className="text-2xs font-medium italic text-text-muted">{option.note}</span>
                ) : null}
                <span className="text-2xs font-medium text-text-muted">
                  Recorded {formatUtc(option.recordedUtc)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <span className="text-2xs font-medium text-text-muted">Source: {options.source}</span>
    </div>
  );
}

export function ImplementationWindowBlock({
  window,
  testId,
}: {
  window: DecisionImplementationWindowDto;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId ?? 'implementation-window'}
      data-window-state={window.state}
      className={`flex flex-col gap-2 rounded-card border-thin p-3 ${
        window.state === 'WindowDeclared'
          ? 'border-border-subtle bg-glass-1'
          : 'border-warning/40 bg-warning-soft'
      }`}
    >
      <span className="flex items-center gap-1.5 font-mono text-2xs font-black uppercase tracking-wide text-text-muted">
        <PlayCircle size={11} strokeWidth={2} />
        {window.state}
      </span>
      <p className="text-xs font-medium leading-relaxed text-text-secondary">{window.note}</p>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Field label="Planned start" testId="planned-start">
          {window.plannedStartUtc ? (
            formatUtc(window.plannedStartUtc)
          ) : (
            <Absent state="WindowNotDeclared" />
          )}
        </Field>
        <Field label="Planned end" testId="planned-end">
          {window.plannedEndUtc ? (
            formatUtc(window.plannedEndUtc)
          ) : (
            <Absent state="WindowNotDeclared" />
          )}
        </Field>
        <Field label="Actually executed" testId="window-executed">
          {window.executedUtc ? (
            formatUtc(window.executedUtc)
          ) : (
            <Absent
              state="NotExecuted"
              meaning="The action has not run, so there is no actual start to compare a plan against."
            />
          )}
        </Field>
      </div>

      {window.declaredUtc ? (
        <span className="text-2xs font-medium text-text-muted">
          Declared {formatUtc(window.declaredUtc)} · source {window.source}
        </span>
      ) : (
        <span className="text-2xs font-medium text-text-muted">Source: {window.source}</span>
      )}
    </div>
  );
}

/**
 * Simulation studies an operator consulted before deciding.
 *
 * Anything that came out of a study is model output, not observation. These
 * are rendered in the simulated visual language — dashed amber, never the
 * plain tabular face a measured value gets — even though what the ledger
 * stores here is a reference rather than a figure. A reader must not be able
 * to mistake a consulted model for a measured result further down the page.
 */
export function SimulationsConsultedBlock({
  consulted,
  testId,
}: {
  consulted: DecisionSimulationsConsultedDto;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId ?? 'simulations-consulted'}
      data-provenance="Simulated"
      className="flex flex-col gap-2 rounded-card border border-dashed border-warning/60 bg-warning-soft p-3"
    >
      <span className="w-fit rounded-xs bg-warning/20 px-1.5 py-0.5 font-mono text-2xs font-black uppercase tracking-wider text-warning">
        Simulated input
      </span>
      <p className="text-xs font-medium leading-relaxed text-warning/90">{consulted.note}</p>
      {consulted.simulations.length === 0 ? (
        <Absent
          state="NoSimulationConsulted"
          meaning="No simulation study is recorded against this decision."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {consulted.simulations.map((simulation) => (
            <li
              key={simulation.entryId}
              className="font-mono text-2xs font-bold italic text-warning"
            >
              study {simulation.simulationStudyId} · recorded{' '}
              {formatUtc(simulation.recordedUtc)}
              {simulation.note ? ` · ${simulation.note}` : ''}
            </li>
          ))}
        </ul>
      )}
      <span className="text-2xs font-medium text-text-muted">Source: {consulted.source}</span>
    </div>
  );
}
