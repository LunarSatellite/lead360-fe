import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the platform returns queue and the evidence behind a disputed return.
 *
 * The backend could page returns for one vendor and for one customer, but nothing read them
 * across the platform — support could open a single return by id and never find out which
 * returns existed. The queue endpoint closes that.
 *
 * Gated on SupportAgent or SuperAdmin, no step-up MFA, so it works from Lead360. Read-only:
 * approving or rejecting a return is the vendor's decision, taken on the vendor surface.
 */

export const ReturnState = { Submitted: 1, Approved: 2, Rejected: 3, Completed: 4 } as const;
export type ReturnStateValue = (typeof ReturnState)[keyof typeof ReturnState];
export const RETURN_STATE_LABEL: Record<number, string> = {
  1: 'Submitted',
  2: 'Approved',
  3: 'Rejected',
  4: 'Completed',
};

export type ReturnQueueItem = {
  id: string;
  orderId: string;
  orderNumber: string;
  subOrderId: string;
  vendorAccountId: string;
  customerAccountId: string;
  productTitleSnapshot?: string | null;
  variantLabelSnapshot?: string | null;
  thumbnailUrlSnapshot?: string | null;
  quantity: number;
  reason: string;
  state: number;
  resolution: number;
  submittedUtc: string;
  resolvedUtc?: string | null;
  rejectionNote?: string | null;
};

export type ReturnQueue = {
  items: ReturnQueueItem[];
  totalCount: number;
  skip: number;
  take: number;
};

/** The snapshot both buyer and vendor see; shape is deliberately open — it is a record, not a form. */
export type ReturnEvidence = Record<string, unknown> | null;

const BASE = 'v1/admin/support/returns';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Reading returns takes the Stylemint SupportAgent role. An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The returns surface returned HTTP ${response.status}.`);
}

export const stylemintReturnsApi = {
  queue: async (params: {
    state?: ReturnStateValue;
    skip?: number;
    take?: number;
  }): Promise<ReturnQueue> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    query.set('skip', String(params.skip ?? 0));
    query.set('take', String(params.take ?? 25));

    return unwrap<ReturnQueue>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  /** 200 with a null body when the return carries no snapshot — the same absence both parties see. */
  evidence: async (returnRequestId: string): Promise<ReturnEvidence> =>
    unwrap<ReturnEvidence>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(returnRequestId)}/evidence`,
      }),
    ),
};
