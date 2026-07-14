// ═══════════════════════════════════════════════════════════════
// Business Catalog Feature — API Functions
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  BusinessProfile,
  BusinessProfileUpsertRequest,
  BusinessTypeValue,
  CatalogCategory,
  CatalogCategoryCreateRequest,
  CatalogCategoryUpdateRequest,
  CatalogItem,
  CatalogItemCreateRequest,
  CatalogItemFilter,
  CatalogItemUpdateRequest,
  PagedResult,
  TransactionFilter,
  TransactionManualCreateRequest,
  TransactionNotifyRequest,
  TransactionStatusUpdateRequest,
  TransactionSummary,
  BusinessTransaction,
} from '../types/business-catalog.types';

// ─── BusinessProfile ───

export const businessProfileApi = {
  get: () => apiClient.get<BusinessProfile>('/v1/business-profile'),
  upsert: (data: BusinessProfileUpsertRequest) =>
    apiClient.put<BusinessProfile>('/v1/business-profile', data),
  getDefaults: (type: BusinessTypeValue) =>
    apiClient.get<BusinessProfileUpsertRequest>(`/v1/business-profile/defaults/${type}`),
} as const;

// ─── Category ───

export const categoryApi = {
  getAll: (activeOnly: boolean = false) =>
    apiClient.get<CatalogCategory[]>('/v1/business-catalog/categories', { params: { activeOnly } }),
  getById: (id: string) =>
    apiClient.get<CatalogCategory>(`/v1/business-catalog/categories/${id}`),
  create: (data: CatalogCategoryCreateRequest) =>
    apiClient.post<CatalogCategory>('/v1/business-catalog/categories', data),
  update: (id: string, data: CatalogCategoryUpdateRequest) =>
    apiClient.put<CatalogCategory>(`/v1/business-catalog/categories/${id}`, data),
  delete: (id: string) =>
    apiClient.delete<void>(`/v1/business-catalog/categories/${id}`),
} as const;

// ─── Item ───

export const itemApi = {
  getPaged: (filter: CatalogItemFilter) =>
    apiClient.get<PagedResult<CatalogItem>>('/v1/business-catalog/items', {
      params: {
        categoryId: filter.categoryId ?? undefined,
        search: filter.search ?? undefined,
        isAvailable: filter.isAvailable ?? undefined,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      },
    }),
  getById: (id: string) => apiClient.get<CatalogItem>(`/v1/business-catalog/items/${id}`),
  create: (data: CatalogItemCreateRequest) =>
    apiClient.post<CatalogItem>('/v1/business-catalog/items', data),
  update: (id: string, data: CatalogItemUpdateRequest) =>
    apiClient.put<CatalogItem>(`/v1/business-catalog/items/${id}`, data),
  toggleAvailability: (id: string, available: boolean) =>
    apiClient.patch<void>(`/v1/business-catalog/items/${id}/availability`, undefined, {
      params: { available },
    }),
  delete: (id: string) => apiClient.delete<void>(`/v1/business-catalog/items/${id}`),
} as const;

// ─── Transaction ───

export const transactionApi = {
  getPaged: (filter: TransactionFilter) =>
    apiClient.get<PagedResult<TransactionSummary>>('/v1/business-catalog/transactions', {
      params: {
        status: filter.status ?? undefined,
        source: filter.source ?? undefined,
        createdFrom: filter.createdFrom ?? undefined,
        createdTo: filter.createdTo ?? undefined,
        search: filter.search ?? undefined,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      },
    }),
  getById: (id: string) =>
    apiClient.get<BusinessTransaction>(`/v1/business-catalog/transactions/${id}`),
  createManual: (data: TransactionManualCreateRequest) =>
    apiClient.post<BusinessTransaction>('/v1/business-catalog/transactions', data),
  updateStatus: (id: string, data: TransactionStatusUpdateRequest) =>
    apiClient.post<BusinessTransaction>(`/v1/business-catalog/transactions/${id}/status`, data),
  notify: (id: string, data: TransactionNotifyRequest) =>
    apiClient.post<BusinessTransaction>(`/v1/business-catalog/transactions/${id}/notify`, data),
} as const;
