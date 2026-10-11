import { AlertTriangle, Info, RefreshCcw, ShieldAlert } from 'lucide-react';
import { GovernanceError } from '../api/agent-governance.api';
import { describeRefusal, type GovernanceRefusal } from '../lib/governance-errors';
import { Button } from '@/shared/ui/primitives';

const TONE_STYLES: Record<GovernanceRefusal['tone'], string> = {
  danger: 'border-danger/40 bg-danger-soft',
  warning: 'border-warning/40 bg-warning-soft',
  info: 'border-info/40 bg-info-soft',
};

const TONE_TEXT: Record<GovernanceRefusal['tone'], string> = {
  danger: 'text-danger-light',
  warning: 'text-warning',
  info: 'text-info',
};

const TONE_ICON = {
  danger: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
} as const;

/** Turns any thrown error into a refusal we can name, so nothing surfaces as "failed". */
export function refusalFrom(error: unknown): GovernanceRefusal {
  if (error instanceof GovernanceError) return describeRefusal(error.errorCode, error.message);
  if (error instanceof Error) return describeRefusal(undefined, error.message);
  return describeRefusal(undefined, null);
}

/**
 * A refusal, told in its own words.
 *
 * `governance.approval_expired`, `governance.approval_already_used` and
 * `governance.approval_scope_changed` each get a different heading, a different
 * explanation and a different next step, because they ask the reviewer to do
 * three different things: propose again, go and read what someone else did, or
 * re-read a proposal that is no longer the one they agreed to.
 */
export function GovernanceRefusalNotice({
  error,
  onRefresh,
  onReRead,
}: {
  error: unknown;
  onRefresh?: () => void;
  onReRead?: () => void;
}) {
  const refusal = refusalFrom(error);
  const Icon = TONE_ICON[refusal.tone];
  const correlationId = error instanceof GovernanceError ? error.correlationId : undefined;

  return (
    <div
      role="alert"
      data-testid="governance-refusal"
      data-error-code={refusal.errorCode}
      className={`flex gap-3 rounded-card border-thin p-3.5 ${TONE_STYLES[refusal.tone]}`}
    >
      <Icon size={16} strokeWidth={1.6} className={`mt-0.5 shrink-0 ${TONE_TEXT[refusal.tone]}`} />
      <div className="flex flex-col gap-1.5">
        <p className={`text-sm font-extrabold ${TONE_TEXT[refusal.tone]}`}>{refusal.title}</p>
        <p className="text-xs font-medium leading-relaxed text-text-secondary">{refusal.body}</p>
        <p className="text-xs font-bold text-text-primary">{refusal.nextStep}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {refusal.recovery.kind === 'refresh' && onRefresh && (
            <Button
              type="button"
              onClick={onRefresh}
              variant="secondary" size="sm"
            >
              <RefreshCcw size={13} strokeWidth={1.6} />
              Refresh the record
            </Button>
          )}
          {refusal.recovery.kind === 're-read' && onReRead && (
            <Button
              type="button"
              onClick={onReRead}
              variant="secondary" size="sm"
            >
              Re-read the proposal
            </Button>
          )}
          {refusal.recovery.kind === 'propose-again' && (
            <span className="text-[11px] font-semibold text-text-muted">
              Proposing is done by the agent, or by a SuperAdmin on its behalf — this console does
              not re-propose on your click.
            </span>
          )}
          <code className="ml-auto font-mono text-[11px] text-text-muted">{refusal.errorCode}</code>
          {correlationId && (
            <code className="font-mono text-[11px] text-text-muted">{correlationId}</code>
          )}
        </div>
      </div>
    </div>
  );
}
