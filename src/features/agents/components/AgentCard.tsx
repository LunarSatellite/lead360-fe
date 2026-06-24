// ═══════════════════════════════════════════════════════════════
// AgentCard — single tile in the agents list grid.
//
// Layout (per spec §5.2):
//   ┌──────────────────────────────────────┐
//   │ 🛡  Booking approvals      [⋯]       │
//   │     Approval · Threshold > $500      │
//   │     Routes to: Priya                  │
//   │     🟢 Enabled                        │
//   └──────────────────────────────────────┘
//
// The ⋯ menu has Edit / Disable·Enable / Delete. Non-admins see
// the card with no actions.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  ShieldCheck,
  Bell,
  AlertTriangle,
  ClipboardList,
  Clock,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
} from 'lucide-react';
import {
  AgentType,
  AGENT_TYPE_LABEL,
  AGENT_TRIGGER_KIND_LABEL,
  AGENT_TARGET_KIND_LABEL,
  type AgentDto,
  type AgentTypeValue,
} from '../types/agents.types';
import { useToggleAgentEnabled } from '../api/agents.queries';

interface Props {
  agent: AgentDto;
  canManage: boolean;
  onEdit: (agent: AgentDto) => void;
  onDelete: (agent: AgentDto) => void;
}

// ─── Type → icon map ───────────────────────────────────────────
const TYPE_ICON: Record<AgentTypeValue, typeof Bot> = {
  [AgentType.Approval]: ShieldCheck,
  [AgentType.Notification]: Bell,
  [AgentType.Escalation]: AlertTriangle,
  [AgentType.DataCollection]: ClipboardList,
  [AgentType.Reminder]: Clock,
  [AgentType.Fulfillment]: CheckCircle2,
};

export function AgentCard({ agent, canManage, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggle = useToggleAgentEnabled();

  // Close menu on outside click — mirror the pattern used in
  // DashboardLayout's profile menu.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const Icon = TYPE_ICON[agent.agentType] ?? Bot;
  const typeLabel = AGENT_TYPE_LABEL[agent.agentType] ?? 'Agent';
  const triggerLabel = AGENT_TRIGGER_KIND_LABEL[agent.triggerKind] ?? 'Manual';

  // Derive a humanish target line. We don't have the team-member
  // names in the agent DTO (only the userId in targetRef), so for
  // User targets we just show "Specific user" — the run detail
  // drawer in Slice 3 will show the resolved name.
  const targetLine =
    agent.targetRef && agent.targetRef.length > 0
      ? agent.targetKind === 1 // User
        ? 'Specific team member'
        : agent.targetKind === 3 // Email
          ? agent.targetRef
          : AGENT_TARGET_KIND_LABEL[agent.targetKind]
      : AGENT_TARGET_KIND_LABEL[agent.targetKind];

  const handleToggleEnabled = () => {
    setMenuOpen(false);
    toggle.mutate({ id: agent.id, enabled: !agent.enabled });
  };

  return (
    <div
      className={`relative bg-bg-card border border-border-subtle rounded-card p-4 transition-all hover:border-border-medium ${
        agent.enabled ? '' : 'opacity-70'
      }`}
    >
      {/* Top row: icon + name + menu */}
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            agent.enabled
              ? 'bg-brand-soft border border-border-glow'
              : 'bg-glass-2 border border-border-subtle'
          }`}
        >
          <Icon
            className={`w-4 h-4 ${agent.enabled ? 'text-brand' : 'text-text-muted'}`}
            strokeWidth={2}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-text-primary truncate" title={agent.name}>
            {agent.name}
          </h3>
          <div className="text-xs text-text-secondary mt-0.5 truncate">
            {typeLabel} · {triggerLabel}
          </div>
        </div>

        {canManage && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Agent actions"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-glass-2 transition-all"
            >
              <MoreVertical className="w-4 h-4" strokeWidth={1.8} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 min-w-[160px] py-1 rounded-xl bg-bg-elevated border border-border-subtle shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <MenuItem
                  icon={Pencil}
                  label="Edit"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(agent);
                  }}
                />
                <MenuItem
                  icon={Power}
                  label={agent.enabled ? 'Disable' : 'Enable'}
                  onClick={handleToggleEnabled}
                  disabled={toggle.isPending}
                />
                <div className="my-1 border-t border-t-border-subtle" />
                <MenuItem
                  icon={Trash2}
                  label="Delete"
                  destructive
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(agent);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {agent.description && (
        <p
          className="text-xs text-text-muted mt-3 leading-relaxed line-clamp-2"
          title={agent.description}
        >
          {agent.description}
        </p>
      )}

      {/* Footer row: target + status */}
      <div className="mt-4 pt-3 border-t border-t-border-subtle flex items-center justify-between gap-2">
        <div className="text-xs text-text-secondary truncate min-w-0" title={targetLine}>
          <span className="text-text-muted">Target:</span>{' '}
          <span className="font-semibold text-text-secondary">{targetLine}</span>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider shrink-0 ${
            agent.enabled ? 'text-brand' : 'text-text-muted'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              agent.enabled ? 'bg-brand' : 'bg-text-muted'
            }`}
          />
          {agent.enabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>
    </div>
  );
}

// ─── Menu item primitive ───────────────────────────────────────

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  destructive,
}: {
  icon: typeof Bot;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
        destructive
          ? 'text-danger hover:bg-danger-soft'
          : 'text-text-secondary hover:text-text-primary hover:bg-glass-2'
      }`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {label}
    </button>
  );
}
