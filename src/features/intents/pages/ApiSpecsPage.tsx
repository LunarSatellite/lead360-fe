import { useState, useMemo } from 'react';
import { FileJson, Plus, Target, CheckCircle, AlertCircle, Link2 } from 'lucide-react';
import { useApiSpecs } from '../api/api-specs.queries';
import { ApiSpecList } from '../components/ApiSpecList';
import { ApiSpecUploadDialog } from '../components/ApiSpecUploadDialog';
import { ApiSpecStatus } from '../types/api-specs.types';
import type { ApiSpecificationDto } from '../types/api-specs.types';

export function Component() {
  const { data: rawSpecs, isLoading } = useApiSpecs();
  const specs = (rawSpecs as unknown as ApiSpecificationDto[]) ?? [];

  const [uploadOpen, setUploadOpen] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const totalSpecs = specs.length;
    const totalEndpoints = specs.reduce((sum, s) => sum + s.endpointCount, 0);
    const parsed = specs.filter((s) => s.status === ApiSpecStatus.Parsed).length;
    const failed = specs.filter((s) => s.status === ApiSpecStatus.Failed).length;
    return { totalSpecs, totalEndpoints, parsed, failed };
  }, [specs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[3px] text-brand">
            Intents / API Specifications
          </div>
          <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-0.5">
            API Specifications
          </div>
          <div className="text-sm text-text-secondary mt-1">
            Upload and manage your Swagger / OpenAPI specs. Parsed endpoints feed into the Capability Map and LLM-suggested intents.
          </div>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Upload Spec
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Specs" value={stats.totalSpecs} icon={FileJson} accent="brand" />
        <StatCard label="Total Endpoints" value={stats.totalEndpoints} icon={Link2} accent="info" />
        <StatCard label="Parsed" value={stats.parsed} icon={CheckCircle} accent="success" />
        <StatCard label="Failed" value={stats.failed} icon={AlertCircle} accent={stats.failed > 0 ? 'danger' : 'muted'} />
      </div>

      {/* Spec list */}
      <ApiSpecList
        specs={specs}
        isLoading={isLoading}
        onUploadClick={() => setUploadOpen(true)}
      />

      {/* Upload dialog */}
      <ApiSpecUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}

// ─── Stat Card ───

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'brand',
}: {
  label: string;
  value: number;
  icon: typeof Target;
  accent?: 'brand' | 'success' | 'info' | 'warning' | 'danger' | 'muted';
}) {
  const accentMap: Record<string, string> = {
    brand: 'text-brand',
    success: 'text-success',
    info: 'text-info',
    warning: 'text-warning',
    danger: 'text-danger',
    muted: 'text-text-muted',
  };

  return (
    <div className="bg-glass-1 border border-border-subtle rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.6} />
        <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold tracking-tight ${accentMap[accent]}`}>{value}</div>
    </div>
  );
}
