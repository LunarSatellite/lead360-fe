import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Stylemint KYC review queue — the gate every creator and vendor
 * application passes through before they can sell.
 *
 * Travels over the operator pass-through like the rest of the long tail, with real types here
 * because a screen is built on it.
 */

export const ApplicantKind = { Creator: 1, Vendor: 2 } as const;
export const APPLICANT_KIND_LABEL: Record<number, string> = { 1: 'Creator', 2: 'Vendor' };

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
  applicantKind: number;
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
export type KycApplicationDetail = {
  kycItemId: string;
  applicantKind: number;
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
    applicantKind?: number;
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

  /** Takes the item, so two reviewers do not decide the same application. */
  assign: async (kycItemId: string, reviewerAdminId: string): Promise<KycReviewItem> =>
    unwrap<KycReviewItem>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(kycItemId)}/assign`,
        body: JSON.stringify({ reviewerAdminId }),
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
