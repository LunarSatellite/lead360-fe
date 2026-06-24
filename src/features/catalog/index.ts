export {
  useSyncStatus, useSyncConfig, useSyncLogs, useUpdateSyncConfig, useTriggerSync,
  useEnrichmentStatus, useEnrichAll,
  useEmbeddingStatus, useEmbedAll,
  useCacheStats, useBuildCache,
  useProductSearch, catalogKeys,
} from './api/catalog.queries';

export type { SyncStatusDto, EnrichmentStatusDto, EmbeddingStatusDto, CacheStatsDto, SearchResultDto } from './types/catalog.types';
