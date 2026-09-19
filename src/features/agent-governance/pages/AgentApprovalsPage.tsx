import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Gavel, OctagonX, RefreshCcw, Search } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { ApprovalQueueRow } from '../components/ApprovalQueue';
import { DecisionDialog, type Decision } from '../components/DecisionDialog';
import { GovernanceRefusalNotice } from '../components/GovernanceRefusalNotice';
import {
  useApprovalQueue,
  useApproveAction,
  useExecuteAction,
  useHalts,
  useNow,
  useRejectAction,
} from '../hooks/agent-governance.queries';
import { ActionStatus, type GovernedAgentActionView } from '../types/governance.types';

/**
 * The approval queue.
 *
 * Everything on it comes from `GovernedAgentActionView` as the server returns
 * it: the action key and the agent's own preview, the agent that asked, the
 * server-derived risk tier, and the server's `approvalExpiresUtc`. No score, no
 * confidence, no recommendation is computed here, and there is no control
 * anywhere that sets a tier.
 */
function AgentApprovalsPage() {
  const now = useNow(1000);
  const navigate = useNavigate();
  const queue = useApprovalQueue();
  const halts = useHalts();
  const approve = useApproveAction();
  const reject = useRejectAction();
  const execute = useExecuteAction();

  const [decision, setDecision] = useState<{
    action: GovernedAgentActionView;
    decision: Decision;
  } | null>(null);
  const [lookupId, setLookupId] = useState('');

  const items = queue.data?.kind === 'ok' ? queue.data.items : [];
  const engagedHalts = (halts.data ?? []).filter((halt) => halt.isEngaged);

  /** Awaiting first, then approved-and-ticking, then the rest. Sorted by urgency within each. */
  const ordered = useMemo(() => {
    const rank = (action: GovernedAgentActionView) =>
      action.status === ActionStatus.AwaitingApproval
        ? 0
        : action.status === ActionStatus.Approved
          ? 1
          : 2;
    return [...items].sort((a, b) => {
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const aExpiry = a.approvalExpiresUtc ? Date.parse(a.approvalExpiresUtc) : Infinity;
      const bExpiry = b.approvalExpiresUtc ? Date.parse(b.approvalExpiresUtc) : Infinity;
      if (aExpiry !== bExpiry) return aExpiry - bExpiry;
      return Date.parse(a.requestedUtc) - Date.parse(b.requestedUtc);
    });
  }, [items]);

  const pending = approve.isPending || reject.isPending;
  const decisionError = decision?.decision === 'approve' ? approve.error : reject.error;

  const closeDialog = () => {
    approve.reset();
    reject.reset();
    setDecision(null);
  };

  const confirmDecision = (reasoning: string) => {
    if (!decision) return;
    const vars = { id: decision.action.id, reasoning };
    const mutation = decision.decision === 'approve' ? approve : reject;
    mutation.mutate(vars, { onSuccess: () => setDecision(null) });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <Gavel size={20} strokeWidth={1.6} className="text-brand" />
            Agent approvals
          </h1>
          <p className="max-w-2xl text-xs font-medium leading-relaxed text-text-secondary">
            Every automated action that needs a human owner. Approving opens a single-use,
            time-boxed window — Critical lasts five minutes — and the window is spent the moment
            the action runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void queue.refetch()}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <RefreshCcw size={13} strokeWidth={1.6} />
            Refresh
          </button>
          <Link
            to={ROUTES.dashboard.agentEmergencyStop}
            className="inline-flex items-center gap-1.5 rounded-sm border-thin border-danger/40 bg-danger-soft px-3 py-2 text-xs font-bold text-danger hover:bg-danger/20"
          >
            <OctagonX size={13} strokeWidth={1.6} />
            Emergency stop
          </Link>
        </div>
      </header>

      {engagedHalts.length > 0 && (
        <div
          data-testid="halt-banner"
          className="flex items-center gap-2.5 rounded-card border-thin border-danger/40 bg-danger-soft p-3"
        >
          <OctagonX size={16} strokeWidth={1.6} className="shrink-0 text-danger" />
          <p className="text-xs font-bold text-danger">
            {engagedHalts.length} emergency stop{engagedHalts.length === 1 ? '' : 's'} engaged.
            Approving and running are blocked in scope; rejecting still works.
          </p>
          <Link
            to={ROUTES.dashboard.agentEmergencyStop}
            className="ml-auto text-xs font-bold text-text-primary underline"
          >
            See what is stopped
          </Link>
        </div>
      )}

      {queue.isError && <GovernanceRefusalNotice error={queue.error} onRefresh={() => void queue.refetch()} />}

      {queue.data?.kind === 'unavailable' && (
        <div
          data-testid="queue-unavailable"
          className="flex flex-col gap-2 rounded-card border-thin border-warning/40 bg-warning-soft p-3.5"
        >
          <p className="flex items-center gap-2 text-sm font-extrabold text-warning">
            <AlertTriangle size={16} strokeWidth={1.6} />
            There is no queue feed to read
          </p>
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            {queue.data.detail} The governance API exposes single-action reads, decisions and the
            emergency stop, but no list of what is awaiting approval — so this screen cannot show
            you a queue, and an empty list would be a claim it has no right to make. Open an action
            by its id below until that endpoint exists.
          </p>
        </div>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const id = lookupId.trim();
          if (id) void navigate(ROUTES.dashboard.agentActionRecord(id));
        }}
      >
        <label className="flex min-w-[20rem] flex-1 flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">Open an action by id</span>
          <input
            value={lookupId}
            onChange={(event) => setLookupId(event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className="rounded-sm border-thin border-border-subtle bg-bg-input px-2.5 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
        >
          <Search size={13} strokeWidth={1.6} />
          Open
        </button>
      </form>

      {execute.isError && (
        <GovernanceRefusalNotice
          error={execute.error}
          onRefresh={() => void queue.refetch()}
          onReRead={() => void queue.refetch()}
        />
      )}

      {ordered.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {ordered.map((action) => (
            <ApprovalQueueRow
              key={action.id}
              action={action}
              now={now}
              halts={halts.data ?? []}
              onApprove={(target) => setDecision({ action: target, decision: 'approve' })}
              onReject={(target) => setDecision({ action: target, decision: 'reject' })}
              onExecute={(target) => execute.mutate({ id: target.id })}
            />
          ))}
        </ul>
      )}

      {queue.data?.kind === 'ok' && ordered.length === 0 && (
        <p className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 text-xs font-semibold text-text-muted">
          Nothing is awaiting a decision.
        </p>
      )}

      {decision && (
        <DecisionDialog
          action={decision.action}
          decision={decision.decision}
          now={now}
          pending={pending}
          error={decisionError}
          onCancel={closeDialog}
          onConfirm={confirmDecision}
        />
      )}
    </div>
  );
}

export { AgentApprovalsPage as Component };
export default AgentApprovalsPage;
