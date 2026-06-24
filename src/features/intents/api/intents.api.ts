// ═══════════════════════════════════════════════════════════════
// Intents Feature — API Functions (matches Swagger spec)
// Source: /api/v1/intents/*
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  IntentDto,
  IntentCreateRequest,
  IntentUpdateRequest,
} from '../types/intents.types';

export const intentApi = {
  // GET /api/v1/intents/tenant/{tenantId} → IntentDto[] (flat list)
  getByTenant: (tenantId: string) =>
    apiClient.get<IntentDto[]>(`/v1/intents/tenant/${tenantId}`),

  // GET /api/v1/intents/tenant/{tenantId}/tree → IntentDto[] (hierarchical)
  getTree: (tenantId: string) =>
    apiClient.get<IntentDto[]>(`/v1/intents/tenant/${tenantId}/tree`),

  // GET /api/v1/intents/{id} → IntentDto
  getById: (id: string) =>
    apiClient.get<IntentDto>(`/v1/intents/${id}`),

  // POST /api/v1/intents → IntentDto (201)
  create: (data: IntentCreateRequest) =>
    apiClient.post<IntentDto>('/v1/intents', data),

  // PUT /api/v1/intents/{id} → IntentDto
  update: (id: string, data: IntentUpdateRequest) =>
    apiClient.put<IntentDto>(`/v1/intents/${id}`, data),

  // DELETE /api/v1/intents/{id} → void
  delete: (id: string) =>
    apiClient.delete<void>(`/v1/intents/${id}`),

  // POST /api/v1/intents/tenant/{tenantId}/bulk-import → IntentDto[]
  bulkImport: (tenantId: string, intents: IntentCreateRequest[]) =>
    apiClient.post<IntentDto[]>(`/v1/intents/tenant/${tenantId}/bulk-import`, intents),
} as const;

// ─── Additional Intent Endpoints (from swagger) ───

export const intentsApiExtra = {
  // GET /api/v1/intents/tenant/{tenantId}/roots → IntentDto[]
  getRoots: (tenantId: string) =>
    apiClient.get<IntentDto[]>(`/v1/intents/tenant/${tenantId}/roots`),

  // GET /api/v1/intents/tenant/{tenantId}/unmapped → IntentDto[]
  getUnmapped: (tenantId: string) =>
    apiClient.get<IntentDto[]>(`/v1/intents/tenant/${tenantId}/unmapped`),

  // POST /api/v1/intents/{id}/activate → void
  activate: (id: string) =>
    apiClient.post<void>(`/v1/intents/${id}/activate`),

  // POST /api/v1/intents/{id}/deactivate → void
  deactivate: (id: string) =>
    apiClient.post<void>(`/v1/intents/${id}/deactivate`),

  // GET /api/v1/intents/{id}/breadcrumb → IntentDto[]
  getBreadcrumb: (id: string) =>
    apiClient.get<IntentDto[]>(`/v1/intents/${id}/breadcrumb`),

  // GET /api/v1/intents/{parentId}/children → IntentDto[]
  getChildren: (parentId: string) =>
    apiClient.get<IntentDto[]>(`/v1/intents/${parentId}/children`),
} as const;
