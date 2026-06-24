// ═══════════════════════════════════════════════════════════════
// Tenant Feature — API Functions (all 11 swagger endpoints)
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  TenantDto, TenantCreateRequest, TenantUpdateRequest,
  TenantStatsByStatus, TenantStatusValue, ApiHealthStatusValue,
} from '../types/tenant.types';

export const tenantApi = {
  // GET /api/v1/tenants → TenantDto[]
  getAll: () =>
    apiClient.get<TenantDto[]>('/v1/tenants'),

  // POST /api/v1/tenants → TenantDto (201)
  create: (data: TenantCreateRequest) =>
    apiClient.post<TenantDto>('/v1/tenants', data),

  // GET /api/v1/tenants/{id} → TenantDto
  getById: (id: string) =>
    apiClient.get<TenantDto>(`/v1/tenants/${id}`),

  // PUT /api/v1/tenants/{id} → TenantDto
  update: (id: string, data: TenantUpdateRequest) =>
    apiClient.put<TenantDto>(`/v1/tenants/${id}`, data),

  // DELETE /api/v1/tenants/{id} → void
  delete: (id: string) =>
    apiClient.delete<void>(`/v1/tenants/${id}`),

  // GET /api/v1/tenants/active → TenantDto[]
  getActive: () =>
    apiClient.get<TenantDto[]>('/v1/tenants/active'),

  // GET /api/v1/tenants/by-status/{status} → TenantDto[]
  getByStatus: (status: TenantStatusValue) =>
    apiClient.get<TenantDto[]>(`/v1/tenants/by-status/${status}`),

  // GET /api/v1/tenants/stats/by-status → { Onboarding, Active, Suspended, Deactivated }
  getStatsByStatus: () =>
    apiClient.get<TenantStatsByStatus>('/v1/tenants/stats/by-status'),

  // PUT /api/v1/tenants/{tenantId}/api-health?status={status} → void
  updateApiHealth: (tenantId: string, status: ApiHealthStatusValue) =>
    apiClient.put<void>(`/v1/tenants/${tenantId}/api-health?status=${status}`),

  // GET /api/v1/tenants/{tenantId}/token-budget → boolean
  checkTokenBudget: (tenantId: string) =>
    apiClient.get<boolean>(`/v1/tenants/${tenantId}/token-budget`),
} as const;
