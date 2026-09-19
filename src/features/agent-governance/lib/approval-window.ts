/**
 * The approval clock, as pure functions.
 *
 * The backend's shape, which this mirrors and does not reinterpret:
 *
 * - A proposal sits in `AwaitingApproval` with **no** expiry. Nothing is
 *   counting down yet; `approvalExpiresUtc` is null.
 * - Approving stamps a grant: `approvalGrantId` + `approvalExpiresUtc =
 *   now + ApprovalWindow(tier)` (Low 60 min, Medium 30, High 15, Critical 5).
 * - Execution consumes the grant (`approvalConsumedUtc`). A grant is single-use.
 * - If the clock runs out first, `execute` refuses with
 *   `governance.approval_expired` and nothing runs.
 *
 * So "time left" is only ever real for an action that is **Approved and not yet
 * executed**, and it is always the server's `approvalExpiresUtc` — never a
 * client-side estimate. For an item still awaiting approval we can only say how
 * long the window *will* be, which is the tier constant, labelled as such.
 */

import {
  ActionStatus,
  APPROVAL_WINDOW_MINUTES,
  HaltScope,
  type AgentHaltView,
  type GovernedAgentActionView,
} from '../types/governance.types';

export type ApprovalClock =
  /** Awaiting approval: no grant yet, so nothing is expiring. */
  | { kind: 'not-started'; windowMinutes: number }
  /** Approved, grant live: `msRemaining` counts down to the server's expiry. */
  | { kind: 'live'; msRemaining: number; windowMinutes: number; fractionLeft: number }
  /** Approved, grant lapsed on screen or before it loaded. Execution will refuse. */
  | { kind: 'expired'; expiredAtUtc: string }
  /** The grant was spent — the action ran (or tried to). */
  | { kind: 'consumed'; consumedAtUtc: string }
  /** Terminal or pre-grant states with no clock at all. */
  | { kind: 'none' };

export function approvalClock(action: GovernedAgentActionView, now: Date): ApprovalClock {
  const windowMinutes = APPROVAL_WINDOW_MINUTES[action.riskTier] ?? 0;

  if (action.approvalConsumedUtc) {
    return { kind: 'consumed', consumedAtUtc: action.approvalConsumedUtc };
  }

  if (action.status === ActionStatus.AwaitingApproval) {
    return { kind: 'not-started', windowMinutes };
  }

  if (action.status !== ActionStatus.Approved || !action.approvalExpiresUtc) {
    return { kind: 'none' };
  }

  const expiresAt = Date.parse(action.approvalExpiresUtc);
  if (Number.isNaN(expiresAt)) return { kind: 'none' };

  const msRemaining = expiresAt - now.getTime();
  if (msRemaining <= 0) {
    return { kind: 'expired', expiredAtUtc: action.approvalExpiresUtc };
  }

  const windowMs = windowMinutes * 60_000;
  return {
    kind: 'live',
    msRemaining,
    windowMinutes,
    fractionLeft: windowMs > 0 ? Math.min(1, msRemaining / windowMs) : 0,
  };
}

/**
 * How loudly the countdown should read. A Critical window is five minutes long,
 * so the thresholds are proportional to the window rather than absolute — one
 * minute left of five is not the same news as one minute left of sixty.
 */
export type ClockUrgency = 'calm' | 'closing' | 'last-minute' | 'gone';

export function clockUrgency(clock: ApprovalClock): ClockUrgency {
  if (clock.kind === 'expired') return 'gone';
  if (clock.kind !== 'live') return 'calm';
  if (clock.msRemaining <= 60_000) return 'last-minute';
  if (clock.fractionLeft <= 0.5) return 'closing';
  return 'calm';
}

