import type {
  AuroraDecisionOwnerDto,
  AuroraRelatedSignalsPageDto,
  ConsistentWithDto,
  DecisionImplementationWindowDto,
  DecisionLedgerEntryDto,
  DecisionOptionsDto,
  DecisionOutcomeDto,
  ExecutiveChainDto,
  ExecutiveDecisionTraceDto,
  FailureDiagnosisDto,
  MeasuredFigure,
  OperationMonitorPage,
  OperationOutcomeComparisonView,
  PeriodDto,
  SimulatedFigure,
} from '../../types/intelligence.types';

/**
 * Fixtures shaped like what these APIs actually return today, not like what
 * we would prefer them to return.
 *
 * That matters: the cockpit's attribution buckets show essentially every
 * decision falling outside settled money, the ledger reads `NotRecorded`
 * everywhere an operator has not written something down, Aurora's owner table
 * is empty, and diagnosis ships an empty `consistentWith` for thin evidence.
 * A fixture that filled these in would let a test pass against a console that
 * lies about the platform.
 */

export const period = (label = 'Last 30 days'): PeriodDto => ({
  fromUtc: '2026-08-20T00:00:00+00:00',
  toUtc: '2026-09-19T00:00:00+00:00',
  label,
});

// ── Cockpit ─────────────────────────────────────────────────────────────────

/**
 * The real shape of the finding: 412 decisions, none of them traceable to
 * money that moved, because every registered executor targets an abstract
 * fingerprint rather than anything a money module owns.
 */
export const chainFixture = (): ExecutiveChainDto => ({
  period: period(),
  generatedUtc: '2026-09-19T09:00:00+00:00',
  signals: {
    period: period(),
    bySource: [
      {
        key: 'commerce-genome',
        label: 'Failures recorded by the commerce genome',
        source: 'IntelligenceDbContext.CommerceFailures',
        period: period(),
        count: 1_284,
      },
    ],
  },
  decisions: {
    period: period(),
    byLifecycleEvent: [
      {
        key: 'requested',
        label: 'Decisions requested',
        source: 'GovernedAgentActions',
        period: period(),
        count: 412,
      },
    ],
    byStatus: [
      {
        key: 'Executed',
        label: 'Executed',
        source: 'GovernedAgentActions',
        period: period(),
        count: 318,
      },
      {
        key: 'AwaitingApproval',
        label: 'Awaiting approval',
        source: 'GovernedAgentActions',
        period: period(),
        count: 94,
      },
    ],
  },
  signalToDecision: {
    period: period(),
    method: 'Matched on fingerprint recorded against the governed action target.',
    decisionsWithObservedSignal: {
      key: 'with-signal',
      label: 'Decisions with an observed signal',
      source: 'GovernedAgentActions ⨝ CommerceFailures',
      period: period(),
      count: 401,
    },
    decisionsWithoutObservedSignal: {
      key: 'without-signal',
      label: 'Decisions with no observed signal matched',
      source: 'GovernedAgentActions ⨝ CommerceFailures',
      period: period(),
      count: 11,
    },
  },
  decisionToSettledMoney: {
    period: period(),
    method:
      'Matched on target kind and target id against settlement facts from the owning money module.',
    byAttribution: [
      {
        attribution: 'SettledOutcomeRecorded',
        label: 'A settlement is recorded against this decision’s target.',
        count: 0,
      },
      {
        attribution: 'TargetKindNotMoneyBearing',
        label:
          'The only registered executor targets an abstract fingerprint, which no money module owns.',
        count: 318,
      },
      {
        attribution: 'DecisionNotExecuted',
        label: 'The decision was never carried out, so no financial result followed it.',
        count: 94,
      },
      {
        attribution: 'NoSettledOutcomeRecorded',
        label: 'The target is money-bearing but nothing settled against it in the window.',
        count: 0,
      },
    ],
    tracedSettledByCurrency: [],
    tracedSettledSource: 'IExecutiveSettledMoneySource',
  },
  money: [
    {
      key: 'orders-settled',
      settlement: 'Settled',
      label: 'Settled order value',
      source: 'Orders module settlement timestamps',
      period: period(),
      byCurrency: [{ currency: 'CDF', amount: 18_400_000, count: 902 }],
    },
    {
      key: 'payouts-pending',
      settlement: 'Pending',
      label: 'Payouts recorded but not yet moved',
      source: 'Payouts module',
      period: period(),
      byCurrency: [{ currency: 'CDF', amount: 2_100_000, count: 47 }],
    },
  ],
  limitations: [
    'There is no single "value created by automation" figure. The platform records no such figure and this surface does not produce one.',
    'Amounts are reported per currency and are never converted or totalled across currencies.',
    'Only a decision whose target kind is owned by a money module can be traced to settled money. Everything else is reported as unattributed.',
  ],
});

