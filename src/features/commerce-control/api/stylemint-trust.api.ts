import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the three trust surfaces: whether a profile is verified, what an account's
 * reputation says, and whether a product-passport claim stands up.
 *
 * All three are **id-driven, and deliberately so** — the backend exposes no queue for any of
 * them. There is no "unverified vendors" list, no "accounts needing recomputation" list and no
 * passport-claim review queue. Each endpoint takes an id the operator already has, from the
 * customers page, an application or a support ticket. The page says that rather than pretending
 * a queue exists behind it.
 *
 * The role split is per action: verification is KycReviewer/SuperAdmin, recompute is
 * SupportAgent/ContentMod, badge revocation is ContentMod, seeding definitions is SuperAdmin.
 */

export const ReputationFacet = {
  BuyerReliability: 1,
  ReviewerCredibility: 2,
  CreatorEngagement: 3,
  CourierReliability: 4,
  VendorFulfillment: 5,
} as const;
export type ReputationFacetValue = (typeof ReputationFacet)[keyof typeof ReputationFacet];

export const REPUTATION_FACET_LABEL: Record<number, string> = {
  1: 'Buyer reliability',
  2: 'Reviewer credibility',
  3: 'Creator engagement',
  4: 'Courier reliability',
  5: 'Vendor fulfilment',
};

/** Mirrors PassportAssurance. `Recorded` means nobody looked, so a check cannot end there. */
export const PassportAssurance = {
  Recorded: 1,
  Verified: 2,
  VerificationFailed: 3,
  CouldNotVerify: 4,
} as const;
export type PassportAssuranceValue = (typeof PassportAssurance)[keyof typeof PassportAssurance];

export const PASSPORT_ASSURANCE_LABEL: Record<number, string> = {
  1: 'Recorded (nobody looked)',
  2: 'Verified',
  3: 'Verification failed',
  4: 'Could not verify',
};

/** What a completed check may record. The backend validator rejects `Recorded` outright. */
export const COMPLETED_ASSURANCE_OUTCOMES: PassportAssuranceValue[] = [
  PassportAssurance.Verified,
  PassportAssurance.VerificationFailed,
  PassportAssurance.CouldNotVerify,
];

export type ProfileVerification = {
  accountId: string;
  isVerified: boolean;
  verifiedUtc?: string | null;
};

export type TrustResult = Record<string, unknown>;

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 404) throw new Error(detail ?? 'No record with that id.');
  if (response.status === 409) {
    throw new Error(detail ?? 'That profile is already in the state you asked for.');
  }
  if (response.status === 403) {
    throw new Error(
      detail ??
        'This action needs a Stylemint operator role an administrator grants — verification is ' +
          'KycReviewer, badge revocation is ContentMod, seeding is SuperAdmin.',
    );
  }
  throw new Error(detail ?? `The trust surface returned HTTP ${response.status}.`);
}

export const stylemintTrustApi = {
  setVendorVerified: async (accountId: string, verified: boolean): Promise<ProfileVerification> =>
    unwrap<ProfileVerification>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/vendors/${encodeURIComponent(accountId)}/${verified ? 'verify' : 'unverify'}`,
      }),
    ),

  setCreatorVerified: async (accountId: string, verified: boolean): Promise<ProfileVerification> =>
    unwrap<ProfileVerification>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/creators/${encodeURIComponent(accountId)}/${verified ? 'verify' : 'unverify'}`,
      }),
    ),

  /** Omitting the facet recomputes every facet for the account. */
  recomputeReputation: async (
    accountId: string,
    kind?: ReputationFacetValue,
  ): Promise<TrustResult> =>
    unwrap<TrustResult>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/reputation/${encodeURIComponent(accountId)}/recompute`,
        body: JSON.stringify({ kind: kind ?? null }),
      }),
    ),

  /**
   * Revokes an awarded badge. `superAdminOverride` is for revoking one the normal rules protect,
   * and is only honoured for a SuperAdmin.
   */
  revokeBadge: async (
    awardId: string,
    reason: string,
    superAdminOverride = false,
  ): Promise<TrustResult> =>
    unwrap<TrustResult>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/reputation/badges/${encodeURIComponent(awardId)}/revoke`,
        body: JSON.stringify({ reason, superAdminOverride }),
      }),
    ),

  /** Seeds the badge definitions. Idempotent; reports how many were created. */
  seedBadgeDefinitions: async (): Promise<TrustResult> =>
    unwrap<TrustResult>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/reputation/badges/seed',
      }),
    ),

  /** Records the outcome of checking one product-passport claim. A method is required. */
  verifyPassportClaim: async (
    recordId: string,
    outcome: PassportAssuranceValue,
    verificationMethod: string,
    verificationNote?: string,
  ): Promise<TrustResult> =>
    unwrap<TrustResult>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/catalog/passport-claims/${encodeURIComponent(recordId)}/verification`,
        body: JSON.stringify({
          outcome,
          verificationMethod,
          verificationNote: verificationNote || null,
        }),
      }),
    ),
};
