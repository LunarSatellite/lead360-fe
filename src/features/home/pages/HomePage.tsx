import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import {
  MessageSquare,
  ShoppingBag,
  Heart,
  Zap,
  ArrowRight,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { useProfile } from '@/features/auth/api/auth.queries';
import { useSpecs } from '@/features/api-connection/api/api-connection.queries';
import { useIntents } from '@/features/intents/api/intents.queries';
import { useChannels } from '@/features/channels/api/channels.queries';
import { useFlows } from '@/features/flow-builder/api/flow.queries';
import type { ApiSpecDto } from '@/features/api-connection/types/api-connection.types';
import type { IntentDto } from '@/features/intents/types/intents.types';
import type { ChannelConnectionDto } from '@/features/channels/types/channels.types';
import { ChannelConnectionStatus } from '@/features/channels/types/channels.types';
import type { FlowDto } from '@/features/flow-builder/types/flow.types';

/* ═══════════════════════════════════════════════════════════════════════════
   Home / Overview
   Day-5 landing page for returning users. Chat stays the primary way to
   change things — this page is a calm status view + gentle setup roadmap.
   ═══════════════════════════════════════════════════════════════════════ */
export function Component() {
  const { data: profile } = useProfile();
  const p = (profile ?? null) as { firstName?: string } | null;
  const firstName = p?.firstName || 'there';

  const { data: summaryRaw, isLoading: summaryLoading } = useQuery({
    queryKey: ['home-summary'],
    queryFn: () => apiClient.get<any>('/v1/home/summary'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const summary = summaryRaw as any;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-text-secondary mb-1">Welcome back, {firstName}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Your bot at a glance
          </h1>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-soft border-thin border-border-success shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-bold text-success">Live on WhatsApp</span>
        </div>
      </div>

      {/* ─── Setup journey — same visual as SetupPage ─── */}
      <SetupJourneyCard />

      {/* ─── Stat cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={MessageSquare} label="Conversations today"
          value={summaryLoading ? '—' : String(summary?.conversationsToday ?? 0)} />
        <StatCard icon={ShoppingBag} label="Orders"
          value={summaryLoading ? '—' : String(summary?.ordersToday ?? 0)} />
        <StatCard icon={Heart} label="Happy customers"
          value={summaryLoading ? '—' : `${summary?.customerSatisfactionPct ?? 0}%`} />
        <StatCard icon={Zap} label="Avg reply"
          value={summaryLoading ? '—' : summary?.avgReplyTimeSeconds > 0
            ? summary.avgReplyTimeSeconds < 60
              ? `${summary.avgReplyTimeSeconds}s`
              : `${Math.round(summary.avgReplyTimeSeconds / 60)}m`
            : '—'} />
      </div>

      {/* ─── Two-column content ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4">
          <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[1.5px] mb-3">
            Happening now
          </h2>
          <div className="flex flex-col">
            {summaryLoading ? (
              <div className="py-4 text-center">
                <div className="w-4 h-4 border-2 border-brand border-r-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (summary?.recentActivity ?? []).length > 0 ? (
              (summary.recentActivity as any[]).map((item: any, i: number) => (
                <LiveRow key={i} name={item.name} action={item.action} time={item.timeAgo} />
              ))
            ) : (
              <div className="py-4 text-center text-xs text-text-muted">No recent activity yet.</div>
            )}
          </div>
          <Link
            to={ROUTES.dashboard.conversations}
            className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-thin border-border-subtle text-xs font-semibold text-brand hover:text-brand-light transition-colors"
          >
            See all conversations
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
          </Link>
        </div>

        <div className="bg-brand-soft border-thin border-border-glow rounded-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand" strokeWidth={1.8} />
            <h2 className="text-[10px] font-bold text-brand uppercase tracking-[1.5px]">
              AI suggestion
            </h2>
          </div>
          <p className="text-sm text-text-primary leading-relaxed mb-4">
            {summary?.conversationsToday > 0
              ? `${summary.conversationsToday} conversation${summary.conversationsToday !== 1 ? 's' : ''} started today. Want me to review recent conversations and suggest improvements?`
              : "Set up your first bot flow to start handling customer conversations automatically."}
          </p>
          <div className="flex gap-2">
            <Link
              to={`/dashboard/chat?prefill=${encodeURIComponent(
                'Add a custom cake request flow — let customers describe the cake they want, and forward those to me.',
              )}`}
              className="px-3.5 py-2 rounded-sm bg-brand hover:bg-brand-light text-bg text-xs font-bold transition-colors"
            >
              Yes, add it
            </Link>
            <button
              type="button"
              className="px-3 py-2 rounded-sm border-thin border-border-medium text-text-secondary hover:text-text-primary hover:bg-glass-2 text-xs font-semibold transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>

      {/* ─── Quick nav ─── */}
      <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4">
        <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[1.5px] mb-3">
          Jump to
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <QuickLink to={ROUTES.dashboard.flows} label="Bot flow" />
          <QuickLink to={ROUTES.dashboard.testChannel} label="Test preview" />
          <QuickLink to={ROUTES.dashboard.channels} label="Channels" />
          <QuickLink to={ROUTES.dashboard.analytics} label="Analytics" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SetupJourneyCard — copies the JourneyPath visual from SetupPage.
   Curved connectors, glowing done nodes, pulsing beacon on the active node.
   Incomplete steps deep-link into chat with a prefilled prompt, so the
   non-technical user never has to navigate to a technical feature page.
   ═══════════════════════════════════════════════════════════════════════ */

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  done: boolean;
  statusText: string;
  chatPrompt: string;
}

function SetupJourneyCard() {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';
  const { data: specsRaw, isLoading: specsLoading } = useSpecs();
  const specs = (specsRaw as unknown as ApiSpecDto[]) ?? [];
  const { data: intentsRaw, isLoading: intentsLoading } = useIntents(tenantId);
  const intents = (intentsRaw as unknown as IntentDto[]) ?? [];
  const { data: channelsRaw, isLoading: channelsLoading } = useChannels();
  const channels = (channelsRaw as unknown as ChannelConnectionDto[]) ?? [];
  const { data: flowsRaw, isLoading: flowsLoading } = useFlows();
  const flows = (flowsRaw as unknown as FlowDto[]) ?? [];
  const activeFlow = flows.find((f) => f.isActive);

  const isLoading = specsLoading || intentsLoading || channelsLoading || flowsLoading;

  const steps: JourneyStep[] = useMemo(() => {
    const activeIntents = intents.filter((i) => i.isActive);
    const connectedChannels = channels.filter((c) => c.status === ChannelConnectionStatus.Active);

    const dataDone = specs.length > 0;
    const intentsDone = activeIntents.length >= 3;
    const flowsDone = !!activeFlow;
    const channelsDone = connectedChannels.length > 0;
    const goLiveReady = intentsDone && flowsDone && channelsDone;

    return [
      {
        id: 'data',
        title: 'Data source',
        description: 'Your menu, products, or API so the bot knows what you sell.',
        icon: '🔗',
        done: dataDone,
        statusText: dataDone ? `${specs.length} connected` : 'Not set up',
        chatPrompt:
          "Help me set up my bot's data source — I'll describe or paste my menu/catalog.",
      },
      {
        id: 'intents',
        title: 'Things bot handles',
        description: 'What customers can ask about — greetings, orders, hours, etc.',
        icon: '🎯',
        done: intentsDone,
        statusText: intentsDone
          ? `${activeIntents.length} things`
          : activeIntents.length > 0
            ? `${activeIntents.length} so far (need 3+)`
            : 'None yet',
        chatPrompt:
          "Walk me through what my bot should handle — I'll tell you what customers usually ask.",
      },
      {
        id: 'flow',
        title: 'Conversation flow',
        description: 'How the bot greets, listens, responds, and closes the loop.',
        icon: '🔀',
        done: flowsDone,
        statusText: activeFlow ? 'Active' : flows.length > 0 ? `${flows.length} draft` : 'None yet',
        chatPrompt: 'Design the conversation flow for my bot — greeting to closing.',
      },
      {
        id: 'channels',
        title: 'Where bot lives',
        description: 'WhatsApp, Messenger, SMS, or website chat.',
        icon: '📱',
        done: channelsDone,
        statusText: channelsDone
          ? `${connectedChannels.length} live`
          : channels.length > 0
            ? `${channels.length} pending`
            : 'None yet',
        chatPrompt:
          'Help me connect a channel so customers can reach my bot. Start with WhatsApp.',
      },
      {
        id: 'live',
        title: 'Go live',
        description: 'Final review and launch to real customers.',
        icon: '🚀',
        done: goLiveReady,
        statusText: goLiveReady ? 'Ready!' : 'Finish above first',
        chatPrompt: 'Is my bot ready to go live? Run a final check and launch it.',
      },
    ];
  }, [specs, intents, channels, flows, activeFlow]);

  const completedCount = steps.filter((s) => s.done).length;
  const firstIncomplete = steps.findIndex((s) => !s.done);
  const activeIdx = firstIncomplete === -1 ? steps.length - 1 : firstIncomplete;
  const [selectedIdx, setSelectedIdx] = useState(activeIdx);
  const selected = steps[selectedIdx];
  const allDone = completedCount === steps.length;

  if (isLoading) {
    return (
      <div className="bg-glass-1 border-thin border-border-subtle rounded-card px-6 py-10 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand border-r-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-glass-1 border-thin border-border-subtle rounded-card overflow-hidden">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="min-w-0">
          <div className="text-2xs font-bold uppercase tracking-[3px] text-brand">Your bot</div>
          <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight mt-1">
            {allDone ? "All set — you're live 🎉" : 'Finish setting up your bot'}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {allDone
              ? 'Everything is connected and running.'
              : "Pick any step below to continue in chat — I'll guide you."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-text-muted">
            {completedCount}/{steps.length}
          </span>
          {!allDone && (
            <Link
              to={`/dashboard/chat?prefill=${encodeURIComponent(steps[activeIdx].chatPrompt)}`}
              className="px-4 py-2 rounded-lg text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-colors flex items-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Continue in chat</span>
            </Link>
          )}
        </div>
      </div>

      {/* Journey path */}
      <div className="px-2 sm:px-4 pb-2">
        <JourneyPath
          steps={steps}
          selectedIdx={selectedIdx}
          activeIdx={activeIdx}
          onSelect={setSelectedIdx}
        />
      </div>

      {/* Selected step detail card */}
      {selected && (
        <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 rounded-card bg-bg-shell border-thin border-border-subtle p-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-sm flex items-center justify-center text-xl shrink-0 ${
                selected.done ? 'bg-success-soft' : 'bg-brand-soft'
              }`}
            >
              {selected.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-bold text-text-primary">{selected.title}</div>
                <span
                  className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selected.done
                      ? 'bg-success-soft text-success border-thin border-border-success'
                      : 'bg-brand-soft text-brand border-thin border-border-glow'
                  }`}
                >
                  {selected.statusText}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {selected.description}
              </p>
            </div>
            {!selected.done && (
              <button
                onClick={() =>
                  navigate(`/dashboard/chat?prefill=${encodeURIComponent(selected.chatPrompt)}`)
                }
                className="shrink-0 px-3 py-1.5 rounded-sm bg-brand hover:bg-brand-light text-bg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Set up</span>
                <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── JourneyPath (adapted from SetupPage JourneyPath) ─────────────────── */
function JourneyPath({
  steps,
  selectedIdx,
  activeIdx,
  onSelect,
}: {
  steps: JourneyStep[];
  selectedIdx: number;
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  const nodes = [
    { x: 80, y: 90 },
    { x: 230, y: 90 },
    { x: 380, y: 90 },
    { x: 530, y: 90 },
    { x: 680, y: 90 },
  ];

  const segments = [
    'M 80 90 C 130 25, 180 25, 230 90',
    'M 230 90 C 280 155, 330 155, 380 90',
    'M 380 90 C 430 25, 480 25, 530 90',
    'M 530 90 C 580 155, 630 155, 680 90',
  ];

  return (
    <svg viewBox="0 0 760 210" className="w-full h-auto" style={{ minHeight: 160 }}>
      <defs>
        <filter id="home-glowDone">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00D97E" floodOpacity="0.4" />
        </filter>
        <linearGradient id="home-fadeGreenL" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D97E" />
          <stop offset="100%" stopColor="#1A2B22" />
        </linearGradient>
        <linearGradient id="home-fadeGreenR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#00D97E" />
          <stop offset="100%" stopColor="#1A2B22" />
        </linearGradient>
      </defs>

      {/* Connector segments — green between two done, gradient when one side is done */}
      {segments.map((seg, i) => {
        const leftDone = steps[i]?.done;
        const rightDone = steps[i + 1]?.done;
        let stroke: string;
        if (leftDone && rightDone) stroke = '#00D97E';
        else if (leftDone && !rightDone) stroke = 'url(#home-fadeGreenL)';
        else if (!leftDone && rightDone) stroke = 'url(#home-fadeGreenR)';
        else stroke = '#1A2B22';
        return (
          <path
            key={i}
            d={seg}
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const step = steps[i];
        if (!step) return null;
        const isDone = step.done;
        const isActive = i === activeIdx && !isDone;
        const isLocked = i > activeIdx && !isDone;
        const isSelected = selectedIdx === i;

        return (
          <g
            key={i}
            opacity={isLocked ? 0.55 : 1}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(i)}
          >
            {isSelected && !isDone && !isActive && (
              <circle
                cx={n.x}
                cy={n.y}
                r="30"
                fill="none"
                stroke="#E6F5ED"
                strokeWidth="1.5"
                opacity="0.25"
                strokeDasharray="4 3"
              />
            )}

            <circle
              cx={n.x}
              cy={n.y}
              r="24"
              fill={isDone ? 'rgba(0,217,126,0.08)' : '#0B1210'}
              stroke={isDone ? '#00D97E' : isActive ? '#8FAEA0' : '#1A2B22'}
              strokeWidth={isSelected || isActive ? 2.5 : 2}
              filter={isDone ? 'url(#home-glowDone)' : undefined}
            />

            {isActive && (
              <>
                <circle cx={n.x + 17} cy={n.y - 17} r="4" fill="#F59E0B" />
                <circle
                  cx={n.x + 17}
                  cy={n.y - 17}
                  r="4"
                  fill="#F59E0B"
                  opacity="0.5"
                  className="setup-beacon"
                />
              </>
            )}

            <foreignObject x={n.x - 14} y={n.y - 14} width="28" height="28">
              <div className="w-full h-full flex items-center justify-center">
                {isDone ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="#00D97E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span style={{ fontSize: 16 }}>{step.icon}</span>
                )}
              </div>
            </foreignObject>

            <text
              x={n.x}
              y={n.y + 46}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill={isDone ? '#00D97E' : isSelected || isActive ? '#E8F0EC' : '#8FAEA0'}
            >
              {step.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Reused bits ──────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-brand" strokeWidth={1.6} />
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[1.5px]">
          {label}
        </span>
      </div>
      <div className="text-2xl font-extrabold text-text-primary">{value}</div>
    </div>
  );
}

function LiveRow({ name, action, time }: { name: string; action: string; time: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-thin border-border-subtle last:border-b-0">
      <div className="w-7 h-7 rounded-full bg-[#132A21] flex items-center justify-center text-2xs font-bold text-brand shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-text-primary">{name}</span>
        <span className="text-xs text-text-secondary"> · {action}</span>
      </div>
      <span className="text-[10px] text-text-muted shrink-0">{time}</span>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-2 bg-bg-input hover:bg-glass-2 border-thin border-border-subtle hover:border-border-medium rounded-sm px-3 py-2.5 text-sm font-semibold text-text-primary transition-colors"
    >
      <span>{label}</span>
      <ArrowRight className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.6} />
    </Link>
  );
}