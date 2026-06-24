// ═══════════════════════════════════════════════════════════════
// Tenant Feature — Types (from swagger TenantDto)
// ═══════════════════════════════════════════════════════════════

export const TenantStatus = { Onboarding: 1, Active: 2, Suspended: 3, Deactivated: 4 } as const;
export type TenantStatusValue = (typeof TenantStatus)[keyof typeof TenantStatus];
export const TENANT_STATUS_LABEL: Record<TenantStatusValue, string> = { 1: 'Onboarding', 2: 'Active', 3: 'Suspended', 4: 'Deactivated' };
export const TENANT_STATUS_COLOR: Record<TenantStatusValue, 'warning' | 'success' | 'danger' | 'muted'> = { 1: 'warning', 2: 'success', 3: 'danger', 4: 'muted' };

export const ApiHealthStatus = { Unknown: 1, Healthy: 2, Degraded: 3, Down: 4 } as const;
export type ApiHealthStatusValue = (typeof ApiHealthStatus)[keyof typeof ApiHealthStatus];

export const BusinessType = { Ecommerce: 1, Service: 2, Hybrid: 3 } as const;
export type BusinessTypeValue = (typeof BusinessType)[keyof typeof BusinessType];
export const BUSINESS_TYPE_LABEL: Record<BusinessTypeValue, string> = { 1: 'E-Commerce', 2: 'Service', 3: 'Hybrid' };

export const LlmProvider = { OpenAI: 1, Anthropic: 2, DeepSeek: 3, Google: 4, Local: 5 } as const;
export type LlmProviderValue = (typeof LlmProvider)[keyof typeof LlmProvider];

export const EmbeddingProvider = { OpenAI: 1, Cohere: 2, Local: 3 } as const;
export type EmbeddingProviderValue = (typeof EmbeddingProvider)[keyof typeof EmbeddingProvider];

export const ConversationMode = { Chat: 1, Menu: 2 } as const;
export type ConversationModeValue = (typeof ConversationMode)[keyof typeof ConversationMode];

export interface TenantDto {
  id: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
  name: string | null;
  description: string | null;
  businessType: BusinessTypeValue;
  industry: string | null;
  domainScope: string | null;
  status: TenantStatusValue;
  apiBaseUrl: string | null;
  apiAuthType: string | null;
  openApiSpecUrl: string | null;
  apiHealthStatus: ApiHealthStatusValue;
  lastApiHealthCheck: string | null;
  defaultLlmProvider: LlmProviderValue;
  defaultEmbeddingProvider: EmbeddingProviderValue;
  monthlyTokenBudget: number | null;
  tokensUsedThisMonth: number;
  defaultConversationMode: ConversationModeValue;
  sessionTimeoutMinutes: number;
  complianceProfile: string | null;
  catalogSyncSchedule: string | null;
  lastCatalogSync: string | null;
}

export interface TenantCreateRequest {
  name: string;
  description?: string | null;
  businessType: BusinessTypeValue;
  industry: string;
  domainScope?: string | null;
  apiBaseUrl?: string | null;
  apiAuthType?: string | null;
  openApiSpecUrl?: string | null;
  defaultLlmProvider?: LlmProviderValue;
  defaultConversationMode?: ConversationModeValue;
  complianceProfile?: string | null;
}

export interface TenantUpdateRequest {
  name?: string | null;
  description?: string | null;
  domainScope?: string | null;
  apiBaseUrl?: string | null;
  apiAuthType?: string | null;
  defaultLlmProvider?: LlmProviderValue;
  defaultConversationMode?: ConversationModeValue;
  monthlyTokenBudget?: number | null;
  sessionTimeoutMinutes?: number | null;
  complianceProfile?: string | null;
  catalogSyncSchedule?: string | null;
}

export interface TenantStatsByStatus {
  Onboarding: number;
  Active: number;
  Suspended: number;
  Deactivated: number;
}
