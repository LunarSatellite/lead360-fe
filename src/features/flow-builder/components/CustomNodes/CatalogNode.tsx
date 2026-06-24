import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { FlowNodeData } from '../../types/flow.types';

const ACTION_LABEL: Record<string, string> = {
  browse: '📂 Browse Categories',
  items:  '🛍️ Show Items',
  detail: '🔍 Item Detail',
  order:  '🛒 Collect Order',
};

function Inner({ data }: { data: FlowNodeData }) {
  const issue = data.issueLevel as string | undefined;
  const cfg = data.config as { action?: string; categoryId?: string };
  const action = cfg?.action ?? 'browse';
  const actionLabel = ACTION_LABEL[action] ?? `⚙️ ${action}`;

  const borderCls =
    issue === 'critical'     ? 'border-red-500'
    : issue === 'warning'    ? 'border-amber-400'
    : issue === 'suggestion' ? 'border-blue-400/60'
    : 'border-violet-600';

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
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-violet-500 !border-2 !border-bg-card" />
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-violet-800">
          <div className="w-6 h-6 rounded-md bg-violet-950 flex items-center justify-center text-xs">🗂️</div>
          <span className="text-xs font-semibold text-text-primary truncate flex-1">{data.label}</span>
        </div>
        <div className="px-3 py-2 flex flex-col gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 text-[10px] font-medium self-start">
            {actionLabel}
          </span>
          {cfg?.categoryId && (
            <span className="text-[9px] text-text-secondary truncate">cat: {cfg.categoryId.slice(0, 8)}…</span>
          )}
        </div>
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-violet-500 !border-2 !border-bg-card" />
      </div>
    </div>
  );
}

export const CatalogNode = memo(Inner);
