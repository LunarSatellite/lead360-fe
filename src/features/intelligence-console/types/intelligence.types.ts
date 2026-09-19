/**
 * The five Phase-4 intelligence read surfaces, transcribed from the server
 * records in `StyleMint.Modules.Intelligence/Service/**`.
 *
 * Two things are deliberate here and must stay that way.
 *
 * 1. **Every "we cannot tell you" is a named state, not a missing field.**
 *    `OptionsNotRecorded`, `OutcomeNotMeasured`, `DecisionNotExecuted`,
 *    `OwnerNotAssigned`, `NoGovernedActionRegistered` are values the server
 *    chose to send. They are not `null` with a nicer name, and they are not
 *    each other — `OutcomeNotMeasured` means nobody measured, while
 *    `DecisionNotExecuted` means there was nothing to measure. Collapsing the
 *    two would invent a story about who is late.
 *
 * 2. **No total, no percentage, no score is declared here**, because the
 *    server declares none. `ObservedShareDto.percentOfDenominator` is the one
 *    ratio on these surfaces and the *server* computes it — and it is nullable
 *    precisely so that a zero denominator reports as "not computable" rather
 *    than as `0`.
 */

// ── Shared primitives ───────────────────────────────────────────────────────

/** A window. Every figure on these surfaces carries one; none may be shown without it. */
export interface PeriodDto {
  fromUtc: string;
  toUtc: string;
  label: string;
}

/** A count that knows its own window and where it came from. */
export interface CountedFigureDto {
  key: string;
  label: string;
  source: string;
  period: PeriodDto;
  count: number;
}

/**
 * A numerator with the denominator it was read against.
 *
 * `percentOfDenominator` is `null` when the server declined to divide. That
 * null renders as "not computable", never as `0%`, and the UI never divides
 * `observed` by `denominator` itself to fill the gap.
 */
export interface ObservedShareDto {
  observed: number;
  denominator: number;
  denominatorMeaning: string;
  percentOfDenominator: number | null;
}

export interface MoneyBucketDto {
  currency: string;
  amount: number;
  count: number;
}

/** `Settled` means the money moved. `Pending` means it may never move. */
export type MoneySettlement = 'Settled' | 'Pending';

export interface MoneyFigureDto {
  key: string;
  settlement: MoneySettlement;
  label: string;
  source: string;
  period: PeriodDto;
  byCurrency: MoneyBucketDto[];
}

export interface SettledMoneyFactDto {
  targetKind: string;
  targetId: string;
  currency: string;
  amount: number;
  settledUtc: string;
  source: string;
}

/**
 * A figure the platform did not observe — it came out of a simulation run.
 *
 * The server type has one legal `provenance` and no public constructor, so
 * nothing can mint one that claims to be measured. This console honours that:
 * a value carrying `provenance: 'Simulated'` is never rendered in the visual
 * language of a measured figure.
 */
export type FigureProvenance = 'Simulated';

export interface SimulatedFigure {
  provenance: FigureProvenance;
  runId: string;
  measureKey: string;
  unit: string;
  simulatedValue: number;
  derivedFrom: string;
  scenarioClass: string;
}

/** A value the platform actually observed, with the source that observed it. */
export interface MeasuredFigure {
  measureKey: string;
  unit: string;
  measuredValue: number;
  measurementSource: string;
  observedFromUtc: string;
  observedToUtc: string;
}

export function isSimulatedFigure(value: unknown): value is SimulatedFigure {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { provenance?: unknown }).provenance === 'Simulated'
  );
}

export type GovernedAgentActionStatus =
  | 'Draft'
  | 'AwaitingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Executed'
  | 'Failed'
  | 'RolledBack'
  | 'Expired';

export type AgentActionRiskTier = 'Low' | 'Medium' | 'High' | 'Critical';

export type CommerceFailureKind =
  | 'MissingAttribute'
  | 'MissingSynonym'
  | 'RuleDefect'
  | 'WorkflowDefect';

// ── 1. Executive cockpit ────────────────────────────────────────────────────

/**
 * Why a decision does or does not point at money that moved.
 *
 * `NoSettledOutcomeRecorded` and `TargetKindNotMoneyBearing` are the two
 * that dominate today, and that domination is the cockpit's finding.
 */
