import { useState, useMemo } from 'react';
import { Sparkles, Loader2, RefreshCw, CheckCheck, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSpecs } from '@/features/api-connection/api/api-connection.queries';
import { SpecStatus } from '@/features/api-connection/types/api-connection.types';
import type { ApiSpecDto } from '@/features/api-connection/types/api-connection.types';
import {
  useSuggestions, useGenerateSuggestions, useRegenerateSuggestions, useApproveAllSuggestions,
} from '../api/intent-suggestion.queries';
import { SuggestionCard, BatchStats } from '../components/SuggestionCard';
import { SuggestionStatus } from '../types/intent-suggestion.types';
import type { SuggestionBatchDto, SuggestionDto } from '../types/intent-suggestion.types';

export function Component() {
  const navigate = useNavigate();
  const { data: rawSpecs } = useSpecs();
  const specs = ((rawSpecs as unknown as ApiSpecDto[]) ?? []).filter(s => s.status === SpecStatus.Parsed);

  const [selectedSpecId, setSelectedSpecId] = useState<string>(specs[0]?.id || '');
  const activeSpecId = selectedSpecId || specs[0]?.id || '';

  const { data: rawBatch, isLoading } = useSuggestions(activeSpecId || undefined);
  const batch = rawBatch as unknown as SuggestionBatchDto | undefined;
  const suggestions = batch?.suggestions ?? [];

  const generate = useGenerateSuggestions();
  const regenerate = useRegenerateSuggestions();
  const approveAll = useApproveAllSuggestions();

  const pendingCount = suggestions.filter(s => s.status === SuggestionStatus.Pending).length;

  // Group by parent
  const grouped = useMemo(() => {
    const roots = suggestions.filter(s => !s.parentIntentName || s.suggestedLevel === 0);
    const children = suggestions.filter(s => s.parentIntentName && s.suggestedLevel > 0);
    const map = new Map<string, SuggestionDto[]>();
    roots.forEach(r => map.set(r.name, []));
    children.forEach(c => {
      const parent = c.parentIntentName || '';
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(c);
    });
    return { roots, childrenMap: map };
  }, [suggestions]);

  if (!activeSpecId) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Target className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.4} />
        <p className="text-sm font-bold text-text-secondary">No parsed API specs found</p>
        <p className="text-xs text-text-muted mt-1">Upload and parse an API spec first.</p>
        <button onClick={() => navigate('/dashboard/api-connection')} className="mt-3 text-xs font-semibold text-brand hover:underline">Go to API Connection</button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[2.5px] text-brand">AI-Powered</div>
          <div className="text-[24px] font-extrabold text-text-primary tracking-tight mt-0.5">Intent Suggestions</div>
          <div className="text-[14px] text-text-secondary mt-1.5">AI-generated intents from your API spec. Review, modify, and approve to create real intents.</div>
        </div>
        <div className="flex items-center gap-2">
          {specs.length > 1 && (
            <select value={activeSpecId} onChange={e => setSelectedSpecId(e.target.value)} className="form-input max-w-[200px] appearance-none cursor-pointer">
              {specs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {suggestions.length === 0 ? (
            <button
              onClick={() => generate.mutate(activeSpecId)}
              disabled={generate.isPending}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" strokeWidth={1.8} />}
              Generate Suggestions
            </button>
          ) : (
            <>
              <button
                onClick={() => regenerate.mutate(activeSpecId)}
                disabled={regenerate.isPending}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass-1 border border-border-subtle text-xs font-semibold text-text-secondary hover:bg-glass-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerate.isPending ? 'animate-spin' : ''}`} strokeWidth={1.6} />
                Regenerate
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={() => approveAll.mutate(activeSpecId)}
                  disabled={approveAll.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-xs font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {approveAll.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />}
                  Approve All ({pendingCount})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {batch && (
        <BatchStats total={batch.totalCount} pending={batch.pendingCount} approved={batch.approvedCount} rejected={batch.rejectedCount} />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-glass-1 rounded-2xl animate-pulse" />)}</div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Sparkles className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.4} />
          <p className="text-sm font-bold text-text-secondary">No suggestions generated yet</p>
          <p className="text-xs text-text-muted mt-1">Click "Generate Suggestions" to let AI suggest intents from your API.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.roots.map(root => {
            const children = grouped.childrenMap.get(root.name) || [];
            return (
              <div key={root.id}>
                <SuggestionCard suggestion={root} />
                {children.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-border-subtle pl-4">
                    {children.map(child => <SuggestionCard key={child.id} suggestion={child} />)}
                  </div>
                )}
              </div>
            );
          })}
          {/* Orphan children */}
          {suggestions.filter(s => s.parentIntentName && s.suggestedLevel > 0 && !grouped.roots.find(r => r.name === s.parentIntentName)).map(s => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}
