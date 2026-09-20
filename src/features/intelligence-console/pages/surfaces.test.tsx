import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderPage } from '../lib/__fixtures__/render';
import {
  chainFixture,
  diagnosisFixture,
  ledgerEntryFixture,
  monitorFixture,
  period,
  relatedSignalsFixture,
  thinEvidenceDiagnosisFixture,
  traceFixture,
  decisionNotExecuted,
} from '../lib/__fixtures__/intelligence';

/**
 * Each of the five surfaces renders from a fixture shaped like what the API
 * returns today — including the parts of that answer that are "we cannot tell
 * you".
 */
vi.mock('../api/intelligence.api', () => ({
  intelligenceApi: {
    cockpitChain: vi.fn(),
    cockpitDecisions: vi.fn(),
    cockpitDecision: vi.fn(),
    ledger: vi.fn(),
    ledgerEntry: vi.fn(),
    diagnosis: vi.fn(),
    diagnosisThreshold: vi.fn(),
    diagnosisFingerprint: vi.fn(),
    relatedSignals: vi.fn(),
    recordSignals: vi.fn(),
    decisionOwners: vi.fn(),
    monitor: vi.fn(),
    declareExpectation: vi.fn(),
    maintenanceWindows: vi.fn(),
    actionLimits: vi.fn(),
  },
}));

const { intelligenceApi } = await import('../api/intelligence.api');
const api = intelligenceApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

const ExecutiveCockpitPage = (await import('./ExecutiveCockpitPage')).default;
const DecisionLedgerPage = (await import('./DecisionLedgerPage')).default;
const DecisionLedgerEntryPage = (await import('./DecisionLedgerEntryPage')).default;
const FailureDiagnosisPage = (await import('./FailureDiagnosisPage')).default;
const AuroraRelatePage = (await import('./AuroraRelatePage')).default;
const AutonomousOperationsPage = (await import('./AutonomousOperationsPage')).default;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── 1. Executive cockpit ────────────────────────────────────────────────────

describe('the executive cockpit', () => {
  beforeEach(() => {
    api.cockpitChain.mockResolvedValue(chainFixture());
    api.cockpitDecisions.mockResolvedValue({
      period: period(),
      generatedUtc: '2026-09-19T09:00:00+00:00',
      source: 'GovernedAgentActions',
      page: 1,
      pageSize: 25,
      hasMore: false,
      items: [traceFixture()],
    });
  });

  it('renders the chain from the fixture', async () => {
    renderPage(<ExecutiveCockpitPage />);

    expect(await screen.findByTestId('attribution-panel')).toBeInTheDocument();
    expect(screen.getByTestId('signals-panel')).toBeInTheDocument();
    expect(screen.getByTestId('decisions-panel')).toBeInTheDocument();
  });

  it('states plainly that no decision is traceable to settled money', async () => {
    renderPage(<ExecutiveCockpitPage />);

    const settled = await screen.findByTestId('attribution-SettledOutcomeRecorded');
    expect(settled).toHaveAttribute('data-count', '0');
    expect(settled).toHaveTextContent('0');

    const notMoneyBearing = screen.getByTestId('attribution-TargetKindNotMoneyBearing');
    expect(notMoneyBearing).toHaveAttribute('data-count', '318');
    expect(notMoneyBearing).toHaveTextContent(
      'The only registered executor targets an abstract fingerprint',
    );
  });

  it('keeps the two unattributable reasons apart', async () => {
    renderPage(<ExecutiveCockpitPage />);

    expect(await screen.findByTestId('attribution-TargetKindNotMoneyBearing')).toHaveAttribute(
      'data-attribution',
      'TargetKindNotMoneyBearing',
    );
    expect(screen.getByTestId('attribution-DecisionNotExecuted')).toHaveAttribute(
      'data-attribution',
      'DecisionNotExecuted',
    );
  });

  it('reports no traced settled money as an absence, not as a zero balance', async () => {
    renderPage(<ExecutiveCockpitPage />);

    expect(await screen.findByTestId('traced-settled')).toHaveAttribute(
      'data-absent',
      'NoSettledMoneyTracedToAnyDecision',
    );
  });

  it('computes no total across the attribution buckets', async () => {
    renderPage(<ExecutiveCockpitPage />);

    const panel = await screen.findByTestId('attribution-panel');
    // 318 + 94 = 412. The page must not assert that figure here.
    expect(panel).not.toHaveTextContent('412');
    expect(panel.textContent).not.toMatch(/total/i);
  });

  it('shows the server’s limitations, including that there is no value-created figure', async () => {
    renderPage(<ExecutiveCockpitPage />);

    const limitations = await screen.findByTestId('cockpit-limitations');
    expect(limitations).toHaveTextContent('The platform records no such figure');
    expect(limitations).toHaveTextContent('never converted or totalled across currencies');
  });

  it('labels a trace with no settled outcome using the server’s attribution note', async () => {
    renderPage(<ExecutiveCockpitPage />);

    const settled = await screen.findByTestId('settled-2f0e8a10-0000-4000-8000-000000000001');
    expect(within(settled).getByText('TargetKindNotMoneyBearing')).toBeInTheDocument();
    expect(settled).toHaveTextContent('which no money module owns');
  });
});

