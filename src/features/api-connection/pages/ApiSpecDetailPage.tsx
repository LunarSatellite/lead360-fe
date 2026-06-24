import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/shared/components';
import { useSpec, useEndpoints } from '../api/api-connection.queries';
import { EndpointTable } from '../components/EndpointTable';
import { CapabilityMapView } from '../components/CapabilityMapView';
import { AnalysisView } from '../components/AnalysisView';
import { SPEC_STATUS_LABEL, SPEC_STATUS_COLOR } from '../types/api-connection.types';
import type { ApiSpecDetailDto, EndpointDto, SpecStatusValue } from '../types/api-connection.types';

type TabId = 'endpoints' | 'capability' | 'analysis';

export function Component() {
  const { specId } = useParams<{ specId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('endpoints');

  const { data: rawSpec, isLoading, error } = useSpec(specId);
  const spec = rawSpec as unknown as ApiSpecDetailDto | undefined;

  const { data: rawEndpoints } = useEndpoints(specId);
  const endpoints = (rawEndpoints as unknown as EndpointDto[]) ?? spec?.endpoints ?? [];

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );

  if (error || !spec) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <AlertCircle
          style={{ width: 40, height: 40, color: '#F43F5E', marginBottom: 12 }}
          strokeWidth={1.4}
        />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#8A9B91' }}>Spec not found</p>
        <button
          onClick={() => navigate('/dashboard/api-connection')}
          className="flex items-center gap-2 mt-4"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#00D97E',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#708A7E' }}>
        <button
          onClick={() => navigate('/dashboard/api-connection')}
          className="font-semibold transition-all"
          style={{ color: '#708A7E', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#E8F0EC')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#708A7E')}
        >
          API Connection
        </button>
        <ChevronRight className="w-3 h-3" strokeWidth={1.6} />
        <span style={{ color: '#8A9B91', fontWeight: 600 }} className="truncate max-w-[300px]">
          {spec.name}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8F0EC' }}>{spec.name}</h2>
        <StatusBadge variant={SPEC_STATUS_COLOR[spec.status as SpecStatusValue]} dot>
          {SPEC_STATUS_LABEL[spec.status as SpecStatusValue]}
        </StatusBadge>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#708A7E',
            background: '#111916',
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {spec.endpointCount} endpoints
        </span>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid #1E2E26' }}>
        {[
          { id: 'endpoints' as const, label: `Endpoints (${spec.endpointCount})` },
          { id: 'capability' as const, label: 'Capability Map' },
          { id: 'analysis' as const, label: 'AI Analysis' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? '#00D97E' : 'transparent'}`,
              color: tab === t.id ? '#00D97E' : '#708A7E',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'endpoints' && <EndpointTable endpoints={endpoints} />}
      {tab === 'capability' && <CapabilityMapView specId={spec.id} />}
      {tab === 'analysis' && <AnalysisView specId={spec.id} />}
    </div>
  );
}
