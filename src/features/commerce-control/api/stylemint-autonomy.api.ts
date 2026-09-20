import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the four governance surfaces that arrived with autonomous operations:
 *
 *  - autonomous-operations — what the platform did on its own, the expectations declared against
 *    those decisions, and the maintenance windows that pause an action
 *  - commerce-constitution — the rules an agent action is assessed against before it may run
 *  - retail-decision-twin  — studies comparing what a decision did against what a twin predicted
 *  - cart-offers           — the incrementality readout: did the offer cause the sale
 *
 * All SuperAdmin except the cart-offer readout. None carry step-up MFA.
 *
 * Opening a decision-twin study is deliberately absent: it takes nested assumption and arm
 * lists, which is a long structured form belonging with the study it defines. The governed
 * operations console generates it from the live schema. Same call as the decision-ledger writes.
 */

export const AgentActionRiskTier = { Low: 1, Medium: 2, High: 3, Critical: 4 } as const;
export type AgentActionRiskTierValue =
  (typeof AgentActionRiskTier)[keyof typeof AgentActionRiskTier];

export const RISK_TIER_LABEL: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

/** These return evolving report shapes; typed open rather than guessed at. */
export type Report = Record<string, unknown>;

export type DeclareExpectation = {
  measureKey: string;
  measureUnit: string;
  expectedValue: number;
  expectedMeasurementSource: string;
  observeFromUtc: string;
  observeToUtc: string;
  note?: string | null;
};

export type DeclareMaintenanceWindow = {
  actionKey: string;
  startsUtc: string;
  endsUtc: string;
  reason: string;
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // A 404 with no body at all is ASP.NET declining to route: this backend build does not carry
  // the controller. A 404 the controller itself produced has a body. Telling an operator
  // "nothing recorded yet" when the feature is simply absent would be a lie, so they differ.
  if (response.status === 404) {
    const empty = response.body == null || response.body === '';
    throw new Error(empty ? 'NOT_DEPLOYED' : 'NOT_FOUND');
  }
  if (response.status === 403) {
    throw new Error(
      detail ?? 'These governance surfaces take the Stylemint SuperAdmin role.',
    );
  }
  throw new Error(detail ?? `The autonomy surface returned HTTP ${response.status}.`);
}

export const stylemintAutonomyApi = {
  /** What ran autonomously in the window, and how it is being measured. */
  monitor: async (params: { skip?: number; take?: number } = {}): Promise<Report> => {
    const query = new URLSearchParams();
    query.set('skip', String(params.skip ?? 0));
    query.set('take', String(params.take ?? 50));

    return unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/autonomous-operations/monitor',
        query: query.toString(),
      }),
    );
  },

  /** Declaring what a decision was supposed to achieve, so the outcome can be judged later. */
  declareExpectation: async (
    decisionId: string,
    expectation: DeclareExpectation,
  ): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/autonomous-operations/decisions/${encodeURIComponent(decisionId)}/expectations`,
        body: JSON.stringify(expectation),
      }),
    ),

  /** Windows in which an action is paused. Filter by action key, or list them all. */
  maintenanceWindows: async (actionKey?: string): Promise<Report> => {
    const query = new URLSearchParams();
    if (actionKey) query.set('actionKey', actionKey);

    return unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/autonomous-operations/maintenance-windows',
        query: query.toString(),
      }),
    );
  },

  declareMaintenanceWindow: async (window: DeclareMaintenanceWindow): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/autonomous-operations/maintenance-windows',
        body: JSON.stringify(window),
      }),
    ),

  /** The rules an agent action is measured against. */
  constitution: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/commerce-constitution',
      }),
    ),

  /** Dry-runs one action against the constitution and reports what it would allow. */
  assessConstitution: async (params: {
    actionKey: string;
    riskTier: AgentActionRiskTierValue;
    previewJson?: string;
    requestPayloadJson?: string;
    executorSupportsRollback?: boolean;
  }): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/commerce-constitution/assessments',
        body: JSON.stringify({
          actionKey: params.actionKey,
          riskTier: params.riskTier,
          previewJson: params.previewJson || '{}',
          requestPayloadJson: params.requestPayloadJson || '{}',
          executorSupportsRollback: params.executorSupportsRollback ?? false,
        }),
      }),
    ),

  twinStudies: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/retail-decision-twin/studies',
      }),
    ),

  twinStudy: async (studyId: string): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/admin/retail-decision-twin/studies/${encodeURIComponent(studyId)}`,
      }),
    ),

  /** Whether cart offers actually caused the sales they are credited with. */
  cartOfferIncrementality: async (days = 30): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/cart-offers/incrementality',
        query: `days=${days}`,
      }),
    ),
};
