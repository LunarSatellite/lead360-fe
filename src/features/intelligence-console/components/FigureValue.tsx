import { FlaskConical, Ruler } from 'lucide-react';
import { isSimulatedFigure } from '../types/intelligence.types';
import type { MeasuredFigure, SimulatedFigure } from '../types/intelligence.types';
import { Absent, formatUtc } from './ReportPrimitives';

/**
 * Measured and simulated figures, and the wall between them.
 *
 * The server models a simulated number as a `SimulatedFigure` object with one
 * legal `provenance` and no public constructor, specifically so that nothing
 * downstream can pass a model's output off as an observation. This console
 * keeps that wall standing in the only place it can: on screen.
 *
 * A measured figure is a plain tabular number in the console's normal numeric
 * face. A simulated figure is never that. It is:
 *
 *   - enclosed in a dashed amber frame, not the solid frame measured values sit in;
 *   - prefixed by a `SIMULATED` chip and the run it came out of;
 *   - labelled with the scenario class and what it was derived from;
 *   - tagged `data-provenance="Simulated"` so a test can assert the difference.
 *
 * There is no size, colour or typeface shared between the two, and no code
 * path renders a `SimulatedFigure` through `MeasuredValue`.
 */

export function MeasuredValue({
  figure,
  testId,
}: {
  figure: MeasuredFigure;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      data-provenance="Measured"
      className="inline-flex flex-col gap-0.5 rounded-sm border-thin border-border-subtle bg-glass-1 px-2.5 py-1.5 align-top"
    >
      <span className="inline-flex items-baseline gap-1.5">
        <Ruler size={11} strokeWidth={1.8} className="shrink-0 self-center text-success" />
        <span className="font-mono text-base font-black tabular-nums text-text-primary">
          {figure.measuredValue.toLocaleString('en-US')}
        </span>
        <span className="font-mono text-2xs font-bold text-text-secondary">{figure.unit}</span>
      </span>
      <span className="text-2xs font-medium text-text-muted">
        {figure.measureKey} · measured by {figure.measurementSource}
      </span>
      <span className="text-2xs font-medium text-text-muted">
        Observed {formatUtc(figure.observedFromUtc)} → {formatUtc(figure.observedToUtc)}
      </span>
    </span>
  );
}

export function SimulatedValue({
  figure,
  testId,
}: {
  figure: SimulatedFigure;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      data-provenance="Simulated"
      className="inline-flex flex-col gap-1 rounded-sm border border-dashed border-warning/60 bg-warning-soft px-2.5 py-2 align-top"
    >
      <span className="inline-flex w-fit items-center gap-1 rounded-xs bg-warning/20 px-1.5 py-0.5 font-mono text-2xs font-black uppercase tracking-wider text-warning">
        <FlaskConical size={10} strokeWidth={2} />
        Simulated
      </span>
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-bold italic tabular-nums text-warning">
          {figure.simulatedValue.toLocaleString('en-US')}
        </span>
        <span className="font-mono text-2xs font-bold italic text-warning/80">{figure.unit}</span>
      </span>
      <span className="text-2xs font-medium leading-relaxed text-warning/90">
        {figure.measureKey} · scenario {figure.scenarioClass} · run{' '}
        <span className="font-mono">{figure.runId.slice(0, 8)}</span>
      </span>
      <span className="text-2xs font-medium leading-relaxed text-warning/80">
        Not observed. Derived from {figure.derivedFrom}.
      </span>
    </span>
  );
}

/**
 * The single entry point for any numeric value on these surfaces.
 *
 * It branches on the server's `provenance` rather than on anything the caller
 * asserts, so a simulated figure that reaches a page expecting a measurement
 * still renders as simulated. A `null` renders as the named absence the caller
 * supplies, never as `0`.
 */
export function FigureValue({
  figure,
  absentState,
  absentMeaning,
  testId,
}: {
  figure: MeasuredFigure | SimulatedFigure | null | undefined;
  absentState: string;
  absentMeaning?: string | null;
  testId?: string;
}) {
  if (figure === null || figure === undefined) {
    return <Absent state={absentState} meaning={absentMeaning} testId={testId} />;
  }
  if (isSimulatedFigure(figure)) {
    return <SimulatedValue figure={figure} testId={testId} />;
  }
  return <MeasuredValue figure={figure} testId={testId} />;
}