export type DecisionMoneyAttribution =
  | 'SettledOutcomeRecorded'
  | 'DecisionNotExecuted'
  | 'TargetKindNotMoneyBearing'
  | 'NoSettledOutcomeRecorded';

export const ATTRIBUTION_IS_TRACED: Record<DecisionMoneyAttribution, boolean> = {
  SettledOutcomeRecorded: true,
  DecisionNotExecuted: false,
  TargetKindNotMoneyBearing: false,
  NoSettledOutcomeRecorded: false,
};

export interface AttributionCountDto {
  attribution: DecisionMoneyAttribution;
  label: string;
  count: number;
}

export interface ObservedSignalsDto {
  period: PeriodDto;
  bySource: CountedFigureDto[];
}

export interface DecisionsTakenDto {
  period: PeriodDto;
  byLifecycleEvent: CountedFigureDto[];
  byStatus: CountedFigureDto[];
}

export interface SignalToDecisionLinkDto {
  period: PeriodDto;
  method: string;
  decisionsWithObservedSignal: CountedFigureDto;
  decisionsWithoutObservedSignal: CountedFigureDto;
}

export interface DecisionToSettledMoneyLinkDto {
  period: PeriodDto;
  method: string;
  byAttribution: AttributionCountDto[];
  tracedSettledByCurrency: MoneyBucketDto[];
  tracedSettledSource: string;
}

export interface ObservedSignalLinkDto {
  matchMethod: string;
  source: string;
  observationCount: number;
  firstObservedUtc: string;
  lastObservedUtc: string;
}

export interface ExecutiveDecisionTraceDto {
  decisionId: string;
  actionKey: string;
  requestingAgent: string;
  riskTier: AgentActionRiskTier;
  status: GovernedAgentActionStatus;
  targetKind: string;
  targetId: string;
  requestedUtc: string;
  decidedUtc: string | null;
  executedUtc: string | null;
  rolledBackUtc: string | null;
  approvedByAccountId: string | null;
  observedSignal: ObservedSignalLinkDto | null;
  settledOutcome: SettledMoneyFactDto | null;
  attribution: DecisionMoneyAttribution;
  attributionNote: string;
}

export interface ExecutiveDecisionTracePageDto {
  period: PeriodDto;
  generatedUtc: string;
  source: string;
  page: number;
  pageSize: number;
  hasMore: boolean;
  items: ExecutiveDecisionTraceDto[];
}

export interface ExecutiveChainDto {
  period: PeriodDto;
  generatedUtc: string;
  signals: ObservedSignalsDto;
  decisions: DecisionsTakenDto;
  signalToDecision: SignalToDecisionLinkDto;
  decisionToSettledMoney: DecisionToSettledMoneyLinkDto;
  money: MoneyFigureDto[];
  limitations: string[];
}

// ── 2. Decision memory ledger ───────────────────────────────────────────────

export type DecisionOptionsRecordState = 'OptionsRecorded' | 'OptionsNotRecorded';
export type DecisionImplementationWindowState = 'WindowDeclared' | 'WindowNotDeclared';

/**
 * `DecisionNotExecuted` and `OutcomeNotMeasured` are different claims.
 * Nothing in this console may map them to a shared "no data" branch.
 */
export type DecisionOutcomeState = 'OutcomeMeasured' | 'DecisionNotExecuted' | 'OutcomeNotMeasured';

export interface DecisionOwnerDto {
  requestedByAccountId: string;
  approvedByAccountId: string | null;
  requestingAgent: string;
  source: string;
}

export interface DecisionChoiceDto {
  actionKey: string;
  targetKind: string;
  targetId: string;
  status: GovernedAgentActionStatus;
  requestedUtc: string;
  decidedUtc: string | null;
  source: string;
}

export interface DecisionOptionDto {
  entryId: string;
  optionKey: string;
  description: string;
  wasChosen: boolean;
  recordedByAccountId: string;
  recordedUtc: string;
  note: string | null;
}

export interface DecisionOptionsDto {
  state: DecisionOptionsRecordState;
  note: string;
  options: DecisionOptionDto[];
  source: string;
}