export const traceFixture = (
  overrides: Partial<ExecutiveDecisionTraceDto> = {},
): ExecutiveDecisionTraceDto => ({
  decisionId: '2f0e8a10-0000-4000-8000-000000000001',
  actionKey: 'commerce_genome.repair',
  requestingAgent: 'genome-agent',
  riskTier: 'High',
  status: 'Executed',
  targetKind: 'commerce_fingerprint',
  targetId: 'fp-missing-size-attr',
  requestedUtc: '2026-09-10T08:00:00+00:00',
  decidedUtc: '2026-09-10T08:05:00+00:00',
  executedUtc: '2026-09-10T08:06:00+00:00',
  rolledBackUtc: null,
  approvedByAccountId: null,
  observedSignal: {
    matchMethod: 'fingerprint',
    source: 'commerce-genome',
    observationCount: 61,
    firstObservedUtc: '2026-08-22T11:00:00+00:00',
    lastObservedUtc: '2026-09-09T19:30:00+00:00',
  },
  settledOutcome: null,
  attribution: 'TargetKindNotMoneyBearing',
  attributionNote:
    'This decision targets commerce_fingerprint, which no money module owns, so no settlement can be attributed to it.',
  ...overrides,
});

// ── Ledger ──────────────────────────────────────────────────────────────────

export const optionsNotRecorded = (): DecisionOptionsDto => ({
  state: 'OptionsNotRecorded',
  note: 'Nobody recorded what else was considered when this decision was made.',
  options: [],
  source: 'DecisionLedgerEntries',
});

export const windowNotDeclared = (): DecisionImplementationWindowDto => ({
  state: 'WindowNotDeclared',
  note: 'No implementation window was declared for this decision.',
  plannedStartUtc: null,
  plannedEndUtc: null,
  declaredByAccountId: null,
  declaredUtc: null,
  executedUtc: '2026-09-10T08:06:00+00:00',
  source: 'DecisionLedgerEntries',
});

/** Executed, and nobody measured what followed. A measurement is owed. */
export const outcomeNotMeasured = (): DecisionOutcomeDto => ({
  state: 'OutcomeNotMeasured',
  note: 'This decision was executed and no measurement has been recorded against it.',
  measurements: [],
  source: 'DecisionLedgerEntries',
});

/** Never ran. Nothing was owed and nobody is late. */
export const decisionNotExecuted = (): DecisionOutcomeDto => ({
  state: 'DecisionNotExecuted',
  note: 'This decision is AwaitingApproval and was never carried out, so there is no result to measure.',
  measurements: [],
  source: 'GovernedAgentActions',
});

export const outcomeMeasured = (): DecisionOutcomeDto => ({
  state: 'OutcomeMeasured',
  note: 'One measurement has been recorded against this decision.',
  measurements: [
    {
      entryId: '3a0e8a10-0000-4000-8000-000000000009',
      measureKey: 'recurrences-after-repair',
      measureUnit: 'count',
      measuredValue: 4,
      observedFromUtc: '2026-09-11T00:00:00+00:00',
      observedToUtc: '2026-09-18T00:00:00+00:00',
      measurementSource: 'commerce-genome',
      recordedByAccountId: '9f0e8a10-0000-4000-8000-00000000000a',
      recordedUtc: '2026-09-18T09:00:00+00:00',
      note: null,
    },
  ],
  source: 'DecisionLedgerEntries',
});

