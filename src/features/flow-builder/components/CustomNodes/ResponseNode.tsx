import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { FlowNodeData } from '../../types/flow.types';

function Inner({ data }: { data: FlowNodeData }) {
  const issue = data.issueLevel as string | undefined;
  const cfg = data.config as { message?: string; menuItems?: { label: string }[] };
  const rawMsg     = cfg?.message ?? '';
  const menuItems  = cfg?.menuItems ?? [];
  const preview    = rawMsg.length > 55 ? rawMsg.slice(0, 52) + '…' : rawMsg;

  const borderCls =
    issue === 'critical'     ? 'border-red-500'
    : issue === 'warning'    ? 'border-amber-400'
    : issue === 'suggestion' ? 'border-blue-400/60'
    : 'border-pink-700';

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
      {pillCls && pillText && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 px-2 py-[3px] rounded-full text-[10px] font-bold whitespace-nowrap z-20 cursor-pointer select-none ${pillCls}`}
          style={{ letterSpacing: '0.01em' }}
        >
          {pillText}
        </div>
      )}

      <div className={`w-[190px] bg-bg-card rounded-xl border-2 ${borderCls} hover:brightness-110 transition-all`}>
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-pink-500 !border-2 !border-bg-card" />
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-pink-800">
          <div className="w-6 h-6 rounded-md bg-pink-950 flex items-center justify-center text-xs">💬</div>
          <span className="text-xs font-semibold text-text-primary truncate flex-1">{data.label}</span>
        </div>
        <div className="px-3 py-2 flex flex-col gap-1.5">
          {preview && (
            <p className="text-[10px] text-text-secondary leading-snug line-clamp-2">{preview}</p>
          )}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-pink-950 text-pink-400 text-[10px] font-medium">Message</span>
            {menuItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-pink-900/60 text-pink-300 text-[10px] font-medium">
                {menuItems.length} option{menuItems.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-pink-500 !border-2 !border-bg-card" />
      </div>
    </div>
  );
}

export const ResponseNode = memo(Inner);