export interface DecisionImplementationWindowDto {
  state: DecisionImplementationWindowState;
  note: string;
  plannedStartUtc: string | null;
  plannedEndUtc: string | null;
  declaredByAccountId: string | null;
  declaredUtc: string | null;
  executedUtc: string | null;
  source: string;
}

export interface DecisionMeasurementDto {
  entryId: string;
  measureKey: string;
  measureUnit: string;
  measuredValue: number;
  observedFromUtc: string;
  observedToUtc: string;
  measurementSource: string;
  recordedByAccountId: string;
  recordedUtc: string;
  note: string | null;
}

export interface DecisionOutcomeDto {
  state: DecisionOutcomeState;
  note: string;
  measurements: DecisionMeasurementDto[];
  source: string;
}

export interface DecisionSimulationConsultedDto {
  entryId: string;
  simulationStudyId: string;
  recordedByAccountId: string;
  recordedUtc: string;
  note: string | null;
}

export interface DecisionSimulationsConsultedDto {
  simulations: DecisionSimulationConsultedDto[];
  note: string;
  source: string;
}

export interface DecisionLedgerEntryDto {
  decisionId: string;
  choiceMade: DecisionChoiceDto;
  owner: DecisionOwnerDto;
  optionsConsidered: DecisionOptionsDto;
  implementationWindow: DecisionImplementationWindowDto;
  measuredResult: DecisionOutcomeDto;
  simulationsConsulted: DecisionSimulationsConsultedDto;
  limitations: string[];
}

export interface DecisionLedgerPageDto {
  period: PeriodDto;
  generatedUtc: string;
  page: number;
  pageSize: number;
  hasMore: boolean;
  items: DecisionLedgerEntryDto[];
  /** The server's own count of what operators have not recorded. Not derived here. */
  unrecordedElements: CountedFigureDto[];
  limitations: string[];
}

export interface RecordDecisionOptionBody {
  optionKey: string;
  description: string;
  wasChosen: boolean;
  note?: string | null;
}

export interface DeclareImplementationWindowBody {
  plannedStartUtc: string;
  plannedEndUtc: string;
  note?: string | null;
}

export interface RecordOutcomeMeasurementBody {
  measureKey: string;
  measureUnit: string;
  measuredValue: number;
  observedFromUtc: string;
  observedToUtc: string;
  measurementSource: string;
  note?: string | null;
}

export interface DecisionLedgerAppendedDto {
  entryId: string;
  decisionId: string;
  entryKind: string;
  recordedByAccountId: string;
  recordedUtc: string;
}

// ── 3. Failure diagnosis ────────────────────────────────────────────────────

export interface DiagnosisWindowDto {
  fromUtc: string;
  toUtc: string;
  days: number;
}

export interface FailureKindCountDto {
  kind: CommerceFailureKind;
  observations: number;
}

export interface FailureSourceCountDto {
  sourceModule: string;
  observations: number;
}

export interface RecurrenceTestDto {
  meetsThreshold: boolean;
  occurrences: number;
  requiredOccurrences: number;
  distinctRecords: number;
  requiredDistinctRecords: number;
  distinctDays: number;
  requiredDistinctDays: number;
  unmetCriteria: string[];
  verdict: string;
}

export type AffectedRecordResolution =
  | 'ResolvableByMoneyOwningModule'
  | 'NoMoneyOwningModuleResolvesThisKind';

export interface AffectedRecordDto {
  targetKind: string;
  targetId: string;
  observations: number;
  firstObservedUtc: string;
  lastObservedUtc: string;
  resolution: AffectedRecordResolution;
}

export interface AffectedRecordsDto {
  distinctRecordsObserved: number;
  namedHere: number;
  truncated: boolean;
  records: AffectedRecordDto[];
  attributionNote: string;
}

/**
 * A hypothesis, worded as a hypothesis.
 *
 * `alsoConsistentWith` is the rival explanation and `whatWouldDistinguish` is
 * the check that would separate them. Rendering `statement` without both is
 * how a hypothesis turns into a conclusion, so the renderer requires all three.
 */
export interface ConsistentWithDto {
  statement: string;
  observedBasis: string;
  alsoConsistentWith: string;
  whatWouldDistinguish: string;
}

export interface ProposedRepairPathwayDto {
  actionKey: string;
  governedTargetKind: string;
  repairAlreadyProposed: boolean;
  note: string;
}

