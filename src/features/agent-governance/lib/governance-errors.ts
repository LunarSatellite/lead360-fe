/**
 * Governance refusals, told apart.
 *
 * The backend spends real effort distinguishing three ways an approval can stop
 * being good, and returns a different `errorCode` for each. They are not three
 * flavours of "something went wrong": they call for three different next moves
 * by three different people. Collapsing them into one toast throws away the
 * distinction the service was built to make, so each one gets its own heading,
 * its own explanation and its own next step here.
 *
 * Every `governance.*` code comes back as HTTP 400 (`StatusCodeFor` falls
 * through to 400 for the whole namespace), so the UI must branch on
 * `errorCode`, never on the status.
 */

export type RecoveryAction =
  | { kind: 'propose-again' }
  | { kind: 'refresh' }
  | { kind: 're-read' }
  | { kind: 'none' };

export interface GovernanceRefusal {
  /** Heading — says what happened, not "Error". */
  title: string;
  /** What it means, in the reviewer's terms. */
  body: string;
  /** The one thing to do next. */
  nextStep: string;
  /** Which affordance the notice should offer, if any. */
  recovery: RecoveryAction;
  tone: 'danger' | 'warning' | 'info';
  /** Echoed so an operator can quote it to an engineer. */
  errorCode: string;
}

const REFUSALS: Record<string, Omit<GovernanceRefusal, 'errorCode'>> = {
  // ── The three that must never read alike ────────────────────────────────
  'governance.approval_expired': {
    title: 'The approval window closed before this ran',
    body: 'Approvals are time-boxed by risk tier — Critical lasts five minutes, High fifteen, Medium thirty, Low sixty — and this one lapsed. Nothing was executed and nothing is half-done: the action stopped at the gate.',
    nextStep: 'Propose the action again to start a fresh review and a new window.',
    recovery: { kind: 'propose-again' },
    tone: 'warning',
  },
  'governance.approval_already_used': {
    title: 'Someone has already acted on this',
    body: 'An approval is single-use, and this grant was consumed before your click landed. Another reviewer approved and ran this action — your decision is not what is being recorded here.',
    nextStep: 'Refresh the record to see who decided it, when, and what the outcome was. Do not approve it again until you have read that.',
    recovery: { kind: 'refresh' },
    tone: 'info',
  },
  'governance.approval_scope_changed': {
    title: 'This is not the action you reviewed',
    body: 'The payload or the server-derived risk tier changed after the approval was granted, so the approval fingerprint no longer matches. What would run now is not what was read and agreed to.',
    nextStep: 'Re-read the proposal in full before approving it again. The change is the thing to look at, not an obstacle to clear.',
    recovery: { kind: 're-read' },
    tone: 'danger',
  },

  // ── The rest of the governance namespace ────────────────────────────────
  'governance.agent_actions_halted': {
    title: 'An emergency stop is engaged',
    body: 'A halt covering this agent or capability is currently engaged, so the governance service is refusing to approve or run agent actions in its scope. Rejecting is still allowed.',
    nextStep: 'Open the emergency stop to see its scope, who engaged it and why. Clearing it is SuperAdmin only.',
    recovery: { kind: 'refresh' },
    tone: 'warning',
  },
  'governance.halt_not_authorized': {
    title: 'Your role cannot do that to the emergency stop',
    body: 'Engaging is open to SuperAdmin, PayoutsOps and ContentMod. Clearing is SuperAdmin alone — deliberately narrower than engaging, so a stop is easy to pull and hard to undo.',
    nextStep: 'Ask a SuperAdmin to clear it. Do not retry — the answer will not change.',
    recovery: { kind: 'none' },
    tone: 'danger',
  },
  'governance.halt_state_unknown': {
    title: 'The halt state could not be read',
    body: 'The service could not determine whether an emergency stop is engaged, so it refused rather than guess. This is the safe answer, not a transient glitch to click through.',
    nextStep: 'Refresh. If it persists, escalate — agent actions are blocked until the halt store is readable again.',
    recovery: { kind: 'refresh' },
    tone: 'danger',
  },
  'governance.risk_tier_caller_supplied': {
    title: 'A risk tier was supplied by the caller',
    body: 'The tier is derived server-side from the action key and is refused if anyone sends one. If you are seeing this from this console, it is a bug in this console — report it.',
    nextStep: 'Report it. Do not work around it.',
    recovery: { kind: 'none' },
    tone: 'danger',
  },
  'governance.risk_tier_underivable': {
    title: 'The risk tier could not be derived',
    body: 'The action key is not classifiable, so the service cannot say how dangerous this action is — and will not let it proceed unclassified.',
    nextStep: 'Escalate to the team that owns the action key.',
    recovery: { kind: 'none' },
    tone: 'danger',
  },

  // ── Adjacent codes a reviewer will actually hit ─────────────────────────
  'state.invalid_transition': {
    title: 'The action has moved on',
    body: 'The action is no longer in the state this decision needs. It was most likely decided or run between your page load and your click.',
    nextStep: 'Refresh the record and read its current state before deciding again.',
    recovery: { kind: 'refresh' },
    tone: 'info',
  },
  'rule.violation': {
    title: 'A governance rule refused this',
    body: 'The service applied a rule rather than a state check — for example, a High or Critical action must be approved by someone other than whoever requested it.',
    nextStep: 'Read the message below; it names the rule.',
    recovery: { kind: 'none' },
    tone: 'warning',
  },
  'auth.forbidden': {
    title: 'Your role does not allow this',
    body: 'Approving, rejecting and running governed actions are SuperAdmin-only on this surface.',
    nextStep: 'Ask someone holding the role to act, rather than retrying.',
    recovery: { kind: 'none' },
    tone: 'danger',
  },
  'resource.not_found': {
    title: 'Not found',
    body: 'The server has no record matching this id or scope.',
    nextStep: 'Check the id, then refresh.',
    recovery: { kind: 'refresh' },
    tone: 'info',
  },
};

/** The three codes that must never be shown with the same words. */
export const DISTINCT_APPROVAL_FAILURES = [
  'governance.approval_expired',
  'governance.approval_already_used',
  'governance.approval_scope_changed',
] as const;

/**
 * Maps a refusal to human copy. An unmapped code still shows its code and the
 * server's own `title`, because a governance refusal a reviewer cannot name is
 * worse than an ugly one.
 */
export function describeRefusal(
  errorCode: string | undefined | null,
  serverTitle?: string | null,
): GovernanceRefusal {
  const code = errorCode ?? 'unknown';
  const known = REFUSALS[code];
  if (known) return { ...known, errorCode: code };

  return {
    title: serverTitle?.trim() || 'The server refused this action',
    body: serverTitle?.trim()
      ? 'The governance service refused with a code this console does not have specific guidance for.'
      : 'The governance service refused without a message this console recognises.',
    nextStep: 'Quote the error code below when you escalate.',
    recovery: { kind: 'none' },
    tone: 'danger',
    errorCode: code,
  };
}
