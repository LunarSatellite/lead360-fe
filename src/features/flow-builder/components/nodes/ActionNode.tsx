import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';
import type { FlowNodeData } from '../../types/flow.types';

export function ActionNode({ data, selected }: { data: FlowNodeData; selected: boolean }) {
  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-success bg-[rgba(6,214,160,0.12)] shadow-[0_0_20px_rgba(6,214,160,0.15)]'
          : 'border-[rgba(6,214,160,0.2)] bg-glass-1'
      } ${!data.isActive ? 'opacity-40' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-success !border-2 !border-bg-shell" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-b-[rgba(6,214,160,0.15)]">
        <div className="w-6 h-6 rounded-md bg-success-soft flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-success" strokeWidth={1.8} />
        </div>
        <span className="text-xs font-bold text-text-primary truncate">{data.label}</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        <p className="text-2xs text-text-muted line-clamp-2 leading-relaxed">{data.responseTemplate}</p>
        {data.apiEndpoint && (
          <div className="mt-2 px-2 py-1 rounded-md bg-glass-2 border border-border-subtle">
            <span className="text-[8px] font-bold text-success font-mono">{data.apiMethod}</span>
            <span className="text-2xs text-text-muted font-mono ml-1.5">{data.apiEndpoint}</span>
          </div>
        )}
        {data.intentName && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[8px] font-bold uppercase tracking-[1px] text-text-muted">Intent:</span>
            <span className="text-2xs font-semibold text-success">{data.intentName}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-success !border-2 !border-bg-shell" />
    </div>
  );
}