export interface FailureDiagnosisDto {
  fingerprint: string;
  byKind: FailureKindCountDto[];
  bySourceModule: FailureSourceCountDto[];
  firstObservedUtc: string;
  lastObservedUtc: string;
  shareOfObservationsInWindow: ObservedShareDto;
  recurrence: RecurrenceTestDto;
  /** Empty on thin evidence. An empty list is a statement, not a rendering gap. */
  consistentWith: ConsistentWithDto[];
  affectedRecords: AffectedRecordsDto;
  repairPathway: ProposedRepairPathwayDto;
}

export interface RecurrenceThresholdDto {
  minimumOccurrences: number;
  minimumDistinctRecords: number;
  minimumDistinctDays: number;
  lookbackDays: number;
  configurationSection: string;
  justification: string;
}

export interface FailureDiagnosisPageDto {
  window: DiagnosisWindowDto;
  method: string;
  causationCaveat: string;
  observationsRead: ObservedShareDto;
  thresholdApplied: RecurrenceThresholdDto;
  sourceModulesObserved: string[];
  recurring: FailureDiagnosisDto[];
  belowThreshold: FailureDiagnosisDto[];
  limitations: string[];
}

// ── 4. Aurora relate ────────────────────────────────────────────────────────

export interface AuroraWindowDto {
  fromUtc: string;
  toUtc: string;
  days: number;
}

export type AuroraOwnershipState = 'SameOwner' | 'DifferentOwners' | 'OwnerNotAssigned';

export interface AuroraDecisionOwnerDto {
  domain: string;
  assigned: boolean;
  ownerRole: string | null;
  adminSurface: string | null;
  basisOfOwnership: string;
}

export interface AuroraRoutingDto {
  ownership: AuroraOwnershipState;
  owners: AuroraDecisionOwnerDto[];
  routingNote: string;
}

export interface AuroraDecisionOwnerTableDto {
  window: AuroraWindowDto;
  generatedUtc: string;
  configurationSection: string;
  routingNote: string;
  /** Deliberately empty today. An empty table means nobody has been named. */
  configured: AuroraDecisionOwnerDto[];
  domainsObservedWithoutOwner: string[];
  limitations: string[];
}

export type AuroraAlternativeAvailability =
  | 'GovernedActionAvailable'
  | 'NoGovernedActionRegistered'
  | 'OperatorJudgementOnly';

export interface AuroraAlternativeDto {
  alternative: string;
  statement: string;
  availability: AuroraAlternativeAvailability;
  governedActionKey: string | null;
  proposalPathway: string;
  approvalRequirement: string;
  dependencies: string[];
  impactStatement: string;
}

export interface AuroraObservedRecordDto {
  targetKind: string;
  targetId: string;
  observationsInWindow: number;
  firstObservedUtc: string;
  lastObservedUtc: string;
}

export interface AuroraDomainSideDto {
  domain: string;
  observationsOnSharedRecords: number;
  recordsTouchedInWindow: ObservedShareDto;
  fingerprints: string[];
  byKind: FailureKindCountDto[];
  owner: AuroraDecisionOwnerDto;
}

export interface AuroraEvidenceBarDto {
  minimumSharedRecords: number;
  minimumDistinctDays: number;
  lookbackDays: number;
  configurationSection: string;
  justification: string;
}

export interface AuroraCrossDomainLinkDto {
  linkKey: string;
  left: AuroraDomainSideDto;
  right: AuroraDomainSideDto;
  recordsWithBothDomains: number;
  recordsWithLeftDomain: number;
  recordsWithRightDomain: number;
  denominatorMeaning: string;
  distinctDaysObserved: number;
  firstObservedUtc: string;
  lastObservedUtc: string;
  meetsEvidenceBar: boolean;
  namedRecords: AuroraObservedRecordDto[];
  consistentWith: ConsistentWithDto[];
  routing: AuroraRoutingDto;
  alternatives: AuroraAlternativeDto[];
}

