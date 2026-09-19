import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { agentGovernanceApi } from '../api/agent-governance.api';
import type { HaltScopeValue } from '../types/governance.types';

export const governanceKeys = {
  all: ['agent-governance'] as const,
  queue: ['agent-governance', 'queue'] as const,
  action: (id: string) => ['agent-governance', 'action', id] as const,
  halts: ['agent-governance', 'halts'] as const,
  adminRoles: ['agent-governance', 'admin-roles'] as const,
};

/**
 * A ticking clock, shared by everything that shows time remaining.
 *
 * One interval for the whole screen, not one per row: a queue of Critical
 * actions with a per-row timer would re-render the list several times a second
 * for no extra truth. One second is the resolution a five-minute window needs.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: governanceKeys.queue,
    queryFn: agentGovernanceApi.queue,
    // Approvals are decided by other people while this page is open, and a
    // five-minute window leaves no room for a stale list.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useAgentAction(id: string | undefined) {
  return useQuery({
    queryKey: governanceKeys.action(id ?? ''),
    queryFn: () => agentGovernanceApi.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useHalts() {
  return useQuery({
    queryKey: governanceKeys.halts,
    queryFn: agentGovernanceApi.halts,
    refetchInterval: 30_000,
  });
}

/** Roles this console can prove the operator holds. `null` means "not known". */
export function useProvenAdminRoles() {
  return useQuery({
    queryKey: governanceKeys.adminRoles,
    queryFn: agentGovernanceApi.provenAdminRoles,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

function useGovernanceInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: governanceKeys.queue });
    void queryClient.invalidateQueries({ queryKey: governanceKeys.halts });
    if (id) void queryClient.invalidateQueries({ queryKey: governanceKeys.action(id) });
  };
}

export function useApproveAction() {
  const invalidate = useGovernanceInvalidation();
  return useMutation({
    mutationFn: (vars: { id: string; reasoning: string }) => agentGovernanceApi.approve(vars.id),
    onSettled: (_data, _error, vars) => invalidate(vars.id),
  });
}

export function useRejectAction() {
  const invalidate = useGovernanceInvalidation();
  return useMutation({
    mutationFn: (vars: { id: string; reasoning: string }) =>
      agentGovernanceApi.reject(vars.id, vars.reasoning),
    onSettled: (_data, _error, vars) => invalidate(vars.id),
  });
}

export function useExecuteAction() {
  const invalidate = useGovernanceInvalidation();
  return useMutation({
    mutationFn: (vars: { id: string }) => agentGovernanceApi.execute(vars.id),
    onSettled: (_data, _error, vars) => invalidate(vars.id),
  });
}

export function useEngageHalt() {
  const invalidate = useGovernanceInvalidation();
  return useMutation({
    mutationFn: (vars: { scope: HaltScopeValue; scopeKey: string | null; reason: string }) =>
      agentGovernanceApi.engageHalt(vars),
    onSettled: () => invalidate(),
  });
}

export function useClearHalt() {
  const invalidate = useGovernanceInvalidation();
  return useMutation({
    mutationFn: (vars: { scope: HaltScopeValue; scopeKey: string | null; reason: string }) =>
      agentGovernanceApi.clearHalt(vars),
    onSettled: () => invalidate(),
  });
}
