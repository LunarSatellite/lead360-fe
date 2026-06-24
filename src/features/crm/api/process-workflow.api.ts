import { apiClient } from '@/shared/lib/api-client';
import type {
  ProcessDefinitionDto,
  ProcessInstanceDto,
  ProcessTaskDto,
  ProcessTaskFilter,
  ProcessInstanceFilter,
  CreateProcessDefinitionRequest,
  UpdateProcessDefinitionRequest,
  StartProcessRequest,
  CompleteProcessTaskRequest,
} from '../types/process-workflow.types';
import type { PagedResult } from '../types/crm.types';

const BASE = '/v1/process-workflow';

export const processWorkflowApi = {
  // ─── Tasks ─────────────────────────────────────────────────────────────────
  getMyTasks: (filter: ProcessTaskFilter = {}) =>
    apiClient.get<PagedResult<ProcessTaskDto>>(`${BASE}/tasks/mine`, { params: filter }),

  getTeamTasks: (teamLabel: string, filter: ProcessTaskFilter = {}) =>
    apiClient.get<PagedResult<ProcessTaskDto>>(`${BASE}/tasks/team/${encodeURIComponent(teamLabel)}`, { params: filter }),

  getTask: (id: string) =>
    apiClient.get<ProcessTaskDto>(`${BASE}/tasks/${id}`),

  openTask: (id: string) =>
    apiClient.post<ProcessTaskDto>(`${BASE}/tasks/${id}/open`, {}),

  startTask: (id: string) =>
    apiClient.post<ProcessTaskDto>(`${BASE}/tasks/${id}/start`, {}),

  completeTask: (id: string, data: CompleteProcessTaskRequest) =>
    apiClient.post<ProcessTaskDto>(`${BASE}/tasks/${id}/complete`, data),

  // ─── Instances ─────────────────────────────────────────────────────────────
  getInstances: (filter: ProcessInstanceFilter = {}) =>
    apiClient.get<PagedResult<ProcessInstanceDto>>(`${BASE}/instances`, { params: filter }),

  getInstanceById: (id: string) =>
    apiClient.get<ProcessInstanceDto>(`${BASE}/instances/${id}`),

  startProcess: (data: StartProcessRequest) =>
    apiClient.post<ProcessInstanceDto>(`${BASE}/instances`, data),

  cancelInstance: (id: string) =>
    apiClient.post<ProcessInstanceDto>(`${BASE}/instances/${id}/cancel`, {}),

  // ─── Definitions ───────────────────────────────────────────────────────────
  getDefinitions: () =>
    apiClient.get<ProcessDefinitionDto[]>(`${BASE}/definitions`),

  getDefinitionById: (id: string) =>
    apiClient.get<ProcessDefinitionDto>(`${BASE}/definitions/${id}`),

  createDefinition: (data: CreateProcessDefinitionRequest) =>
    apiClient.post<ProcessDefinitionDto>(`${BASE}/definitions`, data),

  updateDefinition: (id: string, data: UpdateProcessDefinitionRequest) =>
    apiClient.put<ProcessDefinitionDto>(`${BASE}/definitions/${id}`, data),

  deleteDefinition: (id: string) =>
    apiClient.delete(`${BASE}/definitions/${id}`),
} as const;
