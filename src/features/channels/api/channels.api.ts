// ═══════════════════════════════════════════════════════════════
// Channels Feature — API Functions (matches Swagger spec)
// Source: /api/v1/channels/*
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  ChannelConnectionDto,
  ChannelConnectionCreateRequest,
  ChannelStatsResponse,
} from '../types/channels.types';

export const channelApi = {
  // GET /api/v1/channels → ChannelConnectionDto[]
  getAll: () =>
    apiClient.get<ChannelConnectionDto[]>('/v1/channels'),

  // GET /api/v1/channels/{id} → ChannelConnectionDto
  getById: (id: string) =>
    apiClient.get<ChannelConnectionDto>(`/v1/channels/${id}`),

  // POST /api/v1/channels → ChannelConnectionDto (201)
  create: (data: ChannelConnectionCreateRequest) =>
    apiClient.post<ChannelConnectionDto>('/v1/channels', data),

  // POST /api/v1/channels/{id}/connect → void
  activate: (id: string) =>
    apiClient.post<void>(`/v1/channels/${id}/connect`),

  // POST /api/v1/channels/{id}/disconnect → void
  deactivate: (id: string) =>
    apiClient.post<void>(`/v1/channels/${id}/disconnect`),

  // DELETE /api/v1/channels/{id} → void
  delete: (id: string) =>
    apiClient.delete<void>(`/v1/channels/${id}`),

  // GET /api/v1/channels/has-active → boolean
  hasActive: () =>
    apiClient.get<boolean>('/v1/channels/has-active'),

  // GET /api/v1/channels/stats → ChannelStatsResponse
  getStats: () =>
    apiClient.get<ChannelStatsResponse>('/v1/channels/stats'),
} as const;
