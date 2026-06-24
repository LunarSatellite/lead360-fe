// ═══════════════════════════════════════════════════════════════
// Intents Feature — TanStack Query Hooks + Keys
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intentApi, intentsApiExtra } from './intents.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import { QUERY_KEYS } from '@/shared/config/query-keys';
import type { IntentCreateRequest, IntentUpdateRequest } from '../types/intents.types';

// ─── Query Keys ───

export const intentKeys = {
  all: QUERY_KEYS.intents,
  lists: () => [...intentKeys.all, 'list'] as const,
  listByTenant: (tenantId: string) => [...intentKeys.lists(), tenantId] as const,
  tree: (tenantId: string) => [...intentKeys.all, 'tree', tenantId] as const,
  detail: (id: string) => [...intentKeys.all, 'detail', id] as const,
} as const;

// ─── Queries ───

export function useIntents(tenantId: string) {
  return useQuery({
    queryKey: intentKeys.listByTenant(tenantId),
    queryFn: () => intentApi.getByTenant(tenantId),
    enabled: !!tenantId,
  });
}

export function useIntentTree(tenantId: string) {
  return useQuery({
    queryKey: intentKeys.tree(tenantId),
    queryFn: () => intentApi.getTree(tenantId),
    enabled: !!tenantId,
  });
}

export function useIntent(id: string | undefined) {
  return useQuery({
    queryKey: intentKeys.detail(id!),
    queryFn: () => intentApi.getById(id!),
    enabled: !!id,
  });
}

// ─── Mutations ───

export function useCreateIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IntentCreateRequest) => intentApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intentKeys.all });
      toast.success('Intent created successfully.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to create intent.'),
  });
}

export function useUpdateIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IntentUpdateRequest }) =>
      intentApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intentKeys.all });
      toast.success('Intent updated successfully.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to update intent.'),
  });
}

export function useDeleteIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intentApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intentKeys.all });
      toast.success('Intent deleted.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to delete intent.'),
  });
}

export function useBulkImportIntents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, intents }: { tenantId: string; intents: IntentCreateRequest[] }) =>
      intentApi.bulkImport(tenantId, intents),
    onSuccess: (_data) => {
      qc.invalidateQueries({ queryKey: intentKeys.all });
      toast.success('Intents imported successfully.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to import intents.'),
  });
}

export function useToggleIntentActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      intentApi.update(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intentKeys.all });
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to toggle intent.'),
  });
}

// ─── Additional Intent Hooks ───

export function useIntentRoots(tenantId: string | undefined) {
  return useQuery({
    queryKey: [...intentKeys.all, 'roots', tenantId],
    queryFn: () => intentsApiExtra.getRoots(tenantId!),
    enabled: !!tenantId,
  });
}

export function useUnmappedIntents(tenantId: string | undefined) {
  return useQuery({
    queryKey: [...intentKeys.all, 'unmapped', tenantId],
    queryFn: () => intentsApiExtra.getUnmapped(tenantId!),
    enabled: !!tenantId,
  });
}

export function useIntentBreadcrumb(id: string | undefined) {
  return useQuery({
    queryKey: [...intentKeys.all, 'breadcrumb', id],
    queryFn: () => intentsApiExtra.getBreadcrumb(id!),
    enabled: !!id,
  });
}

export function useIntentChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: [...intentKeys.all, 'children', parentId],
    queryFn: () => intentsApiExtra.getChildren(parentId!),
    enabled: !!parentId,
  });
}

export function useActivateIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intentsApiExtra.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intentKeys.all });
      toast.success('Intent activated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Activation failed'),
  });
}

export function useDeactivateIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intentsApiExtra.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: intentKeys.all });
      toast.success('Intent deactivated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Deactivation failed'),
  });
}
