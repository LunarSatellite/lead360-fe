// ═══════════════════════════════════════════════════════════════
// Agents Feature — TanStack Query hooks + query keys
//
// Convention (matches features/intents/api/intents.queries.ts):
//   - keys via a builder object with .all / .lists / .detail / etc.
//   - queries return UseQueryResult<T>
//   - mutations toast on success/error and invalidate keys
//   - mutation arg shapes match the API signatures so callers are
//     just `.mutate(data)` or `.mutate({ id, data })`
// ═══════════════════════════════════════════════════════════════

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import { QUERY_KEYS } from '@/shared/config/query-keys';
import { agentsApi, type AgentListFilters } from './agents.api';
import type {
  AgentDto,
  AgentDetailDto,
  AgentRunDto,
  AgentRunDetailDto,
  AgentRunListFilters,
  CreateAgentRequest,
  UpdateAgentRequest,
  FireAgentRequest,
  RespondToRunRequest,
  CancelRunRequest,
} from '../types/agents.types';

// ─── Query keys ────────────────────────────────────────────────

export const agentKeys = {
  all: QUERY_KEYS.agents,
  lists: () => [...QUERY_KEYS.agents, 'list'] as const,
  list: (filters: AgentListFilters) => [...QUERY_KEYS.agents, 'list', filters] as const,
  detail: (id: string) => [...QUERY_KEYS.agents, 'detail', id] as const,
  // Runs live under the same root so a single
  //   qc.invalidateQueries({ queryKey: agentKeys.all })
  // refreshes everything after a mutation.
  runs: {
    all: () => [...QUERY_KEYS.agents, 'runs'] as const,
    list: (filters: AgentRunListFilters) =>
      [...QUERY_KEYS.agents, 'runs', 'list', filters] as const,
    pending: (take?: number) =>
      [...QUERY_KEYS.agents, 'runs', 'pending', take ?? 'default'] as const,
    detail: (runId: string) =>
      [...QUERY_KEYS.agents, 'runs', 'detail', runId] as const,
  },
} as const;

// ─── Agent CRUD queries ────────────────────────────────────────

export function useAgents(filters: AgentListFilters = {}) {
  return useQuery({
    queryKey: agentKeys.list(filters),
    queryFn: () => agentsApi.list(filters),
  });
}

export function useAgent(
  agentId: string | undefined,
  options?: Omit<UseQueryOptions<AgentDetailDto, ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<AgentDetailDto, ApiError>({
    queryKey: agentKeys.detail(agentId ?? ''),
    queryFn: () => agentsApi.getById(agentId!),
    enabled: !!agentId,
    ...options,
  });
}

// ─── Agent CRUD mutations ──────────────────────────────────────

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation<AgentDto, ApiError, CreateAgentRequest>({
    mutationFn: (data) => agentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.all });
      toast.success('Agent created.');
    },
    onError: (err) => toast.error(err.message || 'Failed to create agent.'),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation<AgentDto, ApiError, { id: string; data: UpdateAgentRequest }>({
    mutationFn: ({ id, data }) => agentsApi.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: agentKeys.all });
      // Seed the detail cache so the editor modal sees the new
      // values immediately without waiting for a refetch.
      qc.setQueryData<AgentDto>(agentKeys.detail(updated.id), (old) =>
        old ? { ...old, ...updated } : (updated as AgentDetailDto),
      );
      toast.success('Agent updated.');
    },
    onError: (err) => toast.error(err.message || 'Failed to update agent.'),
  });
}

// Convenience for the inline-card "Disable" button. Same plumbing
// as useUpdateAgent, but produces a friendlier toast.
export function useToggleAgentEnabled() {
  const qc = useQueryClient();
  return useMutation<AgentDto, ApiError, { id: string; enabled: boolean }>({
    mutationFn: ({ id, enabled }) => agentsApi.update(id, { enabled }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: agentKeys.all });
      toast.success(updated.enabled ? 'Agent enabled.' : 'Agent disabled.');
    },
    onError: (err) => toast.error(err.message || 'Failed to update agent.'),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => agentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.all });
      toast.success('Agent deleted.');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete agent.'),
  });
}

// ─── Fire ──────────────────────────────────────────────────────

export function useFireAgent() {
  const qc = useQueryClient();
  return useMutation<AgentRunDto, ApiError, { id: string; data?: FireAgentRequest }>({
    mutationFn: ({ id, data }) => agentsApi.fire(id, data),
    onSuccess: () => {
      // New run → invalidate runs lists (pending feed especially).
      qc.invalidateQueries({ queryKey: agentKeys.runs.all() });
      toast.success('Agent fired.');
    },
    onError: (err) => toast.error(err.message || 'Failed to fire agent.'),
  });
}

// ─── Run queries ───────────────────────────────────────────────

export function useAgentRuns(filters: AgentRunListFilters = {}) {
  return useQuery({
    queryKey: agentKeys.runs.list(filters),
    queryFn: () => agentsApi.listRuns(filters),
  });
}

export function usePendingAgentRuns(take?: number) {
  return useQuery({
    queryKey: agentKeys.runs.pending(take),
    queryFn: () => agentsApi.listPendingRuns(take),
    // Pending feed is a tower display — keep it fresh-ish without
    // hammering the API. Refetch every 30s while tab is visible.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useAgentRun(
  runId: string | undefined,
  options?: Omit<UseQueryOptions<AgentRunDetailDto, ApiError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<AgentRunDetailDto, ApiError>({
    queryKey: agentKeys.runs.detail(runId ?? ''),
    queryFn: () => agentsApi.getRun(runId!),
    enabled: !!runId,
    // Approval landing page calls this and we want a real fetch on
    // mount even if React Query has stale data from elsewhere — the
    // status may have flipped to terminal between visits.
    staleTime: 0,
    ...options,
  });
}

// ─── Respond / cancel ──────────────────────────────────────────

export function useRespondToRun() {
  const qc = useQueryClient();
  return useMutation<AgentRunDto, ApiError, { runId: string; data: RespondToRunRequest }>({
    mutationFn: ({ runId, data }) => agentsApi.respondToRun(runId, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: agentKeys.runs.all() });
      qc.setQueryData(agentKeys.runs.detail(updated.id), (old: AgentRunDetailDto | undefined) =>
        old ? { ...old, ...updated } : undefined,
      );
      // Don't toast here — the caller (landing page or admin drawer)
      // shows its own success copy with more context.
    },
    // Same — caller handles 401 / 409 with specific messaging.
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation<AgentRunDto, ApiError, { runId: string; data?: CancelRunRequest }>({
    mutationFn: ({ runId, data }) => agentsApi.cancelRun(runId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.runs.all() });
      toast.success('Run cancelled.');
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel run.'),
  });
}
