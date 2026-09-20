import type {
  DecisionTwinStudy,
  SimulatedFigure,
  StatedQuantity,
} from '../../types/decision-twin.types';

/**
 * Payloads shaped exactly as `RetailDecisionTwinController` serialises them:
 * camelCase properties (ASP.NET Core's default) and string enum members (every
 * enum on this surface carries `[JsonConverter(typeof(JsonStringEnumConverter<…>))]`).
 *
 * These are fixtures for tests, never seed data for a page. Nothing in `src/`
 * outside `__fixtures__` imports them.
 */

export const figure = (over: Partial<SimulatedFigure> = {}): SimulatedFigure => ({
  provenance: 'Simulated',
  runId: '7d3a1f92-1111-4c0e-9f3a-aaaaaaaaaaaa',
  measureKey: 'synthetic.orders_completed',
  unit: 'count',
  simulatedValue: 1840,
  derivedFrom: 'synthetic.customers, horizon.days',
  scenarioClass: 'Normal',
  ...over,
});

export const stated = (over: Partial<StatedQuantity> = {}): StatedQuantity => ({
  statedValue: 5,
  unit: 'count',
  basis: 'OperatorStated',
  basisSource: 'seeds declared when the study was opened',
  observedFromUtc: null,
  observedToUtc: null,
  ...over,
});

