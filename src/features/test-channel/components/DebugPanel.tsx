import {
  Route, Target, Clock, Zap, MessageSquare,
  GitBranch, Variable, Activity, ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '@/shared/components';
import type { MessageDebugInfo } from '../types/test-channel.types';
import { ROUTING_PATH_LABEL, ROUTING_PATH_COLOR } from '../types/test-channel.types';

interface DebugPanelProps {
  debug: MessageDebugInfo | null;
}

export function DebugPanel({ debug }: DebugPanelProps) {
  if (!debug) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <Activity className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
          <p className="text-xs font-semibold text-text-secondary">Select a bot message</p>
          <p className="text-[10px] text-text-muted mt-1">Click any bot response to see debug info</p>
        </div>
      </div>
    );
  }

  const pathColor = debug.routingPath
    ? ROUTING_PATH_COLOR[debug.routingPath] ?? 'muted'
    : 'muted';
  const pathLabel = debug.routingPath
    ? ROUTING_PATH_LABEL[debug.routingPath] ?? debug.routingPath
    : 'Unknown';

  const rows: DebugRow[] = [
    {
      icon: Route,
      label: 'Routing path',
      value: pathLabel,
      badge: pathColor,
    },
    {
      icon: Target,
      label: 'Matched intent',
      value: debug.matchedIntent ?? 'None',
      badge: debug.matchedIntent ? 'brand' : 'muted',
    },
    {
      icon: MessageSquare,
      label: 'Response type',
      value: debug.responseType ?? 'Unknown',
    },
    {
      icon: Clock,
      label: 'Processing time',
      value: `${debug.processingTimeMs}ms`,
      highlight: debug.processingTimeMs > 500,
    },
    {
      icon: Zap,
      label: 'Tokens used',
      value: debug.tokensUsed > 0 ? String(debug.tokensUsed) : 'Zero (free)',
      highlight: debug.tokensUsed > 0,
    },
    {
      icon: GitBranch,
      label: 'Conversation mode',
      value: debug.conversationMode ?? 'Unknown',
    },
    {
      icon: ChevronRight,
      label: 'Flow position',
      value: debug.currentFlowPosition ?? 'Root',
    },
    {
      icon: Activity,
      label: 'Session status',
      value: debug.sessionStatus ?? 'Unknown',
    },
  ];

  return (
    <div className="space-y-1 p-3">
      <div className="text-[9px] font-bold uppercase tracking-[2px] text-text-muted mb-3">
        Message debug
      </div>

      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-glass-1 border border-border-subtle"
        >
          <row.icon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" strokeWidth={1.6} />
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex-shrink-0 w-24">
            {row.label}
          </span>
          <div className="flex-1 text-right">
            {row.badge ? (
              <StatusBadge variant={row.badge}>{row.value}</StatusBadge>
            ) : (
              <span
                className={`text-xs font-bold ${
                  row.highlight ? 'text-warning' : 'text-text-primary'
                }`}
              >
                {row.value}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Collected variables */}
      {debug.collectedVariables && Object.keys(debug.collectedVariables).length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Variable className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.6} />
            <span className="text-[9px] font-bold uppercase tracking-[2px] text-text-muted">
              Collected variables
            </span>
          </div>
          <div className="space-y-1">
            {Object.entries(debug.collectedVariables).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-glass-1 border border-border-subtle"
              >
                <span className="text-[10px] font-mono text-text-muted">{key}</span>
                <span className="text-xs font-semibold text-text-primary">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DebugRow {
  icon: typeof Route;
  label: string;
  value: string;
  badge?: 'success' | 'brand' | 'info' | 'warning' | 'danger' | 'muted';
  highlight?: boolean;
}
