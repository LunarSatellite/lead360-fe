import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Stylemint KYC review queue — the gate every creator and vendor
 * application passes through before they can sell, and (EMI phase 1) the gate a buyer passes
 * through to reach KYC Tier 2 before they can pay in instalments.
 *
 * Travels over the operator pass-through like the rest of the long tail, with real types here
 * because a screen is built on it.
 */

/**
 * Admin's `KycApplicantKind`. Serialised as a number today (the enum carries no string
 * converter), but the EMI contract asks for string enums on anything new, so readers go through
 * `applicantKindName` in `lib/kyc-review.ts`, which accepts either.
 *
 * `Customer` is a buyer's Tier-2 identity check for EMI. Its number is assumed to be the next
 * free value on the backend enum; the queue filter sends the NAME, which ASP.NET binds whatever
 * the number turns out to be.
 */
export const ApplicantKind = { Creator: 1, Vendor: 2, Customer: 3 } as const;
export type ApplicantKindName = keyof typeof ApplicantKind;

/**
 * Admin's `KycDecisionReasonCode` — a closed set. The backend rejects any other string, and
 * pairs each code with one kind of rejection: retryable codes with "may reapply", terminal codes
 * with "final". The free-text field this replaced could only ever produce a 400 on a rejection.
 */
export const KYC_REASON_CODES = {
  retryable: ['DOCS_UNCLEAR', 'DOCS_MISMATCH', 'CATEGORY_MISSING', 'POLICY_VIOLATION_RECOVERABLE'],
  terminal: ['FRAUD_SUSPECTED', 'SANCTIONS_HIT', 'UNDERAGE'],
} as const;
export type KycReasonCode =
  | (typeof KYC_REASON_CODES.retryable)[number]
  | (typeof KYC_REASON_CODES.terminal)[number];

export const REASON_CODE_LABEL: Record<KycReasonCode, string> = {
  DOCS_UNCLEAR: 'Documents unclear or unreadable',
  DOCS_MISMATCH: 'Details do not match the documents',
  CATEGORY_MISSING: 'Product category missing',
  POLICY_VIOLATION_RECOVERABLE: 'Policy issue that can be fixed',
  FRAUD_SUSPECTED: 'Fraud suspected',
  SANCTIONS_HIT: 'Sanctions list match',
  UNDERAGE: 'Under 18',
};

export const ReviewState = { Pending: 1, InReview: 2, Decided: 3 } as const;
export const REVIEW_STATE_LABEL: Record<number, string> = {
  1: 'Pending',
  2: 'In review',
  3: 'Decided',
};

export const KycDecision = {
  Approved: 1,
  RejectedRetryable: 2,
  RejectedTerminal: 3,
} as const;
export type KycDecisionValue = (typeof KycDecision)[keyof typeof KycDecision];

export const DECISION_LABEL: Record<number, string> = {
  1: 'Approved',
  2: 'Rejected — may reapply',
  3: 'Rejected — final',
};

export type KycReviewItem = {
  id: string;
  /** A number today; a name if the backend moves the enum to strings. */
  applicantKind: number | string;
  applicationId: string;
  accountId: string;
  state: number;
  assignedReviewerId?: string | null;
  submittedUtc: string;
  dueByUtc: string;
  decidedUtc?: string | null;
  decision?: number | null;
  decisionReasonCode?: string | null;
  decisionNote?: string | null;
};

/**
 * One identity/business document the applicant uploaded.
 *
 * Metadata only — the file itself is not served here. Identity treats the blob
 * reference as internal storage detail, and a KYC image is not something to
 * hand out on a list endpoint.
 */
export type KycApplicationDocument = {
  id: string;
  documentType: string;
  /**
   * Customer KYC only, both optional: the buyer upload's own kind from the EMI contract
   * (`CitizenshipFront`, `PassportBio`, `Selfie`, …) and/or Identity's document side
   * (`Front`/`Back`, or 1/2). Either is enough to place the image in the comparison view; with
   * neither, the document is still listed, just not placed beside the selfie.
   */
  kind?: string | null;
  side?: string | number | null;
  status: string;
  originalFilename?: string | null;
  contentType: string;
  contentSizeBytes: number;
  uploadedUtc: string;
  rejectionReason?: string | null;
};

/**
 * The case file behind a queue row: who applied, what they said, what they sent.
 *
 * The queue item itself carries only ids, so until this endpoint existed a
 * reviewer was deciding on a GUID.
 */
/** One earlier, already-decided submission by the same buyer. */
export type KycPreviousAttempt = {
  kycItemId?: string | null;
  submittedUtc: string;
  decidedUtc?: string | null;
  decision?: number | string | null;
  decisionReasonCode?: string | null;
  decisionNote?: string | null;
};

