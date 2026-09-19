/**
 * The emergency stop: who may pull it, who may put it back, and what each
 * scope actually switches off.
 *
 * The authority is deliberately asymmetric in the backend
 * (`AgentHaltSwitch`): engaging is open to three roles because "a stop that
 * only one unavailable person can pull is not a stop", while clearing is
 * SuperAdmin alone. The UI must not flatten that.
 */

import { HaltScope, type HaltScopeValue } from '../types/governance.types';

/** Exact role strings the service compares against. */
export const ENGAGE_ROLES = ['SuperAdmin', 'PayoutsOps', 'ContentMod'] as const;
export const CLEAR_ROLES = ['SuperAdmin'] as const;

export interface HaltAuthority {
  canEngage: boolean;
  canClear: boolean;
  /** True when the operator's admin roles are not known to this console. */
  unknown: boolean;
}

/**
 * `roles === null` means "not known". Unknown never grants: the clear control
 * is not offered on a guess, and the server re-checks either way
 * (`governance.halt_not_authorized`).
 */
export function resolveHaltAuthority(roles: readonly string[] | null): HaltAuthority {
  if (roles === null) return { canEngage: false, canClear: false, unknown: true };
  return {
    canEngage: roles.some((r) => (ENGAGE_ROLES as readonly string[]).includes(r)),
    canClear: roles.some((r) => (CLEAR_ROLES as readonly string[]).includes(r)),
    unknown: false,
  };
}

// ─── Blast radius ──────────────────────────────────────────────────────────

export interface BlastRadius {
  /** Short scope name for the control. */
  label: string;
  /** What stops, said plainly, before anyone confirms. */
  stops: string;
  /** What keeps working — engaging a halt is not a system-wide freeze. */
  keepsWorking: string;
  /** Severity ordering, 1 = narrowest. Used to sort, never to preselect. */
  breadth: 1 | 2 | 3;
}

/**
 * Describes what engaging would switch off. `scopeKey` is echoed back verbatim
 * (lower-cased the way the server stores it) so the reviewer confirms against
 * the exact string that will be sent.
 */
export function blastRadius(scope: HaltScopeValue, scopeKey: string): BlastRadius {
  const key = scopeKey.trim().toLowerCase();
  switch (scope) {
    case HaltScope.Capability:
      return {
        label: 'One capability',
        stops: key
          ? `Every agent is blocked from proposing or running “${key}”. Approvals already granted for that capability are voided.`
          : 'Name the capability (the action key) this should stop.',
        keepsWorking: 'Every other capability, for every agent, continues.',
        breadth: 1,
      };
    case HaltScope.Agent:
      return {
        label: 'One agent',
        stops: key
          ? `Agent “${key}” is blocked from proposing or running anything at all. Its already-granted approvals are voided.`
          : 'Name the agent this should stop.',
        keepsWorking: 'Every other agent continues, including on the same capabilities.',
        breadth: 2,
      };
    case HaltScope.Global:
      return {
        label: 'Every agent, every capability',
        stops:
          'All governed agent action stops platform-wide. Every approval that has been granted but not yet run is voided — those actions become rejected and must be proposed again from scratch.',
        keepsWorking:
          'Rejecting queued actions still works, and rollbacks are not blocked. Nothing else automated runs until a SuperAdmin clears this.',
        breadth: 3,
      };
    default:
      return { label: 'Unknown scope', stops: '', keepsWorking: '', breadth: 1 };
  }
}

/** Narrowest first. The broadest scope is never the default. */
export const SCOPE_CHOICES: HaltScopeValue[] = [
  HaltScope.Capability,
  HaltScope.Agent,
  HaltScope.Global,
];

/** A scope key is required unless the scope is Global (where the server stores `*`). */
export function requiresScopeKey(scope: HaltScopeValue): boolean {
  return scope !== HaltScope.Global;
}

export interface HaltFormState {
  scope: HaltScopeValue | null;
  scopeKey: string;
  reason: string;
  /** Must be ticked by hand. Never pre-ticked, never remembered. */
  acknowledged: boolean;
}

/** The empty form. `scope` starts unset so nothing — least of all Global — is preselected. */
export const EMPTY_HALT_FORM: HaltFormState = {
  scope: null,
  scopeKey: '',
  reason: '',
  acknowledged: false,
};

/** Why the confirm button is still disabled, or null when it is genuinely ready. */
export function haltFormBlocker(form: HaltFormState): string | null {
  if (form.scope === null) return 'Choose what this stop covers.';
  if (requiresScopeKey(form.scope) && !form.scopeKey.trim()) {
    return form.scope === HaltScope.Agent
      ? 'Name the agent to stop.'
      : 'Name the capability to stop.';
  }
  if (form.scopeKey.trim().length > 150) return 'The scope key is limited to 150 characters.';
  if (!form.reason.trim()) return 'Record why you are engaging this stop.';
  if (form.reason.trim().length > 1000) return 'The reason is limited to 1000 characters.';
  if (!form.acknowledged) return 'Confirm you have read what this stops.';
  return null;
}
