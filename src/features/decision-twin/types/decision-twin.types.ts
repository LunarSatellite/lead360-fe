/**
 * The retail decision twin — `v1/admin/retail-decision-twin`.
 *
 * Three surfaces share the word "twin" on this platform and they are three
 * different things. This slice is only the third:
 *
 *   - `v1/vendor/store/digital-twin`   — a field on the vendor dashboard payload.
 *   - `v1/vendor/digital-twin`         — the vendor scenario runner (mobile client).
 *   - `v1/admin/retail-decision-twin`  — THIS. The operator-side study:
 *                                        Define, Simulate, Compare, Learn.
 *
 * Every type below mirrors `DecisionTwinContracts.cs` field for field. Nothing
 * is widened, renamed or given a default here: a client that quietly supplies a
 * value the server did not send is how a simulated study becomes a claim.
 *
 * Exactly three shapes on this surface may carry a number, and each says where
 * its number came from:
 *
 *   `SimulatedFigure`              — produced by the model. `provenance: 'Simulated'`.
 *   `StatedQuantity`               — a premise a named operator stated, with its basis.
 *   `SimulationReproducibility`    — the seed. How to re-run, not a claim about the world.
 *
 * `SimulatedFigure` is deliberately imported from the intelligence console
 * rather than redeclared, so there is one such type in the web client and one
 * renderer for it, exactly as the server has one type and one factory.
 */
import type { SimulatedFigure } from '@/features/intelligence-console/types/intelligence.types';

export type { SimulatedFigure };
export { isSimulatedFigure } from '@/features/intelligence-console/types/intelligence.types';

// ── premises ────────────────────────────────────────────────────────────────

/**
 * Where a stated premise came from. There is no `PlatformDefault` on the server
 * and there is none here: a premise nobody stated is a missing premise, and the
 * study is refused rather than filled in.
 */
export type SimulationAssumptionBasis = 'OperatorStated' | 'DerivedFromObservedWindow';

/**
 * A number the operator declared, not one the model produced.
 *
 * It is not a `number` in this client for the same reason it is not a `decimal`
 * on the server: read through `StatedValue`, which shows the basis and the
 * source beside the figure. `observedFrom/ToUtc` are present only when the
 * basis is `DerivedFromObservedWindow`, and are `null` otherwise — never
 * backfilled with "now".
 */
export interface StatedQuantity {
  statedValue: number;
  unit: string;
  basis: SimulationAssumptionBasis;
  basisSource: string;
  observedFromUtc: string | null;
  observedToUtc: string | null;
}

export interface SimulationAssumption {
  assumptionKey: string;
  quantity: StatedQuantity;
  note: string | null;
}

/** The seed and the assumption fingerprint. Two runs matching here produce identical figures. */
export interface SimulationReproducibility {
  seed: number;
  assumptionsFingerprint: string;
  engineVersion: string;
  reRunInstruction: string;
}

export type SimulatedChangeKind = 'Search' | 'Pricing' | 'Promotion' | 'Fulfilment' | 'Policy';

export interface SimulatedChange {
  kind: SimulatedChangeKind;
  changeKey: string;
  description: string;
  magnitude: StatedQuantity;
}

// ── Define ──────────────────────────────────────────────────────────────────

export interface DecisionTwinScope {
  scopeDescription: string;
  scopeKeys: string[];
  horizon: StatedQuantity;
}

/**
 * The server's sentinel for "this study recorded no horizon premise".
 *
 * When no `horizon.days` assumption was recorded, `GetAsync` still has to
 * return a `StatedQuantity` for the scope's horizon, and it fills the slot with
 * `statedValue: 0` carrying this exact string as its `basisSource`.
 *
 * Zero days is not a horizon. Rendering it as one would put an invented number
 * on screen in the one field whose absence means a simulated figure can never
 * be checked against anything later. `HorizonValue` matches this string and
 * renders the absence instead.
 */
export const NO_HORIZON_PREMISE_SOURCE =
  "no horizon premise was recorded on this study's replicates";

export function isHorizonAbsent(horizon: StatedQuantity): boolean {
  return horizon.basisSource === NO_HORIZON_PREMISE_SOURCE;
}

// ── Simulate ────────────────────────────────────────────────────────────────

export interface DecisionTwinReplicate {
  simulationRunId: string;
  reproducibility: SimulationReproducibility;
}

export interface DecisionTwinArm {
  armKey: string;
  armLabel: string;
  isComparisonBaseline: boolean;
  proposedChange: SimulatedChange;
  replicates: DecisionTwinReplicate[];
}

// ── Compare ─────────────────────────────────────────────────────────────────

/**
 * One arm's replicates on one measure.
 *
 * There is no mean, no midpoint and no difference-from-baseline, on the server
 * or here. The baseline is another row of the same shape and the reader
 * compares the rows; subtracting one simulated spread from another produces a
 * figure that reads as an effect estimate and carries the caveats of neither.
 */
export interface DecisionTwinArmOutcome {
  armKey: string;
  isComparisonBaseline: boolean;
  lowest: SimulatedFigure;
  highest: SimulatedFigure;
  perReplicate: SimulatedFigure[];
  replicatesExamined: StatedQuantity;
}

export interface DecisionTwinComparisonRow {
  measureKey: string;
  unit: string;
  arms: DecisionTwinArmOutcome[];
}

