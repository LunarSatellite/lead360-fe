import { Link } from 'react-router-dom';
import { Bot, FileSearch, Play, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { ApprovalClockReadout } from './ApprovalClock';
import { ActionStatusBadge, RiskTierBadge } from './RiskTierBadge';
import { actionAvailability, haltCovering } from '../lib/approval-window';
import type { AgentHaltView, GovernedAgentActionView } from '../types/governance.types';

/** Pretty-prints the agent's own preview, or shows it raw if it is not JSON. */
export function prettyJson(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function summarise(raw: string): string {
  const pretty = prettyJson(raw).replace(/\s+/g, ' ').trim();
  return pretty.length > 140 ? `${pretty.slice(0, 140)}…` : pretty;
}

/**
 * One proposal in the queue.
 *
 * Every control is gated by `actionAvailability`, which is recomputed against
 * the ticking `now`. When a window closes while the row is on screen the
 * buttons disable themselves and say why, so nobody clicks into a refusal the
 * server has already decided.
 */
export function ApprovalQueueRow({
  action,
  now,
  halts,
  onApprove,
  onReject,
  onExecute,
}: {
  action: GovernedAgentActionView;
  now: Date;
  halts: readonly AgentHaltView[];
  onApprove: (action: GovernedAgentActionView) => void;
  onReject: (action: GovernedAgentActionView) => void;
  onExecute: (action: GovernedAgentActionView) => void;
}) {
  const availability = actionAvailability(action, now, halts);
  const halt = haltCovering(action, halts);

  return (
    <li
      data-testid="queue-row"
      data-action-id={action.id}
      className="flex flex-col gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5 hover:border-border-medium hover:bg-glass-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-sm font-bold text-text-primary">{action.actionKey}</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Bot size={14} strokeWidth={1.6} />
            {action.requestingAgent}
            <span className="text-text-muted">·</span>
            <span className="font-mono text-text-muted">
              {action.targetKind}/{action.targetId}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <RiskTierBadge tier={action.riskTier} />
          <ActionStatusBadge status={action.status} />
        </div>
        <div className="min-w-[9rem]">
          <ApprovalClockReadout action={action} now={now} />
        </div>
      </div>

      <p className="rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
        {summarise(action.previewJson)}
      </p>

      {halt && (
        <p
          data-testid="queue-row-halted"
          className="rounded-sm border-thin border-warning/40 bg-warning-soft px-2.5 py-1.5 text-[11px] font-bold text-warning"
        >
          An emergency stop covering this action is engaged — approving and running are blocked.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={ROUTES.dashboard.agentActionRecord(action.id)}
          className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <FileSearch size={13} strokeWidth={1.6} />
          Read it in full
        </Link>

        <QueueButton
          testId="queue-approve"
          availability={availability.approve}
          onClick={() => onApprove(action)}
          className="bg-brand text-bg hover:bg-brand-light"
          icon={<ThumbsUp size={13} strokeWidth={1.6} />}
          label="Approve…"
        />
        <QueueButton
          testId="queue-reject"
          availability={availability.reject}
          onClick={() => onReject(action)}
          className="border-thin border-border-medium text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          icon={<ThumbsDown size={13} strokeWidth={1.6} />}
          label="Reject…"
        />
        <QueueButton
          testId="queue-execute"
          availability={availability.execute}
          onClick={() => onExecute(action)}
          className="border-thin border-border-medium text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          icon={<Play size={13} strokeWidth={1.6} />}
          label="Run it"
        />
      </div>
    </li>
  );
}

function QueueButton({
  availability,
  onClick,
  className,
  icon,
  label,
  testId,
}: {
  availability: { enabled: true } | { enabled: false; reason: string };
  onClick: () => void;
  className: string;
  icon: React.ReactNode;
  label: string;
  testId: string;
}) {
  const disabled = !availability.enabled;
  const reason = availability.enabled ? undefined : availability.reason;
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      title={reason}
      aria-label={reason ? `${label} — unavailable: ${reason}` : label}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
