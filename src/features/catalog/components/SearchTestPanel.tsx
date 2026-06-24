import { useState } from 'react';
import { Search, Loader2, Clock, Star, AlertTriangle } from 'lucide-react';
import { useProductSearch } from '../api/catalog.queries';
import type { SearchResultDto, SearchProductDto } from '../types/catalog.types';

export function SearchTestPanel() {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const search = useProductSearch();
  const result = search.data as unknown as SearchResultDto | undefined;

  const handleSearch = () => {
    if (!query.trim()) return;
    search.mutate({ customerMessage: query, maxResults });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-5">
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 ">
        <h3 className="text-sm font-bold text-text-primary mb-4">Search Testing</h3>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              strokeWidth={1.6}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a customer message to test search..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-glass-1 border border-border-subtle text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all"
            />
          </div>
          <select
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            className="form-input w-20 appearance-none cursor-pointer"
          >
            {[3, 5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={search.isPending || !query.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
          >
            {search.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" strokeWidth={1.8} />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Metrics bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg bg-glass-1 border border-border-subtle text-xs font-bold text-text-secondary">
              Complexity: <span className="text-brand">{result.complexity}</span>
            </span>
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-glass-1 border border-border-subtle text-xs font-bold text-text-secondary">
              <Clock className="w-3 h-3 text-text-muted" /> {result.metrics.totalTimeMs}ms
            </span>
            <span className="text-xs text-text-muted">
              {result.products.length} result{result.products.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="bg-bg-card border border-border-subtle rounded-xl p-4 ">
              <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-1">
                AI Summary
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Product cards */}
          <div className="space-y-3">
            {result.products.map((p, i) => (
              <SearchResultCard key={i} item={p} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {search.isPending && (
        <div className="flex flex-col items-center py-12 text-center">
          <Loader2 className="w-6 h-6 text-brand animate-spin mb-2" />
          <p className="text-xs text-text-muted">Searching...</p>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ item, rank }: { item: SearchProductDto; rank: number }) {
  const product = item.product || {};
  const name = (product as any).name || (product as any).title || `Product #${rank}`;
  const category = (product as any).category || '';
  const price = (product as any).price;
  const scorePct = Math.min(100, Math.max(0, item.relevanceScore * 100));
  const scoreColor = scorePct >= 80 ? '#10B981' : scorePct >= 50 ? '#F59E0B' : '#F43F5E';

  return (
    <div
      className={`bg-bg-card border rounded-xl p-4  ${item.isRecommended ? 'border-[rgba(16,185,129,0.2)]' : 'border-border-subtle'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-text-muted bg-glass-2 w-5 h-5 rounded flex items-center justify-center">
              #{rank}
            </span>
            <h4 className="text-sm font-bold text-text-primary truncate">{name}</h4>
            {item.isRecommended && <Star className="w-3.5 h-3.5 text-warning fill-warning flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {category && (
              <span className="px-2 py-0.5 rounded bg-glass-2 text-[11px] font-bold text-text-muted uppercase">
                {category}
              </span>
            )}
            {price != null && (
              <span className="text-xs font-bold text-text-primary">${Number(price).toFixed(2)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-xs font-extrabold" style={{ color: scoreColor }}>
            {scorePct.toFixed(0)}%
          </span>
          <div className="w-16 h-1.5 bg-glass-2 rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full" style={{ width: `${scorePct}%`, background: scoreColor }} />
          </div>
        </div>
      </div>

      {item.reasoning && <p className="text-xs text-text-muted mt-2 leading-relaxed">{item.reasoning}</p>}

      {item.warning && (
        <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded bg-warning-soft text-[11px] font-bold text-warning w-fit">
          <AlertTriangle className="w-3 h-3" strokeWidth={1.8} />
          {item.warning}
        </div>
      )}
    </div>
  );
}
