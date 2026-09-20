import { stylemintOperationsApi, type OperationMethod } from './stylemint-operations.api';

/**
 * The vendor fulfilment desk: the sub-orders a vendor owns and the steps that move one from paid
 * to delivered.
 *
 * This is the vendor credential, not the admin one — the same footing as every other vendor
 * surface Lead360 already drives (products, collections, payouts, briefs, partnerships). The
 * backend resolves the vendor from that credential, so what an operator sees here is the account
 * Lead360 is configured to operate as, and never an arbitrary vendor's book.
 *
 * Unlike the report surfaces, this shape is fixed and documented, so it is typed rather than
 * rendered as raw JSON: an operator working a queue needs to scan it, not read it.
 */

export const SubOrderState = {
  Pending: 1,
  Paid: 2,
  AwaitingFulfillment: 3,
  ReadyToShip: 4,
  AwaitingTracking: 5,
  Shipped: 6,
  Delivered: 7,
  Cancelled: 8,
  Returned: 9,
  InTransit: 10,
  OutForDelivery: 11,
  Accepted: 12,
  Packed: 13,
  HandedOver: 14,
} as const;

export type SubOrderStateValue = (typeof SubOrderState)[keyof typeof SubOrderState];

export const SUB_ORDER_STATE_LABEL: Record<number, string> = {
  1: 'Pending',
  2: 'Paid',
  3: 'Awaiting fulfilment',
  4: 'Ready to ship',
  5: 'Awaiting tracking',
  6: 'Shipped',
  7: 'Delivered',
  8: 'Cancelled',
  9: 'Returned',
  10: 'In transit',
  11: 'Out for delivery',
  12: 'Accepted',
  13: 'Packed',
  14: 'Handed over',
};

export const VendorRejectionReason = {
  OutOfStock: 1,
  CannotFulfillInTime: 2,
  PricingError: 3,
  AddressNotServiceable: 4,
  SuspectedFraud: 5,
  Other: 6,
} as const;

export type VendorRejectionReasonValue =
  (typeof VendorRejectionReason)[keyof typeof VendorRejectionReason];

export const REJECTION_REASON_LABEL: Record<number, string> = {
  1: 'Out of stock',
  2: 'Cannot fulfil in time',
  3: 'Pricing error',
  4: 'Address not serviceable',
  5: 'Suspected fraud',
  6: 'Other',
};

export type VendorSubOrder = {
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
};

export const OrderCancellationReason = {
  OrderedByMistake: 1,
  FoundBetterPrice: 2,
  ChangedMyMind: 3,
  DeliveryTooLong: 4,
  NeedDifferentSizeOrColor: 5,
  Other: 6,
} as const;

export const CANCELLATION_REASON_LABEL: Record<number, string> = {
  1: 'Ordered by mistake',
  2: 'Found a better price',
  3: 'Changed their mind',
  4: 'Delivery was taking too long',
  5: 'Needed a different size or colour',
  6: 'Other',
};

export type SubOrderLine = {
  id: string;
  productVariantId: string;
  quantity: number;
  unitPriceAmount: number;
  unitPriceCurrency: string;
  productTitleSnapshot: string;
  variantLabelSnapshot?: string | null;
  optionLabel?: string | null;
  thumbnailUrlSnapshot?: string | null;
  creatorAccountId?: string | null;
  commissionRateSnapshot?: number | null;
  commissionAmountValue?: number | null;
  commissionAmountCurrency?: string | null;
  originatingReelId?: string | null;
  lineSubtotalAmount: number;
  lineSubtotalCurrency: string;
};

/**
 * The full sub-order. The list row deliberately omits the heavy parts; this is what the queue
 * cannot answer — every lifecycle timestamp, the address, the money broken out, and the lines
 * with their creator attribution.
 *
 * The timestamps are the reason this view exists: a row says an order is Packed, and only these
 * say it has been Packed since Tuesday.
 */
