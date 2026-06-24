import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specApi, capabilityApi, analysisApi, executorApi } from './api-connection.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type { SpecUploadRequest } from '../types/api-connection.types';

// ─── Query Keys ───

export const specKeys = {
  all: ['specs'] as const,
  list: () => [...specKeys.all, 'list'] as const,
  detail: (id: string) => [...specKeys.all, id] as const,
  endpoints: (id: string) => [...specKeys.all, id, 'endpoints'] as const,
} as const;

export const capabilityKeys = {
  all: ['capability'] as const,
  map: (specId: string) => [...capabilityKeys.all, specId] as const,
  summary: (specId: string) => [...capabilityKeys.all, specId, 'summary'] as const,
} as const;

export const analysisKeys = {
  all: ['analysis'] as const,
  detail: (specId: string) => [...analysisKeys.all, specId] as const,
  readiness: (specId: string) => [...analysisKeys.all, specId, 'readiness'] as const,
} as const;

export const executorKeys = {
  health: ['executor', 'health'] as const,
} as const;

// ─── Spec Queries ───

export function useSpecs() {
  return useQuery({
    queryKey: specKeys.list(),
    queryFn: () => specApi.getAll(),
  });
}

export function useSpec(id: string | undefined) {
  return useQuery({
    queryKey: specKeys.detail(id!),
    queryFn: () => specApi.getById(id!),
    enabled: !!id,
  });
}

export function useEndpoints(specId: string | undefined) {
  return useQuery({
    queryKey: specKeys.endpoints(specId!),
    queryFn: () => specApi.getEndpoints(specId!),
    enabled: !!specId,
  });
}

export function useUploadSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SpecUploadRequest) => specApi.upload(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: specKeys.list() });
      const r = res as any;
      toast.success(`Uploaded and parsed ${r?.endpointCount ?? 0} endpoints`);
    },
    onError: (err: ApiError) => toast.error(err.message || 'Upload failed'),
  });
}

export function useDeleteSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => specApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: specKeys.list() });
      toast.success('Spec deleted');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Delete failed'),
  });
}

// ─── Capability Queries ───

export function useCapabilityMap(specId: string | undefined) {
  return useQuery({
    queryKey: capabilityKeys.map(specId!),
    queryFn: () => capabilityApi.get(specId!),
    enabled: !!specId,
    retry: false,
  });
}

export function useCapabilitySummary(specId: string | undefined) {
  return useQuery({
    queryKey: capabilityKeys.summary(specId!),
    queryFn: () => capabilityApi.getSummary(specId!),
    enabled: !!specId,
    retry: false,
  });
}

export function useGenerateCapabilityMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (specId: string) => capabilityApi.generate(specId),
    onSuccess: (_res, specId) => {
      qc.invalidateQueries({ queryKey: capabilityKeys.map(specId) });
      qc.invalidateQueries({ queryKey: capabilityKeys.summary(specId) });
      toast.success('Capability map generated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Generation failed'),
  });
}

// ─── Analysis Queries ───

export function useAnalysis(specId: string | undefined) {
  return useQuery({
    queryKey: analysisKeys.detail(specId!),
    queryFn: () => analysisApi.get(specId!),
    enabled: !!specId,
    retry: false,
  });
}

export function useReadiness(specId: string | undefined) {
  return useQuery({
    queryKey: analysisKeys.readiness(specId!),
    queryFn: () => analysisApi.getReadiness(specId!),
    enabled: !!specId,
    retry: false,
  });
}

export function useRunAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (specId: string) => analysisApi.analyze(specId),
    onSuccess: (_res, specId) => {
      qc.invalidateQueries({ queryKey: analysisKeys.detail(specId) });
      qc.invalidateQueries({ queryKey: analysisKeys.readiness(specId) });
      toast.success('Analysis complete');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Analysis failed'),
  });
}

export function useSubmitAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ analysisId, answers }: { analysisId: string; answers: { questionId: string; answer: string }[] }) =>
      analysisApi.submitAnswers(analysisId, answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analysisKeys.all });
      toast.success('Answers submitted');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Submit failed'),
  });
}

// ─── Executor Queries ───

export function useApiHealth() {
  return useQuery({
    queryKey: executorKeys.health,
    queryFn: () => executorApi.health(),
    retry: false,
    refetchInterval: 30_000,
  });
}

export function useTestEndpoint() {
  return useMutation({
    mutationFn: ({ endpointId, params }: { endpointId: string; params: Record<string, string> }) =>
      executorApi.test(endpointId, params),
    onError: (err: ApiError) => toast.error(err.message || 'Test failed'),
  });
}
