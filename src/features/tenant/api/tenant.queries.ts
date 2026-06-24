// ═══════════════════════════════════════════════════════════════
// Tenant Feature — TanStack Query Hooks
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from './tenant.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type { TenantCreateRequest, TenantUpdateRequest, TenantStatusValue, ApiHealthStatusValue } from '../types/tenant.types';

export const tenantKeys = {
  all: ['tenants'] as const,
  list: () => [...tenantKeys.all, 'list'] as const,
  active: () => [...tenantKeys.all, 'active'] as const,
  byStatus: (s: TenantStatusValue) => [...tenantKeys.all, 'by-status', s] as const,
  detail: (id: string) => [...tenantKeys.all, id] as const,
  stats: () => [...tenantKeys.all, 'stats'] as const,
  tokenBudget: (id: string) => [...tenantKeys.all, id, 'token-budget'] as const,
} as const;

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.list(),
    queryFn: () => tenantApi.getAll(),
  });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: tenantKeys.detail(id!),
    queryFn: () => tenantApi.getById(id!),
    enabled: !!id,
  });
}

export function useActiveTenants() {
  return useQuery({
    queryKey: tenantKeys.active(),
    queryFn: () => tenantApi.getActive(),
  });
}

export function useTenantsByStatus(status: TenantStatusValue) {
  return useQuery({
    queryKey: tenantKeys.byStatus(status),
    queryFn: () => tenantApi.getByStatus(status),
  });
}

export function useTenantStatsByStatus() {
  return useQuery({
    queryKey: tenantKeys.stats(),
    queryFn: () => tenantApi.getStatsByStatus(),
  });
}

export function useTenantTokenBudget(tenantId: string | undefined) {
  return useQuery({
    queryKey: tenantKeys.tokenBudget(tenantId!),
    queryFn: () => tenantApi.checkTokenBudget(tenantId!),
    enabled: !!tenantId,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantCreateRequest) => tenantApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success('Tenant created');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Create failed'),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantUpdateRequest }) => tenantApi.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.list() });
      toast.success('Tenant updated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Update failed'),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success('Tenant deactivated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Delete failed'),
  });
}

export function useUpdateApiHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, status }: { tenantId: string; status: ApiHealthStatusValue }) =>
      tenantApi.updateApiHealth(tenantId, status),
    onSuccess: (_res, { tenantId }) => {
      qc.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) });
      toast.success('API health updated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Update failed'),
  });
}