/** A study with every section populated, as the server returns it after Open. */
export const fullStudy = (over: Partial<DecisionTwinStudy> = {}): DecisionTwinStudy => ({
  studyId: 'c0ffee00-2222-4d1b-8e77-bbbbbbbbbbbb',
  name: 'Free delivery over 50k across Gombe stores',
  provenance: 'Simulated',
  scope: {
    scopeDescription: 'Gombe cluster, all categories',
    scopeKeys: ['store.gombe-01', 'store.gombe-02'],
    horizon: stated({
      statedValue: 30,
      unit: 'days',
      basisSource: 'the operating period the proposal covers',
    }),
  },
  scenarioKey: 'normal.steady_demand',
  scenarioClass: 'Normal',
  engineVersion: 'retail-sim-1.4.0',
  replicatesPerArm: stated(),
  assumptions: [
    {
      assumptionKey: 'horizon.days',
      quantity: stated({ statedValue: 30, unit: 'days', basisSource: 'proposal window' }),
      note: null,
    },
    {
      assumptionKey: 'synthetic.customers',
      quantity: stated({
        statedValue: 12000,
        unit: 'count',
        basis: 'DerivedFromObservedWindow',
        basisSource: 'commerce.orders, distinct buyers',
        observedFromUtc: '2026-08-01T00:00:00+00:00',
        observedToUtc: '2026-08-31T00:00:00+00:00',
      }),
      note: 'Buyers seen in August.',
    },
  ],
  arms: [
    {
      armKey: 'baseline',
      armLabel: 'No change',
      isComparisonBaseline: true,
      proposedChange: {
        kind: 'Policy',
        changeKey: 'none',
        description: 'Nothing changes.',
        magnitude: stated({ statedValue: 0, unit: 'percent', basisSource: 'no-change baseline' }),
      },
      replicates: [
        {
          simulationRunId: '11111111-3333-4a4a-9b9b-cccccccccccc',
          reproducibility: {
            seed: 101,
            assumptionsFingerprint: 'a1b2c3d4e5f6a7b8',
            engineVersion: 'retail-sim-1.4.0',
            reRunInstruction: 'Fetch it on v1/admin/retail-simulation/runs/{runId}.',
          },
        },
      ],
    },
    {
      armKey: 'free-delivery',
      armLabel: 'Free delivery over 50k',
      isComparisonBaseline: false,
      proposedChange: {
        kind: 'Promotion',
        changeKey: 'delivery.free_over_threshold',
        description: 'Waive delivery above a 50k basket.',
        magnitude: stated({
          statedValue: 12,
          unit: 'percent',
          basisSource: 'the discount the proposal asks for',
        }),
      },
      replicates: [
        {
          simulationRunId: '22222222-4444-4b4b-8c8c-dddddddddddd',
          reproducibility: {
            seed: 101,
            assumptionsFingerprint: 'f6e5d4c3b2a19876',
            engineVersion: 'retail-sim-1.4.0',
            reRunInstruction: 'Fetch it on v1/admin/retail-simulation/runs/{runId}.',
          },
        },
      ],
    },
  ],
  comparison: [
    {
      measureKey: 'synthetic.orders_completed',
      unit: 'count',
      arms: [
        {
          armKey: 'baseline',
          isComparisonBaseline: true,
          lowest: figure({ simulatedValue: 1700 }),
          highest: figure({ simulatedValue: 1810 }),
          perReplicate: [figure({ simulatedValue: 1700 }), figure({ simulatedValue: 1810 })],
          replicatesExamined: stated(),
        },
        {
          armKey: 'free-delivery',
          isComparisonBaseline: false,
          lowest: figure({ simulatedValue: 1905 }),
          highest: figure({ simulatedValue: 2044 }),
          perReplicate: [figure({ simulatedValue: 1905 })],
          replicatesExamined: stated(),
        },
      ],
    },
  ],
  declaredConstraints: [
    {
      constraintKey: 'margin.floor',
      measureKey: 'synthetic.gross_margin_percent',
      unit: 'percent',
      direction: 'MustNotFallBelow',
      limit: stated({
        statedValue: 18,
        unit: 'percent',
        basisSource: 'finance policy FIN-114',
      }),
      arms: [
        {
          armKey: 'free-delivery',
          state: 'CrossedInSomeReplicates',
          replicatesCrossingLimit: figure({
            measureKey: 'synthetic.replicates_crossing_limit',
            simulatedValue: 2,
          }),
          replicatesExamined: stated(),
        },
      ],
    },
  ],
  sensitivityDrivers: [
    {
      armKey: 'free-delivery',
      assumptionKey: 'synthetic.customers',
      asStated: stated({ statedValue: 12000, basisSource: 'commerce.orders' }),
      varied: stated({ statedValue: 13200, basisSource: 'commerce.orders, varied +10%' }),
      reproducibility: {
        seed: 101,
        assumptionsFingerprint: '9988776655443322',
        engineVersion: 'retail-sim-1.4.0',
        reRunInstruction: 'An ordinary simulation run with the varied premise recorded on it.',
      },
      measures: [
        {
          measureKey: 'synthetic.orders_completed',
          unit: 'count',
          withAssumptionAsStated: figure({ simulatedValue: 1905 }),
          withAssumptionVaried: figure({ simulatedValue: 2096 }),
        },
      ],
    },
  ],
  learning: [],
  openedUtc: '2026-09-18T09:00:00+00:00',
  completedUtc: '2026-09-18T09:02:41+00:00',
  limitations: [
    'Every figure on this surface is simulated. None of them is a measurement of anything that happened, and none may be reported as one.',
    'Nothing here set a price, reserved stock, held inventory, created a cart or an order, or moved money.',
  ],
  ...over,
});

/**
 * A study the server returned with every list empty.
 *
 * This is the shape a page must read as "nothing was supplied", never as a set
 * of zeroes. A twin whose Learn section is empty is uncalibrated, which is not
 * the same as a twin whose simulation matched reality.
 */
export const emptyStudy = (): DecisionTwinStudy =>
  fullStudy({
    assumptions: [],
    arms: [],
    comparison: [],
    declaredConstraints: [],
    sensitivityDrivers: [],
    learning: [],
  });

/** The sentinel `GetAsync` emits when a study recorded no `horizon.days` premise. */
export const studyWithNoHorizonPremise = (): DecisionTwinStudy =>
  fullStudy({
    scope: {
      scopeDescription: 'Gombe cluster, all categories',
      scopeKeys: ['store.gombe-01'],
      horizon: stated({
        statedValue: 0,
        unit: 'days',
        basisSource: "no horizon premise was recorded on this study's replicates",
      }),
    },
  });
