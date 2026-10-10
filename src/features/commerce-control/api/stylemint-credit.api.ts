import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for Stylemint credit administration — EMI, pay later and pay-now-buy-later
 * agreements, the risk decisions behind them, the guarantee reserve, and payments held back.
 *
 * Travels over the operator pass-through (`v1/admin/**` is forwarded with the operator's own
 * minted administrator credential), so the backend's role checks apply as they would anywhere:
 * reads need SuperAdmin, PayoutsOps or Readonly; deciding needs SuperAdmin or PayoutsOps;
 * recording reserve capital and running aging need SuperAdmin.
 *
 * Field names here are pinned on the backend by `CreditWireContractTests`, which serialises real
 * DTOs and fails if one is renamed. Enums arrive as their pinned numbers.
 */

export const AgreementKind = { Instalment: 1, PayLater: 2, Prepay: 3 } as const;
export type AgreementKindValue = (typeof AgreementKind)[keyof typeof AgreementKind];

export const Guarantor = { Vendor: 1, Platform: 2, Partner: 3, None: 4 } as const;
export type GuarantorValue = (typeof Guarantor)[keyof typeof Guarantor];

export const AgreementState = {
  PendingApproval: 1,
  Approved: 2,
  Active: 3,
  Completed: 4,
  Defaulted: 5,
  Declined: 6,
  Cancelled: 7,
  Expired: 8,
} as const;
export type AgreementStateValue = (typeof AgreementState)[keyof typeof AgreementState];

export const InstalmentState = {
  Scheduled: 1,
  PartiallyPaid: 2,
  Paid: 3,
  Overdue: 4,
  Waived: 5,
} as const;

export const RiskBand = { A: 1, B: 2, C: 3, D: 4 } as const;
export const RiskOutcome = { Approve: 1, Refer: 2, Decline: 3 } as const;

export const DelinquencyBucket = {
  Current: 0,
  Days1To30: 1,
  Days31To60: 2,
  Days61To90: 3,
  Over90: 4,
} as const;
export type DelinquencyBucketValue = (typeof DelinquencyBucket)[keyof typeof DelinquencyBucket];

export const PaymentPurpose = { Activation: 1, Instalment: 2, Payoff: 3 } as const;

/** A held payment's state: still held, being refunded, or refunded. */
export const HeldPaymentState = { Held: 4, RefundRequested: 5, Refunded: 6 } as const;

export type CreditInstalment = {
  number: number;
  /** A calendar date (`YYYY-MM-DD`) in the business time zone; null until the plan starts. */
  dueDate: string | null;
  scheduledAmount: number;
  principalDue: number;
  interestDue: number;
  lateFeeDue: number;
  paid: number;
  outstanding: number;
  state: number;
  paidUtc: string | null;
};

export type CreditAgreement = {
  id: string;
  buyerAccountId: string;
  vendorAccountId: string;
  productId: string;
  variantId: string;
  kind: AgreementKindValue;
  guarantor: GuarantorValue;
  state: AgreementStateValue;
  /** Reason codes behind the current state — why it was referred, declined or defaulted. */
  stateReasons: string[];
  currency: string;
  price: number;
  downPayment: number;
  financed: number;
  tenureMonths: number;
  interestMethod: number;
  totalInterest: number;
  totalPayable: number;
  aprPercent: number;
  outstanding: number;
  outstandingPrincipal: number;
  payoffAmountToday: number | null;
  daysPastDue: number;
  delinquency: DelinquencyBucketValue;
  appliedUtc: string;
  approvalExpiresUtc: string | null;
  activatedUtc: string | null;
  goodsReleasedUtc: string | null;
  closedUtc: string | null;
  needsActivationPayment: boolean;
  instalments: CreditInstalment[];
};

/**
 * The risk decision behind an agreement, recorded when it was made and never changed.
 * `factors` and `signals` are the JSON the decision stored, as strings — read them through
 * `parseFactors` / `parseSignals` in `lib/credit-console.ts`, which tolerate anything.
 */
export type RiskAssessment = {
  id: string;
  buyerAccountId: string;
  kind: AgreementKindValue;
  guarantor: GuarantorValue;
  price: number;
  financed: number;
  score: number;
  band: number;
  creditLimit: number;
  availableCredit: number;
  outcome: number;
  reasons: string[];
  factors: string;
  signals: string;
  policyVersion: string;
  assessedUtc: string;
};

export type PortfolioSlice = {
  state: AgreementStateValue;
  kind: AgreementKindValue;
  guarantor: GuarantorValue;
  count: number;
  outstandingPrincipal: number;
};

export type DelinquencySlice = {
  bucket: DelinquencyBucketValue;
  guarantor: GuarantorValue;
  count: number;
  outstandingPrincipal: number;
};

/** The whole book, summed by the database — never a total over a page of rows. */
export type CreditPortfolio = {
  asOf: string;
  slices: PortfolioSlice[];
  delinquency: DelinquencySlice[];
  unappliedPaymentCount: number;
  unappliedPaymentAmount: number;
};

export type ReserveSummary = {
  reserveBalance: number;
  guaranteedOutstanding: number;
  /** Null when nothing is guaranteed: coverage of an empty book is not a number. */
  coverageRatio: number | null;
  minimumCoverageRatio: number;
  guaranteeHeadroom: number;
  writtenOffToDate: number;
  riskFeePercent: number;
  platformGuaranteeEnabled: boolean;
};

