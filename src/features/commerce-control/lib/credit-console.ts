import {
  AgreementKind,
  AgreementState,
  DelinquencyBucket,
  Guarantor,
  type AgreementKindValue,
  type AgreementStateValue,
  type CreditPortfolio,
  type DelinquencyBucketValue,
  type GuarantorValue,
} from '../api/stylemint-credit.api';
import { formatMoney } from '../api/stylemint-payouts.api';

/**
 * Words and arithmetic for the credit console. Kept out of the components so the rules — which
 * slices count as money owed, how late is late, what a reason code means — are tested as data.
 */

export const KIND_LABEL: Record<AgreementKindValue, string> = {
  [AgreementKind.Instalment]: 'EMI',
  [AgreementKind.PayLater]: 'Pay later',
  [AgreementKind.Prepay]: 'Pay now, buy later',
};

export const GUARANTOR_LABEL: Record<GuarantorValue, string> = {
  [Guarantor.Vendor]: 'Seller',
  [Guarantor.Platform]: 'StyleMint',
  [Guarantor.Partner]: 'Lending partner',
  [Guarantor.None]: 'Nobody (no credit)',
};

export const STATE_LABEL: Record<AgreementStateValue, string> = {
  [AgreementState.PendingApproval]: 'Awaiting decision',
  [AgreementState.Approved]: 'Approved — first payment due',
  [AgreementState.Active]: 'Running',
  [AgreementState.Completed]: 'Paid off',
  [AgreementState.Defaulted]: 'Defaulted',
  [AgreementState.Declined]: 'Declined',
  [AgreementState.Cancelled]: 'Cancelled',
  [AgreementState.Expired]: 'Expired',
  [AgreementState.Reversed]: 'Reversed — refunded',
};

/** Colour carries meaning: pending is amber, running green, loss red, closed muted. */
export const STATE_TONE: Record<AgreementStateValue, string> = {
  [AgreementState.PendingApproval]: 'border-warning/25 bg-warning-soft text-warning',
  [AgreementState.Approved]: 'border-warning/25 bg-warning-soft text-warning',
  [AgreementState.Active]: 'border-border-glow bg-brand-soft text-brand',
  [AgreementState.Completed]: 'border-success/25 bg-success-soft text-success',
  [AgreementState.Defaulted]: 'border-danger/25 bg-danger-soft text-danger',
  [AgreementState.Declined]: 'border-danger/25 bg-danger-soft text-danger',
  [AgreementState.Cancelled]: 'border-border-subtle text-text-muted',
  [AgreementState.Expired]: 'border-border-subtle text-text-muted',
  [AgreementState.Reversed]: 'border-info/25 bg-info-soft text-info',
};

export const BUCKET_LABEL: Record<DelinquencyBucketValue, string> = {
  [DelinquencyBucket.Current]: 'On time',
  [DelinquencyBucket.Days1To30]: '1–30 days late',
  [DelinquencyBucket.Days31To60]: '31–60 days late',
  [DelinquencyBucket.Days61To90]: '61–90 days late',
  [DelinquencyBucket.Over90]: 'Over 90 days late',
};

export const RISK_BAND_LABEL: Record<number, string> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };

export const OUTCOME_LABEL: Record<number, string> = {
  1: 'Approved automatically',
  2: 'Referred for a decision',
  3: 'Declined automatically',
};

export const PURPOSE_LABEL: Record<number, string> = {
  1: 'First payment',
  2: 'Instalment',
  3: 'Early settlement',
};

/** What the risk engine's reason codes mean, for an operator. Unknown codes read as words. */
const REASON_LABEL: Record<string, string> = {
  kyc_required: 'Identity not verified to tier 2',
  identity_unavailable: 'Identity could not be checked',
  band_too_low: 'Score band too low',
  buyer_limit_exceeded: "Above the buyer's limit",
  vendor_exposure_exceeded: "Above the seller's exposure ceiling",
  reserve_insufficient: 'Guarantee reserve too thin',
  prior_default: 'Buyer has defaulted before',
  velocity_exceeded: 'Too many applications in 24 hours',
  too_many_active_agreements: 'Too many open agreements',
  cooling_off: 'Within the cooling-off period after a decline',
  duplicate_identity: 'Identity document held by another account',
  kind_disabled: 'This kind of plan is switched off',
  guarantor_disabled: 'This guarantor is switched off',
  amount_below_minimum: 'Amount below the minimum',
  amount_above_maximum: 'Amount above the maximum',
  manual_review_required: "Seller's terms ask to review every request",
  order_cancelled: 'Its order was cancelled before it shipped; every payment is being refunded',
  order_returned: 'The item was returned; every payment is being refunded',
  interest_requires_partner: 'Interest needs a licensed partner',
  guarantor_not_allowed_for_kind: 'Guarantor not allowed for this kind',
};

