import type { Node } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import type { FlowNodeData } from '../types/flow.types';
import { NODE_TYPE_META } from '../types/flow.types';

interface NodeConfigPanelProps {
  node: Node<FlowNodeData> | null;
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void;
  onDelete: (nodeId: string) => void;
}

export function NodeConfigPanel({ node, onUpdate, onDelete }: NodeConfigPanelProps) {
  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <div className="text-3xl mb-3 opacity-40">🖱️</div>
        <p className="text-xs text-text-muted">Select a node on the canvas to configure it</p>
      </div>
    );
  }

  const data = node.data as FlowNodeData;
  const meta = NODE_TYPE_META[data.nodeType];

  return (
    <div className="p-3 space-y-3">
      {/* Node header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
          style={{ background: meta?.bgClass ? undefined : '#F1F5F9' }}
        >
          {meta?.icon || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-text-primary truncate">{data.label}</div>
          <div className="text-[10px] text-text-muted">{meta?.label || data.nodeType} • {node.id}</div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Name</label>
        <input
          value={data.label}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs outline-none focus:border-brand bg-white"
        />
      </div>

      {/* Type (read-only) */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Type</label>
        <input
          value={meta?.label || data.nodeType}
          disabled
          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-xs bg-glass-1 text-text-muted"
        />
      </div>

      {/* Config JSON (editable for advanced users) */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Configuration</label>
        <textarea
          value={JSON.stringify(data.config || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onUpdate(node.id, { config: parsed });
            } catch {
              // Invalid JSON — don't update
            }
          }}
          rows={4}
          className="w-full px-2.5 py-1.5 border border-border-subtle rounded-lg text-[10px] font-mono outline-none focus:border-brand bg-white resize-none"
        />
      </div>

      {/* Entry Point toggle */}
      <div className="flex items-center justify-between">
        <span className="text-2xs font-semibold text-text-secondary">Entry Point</span>
        <button
          onClick={() => onUpdate(node.id, { isEntryPoint: !data.isEntryPoint })}
          className={`w-8 h-4 rounded-full transition-colors ${data.isEntryPoint ? 'bg-brand' : 'bg-glass-2'}`}
        >
          <div
            className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${data.isEntryPoint ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(node.id)}
        className="w-full mt-2 py-2 rounded-lg bg-danger-soft border border-[rgba(244,63,94,.12)] text-2xs font-semibold text-danger cursor-pointer hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
      >
        <Trash2 className="w-3 h-3" />
        Delete Node
      </button>
    </div>
  );
}
