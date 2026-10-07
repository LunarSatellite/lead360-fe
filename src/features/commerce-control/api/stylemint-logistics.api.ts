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

/**
 * A parcel that exists and has no courier on it.
 *
 * Not the same thing as a stuck offer, and the distinction is the whole point. `stuck` pages
 * hop offers in Pending or Expired state — an offer went out and nothing came back. This is the
 * case that produces no offer at all: the router ran, the rules matched, no eligible courier was
 * found, and `offersIssued` was zero. There is nothing for an offer query to page, so these
 * parcels were absent from every operator surface while sitting undelivered.
 */
export type PackageAwaitingCourier = {
  packageId: string;
  subOrderId: string;
  trackingNumber: string;
  state: number;
  originGeohash: string;
  destinationGeohash: string;
  /**
   * Whether both ends share a 5-character geohash cell. Usually the answer to "why has nothing
   * happened": the routing rules scope Neighbour couriers to one locality, so a cross-locality
   * parcel cannot reach them however many are on shift.
   */
  sameLocality: boolean;
  createdUtc: string;
  waitingHours: number;
};

export type AwaitingCourierPage = {
  items: PackageAwaitingCourier[];
  totalCount: number;
  nextCursor?: string | null;
  previousCursor?: string | null;
  pageSize: number;
};

/**
 * A courier this parcel may be offered to, with the figures behind the choice.
 *
 * Produced by the routing pipeline itself, not a separate query — so a courier absent from this
 * list is one the router would refuse, and a directed offer to them is rejected for the same
 * reason. An empty list means no eligible courier exists for this parcel right now, which is the
 * honest answer rather than an empty dropdown.
 */
export type CourierPick = {
  courierProfileId: string;
  tier: number;
  currentGeohash: string;
  /** The router's own score. The order the automatic auction would have used. */
  score: number;
  reliability: number;
  rating: number;
  recentDeclines24h: number;
  earningsLast7Days: number;
  proposedPayoutAmount: number;
  proposedPayoutCurrency: string;
};

export const DELIVERY_TIER_LABEL: Record<number, string> = {
  1: 'Neighbour',
  2: 'Traveller',
  3: 'Pro',
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
  /**
   * The dispatch queue: parcels with no courier, longest wait first.
   *
   * Read this before `stuck` when diagnosing "nothing reached a delivery partner". A parcel the
   * router found nobody for never produced an offer, so `stuck` cannot show it.
   */
  awaitingCourier: async (params: { skip?: number; take?: number } = {}): Promise<AwaitingCourierPage> => {
    const query = new URLSearchParams();
    query.set('skip', String(params.skip ?? 0));
    query.set('take', String(params.take ?? 25));

    return unwrap<AwaitingCourierPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/delivery/packages/awaiting-courier',
        query: query.toString(),
      }),
    );
  },

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

  /** Couriers this parcel may be offered to, best score first. Reads only. */
  candidates: async (packageId: string): Promise<CourierPick[]> =>
    unwrap<CourierPick[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/admin/routing/candidates/${encodeURIComponent(packageId)}`,
      }),
    ),

  /**
   * Offers the parcel to one named courier instead of the open pool.
   *
   * Refused with routing.courier_not_eligible when that courier is off shift, outside the
   * locality, or of a tier the route does not admit. The offer carries the ordinary 90-second
   * window, so an unanswered pick expires and the round advances to the open pool on its own —
   * a pick delays dispatch by at most one window rather than stranding the parcel.
   */
  offerToCourier: async (
    packageId: string,
    courierProfileId: string,
    note?: string,
  ): Promise<unknown> =>
    unwrap<unknown>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path:
          `v1/admin/routing/offer/${encodeURIComponent(packageId)}` +
          `/courier/${encodeURIComponent(courierProfileId)}`,
        body: JSON.stringify({ note: note || null }),
      }),
    ),

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
