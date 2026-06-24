// ═══════════════════════════════════════════════════════════════
// Test Channel — API Functions (simulator only)
// Source: /api/v1/test-channel/*
// Channel CRUD lives in features/channels/api/
// ═══════════════════════════════════════════════════════════════

import { apiClient } from '@/shared/lib/api-client';
import type {
  TestMessageRequest,
  TestMessageResponse,
  TestSessionStartRequest,
  TestSessionStateResponse,
} from '../types/test-channel.types';

export const testChannelApi = {
  // POST /api/v1/test-channel/message → TestMessageResponse
  sendMessage: (data: TestMessageRequest) =>
    apiClient.post<TestMessageResponse>('/v1/test-channel/message', data),

  // POST /api/v1/test-channel/session/start → TestSessionStateResponse
  startSession: (data: TestSessionStartRequest) =>
    apiClient.post<TestSessionStateResponse>('/v1/test-channel/session/start', data),

  // GET /api/v1/test-channel/session/{sessionId} → TestSessionStateResponse
  getSession: (sessionId: string) =>
    apiClient.get<TestSessionStateResponse>(`/v1/test-channel/session/${sessionId}`),

  // POST /api/v1/test-channel/session/{sessionId}/reset → void
  resetSession: (sessionId: string) =>
    apiClient.post<void>(`/v1/test-channel/session/${sessionId}/reset`),

  // GET /api/v1/test-channel/connection/{tenantId} → uuid string
  getOrCreateConnection: (tenantId: string) =>
    apiClient.get<string>(`/v1/test-channel/connection/${tenantId}`),

  // GET /api/v1/test-channel/status → void
  checkStatus: () =>
    apiClient.get<void>('/v1/test-channel/status'),
} as const;
