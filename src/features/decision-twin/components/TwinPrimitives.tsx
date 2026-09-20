import { CircleSlash, FlaskConical, Quote, Repeat2 } from 'lucide-react';
import { SimulatedValue } from '@/features/intelligence-console/components/FigureValue';
import { Absent, formatUtc } from '@/features/intelligence-console/components/ReportPrimitives';
import { isHorizonAbsent } from '../types/decision-twin.types';
import type {
  DecisionTwinArmOutcome,
  SimulatedFigure,
  SimulationReproducibility,
  StatedQuantity,
} from '../types/decision-twin.types';

/**
 * The three things on this surface that may carry a number, and the wall
 * between them.
 *
 * The server models them as three distinct types on purpose, and this console
 * keeps them three distinct shapes on screen. Nothing here formats a number
 * inline: every figure goes through one of these, and each one states its own
 * provenance next to its own digits.
 *
 *   simulated → `SimulatedValue` (reused from the intelligence console): dashed
 *               amber frame, `SIMULATED` chip, run id, `data-provenance`.
 *   stated    → `StatedValue` below: solid blue frame, `STATED` chip, the basis
 *               and the source the operator named.
 *   seed      → `Reproducibility` below: monospace, explicitly not a quantity.
 *
 * There is no fourth renderer and no bare `{n}` in this slice.
 */

// ── stated premises ─────────────────────────────────────────────────────────

const BASIS_LABEL: Record<string, string> = {
  OperatorStated: 'stated by an operator',
  DerivedFromObservedWindow: 'taken from an observed window',
};

/**
 * A premise the operator declared.
 *
 * Visually a sibling of `SimulatedValue`, never of `MeasuredValue`: a stated
 * premise is not a measurement either, even when its basis is an observed
 * window, because what was observed is the operator's citation and not this
 * platform's own count.
 */
