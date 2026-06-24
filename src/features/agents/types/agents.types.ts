// ═══════════════════════════════════════════════════════════════
// Agents Feature — Type Definitions (matches backend spec)
// Source: /api/v1/agents/*  + builder-chat AgentCreated inline card
//
// Convention: enums are const objects (NOT TS `enum`) per project style.
// Each enum exports:
//   - the const map
//   - {Name}Value union type
//   - {NAME}_LABEL  user-facing string map
//   - {NAME}_COLOR  StatusBadge variant map (where it makes sense)
//
// Note on wire format: the CRUD endpoints (/v1/agents/*) serialise
// enums as NUMBERS (matches the const values below). The
// `AgentCreated` inline card delivered through the chat tool path
// serialises them as STRINGS — those are typed separately at the
// bottom of this file and converted before use.
// ═══════════════════════════════════════════════════════════════

// ─── AgentType ─────────────────────────────────────────────────

export const AgentType = {
  Approval: 1,
  Notification: 2,
  Escalation: 3,
  DataCollection: 4,
  Reminder: 5,
  Fulfillment: 6,
} as const;
export type AgentTypeValue = (typeof AgentType)[keyof typeof AgentType];

export const AGENT_TYPE_LABEL: Record<AgentTypeValue, string> = {
  [AgentType.Approval]: 'Approval',
  [AgentType.Notification]: 'Notification',
  [AgentType.Escalation]: 'Escalation',
  [AgentType.DataCollection]: 'Data collection',
  [AgentType.Reminder]: 'Reminder',
  [AgentType.Fulfillment]: 'Fulfillment',
};

// V1 only ships Approval + Notification — others are stubs.
// Editor modal (Slice 2) greys these out as "Coming soon".
export const AGENT_TYPE_AVAILABLE: Record<AgentTypeValue, boolean> = {
  [AgentType.Approval]: true,
  [AgentType.Notification]: true,
  [AgentType.Escalation]: false,
  [AgentType.DataCollection]: false,
  [AgentType.Reminder]: false,
  [AgentType.Fulfillment]: false,
};

// ─── AgentTriggerKind ──────────────────────────────────────────

export const AgentTriggerKind = {
  Manual: 1,
  IntentMatched: 2,
  FlowNodeReached: 3,
  CustomerReply: 4,
  Threshold: 5,
  Scheduled: 6,
} as const;
export type AgentTriggerKindValue = (typeof AgentTriggerKind)[keyof typeof AgentTriggerKind];

export const AGENT_TRIGGER_KIND_LABEL: Record<AgentTriggerKindValue, string> = {
  [AgentTriggerKind.Manual]: 'Manual',
  [AgentTriggerKind.IntentMatched]: 'Intent matched',
  [AgentTriggerKind.FlowNodeReached]: 'Flow node reached',
  [AgentTriggerKind.CustomerReply]: 'Customer reply',
  [AgentTriggerKind.Threshold]: 'Threshold',
  [AgentTriggerKind.Scheduled]: 'Scheduled',
};

// Helper sentence shown under each option in the editor's trigger select.
export const AGENT_TRIGGER_KIND_HINT: Record<AgentTriggerKindValue, string> = {
  [AgentTriggerKind.Manual]: 'Fired by hand from the admin UI or chat.',
  [AgentTriggerKind.IntentMatched]: 'When a specific customer intent fires.',
  [AgentTriggerKind.FlowNodeReached]: 'When the flow runner enters a node.',
  [AgentTriggerKind.CustomerReply]: 'On any reply from the customer.',
  [AgentTriggerKind.Threshold]: 'When a value crosses a limit.',
  [AgentTriggerKind.Scheduled]: 'On a recurring schedule.',
};

// ─── AgentTargetKind ───────────────────────────────────────────

export const AgentTargetKind = {
  User: 1,
  Role: 2,
  Email: 3,
  Webhook: 4, // backend enum-valid but not wired in v1
  Channel: 5, // backend enum-valid but not wired in v1
} as const;
export type AgentTargetKindValue = (typeof AgentTargetKind)[keyof typeof AgentTargetKind];

export const AGENT_TARGET_KIND_LABEL: Record<AgentTargetKindValue, string> = {
  [AgentTargetKind.User]: 'Specific user',
  [AgentTargetKind.Role]: 'Role',
  [AgentTargetKind.Email]: 'Email address',
  [AgentTargetKind.Webhook]: 'Webhook',
  [AgentTargetKind.Channel]: 'Channel',
};

export const AGENT_TARGET_KIND_AVAILABLE: Record<AgentTargetKindValue, boolean> = {
  [AgentTargetKind.User]: true,
  [AgentTargetKind.Role]: true,
  [AgentTargetKind.Email]: true,
  [AgentTargetKind.Webhook]: false,
  [AgentTargetKind.Channel]: false,
};

