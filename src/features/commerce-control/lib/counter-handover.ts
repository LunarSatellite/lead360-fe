/**
 * The rules behind the counter-handover control, kept out of the component so
 * they can be pinned by tests rather than read off a screenshot.
 *
 * Recording a counter handover is not a status tidy-up. It completes the order:
 * the buyer's return window opens, the warranty clock starts, review
 * eligibility opens and the seller's earnings are released for settlement. It
 * cannot be undone from the console. Everything here exists so the screen says
 * that plainly, refuses honestly when the action does not apply, and never
 * invents a place or a counter that was not recorded.
 */

/** Matches the backend's OrderFulfillmentChannel. */
export const FulfillmentChannel = { Delivery: 1, StorePickup: 2 } as const;
export type FulfillmentChannelValue =
  (typeof FulfillmentChannel)[keyof typeof FulfillmentChannel];

/** Matches SubOrderState. Numbers, because the commerce surface serialises them as numbers. */
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
  14: 'Handed over to carrier',
};

/**
 * The states the backend accepts a counter handover from. Mirrors
 * SubOrder.MarkCollected: the pre-shipping states, because a collection order
 * never ships.
 */
const HANDOVER_STATES = new Set([2, 3, 12, 13, 4, 5]);

export type HandoverReadiness =
  /** The control is live. */
  | { kind: 'ready' }
  /** Already done. Idempotent upstream, but there is nothing left to record. */
  | { kind: 'alreadyCollected'; collectedUtc: string }
  /**
   * The action does not apply to this sub-order and the screen says why. It is
   * NOT hidden: an operator looking for the control must find out that this is
   * a delivery order rather than conclude the console is broken.
   */
  | { kind: 'refused'; reason: string }
  /** The channel applies but the sub-order is not in a state the backend accepts. */
  | { kind: 'wrongState'; reason: string };

export type HandoverSubject = {
  state: number;
  fulfillmentChannel: number;
  collectedUtc?: string | null;
};

/**
 * Whether a counter handover can be recorded, and — when it cannot — the
 * sentence the operator reads. Every branch returns a reason; none of them
 * returns "no".
 */
export function handoverReadiness(subOrder: HandoverSubject): HandoverReadiness {
  if (subOrder.fulfillmentChannel !== FulfillmentChannel.StorePickup) {
    return {
      kind: 'refused',
      reason:
        'This is a delivery sub-order. A counter handover is refused on it — the goods reach ' +
        'the buyer through a courier, so the order is completed by confirming delivery, not at ' +
        'a counter.',
    };
  }

  if (subOrder.collectedUtc) {
    return { kind: 'alreadyCollected', collectedUtc: subOrder.collectedUtc };
  }

  if (subOrder.state === 7) {
    return {
      kind: 'wrongState',
      reason:
        'This collection sub-order is already completed, and no counter handover was recorded ' +
        'against it.',
    };
  }

  if (!HANDOVER_STATES.has(subOrder.state)) {
    const label = SUB_ORDER_STATE_LABEL[subOrder.state] ?? `state ${subOrder.state}`;
    return {
      kind: 'wrongState',
      reason:
        `A counter handover cannot be recorded from ${label}. The backend accepts it only ` +
        'before shipping, which is where a collection order stays.',
    };
  }

  return { kind: 'ready' };
}

/**
 * What the operator is about to cause, named. The confirmation lists these
 * instead of asking "are you sure?" — a question that carries no information
 * about what happens next.
 */
export const HANDOVER_CONSEQUENCES: readonly string[] = [
  'Completes the order. The sub-order moves to Delivered and this cannot be undone from here.',
  "Starts the buyer's return window, warranty clock and review eligibility, from this moment.",
  "Releases the seller's earnings for this sub-order to settlement.",
  'Records your operator credential as the party accountable for the handover.',
];

/**
 * The counter a collection order names, or null.
 *
 * An app-placed collection order carries no FulfillmentLocationId today, so the
 * counter is legitimately unknown. Null means the screen renders the absence.
 * It must never substitute the word "Store", the seller's name, or the only
 * location the seller happens to have: none of those is a recorded fact about
 * this order.
 */
export function counterReference(fulfillmentLocationId?: string | null): string | null {
  const trimmed = fulfillmentLocationId?.trim();
  if (!trimmed) return null;
  if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * A collection sub-order has an EMPTY shipping snapshot by design — no address
 * was ever collected, because nothing is being shipped anywhere.
 *
 * Both mobile clients had a bug where that empty snapshot bottomed out as
 * "Location saved", which names a place that does not exist. This returns null
 * for a collection order without inspecting the snapshot at all, so there is no
 * field left for a fallback to reach for. The snapshot's Country defaults to
 * "NP" server-side, so "is every field blank?" is not a safe test either.
 */
export function collectionDestination(subOrder: {
  fulfillmentChannel: number;
}): null {
  void subOrder;
  return null;
}

/** The outcome of recording a handover, as the screen needs to render it. */
export type HandoverOutcome =
  | { kind: 'completed'; collectedUtc: string | null }
  | { kind: 'refused'; message: string }
  | { kind: 'failed'; message: string };

type ErrorBody = {
  title?: string;
  message?: string;
  detail?: string;
  errorCode?: string;
  field?: string;
};

/**
 * Turns the verbatim upstream response into something the operator can read.
 *
 * The refusal on a delivery sub-order arrives as a business-rule failure, and
 * it is surfaced as the reason it is rather than as a generic failure — an
 * operator who is told "HTTP 422" learns nothing and retries.
 */
export function readHandoverResponse(response: {
  status: number;
  body: unknown;
}): HandoverOutcome {
  if (response.status >= 200 && response.status < 300) {
    const body = response.body as { collectedUtc?: string | null } | null;
    return { kind: 'completed', collectedUtc: body?.collectedUtc ?? null };
  }

  const body = (response.body ?? undefined) as ErrorBody | undefined;
  const upstream = body?.title ?? body?.message ?? body?.detail;

  if (response.status === 422 || response.status === 400) {
    return {
      kind: 'refused',
      message:
        upstream ??
        'The commerce surface refused this handover. A counter handover applies only to a ' +
          'collection sub-order.',
    };
  }

  if (response.status === 409) {
    return {
      kind: 'refused',
      message: upstream ?? 'This sub-order is no longer in a state that accepts a handover.',
    };
  }

  if (response.status === 403) {
    return {
      kind: 'failed',
      message:
        upstream ??
        'Recording a counter handover takes a Stylemint operator role. An administrator grants it.',
    };
  }

  if (response.status === 404) {
    return {
      kind: 'failed',
      message: upstream ?? 'No sub-order with that id is reachable from this operator credential.',
    };
  }

  return {
    kind: 'failed',
    message: upstream ?? `The commerce surface returned HTTP ${response.status}.`,
  };
}
