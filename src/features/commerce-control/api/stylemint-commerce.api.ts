import { apiClient } from '@/shared/lib/api-client';

export type StylemintOrder = {
  id: string;
  orderId: string;
  orderNumber: string;
  receiverName: string;
  state: number;
  subtotalAmount: number;
  subtotalCurrency: string;
  itemCount: number;
  carrier?: string | null;
  trackingNumber?: string | null;
  placedUtc: string;
};

export type StylemintOrderDetail = StylemintOrder & {
  shipTo?: {
    receiverName: string;
    receiverPhone: string;
    addressLine1: string;
    landmark?: string | null;
    country: string;
    state: string;
    city: string;
    zipCode: string;
    latitude?: number | null;
    longitude?: number | null;
    locationNote?: string | null;
    mapsLink?: string | null;
  };
  lines?: Array<{
    id: string;
    productTitleSnapshot: string;
    optionLabel?: string | null;
    thumbnailUrlSnapshot?: string | null;
    quantity: number;
    unitPriceAmount: number;
    unitPriceCurrency: string;
    lineSubtotalAmount: number;
    lineSubtotalCurrency: string;
  }>;
};

export type StylemintOrderPage = {
  items?: StylemintOrder[];
  data?: StylemintOrder[];
  results?: StylemintOrder[];
  nextCursor?: string | null;
};

export type RefundContext = {
  orderId: string;
  orderNumber: string;
  paymentIntentId?: string | null;
  refundableAmount: number;
  currency: string;
  state: string;
};

export type SocialContentItem = {
  externalId: string;
  permalink: string;
  caption?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  mediaType: string;
  publishedUtc?: string | null;
  durationSeconds?: number | null;
  likeCount?: number | null;
  viewCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
};

export type StylemintCustomer = {
  id: string;
  displayName: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  avatarUrl?: string | null;
  countryCode?: string | null;
  locale: string;
  timezone: string;
  status: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastActiveUtc?: string | null;
  createdUtc: string;
};

export type StylemintReadiness = {
  baseUrl: string;
  vendor: { configured: boolean; reachable: boolean; statusCode?: number | null };
  admin: { configured: boolean; reachable: boolean; statusCode?: number | null };
  ready: boolean;
  correlationId: string;
};

export type StylemintCategory = {
  id: string;
  parentCategoryId?: string | null;
  slug: string;
  nameEn: string;
  displayOrder: number;
  isGated: boolean;
  isActive: boolean;
};

export type CommerceTenantSettings = {
  name: string;
  locale: 'fr-CD' | 'en-CD';
  currency: 'CDF' | 'USD';
  timeZone: 'Africa/Kinshasa';
  logoUrl?: string | null;
  accentColor: string;
};

const BASE = '/v1/stylemint';

