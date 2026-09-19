import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { RiskTierBadge } from './RiskTierBadge';
import { GovernanceRefusalNotice } from './GovernanceRefusalNotice';
import { ClockReadout } from './ApprovalClock';
import { approvalClock } from '../lib/approval-window';
import { APPROVAL_WINDOW_MINUTES, type GovernedAgentActionView } from '../types/governance.types';

export type Decision = 'approve' | 'reject';

const MIN_REASONING = 12;

/**
 * The decision, with the reviewer's reasoning attached.
 *
 * Approving is an accountable act, so the note is mandatory for both decisions
 * and the confirm control stays disabled until it is written. It is never
 * pre-filled and there is no "same as last time".
 *
 * One honest caveat is printed on the approve path: `POST
 * /v1/admin/agent-actions/{id}/approve` takes **no body**, so the governance
 * service has nowhere to store an approval reason — only `reject` accepts one
 * (`AgentActionReasonVm`). Rather than quietly drop what the reviewer typed, or
 * pretend it was filed, the dialog says where it goes.
 */
export function DecisionDialog({
  action,
  decision,
  now,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  action: GovernedAgentActionView;
  decision: Decision;
  now: Date;
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onConfirm: (reasoning: string) => void;
}) {
  const [reasoning, setReasoning] = useState('');
  const trimmed = reasoning.trim();
  const tooShort = trimmed.length < MIN_REASONING;
  const clock = approvalClock(action, now);
  const approving = decision === 'approve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={approving ? 'Approve this action' : 'Reject this action'}
        data-testid="decision-dialog"
        data-decision={decision}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-auto rounded-frame border-thin border-border-medium bg-bg-elevated p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black text-text-primary">
              {approving ? 'Approve this action' : 'Reject this action'}
            </h2>
            <p className="font-mono text-xs text-text-secondary">{action.actionKey}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="h-9 w-9 rounded-sm text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <X size={16} strokeWidth={1.6} className="mx-auto" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-3">
          <RiskTierBadge tier={action.riskTier} />
          <ClockReadout clock={clock} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Requested by
            </span>
            <span className="font-mono text-xs text-text-primary">{action.requestingAgent}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Target
            </span>
            <span className="font-mono text-xs text-text-primary">
              {action.targetKind}/{action.targetId}
            </span>
          </div>
        </div>

        {approving && (
          <div className="mt-3 flex gap-2.5 rounded-card border-thin border-border-glow bg-brand-soft p-3">
            <ShieldCheck size={16} strokeWidth={1.6} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-xs font-medium leading-relaxed text-text-secondary">
              Approving opens a{' '}
              <strong className="text-text-primary">
                {APPROVAL_WINDOW_MINUTES[action.riskTier]} minute
              </strong>{' '}
              single-use window. If it closes before the action runs, the approval is gone and the
              action must be proposed again. Approving does not run the action.
            </p>
          </div>
        )}

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">
            {approving
              ? 'Why are you approving this? (required)'
              : 'Why are you rejecting this? (required — sent to the server)'}
          </span>
          <textarea
            value={reasoning}
            onChange={(event) => setReasoning(event.target.value)}
            rows={4}
            maxLength={1000}
            data-testid="decision-reasoning"
            placeholder={
              approving
                ? 'What did you check, and what makes this safe to run?'
                : 'What is wrong with this proposal?'
            }
            className="rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1"
          />
          <span className="text-[11px] font-semibold text-text-muted">
            {approving
              ? 'Recorded against your decision in this console. The approve endpoint accepts no reason field, so the governance service stores the approver and the timestamp but not this note — a backend gap, not a silent drop.'
              : 'Sent as the rejection reason and stored with the action.'}
          </span>
        </label>

        {error != null && (
          <div className="mt-3">
            <GovernanceRefusalNotice error={error} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border-thin border-border-medium px-3.5 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={tooShort || pending}
            data-testid="decision-confirm"
            onClick={() => onConfirm(trimmed)}
            className={
              approving
                ? 'rounded-sm bg-brand px-3.5 py-2 text-xs font-black text-bg disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-light'
                : 'rounded-sm bg-danger px-3.5 py-2 text-xs font-black text-bg disabled:cursor-not-allowed disabled:opacity-40'
            }
          >
            {pending
              ? 'Sending…'
              : approving
                ? 'Approve — open the window'
                : 'Reject this action'}
          </button>
        </div>
        {tooShort && (
          <p className="mt-1.5 text-right text-[11px] font-semibold text-text-muted">
            Write your reasoning first.
          </p>
        )}
      </div>
    </div>
  );
}
