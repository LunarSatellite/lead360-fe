import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileClock, Info, Play, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { GovernanceError } from '../api/agent-governance.api';
import { ApprovalClockReadout } from '../components/ApprovalClock';
import { DecisionDialog, type Decision } from '../components/DecisionDialog';
import { GovernanceRefusalNotice } from '../components/GovernanceRefusalNotice';
import { ActionStatusBadge, RiskTierBadge } from '../components/RiskTierBadge';
import { prettyJson } from '../components/ApprovalQueue';
import {
  buildActionTimeline,
  currentStanding,
  recordSessionRefusal,
  sessionRefusalsFor,
} from '../lib/action-timeline';
import { actionAvailability } from '../lib/approval-window';
import {
  useAgentAction,
  useApproveAction,
  useExecuteAction,
  useHalts,
  useNow,
  useRejectAction,
} from '../hooks/agent-governance.queries';

const TONE_DOT = {
  neutral: 'bg-text-muted',
  good: 'bg-success',
  bad: 'bg-danger',
} as const;

/**
 * One action, in full, with what happened to it afterwards.
 *
 * This is where a reviewer re-reads a proposal — the case
 * `governance.approval_scope_changed` sends them back to — and where the
 * decision history lives.
 */
function AgentActionRecordPage() {
  const { id } = useParams<{ id: string }>();
  const now = useNow(1000);
  const record = useAgentAction(id);
  const halts = useHalts();
  const approve = useApproveAction();
  const reject = useRejectAction();
  const execute = useExecuteAction();
  const [decision, setDecision] = useState<Decision | null>(null);

  const note = (attempted: 'approve' | 'reject' | 'execute') => (error: unknown) => {
    if (!id) return;
    recordSessionRefusal({
      actionId: id,
      at: new Date().toISOString(),
      errorCode: error instanceof GovernanceError ? (error.errorCode ?? 'unknown') : 'unknown',
      message: error instanceof Error ? error.message : String(error),
      attempted,
    });
  };

  if (record.isPending) {
    return <p className="p-4 text-xs font-semibold text-text-muted">Loading the record…</p>;
  }

  if (record.isError || !record.data) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <BackLink />
        <GovernanceRefusalNotice error={record.error} onRefresh={() => void record.refetch()} />
      </div>
    );
  }

  const action = record.data;
  const availability = actionAvailability(action, now, halts.data ?? []);
  const timeline = buildActionTimeline(action);
  const refusals = sessionRefusalsFor(action.id);

  return (
    <div className="flex flex-col gap-4 p-4">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-mono text-xl font-black text-text-primary">{action.actionKey}</h1>
          <p className="text-xs font-semibold text-text-secondary">
            {action.requestingAgent} · {action.targetKind}/{action.targetId}
          </p>
          <p className="font-mono text-[11px] text-text-muted">{action.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <RiskTierBadge tier={action.riskTier} />
          <ActionStatusBadge status={action.status} />
          <ApprovalClockReadout action={action} now={now} />
        </div>
      </header>

      <p className="rounded-card border-thin border-border-subtle bg-glass-1 p-3 text-xs font-bold text-text-primary">
        {currentStanding(action)}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <RecordButton
          availability={availability.approve}
          onClick={() => setDecision('approve')}
          testId="record-approve"
          className="bg-brand text-bg hover:bg-brand-light"
          icon={<ThumbsUp size={13} strokeWidth={1.6} />}
          label="Approve…"
        />
        <RecordButton
          availability={availability.reject}
          onClick={() => setDecision('reject')}
          testId="record-reject"
          className="border-thin border-border-medium text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          icon={<ThumbsDown size={13} strokeWidth={1.6} />}
          label="Reject…"
        />
        <RecordButton
          availability={availability.execute}
          onClick={() => execute.mutate({ id: action.id }, { onError: note('execute') })}
          testId="record-execute"
          className="border-thin border-border-medium text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          icon={<Play size={13} strokeWidth={1.6} />}
          label="Run it"
        />
      </div>

      {execute.isError && (
        <GovernanceRefusalNotice
          error={execute.error}
          onRefresh={() => void record.refetch()}
          onReRead={() => void record.refetch()}
        />
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <JsonPanel title="What the agent proposes (preview)" json={action.previewJson} />
        <JsonPanel title="Request payload" json={action.requestPayloadJson} />
        {action.executionReceiptJson && (
          <JsonPanel title="Execution receipt" json={action.executionReceiptJson} />
        )}
        {action.rollbackReceiptJson && (
          <JsonPanel title="Rollback receipt" json={action.rollbackReceiptJson} />
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="flex items-center gap-2 text-sm font-black text-text-primary">
          <FileClock size={16} strokeWidth={1.6} className="text-brand" />
          What happened to this action
        </h2>
        <ol className="flex flex-col gap-2">
          {timeline.map((entry) => (
            <li
              key={`${entry.at}-${entry.label}`}
              data-testid="timeline-entry"
              className="flex gap-2.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3"
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[entry.tone]}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-extrabold text-text-primary">{entry.label}</span>
                <span className="text-[11px] font-semibold text-text-muted">
                  {new Date(entry.at).toLocaleString(undefined, { timeZoneName: 'short' })}
                </span>
                {entry.detail && (
                  <span className="text-xs font-medium leading-relaxed text-text-secondary">
                    {entry.detail}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>

        {refusals.length > 0 && (
          <div className="flex flex-col gap-2 rounded-card border-thin border-warning/40 bg-warning-soft p-3">
            <span className="text-[11px] font-black uppercase tracking-wide text-warning">
              Refused in this console session
            </span>
            {refusals.map((refusal) => (
              <p key={refusal.at} className="text-xs font-medium text-text-secondary">
                <code className="font-mono text-[11px] text-text-primary">
                  {refusal.errorCode}
                </code>{' '}
                on {refusal.attempted} ·{' '}
                {new Date(refusal.at).toLocaleTimeString()} — {refusal.message}
              </p>
            ))}
            <span className="text-[11px] font-semibold text-text-muted">
              Held in this browser tab only, not read back from the server.
            </span>
          </div>
        )}

        <p className="flex gap-2.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3 text-[11px] font-medium leading-relaxed text-text-muted">
          <Info size={14} strokeWidth={1.6} className="mt-0.5 shrink-0" />
          The governance service also writes a full evidence log for this action — every
          transition plus refused and escalation attempts, such as a denied capability grant or an
          agent identity the caller tried to assert. That log has no HTTP route today, so what is
          above is assembled from the action record itself. Ask for a read endpoint on
          <code className="mx-1 font-mono">GovernedAgentActionEvent</code> to see the rest.
        </p>
      </section>

      {decision && (
        <DecisionDialog
          action={action}
          decision={decision}
          now={now}
          pending={approve.isPending || reject.isPending}
          error={decision === 'approve' ? approve.error : reject.error}
          onCancel={() => {
            approve.reset();
            reject.reset();
            setDecision(null);
          }}
          onConfirm={(reasoning) => {
            const mutation = decision === 'approve' ? approve : reject;
            mutation.mutate(
              { id: action.id, reasoning },
              { onSuccess: () => setDecision(null), onError: note(decision) },
            );
          }}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to={ROUTES.dashboard.agentApprovals}
      className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary"
    >
      <ArrowLeft size={14} strokeWidth={1.6} />
      Back to the approval queue
    </Link>
  );
}

function JsonPanel({ title, json }: { title: string; json: string | null }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border-thin border-border-subtle bg-glass-1 p-3">
      <span className="text-[11px] font-black uppercase tracking-wide text-text-muted">
        {title}
      </span>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-text-secondary">
        {prettyJson(json) || <span className="text-text-muted">(empty)</span>}
      </pre>
    </div>
  );
}

function RecordButton({
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
  const reason = availability.enabled ? undefined : availability.reason;
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={!availability.enabled}
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

export { AgentActionRecordPage as Component };
export default AgentActionRecordPage;