// ─── AgentRunStatus ────────────────────────────────────────────

export const AgentRunStatus = {
  Pending: 1,
  InProgress: 2, // approval: waiting on a human
  Completed: 3,
  Failed: 4,
  Expired: 5,
  Cancelled: 6,
} as const;
export type AgentRunStatusValue = (typeof AgentRunStatus)[keyof typeof AgentRunStatus];

export const AGENT_RUN_STATUS_LABEL: Record<AgentRunStatusValue, string> = {
  [AgentRunStatus.Pending]: 'Pending',
  [AgentRunStatus.InProgress]: 'Awaiting response',
  [AgentRunStatus.Completed]: 'Completed',
  [AgentRunStatus.Failed]: 'Failed',
  [AgentRunStatus.Expired]: 'Expired',
  [AgentRunStatus.Cancelled]: 'Cancelled',
};

// Maps to StatusBadge variants (project convention).
export const AGENT_RUN_STATUS_COLOR: Record<
  AgentRunStatusValue,
  'muted' | 'warning' | 'success' | 'danger' | 'info' | 'brand'
> = {
  [AgentRunStatus.Pending]: 'muted',
  [AgentRunStatus.InProgress]: 'warning',
  [AgentRunStatus.Completed]: 'success',
  [AgentRunStatus.Failed]: 'danger',
  [AgentRunStatus.Expired]: 'warning',
  [AgentRunStatus.Cancelled]: 'muted',
};

// A run is "terminal" when it can no longer be approved/rejected/cancelled.
// Used by the landing page to short-circuit before showing the confirm UI,
// and by the run drawer to hide override/cancel actions.
export const TERMINAL_RUN_STATUSES: ReadonlySet<AgentRunStatusValue> = new Set([
  AgentRunStatus.Completed,
  AgentRunStatus.Failed,
  AgentRunStatus.Expired,
  AgentRunStatus.Cancelled,
]);

export function isTerminalRunStatus(s: AgentRunStatusValue): boolean {
  return TERMINAL_RUN_STATUSES.has(s);
}

// ─── ApprovalDecision ──────────────────────────────────────────

export const ApprovalDecision = {
  Approved: 1,
  Rejected: 2,
} as const;
export type ApprovalDecisionValue = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];

export const APPROVAL_DECISION_LABEL: Record<ApprovalDecisionValue, string> = {
  [ApprovalDecision.Approved]: 'Approve',
  [ApprovalDecision.Rejected]: 'Reject',
};

// Parse the email link's `?decision=approve|reject` query param into a
// numeric decision value. Returns null for missing/garbage input —
// caller should fall back to letting the user pick on-page.
export function parseDecisionParam(raw: string | null): ApprovalDecisionValue | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === 'approve' || v === 'approved' || v === '1') return ApprovalDecision.Approved;
  if (v === 'reject' || v === 'rejected' || v === '2') return ApprovalDecision.Rejected;
  return null;
}

// ─── AgentRunEventType ─────────────────────────────────────────

export const AgentRunEventType = {
  Created: 1,
  Notified: 2,
  Viewed: 3,
  Approved: 4,
  Rejected: 5,
  Expired: 6,
  Cancelled: 7,
  Failed: 8,
  Overridden: 9,
} as const;
export type AgentRunEventTypeValue = (typeof AgentRunEventType)[keyof typeof AgentRunEventType];

export const AGENT_RUN_EVENT_TYPE_LABEL: Record<AgentRunEventTypeValue, string> = {
  [AgentRunEventType.Created]: 'Created',
  [AgentRunEventType.Notified]: 'Notified',
  [AgentRunEventType.Viewed]: 'Viewed',
  [AgentRunEventType.Approved]: 'Approved',
  [AgentRunEventType.Rejected]: 'Rejected',
  [AgentRunEventType.Expired]: 'Expired',
  [AgentRunEventType.Cancelled]: 'Cancelled',
  [AgentRunEventType.Failed]: 'Failed',
  [AgentRunEventType.Overridden]: 'Overridden by admin',
};

// ─── DTOs (mirror backend shapes from spec §3) ─────────────────