export const stylemintCommerceApi = {
  tenantSettings: () => apiClient.get('/v1/tenants/current') as unknown as Promise<CommerceTenantSettings>,
  updateTenantSettings: (data: CommerceTenantSettings) =>
    apiClient.put(
      '/v1/tenants/current/commerce-settings',
      data,
    ) as unknown as Promise<CommerceTenantSettings>,
  health: () => apiClient.get(`${BASE}/health`) as unknown as Promise<Record<string, unknown>>,
  readiness: () => apiClient.get(`${BASE}/readiness`) as unknown as Promise<StylemintReadiness>,
  categories: () => apiClient.get(`${BASE}/catalog/categories`) as unknown as Promise<StylemintCategory[]>,
  orders: (params: { pageSize?: number; cursor?: string; state?: number }) =>
    apiClient.get(`${BASE}/orders`, { params }) as unknown as Promise<StylemintOrderPage>,
  order: (id: string) => apiClient.get(`${BASE}/orders/${id}`) as unknown as Promise<Record<string, unknown>>,
  packingSlip: (id: string) =>
    apiClient.get(`${BASE}/orders/${id}/packing-slip`, { responseType: 'blob' }) as unknown as Promise<Blob>,
  refundCapability: () =>
    apiClient.get(`${BASE}/payments/refund-capability`) as unknown as Promise<Record<string, unknown>>,
  command: (id: string, command: string, data?: unknown) =>
    apiClient.post(`${BASE}/orders/${id}/${command}`, data ?? {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  refund: (
    paymentIntentId: string,
    data: { amount: number; currency: string; reasonTag: string; reason: string },
  ) =>
    apiClient.post(`${BASE}/payments/${paymentIntentId}/refund`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  refundContext: (orderId: string) =>
    apiClient.get(`${BASE}/orders/${orderId}/refund-context`) as unknown as Promise<RefundContext>,
  vendorResource: (resource: string, params?: Record<string, unknown>) =>
    apiClient.get(`${BASE}/vendor/${resource}`, { params }) as unknown as Promise<unknown>,
  vendorEarningsBalance: () => apiClient.get(`${BASE}/vendor/earnings/balance`) as unknown as Promise<Record<string, unknown>>,
  vendorEarningsEntries: (params: { pageSize?: number; cursor?: string } = {}) => apiClient.get(`${BASE}/vendor/earnings/entries`, { params }) as unknown as Promise<unknown>,
  vendorPayouts: (params: { pageSize?: number; cursor?: string } = {}) => apiClient.get(`${BASE}/vendor/payouts`, { params }) as unknown as Promise<unknown>,
  vendorPayoutInvoice: (id: string) => apiClient.get(`${BASE}/vendor/payouts/${id}/invoice`) as unknown as Promise<Record<string, unknown>>,
  requestVendorPayout: (data: { amount: number; destinationKind: number; destinationId: string }) => apiClient.post(`${BASE}/vendor/payouts/on-demand`, data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<Record<string, unknown>>,
  vendorPayoutDestinations: () => apiClient.get(`${BASE}/vendor/payout-destinations`) as unknown as Promise<unknown>,
  createVendorPayoutDestination: (data: { kind: number; label: string; accountIdentifier: string; branchOrIfsc?: string; makeDefault: boolean }) => apiClient.post(`${BASE}/vendor/payout-destinations`, data, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<Record<string, unknown>>,
  setDefaultVendorPayoutDestination: (id: string) => apiClient.post(`${BASE}/vendor/payout-destinations/${id}/default`, {}, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<Record<string, unknown>>,
  deleteVendorPayoutDestination: (id: string) => apiClient.delete(`${BASE}/vendor/payout-destinations/${id}`, { headers: { 'Idempotency-Key': crypto.randomUUID() } }) as unknown as Promise<void>,
  catalogueReadiness: () =>
    apiClient.get(`${BASE}/vendor/catalogue-readiness`) as unknown as Promise<{
      ready: boolean;
      requiredProducts: number;
      totalProducts: number;
      displayableProducts: number;
      productsWithFiveImages: number;
      productsWithReel: number;
      incompleteProducts: Array<{ id: string; name: string; imageCount: number; hasReel: boolean }>;
      checkedUtc: string;
      correlationId: string;
    }>,
  applyPricingSuggestion: (id: string) =>
    apiClient.post(`${BASE}/vendor/pricing/suggestions/${id}/apply`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  createFlashSale: (data: { productId: string; salePrice: number; startUtc: string; endUtc: string; maxUnits: number }) =>
    apiClient.post(`${BASE}/vendor/pricing/flash-sales`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  flashSaleIncrementality: (id: string) =>
    apiClient.get(`${BASE}/vendor/pricing/flash-sales/${id}/incrementality`) as unknown as Promise<Record<string, unknown>>,
  sponsorProduct: (productId: string, data: { dailyImpressionCap: number; endsUtc: string }) =>
    apiClient.put(`${BASE}/vendor/store/sponsored/${productId}`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  pauseSponsorship: (productId: string) =>
    apiClient.post(`${BASE}/vendor/store/sponsored/${productId}/pause`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorCampaignAction: (id: string, action: 'approve' | 'activate' | 'refresh') =>
    apiClient.post(
      `${BASE}/vendor/campaigns/${id}/${action}`,
      {},
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  vendorCampaign: (id: string) =>
    apiClient.get(`${BASE}/vendor/campaigns/${id}`) as unknown as Promise<Record<string, unknown>>,
  createVendorCampaign: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE}/vendor/campaigns`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  configureVendorCampaign: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`${BASE}/vendor/campaigns/${id}/configuration`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorBriefAction: (id: string, action: 'lock' | 'fork' | 'retire' | 'recompute-roi') =>
    apiClient.post(`${BASE}/vendor/briefs/${id}/${action}`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorBrief: (id: string) =>
    apiClient.get(`${BASE}/vendor/briefs/${id}`) as unknown as Promise<Record<string, unknown>>,
  updateVendorBrief: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`${BASE}/vendor/briefs/${id}`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  createVendorBrief: (data: {
    title: string;
    primaryGoal: number;
    productVariantIds: string[];
    currencyCode: 'CDF';
  }) =>
    apiClient.post(`${BASE}/vendor/briefs`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  inviteVendorPartnership: (data: {
    creatorProfileId: string;
    commissionMinPercent: number;
    commissionMaxPercent: number;
    brandBriefId?: string;
  }) =>
    apiClient.post(`${BASE}/vendor/partnerships/invite`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorPartnershipCreators: (query?: string) =>
    apiClient.get(`${BASE}/vendor/partnerships/creators`, {
      params: { q: query || undefined, excludeAlreadyPartnered: true, pageSize: 25 },
    }) as unknown as Promise<unknown>,
  vendorPartnershipCreatorAnalytics: (id: string) =>
    apiClient.get(`${BASE}/vendor/partnerships/${id}/creator-analytics`) as unknown as Promise<
      Record<string, unknown>
    >,
  createVendorSquad: (data: { briefId: string; name: string; budgetTotal: number; budgetCurrency: 'CDF' }) =>
    apiClient.post(`${BASE}/vendor/squads`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  inviteVendorSquadCreator: (id: string, creatorAccountId: string, budgetShare: number) =>
    apiClient.post(`${BASE}/vendor/squads/${id}/invite`, { creatorAccountId, budgetShare }, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<void>,
  createVendorRetainer: (data: { creatorAccountId: string; monthlyAmount: number; currency: 'CDF'; deliverablesPerMonth: number }) =>
    apiClient.post(`${BASE}/vendor/retainers`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorRetainerAction: (id: string, action: 'pause' | 'resume' | 'cancel') =>
    apiClient.post(`${BASE}/vendor/retainers/${id}/${action}`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<void>,
  vendorPartnershipPrediction: (id: string) =>
    apiClient.get(`${BASE}/vendor/partnerships/${id}/prediction`) as unknown as Promise<Record<string, unknown>>,
  vendorPartnershipInsurance: (id: string) =>
    apiClient.get(`${BASE}/vendor/partnerships/${id}/insurance`) as unknown as Promise<Record<string, unknown>>,
  purchaseVendorPartnershipInsurance: (id: string, coverageAmount: number) =>
    apiClient.post(`${BASE}/vendor/partnerships/${id}/insurance`, { coverageAmount, currency: 'CDF' }, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorPartnershipInsuranceClaims: (id: string) =>
    apiClient.get(`${BASE}/vendor/partnerships/${id}/insurance/claims`) as unknown as Promise<unknown>,
  fileVendorPartnershipInsuranceClaim: (
    id: string,
    data: { claimAmount: number; currency: 'CDF'; reason: string; evidenceUrls: string[] },
  ) =>
    apiClient.post(`${BASE}/vendor/partnerships/${id}/insurance/claims`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorPartnershipAction: (
    id: string,
    action: 'accept-request' | 'decline-request' | 'pause' | 'resume' | 'end' | 'adjust-commission',
    data?: unknown,
  ) =>
    apiClient.post(`${BASE}/vendor/partnerships/${id}/${action}`, data ?? {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  publishVendorPartnershipTerms: (data: {
    whoCanJoin: { heading: string; bullets: string[] };
    reelContentRules: { heading: string; bullets: Array<{ text: string; inlineLinks: never[] }> };
  }) =>
    apiClient.post(`${BASE}/vendor/partnership-terms`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorMatchAction: (id: string, action: 'invite' | 'dismiss') =>
    apiClient.post(`${BASE}/vendor/matches/${id}/${action}`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  runVendorScenario: (data: {
    name: string;
    seed: number;
    customerAgents: number;
    days: number;
    demandShockPercent: number;
    inventoryLossPercent: number;
    fulfillmentCapacityLossPercent: number;
  }) =>
    apiClient.post(`${BASE}/vendor/digital-twin/scenarios`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorProduct: (id: string) =>
    apiClient.get(`${BASE}/vendor/products/${id}`) as unknown as Promise<Record<string, unknown>>,
  vendorCollection: (id: string) =>
    apiClient.get(`${BASE}/vendor/collections/${id}`) as unknown as Promise<Record<string, unknown>>,
  updateVendorCollection: (id: string, data: {
    slug: string; title: string; subtitle?: string | null; description?: string | null;
    coverImageUrl?: string | null; sortOrder: number; startsUtc?: string | null; endsUtc?: string | null;
  }) => apiClient.put(`${BASE}/vendor/collections/${id}`, data, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  }) as unknown as Promise<Record<string, unknown>>,
  vendorProductAction: (id: string, action: 'publish' | 'archive' | 'ai-describe', data?: unknown) =>
    apiClient.post(`${BASE}/vendor/products/${id}/${action}`, data ?? {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  createVendorProduct: (data: {
    categoryId: string;
    name: string;
    shortDescription: string;
    longDescriptionMarkdown: string;
  }) =>
    apiClient.post(`${BASE}/vendor/products`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  updateVendorProduct: (
    id: string,
    operation:
      | 'step-1'
      | 'step-2'
      | 'step-3'
      | 'step-4'
      | 'details/basic'
      | 'details/pricing'
      | 'details/shipping'
      | 'images'
      | 'stock',
    data: unknown,
  ) =>
    apiClient.patch(`${BASE}/vendor/products/${id}/${operation}`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  updateVendorStock: (
    productId: string,
    data: {
      adjustments: { variantId: string; quantity: number }[];
      restockUtc?: string | null;
      alertCustomersOnRestock: boolean;
    },
  ) =>
    apiClient.patch(`${BASE}/vendor/products/${productId}/stock`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  createVendorStore: (data: {
    name: string;
    addressLine: string;
    city: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  }) =>
    apiClient.post(`${BASE}/vendor/stores`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  updateVendorStore: (
    id: string,
    data: {
      name: string;
      addressLine: string;
      city: string;
      phone?: string;
      latitude?: number;
      longitude?: number;
    },
  ) =>
    apiClient.put(`${BASE}/vendor/stores/${id}`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  createVendorCollection: (data: {
    kind: number;
    slug: string;
    title: string;
    subtitle?: string;
    description?: string;
    coverImageUrl?: string;
    sortOrder: number;
  }) =>
    apiClient.post(`${BASE}/vendor/collections`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorCollectionAction: (id: string, action: 'publish' | 'archive') =>
    apiClient.post(
      `${BASE}/vendor/collections/${id}/${action}`,
      {},
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  addVendorCollectionItem: (
    collectionId: string,
    data: { productId: string; note?: string; positionX?: number; positionY?: number },
  ) =>
    apiClient.post(`${BASE}/vendor/collections/${collectionId}/items`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  removeVendorCollectionItem: (collectionId: string, productId: string) =>
    apiClient.delete(`${BASE}/vendor/collections/${collectionId}/items/${productId}`, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  reorderVendorCollectionItems: (collectionId: string, productIds: string[]) =>
    apiClient.put(
      `${BASE}/vendor/collections/${collectionId}/items/order`,
      { productIds },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  revokeVendorCode: (code: string) =>
    apiClient.post(
      `${BASE}/vendor/codes/${encodeURIComponent(code)}/revoke`,
      {},
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<void>,
  createVendorCode: (data: {
    kind: 'ProductTag' | 'Store';
    productId?: string;
    storeId: string;
    label?: string;
  }) =>
    apiClient.post(`${BASE}/vendor/codes`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorCodeStats: (code: string) =>
    apiClient.get(`${BASE}/vendor/codes/${encodeURIComponent(code)}/stats`) as unknown as Promise<
      Record<string, unknown>
    >,
  bulkOrderAction: (action: 'accept' | 'ready-to-ship' | 'packing-slips', subOrderIds: string[]) =>
    apiClient.post(
      `${BASE}/orders/bulk/${action}`,
      { subOrderIds },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  sealVendorPackage: (trackingNumber: string, data: { sealId: string; sealPhotoUrl: string }) =>
    apiClient.post(`${BASE}/vendor/packages/${encodeURIComponent(trackingNumber)}/seal`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  inviteVendorTeamMember: (memberAccountId: string, role: number) =>
    apiClient.post(
      `${BASE}/vendor/team`,
      { memberAccountId, role },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  changeVendorTeamRole: (membershipId: string, newRole: number) =>
    apiClient.patch(
      `${BASE}/vendor/team/${membershipId}/role`,
      { newRole },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<void>,
  removeVendorTeamMember: (membershipId: string, reason: string) =>
    apiClient.delete(`${BASE}/vendor/team/${membershipId}`, {
      data: { reason },
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<void>,
  acceptVendorTeamInvitation: (membershipId: string) =>
    apiClient.post(`${BASE}/vendor/team/${membershipId}/accept`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorRecipeAction: (id: string, action: 'lock' | 'fork' | 'retire') =>
    apiClient.post(`${BASE}/vendor/recipes/${id}/${action}`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  createVendorRecipe: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE}/vendor/recipes`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorRecipe: (id: string) =>
    apiClient.get(`${BASE}/vendor/recipes/${id}`) as unknown as Promise<Record<string, unknown>>,
  updateVendorRecipe: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`${BASE}/vendor/recipes/${id}`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  vendorBriefRecipes: (briefId: string) =>
    apiClient.get(`${BASE}/vendor/briefs/${briefId}/recipes`) as unknown as Promise<unknown>,
  attachVendorBriefRecipe: (briefId: string, data: Record<string, unknown>) =>
    apiClient.post(`${BASE}/vendor/briefs/${briefId}/recipes`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  deleteVendorBriefRecipeVersion: (briefId: string, recipeId: string, recipeVersion: number) =>
    apiClient.delete(`${BASE}/vendor/briefs/${briefId}/recipes/${recipeId}/versions/${recipeVersion}`, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<void>,
  updateVendorProfile: (data: Record<string, unknown>) =>
    apiClient.patch(`${BASE}/vendor/profile`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  updateVendorPickup: (data: { enabled: boolean; addressLine?: string; city?: string }) =>
    apiClient.patch(`${BASE}/vendor/profile/pickup-location`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  uploadVendorMedia: (kind: 'logo' | 'cover', file: File) => {
    const data = new FormData();
    data.append('file', file);
    return apiClient.post(`${BASE}/vendor/media/${kind}`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID(), 'Content-Type': 'multipart/form-data' },
    }) as unknown as Promise<Record<string, unknown>>;
  },
  uploadVendorProductImage: (file: File) => {
    const data = new FormData();
    data.append('file', file);
    return apiClient.post(`${BASE}/vendor/products/images`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID(), 'Content-Type': 'multipart/form-data' },
    }) as unknown as Promise<Record<string, unknown>>;
  },
  archiveVendorStore: (id: string) =>
    apiClient.post(
      `${BASE}/vendor/stores/${id}/archive`,
      {},
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<void>,
  replyToVendorInquiry: (id: string, reply: string) =>
    apiClient.post(
      `${BASE}/vendor/inquiries/${id}/reply`,
      { reply },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  vendorWarrantyAction: (id: string, action: 'decision' | 'start' | 'resolve', data?: unknown) =>
    apiClient.post(`${BASE}/vendor/warranties/claims/${id}/${action}`, data ?? {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  upsertWarrantyPolicy: (variantId: string, data: { coverageDays: number; terms: string }) =>
    apiClient.put(`${BASE}/vendor/warranties/policies/${variantId}`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  returnAction: (id: string, action: 'accept' | 'complete' | 'reject', data?: unknown) =>
    apiClient.post(`${BASE}/vendor/returns/${id}/${action}`, data ?? {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  socialAccounts: () =>
    apiClient.get(`${BASE}/content/accounts`) as unknown as Promise<Record<string, unknown>[]>,
  socialAudienceSummary: () =>
    apiClient.get(`${BASE}/content/accounts/audience-summary`) as unknown as Promise<Record<string, unknown>>,
  connectSocial: (provider: string) =>
    apiClient.post(`${BASE}/content/accounts/${provider}/connect`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<{ url: string; expiresUtc: string }>,
  socialScopes: (provider: string) =>
    apiClient.get(`${BASE}/content/accounts/${provider}/scopes`) as unknown as Promise<Record<string, unknown>[]>,
  socialPublishScopes: (provider: string) =>
    apiClient.get(`${BASE}/content/accounts/${provider}/publish-scopes`) as unknown as Promise<Record<string, unknown>[]>,
  changeSocialPublishScope: (provider: string, action: 'grant' | 'revoke', reason?: string) =>
    apiClient.post(`${BASE}/content/accounts/${provider}/publish-scopes/${action}`,
      action === 'revoke' ? { reason: reason || 'Removed from Lead360.' } : {}, {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }) as unknown as Promise<Record<string, unknown>>,
  disconnectSocial: (provider: string, reason: string) =>
    apiClient.delete(`${BASE}/content/accounts/${provider}`, {
      data: { reason },
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<void>,
  socialContent: (provider: string) =>
    apiClient.get(`${BASE}/content/accounts/${provider}/items`, {
      params: { pageSize: 50 },
    }) as unknown as Promise<{
      items: SocialContentItem[];
      servedFromCache?: boolean;
      providerStatus?: unknown;
    }>,
  socialAccount: (provider: string) =>
    apiClient.get(`${BASE}/content/accounts/${provider}`) as unknown as Promise<Record<string, unknown>>,
  refreshSocial: (provider: string) =>
    apiClient.post(
      `${BASE}/content/accounts/${provider}/refresh`,
      {},
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<void>,
  importSocialContent: (data: {
    sourcePlatform: number;
    sourceUrl: string;
    externalId: string;
    durationSeconds: number;
    caption?: string | null;
    thumbnailCdnUrl?: string | null;
    videoCdnUrl?: string | null;
  }) =>
    apiClient.post(`${BASE}/content/reels/import`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  contentReels: () =>
    apiClient.get(`${BASE}/content/reels`, { params: { pageSize: 50 } }) as unknown as Promise<unknown>,
  contentReelAction: (id: string, action: 'publish' | 'unpublish') =>
    apiClient.post(
      `${BASE}/content/reels/${id}/${action}`,
      {},
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  updateContentCaption: (id: string, caption: string) =>
    apiClient.put(
      `${BASE}/content/reels/${id}/caption`,
      { caption },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<Record<string, unknown>>,
  publishJobs: () =>
    apiClient.get(`${BASE}/content/publish-jobs`, {
      params: { pageSize: 50 },
    }) as unknown as Promise<unknown>,
  publishJob: (id: string) =>
    apiClient.get(`${BASE}/content/publish-jobs/${id}`) as unknown as Promise<Record<string, unknown>>,
  schedulePublish: (data: {
    reelId: string;
    scheduledUtc: string;
    platforms: number[];
    baseCaption: string;
    productTitles: string[];
    intendedPostAtLocal: string;
    sourceVideoUrl?: string;
  }) =>
    apiClient.post(`${BASE}/content/publish-jobs`, data, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  cancelPublishJob: (id: string) =>
    apiClient.post(`${BASE}/content/publish-jobs/${id}/cancel`, {}, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }) as unknown as Promise<Record<string, unknown>>,
  customers: (params: { search?: string; status?: number; pageNumber?: number; pageSize?: number }) =>
    apiClient.get(`${BASE}/customers`, { params }) as unknown as Promise<{
      items: StylemintCustomer[];
      totalCount: number;
      pageNumber: number;
      pageSize: number;
    }>,
  suspendCustomer: (id: string, reason: string) =>
    apiClient.post(
      `${BASE}/customers/${id}/suspend`,
      { reason },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<void>,
  reinstateCustomer: (id: string) =>
    apiClient.post(
      `${BASE}/customers/${id}/reinstate`,
      {},
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    ) as unknown as Promise<void>,
};
