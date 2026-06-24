import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Sparkles, Shield } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import {
  useCapabilityMap,
  useCapabilitySummary,
  useGenerateCapabilityMap,
} from '../api/api-connection.queries';
import type { CapabilityDto, CapabilityGroupDto } from '../types/api-connection.types';

interface CapabilityMapViewProps {
  specId: string;
}

export function CapabilityMapView({ specId }: CapabilityMapViewProps) {
  const { data: rawMap, isLoading, isError } = useCapabilityMap(specId);
  const { data: rawSummary } = useCapabilitySummary(specId);
  const generate = useGenerateCapabilityMap();

  const map = rawMap as any;
  const summary = rawSummary as any;
  const groups: CapabilityGroupDto[] = Array.isArray(map)
    ? map
    : (map as any)?.groups
      ? (map as any).groups
      : [];
  const isEmpty = !isLoading && groups.length === 0;

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-glass-1 rounded-xl animate-pulse" />
        ))}
      </div>
    );

  if (isEmpty || isError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Sparkles className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.4} />
        <p className="text-sm font-bold text-text-secondary">No capability map yet</p>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          Generate a capability map from your parsed API endpoints.
        </p>
        <button
          onClick={() => generate.mutate(specId)}
          disabled={generate.isPending}
          className="flex items-center gap-2 mt-4 px-5 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
        >
          {generate.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" strokeWidth={1.8} />
          )}
          Generate Capability Map
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {summary && (
        <div className="flex items-center gap-3 flex-wrap">
          <SummaryPill label="Total" value={summary.totalCapabilities} color="brand" />
          <SummaryPill label="Read" value={summary.readCount} color="info" />
          <SummaryPill label="Create" value={summary.createCount} color="success" />
          <SummaryPill label="Update" value={summary.updateCount} color="warning" />
          <SummaryPill label="Delete" value={summary.deleteCount} color="danger" />
        </div>
      )}

      {/* Groups */}
      {groups.map((group) => (
        <CapabilityGroup key={group.id} group={group} />
      ))}
    </div>
  );
}

function CapabilityGroup({ group }: { group: CapabilityGroupDto }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-glass-1 transition-all"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-text-muted" strokeWidth={1.6} />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted" strokeWidth={1.6} />
        )}
        <span className="text-[14px] font-bold text-text-primary">{group.name}</span>
        <span className="ml-auto text-[11px] font-semibold text-text-muted bg-glass-2 px-2 py-0.5 rounded">
          {group.capabilities.length}
        </span>
      </button>
      {open && (
        <div className="border-t border-border-subtle px-4 py-3 space-y-2">
          {group.capabilities.map((cap) => (
            <CapabilityCard key={cap.id} capability={cap} />
          ))}
        </div>
      )}
    </div>
  );
}

function CapabilityCard({ capability }: { capability: CapabilityDto }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-glass-1 border border-border-subtle rounded-xl hover:bg-glass-2 transition-all">
      <MethodBadge method={capability.httpMethod} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-text-primary truncate">{capability.name}</p>
        <code className="text-[11px] font-mono text-text-muted truncate block">
          {capability.endpointPath}
        </code>
      </div>
      <span className="px-2 py-0.5 rounded bg-info-soft text-[11px] font-bold text-info">
        {capability.operationType}
      </span>
      <div className="flex items-center gap-0.5" title={`Complexity: ${capability.complexity}/5`}>
        {[1, 2, 3, 4, 5].map((d) => (
          <span
            key={d}
            className={`w-1.5 h-1.5 rounded-full ${d <= capability.complexity ? 'bg-warning' : 'bg-glass-3'}`}
          />
        ))}
      </div>
      {capability.requiresAuth && (
        <Shield className="w-3.5 h-3.5 text-warning flex-shrink-0" strokeWidth={1.6} />
      )}
    </div>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-soft text-brand',
    info: 'bg-info-soft text-info',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  };
  return (
    <div
      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${colorMap[color] || 'bg-glass-2 text-text-muted'}`}
    >
      {label}: {value}
    </div>
  );
}
