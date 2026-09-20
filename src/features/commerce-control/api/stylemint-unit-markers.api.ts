import { stylemintOperationsApi, type OperationMethod } from './stylemint-operations.api';

/**
 * Per-unit markers: the physical tag a seller attaches to one item before it ships, and the
 * binding that ties that tag to one line of one order.
 *
 * Vendor credential, like the rest of the vendor surface.
 *
 * **Minting returns cleartext secrets exactly once.** The platform stores only a SHA-256 digest,
 * so the mint response is the sole opportunity to print the tags; a lost secret is not
 * recoverable, it is replaced by revoking the marker and minting another. Everything about the
 * minting screen follows from that: the secrets are shown immediately, never refetched, and never
 * written to storage that outlives the page.
 */

export const UnitMarkerStatus = { Active: 1, Revoked: 2 } as const;

export const UNIT_MARKER_STATUS_LABEL: Record<number, string> = {
  1: 'Active',
  2: 'Revoked',
};

export const UnitBindingStage = { Pack: 1, Handover: 2 } as const;
export type UnitBindingStageValue = (typeof UnitBindingStage)[keyof typeof UnitBindingStage];

export const BINDING_STAGE_LABEL: Record<number, string> = {
  1: 'Packing',
  2: 'Handover',
};

/** A marker as its owner sees it afterwards. Never carries the secret. */
export type UnitMarker = {
  id: string;
  reference: string;
  productId: string;
  productVariantId: string;
  status: number;
  provisionedUtc: string;
  revokedUtc?: string | null;
};

/** The one and only time a marker cleartext leaves the platform. */
export type ProvisionedUnitMarker = {
  id: string;
  reference: string;
  secret: string;
  productId: string;
  productVariantId: string;
  provisionedUtc: string;
};

export type UnitMarkerPage = {
  items: UnitMarker[];
  totalCount: number;
  nextCursor?: string | null;
  previousCursor?: string | null;
  pageSize: number;
};

export type Report = Record<string, unknown>;

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // An unmatched upstream route 404s with an empty body; a controller own 404 carries one.
  if (response.status === 404) {
    const empty = response.body == null || response.body === '';
    throw new Error(empty ? 'NOT_DEPLOYED' : 'NOT_FOUND');
  }
  if (response.status === 409 || response.status === 422) {
    throw new Error(detail ?? 'The marker is not in a state where that is allowed.');
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      detail ?? 'Lead360 is not configured with a vendor credential for this environment.',
    );
  }
  throw new Error(detail ?? `The unit-marker surface returned HTTP ${response.status}.`);
}

const BASE = 'v1/vendor/unit-markers';
const ref = (value: string) => encodeURIComponent(value);

async function call<T>(method: OperationMethod, path: string, body?: unknown): Promise<T> {
  return unwrap<T>(
    await stylemintOperationsApi.invoke({
      method,
      path,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

export const stylemintUnitMarkersApi = {
  list: async (filter: {
    productId?: string;
    productVariantId?: string;
    cursor?: string;
    pageSize?: number;
  } = {}): Promise<UnitMarkerPage> => {
    const query = new URLSearchParams();
    if (filter.productId) query.set('productId', filter.productId);
    if (filter.productVariantId) query.set('productVariantId', filter.productVariantId);
    if (filter.cursor) query.set('cursor', filter.cursor);
    query.set('pageSize', String(filter.pageSize ?? 20));

    return unwrap<UnitMarkerPage>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  /**
   * Mints a print run. `quantity` is a number of tags to print, not a stock figure: minting
   * prices nothing, reserves nothing and moves no money.
   *
   * The returned secrets are shown once and cannot be read back.
   */
  provision: (productVariantId: string, quantity: number) =>
    call<ProvisionedUnitMarker[]>('POST', BASE, { productVariantId, quantity }),

  /** Terminal. A revoked marker is never re-activated; a lost tag is replaced by a new one. */
  revoke: (reference: string) =>
    call<UnitMarker>('POST', `${BASE}/${ref(reference)}/revoke`, {}),

  /** Ties a tag to one line of one order, at the moment it was attached. */
  bind: (marker: string, subOrderLineId: string, stage: UnitBindingStageValue) =>
    call<Report>('POST', `${BASE}/bind`, { marker, subOrderLineId, stage }),

  /** Re-points a binding that went on the wrong unit. The reason is recorded with it. */
  correctBinding: (
    marker: string,
    subOrderLineId: string,
    stage: UnitBindingStageValue,
    reason: string,
  ) =>
    call<Report>('POST', `${BASE}/bindings/correct`, {
      marker,
      subOrderLineId,
      stage,
      reason,
    }),

  bindings: (reference: string) => call<Report>('GET', `${BASE}/${ref(reference)}/bindings`),

  /** Where a tag has been scanned, newest first. The tag's own history, not the unit's. */
  scans: async (reference: string, limit = 50): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${ref(reference)}/scans`,
        query: `limit=${limit}`,
      }),
    ),
};
