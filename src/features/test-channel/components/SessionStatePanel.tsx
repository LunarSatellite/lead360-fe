import { Radio, GitBranch, Variable, Zap, MessageSquare, Hash } from 'lucide-react';
import { StatusBadge } from '@/shared/components';

interface SessionSnapshot {
  mode: string | null;
  status: string | null;
  currentFlowPosition: string | null;
  collectedVariables: Record<string, string> | null;
  messageCount: number;
  totalTokensUsed: number;
}

interface SessionStatePanelProps {
  session: SessionSnapshot | null;
  sessionId: string | null;
}

export function SessionStatePanel({ session, sessionId }: SessionStatePanelProps) {
  if (!session) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <Radio className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
          <p className="text-xs font-semibold text-text-secondary">No active session</p>
          <p className="text-[10px] text-text-muted mt-1">Start a session or send a message</p>
        </div>
      </div>
    );
  }

  const modeColor = session.mode === 'Menu' ? 'success' : session.mode === 'Chat' ? 'brand' : 'muted';
  const statusColor =
    session.status === 'Active' ? 'success' :
    session.status === 'AwaitingAgent' ? 'warning' :
    session.status === 'Closed' ? 'muted' : 'info';

  return (
    <div className="p-3 space-y-3">
      <div className="text-[9px] font-bold uppercase tracking-[2px] text-text-muted">
        Session state
      </div>

      {/* Session ID */}
      {sessionId && (
        <div className="px-3 py-2 rounded-lg bg-glass-1 border border-border-subtle">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Session ID</div>
          <div className="text-[10px] font-mono text-text-secondary truncate">{sessionId}</div>
        </div>
      )}

      {/* Mode + Status */}
      <div className="grid grid-cols-2 gap-2">
        <div className="px-3 py-2.5 rounded-lg bg-glass-1 border border-border-subtle">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Mode</div>
          <StatusBadge variant={modeColor} dot>{session.mode ?? 'Unknown'}</StatusBadge>
        </div>
        <div className="px-3 py-2.5 rounded-lg bg-glass-1 border border-border-subtle">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Status</div>
          <StatusBadge variant={statusColor} dot>{session.status ?? 'Unknown'}</StatusBadge>
        </div>
      </div>

      {/* Flow position */}
      <div className="px-3 py-2.5 rounded-lg bg-glass-1 border border-border-subtle">
        <div className="flex items-center gap-1.5 mb-1.5">
          <GitBranch className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Flow position</span>
        </div>
        <div className="text-xs font-semibold text-text-primary">
          {session.currentFlowPosition || 'Root / Main menu'}
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-2">
        <div className="px-3 py-2.5 rounded-lg bg-glass-1 border border-border-subtle text-center">
          <MessageSquare className="w-3.5 h-3.5 text-text-muted mx-auto mb-1" strokeWidth={1.6} />
          <div className="text-lg font-extrabold text-text-primary">{session.messageCount}</div>
          <div className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Messages</div>
        </div>
        <div className="px-3 py-2.5 rounded-lg bg-glass-1 border border-border-subtle text-center">
          <Zap className="w-3.5 h-3.5 text-text-muted mx-auto mb-1" strokeWidth={1.6} />
          <div className="text-lg font-extrabold text-text-primary">{session.totalTokensUsed}</div>
          <div className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Tokens</div>
        </div>
      </div>

      {/* Collected variables */}
      {session.collectedVariables && Object.keys(session.collectedVariables).length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Variable className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-[2px]">Variables</span>
            <Hash className="w-3 h-3 text-text-muted ml-auto" strokeWidth={1.6} />
            <span className="text-[9px] font-bold text-text-muted">
              {Object.keys(session.collectedVariables).length}
            </span>
          </div>
          <div className="space-y-1">
            {Object.entries(session.collectedVariables).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-glass-1 border border-border-subtle"
              >
                <span className="text-[10px] font-mono text-brand">{key}</span>
                <span className="text-xs font-semibold text-text-primary truncate max-w-[120px]">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
