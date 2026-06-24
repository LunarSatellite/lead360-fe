import { useState, useMemo } from 'react';
import { Sparkles, Loader2, RefreshCw, CheckCheck, Target } from 'lucide-react';
import {
  useSuggestions,
  useGenerateSuggestions,
  useRegenerateSuggestions,
  useApproveAllSuggestions,
} from '@/features/intent-suggestions/api/intent-suggestion.queries';
import { SuggestionCard, BatchStats } from '@/features/intent-suggestions/components/SuggestionCard';
import { SuggestionStatus } from '@/features/intent-suggestions/types/intent-suggestion.types';
import type {
  SuggestionBatchDto,
  SuggestionDto,
} from '@/features/intent-suggestions/types/intent-suggestion.types';

interface Props {
  specId: string;
}

export function SuggestionsView({ specId }: Props) {
  const { data: rawBatch, isLoading } = useSuggestions(specId);
  const batch = rawBatch as unknown as SuggestionBatchDto | undefined;
  const suggestions = batch?.suggestions ?? [];

  const generate = useGenerateSuggestions();
  const regenerate = useRegenerateSuggestions();
  const approveAll = useApproveAllSuggestions();

  const pendingCount = suggestions.filter((s) => s.status === SuggestionStatus.Pending).length;

  const grouped = useMemo(() => {
    const roots = suggestions.filter((s) => !s.parentIntentName || s.suggestedLevel === 0);
    const children = suggestions.filter((s) => s.parentIntentName && s.suggestedLevel > 0);
    const map = new Map<string, SuggestionDto[]>();
    roots.forEach((r) => map.set(r.name, []));
    children.forEach((c) => {
      const parent = c.parentIntentName || '';
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(c);
    });
    return { roots, childrenMap: map };
  }, [suggestions]);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold text-text-primary">AI-generated intents from your API spec</p>
          <p className="text-xs text-text-muted mt-0.5">
            Review, modify, and approve to create real intents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {suggestions.length === 0 ? (
            <button
              onClick={() => generate.mutate(specId)}
              disabled={generate.isPending}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {generate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" strokeWidth={1.8} />
              )}
              Generate Suggestions
            </button>
          ) : (
            <>
              <button
                onClick={() => regenerate.mutate(specId)}
                disabled={regenerate.isPending}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass-1 border border-border-subtle text-xs font-semibold text-text-secondary hover:bg-glass-2 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`}
                  strokeWidth={1.6}
                />
                Regenerate
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={() => approveAll.mutate(specId)}
                  disabled={approveAll.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-xs font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {approveAll.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  )}
                  Approve All ({pendingCount})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {batch && (
        <BatchStats
          total={batch.totalCount}
          pending={batch.pendingCount}
          approved={batch.approvedCount}
          rejected={batch.rejectedCount}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-glass-1 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Sparkles className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.4} />
          <p className="text-sm font-bold text-text-secondary">No suggestions generated yet</p>
          <p className="text-xs text-text-muted mt-1">
            Click "Generate Suggestions" to let AI suggest intents from your API.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.roots.map((root) => {
            const children = grouped.childrenMap.get(root.name) || [];
            return (
              <div key={root.id}>
                <SuggestionCard suggestion={root} />
                {children.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-border-subtle pl-4">
                    {children.map((child) => (
                      <SuggestionCard key={child.id} suggestion={child} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
