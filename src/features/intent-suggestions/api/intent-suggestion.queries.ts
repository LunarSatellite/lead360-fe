import { apiClient } from '@/shared/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type { SuggestionBatchDto, ApproveRequest, RejectRequest } from '../types/intent-suggestion.types';

// ─── API ───

export const suggestionApi = {
  generate: (specId: string) =>
    apiClient.post<SuggestionBatchDto>(`/v1/intent-suggestions/${specId}/generate`),
  getAll: (specId: string) =>
    apiClient.get<SuggestionBatchDto>(`/v1/intent-suggestions/${specId}`),
  approve: (id: string, body?: ApproveRequest) =>
    apiClient.post<void>(`/v1/intent-suggestions/${id}/approve`, body || {}),
  approveAll: (specId: string) =>
    apiClient.post<void>(`/v1/intent-suggestions/${specId}/approve-all`),
  reject: (id: string, body?: RejectRequest) =>
    apiClient.post<void>(`/v1/intent-suggestions/${id}/reject`, body || {}),
  regenerate: (specId: string) =>
    apiClient.post<SuggestionBatchDto>(`/v1/intent-suggestions/${specId}/regenerate`),
} as const;

// ─── Keys ───

export const suggestionKeys = {
  all: ['suggestions'] as const,
  list: (specId: string) => [...suggestionKeys.all, specId] as const,
} as const;

// ─── Queries ───

export function useSuggestions(specId: string | undefined) {
  return useQuery({
    queryKey: suggestionKeys.list(specId!),
    queryFn: () => suggestionApi.getAll(specId!),
    enabled: !!specId,
  });
}

// ─── Mutations ───

export function useGenerateSuggestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (specId: string) => suggestionApi.generate(specId),
    onSuccess: (_r, specId) => {
      qc.invalidateQueries({ queryKey: suggestionKeys.list(specId) });
      toast.success('Suggestions generated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Generation failed'),
  });
}

export function useRegenerateSuggestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (specId: string) => suggestionApi.regenerate(specId),
    onSuccess: (_r, specId) => {
      qc.invalidateQueries({ queryKey: suggestionKeys.list(specId) });
      toast.success('Suggestions regenerated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Regeneration failed'),
  });
}

export function useApproveSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: ApproveRequest }) => suggestionApi.approve(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: suggestionKeys.all });
      toast.success('Intent approved');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Approve failed'),
  });
}

export function useApproveAllSuggestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (specId: string) => suggestionApi.approveAll(specId),
    onSuccess: (_r, specId) => {
      qc.invalidateQueries({ queryKey: suggestionKeys.list(specId) });
      qc.invalidateQueries({ queryKey: ['intents'] });
      toast.success('All suggestions approved — intents created');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Approve all failed'),
  });
}

export function useRejectSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: RejectRequest }) => suggestionApi.reject(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: suggestionKeys.all });
      toast.success('Suggestion rejected');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Reject failed'),
  });
}
