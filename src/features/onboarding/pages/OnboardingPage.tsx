import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  ExternalLink,
  Upload,
  Sparkles,
  Plus,
  LogOut,
  Rocket,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { useOnboardingStep } from '../hooks/useOnboardingStep';
import { ONBOARDING_STEPS } from '../types/onboarding.types';
import {
  useFlows,
  useGenerateFlow,
  useActivateFlow,
  useGoLiveChecklist,
  useActivateAll,
  useActivateChannel,
} from '@/features/flow-builder/api/flow.queries';
import { useIntents } from '@/features/intents/api/intents.queries';
import { useSpecs } from '@/features/api-connection/api/api-connection.queries';
import { SpecUploadZone } from '@/features/api-connection/components/SpecUploadZone';
import { ImportDialog } from '@/features/intents/components/import/ImportDialog';
import type { FlowDto, GoLiveChecklistResponse } from '@/features/flow-builder/types/flow.types';

/* ═══════════════════════════════════════════════════════════════
   DESIGN: A + C Fusion
   ─ Header: Mission-control progress ring + dot nav (C)
   ─ Left:   Action zone with big step number + content (A)
   ─ Right:  Sidebar step list + progress bar (A)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Step metadata ─── */
const STEP_META: Record<number, { badge: string; badgeColor: string }> = {
  1: { badge: 'Foundation', badgeColor: '#00FFAA' },
  2: { badge: 'Intelligence', badgeColor: '#A78BFA' },
  3: { badge: 'Optional', badgeColor: '#F59E0B' },
  4: { badge: 'AI-Powered', badgeColor: '#34D399' },
  5: { badge: 'Deploy', badgeColor: '#60A5FA' },
  6: { badge: 'Launch', badgeColor: '#F472B6' },
};

const STEP_DESCS: Record<number, string> = {
  1: 'Upload your OpenAPI / Swagger spec so Lead360 can map your endpoints and understand your business logic.',
  2: 'Teach your bot what customers will ask. You need at least 3 intents — use AI suggestions, import a file, or create manually.',
  3: 'Connect your product catalog so customers can browse, search, and purchase through the chatbot. This step is optional.',
  4: 'Describe your chatbot in plain English and AI generates the entire conversation flow. Or build it manually in the visual editor.',
  5: 'Choose which messaging platforms to deploy your chatbot on. You can always add more channels later.',
  6: 'Review the pre-flight checklist and activate all channels. Your chatbot will be live in seconds.',
};

/* ═══════════════════════════════════════
   PROGRESS RING (SVG arc from C)
   ═══════════════════════════════════════ */
