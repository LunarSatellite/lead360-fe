// ═══════════════════════════════════════════════════════════════
// Channels Feature — TanStack Query Hooks + Keys
// ═══════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelApi } from './channels.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import { QUERY_KEYS } from '@/shared/config/query-keys';
import type { ChannelConnectionCreateRequest } from '../types/channels.types';

// ─── Query Keys ───

export const channelKeys = {
  all: QUERY_KEYS.channels,
  lists: () => [...channelKeys.all, 'list'] as const,
  detail: (id: string) => [...channelKeys.all, 'detail', id] as const,
  hasActive: () => [...channelKeys.all, 'has-active'] as const,
  stats: () => [...channelKeys.all, 'stats'] as const,
} as const;

// ─── Queries ───

export function useChannels() {
  return useQuery({
    queryKey: channelKeys.lists(),
    queryFn: () => channelApi.getAll(),
  });
}

export function useChannel(id: string | undefined) {
  return useQuery({
    queryKey: channelKeys.detail(id!),
    queryFn: () => channelApi.getById(id!),
    enabled: !!id,
  });
}

export function useHasActiveChannel() {
  return useQuery({
    queryKey: channelKeys.hasActive(),
    queryFn: () => channelApi.hasActive(),
    staleTime: 30_000,
  });
}

export function useChannelStats() {
  return useQuery({
    queryKey: channelKeys.stats(),
    queryFn: () => channelApi.getStats(),
    staleTime: 30_000,
  });
}

// ─── Mutations ───

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChannelConnectionCreateRequest) => channelApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: channelKeys.lists() });
      qc.invalidateQueries({ queryKey: channelKeys.hasActive() });
      qc.invalidateQueries({ queryKey: channelKeys.stats() });
      toast.success('Channel connection created.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to create channel.'),
  });
}

export function useActivateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => channelApi.activate(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: channelKeys.detail(id) });
      qc.invalidateQueries({ queryKey: channelKeys.lists() });
      qc.invalidateQueries({ queryKey: channelKeys.hasActive() });
      toast.success('Channel activated.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to activate.'),
  });
}

export function useDeactivateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => channelApi.deactivate(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: channelKeys.detail(id) });
      qc.invalidateQueries({ queryKey: channelKeys.lists() });
      qc.invalidateQueries({ queryKey: channelKeys.hasActive() });
      toast.success('Channel deactivated.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to deactivate.'),
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => channelApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: channelKeys.all });
      toast.success('Channel deleted.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to delete.'),
  });
}
