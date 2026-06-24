import { Handle, Position } from '@xyflow/react';
import { Menu, Star } from 'lucide-react';
import type { FlowNodeData } from '../../types/flow.types';

export function MenuNode({ data, selected }: { data: FlowNodeData; selected: boolean }) {
  return (
    <div
      className={`min-w-[200px] max-w-[260px] rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-info bg-[rgba(59,130,246,0.12)] shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : 'border-[rgba(59,130,246,0.2)] bg-glass-1'
      } ${!data.isActive ? 'opacity-40' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-info !border-2 !border-bg-shell" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-b-[rgba(59,130,246,0.15)]">
        <div className="w-6 h-6 rounded-md bg-info-soft flex items-center justify-center flex-shrink-0">
          <Menu className="w-3.5 h-3.5 text-info" strokeWidth={1.8} />
        </div>
        <span className="text-xs font-bold text-text-primary truncate">{data.label}</span>
        {data.isEntry && <Star className="w-3 h-3 text-warning flex-shrink-0" strokeWidth={2} fill="currentColor" />}
      </div>

      {/* Response preview */}
      <div className="px-3 py-2">
        <p className="text-2xs text-text-muted line-clamp-2 leading-relaxed">{data.responseTemplate}</p>
      </div>

      {/* Buttons */}
      {data.buttons.length > 0 && (
        <div className="px-3 pb-2.5 space-y-1">
          {data.buttons.map((btn, i) => (
            <div key={btn.id} className="relative">
              <div className="px-2.5 py-1.5 rounded-md bg-info-soft border border-[rgba(59,130,246,0.12)] text-2xs font-semibold text-info text-center truncate">
                {btn.label}
              </div>
              <Handle
                type="source"
                position={Position.Bottom}
                id={btn.id}
                className="!w-2.5 !h-2.5 !bg-info !border-2 !border-bg-shell"
                style={{ left: `${((i + 0.5) / data.buttons.length) * 100}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Default source handle if no buttons */}
      {data.buttons.length === 0 && (
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-info !border-2 !border-bg-shell" />
      )}
    </div>
  );
}