export function reasonLabel(code: string): string {
  if (REASON_LABEL[code]) return REASON_LABEL[code];
  const dpd = /^days_past_due_(\d+)$/.exec(code);
  if (dpd) return `Defaulted at ${dpd[1]} days past due`;
  const words = code.replace(/_/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : code;
}

/**
 * Reasons an operator may give for declining. Lower_snake_case, as the backend requires, and
 * shown to the buyer in the app as a sentence — so none of them accuses the buyer of anything.
 */
export const DECLINE_REASONS: { code: string; label: string }[] = [
  { code: 'platform_review_declined', label: 'Declined on review' },
  { code: 'insufficient_history', label: 'Not enough purchase history' },
  { code: 'identity_concern', label: 'Identity details need checking' },
];

/** What moved a score, as an operator would say it. */
const FACTOR_LABEL: Record<string, string> = {
  kyc_verified: 'Identity verified',
  phone_verified: 'Phone verified',
  email_verified: 'Email verified',
  duplicate_identity: 'Duplicate identity',
  account_age: 'Account age',
  completed_orders: 'Completed orders',
  completed_value: 'Completed order value',
  return_cancel_rate: 'Returns and cancellations',
  on_time_instalments: 'On-time instalments',
  late_instalments: 'Late instalments',
  prior_defaults: 'Prior defaults',
};

export function factorLabel(code: string): string {
  return FACTOR_LABEL[code] ?? reasonLabel(code);
}

export type ScoreFactor = { code: string; points: number };

/**
 * The factors a decision recorded, from the JSON string it stored. Anything unreadable yields an
 * empty list rather than an error: the decision is still shown, just without its breakdown.
 */
export function parseFactors(raw: string | null | undefined): ScoreFactor[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (f): f is ScoreFactor =>
          typeof f === 'object' &&
          f !== null &&
          typeof (f as ScoreFactor).code === 'string' &&
          typeof (f as ScoreFactor).points === 'number',
      )
      .map((f) => ({ code: f.code, points: f.points }));
  } catch {
    return [];
  }
}

/** The signals a decision was made on, as label/value pairs in a stable order. */
export function parseSignals(raw: string | null | undefined): { label: string; value: string }[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? '{}');
  } catch {
    return [];
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return [];
  return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
    label: key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/^./, (c) => c.toUpperCase())
      .replace(/\bUtc\b/, '(UTC)'),
    value:
      value === null || value === undefined
        ? '—'
        : typeof value === 'boolean'
          ? value
            ? 'Yes'
            : 'No'
          : String(value),
  }));
}

/** Credit is extended by every kind except prepay, which holds the buyer's money instead. */
export function extendsCredit(kind: AgreementKindValue): boolean {
  return kind !== AgreementKind.Prepay;
}

export type BookTotals = {
  /** Principal buyers owe on running credit agreements. */
  owed: number;
  runningCount: number;
  /** The part of `owed` on agreements with a payment past due. */
  late: number;
  lateCount: number;
  /** Principal on agreements that defaulted — written off against their guarantor. */
  writtenOff: number;
  awaitingDecision: number;
  /** Owed, split by who carries the loss if it goes unpaid. */
  owedByGuarantor: Record<GuarantorValue, number>;
};

/**
 * The headline figures, from the database's own sums. Running prepay is excluded from what is
 * owed: a prepay buyer owes nothing — they are paying ahead for goods not yet sent.
 */
export function bookTotals(portfolio: CreditPortfolio): BookTotals {
  const owedByGuarantor: Record<GuarantorValue, number> = {
    [Guarantor.Vendor]: 0,
    [Guarantor.Platform]: 0,
    [Guarantor.Partner]: 0,
    [Guarantor.None]: 0,
  };
  let owed = 0;
  let runningCount = 0;
  let writtenOff = 0;
  let awaitingDecision = 0;

  for (const slice of portfolio.slices) {
    if (slice.state === AgreementState.Active && extendsCredit(slice.kind)) {
      owed += slice.outstandingPrincipal;
      runningCount += slice.count;
      owedByGuarantor[slice.guarantor] += slice.outstandingPrincipal;
    }
    if (slice.state === AgreementState.Defaulted) writtenOff += slice.outstandingPrincipal;
    if (slice.state === AgreementState.PendingApproval) awaitingDecision += slice.count;
  }

  let late = 0;
  let lateCount = 0;
  for (const d of portfolio.delinquency) {
    if (d.bucket === DelinquencyBucket.Current || d.guarantor === Guarantor.None) continue;
    late += d.outstandingPrincipal;
    lateCount += d.count;
  }

  return { owed, runningCount, late, lateCount, writtenOff, awaitingDecision, owedByGuarantor };
}

/** `0.1834` → `18.3%`; null when there is nothing to divide by. */
export function percent(part: number, whole: number): string | null {
  if (!whole) return null;
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export function npr(amount: number): string {
  return formatMoney(amount, 'NPR');
}

/** The end of an id: enough to tell rows apart, short enough to read. */
export function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}

/** A due date is a calendar date: shown as written, never shifted by the browser's zone. */
export function calendarDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
