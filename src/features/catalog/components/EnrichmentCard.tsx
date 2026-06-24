import { Sparkles, Database, Loader2, AlertCircle } from 'lucide-react';
import { useEnrichAll, useEmbedAll } from '../api/catalog.queries';
import type { EnrichmentStatusDto, EmbeddingStatusDto } from '../types/catalog.types';

interface EnrichmentCardProps {
  status: EnrichmentStatusDto | undefined;
  isLoading: boolean;
}

export function EnrichmentCard({ status, isLoading }: EnrichmentCardProps) {
  const enrichAll = useEnrichAll();

  if (isLoading) return <div className="h-48 bg-glass-1 rounded-2xl animate-pulse" />;
  if (!status) return <EmptyCard icon={Sparkles} label="Enrichment data unavailable" />;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 ">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-info" strokeWidth={1.8} />
        <h3 className="text-sm font-bold text-text-primary">Enrichment</h3>
      </div>

      <div className="text-[34px] font-extrabold text-info tracking-tight">{status.enrichmentPercent}%</div>
      <div className="h-2 bg-glass-2 rounded-full overflow-hidden mt-2 mb-3">
        <div
          className="h-full bg-info rounded-full transition-all duration-500"
          style={{ width: `${status.enrichmentPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div>
          <span className="text-text-muted">Enriched</span>
          <p className="font-bold text-text-primary">
            {status.enrichedCount} / {status.totalProducts}
          </p>
        </div>
        <div>
          <span className="text-text-muted">Pending</span>
          <p className="font-bold text-text-primary">{status.pendingCount}</p>
        </div>
        {status.failedCount > 0 && (
          <div>
            <span className="text-text-muted">Failed</span>
            <p className="font-bold text-danger">{status.failedCount}</p>
          </div>
        )}
        <div>
          <span className="text-text-muted">Tokens Used</span>
          <p className="font-bold text-text-primary">{status.totalTokensUsed.toLocaleString()}</p>
        </div>
      </div>

      <button
        onClick={() => enrichAll.mutate()}
        disabled={enrichAll.isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 w-full justify-center"
      >
        {enrichAll.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
        )}
        Enrich All
      </button>
    </div>
  );
}

interface EmbeddingCardProps {
  status: EmbeddingStatusDto | undefined;
  isLoading: boolean;
}

export function EmbeddingCard({ status, isLoading }: EmbeddingCardProps) {
  const embedAll = useEmbedAll();

  if (isLoading) return <div className="h-48 bg-glass-1 rounded-2xl animate-pulse" />;
  if (!status) return <EmptyCard icon={Database} label="Embedding data unavailable" />;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 ">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-success" strokeWidth={1.8} />
        <h3 className="text-sm font-bold text-text-primary">Embeddings</h3>
      </div>

      <div className="text-[34px] font-extrabold text-success tracking-tight">{status.embeddingPercent}%</div>
      <div className="h-2 bg-glass-2 rounded-full overflow-hidden mt-2 mb-3">
        <div
          className="h-full bg-success rounded-full transition-all duration-500"
          style={{ width: `${status.embeddingPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div>
          <span className="text-text-muted">Embedded</span>
          <p className="font-bold text-text-primary">
            {status.embeddedCount} / {status.totalEnriched}
          </p>
        </div>
        <div>
          <span className="text-text-muted">Pending</span>
          <p className="font-bold text-text-primary">{status.pendingCount}</p>
        </div>
        <div>
          <span className="text-text-muted">Model</span>
          <p className="font-bold text-text-primary text-[11px]">{status.embeddingModel}</p>
        </div>
        <div>
          <span className="text-text-muted">Dimensions</span>
          <p className="font-bold text-text-primary">{status.dimensions}</p>
        </div>
      </div>

      <button
        onClick={() => embedAll.mutate()}
        disabled={embedAll.isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 w-full justify-center"
      >
        {embedAll.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Database className="w-3.5 h-3.5" strokeWidth={1.8} />
        )}
        Generate All
      </button>
    </div>
  );
}

function EmptyCard({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 flex flex-col items-center justify-center py-12 ">
      <Icon className="w-8 h-8 text-text-muted mb-2" strokeWidth={1.4} />
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
