import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link2,
  Target,
  Phone,
  Globe,
  MessageSquare,
  GitBranch,
  Loader2,
  Rocket,
  Package,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, HttpMethodBadge, IntentTag, StatusBadge } from '@/shared/components';
import type { OnboardingStepData } from '@/shared/components';

import { useSpecs, useEndpoints } from '@/features/api-connection/api/api-connection.queries';
import { useIntents } from '@/features/intents/api/intents.queries';
import { useChannels } from '@/features/channels/api/channels.queries';
import { useFlows } from '@/features/flow-builder/api/flow.queries';
import { useSyncStatus } from '@/features/catalog/api/catalog.queries';
import type { ApiSpecDto, EndpointDto } from '@/features/api-connection/types/api-connection.types';
import type { IntentDto } from '@/features/intents/types/intents.types';
import type { ChannelConnectionDto } from '@/features/channels/types/channels.types';
import {
  CHANNEL_TYPE_LABEL,
  CHANNEL_STATUS_LABEL,
  CHANNEL_STATUS_COLOR,
  ChannelConnectionStatus,
} from '@/features/channels/types/channels.types';
import type { FlowDto } from '@/features/flow-builder/types/flow.types';
import type { SyncStatusDto } from '@/features/catalog/types/catalog.types';

const CHANNEL_ICONS: Record<number, { icon: React.ReactNode; bg: string }> = {
  1: { icon: <Phone className="w-6 h-6 text-brand" strokeWidth={1.6} />, bg: 'bg-brand-soft' },
  2: { icon: <MessageSquare className="w-6 h-6 text-info" strokeWidth={1.6} />, bg: 'bg-info-soft' },
  3: { icon: <MessageSquare className="w-6 h-6 text-[#E4405F]" strokeWidth={1.6} />, bg: 'bg-danger-soft' },
  4: { icon: <MessageSquare className="w-6 h-6 text-[#1877F2]" strokeWidth={1.6} />, bg: 'bg-info-soft' },
  5: { icon: <MessageSquare className="w-6 h-6 text-warning" strokeWidth={1.6} />, bg: 'bg-warning-soft' },
  6: { icon: <Phone className="w-6 h-6 text-text-muted" strokeWidth={1.6} />, bg: 'bg-glass-2' },
  7: { icon: <Globe className="w-6 h-6 text-info" strokeWidth={1.6} />, bg: 'bg-info-soft' },
  8: { icon: <MessageSquare className="w-6 h-6 text-text-muted" strokeWidth={1.6} />, bg: 'bg-glass-2' },
};

const INTENT_COLORS: ('brand' | 'success' | 'info' | 'danger' | 'warning' | 'muted')[] = [
  'brand',
  'success',
  'info',
  'danger',
  'warning',
  'muted',
];

/* ═══ Step content shared by desktop hero & mobile timeline ═══ */
const HERO_ICONS = ['🔗', '🎯', '🔀', '📱', '🚀'];
const HERO_TITLES = [
  'Connect your API',
  'Define intents',
  'Design conversation flows',
  'Select channels',
  'Go live',
];
const HERO_DESCS = [
  'Upload your OpenAPI spec so Lead360 understands your endpoints.',
  'Tell your bot what customers might ask. Need at least 3 intents.',
  'Build conversation flows with AI or the visual editor.',
  'Connect WhatsApp, Instagram, Email, Voice, and more.',
  'Review checklist and launch your chatbot.',
];
const HERO_ROUTES = [
  '/dashboard/api-connection',
  '/dashboard/intents',
  '/dashboard/flows',
  '/dashboard/channels',
  '/dashboard/onboarding',
];
const HERO_CTAS = ['Upload spec', 'Add intents', 'Open builder', 'Connect channel', 'Review & launch'];
const HERO_CTA_ALT = ['Add manually', 'Import file', 'Generate with AI', 'Browse all', 'View checklist'];

/* ═══ Journey path ═══ */

