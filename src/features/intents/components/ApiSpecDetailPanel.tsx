import { useState } from 'react';
import {
  RefreshCw, Trash2, Download, AlertCircle, Globe, Shield, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from '@/shared/components';
import { ApiEndpointList } from './ApiEndpointList';
import { useReparseApiSpec, useDeleteApiSpec } from '../api/api-specs.queries';
import {
  ApiSpecStatus,
  API_SPEC_STATUS_LABEL,
  API_SPEC_STATUS_COLOR,
  parseJsonField,
} from '../types/api-specs.types';
import type { ApiSpecificationDetailDto, ApiSpecStatusValue } from '../types/api-specs.types';

type TabId = 'endpoints' | 'raw';

interface ApiSpecDetailPanelProps {
  spec: ApiSpecificationDetailDto;
  onDeleted?: () => void;
}

export function ApiSpecDetailPanel({ spec, onDeleted }: ApiSpecDetailPanelProps) {
  const [tab, setTab] = useState<TabId>('endpoints');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reparseSpec = useReparseApiSpec();
  const deleteSpec = useDeleteApiSpec();

  const baseUrls = parseJsonField<string[]>(spec.baseUrlsJson);
  const securitySchemes = parseJsonField<Record<string, any>>(spec.securitySchemesJson);

  const handleDelete = () => {
    deleteSpec.mutate(spec.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        onDeleted?.();
      },
    });
  };

  const handleDownloadRaw = () => {
    if (!spec.rawSpecContent) return;
    const blob = new Blob([spec.rawSpecContent], {
      type: spec.fileFormat === 'yaml' ? 'text/yaml' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = spec.originalFileName || `${spec.name}.${spec.fileFormat || 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Error banner for failed specs */}
      {spec.status === ApiSpecStatus.Failed && spec.parseError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger-soft border border-[rgba(244,63,94,0.15)]">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" strokeWidth={1.8} />
          <div>
            <p className="text-sm font-bold text-danger">Parsing failed</p>
            <p className="text-xs text-danger/80 mt-1 font-mono leading-relaxed">{spec.parseError}</p>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
        {/* Header with actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-text-primary">{spec.name}</h2>
              {spec.description && (
                <p className="text-xs text-text-muted mt-0.5">{spec.description}</p>
              )}
            </div>
            <StatusBadge variant={API_SPEC_STATUS_COLOR[spec.status as ApiSpecStatusValue]} dot>
              {API_SPEC_STATUS_LABEL[spec.status as ApiSpecStatusValue]}
            </StatusBadge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reparseSpec.mutate(spec.id)}
              disabled={reparseSpec.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-glass-1 border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reparseSpec.isPending ? 'animate-spin' : ''}`} strokeWidth={1.6} />
              Re-parse
            </button>
            {spec.rawSpecContent && (
              <button
                onClick={handleDownloadRaw}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-glass-1 border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-glass-2 transition-all"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.6} />
                Download
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.12)] text-xs font-semibold text-danger hover:brightness-110 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
              Delete
            </button>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 border-b border-border-subtle">
          <MetaItem label="API Title" value={spec.apiTitle} />
          <MetaItem label="API Version" value={spec.apiVersion} mono />
          <MetaItem label="Spec Version" value={spec.specVersion ? `OpenAPI ${spec.specVersion}` : null} />
          <MetaItem label="Format" value={spec.fileFormat?.toUpperCase()} />
          <MetaItem label="Endpoints" value={String(spec.endpointCount)} bold />
          <MetaItem label="Original File" value={spec.originalFileName} />
          <MetaItem
            label="Parsed At"
            value={spec.parsedAt ? format(new Date(spec.parsedAt), 'MMM d, yyyy HH:mm') : null}
          />
          <MetaItem
            label="Uploaded"
            value={format(new Date(spec.createdAt), 'MMM d, yyyy HH:mm')}
          />
        </div>

        {/* Base URLs */}
        {baseUrls && baseUrls.length > 0 && (
          <div className="px-6 py-3 border-b border-border-subtle">
            <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted mb-2">Base URLs</p>
            <div className="flex flex-wrap gap-2">
              {baseUrls.map((url, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info-soft border border-[rgba(59,130,246,0.12)] text-xs font-mono text-info"
                >
                  <Globe className="w-3 h-3" strokeWidth={1.6} />
                  {url}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Security schemes */}
        {securitySchemes && Object.keys(securitySchemes).length > 0 && (
          <div className="px-6 py-3 border-b border-border-subtle">
            <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted mb-2">Security Schemes</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(securitySchemes).map(([name, scheme]) => (
                <span
                  key={name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-soft border border-[rgba(245,158,11,0.12)] text-xs font-bold text-warning"
                >
                  <Shield className="w-3 h-3" strokeWidth={1.8} />
                  {name}
                  {typeof scheme === 'object' && scheme?.type && (
                    <span className="text-[9px] font-normal opacity-70">({scheme.type})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        {(['endpoints', 'raw'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              tab === t
                ? 'text-brand border-brand'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            {t === 'endpoints' ? `Endpoints (${spec.endpointCount})` : 'Raw Spec'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'endpoints' ? (
        <ApiEndpointList endpoints={spec.endpoints || []} />
      ) : (
        <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
          {spec.rawSpecContent ? (
            <pre className="p-5 text-[11px] font-mono text-text-secondary leading-relaxed overflow-auto max-h-[600px] whitespace-pre-wrap">
              {spec.rawSpecContent}
            </pre>
          ) : (
            <p className="text-sm text-text-muted py-8 text-center">
              Raw spec content is not available.
            </p>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm mx-4 bg-bg-card rounded-2xl border border-border-subtle shadow-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-danger-soft flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-danger" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Delete "{spec.name}"?</h3>
                <p className="text-xs text-text-muted mt-1">
                  This will permanently remove the spec and all {spec.endpointCount} parsed endpoints.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleteSpec.isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:bg-glass-2 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteSpec.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
              >
                {deleteSpec.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Meta item ───

function MetaItem({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted mb-1">{label}</p>
      <p
        className={`text-xs truncate ${
          mono ? 'font-mono' : ''
        } ${bold ? 'font-extrabold text-text-primary' : 'text-text-secondary'}`}
      >
        {value || '—'}
      </p>
    </div>
  );
}
