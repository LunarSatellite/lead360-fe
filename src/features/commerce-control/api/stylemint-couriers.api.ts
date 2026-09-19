import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Stylemint courier admin surface — onboarding a courier through KYC,
 * background check and training, promoting their tier, and suspending or reinstating them.
 *
 * The list this is built on did not exist until now. Every action is keyed by
 * `courierProfileId`, and the only reads were by id or by account — both of which assume you
 * already know who you are looking for, so an operator could not find the couriers waiting on
 * KYC at all. `GET v1/admin/couriers` was added alongside this page.
 *
 * No step-up MFA on this surface, so the actions work from Lead360. Roles: KycReviewer for the
 * onboarding checks, SuperAdmin for tier promotion and suspension.
 */

export const CourierState = {
  Applied: 1,
  KycInReview: 2,
  Rejected: 3,
  Onboarded: 4,
  Active: 5,
  Suspended: 6,
  Banned: 7,
} as const;
export type CourierStateValue = (typeof CourierState)[keyof typeof CourierState];

export const COURIER_STATE_LABEL: Record<number, string> = {
  1: 'Applied',
  2: 'KYC in review',
  3: 'Rejected',
  4: 'Onboarded',
  5: 'Active',
  6: 'Suspended',
  7: 'Banned',
};

export const DeliveryTier = { Neighbor: 1, Traveler: 2, Pro: 3 } as const;
export const TIER_LABEL: Record<number, string> = {
  1: 'Neighbor',
  2: 'Traveler',
  3: 'Pro',
};

export type CourierProfile = {
  id: string;
  accountId: string;
  state: number;
  currentTier: number;
  governmentIdLast4?: string | null;
  kycVerifiedUtc?: string | null;
  backgroundCheckPassedUtc?: string | null;
  trainingPassedUtc?: string | null;
  onboardedUtc?: string | null;
  travelerUnlockedUtc?: string | null;
  proUnlockedUtc?: string | null;
  suspendedUtc?: string | null;
  suspendedReason?: string | null;
  failureStreak: number;
  homeGeohash: string;
};

const BASE = 'v1/admin/couriers';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Your operator account has no Stylemint courier role yet. Reading takes KycReviewer, ' +
          'SuperAdmin or Readonly; promoting and suspending take SuperAdmin.',
    );
  }
  throw new Error(detail ?? `The courier surface returned HTTP ${response.status}.`);
}

/** POSTs an action with no request body. */
async function act(courierProfileId: string, action: string): Promise<CourierProfile> {
  return unwrap<CourierProfile>(
    await stylemintOperationsApi.invoke({
      method: 'POST',
      path: `${BASE}/${encodeURIComponent(courierProfileId)}/${action}`,
    }),
  );
}

export const stylemintCouriersApi = {
  list: async (params: {
    state?: CourierStateValue;
    skip?: number;
    take?: number;
  }): Promise<CourierProfile[]> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    query.set('skip', String(params.skip ?? 0));
    query.set('take', String(params.take ?? 50));

    return unwrap<CourierProfile[]>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  /** Approves or rejects the identity check. Rejection needs a reason. */
  completeKyc: async (
    courierProfileId: string,
    decision: {
      approved: boolean;
      governmentIdLast4?: string;
      selfieMatchRef?: string;
      rejectionReason?: string;
    },
  ): Promise<CourierProfile> =>
    unwrap<CourierProfile>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(courierProfileId)}/kyc/complete`,
        body: JSON.stringify({
          approved: decision.approved,
          governmentIdLast4: decision.governmentIdLast4 ?? '',
          selfieMatchRef: decision.selfieMatchRef ?? '',
          rejectionReason: decision.rejectionReason || null,
        }),
      }),
    ),

  recordBackgroundCheckPass: (id: string) => act(id, 'background-check-pass'),
  recordTrainingPass: (id: string) => act(id, 'training-pass'),
  promoteToTraveler: (id: string) => act(id, 'promote/traveler'),
  promoteToPro: (id: string) => act(id, 'promote/pro'),
  reinstate: (id: string) => act(id, 'reinstate'),

  suspend: async (courierProfileId: string, reason: string): Promise<CourierProfile> =>
    unwrap<CourierProfile>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(courierProfileId)}/suspend`,
        body: JSON.stringify({ reason }),
      }),
    ),
};