/** `m:ss` under an hour, `h:mm:ss` above it. Zero-padded so the digits do not jump. */
export function formatTimeRemaining(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** One short line for the clock column. */
export function describeClock(clock: ApprovalClock): string {
  switch (clock.kind) {
    case 'not-started':
      return `Approving opens a ${clock.windowMinutes} min window`;
    case 'live':
      return `${formatTimeRemaining(clock.msRemaining)} left to run it`;
    case 'expired':
      return 'Window closed — approval expired';
    case 'consumed':
      return 'Approval used';
    case 'none':
      return 'No approval window';
  }
}

// ─── Halt matching ─────────────────────────────────────────────────────────

/**
 * Which engaged halt, if any, covers this action — Global first, then the
 * agent, then the capability, matching `AgentHaltSwitch.EvaluateAsync`. Scope
 * keys are stored lower-cased server-side.
 */
export function haltCovering(
  action: GovernedAgentActionView,
  halts: readonly AgentHaltView[],
): AgentHaltView | null {
  const engaged = halts.filter((h) => h.isEngaged);
  return (
    engaged.find((h) => h.scope === HaltScope.Global) ??
    engaged.find(
      (h) => h.scope === HaltScope.Agent && h.scopeKey === action.requestingAgent.toLowerCase(),
    ) ??
    engaged.find(
      (h) => h.scope === HaltScope.Capability && h.scopeKey === action.actionKey.toLowerCase(),
    ) ??
    null
  );
}

// ─── What a reviewer may actually do, right now ────────────────────────────

export type Availability = { enabled: true } | { enabled: false; reason: string };

export interface ActionAvailability {
  approve: Availability;
  reject: Availability;
  execute: Availability;
}

const BLOCKED = (reason: string): Availability => ({ enabled: false, reason });
const OPEN: Availability = { enabled: true };

/**
 * The gate in front of every control. It exists so a reviewer is never offered a
 * click that the server is already certain to refuse — the on-screen expiry of a
 * Critical window is the case that matters, but a consumed grant, a halt and a
 * wrong-state transition are all decided here too.
 *
 * Note the asymmetry the backend deliberately keeps: **reject stays open during
 * a halt**, because stopping the agents must not also trap their queue.
 */
export function actionAvailability(
  action: GovernedAgentActionView,
  now: Date,
  halts: readonly AgentHaltView[] = [],
): ActionAvailability {
  const clock = approvalClock(action, now);
  const halt = haltCovering(action, halts);
  const haltReason = halt ? 'An emergency stop covering this action is engaged.' : null;

  const awaiting = action.status === ActionStatus.AwaitingApproval;
  const approved = action.status === ActionStatus.Approved;

  const approve: Availability = !awaiting
    ? BLOCKED(`Only an action awaiting approval can be approved (this one is ${statusWord(action)}).`)
    : haltReason
      ? BLOCKED(haltReason)
      : OPEN;

  // Reject is allowed while halted, and for Approved-but-unrun actions too.
  const reject: Availability =
    awaiting || approved
      ? OPEN
      : BLOCKED(`Only an action awaiting approval or approved can be rejected (this one is ${statusWord(action)}).`);

  let execute: Availability;
  if (!approved) {
    execute = BLOCKED(`Only an approved action can be run (this one is ${statusWord(action)}).`);
  } else if (clock.kind === 'consumed') {
    execute = BLOCKED('This approval has already been used — an approval is single-use.');
  } else if (clock.kind === 'expired') {
    execute = BLOCKED('The approval window has closed. Running it now would be refused.');
  } else if (haltReason) {
    execute = BLOCKED(haltReason);
  } else {
    execute = OPEN;
  }

  return { approve, reject, execute };
}

function statusWord(action: GovernedAgentActionView): string {
  switch (action.status) {
    case ActionStatus.AwaitingApproval:
      return 'awaiting approval';
    case ActionStatus.Approved:
      return 'approved';
    case ActionStatus.Rejected:
      return 'rejected';
    case ActionStatus.Executing:
      return 'executing';
    case ActionStatus.Executed:
      return 'executed';
    case ActionStatus.Failed:
      return 'failed';
    case ActionStatus.RollingBack:
      return 'rolling back';
    case ActionStatus.RolledBack:
      return 'rolled back';
    case ActionStatus.RollbackFailed:
      return 'in rollback failure';
    default:
      return 'in another state';
  }
}
