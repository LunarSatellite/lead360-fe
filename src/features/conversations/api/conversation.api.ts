import { apiClient } from '@/shared/lib/api-client';
import type { SessionDto, MessageDto, ConversationStatsDto } from '../types/conversation.types';

export const conversationApi = {
  getSession: (id: string) => apiClient.get<SessionDto>(`/v1/conversations/sessions/${id}`),
  getActive: () => apiClient.get<SessionDto[]>('/v1/conversations/sessions/active'),
  getAwaiting: () => apiClient.get<SessionDto[]>('/v1/conversations/sessions/awaiting-agent'),
  getMine: () => apiClient.get<SessionDto[]>('/v1/conversations/sessions/mine'),
  getAgentSessions: (agentId: string) => apiClient.get<SessionDto[]>(`/v1/conversations/sessions/agent/${agentId}`),
  handoff: (sessionId: string, context?: string) => apiClient.post<void>(`/v1/conversations/sessions/${sessionId}/handoff`, { context }),
  assign: (sessionId: string, agentId: string) => apiClient.post<void>(`/v1/conversations/sessions/${sessionId}/assign`, { agentId }),
  returnToBot: (sessionId: string) => apiClient.post<void>(`/v1/conversations/sessions/${sessionId}/return-to-bot`),
  close: (sessionId: string) => apiClient.post<void>(`/v1/conversations/sessions/${sessionId}/close`),
  getMessages: (sessionId: string, limit = 50) => apiClient.get<MessageDto[]>(`/v1/conversations/sessions/${sessionId}/messages?limit=${limit}`),
  getUnmatched: (from?: string, to?: string) => {
    const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to);
    return apiClient.get<MessageDto[]>(`/v1/conversations/messages/unmatched?${p}`);
  },
  getStats: (from?: string, to?: string) => {
    const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to);
    return apiClient.get<ConversationStatsDto>(`/v1/conversations/analytics/stats?${p}`);
  },
  getRoutingPaths: (from?: string, to?: string) => {
    const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to);
    return apiClient.get<Record<string, number>>(`/v1/conversations/analytics/routing-paths?${p}`);
  },
  getSessionsByChannel: () => apiClient.get<Record<string, number>>('/v1/conversations/analytics/sessions-by-channel'),
  expireSessions: () => apiClient.post<number>('/v1/conversations/maintenance/expire-sessions'),
  agentReply: (sessionId: string, text: string) =>
    apiClient.post(`/v1/conversations/sessions/${sessionId}/reply`, { text }),
  getSessionDeal: (sessionId: string) =>
    apiClient.get(`/v1/conversations/sessions/${sessionId}/deal`),
} as const;