function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * completed) / total;

  return (
    <div className="relative w-[44px] h-[44px] flex-shrink-0">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#132A21" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#00FFAA"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[14px] font-black text-brand-light">
          {completed}
          <span className="text-[8px] font-medium text-text-muted">/6</span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   STEP DOTS (header nav from C)
   ═══════════════════════════════════════ */
function StepDots({
  current,
  completed,
  onStep,
}: {
  current: number;
  completed: number[];
  onStep: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-[5px]">
      {ONBOARDING_STEPS.map((s) => {
        const done = completed.includes(s.number);
        const active = s.number === current;
        return (
          <button
            key={s.number}
            onClick={() => (done || s.number <= current) && onStep(s.number)}
            className={`
              h-2 rounded-full transition-all duration-300
              ${done ? 'w-2 bg-brand cursor-pointer hover:bg-brand-light' : ''}
              ${active ? 'w-6 bg-brand-light' : ''}
              ${!done && !active ? 'w-2 bg-border-subtle cursor-default' : ''}
            `}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   SIDEBAR STEP LIST (from A)
   ═══════════════════════════════════════ */
function SidebarSteps({
  current,
  completed,
  onStep,
}: {
  current: number;
  completed: number[];
  onStep: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      {ONBOARDING_STEPS.map((s) => {
        const done = completed.includes(s.number);
        const active = s.number === current;
        const locked = !done && s.number > current;

        return (
          <button
            key={s.number}
            onClick={() => !locked && onStep(s.number)}
            className={`
              flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] text-left
              transition-all duration-200
              ${active ? 'bg-[rgba(0,255,170,0.04)] border border-[rgba(0,255,170,0.08)]' : 'border border-transparent'}
              ${done ? 'opacity-55 hover:opacity-80' : ''}
              ${locked ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-shell'}
            `}
          >
            <div
              className={`
                w-6 h-6 rounded-[7px] flex items-center justify-center flex-shrink-0
                text-[10px] font-extrabold transition-all duration-200
                ${done ? 'bg-brand-soft' : active ? 'bg-[rgba(0,255,170,0.06)] border border-[rgba(0,255,170,0.1)]' : 'bg-[#0F1A16]'}
              `}
            >
              {done ? (
                <Check className="w-3 h-3 text-brand" />
              ) : (
                <span className={active ? 'text-brand-light' : 'text-text-muted'}>{s.number}</span>
              )}
            </div>

            <div className="min-w-0">
              <div
                className={`text-2xs font-semibold truncate ${
                  done ? 'text-brand' : active ? 'text-brand-light font-bold' : 'text-text-muted'
                }`}
              >
                {s.title}
              </div>
              {done && <div className="text-[8px] text-text-muted">Complete</div>}
              {active && <div className="text-[8px] text-brand-light">Current step</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   ACTION CARD (reusable)
   ═══════════════════════════════════════ */
function ActionCard({
  icon,
  label,
  hint,
  featured,
  onClick,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  featured?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-5 rounded-[14px] border text-center cursor-pointer
        transition-all duration-250 hover:-translate-y-[3px]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]
        ${
          featured
            ? 'border-[rgba(0,255,170,0.12)] bg-gradient-to-br from-bg-card to-bg-elevated hover:border-[rgba(0,255,170,0.2)]'
            : 'border-border-subtle bg-bg-card hover:border-glass-3'
        }
        ${className}
      `}
    >
      <div className="text-[28px] mb-2 inline-block animate-[float_3s_ease_infinite]">{icon}</div>
      <div className="text-xs font-bold text-text-primary">{label}</div>
      {hint && <div className="text-[9px] text-text-muted mt-1">{hint}</div>}
    </button>
  );
}

/* ═══════════════════════════════════════
   STEP CONTENT COMPONENTS
   ═══════════════════════════════════════ */

/* ── Step 1: Connect API ── */
function Step1({ onDone }: { onDone: () => void }) {
  const { data: specs } = useSpecs();
  const list = (specs as unknown as unknown[]) ?? [];

  if (list.length > 0)
    return (
      <div className="text-center py-4 animate-[fadeIn_.35s_ease]">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft mx-auto mb-3 flex items-center justify-center">
          <Check className="w-7 h-7 text-brand" />
        </div>
        <p className="text-sm font-bold text-brand mb-1">{list.length} API spec(s) connected!</p>
        <p className="text-2xs text-text-muted mb-5">Your endpoints have been mapped and are ready</p>
        <button
          onClick={onDone}
          className="px-6 py-2.5 rounded-[10px] text-xs font-bold bg-brand-light text-bg
                     hover:bg-brand transition-all duration-200"
        >
          Continue →
        </button>
      </div>
    );

  return (
    <div className="animate-[fadeIn_.35s_ease]">
      <div
        className="border-2 border-dashed border-border-subtle rounded-[16px] p-10 text-center
                    cursor-pointer transition-all duration-300
                    hover:border-[rgba(0,255,170,0.15)] hover:bg-[rgba(0,255,170,0.01)]"
      >
        <div className="text-4xl mb-3 inline-block animate-[float_3s_ease_infinite]">📄</div>
        <div className="text-sm font-bold text-text-primary mb-1">Drop your spec file here</div>
        <div className="text-2xs text-text-muted mb-4">OpenAPI 3.x · Swagger 2.0 — JSON or YAML</div>
        <SpecUploadZone onSuccess={onDone} />
      </div>
      <p className="text-[10px] text-text-muted text-center mt-3">
        Upload your OpenAPI/Swagger spec to get started.
      </p>
    </div>
  );
}

/* ── Step 2: Define Intents ── */
function Step2({ onDone }: { onDone: () => void }) {
  const tenantId = localStorage.getItem('omniflow_tenant_id') ?? '';
  const { data: raw } = useIntents(tenantId);
  const intents = (raw as unknown as unknown[]) ?? [];
  const [showImport, setShowImport] = useState(false);
  const nav = useNavigate();

  if (intents.length >= 3)
    return (
      <div className="text-center py-4 animate-[fadeIn_.35s_ease]">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft mx-auto mb-3 flex items-center justify-center">
          <Check className="w-7 h-7 text-brand" />
        </div>
        <p className="text-sm font-bold text-brand mb-1">{intents.length} intents defined!</p>
        <p className="text-2xs text-text-muted mb-5">Your bot now understands customer requests</p>
        <button
          onClick={onDone}
          className="px-6 py-2.5 rounded-[10px] text-xs font-bold bg-brand-light text-bg
                     hover:bg-brand transition-all duration-200"
        >
          Continue →
        </button>
      </div>
    );

  return (
    <div className="animate-[fadeIn_.35s_ease]">
      <div className="grid grid-cols-3 gap-3">
        <ActionCard
          icon="✨"
          label="AI Suggestions"
          hint="Auto-detect from API"
          featured
          onClick={() => nav('/dashboard/api-connection')}
        />
        <ActionCard icon="📥" label="Import File" hint="CSV / JSON" onClick={() => setShowImport(true)} />
        <ActionCard
          icon="✏️"
          label="Manual"
          hint="Create one by one"
          onClick={() => nav('/dashboard/intents')}
        />
      </div>
      <ImportDialog open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}

/* ── Step 3: Sync Catalog ── */
function Step3({ onDone }: { onDone: () => void }) {
  const nav = useNavigate();
  return (
    <div className="animate-[fadeIn_.35s_ease]">
      <div className="grid grid-cols-2 gap-3">
        <ActionCard
          icon="⚙️"
          label="Configure sync"
          hint="Set up product feed"
          featured
          onClick={() => nav('/dashboard/catalog')}
        />
        <ActionCard icon="⏩" label="Skip for now" hint="Come back anytime" onClick={onDone} />
      </div>

      {/* Redirect link */}
      <button
        onClick={() => nav('/dashboard/catalog')}
        className="group mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-[12px]
                   border border-border-subtle bg-bg-card
                   hover:border-glass-3 hover:bg-bg-elevated
                   transition-all duration-200"
      >
        <div
          className="w-8 h-8 rounded-[8px] bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.1)]
                        flex items-center justify-center flex-shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 text-warning" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-2xs font-semibold text-text-primary">Open Catalog page</div>
          <div className="text-[9px] text-text-muted">
            Full catalog management — products, categories, sync settings
          </div>
        </div>
        <ArrowRight
          className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-light
                               group-hover:translate-x-0.5 transition-all duration-200"
        />
      </button>
    </div>
  );
}

/* ── Step 4: Design Flows ── */
function Step4({ onDone }: { onDone: () => void }) {
  const { data: raw } = useFlows();
  const flows = (raw as unknown as FlowDto[]) ?? [];
  const active = flows.find((f) => f.isActive);
  const gen = useGenerateFlow();
  const act = useActivateFlow();
  const [input, setInput] = useState('');
  const nav = useNavigate();

  const handleGenerate = () => {
    if (!input.trim()) return;
    gen.mutate(
      { Instruction: input.trim(), FlowName: input.trim().slice(0, 50) },
      {
        onSuccess: (f) => {
          act.mutate(f.id);
          setInput('');
        },
      },
    );
  };

  if (active)
    return (
      <div className="text-center py-4 animate-[fadeIn_.35s_ease]">
        <div className="w-14 h-14 rounded-2xl bg-brand-soft mx-auto mb-3 flex items-center justify-center">
          <Check className="w-7 h-7 text-brand" />
        </div>
        <p className="text-sm font-bold text-brand mb-1">
          Active: "{active.name}" ({active.nodeCount} nodes)
        </p>
        <p className="text-2xs text-text-muted mb-5">Flow is deployed and ready to handle conversations</p>
        <button
          onClick={onDone}
          className="px-6 py-2.5 rounded-[10px] text-xs font-bold bg-brand-light text-bg
                     hover:bg-brand transition-all duration-200"
        >
          Continue →
        </button>
      </div>
    );

  return (
    <div className="animate-[fadeIn_.35s_ease]">
      {/* AI generator */}
      <div className="rounded-[14px] border border-border-subtle bg-bg-card overflow-hidden">
        <div className="flex items-center p-3 gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-glass-2 to-glass-3 flex items-center justify-center text-base flex-shrink-0">
            ✨
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. Build order tracking flow with status updates..."
            disabled={gen.isPending}
            className="flex-1 bg-transparent border-none outline-none text-xs text-text-primary
                       placeholder:text-text-muted font-sans"
          />
          <button
            onClick={handleGenerate}
            disabled={gen.isPending || !input.trim()}
            className="px-4 py-2 rounded-sm text-[11px] font-bold bg-brand-light text-bg
                       disabled:opacity-40 transition-all duration-200"
          >
            {gen.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Generate'}
          </button>
        </div>
        {gen.isPending && (
          <div
            className="px-4 py-2.5 border-t border-border-subtle"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,255,170,0.03), rgba(0,170,255,0.03), rgba(0,255,170,0.03))',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite',
            }}
          >
            <span className="text-[10px] font-semibold text-brand">
              🧠 AI designing your flow... (30-90s)
            </span>
          </div>
        )}
        <div className="px-4 py-2 border-t border-border-subtle bg-[rgba(0,255,170,0.01)]">
          <span className="text-[9px] text-text-muted">
            💡 Tip: Be specific — mention user actions, API calls, and error handling
          </span>
        </div>
      </div>

      {/* Existing flows */}
      {flows.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-text-muted mb-2">Or activate existing:</p>
          {flows.slice(0, 3).map((f) => (
            <button
              key={f.id}
              onClick={() => act.mutate(f.id)}
              className="w-full p-3 rounded-[10px] border border-border-subtle hover:border-glass-3
                         transition-all text-left mb-1.5 flex items-center justify-between
                         bg-bg-card hover:bg-bg-elevated"
            >
              <span className="text-2xs font-semibold text-text-primary">
                {f.name} <span className="text-[10px] text-text-muted">• {f.nodeCount} nodes</span>
              </span>
              <span className="text-[10px] font-bold text-brand">Activate →</span>
            </button>
          ))}
        </div>
      )}

      {/* Redirect link */}
      <button
        onClick={() => nav('/dashboard/flows')}
        className="group mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-[12px]
                   border border-border-subtle bg-bg-card
                   hover:border-glass-3 hover:bg-bg-elevated
                   transition-all duration-200"
      >
        <div
          className="w-8 h-8 rounded-[8px] bg-[rgba(52,211,153,0.06)] border border-[rgba(52,211,153,0.1)]
                        flex items-center justify-center flex-shrink-0"
        >
          <GitBranch className="w-3.5 h-3.5 text-success-light" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-2xs font-semibold text-text-primary">Open Visual Flow Builder</div>
          <div className="text-[9px] text-text-muted">
            Drag-and-drop editor — build manually, edit AI flows, or import
          </div>
        </div>
        <ArrowRight
          className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-light
                               group-hover:translate-x-0.5 transition-all duration-200"
        />
      </button>
    </div>
  );
}

/* ── Step 5: Connect Channels ── */
function Step5({ onDone }: { onDone: () => void }) {
  const nav = useNavigate();
  const channels = [
    {
      n: 'WhatsApp',
      i: '💬',
      hint: 'Most popular',
      featured: true,
      accentBorder: 'border-[rgba(37,211,102,0.15)]',
      accentBg: 'bg-[rgba(37,211,102,0.03)]',
    },
    { n: 'Telegram', i: '✈️', hint: 'Bot API' },
    { n: 'SMS', i: '📱', hint: 'Twilio / Vonage' },
    { n: 'WebChat', i: '🌐', hint: 'Embed widget' },
  ];

  return (
    <div className="animate-[fadeIn_.35s_ease]">
      <div className="grid grid-cols-2 gap-3 mb-6">
        {channels.map((c) => (
          <ActionCard
            key={c.n}
            icon={c.i}
            label={c.n}
            hint={c.hint}
            featured={c.featured}
            onClick={() => nav('/dashboard/channels')}
            className={c.accentBorder ? `${c.accentBorder} ${c.accentBg}` : ''}
          />
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={onDone}
          className="px-6 py-2.5 rounded-[10px] text-xs font-bold bg-brand-light text-bg
                     hover:bg-brand transition-all duration-200"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

/* ── Step 6: Go Live ── */
function Step6({ onDone }: { onDone: () => void }) {
  const { data: raw, isLoading } = useGoLiveChecklist();
  const cl = raw as unknown as GoLiveChecklistResponse | undefined;
  const actCh = useActivateChannel();
  const actAll = useActivateAll();

  if (isLoading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-brand" />
      </div>
    );

  if (!cl) return <div className="text-center py-16 text-sm text-text-muted">Unable to load checklist.</div>;

  return (
    <div className="animate-[fadeIn_.35s_ease]">
      {/* Pre-flight checklist */}
      <div className="rounded-[14px] border border-border-subtle bg-bg-card overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-bg-shell">
          <span className="text-2xs font-bold text-text-primary">Pre-flight Checklist</span>
          <span className={`text-2xs font-bold ${cl.isReady ? 'text-brand' : 'text-warning'}`}>
            {cl.requiredPassed}/{cl.requiredTotal} required
          </span>
        </div>
        <div className="divide-y divide-border-subtle">
          {cl.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className={`w-4 h-4 rounded-xs flex items-center justify-center flex-shrink-0 ${
                  it.passed ? 'bg-brand-soft' : 'bg-danger-soft'
                }`}
              >
                {it.passed ? (
                  <Check className="w-2.5 h-2.5 text-brand" />
                ) : (
                  <X className="w-2.5 h-2.5 text-danger" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xs font-medium text-text-primary">{it.name}</div>
                <div className="text-[10px] text-text-muted">{it.detail}</div>
              </div>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-xs ${
                  it.category === 'required' ? 'bg-danger-soft text-danger' : 'bg-glass-1 text-text-muted'
                }`}
              >
                {it.category}
              </span>
              {it.fixLink && (
                <a href={it.fixLink} className="text-brand">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Channel activation */}
      <div className="rounded-[14px] border border-border-subtle bg-bg-card overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-border-subtle bg-bg-shell">
          <span className="text-2xs font-bold text-text-primary">Channel Activation</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {cl.channels.map((ch, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1">
                <div className="text-2xs font-medium text-text-primary">
                  {ch.displayName || ch.channelType}
                </div>
                <div className="text-[10px] text-text-muted">
                  {ch.isConnected ? 'Connected' : 'Not connected'}
                  {ch.isLive && ' • 🟢 Live'}
                </div>
              </div>
              {ch.isConnected && !ch.isLive && (
                <button
                  onClick={() => actCh.mutate(ch.channelType)}
                  disabled={!cl.isReady || actCh.isPending}
                  className="px-3 py-1.5 rounded-sm text-[10px] font-bold bg-brand-light text-bg
                             disabled:opacity-40 transition-all duration-200"
                >
                  Activate
                </button>
              )}
              {ch.isLive && (
                <span className="px-2 py-1 rounded-sm text-[10px] font-bold bg-brand text-white">LIVE</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Go live button */}
      {cl.isReady && (
        <div className="text-center">
          <button
            onClick={() => actAll.mutate(undefined, { onSuccess: onDone })}
            disabled={actAll.isPending}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[12px] text-sm font-extrabold
                       bg-brand-light text-bg disabled:opacity-40 transition-all duration-200
                       hover:bg-brand hover:scale-[1.02]
                       shadow-[0_0_0_0_rgba(0,255,170,0.15)]
                       animate-[pulseGlow_2.5s_ease_infinite]"
          >
            {actAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Go Live
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   COMPLETED STATE
   ═══════════════════════════════════════ */
function AllComplete() {
  const nav = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-[480px]">
      <div className="text-center animate-[fadeIn_.5s_ease]">
        <div className="text-6xl mb-5">🎉</div>
        <h2 className="text-2xl font-extrabold text-text-primary mb-2">You're Live!</h2>
        <p className="text-sm text-text-muted mb-8">
          Your Lead360 chatbot is deployed and ready for customers.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => nav('/dashboard/flows')}
            className="px-5 py-2.5 rounded-[10px] text-xs font-semibold text-text-secondary
                       border border-border-subtle hover:bg-glass-1 transition-all duration-200"
          >
            Open Flow Builder
          </button>
          <button
            onClick={() => nav('/dashboard/analytics')}
            className="px-5 py-2.5 rounded-[10px] text-xs font-bold bg-brand-light text-bg
                       hover:bg-brand transition-all duration-200"
          >
            View Analytics →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE — A+C FUSION
   ═══════════════════════════════════════ */
export function Component() {
  const { currentStep, completedSteps, goToStep, completeStep, skipStep, allComplete } = useOnboardingStep();
  const nav = useNavigate();

  if (allComplete)
    return (
      <div className="rounded-frame border border-border-subtle bg-bg overflow-hidden">
        <AllComplete />
      </div>
    );

  const step = ONBOARDING_STEPS.find((s) => s.number === currentStep)!;
  const meta = STEP_META[currentStep];
  const pct = Math.round((completedSteps.length / 6) * 100);

  return (
    <div className="rounded-frame border border-border-subtle bg-bg overflow-hidden">
      {/* ── HEADER: Mission Control (C) ── */}
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border-subtle bg-bg-shell">
        <ProgressRing completed={completedSteps.length} total={6} />
        <div className="flex-1 min-w-0">
          <div className="text-label text-brand-light !text-[8px] !tracking-[2px]">Setup wizard</div>
          <div className="text-[15px] font-extrabold text-text-primary tracking-tight">
            Build your chatbot
          </div>
        </div>
        <StepDots current={currentStep} completed={completedSteps} onStep={goToStep} />
        <button
          onClick={() => nav('/dashboard')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm border border-border-subtle
                     text-[10px] font-semibold text-text-muted
                     hover:border-glass-3 hover:text-text-secondary transition-all duration-200"
        >
          <LogOut className="w-3 h-3" />
          Save & exit
        </button>
      </div>

      {/* ── BODY: Split Panel (A) ── */}
      <div className="flex min-h-[480px]">
        {/* LEFT: Action zone */}
        <div key={currentStep} className="flex-1 px-8 py-7 flex flex-col animate-[fadeIn_.35s_ease]">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[9px]
                       font-bold uppercase tracking-[1px] w-fit mb-4 border"
            style={{
              color: meta.badgeColor,
              backgroundColor: `${meta.badgeColor}0D`,
              borderColor: `${meta.badgeColor}20`,
            }}
          >
            {step.icon} {meta.badge}
          </div>

          {/* Step number */}
          <div className="text-5xl font-black tracking-[-3px] leading-none mb-1.5 select-none">
            <span className="text-bg-elevated">0</span>
            <span className="text-brand-light">{currentStep}</span>
          </div>

          {/* Title + description */}
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight mb-1.5">{step.title}</h2>
          <p className="text-xs text-text-muted leading-relaxed mb-6 max-w-md">{STEP_DESCS[currentStep]}</p>

          {/* Step content */}
          <div className="flex-1">
            {currentStep === 1 && <Step1 onDone={() => completeStep(1)} />}
            {currentStep === 2 && <Step2 onDone={() => completeStep(2)} />}
            {currentStep === 3 && <Step3 onDone={() => completeStep(3)} />}
            {currentStep === 4 && <Step4 onDone={() => completeStep(4)} />}
            {currentStep === 5 && <Step5 onDone={() => completeStep(5)} />}
            {currentStep === 6 && <Step6 onDone={() => completeStep(6)} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border-subtle">
            <button
              onClick={() => goToStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-2xs font-semibold
                         bg-bg-card border border-border-subtle text-text-secondary
                         hover:bg-bg-elevated hover:border-glass-3
                         disabled:opacity-25 disabled:pointer-events-none
                         transition-all duration-200"
            >
              <ChevronLeft className="w-3 h-3" />
              Previous
            </button>

            <button
              onClick={skipStep}
              className="px-4 py-2 rounded-[10px] text-2xs text-text-muted
                         hover:text-text-secondary hover:bg-glass-1 transition-all duration-200"
            >
              Skip
            </button>

            <button
              onClick={() => goToStep(Math.min(6, currentStep + 1))}
              disabled={currentStep === 6}
              className="flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-2xs font-bold
                         bg-brand-light text-bg
                         hover:bg-brand hover:-translate-y-px
                         disabled:opacity-25 disabled:pointer-events-none
                         transition-all duration-200 ml-auto"
            >
              Next step
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT: Sidebar (A) */}
        <div className="w-[220px] border-l border-border-subtle bg-bg-shell px-4 py-5 flex flex-col flex-shrink-0">
          <div className="text-label mb-3">Steps</div>
          <SidebarSteps current={currentStep} completed={completedSteps} onStep={goToStep} />

          {/* Progress */}
          <div className="mt-auto pt-4">
            <div className="p-3 rounded-[10px] bg-bg-card border border-border-subtle">
              <div className="text-[9px] text-text-muted mb-2">Overall progress</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-2xs font-extrabold text-brand">{completedSteps.length}/6</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
