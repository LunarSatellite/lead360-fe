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

  /**
   * Who the courier is, hydrated by the backend from Identity at read time.
   *
   * Undefined/null means Identity did not resolve the account — render it as
   * "unknown" rather than blank. A reviewer deciding an identity question has
   * to be able to tell "no name on file" from "we could not ask", and the
   * previous page showed neither because these fields did not exist: it listed
   * account GUIDs, four ID digits and an opaque reference.
   */
  accountDisplayName?: string | null;
  accountEmail?: string | null;
  accountEmailVerified?: boolean | null;
  accountPhone?: string | null;

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

/**
 * One identity document on the courier's account. Mirrors Identity's
 * `VerificationDocumentDto`, which carries metadata only — the file's location
 * is fetched per document through {@link stylemintCouriersApi.documentLink},
 * so the URL of someone's passport scan is not in every list response.
 */
export type CourierDocument = {
  id: string;
  /**
   * Optional because the admin surface does not echo them: it resolved the
   * account from the courier profile to answer at all, so repeating the id
   * back would only invite a caller to key off it.
   */
  accountId?: string;
  sessionId?: string;
  documentType: number;
  side: number;
  contentType: string;
  contentSizeBytes: number;
  originalFilename?: string | null;
  status: number;
  uploadedUtc: string;
  reviewedUtc?: string | null;
  rejectionReason?: string | null;
};

/** Identity's `VerificationDocumentType`. 1-6 personal, 7-10 vendor business. */
/**
 * `VerificationDocumentType.SelfiePhoto`. The approval call's
 * `selfieMatchRef` has to point at something a later reviewer can open, and
 * this is how the selfie is found among the uploads.
 */
export const SELFIE_DOCUMENT_TYPE = 5;

export const DOCUMENT_TYPE_LABEL: Record<number, string> = {
  1: 'Passport',
  2: 'National ID card',
  3: "Driver's license",
  4: 'Residence permit',
  5: 'Selfie',
  6: 'Proof of address',
  7: 'PAN card',
  8: 'Citizenship certificate',
  9: 'Business registration',
  10: 'Tax document',
};

/** Identity's `VerificationDocumentSide`. 0 = single-page. */
export const DOCUMENT_SIDE_LABEL: Record<number, string> = {
  0: '',
  1: 'front',
  2: 'back',
};

/** Identity's `VerificationDocumentStatus`. */
export const DOCUMENT_STATUS_LABEL: Record<number, string> = {
  1: 'Uploaded',
  2: 'Under review',
  3: 'Approved',
  4: 'Rejected',
  5: 'Expired',
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

  /**
   * The identity documents the courier uploaded — the ID photos and the
   * selfie a reviewer has to actually look at.
   *
   * Keyed by `courierProfileId`, and read from the ADMIN surface.
   *
   * The documents themselves live on Identity's account-scoped pipeline
   * (`v1/accounts/{accountId}/verification-documents`), and this used to call
   * that directly — which can never work from here. The operator proxy
   * forwards `v1/admin/**` and vendor operations and answers 403
   * `unsupported_path` for everything else (`StylemintOperatorSurface`), so
   * every reviewer saw "no documents" against applicants who had uploaded
   * three. The backend now re-exposes them under
   * `v1/admin/couriers/{id}/documents`, which resolves the account from the
   * profile rather than taking it from us.
   *
   * Returns an empty list rather than throwing when the account has no
   * documents, so a courier who applied before document capture existed opens
   * without an error — there is genuinely nothing to show for them.
   */
  listDocuments: async (courierProfileId: string): Promise<CourierDocument[]> => {
    const response = await stylemintOperationsApi.invoke({
      method: 'GET',
      path: `${BASE}/${encodeURIComponent(courierProfileId)}/documents`,
    });
    if (response.status === 404) return [];
    return unwrap<CourierDocument[]>(response);
  },

  /**
   * Where to fetch one document's file. Separate call per document, by design
   * — see the backend's `GetDocumentLink`.
   */
  documentLink: async (
    courierProfileId: string,
    documentId: string,
  ): Promise<string> =>
    unwrap<{ url: string }>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path:
          `${BASE}/${encodeURIComponent(courierProfileId)}` +
          `/documents/${encodeURIComponent(documentId)}/link`,
      }),
    ).url,

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
