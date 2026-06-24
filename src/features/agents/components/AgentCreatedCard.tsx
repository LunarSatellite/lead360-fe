// ═══════════════════════════════════════════════════════════════
// Agents Feature — AgentCreated inline card
//
// Rendered inside the builder-chat thread when the LLM calls the
// `createAgent` tool. Plugs into ChatPage's InlineCardRenderer
// switch via `case 'AgentCreated'`.
//
// Design intent (spec §7): "Keep it small — same visual weight as
// the onboarding WebsiteExtractionDrafts card. No inline 'fire it
// now' button; that lives in the admin UI."
//
// Slice 1 ships with [Disable] only. [Edit] arrives in Slice 2
// once the editor modal exists. No-op buttons are worse than
// missing buttons, so the Edit button is rendered as a quiet link
// to the (future) /dashboard/agents route — a graceful fallback
// today, the modal entry point tomorrow.
// ═══════════════════════════════════════════════════════════════

import { Bot, Check, PowerOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToggleAgentEnabled } from '../api/agents.queries';
import {
  AGENT_TYPE_LABEL,
  AGENT_TRIGGER_KIND_LABEL,
  AGENT_TARGET_KIND_LABEL,
  AGENT_TYPE_FROM_NAME,
  AGENT_TRIGGER_KIND_FROM_NAME,
  AGENT_TARGET_KIND_FROM_NAME,
  type AgentCreatedCard,
} from '../types/agents.types';

interface Props {
  card: AgentCreatedCard;
}

export function AgentCreatedCardRenderer({ card }: Props) {
  const navigate = useNavigate();
  const toggle = useToggleAgentEnabled();

  // Resolve the inline card's string enums into pretty labels via
  // the numeric maps. Defensive on missing keys: some legitimate
  // string variants (e.g. "Approval ") have shown up in messy data
  // — fall back to the raw string rather than blow up.
  const typeLabel =
    AGENT_TYPE_LABEL[AGENT_TYPE_FROM_NAME[card.agentType]] ?? String(card.agentType);
  const triggerLabel =
    AGENT_TRIGGER_KIND_LABEL[AGENT_TRIGGER_KIND_FROM_NAME[card.triggerKind]] ??
    String(card.triggerKind);
  const targetLabel =
    AGENT_TARGET_KIND_LABEL[AGENT_TARGET_KIND_FROM_NAME[card.targetKind]] ??
    String(card.targetKind);

  // "Approval · Threshold · routes to Priya"
  const summary = [
    typeLabel,
    triggerLabel,
    card.targetRef ? `routes to ${card.targetRef}` : `target: ${targetLabel}`,
  ].join(' · ');

  const handleDisable = () => {
    if (!card.enabled || toggle.isPending) return;
    toggle.mutate({ id: card.id, enabled: false });
  };

  const handleEdit = () => {
    // Deep-link into AgentListPage with ?edit=<id>. The list page
    // reads that query param on mount, fetches the agent detail,
    // and auto-opens the editor modal. We strip the param after
    // opening so a refresh doesn't keep re-opening the dialog.
    navigate(`/dashboard/agents?edit=${card.id}`);
  };

  return (
    <div className="bg-glass-1 border border-border-subtle rounded-card overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <div className="w-7 h-7 rounded-lg bg-success-soft border border-[rgba(16,185,129,0.15)] flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-success" strokeWidth={2.4} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xs font-bold uppercase tracking-wider text-text-muted shrink-0">
              Agent created
            </span>
            <span className="text-text-muted text-2xs shrink-0">·</span>
            <span className="text-sm font-bold text-text-primary truncate" title={card.name}>
              {card.name}
            </span>
            {!card.enabled && (
              <span className="ml-1 text-2xs font-bold uppercase tracking-wider text-text-muted bg-glass-2 px-2 py-0.5 rounded shrink-0">
                Disabled
              </span>
            )}
          </div>
          <div className="text-xs text-text-secondary truncate mt-0.5" title={summary}>
            {summary}
          </div>
        </div>

        {/* Actions — desktop only, kept compact */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleEdit}
            className="px-2.5 py-1 rounded-sm text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDisable}
            disabled={!card.enabled || toggle.isPending}
            className="px-2.5 py-1 rounded-sm text-xs font-bold text-text-secondary hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-40 disabled:hover:text-text-secondary disabled:hover:bg-transparent inline-flex items-center gap-1.5"
            title={card.enabled ? 'Disable this agent' : 'Already disabled'}
          >
            <PowerOff className="w-3 h-3" strokeWidth={2.2} />
            {toggle.isPending ? 'Disabling…' : 'Disable'}
          </button>
        </div>

        {/* Mobile fallback — single icon hint */}
        <Bot className="sm:hidden w-4 h-4 text-text-muted shrink-0" strokeWidth={1.6} />
      </div>

      {/* Optional description — only render when present and non-empty */}
      {card.description && card.description.trim().length > 0 && (
        <div className="px-3.5 pb-2.5 -mt-1">
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
            {card.description}
          </p>
        </div>
      )}
    </div>
  );
}
