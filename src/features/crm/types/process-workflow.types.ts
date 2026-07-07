export enum ProcessTaskStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Escalated = 4,
  Skipped = 5,
}

export enum ProcessInstanceStatus {
  Active = 1,
  Completed = 2,
  Cancelled = 3,
  Failed = 4,
}

export enum ProcessTriggerKind {
  Manual = 1,
  WorkflowAction = 2,
  SupportCaseEscalation = 3,
  AgentHandoff = 4,
  EventIngestion = 5,
}

export interface ProcessStepDto {
  id: string;
  stepOrder: number;
  name: string;
  description?: string;
  assignedTeamLabel: string | null;
  assignedToUserId: string | null;
  slaHours: number;
  assignedRoleId?: string | null;
}

export interface ProcessDefinitionDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  steps: ProcessStepDto[];
  createdAt: string;
}

export interface ProcessTaskDto {
  id: string;
  processInstanceId: string;
  processStepId: string;
  stepOrder: number;
  stepName: string;
  definitionName: string;
  assignedTeamLabel: string | null;
  assignedToUserId: string | null;
  assignedRoleId?: string | null;
  status: ProcessTaskStatus;
  assignedAt: string;
  firstOpenedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  slaDeadline: string | null;
  slaBreached: boolean;
  escalationLevel: number;
  notes: string | null;
  triggerRefId: string | null;
  triggerRefKind: string | null;
}

export interface ProcessInstanceDto {
  id: string;
  processDefinitionId: string;
  definitionName: string;
  status: ProcessInstanceStatus;
  triggerKind: ProcessTriggerKind;
  triggerRefId: string | null;
  triggerRefKind: string | null;
  currentStepOrder: number;
  totalSteps: number;
  startedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  tasks: ProcessTaskDto[];
}

export interface ProcessTaskFilter {
  Status?: ProcessTaskStatus;
  TeamLabel?: string;
  AssignedToUserId?: string;
  SlaBreachedOnly?: boolean;
  Page?: number;
  PageSize?: number;
}

export interface ProcessInstanceFilter {
  Status?: ProcessInstanceStatus;
  DefinitionId?: string;
  Page?: number;
  PageSize?: number;
}

export interface CreateProcessStepRequest {
  stepOrder: number;
  name: string;
  description?: string;
  assignedTeamLabel?: string;
  assignedToUserId?: string;
  assignedRoleId?: string;
  slaHours?: number;
}

export interface CreateProcessDefinitionRequest {
  name: string;
  description?: string;
  steps: CreateProcessStepRequest[];
}

export interface UpdateProcessDefinitionRequest {
  name: string;
  description?: string;
  isActive: boolean;
  steps: CreateProcessStepRequest[];
}

export interface StartProcessRequest {
  processDefinitionId: string;
  triggerKind?: ProcessTriggerKind;
  triggerRefId?: string;
  triggerRefKind?: string;
}

export interface CompleteProcessTaskRequest {
  notes?: string;
}

export const PROCESS_TASK_STATUS_LABELS: Record<ProcessTaskStatus, string> = {
  [ProcessTaskStatus.Pending]: 'Pending',
  [ProcessTaskStatus.InProgress]: 'In Progress',
  [ProcessTaskStatus.Completed]: 'Completed',
  [ProcessTaskStatus.Escalated]: 'Escalated',
  [ProcessTaskStatus.Skipped]: 'Skipped',
};

export const PROCESS_TASK_STATUS_COLORS: Record<ProcessTaskStatus, string> = {
  [ProcessTaskStatus.Pending]: 'text-text-muted border-border-subtle bg-bg-elevated',
  [ProcessTaskStatus.InProgress]: 'text-info-DEFAULT border-info-DEFAULT/30 bg-info-DEFAULT/10',
  [ProcessTaskStatus.Completed]: 'text-success-DEFAULT border-success-DEFAULT/30 bg-success-DEFAULT/10',
  [ProcessTaskStatus.Escalated]: 'text-danger-DEFAULT border-danger-DEFAULT/30 bg-danger-DEFAULT/10',
  [ProcessTaskStatus.Skipped]: 'text-text-muted border-border-subtle bg-bg-elevated',
};
