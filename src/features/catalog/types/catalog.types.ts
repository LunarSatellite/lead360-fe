import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// P2-019: Catalog — Types + Schemas
// ═══════════════════════════════════════════════════════════════

export interface SyncStatusDto {
  isConfigured: boolean;
  isEnabled: boolean;
  productCount: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  nextSyncAt: string | null;
}

export interface SyncConfigDto {
  productEndpointPath: string;
  paginationType: string;
  pageSize: number;
  dataArrayPath: string;
  fieldMappingsJson: string | null;
  syncIntervalMinutes: number;
  isEnabled: boolean;
}

export interface SyncLogDto {
  id: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  newProducts: number;
  updatedProducts: number;
  removedProducts: number;
  status: string;
}

export interface EnrichmentStatusDto {
  totalProducts: number;
  enrichedCount: number;
  pendingCount: number;
  failedCount: number;
  enrichmentPercent: number;
  totalTokensUsed: number;
}

export interface EmbeddingStatusDto {
  totalEnriched: number;
  embeddedCount: number;
  pendingCount: number;
  embeddingPercent: number;
  embeddingModel: string;
  dimensions: number;
}

export interface CacheStatsDto {
  totalKeywords: number;
  totalProductMappings: number;
  uniqueProducts: number;
  builtAt: string | null;
}

export interface SearchResultDto {
  products: SearchProductDto[];
  summary: string;
  complexity: string;
  metrics: { totalTimeMs: number; stagesExecuted?: string[] };
}

export interface SearchProductDto {
  product: Record<string, unknown>;
  enrichment: Record<string, unknown> | null;
  relevanceScore: number;
  reasoning: string;
  isRecommended: boolean;
  warning: string | null;
}

export interface CategoryDto {
  id: string;
  name: string;
  productCount: number;
}

// ─── Zod Schemas ───

export const syncConfigSchema = z.object({
  productEndpointPath: z.string().min(1, 'Endpoint path is required'),
  paginationType: z.enum(['page', 'offset', 'cursor', 'none']).default('page'),
  pageSize: z.number().int().min(1).max(500).default(50),
  dataArrayPath: z.string().default('data'),
  fieldMappingsJson: z.string().optional().or(z.literal('')),
  syncIntervalMinutes: z.number().int().min(60).default(360),
  isEnabled: z.boolean().default(true),
});
export type SyncConfigFormData = z.infer<typeof syncConfigSchema>;

export const searchSchema = z.object({
  customerMessage: z.string().min(1, 'Enter a search message'),
  maxResults: z.number().int().min(1).max(20).default(5),
});
export type SearchFormData = z.infer<typeof searchSchema>;

// ─── Pipeline step status ───

export type PipelineStepStatus = 'done' | 'in-progress' | 'not-started';

export interface PipelineStepInfo {
  label: string;
  status: PipelineStepStatus;
  detail: string;
}
