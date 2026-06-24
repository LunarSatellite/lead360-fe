import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, UserCheck, Clock, ArrowLeftRight, X as XIcon, Loader2, Send, Bot, User, History } from 'lucide-react';
import { GlassCard, GlassCardHeader, StatusBadge } from '@/shared/components';
import { useActiveSessions, useAwaitingSessions, useMySessions, useMessages, useCloseSession, useReturnToBot, useAgentReply, useSessionDeal } from '../api/conversation.queries';
import { useMoveDealStage, useCloseDeal, useDealStages } from '../../crm/api/crm.queries';
import { SESSION_STATUS_LABEL, SESSION_STATUS_COLOR, CHANNEL_LABEL, ROUTING_PATH_LABEL, MessageDirection } from '../types/conversation.types';
import type { SessionDto } from '../types/conversation.types';
import type { CrmDealStageSummaryDto } from '../../crm/types/crm.types';

export function Component() {
  const [tab, setTab] = useState<'active' | 'awaiting' | 'mine'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: active, isLoading } = useActiveSessions();
  const { data: awaiting } = useAwaitingSessions();
  const { data: mine } = useMySessions();
  const sessions = tab === 'active' ? active : tab === 'awaiting' ? awaiting : mine;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Conversations</h1>
        <p className="text-sm text-text-secondary mt-1">Monitor live sessions and manage agent handoffs</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'active' as const, label: 'Active', count: active?.length ?? 0, icon: MessageSquare, color: 'text-success' },
          { key: 'awaiting' as const, label: 'Awaiting Agent', count: (awaiting as any)?.length ?? 0, icon: Users, color: ((awaiting as any)?.length ?? 0) > 0 ? 'text-danger' : 'text-warning' },
          { key: 'mine' as const, label: 'My Sessions', count: mine?.length ?? 0, icon: UserCheck, color: 'text-info' },
        ].map(c => (
          <button key={c.key} onClick={() => setTab(c.key)} className={`text-left ${tab === c.key ? 'ring-2 ring-brand rounded-2xl' : ''}`}>
            <GlassCard className="p-5">
              <div className="flex items-center gap-3">
                <c.icon className={`w-5 h-5 ${c.color}`} />
                <div>
                  <div className={`text-2xl font-extrabold ${c.color}`}>{c.count}</div>
                  <div className="text-xs text-text-muted">{c.label}</div>
                </div>
              </div>
            </GlassCard>
          </button>
        ))}
      </div>
      <div className="flex gap-4" style={{ height: 'calc(100vh - 360px)' }}>
        <GlassCard className="w-[380px] flex-shrink-0 flex flex-col">
          <GlassCardHeader title={`${tab === 'active' ? 'Active' : tab === 'awaiting' ? 'Awaiting' : 'My'} Sessions`} icon={<MessageSquare className="w-4 h-4" />} />
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-text-muted"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />Loading…</div>
            ) : !sessions?.length ? (
              <div className="p-8 text-center text-sm text-text-muted">No sessions</div>
            ) : sessions.map((s: SessionDto) => (
              <button key={s.id} onClick={() => setSelectedId(s.id)}
                className={`w-full px-4 py-3 text-left transition-colors relative ${selectedId === s.id ? 'bg-brand-soft' : 'hover:bg-glass-1'} ${s.status === 6 ? 'border-l-2 border-danger' : ''}`}>
                {s.status === 6 && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
                    </span>
                    <span className="text-2xs font-bold text-danger uppercase tracking-wide">Needs Agent</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-primary truncate">{s.customerId}</span>
                  <StatusBadge variant={SESSION_STATUS_COLOR[s.status]}>{SESSION_STATUS_LABEL[s.status]}</StatusBadge>
                </div>
                <div className="flex items-center gap-2 text-2xs text-text-muted">
                  <span>{CHANNEL_LABEL[s.channel] || 'Unknown'}</span>
                  <span>·</span>
                  <span>{s.messageCount} msgs</span>
                  <span>·</span>
                  <span>{s.mode === 1 ? 'Menu' : 'Chat'}</span>
                </div>
                <div className="text-2xs text-text-muted mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{new Date(s.lastActivityAt).toLocaleTimeString()}
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
        <div className="flex-1 min-w-0 flex gap-0">
          {selectedId ? (
            <>
              <div className="flex-1 min-w-0"><MessageViewer sessionId={selectedId} /></div>
              <DealSidebar sessionId={selectedId} />
            </>
          ) : (
            <GlassCard className="h-full flex items-center justify-center flex-1">
              <div className="text-center"><MessageSquare className="w-10 h-10 mx-auto text-text-muted mb-2" /><p className="text-sm text-text-muted">Select a session</p></div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

function DealSidebar({ sessionId }: { sessionId: string }) {
  const { data: rawDeal } = useSessionDeal(sessionId);
  const deal = rawDeal as any;
  const { data: rawStages } = useDealStages();
  const stages = (rawStages as unknown as CrmDealStageSummaryDto[] | undefined)?.slice().sort((a, b) => a.order - b.order) ?? [];
  const moveStage = useMoveDealStage();
  const closeDeal = useCloseDeal();

  const hasMemory = !!(deal?.customerMemory);
  const isReturning = hasMemory || (deal?.reEngagementCount > 0);

  if (!deal) return (
    <div className="w-72 flex-shrink-0 bg-bg-card border-l border-border-subtle p-4 flex items-center justify-center">
      <p className="text-xs text-text-muted text-center">No deal linked to this conversation yet</p>
    </div>
  );

  let summary: any = null;
  try { if (deal.aiSummaryJson) summary = JSON.parse(deal.aiSummaryJson); } catch {}

  return (
    <div className="w-72 flex-shrink-0 bg-bg-card border-l border-border-subtle overflow-y-auto">

      {/* Returning Customer Badge */}
      {isReturning && (
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning-soft border border-[rgba(234,179,8,0.25)]">
            <History className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-2xs font-bold text-warning uppercase tracking-wide">Returning Customer</p>
              {deal.reEngagementCount > 0 && (
                <p className="text-2xs text-warning/70">{deal.reEngagementCount} previous visit{deal.reEngagementCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Memory */}
      {hasMemory && (
        <div className="p-4 border-b border-border-subtle space-y-1.5">
          <p className="text-xs font-bold text-warning uppercase tracking-wider">Customer History</p>
          <p className="text-xs text-text-primary leading-relaxed whitespace-pre-line">{deal.customerMemory}</p>
        </div>
      )}

      {/* Deal info — only if deal exists */}
      {deal.id && (
        <>
          <div className="p-4 border-b border-border-subtle">
            <p className="text-xs font-bold text-brand uppercase tracking-wider mb-1">Linked Deal</p>
            <p className="text-sm font-semibold text-text-primary truncate">{deal.name}</p>
            {deal.amount && <p className="text-xs text-text-muted mt-0.5">NPR {Number(deal.amount).toLocaleString()}</p>}
          </div>

          {/* Stage control */}
          <div className="p-4 border-b border-border-subtle space-y-2">
            <p className="text-xs font-semibold text-text-muted">Stage</p>
            <select
              value={deal.stageId ?? ''}
              onChange={e => moveStage.mutate({ id: deal.id, data: { stageId: e.target.value } })}
              className="w-full px-2 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-primary focus:outline-none"
            >
              {stages.filter(s => !s.isClosed).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => closeDeal.mutate({ id: deal.id, data: { isWon: true } })}
                className="flex-1 py-1.5 rounded-lg bg-success-soft text-success text-xs font-bold border border-[rgba(34,197,94,0.2)] hover:bg-success hover:text-white transition-all">
                Won ✓
              </button>
              <button onClick={() => closeDeal.mutate({ id: deal.id, data: { isWon: false } })}
                className="flex-1 py-1.5 rounded-lg bg-danger-soft text-danger text-xs font-bold border border-[rgba(244,63,94,0.2)] hover:bg-danger hover:text-white transition-all">
                Lost ✗
              </button>
            </div>
          </div>

          {/* AI Summary */}
          {summary ? (
            <div className="p-4 space-y-3">
              <p className="text-xs font-bold text-brand uppercase tracking-wider">AI Summary</p>
              {summary.customerSummary && <p className="text-xs text-text-primary">{summary.customerSummary}</p>}
              {summary.keyPoints?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summary.keyPoints.map((p: string, i: number) => (
                    <span key={i} className="text-2xs px-1.5 py-0.5 rounded-full bg-bg-elevated border border-border-subtle text-text-muted">{p}</span>
                  ))}
                </div>
              )}
              {summary.recommendedAction && (
                <div className="p-2 rounded-lg bg-brand-soft border border-border-glow">
                  <p className="text-2xs font-bold text-brand mb-0.5">Next Action</p>
                  <p className="text-xs text-text-primary">{summary.recommendedAction}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs text-text-muted italic">Generating AI summary...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MessageViewer({ sessionId }: { sessionId: string }) {
  const { data: messages, isLoading } = useMessages(sessionId);
  const close = useCloseSession();
  const returnBot = useReturnToBot();
  const reply = useAgentReply();
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = () => {
    if (!replyText.trim() || reply.isPending) return;
    reply.mutate({ sessionId, text: replyText.trim() }, {
      onSuccess: () => setReplyText(''),
    });
  };

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary">Conversation</span>
        <div className="flex gap-1">
          <button onClick={() => returnBot.mutate(sessionId)} className="flex items-center gap-1 px-2 py-1 rounded text-2xs font-bold text-info bg-info-soft hover:brightness-110">
            <ArrowLeftRight className="w-3 h-3" /> Return to Bot
          </button>
          <button onClick={() => close.mutate(sessionId)} className="flex items-center gap-1 px-2 py-1 rounded text-2xs font-bold text-danger bg-danger-soft hover:brightness-110">
            <XIcon className="w-3 h-3" /> Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading
          ? <div className="text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
          : !messages?.length
            ? <div className="text-center text-sm text-text-muted">No messages</div>
            : (messages as any[]).map((m: any) => (
              <div key={m.id} className={`flex items-end gap-2 ${m.direction === MessageDirection.Inbound ? 'justify-start' : 'justify-end'}`}>
                {m.direction === MessageDirection.Inbound && (
                  <div className="w-6 h-6 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-text-muted" />
                  </div>
                )}
                <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                  m.direction === MessageDirection.Inbound
                    ? 'bg-glass-1 text-text-primary rounded-bl-none'
                    : m.createdBy && m.createdBy !== '00000000-0000-0000-0000-000000000000'
                      ? 'bg-success text-white rounded-br-none'  // agent message = green
                      : 'bg-brand text-white rounded-br-none'    // bot message = brand
                }`}>
                  {m.direction !== MessageDirection.Inbound && m.createdBy && m.createdBy !== '00000000-0000-0000-0000-000000000000' && (
                    <p className="text-2xs text-white/70 mb-0.5 font-semibold">Agent</p>
                  )}
                  {m.content}
                  <div className="text-2xs mt-1 opacity-70">
                    {new Date(m.messageTimestamp).toLocaleTimeString()}
                    {m.routingPath > 0 && ` · ${ROUTING_PATH_LABEL[m.routingPath] || ''}`}
                  </div>
                </div>
                {m.direction !== MessageDirection.Inbound && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.createdBy && m.createdBy !== '00000000-0000-0000-0000-000000000000'
                      ? 'bg-success/20'
                      : 'bg-brand/20'
                  }`}>
                    {m.createdBy && m.createdBy !== '00000000-0000-0000-0000-000000000000'
                      ? <UserCheck className="w-3 h-3 text-success" />
                      : <Bot className="w-3 h-3 text-brand" />
                    }
                  </div>
                )}
              </div>
            ))}
        <div ref={bottomRef} />
      </div>

      {/* Agent Reply Input */}
      <div className="p-3 border-t border-border-subtle">
        <div className="flex gap-2">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
            placeholder="Type a reply to the customer..."
            className="flex-1 px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-colors"
          />
          <button
            onClick={sendReply}
            disabled={!replyText.trim() || reply.isPending}
            className="px-3 py-2 rounded-xl bg-brand text-bg font-bold disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-1.5"
          >
            {reply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-2xs text-text-muted mt-1.5">Press Enter to send · Green = agent · Blue = bot</p>
      </div>
    </GlassCard>
  );
}
