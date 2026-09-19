import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for platform-curated collections — the editorial rails on the storefront.
 *
 * Distinct from the vendor and creator collections the Vendor operations page already covers:
 * those are owned by a shop or a creator, these are the platform's own merchandising, gated by
 * the ContentMod role. No step-up MFA, so the actions work from Lead360.
 */

export const CollectionState = { Draft: 1, Published: 2, Archived: 3 } as const;
export type CollectionStateValue = (typeof CollectionState)[keyof typeof CollectionState];
export const COLLECTION_STATE_LABEL: Record<number, string> = {
  1: 'Draft',
  2: 'Published',
  3: 'Archived',
};

export const CollectionKind = { Editorial: 1, CreatorCollection: 2 } as const;
export const COLLECTION_KIND_LABEL: Record<number, string> = {
  1: 'Editorial',
  2: 'Creator',
};

export type CollectionSummary = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string | null;
  kind: number;
  state: number;
  sortOrder: number;
  itemCount: number;
  startsUtc?: string | null;
  endsUtc?: string | null;
  publishedUtc?: string | null;
};

export type CollectionItem = {
  productId: string;
  sortOrder: number;
  note?: string | null;
  productName: string;
  primaryImageUrl?: string | null;
  productState?: number | null;
  isPubliclyListed: boolean;
};

export type CollectionDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  sortOrder: number;
  startsUtc?: string | null;
  endsUtc?: string | null;
  kind: number;
  state: number;
  items: CollectionItem[];
};

export type CollectionPage = {
  items: CollectionSummary[];
  totalCount: number;
  nextCursor?: string | null;
};

const BASE = 'v1/admin/collections';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Curating platform collections takes the Stylemint ContentMod role. ' +
          'An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The collections surface returned HTTP ${response.status}.`);
}

export const stylemintCollectionsApi = {
  list: async (params: {
    state?: CollectionStateValue;
    cursor?: string;
    pageSize?: number;
  }): Promise<CollectionPage> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    if (params.cursor) query.set('cursor', params.cursor);
    query.set('pageSize', String(params.pageSize ?? 20));

    return unwrap<CollectionPage>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  get: async (collectionId: string): Promise<CollectionDetail> =>
    unwrap<CollectionDetail>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(collectionId)}`,
      }),
    ),

  publish: async (collectionId: string): Promise<CollectionDetail> =>
    unwrap<CollectionDetail>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(collectionId)}/publish`,
      }),
    ),

  archive: async (collectionId: string): Promise<CollectionDetail> =>
    unwrap<CollectionDetail>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(collectionId)}/archive`,
      }),
    ),

  removeItem: async (collectionId: string, productId: string): Promise<CollectionDetail> =>
    unwrap<CollectionDetail>(
      await stylemintOperationsApi.invoke({
        method: 'DELETE',
        path: `${BASE}/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(productId)}`,
      }),
    ),

  addItem: async (collectionId: string, productId: string, note?: string): Promise<CollectionDetail> =>
    unwrap<CollectionDetail>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(collectionId)}/items`,
        body: JSON.stringify({ productId, note: note || null }),
      }),
    ),

  /** Reorders by sending the product ids in the order they should appear. */
  reorder: async (collectionId: string, productIds: string[]): Promise<CollectionDetail> =>
    unwrap<CollectionDetail>(
      await stylemintOperationsApi.invoke({
        method: 'PUT',
        path: `${BASE}/${encodeURIComponent(collectionId)}/items/order`,
        body: JSON.stringify({ productIds }),
      }),
    ),
};