export const ledgerEntryFixture = (
  overrides: Partial<DecisionLedgerEntryDto> = {},
): DecisionLedgerEntryDto => ({
  decisionId: '2f0e8a10-0000-4000-8000-000000000001',
  choiceMade: {
    actionKey: 'commerce_genome.repair',
    targetKind: 'commerce_fingerprint',
    targetId: 'fp-missing-size-attr',
    status: 'Executed',
    requestedUtc: '2026-09-10T08:00:00+00:00',
    decidedUtc: '2026-09-10T08:05:00+00:00',
    source: 'GovernedAgentActions',
  },
  owner: {
    requestedByAccountId: '9f0e8a10-0000-4000-8000-00000000000b',
    approvedByAccountId: null,
    requestingAgent: 'genome-agent',
    source: 'GovernedAgentActions',
  },
  optionsConsidered: optionsNotRecorded(),
  implementationWindow: windowNotDeclared(),
  measuredResult: outcomeNotMeasured(),
  simulationsConsulted: {
    simulations: [],
    note: 'Simulation studies consulted before this decision. Model output, never observation.',
    source: 'DecisionLedgerEntries',
  },
  limitations: [
    'Options considered and measured results are recorded by people. Where nobody recorded them, this ledger reports that rather than inferring them.',
  ],
  ...overrides,
});

// ── Figures ─────────────────────────────────────────────────────────────────

export const measuredFigure = (): MeasuredFigure => ({
  measureKey: 'recurrences-after-repair',
  unit: 'count',
  measuredValue: 4,
  measurementSource: 'commerce-genome',
  observedFromUtc: '2026-09-11T00:00:00+00:00',
  observedToUtc: '2026-09-18T00:00:00+00:00',
});

export const simulatedFigure = (): SimulatedFigure => ({
  provenance: 'Simulated',
  runId: '7c1e8a10-0000-4000-8000-00000000000c',
  measureKey: 'recurrences-after-repair',
  unit: 'count',
  simulatedValue: 4,
  derivedFrom: 'RetailSimulation scenario run over the last 30 days of recorded failures',
  scenarioClass: 'RepairApplied',
});

// ── Diagnosis ───────────────────────────────────────────────────────────────

export const hypothesis = (): ConsistentWithDto => ({
  statement:
    'Consistent with the size attribute being absent from supplier feeds for this category.',
  observedBasis: '61 observations across 14 distinct products over 9 distinct days.',
  alsoConsistentWith:
    'A rule defect in the attribute mapper that drops the field for this category even when the supplier sends it.',
  whatWouldDistinguish:
    'Read the raw supplier payload for one affected product: if the field is present there, the mapper is at fault rather than the feed.',
});

export const diagnosisFixture = (
  overrides: Partial<FailureDiagnosisDto> = {},
): FailureDiagnosisDto => ({
  fingerprint: 'fp-missing-size-attr',
  byKind: [{ kind: 'MissingAttribute', observations: 61 }],
  bySourceModule: [{ sourceModule: 'catalog', observations: 61 }],
  firstObservedUtc: '2026-08-22T11:00:00+00:00',
  lastObservedUtc: '2026-09-09T19:30:00+00:00',
  shareOfObservationsInWindow: {
    observed: 61,
    denominator: 1_284,
    denominatorMeaning: 'All commerce failures recorded in the window, across every module.',
    percentOfDenominator: 4.75,
  },
  recurrence: {
    meetsThreshold: true,
    occurrences: 61,
    requiredOccurrences: 5,
    distinctRecords: 14,
    requiredDistinctRecords: 3,
    distinctDays: 9,
    requiredDistinctDays: 3,
    unmetCriteria: [],
    verdict: 'Meets all three recurrence criteria in force for this window.',
  },
  consistentWith: [hypothesis()],
  affectedRecords: {
    distinctRecordsObserved: 14,
    namedHere: 2,
    truncated: true,
    records: [
      {
        targetKind: 'product',
        targetId: 'sku-4471',
        observations: 9,
        firstObservedUtc: '2026-08-22T11:00:00+00:00',
        lastObservedUtc: '2026-09-09T19:30:00+00:00',
        resolution: 'NoMoneyOwningModuleResolvesThisKind',
      },
      {
        targetKind: 'product',
        targetId: 'sku-5120',
        observations: 7,
        firstObservedUtc: '2026-08-24T08:00:00+00:00',
        lastObservedUtc: '2026-09-08T10:00:00+00:00',
        resolution: 'NoMoneyOwningModuleResolvesThisKind',
      },
    ],
    attributionNote:
      'Records are named as the modules recorded them. No money module owns product, so none of these can be priced.',
  },
  repairPathway: {
    actionKey: 'commerce_genome.repair',
    governedTargetKind: 'commerce_fingerprint',
    repairAlreadyProposed: false,
    note: 'A repair for this fingerprint would be proposed as a governed action and would need approval.',
  },
  ...overrides,
});

