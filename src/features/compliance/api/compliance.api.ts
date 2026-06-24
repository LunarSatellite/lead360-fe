// ═══════════════════════════════════════════════════════════════
// Compliance Feature — API Functions (matches Swagger spec)
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  ComplianceProfile,
  ComplianceProfileSummary,
  ComplianceProfileCreateRequest,
  ComplianceProfileUpdateRequest,
  AssignComplianceProfileRequest,
} from '../types/compliance.types';

export const complianceApi = {
  // ─── Read ───
  getAll: () => apiClient.get<ComplianceProfileSummary[]>('/v1/compliance/profiles'),

  getById: (id: string) => apiClient.get<ComplianceProfile>(`/v1/compliance/profiles/${id}`),

  getByIndustry: (industry: string) =>
    apiClient.get<ComplianceProfileSummary[]>(
      `/v1/compliance/profiles/by-industry/${encodeURIComponent(industry)}`,
    ),

  getRecommended: (industry: string) =>
    apiClient.get<ComplianceProfile>(`/v1/compliance/profiles/recommended/${encodeURIComponent(industry)}`),

  getTenantProfile: () => apiClient.get<ComplianceProfile>('/v1/compliance/tenant/current'),

  // ─── Write ───
  create: (data: ComplianceProfileCreateRequest) =>
    apiClient.post<ComplianceProfile>('/v1/compliance/profiles', data),

  update: (id: string, data: ComplianceProfileUpdateRequest) =>
    apiClient.put<ComplianceProfile>(`/v1/compliance/profiles/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/v1/compliance/profiles/${id}`),

  assignToTenant: (data: AssignComplianceProfileRequest) =>
    apiClient.post<ComplianceProfile>('/v1/compliance/tenant/assign', data),
} as const;