// ── 2. Decision memory ledger ───────────────────────────────────────────────

describe('the decision memory ledger', () => {
  it('renders the server’s unrecorded counts rather than tallying the page', async () => {
    api.ledger.mockResolvedValue({
      period: period(),
      generatedUtc: '2026-09-19T09:00:00+00:00',
      page: 1,
      pageSize: 25,
      hasMore: false,
      items: [ledgerEntryFixture()],
      unrecordedElements: [
        {
          key: 'options-not-recorded',
          label: 'Decisions with no options recorded',
          source: 'DecisionLedgerEntries',
          period: period(),
          count: 410,
        },
      ],
      limitations: ['Options considered and measured results are recorded by people.'],
    });

    renderPage(<DecisionLedgerPage />);

    const unrecorded = await screen.findByTestId('unrecorded-options-not-recorded');
    expect(unrecorded).toHaveAttribute('data-count', '410');
    expect(unrecorded).toHaveTextContent('Last 30 days');
  });

  it('shows the four ledger states as four distinguishable tokens', async () => {
    api.ledger.mockResolvedValue({
      period: period(),
      generatedUtc: '2026-09-19T09:00:00+00:00',
      page: 1,
      pageSize: 25,
      hasMore: false,
      items: [
        ledgerEntryFixture(),
        ledgerEntryFixture({
          decisionId: '2f0e8a10-0000-4000-8000-000000000002',
          measuredResult: decisionNotExecuted(),
        }),
      ],
      unrecordedElements: [],
      limitations: [],
    });

    renderPage(<DecisionLedgerPage />);

    expect(
      await screen.findByTestId('outcome-chip-2f0e8a10-0000-4000-8000-000000000001'),
    ).toHaveAttribute('data-state', 'OutcomeNotMeasured');
    expect(
      screen.getByTestId('outcome-chip-2f0e8a10-0000-4000-8000-000000000002'),
    ).toHaveAttribute('data-state', 'DecisionNotExecuted');
  });

  it('renders one entry with every unrecorded part named', async () => {
    api.ledgerEntry.mockResolvedValue(ledgerEntryFixture());

    renderPage(<DecisionLedgerEntryPage />, {
      path: '/ledger/:decisionId',
      route: '/ledger/2f0e8a10-0000-4000-8000-000000000001',
    });

    expect(await screen.findByTestId('options-considered')).toHaveAttribute(
      'data-options-state',
      'OptionsNotRecorded',
    );
    expect(screen.getByTestId('implementation-window')).toHaveAttribute(
      'data-window-state',
      'WindowNotDeclared',
    );
    expect(screen.getByTestId('measured-result')).toHaveAttribute(
      'data-outcome-state',
      'OutcomeNotMeasured',
    );
    expect(screen.getByTestId('entry-approver')).toHaveTextContent('NoApproverRecorded');
  });

  it('does not offer a measurement form for a decision that never ran', async () => {
    api.ledgerEntry.mockResolvedValue(
      ledgerEntryFixture({ measuredResult: decisionNotExecuted() }),
    );

    renderPage(<DecisionLedgerEntryPage />, {
      path: '/ledger/:decisionId',
      route: '/ledger/2f0e8a10-0000-4000-8000-000000000001',
    });

    expect(await screen.findByTestId('measured-result')).toHaveAttribute(
      'data-outcome-state',
      'DecisionNotExecuted',
    );
    expect(screen.queryByText('Record a measured result')).not.toBeInTheDocument();
    expect(screen.getByText(/Nothing is owed here/)).toBeInTheDocument();
  });

  it('renders consulted simulations in the simulated visual language', async () => {
    api.ledgerEntry.mockResolvedValue(ledgerEntryFixture());

    renderPage(<DecisionLedgerEntryPage />, {
      path: '/ledger/:decisionId',
      route: '/ledger/2f0e8a10-0000-4000-8000-000000000001',
    });

    const consulted = await screen.findByTestId('simulations-consulted');
    expect(consulted).toHaveAttribute('data-provenance', 'Simulated');
    expect(consulted).toHaveTextContent('Simulated input');
  });
});