export type VendorSubOrderDetail = {
  id: string;
  orderId: string;
  orderNumber: string;
  vendorAccountId: string;
  state: number;
  placedUtc: string;
  shipTo: PackingSlipAddress;
  shippingFeeAmount: number;
  shippingFeeCurrency: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  acceptedUtc?: string | null;
  packedUtc?: string | null;
  handedOverUtc?: string | null;
  shippedUtc?: string | null;
  inTransitUtc?: string | null;
  outForDeliveryUtc?: string | null;
  deliveredUtc?: string | null;
  cancelledUtc?: string | null;
  cancellationReasonCode?: number | null;
  cancellationNote?: string | null;
  lineSubtotalAmount: number;
  lineSubtotalCurrency: string;
  subtotalAmount: number;
  subtotalCurrency: string;
  itemCount: number;
  lines: SubOrderLine[];
};

/**
 * The packing slip the courier reads. Typed, unlike the other detail reads, because it is the
 * one shape rendered as a document rather than inspected as JSON.
 *
 * The address is location-first: the postal columns can all be blank, and `locationNote` is then
 * the only thing a courier can actually navigate by. So the slip leads with it rather than
 * treating it as an afterthought below a set of empty fields.
 */
export type PackingSlipAddress = {
  receiverName: string;
  receiverPhone: string;
  addressLine1: string;
  landmark?: string | null;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  locationNote?: string | null;
  mapsLink?: string | null;
};

export type PackingSlipLine = {
  productTitleSnapshot: string;
  variantLabelSnapshot?: string | null;
  quantity: number;
};

export type PackingSlip = {
  packingSlipNumber: string;
  orderNumber: string;
  subOrderId: string;
  issuedUtc: string;
  placedUtc: string;
  shipTo: PackingSlipAddress;
  carrier?: string | null;
  trackingNumber?: string | null;
  items: PackingSlipLine[];
};

