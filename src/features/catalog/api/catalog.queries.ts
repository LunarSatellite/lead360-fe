import { apiClient } from '@/shared/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type {
  SyncStatusDto, SyncConfigDto, SyncLogDto, EnrichmentStatusDto,
  EmbeddingStatusDto, CacheStatsDto, SearchResultDto, CategoryDto,
} from '../types/catalog.types';

// ─── API ───

export const catalogApi = {
  getConfig: () => apiClient.get<SyncConfigDto>('/v1/catalog/config'),
  updateConfig: (data: SyncConfigDto) => apiClient.put<SyncConfigDto>('/v1/catalog/config', data),
  triggerSync: () => apiClient.post<void>('/v1/catalog/sync'),
  getStatus: () => apiClient.get<SyncStatusDto>('/v1/catalog/status'),
  getLogs: () => apiClient.get<SyncLogDto[]>('/v1/catalog/logs'),
  getCategories: () => apiClient.get<CategoryDto[]>('/v1/catalog/categories'),
  keywordSearch: (query: string) => apiClient.post<unknown>('/v1/catalog/search', { query }),

  getEnrichmentStatus: () => apiClient.get<EnrichmentStatusDto>('/v1/catalog/enrichment/status'),
  enrichAll: () => apiClient.post<void>('/v1/catalog/enrichment/all'),

  getEmbeddingStatus: () => apiClient.get<EmbeddingStatusDto>('/v1/catalog/embeddings/status'),
  embedAll: () => apiClient.post<void>('/v1/catalog/embeddings/all'),

  buildCache: () => apiClient.post<void>('/v1/catalog/keyword-cache/build'),
  getCacheStats: () => apiClient.get<CacheStatsDto>('/v1/catalog/keyword-cache/stats'),

  productSearch: (body: { customerMessage: string; maxResults: number }) =>
    apiClient.post<SearchResultDto>('/v1/product-search', body),
} as const;

// ─── Keys ───

export const catalogKeys = {
  all: ['catalog'] as const,
  status: () => [...catalogKeys.all, 'status'] as const,
  config: () => [...catalogKeys.all, 'config'] as const,
  logs: () => [...catalogKeys.all, 'logs'] as const,
  enrichment: () => [...catalogKeys.all, 'enrichment'] as const,
  embedding: () => [...catalogKeys.all, 'embedding'] as const,
  cache: () => [...catalogKeys.all, 'cache'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
} as const;

// ─── Queries ───

export function useSyncStatus() {
  return useQuery({ queryKey: catalogKeys.status(), queryFn: catalogApi.getStatus, retry: false });
}

export function useSyncConfig() {
  return useQuery({ queryKey: catalogKeys.config(), queryFn: catalogApi.getConfig, retry: false });
}

export function useSyncLogs() {
  return useQuery({ queryKey: catalogKeys.logs(), queryFn: catalogApi.getLogs, retry: false });
}

export function useEnrichmentStatus() {
  return useQuery({ queryKey: catalogKeys.enrichment(), queryFn: catalogApi.getEnrichmentStatus, retry: false });
}

export function useEmbeddingStatus() {
  return useQuery({ queryKey: catalogKeys.embedding(), queryFn: catalogApi.getEmbeddingStatus, retry: false });
}

export function useCacheStats() {
  return useQuery({ queryKey: catalogKeys.cache(), queryFn: catalogApi.getCacheStats, retry: false });
}

export function useCategories() {
  return useQuery({ queryKey: catalogKeys.categories(), queryFn: catalogApi.getCategories, retry: false });
}

// ─── Mutations ───

export function useUpdateSyncConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SyncConfigDto) => catalogApi.updateConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.config() }); toast.success('Config saved'); },
    onError: (err: ApiError) => toast.error(err.message || 'Save failed'),
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => catalogApi.triggerSync(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: catalogKeys.status() });
      qc.invalidateQueries({ queryKey: catalogKeys.logs() });
      toast.success('Sync triggered');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Sync failed'),
  });
}

