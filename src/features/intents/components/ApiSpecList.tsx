import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileJson, Trash2, RefreshCw, Eye, MoreHorizontal,
  Loader2, AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/shared/components';
import { useDeleteApiSpec, useReparseApiSpec } from '../api/api-specs.queries';
import {
  API_SPEC_STATUS_LABEL,
  API_SPEC_STATUS_COLOR,
  ApiSpecStatus,
} from '../types/api-specs.types';
import type { ApiSpecificationDto, ApiSpecStatusValue } from '../types/api-specs.types';

interface ApiSpecListProps {
  specs: ApiSpecificationDto[];
  isLoading: boolean;
  onUploadClick: () => void;
}

export function ApiSpecList({ specs, isLoading, onUploadClick }: ApiSpecListProps) {
  const navigate = useNavigate();
  const deleteSpec = useDeleteApiSpec();
  const reparseSpec = useReparseApiSpec();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteSpec.mutate(id, { onSuccess: () => setConfirmDeleteId(null) });
  };

  const handleReparse = (id: string) => {
    setOpenMenuId(null);
    reparseSpec.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-xl bg-glass-2 flex items-center justify-center mb-4">
          <FileJson className="w-7 h-7 text-text-muted" strokeWidth={1.6} />
        </div>
        <p className="text-base font-bold text-text-secondary">No API specifications uploaded</p>
        <p className="text-sm text-text-muted mt-1 max-w-sm">
          Upload your Swagger or OpenAPI spec to automatically extract all endpoints.
          This feeds into the Capability Map and LLM-suggested intents.
        </p>
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all"
        >
          <FileJson className="w-4 h-4" strokeWidth={1.8} />
          Upload your first spec
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_80px_80px_100px_90px_100px_44px] gap-3 px-5 py-3 border-b border-border-subtle text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted">
          <span>Name</span>
          <span>API Title</span>
          <span>Version</span>
          <span>Format</span>
          <span>Status</span>
          <span className="text-right">Endpoints</span>
          <span>Uploaded</span>
          <span />
        </div>

        {/* Rows */}
        {specs.map((spec) => (
          <div
            key={spec.id}
            className="grid grid-cols-[1fr_1fr_80px_80px_100px_90px_100px_44px] gap-3 items-center px-5 py-3 border-b border-border-subtle last:border-b-0 hover:bg-glass-1 transition-all cursor-pointer group"
            onClick={() => navigate(`/dashboard/api-specs/${spec.id}`)}
          >
            {/* Name */}
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">{spec.name}</p>
              {spec.description && (
                <p className="text-xs text-text-muted truncate mt-0.5">{spec.description}</p>
              )}
            </div>

            {/* API Title */}
            <p className="text-xs text-text-secondary truncate">{spec.apiTitle || '—'}</p>

            {/* Version */}
            <p className="text-xs text-text-secondary font-mono">{spec.apiVersion || '—'}</p>

            {/* Format */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-glass-2 text-[10px] font-bold text-text-secondary uppercase tracking-wide w-fit">
              {spec.fileFormat || '—'}
            </span>

            {/* Status */}
            <StatusBadge variant={API_SPEC_STATUS_COLOR[spec.status as ApiSpecStatusValue]} dot>
              {API_SPEC_STATUS_LABEL[spec.status as ApiSpecStatusValue]}
            </StatusBadge>

            {/* Endpoint count */}
            <p className="text-sm font-extrabold text-text-primary text-right tracking-tight">
              {spec.endpointCount}
            </p>

            {/* Uploaded */}
            <p className="text-[10px] text-text-muted">
              {formatDistanceToNow(new Date(spec.createdAt), { addSuffix: true })}
            </p>

            {/* Actions menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpenMenuId(openMenuId === spec.id ? null : spec.id)}
                className="p-1.5 rounded-lg hover:bg-glass-2 text-text-muted hover:text-text-primary transition-all opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.6} />
              </button>

              {openMenuId === spec.id && (
                <RowMenu
                  specId={spec.id}
                  status={spec.status}
                  onView={() => {
                    setOpenMenuId(null);
                    navigate(`/dashboard/api-specs/${spec.id}`);
                  }}
                  onReparse={() => handleReparse(spec.id)}
                  onDelete={() => {
                    setOpenMenuId(null);
                    setConfirmDeleteId(spec.id);
                  }}
                  onClose={() => setOpenMenuId(null)}
                  isReparsing={reparseSpec.isPending}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <ConfirmDeleteDialog
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
          isPending={deleteSpec.isPending}
        />
      )}
    </>
  );
}

// ─── Row context menu ───

function RowMenu({
  specId: _specId,
  status,
  onView,
  onReparse,
  onDelete,
  onClose,
  isReparsing,
}: {
  specId: string;
  status: number;
  onView: () => void;
  onReparse: () => void;
  onDelete: () => void;
  onClose: () => void;
  isReparsing: boolean;
}) {
  return (
    <>
      {/* Backdrop to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-bg-card border border-border-subtle rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={onView}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-text-secondary hover:bg-glass-1 hover:text-text-primary transition-all"
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={1.6} />
          View detail
        </button>
        {(status === ApiSpecStatus.Parsed || status === ApiSpecStatus.Failed) && (
          <button
            onClick={onReparse}
            disabled={isReparsing}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-text-secondary hover:bg-glass-1 hover:text-text-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReparsing ? 'animate-spin' : ''}`} strokeWidth={1.6} />
            Re-parse
          </button>
        )}
        <div className="border-t border-border-subtle" />
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-danger hover:bg-danger-soft transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6} />
          Delete
        </button>
      </div>
    </>
  );
}

// ─── Confirm delete dialog ───

function ConfirmDeleteDialog({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm mx-4 bg-bg-card rounded-2xl border border-border-subtle shadow-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-danger-soft flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-danger" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Delete API Spec?</h3>
            <p className="text-xs text-text-muted mt-1">
              This will permanently remove the spec and all its parsed endpoints. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:bg-glass-2 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