/** One row of a bulk read: the server reports per-id outcomes rather than failing the batch. */
export type BulkItem<T> = {
  index: number;
  success: boolean;
  value?: T | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export type BulkRead<T> = {
  items: BulkItem<T>[];
  successCount: number;
  failureCount: number;
  allSucceeded: boolean;
};

export type SubOrderPage = {
  items: VendorSubOrder[];
  nextCursor?: string | null;
};

export type SubOrderFilter = {
  state?: number;
  carrier?: string;
  placedFromUtc?: string;
  placedToUtc?: string;
  cursor?: string;
  pageSize?: number;
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // An unmatched upstream route 404s with no body at all; a controller's own 404 carries one.
  // Saying "no such sub-order" when the endpoint is simply absent would be a lie.
  if (response.status === 404) {
    const empty = response.body == null || response.body === '';
    throw new Error(empty ? 'NOT_DEPLOYED' : 'NOT_FOUND');
  }
  if (response.status === 409 || response.status === 422) {
    throw new Error(
      detail ?? 'The sub-order is no longer in a state where that step is allowed.',
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      detail ?? 'Lead360 is not configured with a vendor credential for this environment.',
    );
  }
  throw new Error(detail ?? `The fulfilment surface returned HTTP ${response.status}.`);
}

const BASE = 'v1/vendor/sub-orders';

async function call<T>(method: OperationMethod, path: string, body?: unknown): Promise<T> {
  return unwrap<T>(
    await stylemintOperationsApi.invoke({
      method,
      path,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

/** Every step a vendor can take on one sub-order, keyed by the path segment that performs it. */
export const SUB_ORDER_STEPS = {
  accept: 'accept',
  packed: 'packed',
  readyToShip: 'ready-to-ship',
  inTransit: 'in-transit',
  outForDelivery: 'out-for-delivery',
  delivered: 'delivered',
} as const;

export type SubOrderStep = keyof typeof SUB_ORDER_STEPS;

export const stylemintSubOrdersApi = {
  list: async (filter: SubOrderFilter = {}): Promise<SubOrderPage> => {
    const query = new URLSearchParams();
    if (filter.state) query.set('state', String(filter.state));
    if (filter.carrier) query.set('carrier', filter.carrier);
    if (filter.placedFromUtc) query.set('placedFromUtc', filter.placedFromUtc);
    if (filter.placedToUtc) query.set('placedToUtc', filter.placedToUtc);
    if (filter.cursor) query.set('cursor', filter.cursor);
    query.set('pageSize', String(filter.pageSize ?? 25));

    return unwrap<SubOrderPage>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  detail: (subOrderId: string) =>
    call<VendorSubOrderDetail>('GET', `${BASE}/${encodeURIComponent(subOrderId)}`),

  packingSlip: (subOrderId: string) =>
    call<PackingSlip>('GET', `${BASE}/${encodeURIComponent(subOrderId)}/packing-slip`),

  /** The steps that take no arguments — accept, packed, ready-to-ship and the carrier states. */
  step: (subOrderId: string, step: SubOrderStep) =>
    call<Record<string, unknown>>(
      'POST',
      `${BASE}/${encodeURIComponent(subOrderId)}/${SUB_ORDER_STEPS[step]}`,
      {},
    ),

  reject: (subOrderId: string, reasonCode: VendorRejectionReasonValue, note?: string) =>
    call<Record<string, unknown>>('POST', `${BASE}/${encodeURIComponent(subOrderId)}/reject`, {
      reasonCode,
      note: note?.trim() || null,
    }),

  /** Handing the parcel to a courier. Carrier and tracking are optional — some couriers issue
   *  the number later, and forcing a placeholder would put a fake tracking number on the order. */
  handOver: (subOrderId: string, carrier?: string, trackingNumber?: string, note?: string) =>
    call<Record<string, unknown>>('POST', `${BASE}/${encodeURIComponent(subOrderId)}/handover`, {
      carrier: carrier?.trim() || null,
      trackingNumber: trackingNumber?.trim() || null,
      handoverNote: note?.trim() || null,
    }),

  setTracking: (subOrderId: string, carrier: string, trackingNumber: string) =>
    call<Record<string, unknown>>('POST', `${BASE}/${encodeURIComponent(subOrderId)}/tracking`, {
      carrier: carrier.trim(),
      trackingNumber: trackingNumber.trim(),
    }),

  bulkAccept: (subOrderIds: string[]) =>
    call<Record<string, unknown>>('POST', `${BASE}/bulk/accept`, { subOrderIds }),

  bulkReadyToShip: (subOrderIds: string[]) =>
    call<Record<string, unknown>>('POST', `${BASE}/bulk/ready-to-ship`, { subOrderIds }),

  /** A pure read despite the POST — the ids go in the body because a batch of them would not
   *  fit a query string. Failures come back per id rather than failing the whole batch. */
  bulkPackingSlips: (subOrderIds: string[]) =>
    call<BulkRead<PackingSlip>>('POST', `${BASE}/bulk/packing-slips`, { subOrderIds }),
};

/**
 * Which steps are legal from a given state, in the order an operator would take them.
 *
 * Derived from the backend's own transition rules rather than offering every button always: a
 * button that is guaranteed to 409 teaches an operator to ignore errors. In-transit, out-for-
 * delivery and delivered are normally driven by carrier webhooks; they are offered only from the
 * state that precedes them, as the manual override they are.
 */
export function availableSteps(state: number): Array<{
  key: SubOrderStep | 'reject' | 'handover' | 'tracking';
  label: string;
  destructive?: boolean;
}> {
  switch (state) {
    case SubOrderState.Paid:
    case SubOrderState.AwaitingFulfillment:
      return [
        { key: 'accept', label: 'Accept' },
        { key: 'reject', label: 'Reject', destructive: true },
      ];
    case SubOrderState.Accepted:
      return [{ key: 'packed', label: 'Mark packed' }];
    case SubOrderState.Packed:
      return [
        { key: 'handover', label: 'Hand over to courier' },
        { key: 'readyToShip', label: 'Ready to ship' },
      ];
    case SubOrderState.ReadyToShip:
    case SubOrderState.AwaitingTracking:
      return [{ key: 'tracking', label: 'Set tracking' }];
    case SubOrderState.Shipped:
    case SubOrderState.HandedOver:
      return [{ key: 'inTransit', label: 'In transit' }];
    case SubOrderState.InTransit:
      return [{ key: 'outForDelivery', label: 'Out for delivery' }];
    case SubOrderState.OutForDelivery:
      return [{ key: 'delivered', label: 'Delivered' }];
    default:
      return [];
  }
}
