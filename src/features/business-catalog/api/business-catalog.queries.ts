// ═══════════════════════════════════════════════════════════════
// Business Catalog Feature — TanStack Query Hooks + Keys
// ═══════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  businessProfileApi,
  categoryApi,
  itemApi,
  transactionApi,
} from './business-catalog.api';
import type {
  BusinessProfileUpsertRequest,
  BusinessTypeValue,
  CatalogCategoryCreateRequest,
  CatalogCategoryUpdateRequest,
  CatalogItemCreateRequest,
  CatalogItemFilter,
  CatalogItemUpdateRequest,
  TransactionFilter,
  TransactionManualCreateRequest,
  TransactionNotifyRequest,
  TransactionStatusUpdateRequest,
} from '../types/business-catalog.types';

// ─── Query Keys ───

export const businessCatalogKeys = {
  all: ['business-catalog'] as const,
  profile: () => [...businessCatalogKeys.all, 'profile'] as const,
  profileDefaults: (type: BusinessTypeValue) =>
    [...businessCatalogKeys.all, 'profile-defaults', type] as const,

  categories: () => [...businessCatalogKeys.all, 'categories'] as const,
  categoryList: (activeOnly: boolean) =>
    [...businessCatalogKeys.categories(), 'list', activeOnly] as const,
  categoryDetail: (id: string) => [...businessCatalogKeys.categories(), 'detail', id] as const,

  items: () => [...businessCatalogKeys.all, 'items'] as const,
  itemList: (filter: CatalogItemFilter) => [...businessCatalogKeys.items(), 'list', filter] as const,
  itemDetail: (id: string) => [...businessCatalogKeys.items(), 'detail', id] as const,

  transactions: () => [...businessCatalogKeys.all, 'transactions'] as const,
  transactionList: (filter: TransactionFilter) =>
    [...businessCatalogKeys.transactions(), 'list', filter] as const,
  transactionDetail: (id: string) =>
    [...businessCatalogKeys.transactions(), 'detail', id] as const,
} as const;

// ═══════════════════════════════════════════════════════════════
// BusinessProfile
// ═══════════════════════════════════════════════════════════════

export function useBusinessProfile() {
  return useQuery({
    queryKey: businessCatalogKeys.profile(),
    queryFn: () => businessProfileApi.get(),
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useUpsertBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BusinessProfileUpsertRequest) => businessProfileApi.upsert(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.profile() });
      toast.success('Business profile saved');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to save business profile'),
  });
}

export function useBusinessProfileDefaults(type: BusinessTypeValue | undefined) {
  return useQuery({
    queryKey: type !== undefined ? businessCatalogKeys.profileDefaults(type) : ['no-defaults'],
    queryFn: () => businessProfileApi.getDefaults(type!),
    enabled: type !== undefined,
    staleTime: 10 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════════════════════

export function useCategories(activeOnly: boolean = false) {
  return useQuery({
    queryKey: businessCatalogKeys.categoryList(activeOnly),
    queryFn: () => categoryApi.getAll(activeOnly),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CatalogCategoryCreateRequest) => categoryApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.categories() });
      toast.success('Category created');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to create category'),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CatalogCategoryUpdateRequest }) =>
      categoryApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.categories() });
      toast.success('Category updated');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update category'),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.categories() });
      toast.success('Category deleted');
    },
    onError: (err: any) => {
      if (err?.status === 409) toast.error(err?.message ?? 'Category still has items or sub-categories');
      else toast.error(err?.message ?? 'Failed to delete category');
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// Items
// ═══════════════════════════════════════════════════════════════

export function useItems(filter: CatalogItemFilter) {
  return useQuery({
    queryKey: businessCatalogKeys.itemList(filter),
    queryFn: () => itemApi.getPaged(filter),
    placeholderData: (prev) => prev,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CatalogItemCreateRequest) => itemApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.items() });
      qc.invalidateQueries({ queryKey: businessCatalogKeys.categories() });
      toast.success('Item added');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to add item'),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CatalogItemUpdateRequest }) =>
      itemApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.items() });
      toast.success('Item updated');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update item'),
  });
}

export function useToggleItemAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      itemApi.toggleAvailability(id, available),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.items() });
      toast.success(vars.available ? 'Item marked available' : 'Item marked unavailable');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update availability'),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.items() });
      qc.invalidateQueries({ queryKey: businessCatalogKeys.categories() });
      toast.success('Item deleted');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to delete item'),
  });
}

// ═══════════════════════════════════════════════════════════════
// Transactions
// ═══════════════════════════════════════════════════════════════

export function useTransactions(filter: TransactionFilter) {
  return useQuery({
    queryKey: businessCatalogKeys.transactionList(filter),
    queryFn: () => transactionApi.getPaged(filter),
    placeholderData: (prev) => prev,
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: id ? businessCatalogKeys.transactionDetail(id) : ['no-tx'],
    queryFn: () => transactionApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateManualTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionManualCreateRequest) => transactionApi.createManual(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.transactions() });
      toast.success('Transaction captured');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to capture transaction'),
  });
}

export function useUpdateTransactionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionStatusUpdateRequest }) =>
      transactionApi.updateStatus(id, data),
    onSuccess: (data: any, vars) => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.transactions() });
      qc.invalidateQueries({ queryKey: businessCatalogKeys.transactionDetail(vars.id) });
      // notificationSent is null/undefined when no notification was applicable for this status
      // (e.g. Cancel) — only true/false (an actual attempt) should produce a send-related toast.
      if (data?.notificationSent === true) {
        toast.success('Status updated — customer notified');
      } else if (data?.notificationSent === false) {
        toast.warning('Status updated, but the customer notification failed to send');
      } else {
        toast.success('Status updated');
      }
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update status'),
  });
}

export function useNotifyTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionNotifyRequest }) =>
      transactionApi.notify(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: businessCatalogKeys.transactionDetail(vars.id) });
      toast.success('Customer notified');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to notify customer'),
  });
}
