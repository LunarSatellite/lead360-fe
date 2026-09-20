import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * The commerce constitution: the rules an agent action is assessed against before it may run,
 * and the dry run that reports what they would allow.
 *
 * This client once covered four surfaces. Autonomous operations, the decision twin and the
 * cart-offer readout each have a dedicated page now, with their own client in
 * `intelligence-console` and `decision-twin`, so the duplicates here were removed rather than
 * left as a second way to call the same endpoint that could drift from the first.
 *
 * SuperAdmin. No step-up MFA.
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

/** The constitution is an evolving report shape, typed open rather than guessed at. */
export type Report = Record<string, unknown>;

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
    throw new Error(detail ?? 'The commerce constitution takes the Stylemint SuperAdmin role.');
  }
  throw new Error(detail ?? `The constitution surface returned HTTP ${response.status}.`);
}

export const stylemintAutonomyApi = {
  /** The rules in force. */
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
};
