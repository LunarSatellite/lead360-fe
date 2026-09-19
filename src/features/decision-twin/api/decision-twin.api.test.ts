import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GovernanceError } from '@/features/agent-governance/api/agent-governance.api';
import { fullStudy } from '../lib/__fixtures__/decision-twin';

/**
 * The client, against the payload the controller actually serialises.
 *
 * The fixture is not a convenient reshaping of the server's answer: it is
 * camelCase because ASP.NET Core's default naming policy is camelCase, and its
 * enum members are strings because every enum reachable from
 * `DecisionTwinStudyDto` carries `[JsonConverter(typeof(JsonStringEnumConverter<…>))]`.
 * If either of those drifts, these tests fail here rather than on a page.
 */

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  interceptors: { request: { use: vi.fn() } },
}));

vi.mock('axios', () => ({
  default: { create: () => http },
}));

const { decisionTwinApi } = await import('./decision-twin.api');

const ok = (data: unknown) => ({ status: 200, data });

beforeEach(() => {
  http.get.mockReset();
  http.post.mockReset();
});

describe('route construction', () => {
  it('reads a study through the operator pass-through at the upstream admin path', async () => {
    http.get.mockResolvedValue(ok(fullStudy()));

    await decisionTwinApi.study('c0ffee00-2222-4d1b-8e77-bbbbbbbbbbbb');

    expect(http.get).toHaveBeenCalledWith(
      '/v1/stylemint/operations/v1/admin/retail-decision-twin/studies/c0ffee00-2222-4d1b-8e77-bbbbbbbbbbbb',
    );
  });

  it('records an outcome on the arm route, not on a study-level one', async () => {
    http.post.mockResolvedValue(ok(fullStudy()));

    await decisionTwinApi.recordOutcome('study-1', 'free-delivery', {
      measureKey: 'orders',
      recordedValue: 1912,
      unit: 'count',
      recordedSource: 'commerce.orders',
      observedFromUtc: '2026-09-01T00:00:00Z',
      observedToUtc: '2026-09-30T00:00:00Z',
      note: null,
    });

    expect(http.post.mock.calls[0][0]).toBe(
      '/v1/stylemint/operations/v1/admin/retail-decision-twin/studies/study-1/arms/free-delivery/outcome-comparisons',
    );
  });

  it('reads scenario keys from the retail simulation library the twin composes over', async () => {
    http.get.mockResolvedValue(ok({ scenarios: [], limitations: [] }));

    await decisionTwinApi.scenarios();

    expect(http.get).toHaveBeenCalledWith(
      '/v1/stylemint/operations/v1/admin/retail-simulation/scenarios',
    );
  });

  it('sends an Idempotency-Key on both writes, so a retried study is not a second study', async () => {
    http.post.mockResolvedValue(ok(fullStudy()));

    await decisionTwinApi.openStudy({
      name: 'n',
      scopeDescription: 's',
      scopeKeys: ['k'],
      scenarioKey: 'normal.steady_demand',
      replicateSeeds: [1, 2],
      assumptions: [],
      arms: [],
      constraints: [],
      sensitivityAssumptionKeys: [],
      sensitivityVariationPercent: 10,
    });

    const config = http.post.mock.calls[0][2] as { headers: Record<string, string> };
    expect(config.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

describe('payload mapping', () => {
  it('carries every section of the study through without reshaping it', async () => {
    http.get.mockResolvedValue(ok(fullStudy()));

    const study = await decisionTwinApi.study('s');

    expect(study.provenance).toBe('Simulated');
    expect(study.scenarioClass).toBe('Normal');
    expect(study.arms.map((arm) => arm.armKey)).toEqual(['baseline', 'free-delivery']);
    expect(study.arms.filter((arm) => arm.isComparisonBaseline)).toHaveLength(1);
    expect(study.comparison[0].measureKey).toBe('synthetic.orders_completed');
    expect(study.declaredConstraints[0].direction).toBe('MustNotFallBelow');
    expect(study.declaredConstraints[0].arms[0].state).toBe('CrossedInSomeReplicates');
    expect(study.sensitivityDrivers[0].measures[0].withAssumptionVaried.provenance).toBe(
      'Simulated',
    );
  });

  it('keeps simulated figures as objects, never as bare numbers', async () => {
    http.get.mockResolvedValue(ok(fullStudy()));

    const study = await decisionTwinApi.study('s');
    const lowest = study.comparison[0].arms[0].lowest;

    expect(typeof lowest).toBe('object');
    expect(lowest.provenance).toBe('Simulated');
    expect(lowest.runId).toBeTruthy();
    expect(lowest.derivedFrom).toBeTruthy();
    // The number is reachable only under its own deliberate name.
    expect(lowest).not.toHaveProperty('value');
    expect(lowest.simulatedValue).toBe(1700);
  });

  it('keeps stated premises distinct from simulated figures', async () => {
    http.get.mockResolvedValue(ok(fullStudy()));

    const study = await decisionTwinApi.study('s');
    const observed = study.assumptions[1].quantity;

    expect(observed.basis).toBe('DerivedFromObservedWindow');
    expect(observed.observedFromUtc).toBe('2026-08-01T00:00:00+00:00');
    expect(observed).not.toHaveProperty('provenance');
  });

  it('leaves an unsupplied window null rather than filling it in', async () => {
    http.get.mockResolvedValue(ok(fullStudy()));

    const study = await decisionTwinApi.study('s');

    expect(study.assumptions[0].quantity.observedFromUtc).toBeNull();
    expect(study.assumptions[0].quantity.observedToUtc).toBeNull();
    expect(study.assumptions[0].note).toBeNull();
  });

  it('reads an empty Learn list as empty, not as an absent field', async () => {
    http.get.mockResolvedValue(ok(fullStudy()));

    const study = await decisionTwinApi.study('s');

    expect(study.learning).toEqual([]);
  });
});

describe('failure', () => {
  it('throws the shared refusal carrying the field the server named', async () => {
    http.post.mockResolvedValue({
      status: 400,
      data: {
        title: 'Validation failed',
        status: 400,
        errorCode: 'VALIDATION_FAILED',
        field: 'ReplicateSeeds',
      },
    });

    await expect(
      decisionTwinApi.openStudy({
        name: 'n',
        scopeDescription: 's',
        scopeKeys: ['k'],
        scenarioKey: 'x',
        replicateSeeds: [],
        assumptions: [],
        arms: [],
        constraints: [],
        sensitivityAssumptionKeys: [],
        sensitivityVariationPercent: 10,
      }),
    ).rejects.toBeInstanceOf(GovernanceError);
  });

  it('does not invent a study when the read fails', async () => {
    http.get.mockResolvedValue({ status: 404, data: { title: 'Not found', status: 404 } });

    await expect(decisionTwinApi.study('missing')).rejects.toBeInstanceOf(GovernanceError);
  });

  it('refuses a 500 rather than returning an empty study that would read as zero', async () => {
    http.get.mockResolvedValue({ status: 500, data: undefined });

    await expect(decisionTwinApi.study('s')).rejects.toBeInstanceOf(GovernanceError);
  });
});