/** Thin evidence: the server declines to offer any hypothesis at all. */
export const thinEvidenceDiagnosisFixture = (): FailureDiagnosisDto =>
  diagnosisFixture({
    fingerprint: 'fp-rare-workflow-defect',
    consistentWith: [],
    recurrence: {
      meetsThreshold: false,
      occurrences: 2,
      requiredOccurrences: 5,
      distinctRecords: 1,
      requiredDistinctRecords: 3,
      distinctDays: 1,
      requiredDistinctDays: 3,
      unmetCriteria: ['MinimumOccurrences', 'MinimumDistinctRecords', 'MinimumDistinctDays'],
      verdict: 'Below the recurrence bar on all three criteria.',
    },
    shareOfObservationsInWindow: {
      observed: 2,
      denominator: 0,
      denominatorMeaning: 'All commerce failures recorded in the window, across every module.',
      percentOfDenominator: null,
    },
  });

// ── Aurora ──────────────────────────────────────────────────────────────────

export const unassignedOwner = (domain: string): AuroraDecisionOwnerDto => ({
  domain,
  assigned: false,
  ownerRole: null,
  adminSurface: null,
  basisOfOwnership:
    'No owner is configured for this domain. Ownership is an organisational decision nobody has made yet.',
});

export const relatedSignalsFixture = (
  overrides: Partial<AuroraRelatedSignalsPageDto> = {},
): AuroraRelatedSignalsPageDto => ({
  window: { fromUtc: '2026-08-20T00:00:00+00:00', toUtc: '2026-09-19T00:00:00+00:00', days: 30 },
  generatedUtc: '2026-09-19T09:00:00+00:00',
  method:
    'Two domains are linked when both recorded a failure against the same concrete record inside the window.',
  causationCaveat:
    'Co-occurrence on the same record is not causation. Neither domain is shown as causing the other.',
  observationsRead: {
    observed: 1_284,
    denominator: 1_284,
    denominatorMeaning: 'All commerce failures recorded in the window.',
    percentOfDenominator: 100,
  },
  evidenceBar: {
    minimumSharedRecords: 5,
    minimumDistinctDays: 3,
    lookbackDays: 30,
    configurationSection: 'Intelligence:AuroraRelate',
    justification:
      'Below this, a pair of modules failing on the same record is as likely to be coincidence as pattern.',
  },
  domainsObserved: ['payments', 'delivery', 'catalog'],
  dimensionsNotAvailable: ['channel', 'release', 'store', 'journey stage'],
  crossDomainLinks: [
    {
      linkKey: 'payments↔delivery',
      left: {
        domain: 'payments',
        observationsOnSharedRecords: 38,
        recordsTouchedInWindow: {
          observed: 12,
          denominator: 340,
          denominatorMeaning: 'Distinct records any module recorded a failure against.',
          percentOfDenominator: 3.53,
        },
        fingerprints: ['fp-payment-timeout'],
        byKind: [{ kind: 'WorkflowDefect', observations: 38 }],
        owner: unassignedOwner('payments'),
      },
      right: {
        domain: 'delivery',
        observationsOnSharedRecords: 29,
        recordsTouchedInWindow: {
          observed: 12,
          denominator: 340,
          denominatorMeaning: 'Distinct records any module recorded a failure against.',
          percentOfDenominator: 3.53,
        },
        fingerprints: ['fp-courier-unassigned'],
        byKind: [{ kind: 'WorkflowDefect', observations: 29 }],
        owner: unassignedOwner('delivery'),
      },
      recordsWithBothDomains: 12,
      recordsWithLeftDomain: 44,
      recordsWithRightDomain: 31,
      denominatorMeaning: 'Distinct records any module recorded a failure against in the window.',
      distinctDaysObserved: 8,
      firstObservedUtc: '2026-08-23T00:00:00+00:00',
      lastObservedUtc: '2026-09-17T00:00:00+00:00',
      meetsEvidenceBar: true,
      namedRecords: [
        {
          targetKind: 'order',
          targetId: 'ord-8812',
          observationsInWindow: 5,
          firstObservedUtc: '2026-08-23T00:00:00+00:00',
          lastObservedUtc: '2026-09-17T00:00:00+00:00',
        },
      ],
      consistentWith: [
        {
          statement:
            'Consistent with a payment that times out leaving the order in a state delivery cannot pick up.',
          observedBasis: '12 records on which both domains recorded a failure across 8 days.',
          alsoConsistentWith:
            'Both domains failing independently on the same unusually large orders, with no relationship between them.',
          whatWouldDistinguish:
            'Check the recorded timestamps: if the delivery failure consistently follows the payment failure on the same record, that ordering is evidence the first explanation fits better.',
        },
      ],
      routing: {
        ownership: 'OwnerNotAssigned',
        owners: [unassignedOwner('payments'), unassignedOwner('delivery')],
        routingNote:
          'Nobody has been made owner of payments or delivery, so this link routes to nobody. Someone has to decide who owns each before it can be escalated.',
      },
      alternatives: [
        {
          alternative: 'Hold affected orders pending manual review',
          statement: 'Stop the orders on which both domains failed from progressing further.',
          availability: 'NoGovernedActionRegistered',
          governedActionKey: null,
          proposalPathway: 'There is no automated action for this. A person has to do it.',
          approvalRequirement: 'Not applicable — no governed action exists.',
          dependencies: [],
          impactStatement:
            'What this would achieve is not measured anywhere, so it cannot be stated.',
        },
      ],
    },
  ],
  belowEvidenceBar: [],
  decisionOwners: [],
  limitations: [
    'Channel, release, store and journey stage are never recorded by this platform, so no link can be broken down by them.',
    'The decision owner table is empty. Until someone is made owner of each domain, every link here routes to nobody.',
  ],
  ...overrides,
});

