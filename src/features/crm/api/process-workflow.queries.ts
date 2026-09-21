import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { processWorkflowApi } from './process-workflow.api';
import type {
  ProcessTaskFilter,
  ProcessInstanceFilter,
  CreateProcessDefinitionRequest,
  UpdateProcessDefinitionRequest,
  StartProcessRequest,
  CompleteProcessTaskRequest,
} from '../types/process-workflow.types';

const PW_KEYS = {
  all: ['process-workflow'] as const,
  myTasks: (filter: ProcessTaskFilter) => ['process-workflow', 'tasks', 'mine', filter] as const,
  teamTasks: (teamLabel: string, filter: ProcessTaskFilter) => ['process-workflow', 'tasks', 'team', teamLabel, filter] as const,
  task: (id: string) => ['process-workflow', 'tasks', id] as const,
  instances: (filter: ProcessInstanceFilter) => ['process-workflow', 'instances', filter] as const,
  instance: (id: string) => ['process-workflow', 'instances', id] as const,
  definitions: () => ['process-workflow', 'definitions'] as const,
  definition: (id: string) => ['process-workflow', 'definitions', id] as const,
};

// ─── Tasks ──────────────────────────────────────────────────────────────────

export function useMyProcessTasks(filter: ProcessTaskFilter = {}) {
  return useQuery({
    queryKey: PW_KEYS.myTasks(filter),
    queryFn: () => processWorkflowApi.getMyTasks(filter),
  });
}

export function useTeamProcessTasks(teamLabel: string, filter: ProcessTaskFilter = {}) {
  return useQuery({
    queryKey: PW_KEYS.teamTasks(teamLabel, filter),
    queryFn: () => processWorkflowApi.getTeamTasks(teamLabel, filter),
    enabled: !!teamLabel,
  });
}

export function useProcessTask(id: string) {
  return useQuery({
    queryKey: PW_KEYS.task(id),
    queryFn: () => processWorkflowApi.getTask(id),
    enabled: !!id,
  });
}

export function useOpenProcessTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processWorkflowApi.openTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PW_KEYS.all }),
    onError: () => toast.error('Failed to open task'),
  });
}

export function useStartProcessTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processWorkflowApi.startTask(id),
    onSuccess: () => {
      toast.success('Task started');
      qc.invalidateQueries({ queryKey: PW_KEYS.all });
    },
    onError: () => toast.error('Failed to start task'),
  });
}

export function useCompleteProcessTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompleteProcessTaskRequest }) =>
      processWorkflowApi.completeTask(id, data),
    onSuccess: () => {
      toast.success('Task completed');
      qc.invalidateQueries({ queryKey: PW_KEYS.all });
    },
    onError: () => toast.error('Failed to complete task'),
  });
}

// ─── Instances ───────────────────────────────────────────────────────────────

export function useProcessInstances(filter: ProcessInstanceFilter = {}) {
  return useQuery({
    queryKey: PW_KEYS.instances(filter),
    queryFn: () => processWorkflowApi.getInstances(filter),
  });
}

export function useProcessInstance(id: string) {
  return useQuery({
    queryKey: PW_KEYS.instance(id),
    queryFn: () => processWorkflowApi.getInstanceById(id),
    enabled: !!id,
  });
}

export function useStartProcess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StartProcessRequest) => processWorkflowApi.startProcess(data),
    onSuccess: () => {
      toast.success('Process started');
      qc.invalidateQueries({ queryKey: PW_KEYS.all });
    },
    onError: () => toast.error('Failed to start process'),
  });
}

export function useCancelProcessInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processWorkflowApi.cancelInstance(id),
    onSuccess: () => {
      toast.success('Process cancelled');
      qc.invalidateQueries({ queryKey: PW_KEYS.all });
    },
    onError: () => toast.error('Failed to cancel process'),
  });
}

// ─── Definitions ─────────────────────────────────────────────────────────────

export function useProcessDefinitions() {
  return useQuery({
    queryKey: PW_KEYS.definitions(),
    queryFn: () => processWorkflowApi.getDefinitions(),
  });
}

export function useProcessDefinition(id: string) {
  return useQuery({
    queryKey: PW_KEYS.definition(id),
    queryFn: () => processWorkflowApi.getDefinitionById(id),
    enabled: !!id,
  });
}

export function useCreateProcessDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProcessDefinitionRequest) => processWorkflowApi.createDefinition(data),
    onSuccess: () => {
      toast.success('Process definition created');
      qc.invalidateQueries({ queryKey: PW_KEYS.definitions() });
    },
    onError: () => toast.error('Failed to create definition'),
  });
}

export function useUpdateProcessDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcessDefinitionRequest }) =>
      processWorkflowApi.updateDefinition(id, data),
    onSuccess: () => {
      toast.success('Definition updated');
      qc.invalidateQueries({ queryKey: PW_KEYS.definitions() });
    },
    onError: () => toast.error('Failed to update definition'),
  });
}

export function useDeleteProcessDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => processWorkflowApi.deleteDefinition(id),
    onSuccess: () => {
      toast.success('Definition deleted');
      qc.invalidateQueries({ queryKey: PW_KEYS.definitions() });
    },
    onError: () => toast.error('Failed to delete definition'),
  });
}

export function useProcessRoles() {
  return useQuery({
    queryKey: ['crm', 'process-roles'],
    queryFn: () => processWorkflowApi.getRoles(),
  });
}
