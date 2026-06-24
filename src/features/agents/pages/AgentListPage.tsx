// ═══════════════════════════════════════════════════════════════
// AgentListPage — /dashboard/agents
//
// The admin control tower for agents (Slice 2 of the spec).
// Lists agents in a card grid with status filters and a "+ New
// agent" CTA. Clicking a card's ⋯ menu lets owners/admins edit,
// disable/enable, or delete the agent.
//
// Deep-link support: a `?edit=<agentId>` query param auto-opens
// the editor modal pre-filled. This is what the AgentCreated
// inline card in the chat uses for its [Edit] button — keeps the
// chat → admin handoff seamless.
//
// Slice 3 will add Pending and Runs tabs above this — for now
// the page is a single tab so we don't ship a tab strip with one
// tab in it.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { useAgents, useAgent } from '../api/agents.queries';
import { useAgentsRoleGate } from '../hooks/useAgentsRoleGate';
import {
  AgentType,
  AGENT_TYPE_LABEL,
  AGENT_TYPE_AVAILABLE,
  type AgentDto,
  type AgentTypeValue,
} from '../types/agents.types';
import { AgentCard } from '../components/AgentCard';
import { AgentEditorDialog } from '../components/AgentEditorDialog';
import { DeleteAgentDialog } from '../components/DeleteAgentDialog';
import { EmptyAgentsState } from '../components/EmptyAgentsState';

// ─── Status filter (separate from agentType filter) ────────────
type StatusFilter = 'all' | 'enabled' | 'disabled';

// ─── Page entry — React Router lazy expects `Component` ────────
export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAgentsRoleGate();

  // ── Filters (URL state lite — keep the basics in component
  // state, no need to sync to query string for this slice) ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AgentTypeValue | 'all'>('all');

  // ── Modal state ──
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentDto | null>(null);

  // ── Fetch agents ──
  // We deliberately fetch unfiltered server-side so the page can
  // do client-side search across name + description without a
  // round-trip per keystroke. Agent counts per tenant are small
  // (tens, not thousands), so this is fine.
  const agentsQuery = useAgents();
  const agents = agentsQuery.data ?? [];

  // ── Deep-link: ?edit=<id> auto-opens the editor ──
  // Triggered from the AgentCreated inline card in the chat. We
  // fetch the agent detail by id so the editor gets a complete
  // DTO (the inline card carries fewer fields than AgentDto).
  const editIdFromUrl = searchParams.get('edit');
  const editFromUrlQuery = useAgent(editIdFromUrl ?? undefined);

  useEffect(() => {
    if (!editIdFromUrl) return;
    if (editFromUrlQuery.data) {
      // Open the editor with the freshly-fetched detail. Strip
      // the `?edit=` from the URL so a refresh doesn't keep
      // re-opening the modal.
      setEditingAgent(editFromUrlQuery.data);
      setEditorOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
    } else if (editFromUrlQuery.isError) {
      // Bad id — strip the param and let the user see the list
      // normally. The query hook already toasts errors.
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
    }
    // searchParams object identity changes on every render — only
    // run when the actual deep-link state shifts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editIdFromUrl, editFromUrlQuery.data, editFromUrlQuery.isError]);

  // ── Filter pipeline ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (statusFilter === 'enabled' && !a.enabled) return false;
      if (statusFilter === 'disabled' && a.enabled) return false;
      if (typeFilter !== 'all' && a.agentType !== typeFilter) return false;
      if (q) {
        const haystack = `${a.name} ${a.description ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [agents, search, statusFilter, typeFilter]);

  const filtersActive =
    !!search.trim() || statusFilter !== 'all' || typeFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  // ── Modal handlers ──
  const openCreate = () => {
    setEditingAgent(null);
    setEditorOpen(true);
  };
  const openEdit = (agent: AgentDto) => {
    setEditingAgent(agent);
    setEditorOpen(true);
  };
  const closeEditor = () => {
    setEditorOpen(false);
    setEditingAgent(null);
  };
  const openDelete = (agent: AgentDto) => setDeleteTarget(agent);
  const closeDelete = () => setDeleteTarget(null);

  // ─── Render branches ────────────────────────────────────
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-soft border border-border-glow flex items-center justify-center">
              <Bot className="w-4 h-4 text-brand" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Agents</h1>
          </div>
          <p className="text-sm text-text-secondary mt-1.5 max-w-xl">
            Automated task-handlers that fire on triggers and notify a target — for things like high-value
            approvals or new-lead alerts.
          </p>
        </div>

        {(role.canManage || true) && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-bg text-sm font-bold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4} />
            New agent
          </button>
        )}
      </header>

      {/* Filters bar */}
      <div className="mb-5 flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-card border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all"
          />
        </div>

        {/* Status pills */}
        <div className="flex gap-1 p-1 bg-glass-1 border border-border-subtle rounded-xl">
          {(['all', 'enabled', 'disabled'] as StatusFilter[]).map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  active
                    ? 'bg-bg-card text-text-primary shadow-[0_0_0_1px_rgba(0,217,126,0.15)]'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Type select */}
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as AgentTypeValue))
          }
          aria-label="Filter by agent type"
          className="px-4 py-2.5 rounded-xl bg-bg-card border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-brand transition-all"
        >
          <option value="all">All types</option>
          {(
            [
              AgentType.Approval,
              AgentType.Notification,
              AgentType.Escalation,
              AgentType.DataCollection,
              AgentType.Reminder,
              AgentType.Fulfillment,
            ] as AgentTypeValue[]
          )
            .filter((t) => AGENT_TYPE_AVAILABLE[t])
            .map((t) => (
              <option key={t} value={t}>
                {AGENT_TYPE_LABEL[t]}
              </option>
            ))}
        </select>
      </div>

      {/* Body — three states */}
      {agentsQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : agentsQuery.isError ? (
        <ErrorBlock message={agentsQuery.error?.message || 'Failed to load agents.'} />
      ) : filtered.length === 0 ? (
        <EmptyAgentsState
          filtered={filtersActive && agents.length > 0}
          canCreate={role.canManage}
          onCreate={openCreate}
          onResetFilters={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              canManage={role.canManage}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AgentEditorDialog open={editorOpen} editAgent={editingAgent} onClose={closeEditor} />
      <DeleteAgentDialog
        open={!!deleteTarget}
        agentId={deleteTarget?.id ?? null}
        agentName={deleteTarget?.name ?? null}
        onClose={closeDelete}
      />
    </div>
  );
}

// ─── Error block ───────────────────────────────────────────────

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-danger-soft border border-[rgba(244,63,94,0.15)] flex items-center justify-center mb-4">
        <AlertCircle className="w-5 h-5 text-danger" strokeWidth={1.6} />
      </div>
      <h3 className="text-base font-extrabold text-text-primary mb-1">
        Couldn't load agents
      </h3>
      <p className="text-sm text-text-secondary max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}
