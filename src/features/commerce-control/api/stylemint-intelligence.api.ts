import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the platform's decision-intelligence surfaces. All SuperAdmin, no step-up MFA.
 *
 *  - executive cockpit — the chain from signal to decision to measured outcome
 *  - decision ledger   — decisions on the record, their options and what they actually achieved
 *  - commerce genome   — diagnosis of recurring failures by fingerprint
 *  - aurora            — related signals and who owns the decision for them
 *  - retail simulation — scenarios and the runs consulted before a decision
 *
 * These return rich, evolving report shapes rather than fixed records, so they are typed as open
 * objects and rendered as reports. Inventing a narrow interface here would drift the first time
 * the backend adds a field, which is the DTO-drift failure this codebase has hit before.
 */

export type Report = Record<string, unknown>;

export type WindowQuery = {
  days?: number;
  page?: number;
  pageSize?: number;
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 404) throw new Error(detail ?? 'NOT_FOUND');
  if (response.status === 403) {
    throw new Error(
      detail ??
        'These surfaces take the Stylemint SuperAdmin role. An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The intelligence surface returned HTTP ${response.status}.`);
}

function windowQuery(q: WindowQuery = {}): string {
  const query = new URLSearchParams();
  query.set('days', String(q.days ?? 30));
  query.set('page', String(q.page ?? 1));
  query.set('pageSize', String(q.pageSize ?? 25));
  return query.toString();
}

export const stylemintIntelligenceApi = {
  cockpitChain: async (q: WindowQuery = {}): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/executive-cockpit',
        query: windowQuery(q),
      }),
    ),

  cockpitDecisions: async (q: WindowQuery = {}): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/executive-cockpit/decisions',
        query: windowQuery(q),
      }),
    ),

  ledger: async (q: WindowQuery = {}): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/decision-ledger',
        query: windowQuery(q),
      }),
    ),

  ledgerDecision: async (decisionId: string): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/admin/decision-ledger/${encodeURIComponent(decisionId)}`,
      }),
    ),

  genomeDiagnosis: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/commerce-genome/diagnosis',
      }),
    ),

  genomeThreshold: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/commerce-genome/diagnosis/threshold',
      }),
    ),

  /** Re-runs diagnosis over recorded failures. */
  genomeDiagnose: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/commerce-genome/diagnose',
      }),
    ),

  auroraSignals: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/aurora/related-signals',
      }),
    ),

  auroraOwners: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/aurora/decision-owners',
      }),
    ),

  simulationScenarios: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/retail-simulation/scenarios',
      }),
    ),

  simulationRun: async (runId: string): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/admin/retail-simulation/runs/${encodeURIComponent(runId)}`,
      }),
    ),
};