export function StatedValue({
  quantity,
  label,
  testId,
}: {
  quantity: StatedQuantity;
  label?: string;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      data-provenance="Stated"
      data-basis={quantity.basis}
      className="inline-flex flex-col gap-1 rounded-sm border-thin border-info/50 bg-info-soft px-2.5 py-2 align-top"
    >
      <span className="inline-flex w-fit items-center gap-1 rounded-xs bg-info/20 px-1.5 py-0.5 font-mono text-2xs font-black uppercase tracking-wider text-info">
        <Quote size={10} strokeWidth={2} />
        Stated
      </span>
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-bold tabular-nums text-info">
          {quantity.statedValue.toLocaleString('en-US')}
        </span>
        <span className="font-mono text-2xs font-bold text-info/80">{quantity.unit}</span>
      </span>
      {label ? (
        <span className="text-2xs font-medium leading-relaxed text-info/90">{label}</span>
      ) : null}
      <span className="text-2xs font-medium leading-relaxed text-info/80">
        Not measured here — {BASIS_LABEL[quantity.basis] ?? quantity.basis}: {quantity.basisSource}
      </span>
      {quantity.observedFromUtc && quantity.observedToUtc ? (
        <span className="text-2xs font-medium leading-relaxed text-info/80">
          Observed {formatUtc(quantity.observedFromUtc)} → {formatUtc(quantity.observedToUtc)}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The study's horizon — and the one place this client refuses the server's own
 * number.
 *
 * `GetAsync` must return a `StatedQuantity` for the scope horizon even when the
 * study recorded no `horizon.days` premise, and it fills that slot with
 * `statedValue: 0` carrying a sentinel `basisSource`. Zero days is not a
 * horizon; it is the absence of one. A simulated figure with no horizon cannot
 * be checked against anything later, which is precisely the state in which it
 * quietly becomes a claim — so the absence is shown as an absence and the zero
 * never reaches the screen.
 */
export function HorizonValue({ horizon, testId }: { horizon: StatedQuantity; testId?: string }) {
  if (isHorizonAbsent(horizon)) {
    return (
      <Absent
        state="NoHorizonPremiseRecorded"
        meaning="This study's replicates recorded no horizon.days premise, so the period its figures cover is unknown. The server fills this slot with a zero; a zero is not a horizon and is not shown as one."
        testId={testId}
      />
    );
  }
  return <StatedValue quantity={horizon} label="Horizon this study's figures cover" testId={testId} />;
}

/** The seed. How to re-run, not a claim about the world, so it is never styled as a quantity. */
export function Reproducibility({
  reproducibility,
  testId,
}: {
  reproducibility: SimulationReproducibility;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      data-provenance="Reproducibility"
      className="inline-flex flex-col gap-0.5 rounded-sm border-thin border-border-subtle bg-glass-1 px-2.5 py-1.5 align-top"
    >
      <span className="inline-flex items-center gap-1.5 font-mono text-2xs font-bold uppercase tracking-wide text-text-muted">
        <Repeat2 size={11} strokeWidth={1.8} className="shrink-0" />
        Seed {reproducibility.seed}
      </span>
      <span className="font-mono text-2xs font-medium text-text-muted">
        engine {reproducibility.engineVersion} · assumptions{' '}
        {reproducibility.assumptionsFingerprint.slice(0, 12)}
      </span>
      <span className="text-2xs font-medium leading-relaxed text-text-secondary">
        {reproducibility.reRunInstruction}
      </span>
    </span>
  );
}

// ── the spread ──────────────────────────────────────────────────────────────

/**
 * One arm's lowest and highest replicate, with its declared denominator.
 *
 * Deliberately not a range widget, a bar or a sparkline. A spread drawn as a
 * bar acquires a visual midpoint the server refused to compute, and two bars
 * side by side read as an effect size. Two labelled figures and the stated
 * denominator say exactly what the server said and nothing more.
 */
export function ArmSpread({
  outcome,
  testId,
}: {
  outcome: DecisionTwinArmOutcome;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      data-arm={outcome.armKey}
      className="flex flex-col gap-2 rounded-sm border-thin border-border-subtle bg-glass-1 p-3"
    >
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-extrabold text-text-primary">
          {outcome.armKey}
        </span>
        {outcome.isComparisonBaseline ? (
          <span className="rounded-xs border-thin border-border-medium px-1.5 py-0.5 font-mono text-2xs font-bold uppercase tracking-wide text-text-secondary">
            No-change baseline
          </span>
        ) : null}
      </span>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Lowest replicate
          </span>
          <SimulatedValue figure={outcome.lowest} testId={`${outcome.armKey}-lowest`} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Highest replicate
          </span>
          <SimulatedValue figure={outcome.highest} testId={`${outcome.armKey}-highest`} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-2xs font-bold uppercase tracking-wide text-text-muted">
            Replicates examined
          </span>
          <StatedValue
            quantity={outcome.replicatesExamined}
            label="Seeds the operator declared for this study"
            testId={`${outcome.armKey}-denominator`}
          />
        </span>
      </div>
      <PerReplicateList figures={outcome.perReplicate} armKey={outcome.armKey} />
    </div>
  );
}

function PerReplicateList({ figures, armKey }: { figures: SimulatedFigure[]; armKey: string }) {
  if (figures.length === 0) {
    return (
      <Absent
        state="NoReplicateFiguresReturned"
        meaning="The server returned no per-replicate figures for this arm and measure."
        testId={`${armKey}-replicates-absent`}
      />
    );
  }
  return (
    <details className="flex flex-col gap-2">
      <summary className="w-fit cursor-pointer text-2xs font-bold uppercase tracking-wide text-text-muted hover:text-text-secondary">
        Every replicate behind this spread ({figures.length})
      </summary>
      <ul className="mt-2 flex flex-wrap gap-2">
        {figures.map((figure, index) => (
          // Two replicates can legitimately share a run id and measure — the
          // position in the server's list is what distinguishes them.
          <li key={`${figure.runId}-${figure.measureKey}-${index}`}>
            <SimulatedValue figure={figure} />
          </li>
        ))}
      </ul>
    </details>
  );
}

// ── the banner the whole surface sits under ─────────────────────────────────

/**
 * The standing notice above every study.
 *
 * §5.9 of the proposal: AI "will not set prices, reserve stock or move money."
 * A twin simulates. This console therefore offers no control that executes an
 * arm, and says so where the operator is looking at the arms — not only in the
 * limitations list at the foot of the page.
 */
export function SimulationBanner({ testId }: { testId?: string }) {
  return (
    <section
      data-testid={testId ?? 'simulation-banner'}
      className="flex items-start gap-2.5 rounded-card border-thin border-dashed border-warning/60 bg-warning-soft p-3.5"
    >
      <FlaskConical size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-warning" />
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-warning">
          Everything below is simulated
        </h2>
        <p className="max-w-3xl text-xs font-medium leading-relaxed text-warning/90">
          No figure on this page is a measurement of anything that happened, and none may be
          reported as one. Opening a study ran a model; it set no price, reserved no stock, held no
          inventory, created no cart or order and moved no money. This surface has no control that
          executes an arm — putting one here would present a simulated action as a taken one.
        </p>
      </div>
    </section>
  );
}

/** An empty section, said as emptiness rather than drawn as a zero row. */
export function EmptySection({
  state,
  meaning,
  testId,
}: {
  state: string;
  meaning: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex items-start gap-2 rounded-sm border-thin border-dashed border-border-medium bg-glass-1 p-3"
    >
      <CircleSlash size={13} strokeWidth={1.8} className="mt-0.5 shrink-0 text-text-muted" />
      <div className="flex flex-col gap-0.5">
        <span
          data-absent={state}
          className="font-mono text-2xs font-bold uppercase tracking-wide text-text-muted"
        >
          {state}
        </span>
        <span className="text-xs font-medium leading-relaxed text-text-secondary">{meaning}</span>
      </div>
    </div>
  );
}
