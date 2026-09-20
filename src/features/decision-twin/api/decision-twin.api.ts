import axios from 'axios';
import { env } from '@/shared/config/env';
import { GovernanceError } from '@/features/agent-governance/api/agent-governance.api';
import type { GovernanceErrorBody } from '@/features/agent-governance/types/governance.types';
import type {
  DecisionTwinStudy,
  OpenDecisionTwinStudyBody,
  RecordDecisionTwinOutcomeBody,
  SimulationScenarioLibrary,
} from '../types/decision-twin.types';

/**
 * Client for `v1/admin/retail-decision-twin`.
 *
 * Same transport as the intelligence console and agent governance, for the same
 * two reasons and deliberately not a third one:
 *
 * 1. **Route.** `RetailDecisionTwinController` lives in `StyleMint.Core.Api` at
 *    the root `v1/admin/*`, not under Lead360's `/api` prefix, and the admin
 *    credential stays server-side. Lead360 re-hosts it through the operator
 *    pass-through, so we go the same way.
 *
 * 2. **Errors.** Every refusal on this surface is an HTTP 400 whose status
 *    says nothing; the body names the field. The shared `apiClient` drops
 *    `errorCode`, so we keep `validateStatus: () => true`, read the body
 *    verbatim, and throw the same `GovernanceError` the other admin consoles
 *    throw — the twin's "you omitted `horizon.days`" must reach the operator
 *    intact, because the only alternative is guessing the premise for them.
 *
 * The scenario library is read from `v1/admin/retail-simulation/scenarios`, the
 * twin's own sibling surface. The twin is a composition over the retail
 * simulation, not a second engine, so its scenario keys are that library's
 * keys, read from the server rather than listed here.
 */
const rawClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 120_000,
  validateStatus: () => true,
});

rawClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('omniflow_token');
  const tenantId = localStorage.getItem('omniflow_tenant_id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  return config;
});

/** Upstream admin path, forwarded through the operator pass-through. */
const via = (path: string) => `/v1/stylemint/operations/${path}`;

const TWIN = 'v1/admin/retail-decision-twin';

function unwrap<T>(response: { status: number; data: unknown }): T {
  if (response.status >= 400) {
    throw new GovernanceError(response.data as GovernanceErrorBody | undefined, response.status);
  }
  return response.data as T;
}

/**
 * Both writes on this controller are `[Idempotent]` and echo a replay rather
 * than re-running. A study opened twice by a flaky network would be two studies
 * whose figures differ only by seed, which is exactly the pair of runs an
 * operator would later mistake for a finding.
 */
const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } });

export const decisionTwinApi = {
  /** The scenario library the twin's `scenarioKey` must come from. */
  scenarios: async (): Promise<SimulationScenarioLibrary> =>
    unwrap(await rawClient.get(via('v1/admin/retail-simulation/scenarios'))),

  /** Define + Simulate — open a study and run every arm over every declared seed. */
  openStudy: async (body: OpenDecisionTwinStudyBody): Promise<DecisionTwinStudy> =>
    unwrap(await rawClient.post(via(`${TWIN}/studies`), body, idempotent())),

  /** Compare — the alternatives, their spreads, the declared limits, the sensitivity drivers. */
  study: async (studyId: string): Promise<DecisionTwinStudy> =>
    unwrap(await rawClient.get(via(`${TWIN}/studies/${encodeURIComponent(studyId)}`))),

  /** Learn — what was actually recorded, set beside the arm's simulated spread. */
  recordOutcome: async (
    studyId: string,
    armKey: string,
    body: RecordDecisionTwinOutcomeBody,
  ): Promise<DecisionTwinStudy> =>
    unwrap(
      await rawClient.post(
        via(
          `${TWIN}/studies/${encodeURIComponent(studyId)}/arms/${encodeURIComponent(armKey)}/outcome-comparisons`,
        ),
        body,
        idempotent(),
      ),
    ),
};
