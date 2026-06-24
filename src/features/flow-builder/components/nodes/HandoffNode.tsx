import { Handle, Position } from '@xyflow/react';
import { Headphones } from 'lucide-react';
import type { FlowNodeData } from '../../types/flow.types';

export function HandoffNode({ data, selected }: { data: FlowNodeData; selected: boolean }) {
  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-warning bg-[rgba(245,158,11,0.12)] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
          : 'border-[rgba(245,158,11,0.2)] bg-glass-1'
      } ${!data.isActive ? 'opacity-40' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-warning !border-2 !border-bg-shell" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-b-[rgba(245,158,11,0.15)]">
        <div className="w-6 h-6 rounded-md bg-warning-soft flex items-center justify-center flex-shrink-0">
          <Headphones className="w-3.5 h-3.5 text-warning" strokeWidth={1.8} />
        </div>
        <span className="text-xs font-bold text-text-primary truncate">{data.label}</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        <p className="text-2xs text-text-muted line-clamp-2 leading-relaxed">{data.responseTemplate}</p>
        {data.handoffTarget && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[8px] font-bold uppercase tracking-[1px] text-text-muted">Target:</span>
            <span className="text-2xs font-semibold text-warning">{data.handoffTarget}</span>
          </div>
        )}
      </div>

      {/* No source handle — handoff is terminal */}
    </div>
  );
}
