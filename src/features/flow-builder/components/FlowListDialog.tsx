import { X, Loader2, Trash2, Copy, Check } from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import { useFlows, useDeleteFlow, useDuplicateFlow } from '../api/flow.queries';
import { FLOW_STATUS_LABEL, type FlowDto } from '../types/flow.types';

interface FlowListDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (flow: FlowDto) => void;
}

export function FlowListDialog({ open, onClose, onSelect }: FlowListDialogProps) {
  const { data: flows, isLoading } = useFlows();
  const deleteFlow = useDeleteFlow();
  const duplicateFlow = useDuplicateFlow();

  if (!open) return null;

  const flowList = (flows as unknown as FlowDto[]) ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl w-[480px] max-h-[70vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h3 className="text-sm font-bold text-text-primary">Saved Flows</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-glass-1">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-brand animate-spin" />
            </div>
          ) : flowList.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-2 opacity-40">📋</div>
              <p className="text-xs text-text-muted">No flows yet. Generate one with the Magic Bar!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {flowList.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-soft/30 transition-all cursor-pointer group"
                  onClick={() => {
                    onSelect(f);
                    onClose();
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary truncate">{f.name}</span>
                      {f.isActive && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-brand">
                          <Check className="w-2.5 h-2.5" /> Live
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      v{f.version} • {f.nodeCount} nodes • {FLOW_STATUS_LABEL[f.status] || 'Draft'} • {f.createdVia}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateFlow.mutate(f.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-glass-1"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3 text-text-muted" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDialog({ message: `Delete "${f.name}"?`, confirmText: 'Delete', danger: true }).then((ok) => { if (ok) deleteFlow.mutate(f.id); });
                      }}
                      disabled={f.isActive}
                      className="p-1.5 rounded-md hover:bg-danger-soft disabled:opacity-30"
                      title={f.isActive ? 'Cannot delete active flow' : 'Delete'}
                    >
                      <Trash2 className="w-3 h-3 text-danger" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
