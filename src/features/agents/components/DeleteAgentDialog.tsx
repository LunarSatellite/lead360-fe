// ═══════════════════════════════════════════════════════════════
// DeleteAgentDialog — small confirm modal for soft-deleting an
// agent. Backend keeps historical runs (spec §4.1) so the copy
// avoids "permanently delete" — it's reversible-ish from the
// admin's perspective via the runs feed.
// ═══════════════════════════════════════════════════════════════

import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useDeleteAgent } from '../api/agents.queries';

interface Props {
  open: boolean;
  agentId: string | null;
  agentName: string | null;
  onClose: () => void;
}

export function DeleteAgentDialog({ open, agentId, agentName, onClose }: Props) {
  const deleteMutation = useDeleteAgent();

  if (!open || !agentId) return null;

  const handleDelete = () => {
    deleteMutation.mutate(agentId, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={deleteMutation.isPending ? undefined : onClose}
      />
      <div
        className="relative w-full max-w-md mx-4 overflow-hidden flex flex-col"
        style={{
          background: '#0A0F0D',
          border: '1.5px solid #1E2E26',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-b-border-subtle">
          <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
            Delete agent?
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-8 h-8 rounded-lg bg-glass-2 flex items-center justify-center text-text-muted hover:text-text-primary transition-all disabled:opacity-40"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-danger-soft border border-[rgba(244,63,94,0.15)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-danger" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-relaxed">
                You're about to delete{' '}
                <span className="font-extrabold">"{agentName ?? 'this agent'}"</span>.
              </p>
              <p className="text-xs text-text-muted leading-relaxed mt-1.5">
                The agent won't fire again. Past runs stay visible in the run history for audit.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-t-border-subtle bg-bg-shell">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border-subtle bg-bg-card text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-danger text-bg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60"
          >
            {deleteMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
            )}
            {deleteMutation.isPending ? 'Deleting…' : 'Delete agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