// ── 3. Failure diagnosis ────────────────────────────────────────────────────

describe('failure diagnosis', () => {
  beforeEach(() => {
    api.diagnosisThreshold.mockResolvedValue({
      minimumOccurrences: 5,
      minimumDistinctRecords: 3,
      minimumDistinctDays: 3,
      lookbackDays: 30,
      configurationSection: 'Intelligence:FailureDiagnosis',
      justification: 'Below this, one bad afternoon reads as a pattern.',
    });
  });

  it('renders every hypothesis with its rival and its distinguishing check', async () => {
    api.diagnosis.mockResolvedValue({
      window: { fromUtc: '2026-08-20T00:00:00+00:00', toUtc: '2026-09-19T00:00:00+00:00', days: 30 },
      method: 'Grouped by fingerprint over recorded commerce failures.',
      causationCaveat: 'Nothing here is a cause. These are observations and what they fit.',
      observationsRead: {
        observed: 1284,
        denominator: 1284,
        denominatorMeaning: 'All commerce failures recorded in the window.',
        percentOfDenominator: 100,
      },
      thresholdApplied: {
        minimumOccurrences: 5,
        minimumDistinctRecords: 3,
        minimumDistinctDays: 3,
        lookbackDays: 30,
        configurationSection: 'Intelligence:FailureDiagnosis',
        justification: 'Below this, one bad afternoon reads as a pattern.',
      },
      sourceModulesObserved: ['catalog'],
      recurring: [diagnosisFixture()],
      belowThreshold: [thinEvidenceDiagnosisFixture()],
      limitations: ['Only failures a module chose to record appear here.'],
    });

    renderPage(<FailureDiagnosisPage />);

    const card = await screen.findByTestId('diagnosis-fp-missing-size-attr');
    expect(within(card).getByText(/^Consistent with/)).toBeInTheDocument();
    expect(within(card).getByTestId('also-consistent-with')).toHaveTextContent(
      'A rule defect in the attribute mapper',
    );
    expect(within(card).getByTestId('what-would-distinguish')).toHaveTextContent(
      'Read the raw supplier payload',
    );
  });

  it('shows the causation caveat before any fingerprint', async () => {
    api.diagnosis.mockResolvedValue({
      window: { fromUtc: '2026-08-20T00:00:00+00:00', toUtc: '2026-09-19T00:00:00+00:00', days: 30 },
      method: 'Grouped by fingerprint over recorded commerce failures.',
      causationCaveat: 'Nothing here is a cause. These are observations and what they fit.',
      observationsRead: {
        observed: 1284,
        denominator: 1284,
        denominatorMeaning: 'All commerce failures recorded in the window.',
        percentOfDenominator: 100,
      },
      thresholdApplied: {
        minimumOccurrences: 5,
        minimumDistinctRecords: 3,
        minimumDistinctDays: 3,
        lookbackDays: 30,
        configurationSection: 'Intelligence:FailureDiagnosis',
        justification: 'Below this, one bad afternoon reads as a pattern.',
      },
      sourceModulesObserved: ['catalog'],
      recurring: [diagnosisFixture()],
      belowThreshold: [],
      limitations: [],
    });

    renderPage(<FailureDiagnosisPage />);

    expect(await screen.findByText(/Nothing here is a cause/)).toBeInTheDocument();
  });

  it('prints an empty consistentWith as a refusal to speculate', async () => {
    api.diagnosis.mockResolvedValue({
      window: { fromUtc: '2026-08-20T00:00:00+00:00', toUtc: '2026-09-19T00:00:00+00:00', days: 30 },
      method: 'Grouped by fingerprint over recorded commerce failures.',
      causationCaveat: 'Nothing here is a cause.',
      observationsRead: {
        observed: 2,
        denominator: 1284,
        denominatorMeaning: 'All commerce failures recorded in the window.',
        percentOfDenominator: 0.16,
      },
      thresholdApplied: {
        minimumOccurrences: 5,
        minimumDistinctRecords: 3,
        minimumDistinctDays: 3,
        lookbackDays: 30,
        configurationSection: 'Intelligence:FailureDiagnosis',
        justification: 'Below this, one bad afternoon reads as a pattern.',
      },
      sourceModulesObserved: ['catalog'],
      recurring: [],
      belowThreshold: [thinEvidenceDiagnosisFixture()],
      limitations: [],
    });

    renderPage(<FailureDiagnosisPage />);

    const empty = await screen.findByTestId('consistent-with-fp-rare-workflow-defect');
    expect(empty).toHaveAttribute('data-absent', 'NoHypothesisOffered');
    expect(screen.getByTestId('diagnosis-fp-rare-workflow-defect')).toHaveAttribute(
      'data-meets-threshold',
      'false',
    );
    expect(screen.getByTestId('unmet-criteria')).toHaveTextContent('MinimumOccurrences');
  });
});

