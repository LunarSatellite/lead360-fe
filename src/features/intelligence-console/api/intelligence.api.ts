import axios from 'axios';
import { env } from '@/shared/config/env';
import { GovernanceError } from '@/features/agent-governance/api/agent-governance.api';
import type { GovernanceErrorBody } from '@/features/agent-governance/types/governance.types';
import type {
  ActionLimitView,
  AuroraDecisionOwnerTableDto,
  AuroraRecordSignalsDto,
  AuroraRelatedSignalsPageDto,
  DeclareExpectationBody,
  DeclareImplementationWindowBody,
  DecisionLedgerAppendedDto,
  DecisionLedgerEntryDto,
  DecisionLedgerPageDto,
  ExecutiveChainDto,
  ExecutiveDecisionTraceDto,
  ExecutiveDecisionTracePageDto,
  FailureDiagnosisDto,
  FailureDiagnosisPageDto,
  MaintenanceWindowView,
  OperationExpectationView,
  OperationMonitorPage,
  RecordDecisionOptionBody,
  RecordOutcomeMeasurementBody,
  RecurrenceThresholdDto,
} from '../types/intelligence.types';

/**
 * Client for the five Phase-4 intelligence read surfaces.
 *
 * This is the same transport the agent-governance slice established, for the
 * same two reasons, and deliberately not a second one:
 *
 * 1. **Route.** These controllers live in `StyleMint.Core.Api` alongside
 *    `GovernedAgentActionsController`, at the root `v1/admin/*` rather than
 *    under Lead360's `/api` prefix, and the admin credential stays
 *    server-side. Lead360 re-hosts that whole surface through the operator
 *    pass-through (`api/v1/stylemint/operations/{**path}`), so we go the same
 *    way agent-governance does.
 *
 * 2. **Errors.** The shared `apiClient` drops `errorCode` from ProblemDetails
 *    on this surface, and every refusal here is an HTTP 400 whose status tells
 *    us nothing. We keep `validateStatus: () => true` and read the body
 *    verbatim, and we throw the **same** `GovernanceError` the approval centre
 *    throws so that one refusal notice serves both consoles.
 */
const rawClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 60_000,
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

function unwrap<T>(response: { status: number; data: unknown }): T {
  if (response.status >= 400) {
    throw new GovernanceError(response.data as GovernanceErrorBody | undefined, response.status);
  }
  return response.data as T;
}

/**
 * Writes on these controllers accept an `Idempotency-Key` and echo a replay
 * rather than re-running it. An option recorded twice by a flaky network must
 * not become two options in the ledger.
 */
const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } });

/**
 * The window every read takes. `days` is the server's own default of 30 when
 * omitted. The cockpit and the ledger page with `page`/`pageSize`; the
 * autonomous-operations monitor pages with `skip`/`take` — that difference is
 * the servers', not ours, so both spellings are carried rather than unified.
 */
export interface WindowQuery {
  days?: number;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  pageSize?: number;
  skip?: number;
  take?: number;
}

const params = (query: WindowQuery | undefined) => ({ params: query ?? {} });

