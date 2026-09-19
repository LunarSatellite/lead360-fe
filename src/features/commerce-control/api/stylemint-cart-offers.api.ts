import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the cart-offer holdout readout.
 *
 * About one shopper in ten never sees a cart offer — always the same shoppers, picked by a fixed
 * hash of their account id. This endpoint is what that holdout is for: it counts what each arm
 * recorded and, only when the counts support it, states the difference between them with the
 * interval around it.
 *
 * The shapes here mirror the backend deliberately, including the nullables. `conversions` is null
 * for an arm nothing was recorded in, and `0` for an arm that was observed and converted nobody —
 * those are different findings and the UI must not flatten them. `uplift` is null far more often
 * than it is present, and its absence is the normal, correct state of a young experiment.
 *
 * Read-only. SuperAdmin, no step-up MFA.
 */

const BASE = 'v1/admin/cart-offers';

export const CART_OFFER_ARM = {
  control: 'holdout_control',
  treatment: 'offers_eligible',
} as const;

export type CartOfferArm = {
  armCode: string;
  armLabel: string;
  /** False when nothing at all was recorded for this arm. Not the same as no conversions. */
  hasObservations: boolean;
  observations: number;
  /** Null when the arm was never observed; 0 is a measured zero. */
  conversions: number | null;
  /** Null when there is nothing to divide. */
  conversionPercent: number | null;
  meetsMinimumObservations: boolean;
};

/**
 * The difference between the arms, which only ever arrives with its bounds. There is no field
 * here that can be shown on its own as an effect, and none that claims how sure anyone is.
 */
export type CartOfferUpliftInterval = {
  basis: string;
  method: string;
  intervalCoveragePercent: number;
  pointEstimatePercentagePoints: number;
  lowerBoundPercentagePoints: number;
  upperBoundPercentagePoints: number;
  intervalSpansZero: boolean;
};

export type CartOfferIncrementalityReadout = {
  windowFromUtc: string;
  windowToUtc: string;
  conversionHorizonHours: number;
  minimumObservationsPerArm: number;
  arms: CartOfferArm[];
  /** Null whenever the recorded counts do not support stating a difference. */
  uplift: CartOfferUpliftInterval | null;
  statement: string;
  caveats: string[];
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ?? 'The holdout readout takes the Stylemint SuperAdmin role. An administrator grants it.',
    );
  }
  if (response.status === 400) {
    throw new Error(detail ?? 'That window is outside the range the readout will scan.');
  }
  throw new Error(detail ?? `Cart offer readout failed (${response.status}).`);
}

export const stylemintCartOffersApi = {
  /** What the holdout recorded over the last `days` days. Never writes. */
  incrementality: async (days = 30): Promise<CartOfferIncrementalityReadout> =>
    unwrap<CartOfferIncrementalityReadout>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/incrementality`,
        query: `days=${days}`,
      }),
    ),
};

/** Formats a count that may legitimately be absent. Absent is never rendered as zero. */
export function formatCount(value: number | null): string {
  return value === null ? 'not recorded' : value.toLocaleString();
}

/** Formats a percentage that may legitimately be absent. */
export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}

/** Signed percentage points, so a difference always reads as a direction. */
export function formatPoints(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)} pp`;
}