// ── 4. Aurora relate ────────────────────────────────────────────────────────

describe('aurora relate', () => {
  beforeEach(() => {
    api.relatedSignals.mockResolvedValue(relatedSignalsFixture());
    api.decisionOwners.mockResolvedValue({
      window: {
        fromUtc: '2026-08-20T00:00:00+00:00',
        toUtc: '2026-09-19T00:00:00+00:00',
        days: 30,
      },
      generatedUtc: '2026-09-19T09:00:00+00:00',
      configurationSection: 'Intelligence:AuroraRelate:DecisionOwners',
      routingNote: 'No decision owner has been configured for any domain.',
      configured: [],
      domainsObservedWithoutOwner: ['payments', 'delivery', 'catalog'],
      limitations: ['Ownership is a decision nobody has made yet.'],
    });
  });

  it('shows the dimensions the platform never records, up front', async () => {
    renderPage(<AuroraRelatePage />);

    const dimensions = await screen.findByTestId('dimensions-not-available');
    for (const dimension of ['channel', 'release', 'store', 'journey stage']) {
      expect(dimensions).toHaveTextContent(dimension);
    }
    expect(dimensions).toHaveTextContent('absence of data, not evidence that they are unrelated');
  });

  it('says the owner table is empty rather than showing an empty list', async () => {
    renderPage(<AuroraRelatePage />);

    const absent = await screen.findByTestId('no-owners-configured');
    expect(absent).toHaveAttribute('data-absent', 'NoDecisionOwnersConfigured');
    expect(absent).toHaveTextContent('a decision waiting to be made, not a data gap');
  });

  it('routes every link to nobody while no owner is assigned', async () => {
    renderPage(<AuroraRelatePage />);

    const routing = await screen.findByTestId('routing-payments↔delivery');
    expect(routing).toHaveAttribute('data-ownership', 'OwnerNotAssigned');
    expect(routing).toHaveTextContent('routes to nobody');
  });

  it('shows the co-occurrence caveat and never calls a link a cause', async () => {
    renderPage(<AuroraRelatePage />);

    expect(await screen.findByText(/Co-occurrence on the same record is not causation/)).toBeInTheDocument();
    const link = screen.getByTestId('link-payments↔delivery');
    expect(link.textContent).not.toMatch(/\bcaused\b|\bbecause of\b/i);
  });

  it('names an alternative with no governed action as having none', async () => {
    renderPage(<AuroraRelatePage />);

    const link = await screen.findByTestId('link-payments↔delivery');
    // Said twice on purpose: once as the alternative's availability, once where
    // the governed action key would otherwise have been a blank field.
    expect(within(link).getAllByText('NoGovernedActionRegistered')).toHaveLength(2);
    expect(link).toHaveTextContent('There is no automated action for this. A person has to do it.');
  });
});

