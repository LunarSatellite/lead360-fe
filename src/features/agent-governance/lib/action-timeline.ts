/**
 * The audit trail this console can honestly show.
 *
 * The backend writes a full evidence log — `GovernedAgentActionEvent`, 28 event
 * kinds, including the refused and escalation attempts (`AgentGrantDenied`,
 * `AgentIdentityCallerSupplied`, `ApprovalReused`, `HaltVoidedApproval`…) —
 * and `IGovernedAgentActionRepository.ListEventsAsync` reads it. **Nothing
 * exposes it over HTTP**: the controller has no history route. So the timeline
 * below is assembled strictly from the timestamps and outcomes that
 * `GovernedAgentActionView` does return, and the page says plainly that the
 * server-side event log exists and is not readable from here yet. Inventing the
 * missing entries would be worse than naming the gap.
 */

import {
  ActionStatus,
  ACTION_STATUS_LABEL,
  type GovernedAgentActionView,
} from '../types/governance.types';

export interface TimelineEntry {
  /** ISO timestamp from the server. */
  at: string;
  label: string;
  detail?: string;
  tone: 'neutral' | 'good' | 'bad';
}

export function buildActionTimeline(action: GovernedAgentActionView): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      at: action.requestedUtc,
      label: 'Proposed',
      detail: `${action.requestingAgent} asked to run ${action.actionKey} against ${action.targetKind}/${action.targetId}. Requested under account ${action.requestedByAccountId}.`,
      tone: 'neutral',
    },
  ];

  if (action.decidedUtc) {
    const rejected = action.status === ActionStatus.Rejected;
    entries.push({
      at: action.decidedUtc,
      label: rejected ? 'Rejected' : 'Approved',
      detail: action.approvedByAccountId
        ? `Decided by account ${action.approvedByAccountId}.`
        : undefined,
      tone: rejected ? 'bad' : 'good',
    });
  }

  if (action.approvalExpiresUtc) {
    entries.push({
      at: action.approvalExpiresUtc,
      label: 'Approval window closes',
      detail: action.approvalGrantId
        ? `Grant ${action.approvalGrantId}, single use.`
        : 'The grant has been cleared — a halt voids approvals in its scope.',
      tone: 'neutral',
    });
  }

  if (action.approvalConsumedUtc) {
    entries.push({
      at: action.approvalConsumedUtc,
      label: 'Approval consumed',
      detail: 'The grant was spent when execution started. It cannot be used again.',
      tone: 'neutral',
    });
  }

  if (action.executedUtc) {
    const failed = action.status === ActionStatus.Failed;
    entries.push({
      at: action.executedUtc,
      label: failed ? 'Execution failed' : 'Executed',
      detail: action.failureReason ?? undefined,
      tone: failed ? 'bad' : 'good',
    });
  }

  if (action.rolledBackUtc) {
    entries.push({
      at: action.rolledBackUtc,
      label:
        action.status === ActionStatus.RollbackFailed ? 'Rollback failed' : 'Rolled back',
      tone: action.status === ActionStatus.RollbackFailed ? 'bad' : 'neutral',
    });
  }

  return entries.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/** One line summarising where the action stands now. */
export function currentStanding(action: GovernedAgentActionView): string {
  const label = ACTION_STATUS_LABEL[action.status] ?? `Status ${action.status}`;
  return action.failureReason ? `${label} — ${action.failureReason}` : label;
}

// ─── Refusals seen in this console ─────────────────────────────────────────

export interface SessionRefusal {
  actionId: string;
  at: string;
  errorCode: string;
  message: string;
  attempted: 'approve' | 'reject' | 'execute';
}

const sessionRefusals: SessionRefusal[] = [];

/**
 * Records a refusal this browser session saw. This is **not** the server's
 * audit log — it is what this console attempted and was told no about, kept so
 * a reviewer can see their own refused attempt in context. It is labelled as
 * such wherever it is rendered, and it disappears on reload.
 */
export function recordSessionRefusal(entry: SessionRefusal): void {
  sessionRefusals.unshift(entry);
  if (sessionRefusals.length > 50) sessionRefusals.length = 50;
}

export function sessionRefusalsFor(actionId: string): SessionRefusal[] {
  return sessionRefusals.filter((entry) => entry.actionId === actionId);
}

export function clearSessionRefusals(): void {
  sessionRefusals.length = 0;
}
