import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the platform payout queue.
 *
 * Reading takes PayoutsOps, SuperAdmin or Readonly. Two of the four actions are usable from
 * Lead360 and two are not, which the page has to be honest about:
 *
 *  - hold / release  — PayoutsOps or SuperAdmin, no step-up MFA. These work here.
 *  - force-paid / force-failed — SuperAdmin AND [RequireStepUpMfa]. A Lead360 operator token
 *    deliberately asserts no step-up, so these 401 from here by design. They are the escape
 *    hatch for reconciling against a provider by hand, and they belong on the admin console
 *    where a fresh MFA challenge can be demanded.
 */

export const PayoutState = {
  Requested: 1,
  Processing: 2,
  Paid: 3,
  Failed: 4,
  Held: 5,
} as const;
export type PayoutStateValue = (typeof PayoutState)[keyof typeof PayoutState];

export const PAYOUT_STATE_LABEL: Record<number, string> = {
  1: 'Requested',
  2: 'Processing',
  3: 'Paid',
  4: 'Failed',
  5: 'Held',
};

export const PAYEE_KIND_LABEL: Record<number, string> = { 1: 'Vendor', 2: 'Creator', 3: 'Courier' };
export const PAYOUT_DESTINATION_LABEL: Record<number, string> = {
  1: 'Bank',
  2: 'Wallet',
  3: 'Manual',
};

export type Payout = {
  id: string;
  payeeProfileId: string;
  payeeKind: number;
  mode: number;
  destination: number;
  destinationRef: string;
  requestedAmountValue: number;
  requestedAmountCurrency: string;
  feeAmountValue: number;
  feeAmountCurrency: string;
  netAmountValue: number;
  netAmountCurrency: string;
  requestedUtc: string;
  pendingUntilUtc: string;
  state: number;
  providerPayoutId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  paidUtc?: string | null;
};

export type PayoutPage = {
  items: Payout[];
  totalCount: number;
  nextCursor?: string | null;
  previousCursor?: string | null;
  pageSize: number;
};

const BASE = 'v1/admin/payouts';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 401) {
    throw new Error(
      detail ??
        'This action needs a step-up MFA challenge, which a Lead360 operator token does not ' +
          'carry. Use the Stylemint admin console for it.',
    );
  }
  if (response.status === 403) {
    throw new Error(
      detail ?? 'Moving money takes the Stylemint PayoutsOps role. An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The payouts surface returned HTTP ${response.status}.`);
}

/** Formats an amount with its own currency rather than assuming one. */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export const stylemintPayoutsApi = {
  queue: async (params: {
    state?: PayoutStateValue;
    skip?: number;
    take?: number;
  }): Promise<PayoutPage> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    query.set('skip', String(params.skip ?? 0));
    query.set('take', String(params.take ?? 25));

    return unwrap<PayoutPage>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  /** Stops a payout before it is sent. Reason is recorded in the audit trail. Answers 204 with no body. */
  hold: async (payoutId: string, reason: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(payoutId)}/hold`,
        body: JSON.stringify({ reason }),
      }),
    );
  },

  /** Lifts a hold and lets the payout resume. Answers 204 with no body. */
  release: async (payoutId: string, reason: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(payoutId)}/release`,
        body: JSON.stringify({ reason }),
      }),
    );
  },
};