export interface AgentDto {
  id: string;
  tenantId: string;
  botId?: string | null;
  name: string;
  description?: string | null;
  agentType: AgentTypeValue;
  triggerKind: AgentTriggerKindValue;
  triggerJson?: string | null;
  targetKind: AgentTargetKindValue;
  targetRef?: string | null;
  configJson?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AgentDetailDto extends AgentDto {
  recentRuns: AgentRunDto[];
}

export interface AgentRunDto {
  id: string;
  tenantId: string;
  agentId: string;
  sessionId?: string | null;
  triggeredByUserId?: string | null;
  status: AgentRunStatusValue;
  triggerPayloadJson?: string | null;
  resultJson?: string | null;
  summary?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  expiresAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  approval?: AgentRunApprovalDto | null;
}

export interface AgentRunDetailDto extends AgentRunDto {
  events: AgentRunEventDto[];
}

export interface AgentRunApprovalDto {
  id: string;
  agentRunId: string;
  approverUserId?: string | null;
  approverEmail?: string | null;
  expiresAt: string;
  respondedAt?: string | null;
  responseNote?: string | null;
  decision?: ApprovalDecisionValue | null;
  overrideUsed: boolean;
  respondedByUserId?: string | null;
}

export interface AgentRunEventDto {
  id: string;
  agentRunId: string;
  eventType: AgentRunEventTypeValue;
  actorUserId?: string | null;
  ipAddress?: string | null;
  detail?: string | null;
  createdAt: string;
}

// ─── Request bodies ─────────────────────────────────────────────

export interface CreateAgentRequest {
  name: string;
  description?: string;
  botId?: string;
  agentType: AgentTypeValue;
  triggerKind: AgentTriggerKindValue;
  triggerJson?: string;
  targetKind: AgentTargetKindValue;
  targetRef?: string;
  configJson?: string;
  enabled?: boolean;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  triggerKind?: AgentTriggerKindValue;
  triggerJson?: string;
  targetKind?: AgentTargetKindValue;
  targetRef?: string;
  configJson?: string;
  enabled?: boolean;
}

export interface FireAgentRequest {
  sessionId?: string;
  summary?: string;
  triggerPayloadJson?: string;
  expiresInHours?: number;
}

export interface RespondToRunRequest {
  /**
   * REQUIRED for the email-link approver path.
   * OMIT for the admin-override path (server checks Owner/Admin role on JWT).
   */
  token?: string;
  decision: ApprovalDecisionValue;
  note?: string;
}

export interface CancelRunRequest {
  reason?: string;
}

// ─── Filters for the runs feed ─────────────────────────────────

export interface AgentRunListFilters {
  agentId?: string;
  sessionId?: string;
  status?: AgentRunStatusValue;
  /** ISO datetime — runs with createdAt >= since */
  since?: string;
  /** Page size, default 50 backend-side. */
  take?: number;
}

// ─── AgentCreated inline card (chat builder) ───────────────────
// IMPORTANT: this card uses STRING enum values, not the numeric
// values used by /v1/agents/* DTOs. See header comment at top.
// Render this in ChatPage's InlineCardRenderer switch.

export type AgentTypeName =
  | 'Approval'
  | 'Notification'
  | 'Escalation'
  | 'DataCollection'
  | 'Reminder'
  | 'Fulfillment';

export type AgentTriggerKindName =
  | 'Manual'
  | 'IntentMatched'
  | 'FlowNodeReached'
  | 'CustomerReply'
  | 'Threshold'
  | 'Scheduled';

export type AgentTargetKindName =
  | 'User'
  | 'Role'
  | 'Email'
  | 'Webhook'
  | 'Channel';

export interface AgentCreatedCard {
  type: 'AgentCreated';
  id: string;
  name: string;
  description?: string | null;
  agentType: AgentTypeName;
  triggerKind: AgentTriggerKindName;
  targetKind: AgentTargetKindName;
  targetRef?: string | null;
  enabled: boolean;
}

// Convert the card's string enums into the numeric values the rest of
// the feature uses. Used by the inline card's [Disable] button when it
// calls useUpdateAgent (which doesn't actually need these — but kept for
// the upcoming editor open-from-card path in Slice 2).
export const AGENT_TYPE_FROM_NAME: Record<AgentTypeName, AgentTypeValue> = {
  Approval: AgentType.Approval,
  Notification: AgentType.Notification,
  Escalation: AgentType.Escalation,
  DataCollection: AgentType.DataCollection,
  Reminder: AgentType.Reminder,
  Fulfillment: AgentType.Fulfillment,
};

export const AGENT_TRIGGER_KIND_FROM_NAME: Record<AgentTriggerKindName, AgentTriggerKindValue> = {
  Manual: AgentTriggerKind.Manual,
  IntentMatched: AgentTriggerKind.IntentMatched,
  FlowNodeReached: AgentTriggerKind.FlowNodeReached,
  CustomerReply: AgentTriggerKind.CustomerReply,
  Threshold: AgentTriggerKind.Threshold,
  Scheduled: AgentTriggerKind.Scheduled,
};

export const AGENT_TARGET_KIND_FROM_NAME: Record<AgentTargetKindName, AgentTargetKindValue> = {
  User: AgentTargetKind.User,
  Role: AgentTargetKind.Role,
  Email: AgentTargetKind.Email,
  Webhook: AgentTargetKind.Webhook,
  Channel: AgentTargetKind.Channel,
};
