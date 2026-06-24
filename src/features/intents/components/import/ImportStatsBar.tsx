import { ImportRowStatus, type ImportRow } from '@/features/flow-builder/types/flow.types';

interface ImportStatsBarProps {
  rows: ImportRow[];
}

export function ImportStatsBar({ rows }: ImportStatsBarProps) {
  const counts = {
    ready: rows.filter((r) => r.status === ImportRowStatus.Ready || r.status === ImportRowStatus.Approved || r.status === ImportRowStatus.Enriched).length,
    needsAi: rows.filter((r) => r.status === ImportRowStatus.NeedsEnrichment).length,
    duplicate: rows.filter((r) => r.status === ImportRowStatus.Duplicate).length,
    invalid: rows.filter((r) => r.status === ImportRowStatus.Invalid).length,
    rejected: rows.filter((r) => r.status === ImportRowStatus.Rejected).length,
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Stat label="Total" value={rows.length} color="text-text-primary" bg="bg-glass-1" />
      <Stat label="Ready" value={counts.ready} color="text-emerald-600" bg="bg-emerald-50" />
      <Stat label="Needs AI" value={counts.needsAi} color="text-amber-600" bg="bg-amber-50" />
      <Stat label="Duplicate" value={counts.duplicate} color="text-blue-600" bg="bg-blue-50" />
      <Stat label="Invalid" value={counts.invalid} color="text-red-600" bg="bg-red-50" />
      {counts.rejected > 0 && (
        <Stat label="Rejected" value={counts.rejected} color="text-red-500" bg="bg-red-50" />
      )}
    </div>
  );
}

function Stat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${bg}`}>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[10px] font-medium text-text-muted">{label}</span>
    </div>
  );
}
