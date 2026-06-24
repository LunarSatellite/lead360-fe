// ═══════════════════════════════════════════════════════════════
// Test Channel — TanStack Query Hooks (simulator only)
// Channel CRUD hooks live in features/channels/api/
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation } from '@tanstack/react-query';
import { testChannelApi } from './test-channel.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type { TestMessageRequest, TestSessionStartRequest } from '../types/test-channel.types';

// ─── Query Keys ───

export const testChannelKeys = {
  all: ['test-channel'] as const,
  status: () => [...testChannelKeys.all, 'status'] as const,
  connection: (tenantId: string) => [...testChannelKeys.all, 'connection', tenantId] as const,
  session: (id: string) => [...testChannelKeys.all, 'session', id] as const,
} as const;

// ─── Queries ───

export function useTestChannelStatus() {
  return useQuery({
    queryKey: testChannelKeys.status(),
    queryFn: () => testChannelApi.checkStatus(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useTestChannelConnection(tenantId: string | undefined) {
  return useQuery({
    queryKey: testChannelKeys.connection(tenantId!),
    queryFn: () => testChannelApi.getOrCreateConnection(tenantId!),
    enabled: !!tenantId,
    staleTime: Infinity,
    retry: 1,
  });
}

export function useTestSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: testChannelKeys.session(sessionId!),
    queryFn: () => testChannelApi.getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: false,
  });
}

// ─── Mutations ───

export function useSendTestMessage() {
  return useMutation({
    mutationFn: (data: TestMessageRequest) => testChannelApi.sendMessage(data),
    onError: (err: ApiError) => toast.error(err.message || 'Failed to send message.'),
  });
}

export function useStartTestSession() {
  return useMutation({
    mutationFn: (data: TestSessionStartRequest) => testChannelApi.startSession(data),
    onError: (err: ApiError) => toast.error(err.message || 'Failed to start session.'),
  });
}

export function useResetTestSession() {
  return useMutation({
    mutationFn: (sessionId: string) => testChannelApi.resetSession(sessionId),
    onSuccess: () => toast.success('Session reset.'),
    onError: (err: ApiError) => toast.error(err.message || 'Failed to reset session.'),
  });
}
