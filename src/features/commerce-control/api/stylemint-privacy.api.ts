import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for data-rights requests — GDPR Articles 15 to 22.
 *
 * Reading takes SupportAgent, SuperAdmin or Readonly; every decision takes SupportAgent or
 * SuperAdmin. No step-up MFA, so all four decisions work from Lead360.
 *
 * Each request carries a statutory deadline in `dueAtUtc`. The queue is ordered by it rather
 * than by arrival, because the one closest to breaching is the one to action first.
 */

export const DataRightsStatus = {
  Submitted: 1,
  IdentityVerified: 2,
  InProgress: 3,
  Completed: 4,
  Rejected: 5,
  Expired: 6,
} as const;
export type DataRightsStatusValue = (typeof DataRightsStatus)[keyof typeof DataRightsStatus];

export const DATA_RIGHTS_STATUS_LABEL: Record<number, string> = {
  1: 'Submitted',
  2: 'Identity verified',
  3: 'In progress',
  4: 'Completed',
  5: 'Rejected',
  6: 'Expired',
};

/** The article each request type is raised under, shown so an operator knows the obligation. */
export const DATA_RIGHTS_TYPE_LABEL: Record<number, string> = {
  1: 'Access (Art. 15)',
  2: 'Correction (Art. 16)',
  3: 'Erasure (Art. 17)',
  4: 'Restriction (Art. 18)',
  5: 'Portability (Art. 20)',
  6: 'Objection (Art. 21)',
  7: 'Automated decisions (Art. 22)',
};

export type DataRightsRequest = {
  id: string;
  accountId: string;
  requestType: number;
  status: number;
  description: string;
  submittedUtc: string;
  dueAtUtc: string;
  identityVerifiedUtc?: string | null;
  inProgressUtc?: string | null;
  completedUtc?: string | null;
  rejectedUtc?: string | null;
  rejectionReason?: string | null;
  fulfilmentReference?: string | null;
};

export type DataRightsQueue = {
  items: DataRightsRequest[];
  totalCount: number;
  skip: number;
  take: number;
};

const BASE = 'v1/admin/privacy/data-rights-requests';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Handling data-rights requests takes the Stylemint SupportAgent role. ' +
          'An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The privacy surface returned HTTP ${response.status}.`);
}

/**
 * Whole days until the statutory deadline; negative once it has passed. Compared at day
 * granularity deliberately — an operator acts on "two days left", not on hours.
 */
export function daysUntilDue(dueAtUtc: string): number {
  const due = new Date(dueAtUtc).getTime();
  const now = Date.now();
  return Math.ceil((due - now) / 86_400_000);
}

/** A request still needing action — the four states where a decision is outstanding. */
export function isOutstanding(status: number): boolean {
  return (
    status === DataRightsStatus.Submitted ||
    status === DataRightsStatus.IdentityVerified ||
    status === DataRightsStatus.InProgress ||
    status === DataRightsStatus.Expired
  );
}

export const stylemintPrivacyApi = {
  queue: async (params: {
    status?: DataRightsStatusValue;
    skip?: number;
    take?: number;
  }): Promise<DataRightsQueue> => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', String(params.status));
    query.set('skip', String(params.skip ?? 0));
    query.set('take', String(params.take ?? 25));

    return unwrap<DataRightsQueue>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  /** Confirms the requester is the data subject — the gate before any data moves. */
  verifyIdentity: async (requestId: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(requestId)}/verify-identity`,
      }),
    );
  },

  /** Marks fulfilment as under way. */
  start: async (requestId: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(requestId)}/start`,
      }),
    );
  },

  complete: async (requestId: string, fulfilmentReference?: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(requestId)}/complete`,
        body: JSON.stringify({ fulfilmentReference: fulfilmentReference || null }),
      }),
    );
  },

  /** Denying a request needs a reason on the record — e.g. a legal hold. */
  reject: async (requestId: string, reason: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(requestId)}/reject`,
        body: JSON.stringify({ reason }),
      }),
    );
  },
};
