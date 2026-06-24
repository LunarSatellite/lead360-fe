// ═══════════════════════════════════════════════════════════════
// API Specs — API Functions (matches backend endpoints)
// Source: /api/v1/api-specs/*
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  ApiSpecificationDto,
  ApiSpecificationDetailDto,
  ApiEndpointDto,
  ApiSpecUploadRequest,
} from '../types/api-specs.types';

export const apiSpecsApi = {
  // POST /api/v1/api-specs/upload → ApiSpecificationDetailDto
  upload: (data: ApiSpecUploadRequest) =>
    apiClient.post<ApiSpecificationDetailDto>('/v1/api-specs/upload', data),

  // POST /api/v1/api-specs/upload-file → ApiSpecificationDetailDto (multipart)
  uploadFile: (formData: FormData) =>
    apiClient.post<ApiSpecificationDetailDto>('/v1/api-specs/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // GET /api/v1/api-specs → ApiSpecificationDto[]
  getAll: () =>
    apiClient.get<ApiSpecificationDto[]>('/v1/api-specs'),

  // GET /api/v1/api-specs/{id} → ApiSpecificationDetailDto
  getById: (id: string) =>
    apiClient.get<ApiSpecificationDetailDto>(`/v1/api-specs/${id}`),

  // GET /api/v1/api-specs/{id}/endpoints → ApiEndpointDto[]
  getEndpoints: (id: string) =>
    apiClient.get<ApiEndpointDto[]>(`/v1/api-specs/${id}/endpoints`),

  // GET /api/v1/api-specs/endpoints/all → ApiEndpointDto[]
  getAllEndpoints: () =>
    apiClient.get<ApiEndpointDto[]>('/v1/api-specs/endpoints/all'),

  // POST /api/v1/api-specs/{id}/reparse → ApiSpecificationDetailDto
  reparse: (id: string) =>
    apiClient.post<ApiSpecificationDetailDto>(`/v1/api-specs/${id}/reparse`),

  // DELETE /api/v1/api-specs/{id} → void
  delete: (id: string) =>
    apiClient.delete<void>(`/v1/api-specs/${id}`),
} as const;
