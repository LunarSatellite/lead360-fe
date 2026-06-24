import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { FlowNodeData } from '../../types/flow.types';

function Inner({ data }: { data: FlowNodeData }) {
  const method = (data.config as Record<string, string>)?.method || 'GET';
  const issue = data.issueLevel as string | undefined;

  const borderCls =
    issue === 'critical'     ? 'border-red-500'
    : issue === 'warning'    ? 'border-amber-400'
    : issue === 'suggestion' ? 'border-blue-400/60'
    : 'border-cyan-700';

  const pillCls =
    issue === 'critical'     ? 'bg-red-500 text-white'
    : issue === 'warning'    ? 'bg-amber-400 text-black'
    : issue === 'suggestion' ? 'bg-blue-500 text-white'
    : null;

  const pillText =
    issue === 'critical'     ? '● Needs setup'
    : issue === 'warning'    ? '⚠ Warning'
    : issue === 'suggestion' ? '💡 Tip'
    : null;

  return (
    <div className="relative" style={{ paddingTop: issue ? '22px' : '0' }}>
      {/* Floating pill — rendered above the node box, clearly visible on dark canvas */}
      {pillCls && pillText && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 px-2 py-[3px] rounded-full text-[10px] font-bold whitespace-nowrap z-20 cursor-pointer select-none ${pillCls}`}
          style={{ letterSpacing: '0.01em' }}
        >
          {pillText}
        </div>
      )}

      <div className={`w-[180px] bg-bg-card rounded-xl border-2 ${borderCls} hover:brightness-110 transition-all`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-bg-card" />
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-cyan-800">
          <div className="w-6 h-6 rounded-md bg-cyan-950 flex items-center justify-center text-xs">🔌</div>
          <span className="text-xs font-semibold text-text-primary truncate flex-1">{data.label}</span>
        </div>
        <div className="px-3 py-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] font-medium">{method}</span>
        </div>
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-bg-card" />
      </div>
    </div>
  );
}

export const ApiNode = memo(Inner);