// ── 5. Autonomous operations ────────────────────────────────────────────────

describe('autonomous operations', () => {
  beforeEach(() => {
    api.monitor.mockResolvedValue(monitorFixture());
    api.maintenanceWindows.mockResolvedValue([]);
    api.actionLimits.mockResolvedValue([]);
  });

  it('reports the two gap counts as first-class figures with their window', async () => {
    renderPage(<AutonomousOperationsPage />);

    const noExpectation = await screen.findByTestId('no-expectation-declared');
    expect(noExpectation).toHaveAttribute('data-count', '315');
    expect(noExpectation).toHaveTextContent('nobody said in advance what they were supposed to achieve');
    expect(noExpectation).toHaveTextContent('source: GovernedAgentActions');

    const noMeasurement = screen.getByTestId('no-measurement-recorded');
    expect(noMeasurement).toHaveAttribute('data-count', '2');
    expect(noMeasurement).toHaveTextContent('Nobody went back to check.');
  });

  it('keeps "not yet observable" apart from "nobody measured it"', async () => {
    renderPage(<AutonomousOperationsPage />);

    expect(await screen.findByTestId('not-yet-observable')).toHaveTextContent('Nobody is late.');
    expect(screen.getByTestId('no-measurement-recorded')).toHaveTextContent(
      'Nobody went back to check.',
    );
  });

  it('renders an unmeasured expectation as an absence, not as a zero result', async () => {
    renderPage(<AutonomousOperationsPage />);

    const comparison = await screen.findByTestId('comparison-recurrences-after-repair');
    expect(comparison).toHaveAttribute('data-comparison', 'NoMeasurementRecorded');
    expect(screen.getByTestId('measured-recurrences-after-repair')).toHaveTextContent(
      'NoMeasurementRecorded',
    );
    expect(screen.getByTestId('difference-recurrences-after-repair')).toHaveTextContent(
      'DifferenceNotComputable',
    );
  });

  it('says a decision has no expectation rather than showing an empty comparison list', async () => {
    renderPage(<AutonomousOperationsPage />);

    const absent = await screen.findByTestId(
      'no-expectation-2f0e8a10-0000-4000-8000-000000000002',
    );
    expect(absent).toHaveAttribute('data-absent', 'NoExpectationDeclared');
  });

  it('reports an empty maintenance-window list as a declaration, not a blank', async () => {
    renderPage(<AutonomousOperationsPage />);

    expect(await screen.findByText('NoMaintenanceWindowDeclared')).toBeInTheDocument();
    expect(screen.getByText('NoActionLimitDeclared')).toBeInTheDocument();
  });
});

// ── The rule that cuts across all five ──────────────────────────────────────

describe('no surface computes a score, a total or a health figure', () => {
  const BANNED = /\b(health score|overall score|composite|success rate|coverage %|grade)\b/i;

  it('the cockpit does not', async () => {
    api.cockpitChain.mockResolvedValue(chainFixture());
    api.cockpitDecisions.mockResolvedValue({
      period: period(),
      generatedUtc: '2026-09-19T09:00:00+00:00',
      source: 'GovernedAgentActions',
      page: 1,
      pageSize: 25,
      hasMore: false,
      items: [traceFixture()],
    });

    const { container } = renderPage(<ExecutiveCockpitPage />);
    await screen.findByTestId('attribution-panel');
    expect(container.textContent ?? '').not.toMatch(BANNED);
  });

  it('autonomous operations does not, though it holds six counts that invite one', async () => {
    api.monitor.mockResolvedValue(monitorFixture());
    api.maintenanceWindows.mockResolvedValue([]);
    api.actionLimits.mockResolvedValue([]);

    const { container } = renderPage(<AutonomousOperationsPage />);
    await screen.findByTestId('monitor-counts');

    const text = container.textContent ?? '';
    expect(text).not.toMatch(BANNED);
    // 315 of 318 would be 99.06%. No such figure is asserted.
    expect(text).not.toMatch(/99\.\d/);
    expect(text).not.toMatch(/%/);
  });
});
