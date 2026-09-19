/**
 * Types for the governed agent action surface
 * (`v1/admin/agent-actions/*` on the Stylemint admin API, reached through the
 * Lead360 operator pass-through).
 *
 * The wire format is camelCase with **integer enums** — the host registers no
 * `JsonStringEnumConverter`, so `status`, `riskTier` and `scope` all arrive as
 * numbers. Enums are therefore modelled the way this repo already models wire
 * enums (see `features/agents/types/agents.types.ts`): a `const` object of
 * numeric values plus `_LABEL` maps.
 *
 * Nothing here is computed. Every field is projected from
 * `GovernedAgentActionView` / `AgentHaltView` exactly as the server returns it.
 */

// ─── Status ────────────────────────────────────────────────────────────────

export const ActionStatus = {
  AwaitingApproval: 1,
  Approved: 2,
  Rejected: 3,
  Executing: 4,
  Executed: 5,
  Failed: 6,
  RollingBack: 7,
  RolledBack: 8,
  RollbackFailed: 9,
} as const;

export type ActionStatusValue = (typeof ActionStatus)[keyof typeof ActionStatus];

export const ACTION_STATUS_LABEL: Record<ActionStatusValue, string> = {
  [ActionStatus.AwaitingApproval]: 'Awaiting approval',
  [ActionStatus.Approved]: 'Approved, not yet run',
  [ActionStatus.Rejected]: 'Rejected',
  [ActionStatus.Executing]: 'Executing',
  [ActionStatus.Executed]: 'Executed',
  [ActionStatus.Failed]: 'Failed',
  [ActionStatus.RollingBack]: 'Rolling back',
  [ActionStatus.RolledBack]: 'Rolled back',
  [ActionStatus.RollbackFailed]: 'Rollback failed',
};

// ─── Risk tier ─────────────────────────────────────────────────────────────
// Derived server-side from the action key. Never an input: the propose
// endpoint refuses a caller-supplied tier with `governance.risk_tier_caller_supplied`.

export const RiskTier = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
} as const;

export type RiskTierValue = (typeof RiskTier)[keyof typeof RiskTier];

export const RISK_TIER_LABEL: Record<RiskTierValue, string> = {
  [RiskTier.Low]: 'Low',
  [RiskTier.Medium]: 'Medium',
  [RiskTier.High]: 'High',
  [RiskTier.Critical]: 'Critical',
};

/**
 * `GovernedAgentAction.ApprovalWindow(tier)` — the life of an approval grant,
 * in minutes, stamped server-side at the moment of approval. Mirrored here only
 * so the queue can tell a reviewer how long a window *will* be before they open
 * it; every live countdown is driven by the server's `approvalExpiresUtc`.
 */
export const APPROVAL_WINDOW_MINUTES: Record<RiskTierValue, number> = {
  [RiskTier.Low]: 60,
  [RiskTier.Medium]: 30,
  [RiskTier.High]: 15,
  [RiskTier.Critical]: 5,
};

// ─── Halt scope ────────────────────────────────────────────────────────────

export const HaltScope = {
  Global: 1,
  Agent: 2,
  Capability: 3,
} as const;

export type HaltScopeValue = (typeof HaltScope)[keyof typeof HaltScope];

export const HALT_SCOPE_LABEL: Record<HaltScopeValue, string> = {
  [HaltScope.Global]: 'Every agent, every capability',
  [HaltScope.Agent]: 'One agent',
  [HaltScope.Capability]: 'One capability',
};

// ─── Views ─────────────────────────────────────────────────────────────────

/** `GovernedAgentActionView`. `approvalScopeFingerprint` is deliberately not projected by the API. */
export interface GovernedAgentActionView {
  id: string;
  actionKey: string;
  requestingAgent: string;
  targetKind: string;
  targetId: string;
  riskTier: RiskTierValue;
  status: ActionStatusValue;
  previewJson: string;
  requestPayloadJson: string;
  executionReceiptJson: string | null;
  rollbackReceiptJson: string | null;
  failureReason: string | null;
  requestedByAccountId: string;
  approvedByAccountId: string | null;
  requestedUtc: string;
  decidedUtc: string | null;
  executedUtc: string | null;
  rolledBackUtc: string | null;
  approvalGrantId: string | null;
  approvalExpiresUtc: string | null;
  approvalConsumedUtc: string | null;
}

/** `AgentHaltView`. Rows are never deleted — a cleared halt stays, with its clearing recorded. */
export interface AgentHaltView {
  id: string;
  scope: HaltScopeValue;
  scopeKey: string;
  isEngaged: boolean;
  reason: string;
  engagedByAccountId: string;
  engagedUtc: string;
  clearedByAccountId: string | null;
  clearedUtc: string | null;
  clearedReason: string | null;
  voidedApprovalCount: number;
}

/** `ErrorResponseVm` — the admin surface's failure body. */
export interface GovernanceErrorBody {
  type?: string;
  title?: string;
  status?: number;
  errorCode?: string;
  field?: string | null;
  correlationId?: string;
  errors?: Array<{ field: string; code: string; message: string }> | null;
}