export const intelligenceApi = {
  // ── 1. Executive cockpit ──────────────────────────────────────────────────
  cockpitChain: async (query?: WindowQuery): Promise<ExecutiveChainDto> =>
    unwrap(await rawClient.get(via('v1/admin/executive-cockpit'), params(query))),

  cockpitDecisions: async (query?: WindowQuery): Promise<ExecutiveDecisionTracePageDto> =>
    unwrap(await rawClient.get(via('v1/admin/executive-cockpit/decisions'), params(query))),

  cockpitDecision: async (id: string): Promise<ExecutiveDecisionTraceDto> =>
    unwrap(
      await rawClient.get(via(`v1/admin/executive-cockpit/decisions/${encodeURIComponent(id)}`)),
    ),

  // ── 2. Decision memory ledger ─────────────────────────────────────────────
  ledger: async (query?: WindowQuery): Promise<DecisionLedgerPageDto> =>
    unwrap(await rawClient.get(via('v1/admin/decision-ledger'), params(query))),

  ledgerEntry: async (decisionId: string): Promise<DecisionLedgerEntryDto> =>
    unwrap(await rawClient.get(via(`v1/admin/decision-ledger/${encodeURIComponent(decisionId)}`))),

  recordOption: async (
    decisionId: string,
    body: RecordDecisionOptionBody,
  ): Promise<DecisionLedgerAppendedDto> =>
    unwrap(
      await rawClient.post(
        via(`v1/admin/decision-ledger/${encodeURIComponent(decisionId)}/options`),
        body,
        idempotent(),
      ),
    ),

  declareImplementationWindow: async (
    decisionId: string,
    body: DeclareImplementationWindowBody,
  ): Promise<DecisionLedgerAppendedDto> =>
    unwrap(
      await rawClient.post(
        via(`v1/admin/decision-ledger/${encodeURIComponent(decisionId)}/implementation-window`),
        body,
        idempotent(),
      ),
    ),

  recordOutcomeMeasurement: async (
    decisionId: string,
    body: RecordOutcomeMeasurementBody,
  ): Promise<DecisionLedgerAppendedDto> =>
    unwrap(
      await rawClient.post(
        via(`v1/admin/decision-ledger/${encodeURIComponent(decisionId)}/outcome-measurements`),
        body,
        idempotent(),
      ),
    ),

  // ── 3. Failure diagnosis ──────────────────────────────────────────────────
  diagnosis: async (lookbackDays?: number): Promise<FailureDiagnosisPageDto> =>
    unwrap(
      await rawClient.get(via('v1/admin/commerce-genome/diagnosis'), {
        params: lookbackDays ? { lookbackDays } : {},
      }),
    ),

  diagnosisThreshold: async (): Promise<RecurrenceThresholdDto> =>
    unwrap(await rawClient.get(via('v1/admin/commerce-genome/diagnosis/threshold'))),

  diagnosisFingerprint: async (
    fingerprint: string,
    lookbackDays?: number,
  ): Promise<FailureDiagnosisDto> =>
    unwrap(
      await rawClient.get(
        via(`v1/admin/commerce-genome/diagnosis/${encodeURIComponent(fingerprint)}`),
        { params: lookbackDays ? { lookbackDays } : {} },
      ),
    ),

  // ── 4. Aurora relate ──────────────────────────────────────────────────────
  relatedSignals: async (lookbackDays?: number): Promise<AuroraRelatedSignalsPageDto> =>
    unwrap(
      await rawClient.get(via('v1/admin/aurora/related-signals'), {
        params: lookbackDays ? { lookbackDays } : {},
      }),
    ),

  recordSignals: async (
    targetKind: string,
    targetId: string,
    lookbackDays?: number,
  ): Promise<AuroraRecordSignalsDto> =>
    unwrap(
      await rawClient.get(
        via(
          `v1/admin/aurora/related-signals/${encodeURIComponent(targetKind)}/${encodeURIComponent(targetId)}`,
        ),
        { params: lookbackDays ? { lookbackDays } : {} },
      ),
    ),

  decisionOwners: async (lookbackDays?: number): Promise<AuroraDecisionOwnerTableDto> =>
    unwrap(
      await rawClient.get(via('v1/admin/aurora/decision-owners'), {
        params: lookbackDays ? { lookbackDays } : {},
      }),
    ),

  // ── 5. Autonomous operations ──────────────────────────────────────────────
  monitor: async (query?: WindowQuery): Promise<OperationMonitorPage> =>
    unwrap(await rawClient.get(via('v1/admin/autonomous-operations/monitor'), params(query))),

  declareExpectation: async (
    decisionId: string,
    body: DeclareExpectationBody,
  ): Promise<OperationExpectationView> =>
    unwrap(
      await rawClient.post(
        via(
          `v1/admin/autonomous-operations/decisions/${encodeURIComponent(decisionId)}/expectations`,
        ),
        body,
        idempotent(),
      ),
    ),

  maintenanceWindows: async (): Promise<MaintenanceWindowView[]> =>
    unwrap(await rawClient.get(via('v1/admin/autonomous-operations/maintenance-windows'))),

  actionLimits: async (): Promise<ActionLimitView[]> =>
    unwrap(await rawClient.get(via('v1/admin/autonomous-operations/action-limits'))),
};
