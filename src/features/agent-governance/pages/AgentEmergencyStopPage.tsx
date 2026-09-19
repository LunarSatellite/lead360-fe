import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, OctagonX, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import {
  EngageHaltDialog,
  HaltAuthorityNote,
  HaltRow,
} from '../components/EmergencyStop';
import { GovernanceRefusalNotice } from '../components/GovernanceRefusalNotice';
import { blastRadius, resolveHaltAuthority } from '../lib/halt-authority';
import {
  useClearHalt,
  useEngageHalt,
  useHalts,
  useProvenAdminRoles,
} from '../hooks/agent-governance.queries';
import { HaltScope, type AgentHaltView } from '../types/governance.types';

/**
 * The emergency stop.
 *
 * It shows what is stopped right now, who engaged it and when, the history of
 * every stop that has ever been engaged (rows are never deleted server-side),
 * and the authority asymmetry in plain words. Engaging is a deliberate,
 * confirmed act with its blast radius spelled out first; clearing is only
 * offered to the role that may actually clear.
 */
function AgentEmergencyStopPage() {
  const halts = useHalts();
  const roles = useProvenAdminRoles();
  const engage = useEngageHalt();
  const clear = useClearHalt();
  const [engaging, setEngaging] = useState(false);
  const [clearing, setClearing] = useState<AgentHaltView | null>(null);
  const [clearReason, setClearReason] = useState('');

  const authority = resolveHaltAuthority(roles.data ?? null);
  const list = halts.data ?? [];
  const engaged = list.filter((halt) => halt.isEngaged);
  const past = list.filter((halt) => !halt.isEngaged);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link
        to={ROUTES.dashboard.agentApprovals}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={14} strokeWidth={1.6} />
        Back to the approval queue
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-text-primary">
            <OctagonX size={20} strokeWidth={1.6} className="text-danger" />
            Emergency stop
          </h1>
          <p className="text-xs font-medium leading-relaxed text-text-secondary">
            Engaging blocks governed agent actions in scope and voids approvals that have been
            granted but not yet run — those actions become rejected and must be proposed again.
            Rejecting queued actions and rolling back completed ones are deliberately left working.
          </p>
          <HaltAuthorityNote authority={authority} />
        </div>
        <button
          type="button"
          data-testid="engage-halt"
          onClick={() => setEngaging(true)}
          className="inline-flex items-center gap-1.5 rounded-sm border-thin border-danger/40 bg-danger-soft px-3.5 py-2 text-xs font-black text-danger hover:bg-danger/20"
        >
          <OctagonX size={14} strokeWidth={1.6} />
          Engage a stop…
        </button>
      </header>

      {halts.isError && (
        <GovernanceRefusalNotice error={halts.error} onRefresh={() => void halts.refetch()} />
      )}
      {clear.isError && (
        <GovernanceRefusalNotice error={clear.error} onRefresh={() => void halts.refetch()} />
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-black text-text-primary">Engaged now</h2>
        {engaged.length === 0 ? (
          <p className="flex items-center gap-2 rounded-card border-thin border-border-subtle bg-glass-1 p-3.5 text-xs font-bold text-text-secondary">
            <ShieldCheck size={15} strokeWidth={1.6} className="text-success" />
            No stop is engaged. Governed agent actions are running under normal approval.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {engaged.map((halt) => (
              <HaltRow
                key={halt.id}
                halt={halt}
                canClear={authority.canClear}
                onClear={(target) => {
                  setClearReason('');
                  setClearing(target);
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-black text-text-primary">Previously engaged</h2>
          <ul className="flex flex-col gap-2.5">
            {past.map((halt) => (
              <HaltRow key={halt.id} halt={halt} canClear={false} onClear={() => undefined} />
            ))}
          </ul>
        </section>
      )}

      {engaging && (
        <EngageHaltDialog
          pending={engage.isPending}
          error={engage.error}
          onCancel={() => {
            engage.reset();
            setEngaging(false);
          }}
          onConfirm={(values) =>
            engage.mutate(values, { onSuccess: () => setEngaging(false) })
          }
        />
      )}

      {clearing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Clear this emergency stop"
            data-testid="clear-halt-dialog"
            className="flex w-full max-w-xl flex-col gap-3 rounded-frame border-thin border-border-medium bg-bg-elevated p-4"
          >
            <h2 className="text-lg font-black text-text-primary">Clear this emergency stop</h2>
            <p className="text-xs font-medium leading-relaxed text-text-secondary">
              {blastRadius(clearing.scope, clearing.scopeKey).label}
              {clearing.scope !== HaltScope.Global && ` — ${clearing.scopeKey}`}. Agents in this
              scope can propose and run governed actions again as soon as this is cleared.
              Approvals voided while it was engaged do not come back.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-text-secondary">
                Why is it safe to clear? (required, stored with the halt)
              </span>
              <textarea
                value={clearReason}
                data-testid="clear-reason"
                rows={3}
                maxLength={1000}
                onChange={(event) => setClearReason(event.target.value)}
                className="rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 text-sm text-text-primary focus:border-border-glow focus:bg-glass-1"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setClearing(null)}
                className="rounded-sm border-thin border-border-medium px-3.5 py-2 text-xs font-bold text-text-secondary hover:bg-glass-2 hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="clear-confirm"
                disabled={clearReason.trim().length < 12 || clear.isPending}
                onClick={() =>
                  clear.mutate(
                    {
                      scope: clearing.scope,
                      scopeKey: clearing.scope === HaltScope.Global ? null : clearing.scopeKey,
                      reason: clearReason.trim(),
                    },
                    { onSuccess: () => setClearing(null) },
                  )
                }
                className="rounded-sm bg-brand px-3.5 py-2 text-xs font-black text-bg disabled:cursor-not-allowed disabled:opacity-40 hover:bg-brand-light"
              >
                {clear.isPending ? 'Clearing…' : 'Clear the stop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AgentEmergencyStopPage as Component };
export default AgentEmergencyStopPage;
