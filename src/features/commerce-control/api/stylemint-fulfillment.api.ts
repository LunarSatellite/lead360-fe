import { stylemintOperationsApi } from './stylemint-operations.api';
import { readHandoverResponse, type HandoverOutcome } from '../lib/counter-handover';

/**
 * Operator client for the seller's fulfilment queue, and for the one action on
 * it that had no client here: the counter handover on a collection sub-order.
 *
 * In-store collection shipped with a mobile client for
 * `POST v1/vendor/sub-orders/{id}/collected` and nothing on the operator side,
 * so when a store rang the operations desk there was no way to record the
 * handover — the only alternative was walking the order through Shipped and
 * InTransit, which writes down a courier journey that never happened.
 *
 * Everything goes through the governed pass-through, like the other operator
 * commerce actions in this console. Two reasons it is the right client here and
 * the curated `stylemint-commerce.api.ts` is not:
 *
 *  - the pass-through returns the upstream status AND body verbatim, so the
 *    refusal on a delivery sub-order is a result to render rather than an
 *    exception to swallow;
 *  - `StylemintOperationsController` forwards the verb and supplies an
 *    `Idempotency-Key` when the caller sends none, which the `collected`
 *    endpoint requires — it is marked `[Idempotent]` upstream.
 */

export type VendorSubOrderRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  vendorAccountId: string;
  receiverName: string;
  state: number;
  shippingFeeAmount: number;
  shippingFeeCurrency: string;
  subtotalAmount: number;
  subtotalCurrency: string;
  itemCount: number;
  carrier?: string | null;
  trackingNumber?: string | null;
  placedUtc: string;
  shippedUtc?: string | null;
  deliveredUtc?: string | null;
  fulfillmentChannel: number;
  /** The collection point, when the buyer named one. Absent on app-placed collection orders. */
  fulfillmentLocationId?: string | null;
  collectedUtc?: string | null;
};

export type VendorSubOrderLine = {
  id: string;
  productTitleSnapshot?: string | null;
  optionLabel?: string | null;
  quantity: number;
  lineSubtotalAmount: number;
  lineSubtotalCurrency: string;
};

export type VendorSubOrderDetail = VendorSubOrderRow & {
  collectedByAccountId?: string | null;
  lines?: VendorSubOrderLine[];
  /**
   * Deliberately not typed as an address.
   *
   * On a collection sub-order this snapshot is empty by design — nothing is
   * being shipped, so no address was ever recorded. Leaving it untyped here
   * means no screen in this feature can reach into it and format a destination
   * out of defaults. See `collectionDestination` in `lib/counter-handover.ts`.
   */
  shipTo?: unknown;
};

export type VendorSubOrderPage = {
  items: VendorSubOrderRow[];
  nextCursor?: string | null;
};

const BASE = 'v1/vendor/sub-orders';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Reading the fulfilment queue takes a Stylemint operator role. An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The fulfilment surface returned HTTP ${response.status}.`);
}

export const stylemintFulfillmentApi = {
  /**
   * The seller's fulfilment queue. The upstream list has no channel filter, so
   * collection orders are picked out client-side from the `fulfillmentChannel`
   * every row already carries.
   */
  subOrders: async (params: {
    state?: number;
    cursor?: string;
    pageSize?: number;
  }): Promise<VendorSubOrderPage> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    if (params.cursor) query.set('cursor', params.cursor);
    query.set('pageSize', String(params.pageSize ?? 50));

    const page = unwrap<{ items?: VendorSubOrderRow[]; nextCursor?: string | null }>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
    return { items: page.items ?? [], nextCursor: page.nextCursor ?? null };
  },

  subOrder: async (subOrderId: string): Promise<VendorSubOrderDetail> =>
    unwrap<VendorSubOrderDetail>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(subOrderId)}`,
      }),
    ),

  /**
   * Records the counter handover. Returns the outcome as data — including the
   * refusal on a delivery sub-order — because a refusal here is information the
   * operator needs, not a transport failure.
   */
  markCollected: async (subOrderId: string): Promise<HandoverOutcome> =>
    readHandoverResponse(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(subOrderId)}/collected`,
      }),
    ),
};
