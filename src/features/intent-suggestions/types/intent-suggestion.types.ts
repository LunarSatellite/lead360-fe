import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// P2-018: Intent Suggestions — Types + Schemas
// ═══════════════════════════════════════════════════════════════

export const SuggestionStatus = {
  Pending: 1, Approved: 2, Modified: 3, Rejected: 4,
} as const;
export type SuggestionStatusValue = (typeof SuggestionStatus)[keyof typeof SuggestionStatus];

export const SUGGESTION_STATUS_LABEL: Record<SuggestionStatusValue, string> = {
  1: 'Pending', 2: 'Approved', 3: 'Modified', 4: 'Rejected',
};
export const SUGGESTION_STATUS_COLOR: Record<SuggestionStatusValue, 'warning' | 'success' | 'info' | 'danger'> = {
  1: 'warning', 2: 'success', 3: 'info', 4: 'danger',
};

export const OPERATION_TYPE_COLOR: Record<string, 'info' | 'success' | 'muted' | 'danger' | 'brand' | 'warning'> = {
  ApiCall: 'info', ProductSearch: 'success', StaticResponse: 'muted',
  AgentHandoff: 'danger', MenuNavigation: 'brand', CategoryBrowse: 'warning',
  OutboundAction: 'brand', DomainConversation: 'info',
};

export interface SuggestionBatchDto {
  batchId: string;
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  suggestions: SuggestionDto[];
}

export interface SuggestionDto {
  id: string;
  name: string;
  description: string;
  keywords: string;
  operationType: string;
  apiEndpoint: string;
  apiMethod: string;
  parentIntentName: string | null;
  suggestedLevel: number;
  sortOrder: number;
  confidenceScore: number;
  reasoning: string;
  category: string;
  status: SuggestionStatusValue;
  approvedIntentId: string | null;
}

export interface ApproveRequest {
  name?: string;
  description?: string;
  keywords?: string;
  operationType?: string;
  parentIntentId?: string;
}

export interface RejectRequest {
  reason?: string;
}

// ─── Zod ───

export const approveSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  keywords: z.string().max(2000).optional().or(z.literal('')),
  operationType: z.string().optional(),
  parentIntentId: z.string().optional().or(z.literal('')),
});
export type ApproveFormData = z.infer<typeof approveSchema>;

export const rejectSchema = z.object({
  reason: z.string().max(500).optional().or(z.literal('')),
});
export type RejectFormData = z.infer<typeof rejectSchema>;