// ── Autonomous operations ───────────────────────────────────────────────────

export const comparison = (
  overrides: Partial<OperationOutcomeComparisonView> = {},
): OperationOutcomeComparisonView => ({
  measureKey: 'recurrences-after-repair',
  expectedUnit: 'count',
  expectedValue: 0,
  expectedMeasurementSource: 'commerce-genome',
  observeFromUtc: '2026-09-11T00:00:00+00:00',
  observeToUtc: '2026-09-18T00:00:00+00:00',
  declaredByAccountId: '9f0e8a10-0000-4000-8000-00000000000b',
  declaredUtc: '2026-09-10T09:00:00+00:00',
  measuredValue: null,
  measuredUnit: null,
  measurementSource: null,
  observedFromUtc: null,
  observedToUtc: null,
  recordedByAccountId: null,
  recordedUtc: null,
  comparison: 'NoMeasurementRecorded',
  differenceFromExpected: null,
  ...overrides,
});

export const monitorFixture = (
  overrides: Partial<OperationMonitorPage> = {},
): OperationMonitorPage => ({
  windowFromUtc: '2026-08-20T00:00:00+00:00',
  windowToUtc: '2026-09-19T00:00:00+00:00',
  rows: [
    {
      decisionId: '2f0e8a10-0000-4000-8000-000000000001',
      actionKey: 'commerce_genome.repair',
      requestingAgent: 'genome-agent',
      targetKind: 'commerce_fingerprint',
      targetId: 'fp-missing-size-attr',
      status: 'Executed',
      executedUtc: '2026-09-10T08:06:00+00:00',
      approvedByAccountId: null,
      expectationsDeclaredCount: 1,
      comparisons: [comparison()],
    },
    {
      decisionId: '2f0e8a10-0000-4000-8000-000000000002',
      actionKey: 'commerce_genome.repair',
      requestingAgent: 'genome-agent',
      targetKind: 'commerce_fingerprint',
      targetId: 'fp-courier-unassigned',
      status: 'Executed',
      executedUtc: '2026-09-12T14:00:00+00:00',
      approvedByAccountId: null,
      expectationsDeclaredCount: 0,
      comparisons: [],
    },
  ],
  executedDecisionsInWindow: 318,
  expectationsDeclaredInWindow: 3,
  decisionsWithNoExpectationDeclared: 315,
  expectationsNotYetObservable: 1,
  expectationsWithNoMeasurementRecorded: 2,
  expectationsComparedToAMeasurement: 0,
  decisionSource: 'GovernedAgentActions',
  expectationSource: 'IntelligenceDbContext.OperationExpectations',
  outcomeSource: 'IntelligenceDbContext.DecisionLedgerEntries',
  ...overrides,
});
