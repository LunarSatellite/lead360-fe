import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flowApi } from './flow.api';
import { flowRuntimeApi } from './flow-runtime.api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/shared/config/query-keys';
import type { FlowGenerateRequest, FlowChatRequest, FlowSaveRequest, ServiceExecutionRequest, MenuRenderRequest, ImportRow } from '../types/flow.types';
import type { FlowMessageRequest } from '../types/flow-runtime.types';

export const flowKeys = {
  all:       QUERY_KEYS.flows,
  list:      () => [...QUERY_KEYS.flows, 'list'] as const,
  detail:    (id: string) => [...QUERY_KEYS.flows, 'detail', id] as const,
  checklist: () => [...QUERY_KEYS.flows, 'checklist'] as const,
} as const;

// ─── Queries ───
export function useFlows() {
  return useQuery({ queryKey: flowKeys.list(), queryFn: () => flowApi.list(), staleTime: 30_000 });
}
export function useFlow(tenantId: string) {
  return useQuery({ queryKey: flowKeys.list(), queryFn: () => flowApi.list(), enabled: !!tenantId, staleTime: 30_000 });
}
export function useFlowById(id: string | undefined) {
  return useQuery({ queryKey: flowKeys.detail(id!), queryFn: () => flowApi.getById(id!), enabled: !!id, staleTime: 10_000 });
}
export function useGoLiveChecklist() {
  return useQuery({ queryKey: flowKeys.checklist(), queryFn: () => flowApi.getChecklist(), staleTime: 15_000 });
}

// ─── Flow Mutations ───
export function useGenerateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: FlowGenerateRequest) => flowApi.generate(d),
    onSuccess: (f) => { qc.invalidateQueries({ queryKey: flowKeys.all }); toast.success(`Flow "${f.name}" generated with ${f.nodeCount} nodes!`); },
    onError: () => toast.error('Failed to generate flow.'),
  });
}
export function useChatModifyFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FlowChatRequest }) => flowApi.chatModify(id, data),
    onSuccess: (f) => { qc.invalidateQueries({ queryKey: flowKeys.all }); toast.success(`Flow updated to v${f.version}`); },
    onError: () => toast.error('AI modification failed.'),
  });
}
export function useSaveFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FlowSaveRequest }) => flowApi.save(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: flowKeys.all }); },
    onError: () => toast.error('Failed to save flow.'),
  });
}
export function useActivateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flowApi.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: flowKeys.all }); toast.success('Flow deployed! 🚀'); },
    onError: () => toast.error('Failed to activate.'),
  });
}
export function useDeactivateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flowApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: flowKeys.all }); toast.success('Flow deactivated.'); },
    onError: () => toast.error('Failed to deactivate.'),
  });
}
export function useDuplicateFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flowApi.duplicate(id),
    onSuccess: (f) => { qc.invalidateQueries({ queryKey: flowKeys.all }); toast.success(`Duplicated as "${f.name}"`); },
    onError: () => toast.error('Failed to duplicate.'),
  });
}
export function useDeleteFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flowApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: flowKeys.all }); toast.success('Flow deleted.'); },
    onError: () => toast.error('Cannot delete active flow.'),
  });
}

// ─── Execution / Menu ───
export function useServiceExecution() {
  return useMutation({ mutationFn: (d: ServiceExecutionRequest) => flowApi.execute(d) });
}
export function useRenderMenu() {
  return useMutation({ mutationFn: (d: MenuRenderRequest) => flowApi.renderMenu(d) });
}
export function useMainMenu() {
  return useMutation({ mutationFn: () => flowApi.getMainMenu() });
}

// ─── Go-Live ───
export function useActivateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ch: string) => flowApi.activateChannel(ch),
    onSuccess: (_d, ch) => { qc.invalidateQueries({ queryKey: flowKeys.checklist() }); toast.success(`${ch} is live! 🎉`); },
    onError: () => toast.error('Activation failed.'),
  });
}
export function useActivateAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => flowApi.activateAll(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: flowKeys.checklist() }); toast.success('All channels live! 🚀'); },
    onError: () => toast.error('Bulk activation failed.'),
  });
}

// ─── Flow Runtime ───
export function useFlowRuntimeMessage() {
  return useMutation({ mutationFn: (d: FlowMessageRequest) => flowRuntimeApi.processMessage(d) });
}
export function useFlowRuntimeEntryMenu() {
  return useMutation({ mutationFn: () => flowRuntimeApi.getEntryMenu() });
}
export function useFlowRuntimeReset() {
  return useMutation({ mutationFn: (sessionId: string) => flowRuntimeApi.resetPosition(sessionId) });
}

// ─── Import ───
export function useImportParse() {
  return useMutation({ mutationFn: (d: { Content: string; Format: string; FileName: string }) => flowApi.importParse(d) });
}
export function useImportEnrich() {
  return useMutation({ mutationFn: (rows: ImportRow[]) => flowApi.importEnrich({ Rows: rows }) });
}
export function useImportConfirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: ImportRow[]) => flowApi.importConfirm({ ApprovedRows: rows }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: QUERY_KEYS.intents }); toast.success(`${r.importedCount} intents imported!`); },
    onError: () => toast.error('Import failed.'),
  });
}

// ─── Validation ───
export function useFlowValidation(flowId: string | undefined) {
  return useQuery({
    queryKey:            [...flowKeys.detail(flowId ?? ''), 'validation'] as const,
    queryFn:             () => flowApi.validate(flowId!),
    enabled:             !!flowId,
    staleTime:           0,
    refetchOnWindowFocus: false,
  });
}
