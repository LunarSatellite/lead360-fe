import { Package, Sparkles, Database, Key, CheckCircle, Loader2 } from 'lucide-react';
import type {
  SyncStatusDto,
  EnrichmentStatusDto,
  EmbeddingStatusDto,
  CacheStatsDto,
} from '../types/catalog.types';
import { format } from 'date-fns';

interface PipelineOverviewProps {
  sync: SyncStatusDto | undefined;
  enrichment: EnrichmentStatusDto | undefined;
  embedding: EmbeddingStatusDto | undefined;
  cache: CacheStatsDto | undefined;
}

export function PipelineOverview({ sync, enrichment, embedding, cache }: PipelineOverviewProps) {
  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Package}
          label="Products Synced"
          value={sync?.productCount ?? 0}
          sub={
            sync?.lastSyncAt ? `Last: ${format(new Date(sync.lastSyncAt), 'MMM d, HH:mm')}` : 'Never synced'
          }
          accent="brand"
        />
        <MetricCard
          icon={Sparkles}
          label="Enrichment"
          value={`${enrichment?.enrichmentPercent ?? 0}%`}
          sub={`${enrichment?.enrichedCount ?? 0} / ${enrichment?.totalProducts ?? 0}`}
          accent="info"
          ring={enrichment?.enrichmentPercent}
        />
        <MetricCard
          icon={Database}
          label="Embeddings"
          value={`${embedding?.embeddingPercent ?? 0}%`}
          sub={`${embedding?.embeddedCount ?? 0} / ${embedding?.totalEnriched ?? 0}`}
          accent="success"
          ring={embedding?.embeddingPercent}
        />
        <MetricCard
          icon={Key}
          label="Keyword Cache"
          value={cache?.totalKeywords ?? 0}
          sub={cache?.builtAt ? `Built: ${format(new Date(cache.builtAt), 'MMM d, HH:mm')}` : 'Not built'}
          accent="warning"
        />
      </div>

      {/* Pipeline flow */}
      <PipelineFlow sync={sync} enrichment={enrichment} embedding={embedding} cache={cache} />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  ring,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  ring?: number;
}) {
  const accentMap: Record<string, string> = {
    brand: 'text-brand',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
  };
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl px-5 py-4 ">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.6} />
        <span className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div
            className={`text-[26px] font-extrabold tracking-tight ${accentMap[accent] || 'text-text-primary'}`}
          >
            {value}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>
        </div>
        {ring != null && <ProgressRingSmall pct={ring} accent={accent} />}
      </div>
    </div>
  );
}

function ProgressRingSmall({ pct, accent }: { pct: number; accent: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const colorMap: Record<string, string> = {
    info: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    brand: '#059669',
  };
  const color = colorMap[accent] || '#94A3B8';
  return (
    <svg width={44} height={44}>
      <circle cx={22} cy={22} r={r} fill="none" stroke="#111916" strokeWidth={4} />
      <circle
        cx={22}
        cy={22}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-700 -rotate-90 origin-center"
      />
    </svg>
  );
}

// ─── Pipeline Flow (horizontal step visualization) ───

function PipelineFlow({ sync, enrichment, embedding, cache }: PipelineOverviewProps) {
  const steps = [
    {
      label: 'Sync',
      done: (sync?.productCount ?? 0) > 0,
      detail: sync?.productCount ? `${sync.productCount}` : '—',
      icon: Package,
    },
    {
      label: 'Enrich',
      done: (enrichment?.enrichmentPercent ?? 0) >= 100,
      detail: `${enrichment?.enrichmentPercent ?? 0}%`,
      inProgress: (enrichment?.enrichmentPercent ?? 0) > 0 && (enrichment?.enrichmentPercent ?? 0) < 100,
      icon: Sparkles,
    },
    {
      label: 'Embed',
      done: (embedding?.embeddingPercent ?? 0) >= 100,
      detail: `${embedding?.embeddingPercent ?? 0}%`,
      inProgress: (embedding?.embeddingPercent ?? 0) > 0 && (embedding?.embeddingPercent ?? 0) < 100,
      icon: Database,
    },
    {
      label: 'Cache',
      done: (cache?.totalKeywords ?? 0) > 0,
      detail: cache?.totalKeywords ? `${cache.totalKeywords}` : '—',
      icon: Key,
    },
    {
      label: 'Search Ready',
      done:
        (sync?.productCount ?? 0) > 0 &&
        (enrichment?.enrichmentPercent ?? 0) >= 100 &&
        (embedding?.embeddingPercent ?? 0) >= 100 &&
        (cache?.totalKeywords ?? 0) > 0,
      detail: '',
      icon: CheckCircle,
    },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
              step.done
                ? 'bg-success-soft border-[rgba(16,185,129,0.15)] text-success'
                : step.inProgress
                  ? 'bg-info-soft border-[rgba(59,130,246,0.15)] text-info'
                  : 'bg-glass-1 border-border-subtle text-text-muted'
            }`}
          >
            {step.done ? (
              <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
            ) : step.inProgress ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <step.icon className="w-3.5 h-3.5" strokeWidth={1.6} />
            )}
            <span>{step.label}</span>
            {step.detail && <span className="font-bold">{step.detail}</span>}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-4 h-px mx-0.5 ${step.done ? 'bg-success' : 'bg-border-subtle'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