function JourneyPath({
  steps,
  selectedIdx,
  onSelect,
}: {
  steps: OnboardingStepData[];
  selectedIdx: number;
  onSelect: (i: number) => void;
}) {
  const anchors = ['setup-api', 'setup-intents', 'setup-flows', 'setup-channels', 'setup-launch'];
  const nodes = [
    { x: 80, y: 90, icon: '🔗', label: 'API' },
    { x: 230, y: 90, icon: '🎯', label: 'Intents' },
    { x: 380, y: 90, icon: '🔀', label: 'Flows' },
    { x: 530, y: 90, icon: '📱', label: 'Channels' },
    { x: 680, y: 90, icon: '🚀', label: 'Launch' },
  ];

  const individualSegments = [
    'M 80 90 C 130 25, 180 25, 230 90',
    'M 230 90 C 280 155, 330 155, 380 90',
    'M 380 90 C 430 25, 480 25, 530 90',
    'M 530 90 C 580 155, 630 155, 680 90',
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <svg viewBox="0 0 760 210" className="w-full h-auto" style={{ minHeight: 160 }}>
      <defs>
        <filter id="glowDone">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00D97E" floodOpacity="0.35" />
        </filter>
        {/* Gradient for segments where start=done, end=not done */}
        <linearGradient id="fadeGreenL" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D97E" />
          <stop offset="100%" stopColor="#1A2B22" />
        </linearGradient>
        <linearGradient id="fadeGreenR" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#00D97E" />
          <stop offset="100%" stopColor="#1A2B22" />
        </linearGradient>
      </defs>

      {/* Draw each segment individually */}
      {individualSegments.map((seg, i) => {
        const leftDone = steps[i]?.state === 'done';
        const rightDone = steps[i + 1]?.state === 'done';

        let strokeColor: string;
        if (leftDone && rightDone) {
          strokeColor = '#00D97E';
        } else if (leftDone && !rightDone) {
          strokeColor = `url(#fadeGreenL)`;
        } else if (!leftDone && rightDone) {
          strokeColor = `url(#fadeGreenR)`;
        } else {
          strokeColor = '#1A2B22';
        }

        return (
          <path key={i} d={seg} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const step = steps[i];
        if (!step) return null;
        const isDone = step.state === 'done';
        const isActive = step.state === 'active';
        const isLocked = step.state === 'locked';

        return (
          <g
            key={i}
            opacity={isLocked ? 0.5 : 1}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onSelect(i);
              scrollTo(anchors[i]);
            }}
          >
            {/* Selected ring */}
            {selectedIdx === i && !isDone && !isActive && (
              <circle
                cx={n.x}
                cy={n.y}
                r="30"
                fill="none"
                stroke="#E6F5ED"
                strokeWidth="1.5"
                opacity="0.2"
                strokeDasharray="4 3"
              />
            )}
            {/* Node background */}
            <circle
              cx={n.x}
              cy={n.y}
              r="24"
              fill={isDone ? '#00D97E12' : '#0B1210'}
              stroke={isDone ? '#00D97E' : isActive ? '#8FAEA0' : '#1A2B22'}
              strokeWidth={2}
              filter={isDone ? 'url(#glowDone)' : undefined}
            />
            {/* Active: small pulsing dot at top-right corner */}
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
            {/* Icon */}
            <foreignObject x={n.x - 14} y={n.y - 14} width="28" height="28">
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDone ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#00D97E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{n.icon}</span>
                )}
              </div>
            </foreignObject>
            {/* Label */}
            <text
              x={n.x}
              y={n.y + 40}
              textAnchor="middle"
              fontSize="12"
              fontWeight={isDone ? '700' : '600'}
              fill={isDone ? '#00D97E' : isActive ? '#E6F5ED' : '#4D6E5F'}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {n.label}
            </text>
            {/* Status */}
            <text
              x={n.x}
              y={n.y + 55}
              textAnchor="middle"
              fontSize="10"
              fill={isDone ? '#4D6E5F' : isActive ? '#8FAEA0' : '#4D6E5F'}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {step.statusText.length > 18 ? step.statusText.slice(0, 16) + '…' : step.statusText}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══ Main page ═══ */
export function Component() {
  const navigate = useNavigate();
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';

  const { data: specsRaw, isLoading: specsLoading } = useSpecs();
  const specs = (specsRaw as unknown as ApiSpecDto[]) ?? [];
  const firstSpecId = specs[0]?.id;
  const { data: endpointsRaw } = useEndpoints(firstSpecId);
  const endpoints = (endpointsRaw as unknown as EndpointDto[]) ?? [];

  const { data: intentsRaw, isLoading: intentsLoading } = useIntents(tenantId);
  const intents = (intentsRaw as unknown as IntentDto[]) ?? [];

  const { data: channelsRaw, isLoading: channelsLoading } = useChannels();
  const channels = ((channelsRaw as unknown as ChannelConnectionDto[]) ?? []).filter((c) => !c.isDeleted);

  const { data: flowsRaw, isLoading: flowsLoading } = useFlows();
  const flows = (flowsRaw as unknown as FlowDto[]) ?? [];
  const activeFlow = flows.find((f) => f.isActive);

  const { data: syncRaw } = useSyncStatus();
  const syncStatus = syncRaw as unknown as SyncStatusDto | undefined;

  const isLoading = specsLoading || intentsLoading || channelsLoading || flowsLoading;

  const steps: OnboardingStepData[] = useMemo(() => {
    const endpointCount = specs.reduce((sum, s) => sum + (s.endpointCount || 0), 0);
    const activeIntents = intents.filter((i) => i.isActive);
    const connectedChannels = channels.filter((c) => c.status === ChannelConnectionStatus.Active);

    const apiDone = specs.length > 0;
    const intentsDone = activeIntents.length >= 3;
    const flowsDone = !!activeFlow;
    const channelsDone = connectedChannels.length > 0;
    const goLiveReady = apiDone && intentsDone && flowsDone && channelsDone;

    const checks = [apiDone, intentsDone, flowsDone, channelsDone, goLiveReady];
    const firstIncomplete = checks.findIndex((c) => !c);

    function getState(idx: number): 'done' | 'active' | 'locked' {
      if (checks[idx]) return 'done';
      if (idx === firstIncomplete || idx === 0) return 'active';
      return 'locked';
    }

    return [
      {
        number: 1,
        title: 'Connect API',
        description: 'Upload your OpenAPI spec',
        state: getState(0),
        statusText: apiDone ? `${endpointCount} endpoints` : 'Not connected',
        progress: apiDone ? 100 : 0,
      },
      {
        number: 2,
        title: 'Define intents',
        description: 'Tell the bot what your business does',
        state: getState(1),
        statusText: intentsDone
          ? `${activeIntents.length} active`
          : activeIntents.length > 0
            ? `${activeIntents.length} (need 3+)`
            : 'No intents',
        progress: intentsDone
          ? 100
          : activeIntents.length > 0
            ? Math.min(90, (activeIntents.length / 3) * 100)
            : 0,
      },
      {
        number: 3,
        title: 'Design flows',
        description: 'Build conversation flows',
        state: getState(2),
        statusText: activeFlow
          ? `Active: "${activeFlow.name}"`
          : flows.length > 0
            ? `${flows.length} draft`
            : 'No flows',
        progress: activeFlow ? 100 : flows.length > 0 ? 50 : 0,
      },
      {
        number: 4,
        title: 'Select channels',
        description: 'Connect messaging platforms',
        state: getState(3),
        statusText: channelsDone
          ? `${connectedChannels.length} connected`
          : channels.length > 0
            ? `${channels.length} pending`
            : 'No channels',
        progress: channelsDone ? 100 : channels.length > 0 ? 40 : 0,
      },
      {
        number: 5,
        title: 'Go live',
        description: 'Launch your chatbot',
        state: getState(4),
        statusText: goLiveReady ? 'Ready!' : 'Complete above',
        progress: goLiveReady ? 100 : 0,
      },
    ];
  }, [specs, intents, flows, activeFlow, channels]);

  const completedCount = steps.filter((s) => s.state === 'done').length;
  const defaultActiveIdx = steps.findIndex((s) => s.state === 'active');
  const [selectedStep, setSelectedStep] = useState(defaultActiveIdx >= 0 ? defaultActiveIdx : 0);

  const displayIntents = useMemo(() => {
    return intents
      .filter((i) => i.isActive)
      .slice(0, 12)
      .map((it, idx) => ({
        label: it.name,
        color: INTENT_COLORS[idx % INTENT_COLORS.length],
        size: (idx < 5 ? 'md' : 'sm') as 'md' | 'sm',
      }));
  }, [intents]);

  const displayEndpoints = useMemo(() => {
    return endpoints.slice(0, 6).map((ep) => ({
      method: (ep.httpMethod?.toUpperCase() || 'GET') as 'GET' | 'POST' | 'PUT' | 'DEL',
      path: ep.path,
      status: ep.operationId ? 'mapped' : 'unmapped',
    }));
  }, [endpoints]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div
        id="setup-launch"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 scroll-mt-6"
      >
        <div className="min-w-0">
          <div className="text-2xs font-bold uppercase tracking-[3px] text-brand">Setup wizard</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight mt-1">
            Build your chatbot
          </div>
          <div className="text-xs sm:text-sm md:text-base text-text-secondary mt-1">
            Complete these steps to go live on any channel
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-text-muted">
            {completedCount}/{steps.length}
          </span>
          {completedCount < steps.length && (
            <button
              onClick={() => navigate('/dashboard/onboarding')}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-bg bg-brand hover:bg-brand-light transition-all flex items-center justify-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Continue</span>
              <span className="hidden sm:inline">&nbsp;Setup</span>
            </button>
          )}
        </div>
      </div>

      {/* Journey Path — horizontally scrollable on mobile, normal on md+ */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="overflow-x-auto -mx-1 md:mx-0 md:overflow-visible">
          <div className="min-w-[560px] md:min-w-0 px-1 md:px-0">
            <JourneyPath steps={steps} selectedIdx={selectedStep} onSelect={setSelectedStep} />
          </div>
        </div>
      </div>

      {/* ═══ ACTIVE STEP HERO (full-width now that sidebar step-list is gone — dedup with SVG journey) ═══ */}
      <div
        className="bg-bg-card border-2 border-[#8FAEA040] rounded-2xl p-4 sm:p-6 relative overflow-hidden scroll-mt-6"
        id="setup-hero"
      >
          {steps[selectedStep]?.state === 'active' && (
            <div className="absolute top-0 right-0 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-bl-xl bg-[#F59E0B18] text-[#F59E0B] text-[10px] sm:text-2xs font-bold tracking-wider">
              CURRENT
            </div>
          )}
          {steps[selectedStep]?.state === 'done' && (
            <div className="absolute top-0 right-0 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-bl-xl bg-[#00D97E18] text-[#00D97E] text-[10px] sm:text-2xs font-bold tracking-wider">
              COMPLETED
            </div>
          )}
          {steps[selectedStep]?.state === 'locked' && (
            <div className="absolute top-0 right-0 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-bl-xl bg-[#4D6E5F18] text-[#4D6E5F] text-[10px] sm:text-2xs font-bold tracking-wider">
              LOCKED
            </div>
          )}

          {(() => {
            const idx = selectedStep;
            return (
              <>
                <div className="flex items-center gap-4 mt-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-[#8FAEA030] flex items-center justify-center text-2xl shrink-0">
                    {HERO_ICONS[idx]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
                      {HERO_TITLES[idx]}
                    </h3>
                    <p className="text-sm text-text-secondary mt-0.5">{HERO_DESCS[idx]}</p>
                  </div>
                </div>

                {/* Step-specific inline content */}
                {idx === 0 && displayEndpoints.length > 0 && (
                  <div className="space-y-2 mb-5">
                    {displayEndpoints.slice(0, 3).map((ep) => (
                      <div
                        key={ep.path}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle"
                      >
                        <HttpMethodBadge method={ep.method} />
                        <span className="text-sm text-text-primary font-medium font-mono flex-1 truncate">
                          {ep.path}
                        </span>
                        <StatusBadge variant={ep.status === 'mapped' ? 'success' : 'muted'}>
                          {ep.status === 'mapped' ? 'Mapped' : 'Unmapped'}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                )}
                {idx === 1 && displayIntents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {displayIntents.slice(0, 6).map((intent) => (
                      <IntentTag
                        key={intent.label}
                        label={intent.label}
                        color={intent.color}
                        size={intent.size}
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(HERO_ROUTES[idx])}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-bg bg-brand hover:bg-brand-light transition-all"
                  >
                    {HERO_CTAS[idx]}
                  </button>
                  <button
                    onClick={() => navigate(HERO_ROUTES[idx])}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-border-subtle hover:border-border-medium hover:bg-bg-elevated transition-all"
                  >
                    {HERO_CTA_ALT[idx]}
                  </button>
                </div>
              </>
            );
          })()}
      </div>

      {/* ═══ DETAIL TILES ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API / Intents tile */}
        <GlassCard className="scroll-mt-6">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Link2 className="w-4 h-4 opacity-50" strokeWidth={1.6} /> API map
              </div>
              <span
                onClick={() => navigate('/dashboard/api-connection')}
                className="text-2xs text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors"
              >
                {specs.length > 0 ? 'Manage →' : 'Connect →'}
              </span>
            </div>
            {displayEndpoints.length > 0 ? (
              <div className="space-y-1.5">
                {displayEndpoints.slice(0, 3).map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated text-2xs"
                  >
                    <HttpMethodBadge method={ep.method} />
                    <span className="font-mono text-text-secondary truncate">{ep.path}</span>
                  </div>
                ))}
                {endpoints.length > 3 && (
                  <button
                    onClick={() => navigate('/dashboard/api-connection')}
                    className="text-2xs text-brand font-semibold"
                  >
                    +{endpoints.length - 3} more
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Link2 className="w-6 h-6 text-text-muted mx-auto mb-1.5 opacity-30" />
                <p className="text-2xs text-text-muted">No API connected</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="scroll-mt-6">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Target className="w-4 h-4 opacity-50" strokeWidth={1.6} /> Intents
              </div>
              <span
                onClick={() => navigate('/dashboard/intents')}
                className="text-2xs text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors"
              >
                {intents.length > 0 ? `${intents.filter((i) => i.isActive).length} active →` : 'Add →'}
              </span>
            </div>
            {displayIntents.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {displayIntents.slice(0, 6).map((intent) => (
                  <IntentTag key={intent.label} label={intent.label} color={intent.color} size="sm" />
                ))}
                {intents.filter((i) => i.isActive).length > 6 && (
                  <IntentTag
                    label={`+${intents.filter((i) => i.isActive).length - 6}`}
                    color="brand"
                    size="sm"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Target className="w-6 h-6 text-text-muted mx-auto mb-1.5 opacity-30" />
                <p className="text-2xs text-text-muted">No intents yet</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="scroll-mt-6">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <GitBranch className="w-4 h-4 opacity-50" strokeWidth={1.6} /> Flows
              </div>
              <span
                onClick={() => navigate('/dashboard/flows')}
                className="text-2xs text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors"
              >
                {flows.length > 0 ? 'Builder →' : 'Create →'}
              </span>
            </div>
            {activeFlow ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-soft border border-border-glow">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-bg text-sm">
                  ✨
                </div>
                <div className="min-w-0">
                  <div className="text-2xs font-semibold text-text-primary truncate">{activeFlow.name}</div>
                  <div className="text-2xs text-text-muted">{activeFlow.nodeCount} nodes</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <GitBranch className="w-6 h-6 text-text-muted mx-auto mb-1.5 opacity-30" />
                <p className="text-2xs text-text-muted">
                  {flows.length > 0 ? `${flows.length} draft` : 'No flows'}
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Channels + Catalog row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="scroll-mt-6" id="setup-channels">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Phone className="w-4 h-4 opacity-50" strokeWidth={1.6} /> Channels
              </div>
              <span
                onClick={() => navigate('/dashboard/channels')}
                className="text-2xs text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors"
              >
                {channels.length > 0 ? 'Manage →' : 'Connect →'}
              </span>
            </div>
            {channels.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {channels.slice(0, 4).map((ch) => {
                  const iconConf = CHANNEL_ICONS[ch.channelType] || CHANNEL_ICONS[7];
                  const statusLabel = CHANNEL_STATUS_LABEL[ch.status] || 'Unknown';
                  return (
                    <div
                      key={ch.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-elevated border border-border-subtle"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconConf.bg}`}
                      >
                        {iconConf.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-2xs font-bold text-text-primary truncate">
                          {ch.displayName || CHANNEL_TYPE_LABEL[ch.channelType]}
                        </div>
                        <div className="text-2xs text-text-muted">{statusLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Phone className="w-6 h-6 text-text-muted mx-auto mb-1.5 opacity-30" />
                <p className="text-2xs text-text-muted">No channels connected</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <Package className="w-4 h-4 opacity-50" strokeWidth={1.6} /> Catalog
              </div>
              <span
                onClick={() => navigate('/dashboard/catalog')}
                className="text-2xs text-brand font-semibold cursor-pointer hover:text-brand-light transition-colors"
              >
                {syncStatus?.isConfigured ? 'Manage →' : 'Configure →'}
              </span>
            </div>
            {syncStatus?.isConfigured ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle">
                <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center text-sm">
                  📦
                </div>
                <div className="min-w-0">
                  <div className="text-2xs font-semibold text-text-primary">
                    {syncStatus.productCount.toLocaleString()} products
                  </div>
                  <div className="text-2xs text-text-muted">
                    {syncStatus.isEnabled ? 'Enabled' : 'Paused'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Package className="w-6 h-6 text-text-muted mx-auto mb-1.5 opacity-30" />
                <p className="text-2xs text-text-muted">Not configured (optional)</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
