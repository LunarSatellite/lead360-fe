import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import { conversationApi } from './conversation.api';

export function useActiveSessions() {
  return useQuery({ queryKey: ['conversations', 'active'], queryFn: () => conversationApi.getActive(), refetchInterval: 15_000 });
}
export function useAwaitingSessions() {
  return useQuery({ queryKey: ['conversations', 'awaiting'], queryFn: () => conversationApi.getAwaiting(), refetchInterval: 10_000 });
}
export function useMySessions() {
  return useQuery({ queryKey: ['conversations', 'mine'], queryFn: () => conversationApi.getMine(), refetchInterval: 15_000 });
}
export function useSession(id: string | undefined) {
  return useQuery({ queryKey: ['conversations', 'session', id], queryFn: () => conversationApi.getSession(id!), enabled: !!id });
}
export function useMessages(sessionId: string | undefined) {
  return useQuery({ queryKey: ['conversations', 'messages', sessionId], queryFn: () => conversationApi.getMessages(sessionId!), enabled: !!sessionId, refetchInterval: 5_000 });
}
export function useUnmatched(from?: string, to?: string) {
  return useQuery({ queryKey: ['conversations', 'unmatched', from, to], queryFn: () => conversationApi.getUnmatched(from, to) });
}
export function useConversationStats(from?: string, to?: string) {
  return useQuery({ queryKey: ['conversations', 'stats', from, to], queryFn: () => conversationApi.getStats(from, to), staleTime: 30_000 });
}
export function useRoutingPaths(from?: string, to?: string) {
  return useQuery({ queryKey: ['conversations', 'routing', from, to], queryFn: () => conversationApi.getRoutingPaths(from, to), staleTime: 30_000 });
}
export function useSessionsByChannel() {
  return useQuery({ queryKey: ['conversations', 'by-channel'], queryFn: () => conversationApi.getSessionsByChannel(), staleTime: 30_000 });
}
export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationApi.close(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); toast.success('Session closed'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed'),
  });
}
export function useReturnToBot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversationApi.returnToBot(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); toast.success('Returned to bot'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed'),
  });
}
export function useSessionDeal(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', 'deal', sessionId],
    queryFn: () => conversationApi.getSessionDeal(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 8_000,
  });
}

export function useAgentReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, text }: { sessionId: string; text: string }) =>
      conversationApi.agentReply(sessionId, text),
    onSuccess: (_d, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['conversations', 'messages', sessionId] });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Failed to send reply'),
  });
}

export function useAssignAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, agentId }: { sessionId: string; agentId: string }) => conversationApi.assign(sessionId, agentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); toast.success('Agent assigned'); },
    onError: (e: ApiError) => toast.error(e.message || 'Failed'),
  });
}
