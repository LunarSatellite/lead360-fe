import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the Intelligence dimension store, as the vendor and the admin see it.
 *
 *   GET/PUT v1/vendor/products/{productId}/dimension-tags   (VendorProductDimensionTagsController)
 *   GET     v1/admin/dimension-tags/claims                  (ContentMod, KycReviewer, Readonly)
 *   POST    v1/admin/dimension-tags/verify                  (ContentMod, KycReviewer)
 *
 * Shapes mirror `VendorProductDimensionTags`, `PendingDimensionClaimPage` and
 * `VerifyDimensionClaimVm` in StyleMint.Modules.Intelligence. Nothing here knows a dimension key:
 * the keys, labels, groups, value types and allowed values all arrive in `taggable`.
 */

/** The registry's value types. A range value is serialised as `lo..hi`; a boolean as `true`/`false`. */
export type DimensionValueType = 'categorical' | 'multi' | 'boolean' | 'numeric' | 'range';

export interface EffectiveDimensionTag {
  key: string;
  value: string;
  source: string;
  confidence: number;
  verified: boolean;
}

export interface DimensionTagDto {
  subjectKind: string;
  subjectId: string;
  key: string;
  value: string;
  /** vendor | verified | vision | text | measured | … */
  source: string;
  confidence: number;
  verified: boolean;
  updatedUtc: string;
}

export interface VendorTaggableDimension {
  key: string;
  label: string;
  group: string;
  valueType: DimensionValueType | string;
  values: string[];
  unit?: string | null;
  departments: string[];
  /** The registry's supply_source includes `verified`: an admin must confirm the claim. */
  needsVerification: boolean;
}

export interface VendorProductDimensionTags {
  productId: string;
  effective: EffectiveDimensionTag[];
  vendorTags: DimensionTagDto[];
  suggestions: DimensionTagDto[];
  taggable: VendorTaggableDimension[];
}

export interface VendorDimensionKeyValues {
  key: string;
  values: string[];
}

export interface PendingDimensionClaim {
  subjectKind: string;
  subjectId: string;
  key: string;
  label: string;
  value: string;
  claimedUtc: string;
}

export interface PendingDimensionClaimPage {
  items: PendingDimensionClaim[];
  total: number;
  skip: number;
  take: number;
}

export interface VerifyDimensionClaim {
  subjectKind: string;
  subjectId: string;
  key: string;
  value: string;
  /** true verifies; false withdraws (the reject path). */
  verified: boolean;
}

function unwrap<T>(response: { status: number; body: unknown }, forbidden: string): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;
  const body = response.body as { title?: string; message?: string; detail?: string } | undefined;
  const detail = body?.title ?? body?.message ?? body?.detail;
  if (response.status === 401 || response.status === 403) throw new Error(detail ?? forbidden);
  if (response.status === 404) throw new Error(detail ?? 'Not found.');
  throw new Error(detail ?? `The dimension store returned HTTP ${response.status}.`);
}

const VENDOR_FORBIDDEN = 'This product is not one of your shop’s products, or the vendor credential is missing.';
const ADMIN_FORBIDDEN =
  'Claim verification takes the Stylemint ContentMod or KycReviewer role (Readonly may view the queue).';

export const stylemintDimensionsApi = {
  productTags: async (productId: string) =>
    unwrap<VendorProductDimensionTags>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/vendor/products/${encodeURIComponent(productId)}/dimension-tags`,
      }),
      VENDOR_FORBIDDEN,
    ),

  saveProductTags: async (productId: string, tags: VendorDimensionKeyValues[]) =>
    unwrap<VendorProductDimensionTags>(
      await stylemintOperationsApi.invoke({
        method: 'PUT',
        path: `v1/vendor/products/${encodeURIComponent(productId)}/dimension-tags`,
        body: JSON.stringify({
          tags: tags.map((t) => ({ key: t.key, values: t.values, source: 'vendor' })),
        }),
      }),
      VENDOR_FORBIDDEN,
    ),

  pendingClaims: async (skip = 0, take = 50) =>
    unwrap<PendingDimensionClaimPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/dimension-tags/claims',
        query: new URLSearchParams({ skip: String(skip), take: String(take) }).toString(),
      }),
      ADMIN_FORBIDDEN,
    ),

  verifyClaim: async (cmd: VerifyDimensionClaim) =>
    unwrap<DimensionTagDto | null>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/dimension-tags/verify',
        body: JSON.stringify(cmd),
      }),
      ADMIN_FORBIDDEN,
    ),
};
