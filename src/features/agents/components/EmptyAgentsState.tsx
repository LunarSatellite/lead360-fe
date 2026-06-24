// ═══════════════════════════════════════════════════════════════
// EmptyAgentsState — shown on the list page when there are no
// agents matching the current filters. Two variants:
//   - "no agents at all"  → big CTA + explainer
//   - "filters hide all"  → small "no matches" + reset hint
// ═══════════════════════════════════════════════════════════════

import { Bot, Plus, FilterX } from 'lucide-react';

interface Props {
  /** True when the empty list is the result of a filter — show
   *  the small variant. False when the tenant genuinely has zero
   *  agents — show the big onboarding CTA. */
  filtered: boolean;
  /** Whether the current user can create agents. When false, hide
   *  the "+ New agent" CTA and show explainer copy instead. */
  canCreate: boolean;
  onCreate: () => void;
  onResetFilters: () => void;
}

export function EmptyAgentsState({ filtered, canCreate, onCreate, onResetFilters }: Props) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-glass-2 border border-border-subtle flex items-center justify-center mb-4">
          <FilterX className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
        </div>
        <h3 className="text-base font-extrabold text-text-primary mb-1">No matches</h3>
        <p className="text-sm text-text-secondary max-w-sm leading-relaxed mb-4">
          No agents match your current filters. Try widening them or clear all filters to see everything.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-sm font-bold text-brand hover:text-brand-light transition-colors"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center mb-5">
        <Bot className="w-7 h-7 text-brand" strokeWidth={1.6} />
      </div>
      <h2 className="text-xl font-extrabold text-text-primary mb-2">No agents yet</h2>
      <p className="text-sm text-text-secondary max-w-md leading-relaxed mb-6">
        Agents handle tasks for you — like routing big-ticket approvals to a manager, or
        emailing the team when a complaint comes in. Create one to get started.
      </p>
      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-bg text-sm font-bold transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Create your first agent
        </button>
      ) : (
        <p className="text-xs text-text-muted">
          Ask a workspace owner or admin to create one.
        </p>
      )}
    </div>
  );
}
