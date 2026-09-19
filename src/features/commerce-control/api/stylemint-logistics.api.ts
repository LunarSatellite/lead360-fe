import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the three delivery-side operator surfaces, which only make sense together:
 *
 *  - routing  — the stuck-offer queue, acceptance metrics, and a replan that takes a packageId
 *  - fulfilment — the assessment and decision history for one package
 *  - guardian — the intervention ledger, the constraints blocking it, and a manual sweep
 *
 * The stuck queue is what makes the rest reachable: replan and the fulfilment reads both need a
 * packageId, and nothing else hands one out.
 *
 * None of these carry step-up MFA.
 */

export const HopOfferState = {
  Pending: 1,
  Accepted: 2,
  Declined: 3,
  Expired: 4,
  Superseded: 5,
} as const;
export const HOP_OFFER_STATE_LABEL: Record<number, string> = {
  1: 'Pending',
  2: 'Accepted',
  3: 'Declined',
  4: 'Expired',
  5: 'Superseded',
};

/** Why an operator is forcing a fresh routing pass. AdminReplan is the one a human picks. */
export const ReplanReason = { HopFailed: 1, PackageException: 2, AdminReplan: 3 } as const;
export const REPLAN_REASON_LABEL: Record<number, string> = {
  1: 'Hop failed',
  2: 'Package exception',
  3: 'Admin replan',
};

export type HopOffer = {
  id: string;
  packageId: string;
  courierProfileId: string;
  tier: number;
  hopIndex: number;
  roundNumber: number;
  score: number;
  proposedPayoutAmount: number;
  proposedPayoutCurrency: string;
  fromGeohash: string;
  toGeohash: string;
  state: number;
  offeredUtc: string;
  expiresUtc: string;
  respondedUtc?: string | null;
  declineReason?: number | null;
  declineNote?: string | null;
};

export type StuckPage = {
  items: HopOffer[];
  totalCount: number;
  nextCursor?: string | null;
  previousCursor?: string | null;
  pageSize: number;
};

export type RoutingMetrics = {
  totalOffers: number;
  accepted: number;
  declined: number;
  expired: number;
  superseded: number;
  pending: number;
  acceptanceRate: number;
  expiryRate: number;
};

/** Guardian shapes are open on purpose — they are diagnostic records, not forms. */
export type GuardianRecord = Record<string, unknown>;

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ?? 'This delivery surface needs a Stylemint operator role an administrator grants.',
    );
  }
  throw new Error(detail ?? `The delivery surface returned HTTP ${response.status}.`);
}

export const stylemintLogisticsApi = {
  /** Offers that nobody took — the packages actually stuck in routing. */
  stuck: async (params: { cursor?: string; pageSize?: number } = {}): Promise<StuckPage> => {
    const query = new URLSearchParams();
    if (params.cursor) query.set('cursor', params.cursor);
    query.set('pageSize', String(params.pageSize ?? 25));

    return unwrap<StuckPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/routing/stuck',
        query: query.toString(),
      }),
    );
  },

  metrics: async (sinceUtc?: string): Promise<RoutingMetrics> => {
    const query = new URLSearchParams();
    if (sinceUtc) query.set('sinceUtc', sinceUtc);

    return unwrap<RoutingMetrics>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/routing/metrics',
        query: query.toString(),
      }),
    );
  },

  /** Forces a fresh routing pass for one package. */
  replan: async (packageId: string, reason: number, note?: string): Promise<unknown> =>
    unwrap<unknown>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/routing/replan/${encodeURIComponent(packageId)}`,
        body: JSON.stringify({ reason, note: note || null }),
      }),
    ),

  fulfilmentAssessment: async (packageId: string): Promise<GuardianRecord> =>
    unwrap<GuardianRecord>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/admin/fulfilment/${encodeURIComponent(packageId)}/assessment`,
      }),
    ),

  fulfilmentDecisions: async (packageId: string): Promise<GuardianRecord[]> =>
    unwrap<GuardianRecord[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/admin/fulfilment/${encodeURIComponent(packageId)}/decisions`,
      }),
    ),

  guardianInterventions: async (dimension = 1): Promise<GuardianRecord[]> =>
    unwrap<GuardianRecord[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/delivery/guardian/interventions',
        query: `dimension=${dimension}`,
      }),
    ),

  /** What is currently stopping the guardian from acting. */
  guardianConstraints: async (): Promise<GuardianRecord[]> =>
    unwrap<GuardianRecord[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/delivery/guardian/constraints',
      }),
    ),

  /** Runs the guardian by hand rather than waiting for its schedule. */
  guardianSweep: async (maxParcels = 200): Promise<GuardianRecord> =>
    unwrap<GuardianRecord>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/delivery/guardian/sweep',
        query: `maxParcels=${maxParcels}`,
      }),
    ),
};
