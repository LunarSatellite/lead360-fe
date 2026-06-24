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
          <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: '#111916' }} />
        ))}
      </div>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <FileJson style={{ width: 40, height: 40, color: '#708A7E', marginBottom: 12 }} strokeWidth={1.4} />
        <p style={{ fontSize: 14, fontWeight: 700, color: '#8A9B91' }}>No specs uploaded yet</p>
        <p style={{ fontSize: 12, color: '#708A7E', marginTop: 4 }}>
          Upload your first OpenAPI / Swagger specification above.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{ borderRadius: 16, background: '#0A0F0D', border: '1px solid #1E2E26', overflow: 'hidden' }}
      >
        <div
          className="grid grid-cols-[1fr_80px_100px_80px_100px_60px] gap-3 px-5 py-3 border-b"
          style={{
            borderColor: '#162019',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: '#708A7E',
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
            style={{ borderBottom: '1px solid #0D1410' }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#0D1410')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="min-w-0">
              <p style={{ fontSize: 14, fontWeight: 700, color: '#E8F0EC' }} className="truncate">
                {s.name}
              </p>
              {s.apiTitle && (
                <p style={{ fontSize: 12, color: '#708A7E' }} className="truncate">
                  {s.apiTitle}
                </p>
              )}
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#E8F0EC' }}>{s.endpointCount}</p>
            <StatusBadge variant={SPEC_STATUS_COLOR[s.status as SpecStatusValue]} dot>
              {SPEC_STATUS_LABEL[s.status as SpecStatusValue]}
            </StatusBadge>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#708A7E', textTransform: 'uppercase' }}>
              {s.fileFormat || '—'}
            </span>
            <span style={{ fontSize: 11, color: '#708A7E' }}>
              {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
            </span>
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => onSelect(s)} className="p-1 rounded" style={{ color: '#708A7E' }}>
                <Eye className="w-3.5 h-3.5" strokeWidth={1.6} />
              </button>
              <button onClick={() => setConfirmId(s.id)} className="p-1 rounded" style={{ color: '#708A7E' }}>
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
            style={{ background: '#0A0F0D', borderRadius: 16, border: '1px solid #1E2E26', padding: 24 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(244,63,94,0.08)',
                  border: '1px solid rgba(244,63,94,0.15)',
                }}
              >
                <AlertCircle style={{ width: 20, height: 20, color: '#F43F5E' }} strokeWidth={1.8} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E8F0EC' }}>Delete this spec?</h3>
                <p style={{ fontSize: 12, color: '#708A7E', marginTop: 4 }}>
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
                  color: '#8A9B91',
                  background: '#0D1410',
                  border: '1px solid #1E2E26',
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
