// ═══════════════════════════════════════════════════════════════
// API Specs — TanStack Query Hooks + Keys
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiSpecsApi } from './api-specs.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type { ApiSpecUploadRequest } from '../types/api-specs.types';

// ─── Query Keys ───

export const apiSpecKeys = {
  all: ['api-specs'] as const,
  lists: () => [...apiSpecKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...apiSpecKeys.lists(), filters] as const,
  details: () => [...apiSpecKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiSpecKeys.details(), id] as const,
  endpoints: (id: string) => [...apiSpecKeys.all, 'endpoints', id] as const,
  allEndpoints: () => [...apiSpecKeys.all, 'all-endpoints'] as const,
} as const;

// ─── Queries ───

export function useApiSpecs() {
  return useQuery({
    queryKey: apiSpecKeys.lists(),
    queryFn: () => apiSpecsApi.getAll(),
  });
}

export function useApiSpecDetail(id: string | undefined) {
  return useQuery({
    queryKey: apiSpecKeys.detail(id!),
    queryFn: () => apiSpecsApi.getById(id!),
    enabled: !!id,
  });
}

export function useApiSpecEndpoints(id: string | undefined) {
  return useQuery({
    queryKey: apiSpecKeys.endpoints(id!),
    queryFn: () => apiSpecsApi.getEndpoints(id!),
    enabled: !!id,
  });
}

export function useAllEndpoints() {
  return useQuery({
    queryKey: apiSpecKeys.allEndpoints(),
    queryFn: () => apiSpecsApi.getAllEndpoints(),
  });
}

// ─── Mutations ───

export function useUploadApiSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApiSpecUploadRequest) => apiSpecsApi.upload(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: apiSpecKeys.lists() });
      const res = result as any;
      const count = res?.endpoints?.length ?? res?.endpointCount ?? 0;
      toast.success(`Uploaded and parsed ${count} endpoint${count !== 1 ? 's' : ''}`);
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to upload spec.'),
  });
}

export function useUploadApiSpecFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => apiSpecsApi.uploadFile(formData),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: apiSpecKeys.lists() });
      const res = result as any;
      const count = res?.endpoints?.length ?? res?.endpointCount ?? 0;
      toast.success(`Uploaded and parsed ${count} endpoint${count !== 1 ? 's' : ''}`);
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to upload spec file.'),
  });
}

export function useReparseApiSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiSpecsApi.reparse(id),
    onSuccess: (_result, id) => {
      qc.invalidateQueries({ queryKey: apiSpecKeys.detail(id) });
      qc.invalidateQueries({ queryKey: apiSpecKeys.lists() });
      toast.success('Spec re-parsed successfully.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to re-parse spec.'),
  });
}

export function useDeleteApiSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiSpecsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: apiSpecKeys.lists() });
      toast.success('Spec deleted.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to delete spec.'),
  });
}