export function useEnrichAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => catalogApi.enrichAll(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.enrichment() }); toast.success('Enrichment started'); },
    onError: (err: ApiError) => toast.error(err.message || 'Enrichment failed'),
  });
}

export function useEmbedAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => catalogApi.embedAll(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.embedding() }); toast.success('Embedding started'); },
    onError: (err: ApiError) => toast.error(err.message || 'Embedding failed'),
  });
}

export function useBuildCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => catalogApi.buildCache(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: catalogKeys.cache() }); toast.success('Cache built'); },
    onError: (err: ApiError) => toast.error(err.message || 'Cache build failed'),
  });
}

export function useProductSearch() {
  return useMutation({
    mutationFn: (body: { customerMessage: string; maxResults: number }) => catalogApi.productSearch(body),
    onError: (err: ApiError) => toast.error(err.message || 'Search failed'),
  });
}

// ─── Catalog API (additional endpoints) ───

export const catalogApiExtra = {
  getProduct: (externalId: string) =>
    apiClient.get<unknown>(`/v1/catalog/products/${externalId}`),
  enrichBatch: (batchSize = 10) =>
    apiClient.post<number>(`/v1/catalog/enrichment/batch?batchSize=${batchSize}`),
  enrichProduct: (productId: string) =>
    apiClient.post<unknown>(`/v1/catalog/enrichment/product/${productId}`),
  getEnrichedProduct: (externalId: string) =>
    apiClient.get<unknown>(`/v1/catalog/enrichment/product/${externalId}`),
  generateEmbeddingsBatch: (batchSize = 20) =>
    apiClient.post<number>(`/v1/catalog/embeddings/batch?batchSize=${batchSize}`),
  generateSingleEmbedding: (enrichmentId: string) =>
    apiClient.post<boolean>(`/v1/catalog/embeddings/${enrichmentId}`),
  vectorSearch: (data: { query: string; limit?: number }) =>
    apiClient.post<unknown>('/v1/catalog/embeddings/search', data),
  keywordLookup: (q: string, limit = 10) =>
    apiClient.get<unknown>(`/v1/catalog/keyword-cache/lookup?q=${encodeURIComponent(q)}&limit=${limit}`),
  clearKeywordCache: () =>
    apiClient.delete<boolean>('/v1/catalog/keyword-cache'),
  productSearch: (data: { customerMessage: string; conversationHistory?: string[]; sessionId?: string; maxResults?: number; forceComplexity?: string }) =>
    apiClient.post<unknown>('/v1/product-search', data),
} as const;

// ─── Additional Query Hooks ───

export function useProduct(externalId: string | undefined) {
  return useQuery({
    queryKey: ['catalog', 'product', externalId],
    queryFn: () => catalogApiExtra.getProduct(externalId!),
    enabled: !!externalId,
  });
}

export function useEnrichBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchSize?: number) => catalogApiExtra.enrichBatch(batchSize),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog'] }); toast.success('Batch enriched'); },
    onError: (e: ApiError) => toast.error(e.message || 'Enrichment failed'),
  });
}

export function useGenerateEmbeddingsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchSize?: number) => catalogApiExtra.generateEmbeddingsBatch(batchSize),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog'] }); toast.success('Embeddings generated'); },
    onError: (e: ApiError) => toast.error(e.message || 'Embedding generation failed'),
  });
}

export function useVectorSearch() {
  return useMutation({
    mutationFn: (data: { query: string; limit?: number }) => catalogApiExtra.vectorSearch(data),
    onError: (e: ApiError) => toast.error(e.message || 'Vector search failed'),
  });
}

export function useKeywordLookup() {
  return useMutation({
    mutationFn: ({ q, limit }: { q: string; limit?: number }) => catalogApiExtra.keywordLookup(q, limit),
    onError: (e: ApiError) => toast.error(e.message || 'Lookup failed'),
  });
}

export function useProductSearchExtra() {
  return useMutation({
    mutationFn: (data: { customerMessage: string; maxResults?: number; forceComplexity?: string }) => catalogApiExtra.productSearch(data),
    onError: (e: ApiError) => toast.error(e.message || 'Product search failed'),
  });
}
