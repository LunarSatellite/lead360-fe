// ═══════════════════════════════════════════════════════════════
// Flow Builder — Phase 3 Types
// ═══════════════════════════════════════════════════════════════

export const FlowStatus = { Draft: 1, Active: 2, Archived: 3 } as const;
export type FlowStatusValue = (typeof FlowStatus)[keyof typeof FlowStatus];
export const FLOW_STATUS_LABEL: Record<FlowStatusValue, string> = {
  [FlowStatus.Draft]: 'Draft', [FlowStatus.Active]: 'Active', [FlowStatus.Archived]: 'Archived',
};

export const FlowNodeType = {
  Trigger: 'trigger', Ai: 'ai', Condition: 'condition',
  Response: 'response', Api: 'api', Action: 'action', Catalog: 'catalog',
} as const;
export type FlowNodeTypeValue = (typeof FlowNodeType)[keyof typeof FlowNodeType];

export const NODE_TYPE_META: Record<FlowNodeTypeValue, { icon: string; label: string; color: string; bg: string }> = {
  trigger:   { icon: '⚡', label: 'Trigger',   color: '#3B82F6', bg: '#DBEAFE' },
  ai:        { icon: '🧠', label: 'AI',         color: '#8B5CF6', bg: '#F3E8FF' },
  condition: { icon: '🔀', label: 'Condition',  color: '#D97706', bg: '#FEF3C7' },
  response:  { icon: '💬', label: 'Response',   color: '#EC4899', bg: '#FCE7F3' },
  api:       { icon: '🔌', label: 'API',         color: '#0891B2', bg: '#CFFAFE' },
  action:    { icon: '⚙️', label: 'Action',     color: '#10B981', bg: '#D1FAE5' },
  catalog:   { icon: '🗂️', label: 'Catalog',   color: '#7C3AED', bg: '#EDE9FE' },
};

export interface FlowNodeDto {
  id: string; flowConfigurationId: string; nodeKey: string; nodeType: FlowNodeTypeValue;
  name: string; positionX: number; positionY: number; configurationJson: string | null;
  intentId: string | null; capabilityId: string | null; apiEndpointId: string | null;
  sortOrder: number; isEntryPoint: boolean;
}
export interface FlowConnectionDto {
  id: string; flowConfigurationId: string; fromNodeKey: string; toNodeKey: string;
  conditionLabel: string | null; sortOrder: number;
}
export interface FlowDto {
  id: string; tenantId: string; name: string; description: string | null; version: number;
  status: FlowStatusValue; isActive: boolean; createdVia: string; nodeCount: number;
  connectionCount: number; nodes: FlowNodeDto[]; connections: FlowConnectionDto[];
  llmConversationJson: string | null; activatedAt: string | null; createdAt?: string; updatedAt?: string | null;
}

export interface FlowGenerateRequest { Instruction: string; FlowName: string; }
export interface FlowChatRequest     { Message: string; }
export interface FlowSaveRequest {
  Name: string; Description?: string | null;
  Nodes: { NodeKey: string; NodeType: FlowNodeTypeValue; Name: string; PositionX: number; PositionY: number; ConfigurationJson: string; SortOrder: number; IsEntryPoint: boolean; IntentId?: string | null; CapabilityId?: string | null; ApiEndpointId?: string | null; }[];
  Connections: { FromNodeKey: string; ToNodeKey: string; ConditionLabel: string | null; SortOrder: number }[];
}
export interface LlmConversationEntry { role: 'user' | 'assistant'; content: string; }

export interface FlowNodeData extends Record<string, unknown> {
  label: string; nodeType: FlowNodeTypeValue; config: Record<string, unknown>;
  intentId: string | null; capabilityId: string | null; apiEndpointId: string | null;
  isEntryPoint: boolean; backendId: string;
  hasGap?: boolean;
  issueLevel?: 'critical' | 'warning' | 'suggestion' | null;
}

export const ExecutionStatus = { Completed: 1, CollectingParams: 2, HandledByGate: 3, Blocked: 4, IntentNotFound: 5, ApiError: 6, Error: 7 } as const;
export interface ServiceExecutionRequest  { SessionId: string; Message: string; }
export interface ServiceExecutionResponse {
  status: number; response: string; intentName: string | null; intentId: string | null;
  intentConfidence: number; detectionMethod: string; slotValues: Record<string, string>;
  apiCall: { success: boolean; statusCode: number; url: string; responseTimeMs: number } | null;
  metrics: { totalTimeMs: number; intentDetectionMs: number; slotFillingMs: number; apiCallMs: number; pipelinePath: string };
}
export interface MenuRenderRequest  { ParentIntentId: string | null; ChannelType: string; GreetingText?: string; }
export interface MenuRenderResponse {
  channelType: string;
  menu: { text: string; items: { label: string; value: string; intentId: string; icon: string; operationType: string; hasChildren: boolean; childCount: number }[]; menuType: string; showBackButton: boolean };
  formattedText: string; channelPayload: Record<string, unknown>;
}
export interface GoLiveChecklistResponse {
  isReady: boolean; overallStatus: string; requiredPassed: number; requiredTotal: number;
  items: { name: string; category: string; passed: boolean; detail: string; icon: string; fixAction: string | null; fixLink: string | null }[];
  channels: { channelType: string; isConnected: boolean; isLive: boolean; displayName: string }[];
}
export const ImportRowStatus = { Ready: 1, NeedsEnrichment: 2, Duplicate: 3, Invalid: 4, Enriched: 5, Approved: 6, Rejected: 7 } as const;
export type ImportRowStatusValue = (typeof ImportRowStatus)[keyof typeof ImportRowStatus];
export interface ImportRow {
  rowNumber: number; name: string; keywords: string | null; description?: string | null;
  operationType?: string | null; parentName?: string | null; status: ImportRowStatusValue;
  message: string; llmFilledFields: string[];
}
export interface ImportParseResponse  { fileName: string; format: string; totalRows: number; readyCount: number; needsEnrichmentCount: number; rows: ImportRow[]; }
export interface ImportParseRequest   { Content: string; Format: string; FileName: string; }
export interface ImportEnrichRequest  { Rows: ImportRow[]; }
export interface ImportConfirmRequest { ApprovedRows: ImportRow[]; }

export interface NodeGapResolution {
  hasApi?: boolean | null; apiEndpointUrl?: string; method?: 'GET' | 'POST';
  customMessage?: string | null; successMessage?: string; errorMessage?: string;
  followUpMessage?: string; skipped?: boolean;
}
export interface FlowValidationResult {
  flowId: string; flowName: string; healthScore: number; canDeploy: boolean;
  criticalCount: number; warningCount: number; suggestionCount: number; issues: FlowValidationIssue[];
}
export interface FlowValidationIssue {
  id: string; severity: 1 | 2 | 3; category: 0 | 1; title: string; description: string;
  affectedNodeKeys: string[]; badTransition: string | null; missingStep: string | null;
  suggestion: string; autoFixable: boolean; autoFixDescription: string | null;
}


export interface NegotiationPlaybook { trigger: string; moves: string[]; }
export interface BotSettings {
  maxDiscountPercent?: number | null;
  maxOrderAmount?: number | null;
  handoffOnComplaint?: boolean;
  handoffPhrases?: string[];
  handoffMessage?: string | null;
  negotiationPlaybooks?: NegotiationPlaybook[];
}
