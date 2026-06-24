import { Handle, Position } from '@xyflow/react';
import { BrainCircuit } from 'lucide-react';
import type { FlowNodeData } from '../../types/flow.types';

export function ChatNode({ data, selected }: { data: FlowNodeData; selected: boolean }) {
  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-brand bg-brand-soft shadow-[0_0_20px_rgba(5,150,105,0.15)]'
          : 'border-[rgba(5,150,105,0.2)] bg-glass-1'
      } ${!data.isActive ? 'opacity-40' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-brand !border-2 !border-bg-shell" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-b-[rgba(5,150,105,0.15)]">
        <div className="w-6 h-6 rounded-md bg-brand-soft flex items-center justify-center flex-shrink-0">
          <BrainCircuit className="w-3.5 h-3.5 text-brand" strokeWidth={1.8} />
        </div>
        <span className="text-xs font-bold text-text-primary truncate">{data.label}</span>
        <span className="ml-auto text-[11px] font-bold uppercase tracking-[1px] text-brand bg-brand-soft px-1.5 py-0.5 rounded">AI</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        <p className="text-2xs text-text-muted line-clamp-2 leading-relaxed">{data.responseTemplate}</p>
        {data.intentName && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted">Intent:</span>
            <span className="text-2xs font-semibold text-brand">{data.intentName}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-brand !border-2 !border-bg-shell" />
    </div>
  );
}
