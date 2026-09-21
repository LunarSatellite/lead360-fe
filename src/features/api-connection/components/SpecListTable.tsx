import { useState } from 'react';
import { Trash2, Eye, Loader2, AlertCircle, FileJson } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/shared/components';
import { useDeleteSpec } from '../api/api-connection.queries';
import { SPEC_STATUS_LABEL, SPEC_STATUS_COLOR } from '../types/api-connection.types';
import type { ApiSpecDto, SpecStatusValue } from '../types/api-connection.types';

interface SpecListTableProps {
  specs: ApiSpecDto[];
  isLoading: boolean;
  onSelect: (spec: ApiSpecDto) => void;
}

export function SpecListTable({ specs, isLoading, onSelect }: SpecListTableProps) {
  const deleteSpec = useDeleteSpec();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'rgb(var(--color-surface-inset))' }} />
        ))}
      </div>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <FileJson style={{ width: 40, height: 40, color: 'rgb(var(--color-text-muted))', marginBottom: 12 }} strokeWidth={1.4} />
        <p style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--color-text-muted))' }}>No specs uploaded yet</p>
        <p style={{ fontSize: 12, color: 'rgb(var(--color-text-muted))', marginTop: 4 }}>
          Upload your first OpenAPI / Swagger specification above.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{ borderRadius: 16, background: 'rgb(var(--color-surface-sunken))', border: '1px solid rgb(var(--color-border-subtle))', overflow: 'hidden' }}
      >
        <div
          className="grid grid-cols-[1fr_80px_100px_80px_100px_60px] gap-3 px-5 py-3 border-b"
          style={{
            borderColor: 'rgb(var(--color-border-subtle))',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: 'rgb(var(--color-text-muted))',
          }}
        >
          <span>Name</span>
          <span>Endpoints</span>
          <span>Status</span>
          <span>Format</span>
          <span>Uploaded</span>
          <span />
        </div>
        {specs.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect(s)}
            className="grid grid-cols-[1fr_80px_100px_80px_100px_60px] gap-3 items-center px-5 py-3.5 cursor-pointer transition-all group"
            style={{ borderBottom: '1px solid rgb(var(--color-border-subtle))' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgb(var(--color-surface-app))')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="min-w-0">
              <p style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--color-text-primary))' }} className="truncate">
                {s.name}
              </p>
              {s.apiTitle && (
                <p style={{ fontSize: 12, color: 'rgb(var(--color-text-muted))' }} className="truncate">
                  {s.apiTitle}
                </p>
              )}
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'rgb(var(--color-text-primary))' }}>{s.endpointCount}</p>
            <StatusBadge variant={SPEC_STATUS_COLOR[s.status as SpecStatusValue]} dot>
              {SPEC_STATUS_LABEL[s.status as SpecStatusValue]}
            </StatusBadge>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgb(var(--color-text-muted))', textTransform: 'uppercase' }}>
              {s.fileFormat || '—'}
            </span>
            <span style={{ fontSize: 11, color: 'rgb(var(--color-text-muted))' }}>
              {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
            </span>
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => onSelect(s)} className="p-1 rounded" style={{ color: 'rgb(var(--color-text-muted))' }}>
                <Eye className="w-3.5 h-3.5" strokeWidth={1.6} />
              </button>
              <button onClick={() => setConfirmId(s.id)} className="p-1 rounded" style={{ color: 'rgb(var(--color-text-muted))' }}>
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmId(null)} />
          <div
            className="relative w-full max-w-sm mx-4"
            style={{ background: 'rgb(var(--color-surface-sunken))', borderRadius: 16, border: '1px solid rgb(var(--color-border-subtle))', padding: 24 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgb(var(--color-danger) / 0.08)',
                  border: '1px solid rgb(var(--color-danger) / 0.15)',
                }}
              >
                <AlertCircle style={{ width: 20, height: 20, color: 'rgb(var(--color-danger))' }} strokeWidth={1.8} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--color-text-primary))' }}>Delete this spec?</h3>
                <p style={{ fontSize: 12, color: 'rgb(var(--color-text-muted))', marginTop: 4 }}>
                  This removes the spec and all parsed data.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgb(var(--color-text-muted))',
                  background: 'rgb(var(--color-surface-app))',
                  border: '1px solid rgb(var(--color-border-subtle))',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSpec.mutate(confirmId);
                  setConfirmId(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  background: '#E11D48',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                }}
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
    </>
  );
}
