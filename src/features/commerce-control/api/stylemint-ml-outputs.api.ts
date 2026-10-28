import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Read-only views over stylemint-ai's batch outputs, reached through the Lead360 operator
 * pass-through like every other commerce surface:
 *
 *  - `v1/admin/ml/order-risk/review-queue` — admin credential (StyleMint roles Readonly,
 *    SupportAgent or PayoutsOps). Recommendations only: nothing here blocks or changes an order.
 *  - `v1/vendor/ml-insights/*` — vendor credential, scoped to the configured vendor account.
 *    Aggregates only; no account ids are ever returned.
 *
 * Field names mirror the C# records (OrderRiskReviewItem, OrderRiskReviewPage, DemandGapDto,
 * AudienceSegmentProfileDto in StyleMint.Modules.Intelligence) under ASP.NET's default camelCase.
 */

export type OrderRiskReviewItem = {
  orderId: string;
  ruleScore: number | null;
  anomalyScore: number | null;
  reasons: string[];
  modelVersion: string;
  asOf: string;
};

export type OrderRiskReviewPage = {
  items: OrderRiskReviewItem[];
  total: number;
  skip: number;
  take: number;
};

export type DemandGap = {
  region: string;
  category: string;
  score: number;
  evidence: string | null;
  supply: number | null;
  modelVersion: string;
  asOf: string;
};

export type AudienceSegmentProfile = {
  segment: string;
  size: number;
  /** Free-form aggregate profile written by the model; keys are the model's own. */
  profile: unknown;
  modelVersion: string;
  asOf: string;
};

/** Human labels for the reason codes the order-risk model emits. Unknown codes fall through as-is. */
export const ORDER_RISK_REASON_LABEL: Record<string, string> = {
  new_account_high_value: 'New account, high order value',
  cod_above_history: 'Cash on delivery above usual amount',
  order_burst: 'Burst of orders in a short time',
  new_city: 'Delivery to a new city',
  high_cancel_history: 'History of many cancellations',
  high_return_history: 'History of many returns',
  anomaly: 'Unusual compared with similar orders',
  anomaly_score: 'Unusual compared with similar orders',
};

export function reasonLabel(code: string): string {
  return ORDER_RISK_REASON_LABEL[code] ?? code.replace(/_/g, ' ');
}

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 404) {
    const empty = response.body == null || response.body === '';
    throw new Error(empty ? 'NOT_DEPLOYED' : (detail ?? 'NOT_FOUND'));
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      detail ?? 'Lead360 is not configured with a credential that may read this surface.',
    );
  }
  throw new Error(detail ?? `The ML insights surface returned HTTP ${response.status}.`);
}

async function get<T>(path: string, query?: string): Promise<T> {
  return unwrap<T>(await stylemintOperationsApi.invoke({ method: 'GET', path, query }));
}

export const stylemintMlOutputsApi = {
  orderRiskReviewQueue: (skip = 0, take = 50) =>
    get<OrderRiskReviewPage>(
      'v1/admin/ml/order-risk/review-queue',
      new URLSearchParams({ skip: String(skip), take: String(take) }).toString(),
    ),

  demandGaps: (take = 50) =>
    get<DemandGap[]>('v1/vendor/ml-insights/demand-gaps', `take=${take}`),

  audienceSegments: () => get<AudienceSegmentProfile[]>('v1/vendor/ml-insights/audience-segments'),
};

/** Flattens a model-written profile into short "key: value" lines for display. */
export function summariseProfile(profile: unknown): string[] {
  if (profile == null) return [];
  if (typeof profile !== 'object') return [String(profile)];
  if (Array.isArray(profile)) return profile.slice(0, 6).map((v) => formatValue(v));
  return Object.entries(profile as Record<string, unknown>)
    .slice(0, 8)
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${formatValue(value)}`);
}

function formatValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (Array.isArray(value)) return value.slice(0, 5).map(formatValue).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .slice(0, 4)
      .map(([k, v]) => `${k.replace(/_/g, ' ')} ${formatValue(v)}`)
      .join(', ');
  }
  return String(value);
}
