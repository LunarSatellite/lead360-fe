// ═══════════════════════════════════════════════════════════════
// Intents Feature — Type Definitions (matches Swagger spec)
// Source: /api/v1/intents/*
// ═══════════════════════════════════════════════════════════════

// ─── IntentTrack (Swagger enum 1-3) ───

export const IntentTrack = {
  Manual: 1,
  LlmSuggested: 2,
  BulkImport: 3,
} as const;
export type IntentTrackValue = (typeof IntentTrack)[keyof typeof IntentTrack];

export const INTENT_TRACK_LABEL: Record<IntentTrackValue, string> = {
  [IntentTrack.Manual]: 'Manual Entry',
  [IntentTrack.LlmSuggested]: 'AI Suggested',
  [IntentTrack.BulkImport]: 'Bulk Import',
};

export const INTENT_TRACK_COLOR: Record<IntentTrackValue, 'brand' | 'info' | 'warning'> = {
  [IntentTrack.Manual]: 'brand',
  [IntentTrack.LlmSuggested]: 'info',
  [IntentTrack.BulkImport]: 'warning',
};

// ─── IntentOperationType (Swagger enum 1-8) ───

export const IntentOperationType = {
  ApiCall: 1,
  ProductSearch: 2,
  CategoryBrowse: 3,
  StaticResponse: 4,
  AgentHandoff: 5,
  MenuNavigation: 6,
  OutboundAction: 7,
  DomainConversation: 8,
} as const;
export type IntentOperationTypeValue = (typeof IntentOperationType)[keyof typeof IntentOperationType];

export const OPERATION_TYPE_LABEL: Record<IntentOperationTypeValue, string> = {
  [IntentOperationType.ApiCall]: 'API Call',
  [IntentOperationType.ProductSearch]: 'Product Search',
  [IntentOperationType.CategoryBrowse]: 'Category Browse',
  [IntentOperationType.StaticResponse]: 'Static Response',
  [IntentOperationType.AgentHandoff]: 'Agent Handoff',
  [IntentOperationType.MenuNavigation]: 'Menu Navigation',
  [IntentOperationType.OutboundAction]: 'Outbound Action',
  [IntentOperationType.DomainConversation]: 'AI Conversation',
};

export const OPERATION_TYPE_COLOR: Record<IntentOperationTypeValue, 'info' | 'success' | 'brand' | 'warning' | 'danger' | 'muted'> = {
  [IntentOperationType.ApiCall]: 'info',
  [IntentOperationType.ProductSearch]: 'success',
  [IntentOperationType.CategoryBrowse]: 'brand',
  [IntentOperationType.StaticResponse]: 'muted',
  [IntentOperationType.AgentHandoff]: 'danger',
  [IntentOperationType.MenuNavigation]: 'warning',
  [IntentOperationType.OutboundAction]: 'brand',
  [IntentOperationType.DomainConversation]: 'info',
};

export const OPERATION_TYPE_ICON: Record<IntentOperationTypeValue, string> = {
  [IntentOperationType.ApiCall]: 'Zap',
  [IntentOperationType.ProductSearch]: 'Search',
  [IntentOperationType.CategoryBrowse]: 'FolderTree',
  [IntentOperationType.StaticResponse]: 'FileText',
  [IntentOperationType.AgentHandoff]: 'UserCheck',
  [IntentOperationType.MenuNavigation]: 'Menu',
  [IntentOperationType.OutboundAction]: 'Send',
  [IntentOperationType.DomainConversation]: 'BrainCircuit',
};

// ─── IntentDto (GET /api/v1/intents/tenant/{tenantId}) ───

export interface IntentDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  track: IntentTrackValue;
  operationType: IntentOperationTypeValue;
  parentIntentId: string | null;
  parentIntentName: string | null;
  level: number;
  sortOrder: number;
  keywords: string | null;
  patternsJson: string | null;
  confidenceThreshold: number;
  apiEndpoint: string | null;
  apiMethod: string | null;
  apiParametersJson: string | null;
  searchScope: string | null;
  staticResponseText: string | null;
  handoffTarget: string | null;
  isActive: boolean;
  children: IntentDto[] | null;
  createdAt: string;
  updatedAt: string | null;
}

// ─── IntentCreateRequest (POST /api/v1/intents) ───

export interface IntentCreateRequest {
  tenantId: string;
  name: string;
  description?: string;
  track: IntentTrackValue;
  operationType: IntentOperationTypeValue;
  parentIntentId?: string | null;
  sortOrder?: number;
  keywords?: string;
  patternsJson?: string;
  confidenceThreshold?: number;
  apiEndpoint?: string;
  apiMethod?: string;
  apiParametersJson?: string;
  searchScope?: string;
  staticResponseText?: string;
  handoffTarget?: string;
}

// ─── IntentUpdateRequest (PUT /api/v1/intents/{id}) ───

export interface IntentUpdateRequest {
  name?: string;
  description?: string;
  operationType?: IntentOperationTypeValue;
  parentIntentId?: string | null;
  sortOrder?: number;
  keywords?: string;
  patternsJson?: string;
  confidenceThreshold?: number;
  apiEndpoint?: string;
  apiMethod?: string;
  apiParametersJson?: string;
  searchScope?: string;
  staticResponseText?: string;
  handoffTarget?: string;
  isActive?: boolean;
}
