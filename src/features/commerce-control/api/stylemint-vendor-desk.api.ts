import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * The vendor's own books: the dashboard, the analytics behind it, the activity feed, how the
 * creators working with the shop are performing, whether its growth is the good kind, and which
 * associates hold which clients.
 *
 * Vendor credential — a static service identity scoped to `Stylemint:VendorAccountId`, the same
 * footing as every other vendor surface Lead360 drives. It answers for that one shop, never for
 * an arbitrary vendor, and the UI says so rather than offering a vendor picker that would either
 * 403 or quietly show the wrong shop's numbers.
 *
 * The report shapes here are wide and still moving, so they are typed open and rendered as
 * reports. Inventing a narrow layout over a shape that is still changing is the DTO-drift failure
 * this codebase has hit before.
 */

export type Report = Record<string, unknown>;

export const VendorActivityKind = {
  OrderReceived: 1,
  OrderShipped: 2,
  OrderDelivered: 3,
  OrderCancelled: 4,
  ProductAdded: 5,
  ProductUpdated: 6,
  ProductOutOfStock: 7,
  InventoryLowAlert: 8,
  PayoutReceived: 9,
  PayoutFailed: 10,
  CustomerInquiry: 11,
  PartnershipRequest: 12,
  PartnershipEnded: 13,
} as const;

export const ACTIVITY_KIND_LABEL: Record<number, string> = {
  1: 'Order received',
  2: 'Order shipped',
  3: 'Order delivered',
  4: 'Order cancelled',
  5: 'Product added',
  6: 'Product updated',
  7: 'Product out of stock',
  8: 'Inventory low',
  9: 'Payout received',
  10: 'Payout failed',
  11: 'Customer inquiry',
  12: 'Partnership request',
  13: 'Partnership ended',
};

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // An unmatched upstream route 404s with an empty body; a controller's own 404 carries one.
  if (response.status === 404) {
    const empty = response.body == null || response.body === '';
    throw new Error(empty ? 'NOT_DEPLOYED' : 'NOT_FOUND');
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      detail ?? 'Lead360 is not configured with a vendor credential for this environment.',
    );
  }
  throw new Error(detail ?? `The vendor surface returned HTTP ${response.status}.`);
}

/** A from/to pair covering the last N days, which is how every analytics read here is scoped. */
function windowQuery(days: number, extra: Record<string, string | number> = {}): string {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const query = new URLSearchParams({
    fromUtc: from.toISOString(),
    toUtc: to.toISOString(),
  });
  for (const [key, value] of Object.entries(extra)) query.set(key, String(value));
  return query.toString();
}

async function get<T = Report>(path: string, query?: string): Promise<T> {
  return unwrap<T>(await stylemintOperationsApi.invoke({ method: 'GET', path, query }));
}

export const stylemintVendorDeskApi = {
  dashboard: (windowDays = 30) => get(`v1/vendor/dashboard`, `windowDays=${windowDays}`),

  analyticsOverview: (days = 30) =>
    get('v1/vendor/analytics/overview', windowQuery(days, { topProductsLimit: 10, topCreatorsLimit: 10 })),

  topProducts: (days = 30, limit = 50) =>
    get('v1/vendor/analytics/products', windowQuery(days, { limit })),

  analyticsCreators: (days = 30, limit = 50) =>
    get('v1/vendor/analytics/creators', windowQuery(days, { limit })),

  productAnalytics: (productId: string, days = 30) =>
    get(
      `v1/vendor/products/${encodeURIComponent(productId)}/analytics`,
      windowQuery(days, { topCreatorsLimit: 5, locationsLimit: 10 }),
    ),

  activity: (kinds: number[] = [], pageSize = 50) => {
    const query = new URLSearchParams({ pageSize: String(pageSize) });
    // Repeated `kinds` params, which is how ASP.NET binds an array from the query string.
    for (const kind of kinds) query.append('kinds', String(kind));
    return get('v1/vendor/activity', query.toString());
  },

  creatorPerformance: (days = 30, limit = 20) =>
    get('v1/vendor/creator-performance', windowQuery(days, { limit })),

  growthQuality: (days = 30) => get('v1/vendor/growth-quality', `days=${days}`),

  clientAssignments: (associateAccountId?: string, pageSize = 25) => {
    const query = new URLSearchParams({ pageSize: String(pageSize) });
    if (associateAccountId) query.set('associateAccountId', associateAccountId);
    return get('v1/vendor/clienteling/assignments', query.toString());
  },

  associateCredit: (associateAccountId: string) =>
    get(`v1/vendor/clienteling/associates/${encodeURIComponent(associateAccountId)}/credit`),

  grantAssignment: async (params: {
    associateAccountId: string;
    customerAccountId: string;
    note?: string;
  }): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/vendor/clienteling/assignments',
        body: JSON.stringify({
          associateAccountId: params.associateAccountId,
          customerAccountId: params.customerAccountId,
          note: params.note?.trim() || null,
        }),
      }),
    ),

  revokeAssignment: async (assignmentId: string): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/vendor/clienteling/assignments/${encodeURIComponent(assignmentId)}/revoke`,
        body: JSON.stringify({}),
      }),
    ),
};