/** A payment that arrived and was held back, and where its refund stands. */
export type UnappliedPayment = {
  attemptId: string;
  agreementId: string;
  buyerAccountId: string;
  purpose: number;
  /** `HeldPaymentState`. */
  state: number;
  amountRequested: number;
  currency: string;
  /** What actually arrived — and what a refund returns. Null on rows held before it was recorded. */
  amountReceived: number | null;
  currencyReceived: string | null;
  paymentIntentId: string | null;
  reason: string;
  initiatedUtc: string;
  heldUtc: string | null;
  refundRequestedUtc: string | null;
  refundNote: string | null;
  refundId: string | null;
  providerRefundId: string | null;
  refundedUtc: string | null;
  /** Why the last refund did not go through, when it did not. */
  lastRefundError: string | null;
};

export type AgingRunSummary = {
  aged: number;
  newlyOverdue: number;
  lateFeesAssessed: number;
  defaulted: number;
  reminders: number;
  expired: number;
  skipped: number;
};

export type AgreementFilter = {
  state?: AgreementStateValue;
  kind?: AgreementKindValue;
  guarantor?: GuarantorValue;
  limit?: number;
};

/** The backend's page cap for agreement and held-payment lists. */
export const CREDIT_LIST_LIMIT = 100;

const BASE = 'v1/admin/credit';

/** Who may do what, for the message a 403 deserves. */
type Need = 'read' | 'decide' | 'super';

const ROLE_NEEDED: Record<Need, string> = {
  read: 'SuperAdmin, PayoutsOps or Readonly',
  decide: 'SuperAdmin or PayoutsOps',
  super: 'SuperAdmin',
};

function unwrap<T>(response: { status: number; body: unknown }, need: Need): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; detail?: string; message?: string } | undefined;
  const detail = body?.detail ?? body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      `Your operator account needs the Stylemint ${ROLE_NEEDED[need]} role for this. ` +
        'An administrator grants it under Operator access.',
    );
  }
  if (response.status === 404 && !detail) {
    throw new Error('Credit administration is not available on this server yet.');
  }
  throw new Error(detail ?? `Credit administration returned HTTP ${response.status}.`);
}

export const stylemintCreditApi = {
  portfolio: async (): Promise<CreditPortfolio> =>
    unwrap(await stylemintOperationsApi.invoke({ method: 'GET', path: `${BASE}/portfolio` }), 'read'),

  agreements: async (filter: AgreementFilter = {}): Promise<CreditAgreement[]> => {
    const query = new URLSearchParams();
    if (filter.state) query.set('state', String(filter.state));
    if (filter.kind) query.set('kind', String(filter.kind));
    if (filter.guarantor) query.set('guarantor', String(filter.guarantor));
    query.set('limit', String(filter.limit ?? CREDIT_LIST_LIMIT));
    return unwrap(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/agreements`,
        query: query.toString(),
      }),
      'read',
    );
  },

  agreement: async (id: string): Promise<CreditAgreement> =>
    unwrap(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/agreements/${encodeURIComponent(id)}`,
      }),
      'read',
    ),

  assessment: async (agreementId: string): Promise<RiskAssessment> =>
    unwrap(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/agreements/${encodeURIComponent(agreementId)}/assessment`,
      }),
      'read',
    ),

  /**
   * Approves or declines a referred agreement. The key is the caller's: a retry after a timeout
   * sends the same one, so the decision is made once.
   */
  review: async (
    agreementId: string,
    decision: { approve: boolean; reasons: string[] },
    idempotencyKey: string,
  ): Promise<CreditAgreement> =>
    unwrap(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/agreements/${encodeURIComponent(agreementId)}/review`,
        body: JSON.stringify({
          approve: decision.approve,
          reasons: decision.reasons.length ? decision.reasons : null,
        }),
        idempotencyKey,
      }),
      'decide',
    ),

  reserve: async (): Promise<ReserveSummary> =>
    unwrap(await stylemintOperationsApi.invoke({ method: 'GET', path: `${BASE}/reserve` }), 'read'),

  /**
   * Records capital put into the guarantee reserve. `movementId` identifies the movement: the
   * same id posted again is recognised as a retry, and the same id with a different amount is
   * refused rather than reported as done.
   */
  addCapital: async (amount: number, movementId: string): Promise<ReserveSummary> =>
    unwrap(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/reserve/capital`,
        body: JSON.stringify({ amount, movementId }),
        idempotencyKey: movementId,
      }),
      'super',
    ),

  /** Held payments, oldest first — or, with `refunded`, the ones already returned, newest first. */
  unappliedPayments: async (refunded = false): Promise<UnappliedPayment[]> =>
    unwrap(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/payments/unapplied`,
        query: `limit=${CREDIT_LIST_LIMIT}${refunded ? '&refunded=true' : ''}`,
      }),
      'read',
    ),

  /**
   * Returns a held payment to the buyer in full — what arrived — through Payments. The key is the
   * caller's, so a retry after a timeout is the same request; the backend also answers a refund
   * already under way or done with where it stands rather than refunding again.
   */
  refundHeldPayment: async (
    attemptId: string,
    note: string,
    idempotencyKey: string,
  ): Promise<UnappliedPayment> =>
    unwrap(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/payments/${encodeURIComponent(attemptId)}/refund`,
        body: JSON.stringify({ note: note.trim() || null }),
        idempotencyKey,
      }),
      'decide',
    ),

  /** Runs the daily aging pass now. Safe to repeat: reminders already sent today are skipped. */
  runAging: async (): Promise<AgingRunSummary> =>
    unwrap(
      await stylemintOperationsApi.invoke({ method: 'POST', path: `${BASE}/aging/run` }),
      'super',
    ),
};