export type KycApplicationDetail = {
  kycItemId: string;
  applicantKind: number | string;
  applicationId: string;
  accountId: string;
  displayName: string;
  legalName?: string | null;
  countryCode?: string | null;
  city?: string | null;
  addressLine?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  story?: string | null;
  commissionMinPercent?: number | null;
  commissionMaxPercent?: number | null;
  submittedUtc: string;
  expectedDecisionByUtc?: string | null;
  documents: KycApplicationDocument[];

  // Customer (EMI Tier 2) only. All optional: absent on creator and vendor rows, and a
  // customer row must still open against a backend that has not filled them in yet.

  /** Legal name as the buyer typed it; `displayName` is the fallback. */
  fullName?: string | null;
  /** ISO date, `YYYY-MM-DD`. */
  dateOfBirth?: string | null;
  /**
   * `Citizenship | NationalId | Passport` — the identity the buyer is claiming, as on the
   * contract's submit body. Not to be confused with each uploaded document's `documentType`.
   */
  documentType?: string | null;
  /**
   * The ID number. Whichever of these arrives, the console masks it to the last four, so a full
   * number never reaches the screen even if the backend sends one.
   */
  documentNumberMasked?: string | null;
  documentNumberLast4?: string | null;
  documentNumber?: string | null;
  postalCode?: string | null;
  /** Earlier decided submissions by the same account, newest first. */
  previousAttempts?: KycPreviousAttempt[] | null;
};

export type KycQueuePage = {
  items: KycReviewItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

const BASE = 'v1/admin/kyc';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // The KYC endpoints allow KycReviewer, SuperAdmin and (for reads) Readonly. A 403 here is
  // almost always a missing role rather than a malformed request, so say that.
  if (response.status === 403) {
    throw new Error(
      detail ??
        'Your operator account has no Stylemint KYC role yet. ' +
          'An administrator grants KycReviewer before applications can be reviewed.',
    );
  }
  throw new Error(detail ?? `The KYC queue returned HTTP ${response.status}.`);
}

export const stylemintKycApi = {
  queue: async (params: {
    /** Sent by name: ASP.NET binds an enum query value from its name as well as its number. */
    applicantKind?: ApplicantKindName;
    state?: number;
    overdueOnly?: boolean;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<KycQueuePage> => {
    const query = new URLSearchParams();
    if (params.applicantKind) query.set('applicantKind', String(params.applicantKind));
    if (params.state) query.set('state', String(params.state));
    if (params.overdueOnly) query.set('overdueOnly', 'true');
    query.set('pageNumber', String(params.pageNumber ?? 1));
    query.set('pageSize', String(params.pageSize ?? 50));

    return unwrap<KycQueuePage>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: `${BASE}/queue`, query: query.toString() }),
    );
  },

  get: async (kycItemId: string): Promise<KycReviewItem> =>
    unwrap<KycReviewItem>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(kycItemId)}`,
      }),
    ),

  /** The applicant's details and uploaded documents behind a queue row. */
  application: async (kycItemId: string): Promise<KycApplicationDetail> =>
    unwrap<KycApplicationDetail>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(kycItemId)}/application`,
      }),
    ),

  /**
   * Where to fetch one document's file — `{ url }` — so a reviewer can look at it.
   *
   * Per document and on demand, like the courier panel's: the URL of someone's ID scan is
   * disclosed only when a reviewer asks to see it, never alongside the list.
   */
  documentLink: async (kycItemId: string, documentId: string): Promise<string> =>
    unwrap<{ url: string }>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path:
          `${BASE}/${encodeURIComponent(kycItemId)}` +
          `/documents/${encodeURIComponent(documentId)}/link`,
      }),
    ).url,

  /**
   * Takes the item, moving it Pending → In review. A decision is only legal on an
   * item that is already In review, so this is the first half of every review.
   *
   * Omitting the reviewer claims the item for whoever is calling — and the console
   * has no choice but to omit it. Lead360 forwards these calls with a server-side
   * Stylemint credential, so the browser never learns its own admin account id.
   */
  assign: async (kycItemId: string, reviewerAdminId?: string): Promise<KycReviewItem> =>
    unwrap<KycReviewItem>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(kycItemId)}/assign`,
        body: JSON.stringify(reviewerAdminId ? { reviewerAdminId } : {}),
      }),
    ),

  decide: async (
    kycItemId: string,
    decision: KycDecisionValue,
    reasonCode?: string,
    note?: string,
  ): Promise<KycReviewItem> =>
    unwrap<KycReviewItem>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(kycItemId)}/decide`,
        body: JSON.stringify({
          decision,
          decisionReasonCode: reasonCode || null,
          decisionNote: note || null,
        }),
      }),
    ),
};
