import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Stylemint commerce support queue.
 *
 * These endpoints are not part of the curated `StylemintCommerceController`, so they travel over
 * the operator pass-through. That is the intended split: the pass-through carries the long tail
 * generically, and anything a real screen is built on gets a typed wrapper like this one, so the
 * page is not writing raw paths and casting `unknown`.
 */

/** Internal state, which the queue filters on. */
export const TicketInternalState = {
  Submitted: 1,
  InProgress: 2,
  WaitingOnUser: 3,
  Resolved: 4,
  Closed: 5,
} as const;
export type TicketInternalStateValue =
  (typeof TicketInternalState)[keyof typeof TicketInternalState];

/** The three states a customer sees, which is what a ticket summary carries. */
export const TICKET_STATE_LABEL: Record<number, string> = {
  1: 'Submitted',
  2: 'In progress',
  3: 'Resolved',
};

export const TICKET_CATEGORY_LABEL: Record<number, string> = {
  1: 'Orders & shipping',
  2: 'Returns & refunds',
  3: 'Account & settings',
  4: 'Payment & billing',
  5: 'Safety & privacy',
  6: 'For creators',
  7: 'For vendors',
  8: 'Delivery & couriers',
};

export type CommerceTicketSummary = {
  id: string;
  ticketNumber: string;
  category: number;
  subject: string;
  state: number;
  openedUtc: string;
  lastAgentReplyUtc?: string | null;
};

export type CommerceTicketMessage = {
  id: string;
  authorKind: number | string;
  body: string;
  postedUtc: string;
};

export type CommerceTicketDetail = CommerceTicketSummary & {
  accountId: string;
  orderId?: string | null;
  subOrderId?: string | null;
  returnRequestId?: string | null;
  messages?: CommerceTicketMessage[];
};

export type CommerceTicketPage = {
  items: CommerceTicketSummary[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

const BASE = 'v1/admin/support/tickets';

/** Turns a pass-through response into data, or throws with the upstream message. */
function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // 403 here almost always means the operator has no Stylemint support role yet, which is a
  // different problem from a broken request — say so rather than showing a bare status code.
  if (response.status === 403) {
    throw new Error(
      detail ??
        'Your operator account has no Stylemint support role yet. ' +
          'An administrator grants it before the commerce queue is readable.',
    );
  }
  throw new Error(detail ?? `The commerce support queue returned HTTP ${response.status}.`);
}

export const stylemintSupportApi = {
  /**
   * The agent queue, oldest first. Defaults server-side to the tickets that need an agent
   * (submitted + in progress) rather than every ticket ever raised.
   */
  queue: async (params: {
    states?: TicketInternalStateValue[];
    skip?: number;
    take?: number;
  }): Promise<CommerceTicketPage> => {
    const query = new URLSearchParams();
    for (const state of params.states ?? []) query.append('state', String(state));
    if (params.skip) query.set('skip', String(params.skip));
    if (params.take) query.set('take', String(params.take));

    return unwrap<CommerceTicketPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: BASE,
        query: query.toString(),
      }),
    );
  },

  get: async (ticketNumber: string): Promise<CommerceTicketDetail> =>
    unwrap<CommerceTicketDetail>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(ticketNumber)}`,
      }),
    ),

  reply: async (ticketNumber: string, body: string): Promise<CommerceTicketDetail> =>
    unwrap<CommerceTicketDetail>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(ticketNumber)}/replies`,
        body: JSON.stringify({ body }),
      }),
    ),

  markWaitingOnUser: async (ticketNumber: string): Promise<CommerceTicketDetail> =>
    unwrap<CommerceTicketDetail>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(ticketNumber)}/waiting-on-user`,
      }),
    ),

  resolve: async (
    ticketNumber: string,
    resolutionSummary?: string,
  ): Promise<CommerceTicketDetail> =>
    unwrap<CommerceTicketDetail>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(ticketNumber)}/resolve`,
        body: JSON.stringify({ resolutionSummary: resolutionSummary || null }),
      }),
    ),
};