export interface AuroraRelatedSignalsPageDto {
  window: AuroraWindowDto;
  generatedUtc: string;
  method: string;
  causationCaveat: string;
  observationsRead: ObservedShareDto;
  evidenceBar: AuroraEvidenceBarDto;
  domainsObserved: string[];
  /** Channel, release, store and journey stage are never recorded. Always shown. */
  dimensionsNotAvailable: string[];
  crossDomainLinks: AuroraCrossDomainLinkDto[];
  belowEvidenceBar: AuroraCrossDomainLinkDto[];
  decisionOwners: AuroraDecisionOwnerDto[];
  limitations: string[];
}

export interface AuroraRecordDomainDto {
  domain: string;
  observations: number;
  fingerprints: string[];
  byKind: FailureKindCountDto[];
  firstObservedUtc: string;
  lastObservedUtc: string;
  owner: AuroraDecisionOwnerDto;
}

export interface AuroraRecordSignalsDto {
  window: AuroraWindowDto;
  generatedUtc: string;
  method: string;
  causationCaveat: string;
  targetKind: string;
  targetId: string;
  observationsOnRecord: ObservedShareDto;
  domains: AuroraRecordDomainDto[];
  routing: AuroraRoutingDto;
  consistentWith: ConsistentWithDto[];
  alternatives: AuroraAlternativeDto[];
  limitations: string[];
}

// ── 5. Autonomous operations ────────────────────────────────────────────────

/**
 * `NotYetObservable` is not lateness — the window simply has not closed.
 * `NoMeasurementRecorded` is lateness. They must not share a rendering.
 */
export type OperationExpectationComparison =
  | 'Unspecified'
  | 'NotYetObservable'
  | 'NoMeasurementRecorded'
  | 'MeasurementRecorded';

export interface OperationOutcomeComparisonView {
  measureKey: string;
  expectedUnit: string;
  expectedValue: number;
  expectedMeasurementSource: string;
  observeFromUtc: string;
  observeToUtc: string;
  declaredByAccountId: string;
  declaredUtc: string;
  measuredValue: number | null;
  measuredUnit: string | null;
  measurementSource: string | null;
  observedFromUtc: string | null;
  observedToUtc: string | null;
  recordedByAccountId: string | null;
  recordedUtc: string | null;
  comparison: OperationExpectationComparison;
  differenceFromExpected: number | null;
}

export interface OperationMonitorRow {
  decisionId: string;
  actionKey: string;
  requestingAgent: string;
  targetKind: string;
  targetId: string;
  status: GovernedAgentActionStatus;
  executedUtc: string;
  approvedByAccountId: string | null;
  expectationsDeclaredCount: number;
  comparisons: OperationOutcomeComparisonView[];
}

export interface OperationMonitorPage {
  windowFromUtc: string;
  windowToUtc: string;
  rows: OperationMonitorRow[];
  executedDecisionsInWindow: number;
  expectationsDeclaredInWindow: number;
  /** First-class counts. Reported as the server sends them, never recomputed. */
  decisionsWithNoExpectationDeclared: number;
  expectationsNotYetObservable: number;
  expectationsWithNoMeasurementRecorded: number;
  expectationsComparedToAMeasurement: number;
  decisionSource: string;
  expectationSource: string;
  outcomeSource: string;
}

export interface DeclareExpectationBody {
  measureKey: string;
  measureUnit: string;
  expectedValue: number;
  expectedMeasurementSource: string;
  observeFromUtc: string;
  observeToUtc: string;
  note?: string | null;
}

export interface OperationExpectationView {
  id: string;
  decisionId: string;
  measureKey: string;
  measureUnit: string;
  expectedValue: number;
  expectedMeasurementSource: string;
  observeFromUtc: string;
  observeToUtc: string;
  declaredByAccountId: string;
  declaredUtc: string;
  note: string | null;
}

export interface MaintenanceWindowView {
  id: string;
  actionKey: string;
  startsUtc: string;
  endsUtc: string;
  reason: string;
  declaredByAccountId: string;
  declaredUtc: string;
  liftedUtc: string | null;
  liftedByAccountId: string | null;
}

export interface ActionLimitView {
  id: string;
  actionKey: string;
  permittedExecutions: number;
  windowMinutes: number;
  executionsCountedInWindow: number;
  countedFromUtc: string;
  countedToUtc: string;
  countedFromSource: string;
  declaredByAccountId: string;
  declaredUtc: string;
}