export type DecisionTwinConstraintDirection = 'MustNotExceed' | 'MustNotFallBelow';

/** No `Pass` and no `Fail`: crossing a limit in a model is not a fact about the business. */
export type DecisionTwinConstraintState =
  | 'CrossedInSomeReplicates'
  | 'CrossedInNoReplicates';

export interface DecisionTwinConstraintOutcome {
  armKey: string;
  state: DecisionTwinConstraintState;
  replicatesCrossingLimit: SimulatedFigure;
  replicatesExamined: StatedQuantity;
}

export interface DecisionTwinConstraint {
  constraintKey: string;
  measureKey: string;
  unit: string;
  direction: DecisionTwinConstraintDirection;
  limit: StatedQuantity;
  arms: DecisionTwinConstraintOutcome[];
}

export interface DecisionTwinSensitivityMeasure {
  measureKey: string;
  unit: string;
  withAssumptionAsStated: SimulatedFigure;
  withAssumptionVaried: SimulatedFigure;
}

export interface DecisionTwinSensitivity {
  armKey: string;
  assumptionKey: string;
  asStated: StatedQuantity;
  varied: StatedQuantity;
  reproducibility: SimulationReproducibility;
  measures: DecisionTwinSensitivityMeasure[];
}

// ── Learn ───────────────────────────────────────────────────────────────────

export type CalibrationComparisonState =
  | 'ComparedToRecordedOutcome'
  | 'NoRecordedOutcomeSupplied';

/**
 * One arm's simulated spread set beside what was actually recorded afterwards.
 *
 * The recorded side stays a `StatedQuantity` with its source and window; the
 * simulated side stays a pair of `SimulatedFigure`s. The gap is never folded
 * into one number and the model is never refitted onto it.
 */
export interface DecisionTwinLearning {
  armKey: string;
  measureKey: string;
  unit: string;
  state: CalibrationComparisonState;
  lowest: SimulatedFigure;
  highest: SimulatedFigure;
  replicatesExamined: StatedQuantity;
  recordedOutcome: StatedQuantity | null;
  recordedByAccountId: string | null;
  recordedUtc: string | null;
  note: string;
}

// ── the study ───────────────────────────────────────────────────────────────

export type SimulationScenarioClass =
  | 'Normal'
  | 'Edge'
  | 'Adversarial'
  | 'Accessibility'
  | 'Failure';

export interface DecisionTwinStudy {
  studyId: string;
  name: string;
  /** Always `'Simulated'`. The whole study is a model output, not a report. */
  provenance: 'Simulated';
  scope: DecisionTwinScope;
  scenarioKey: string;
  scenarioClass: SimulationScenarioClass;
  engineVersion: string;
  replicatesPerArm: StatedQuantity;
  assumptions: SimulationAssumption[];
  arms: DecisionTwinArm[];
  comparison: DecisionTwinComparisonRow[];
  declaredConstraints: DecisionTwinConstraint[];
  sensitivityDrivers: DecisionTwinSensitivity[];
  learning: DecisionTwinLearning[];
  openedUtc: string;
  completedUtc: string;
  limitations: string[];
}

// ── the scenario library, read from `v1/admin/retail-simulation/scenarios` ──

export interface SimulationScenario {
  scenarioKey: string;
  scenarioClass: SimulationScenarioClass;
  description: string;
  pressures: string[];
  missionsExercised: string[];
}

export interface SimulationScenarioLibrary {
  scenarios: SimulationScenario[];
  limitations: string[];
}

// ── request bodies ──────────────────────────────────────────────────────────

export interface StateSimulationAssumptionBody {
  assumptionKey: string;
  statedValue: number;
  unit: string;
  basis: SimulationAssumptionBasis;
  basisSource: string;
  observedFromUtc: string | null;
  observedToUtc: string | null;
  note: string | null;
}

export interface DecisionTwinArmBody {
  armKey: string;
  armLabel: string;
  kind: SimulatedChangeKind;
  changeKey: string;
  description: string;
  magnitudePercent: number;
}

export interface DecisionTwinConstraintBody {
  constraintKey: string;
  measureKey: string;
  unit: string;
  direction: DecisionTwinConstraintDirection;
  limitValue: number;
  basisSource: string;
}

/**
 * Define. Nothing here has a client-side default, deliberately.
 *
 * The server refuses an omitted scope key, seed, premise or alternative *by
 * name*. Filling one in here to make the form easier to submit would turn a
 * reproducible study into a figure nobody can check, so the refusal is shown to
 * the operator instead.
 */
export interface OpenDecisionTwinStudyBody {
  name: string;
  scopeDescription: string;
  scopeKeys: string[];
  scenarioKey: string;
  replicateSeeds: number[];
  assumptions: StateSimulationAssumptionBody[];
  arms: DecisionTwinArmBody[];
  constraints: DecisionTwinConstraintBody[];
  sensitivityAssumptionKeys: string[];
  sensitivityVariationPercent: number;
}

/** Learn. Every field is about something observed, and the server requires the window. */
export interface RecordDecisionTwinOutcomeBody {
  measureKey: string;
  recordedValue: number;
  unit: string;
  recordedSource: string;
  observedFromUtc: string;
  observedToUtc: string;
  note: string | null;
}
