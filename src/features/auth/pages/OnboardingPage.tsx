import { useState } from 'react';
import {
  Check,
  Upload,
  Plus,
  ArrowRight,
  ArrowLeft,
  Link2,
  Target,
  GitBranch,
  Phone,
  Zap,
  Globe,
  MessageSquare,
  FileJson,
  Sparkles,
  FileSpreadsheet,
  X,
} from 'lucide-react';

// ─── Types ───
type StepId = 1 | 2 | 3 | 4 | 5;

interface StepDef {
  id: StepId;
  title: string;
  description: string;
  icon: typeof Link2;
}

const STEPS: StepDef[] = [
  { id: 1, title: 'Connect API', description: 'Upload your OpenAPI spec or add endpoints manually', icon: Link2 },
  { id: 2, title: 'Define intents', description: 'Tell the bot what your business can do', icon: Target },
  { id: 3, title: 'Design flows', description: 'Build conversation menus and chat flows', icon: GitBranch },
  { id: 4, title: 'Select channels', description: 'Connect WhatsApp, Web chat, SMS, or more', icon: Phone },
  { id: 5, title: 'Go live', description: 'Verify webhook and launch your chatbot', icon: Zap },
];

// ─── Main Component ───
export function Component() {
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  const completeAndNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < 5) setCurrentStep((currentStep + 1) as StepId);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as StepId);
  };

  const getStepState = (id: StepId) => {
    if (completedSteps.has(id)) return 'done' as const;
    if (id === currentStep) return 'active' as const;
    return 'locked' as const;
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute top-[-120px] right-[25%] w-[450px] h-[450px] rounded-full bg-[rgba(5,150,105,0.08)] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[10%] w-[350px] h-[350px] rounded-full bg-[rgba(6,214,160,0.06)] blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-5%] w-[200px] h-[200px] rounded-full bg-[rgba(59,130,246,0.06)] blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-[1100px] mx-auto py-10 px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-success flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" className="w-5 h-5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-text-primary tracking-tight">Lead360</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Build your chatbot</h1>
          <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
            Complete these 5 steps to launch your AI chatbot on WhatsApp, Web, or SMS. Each step takes just a
            few minutes.
          </p>
        </div>

        {/* Step indicator strip */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((step) => {
            const state = getStepState(step.id);
            const isDone = state === 'done';
            const isActive = state === 'active';
            return (
              <button
                key={step.id}
                onClick={() => (isDone || isActive) && setCurrentStep(step.id)}
                className={`flex-1 relative p-3 rounded-card border-thin overflow-hidden transition-all duration-200 text-left ${
                  isDone
                    ? 'bg-glass-1 border-[rgba(6,214,160,0.15)] cursor-pointer hover:bg-glass-2'
                    : isActive
                      ? 'bg-brand-soft border-brand cursor-default'
                      : 'bg-glass-1 border-border-subtle opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-xs flex items-center justify-center text-[11px] font-extrabold mb-2 ${
                    isDone
                      ? 'bg-success-soft text-success'
                      : isActive
                        ? 'bg-brand-soft text-brand'
                        : 'bg-glass-2 text-text-muted'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : step.id}
                </div>
                <div className="text-[11px] font-bold text-text-primary">{step.title}</div>
                <div className="text-[11px] text-text-muted mt-0.5 leading-snug">{step.description}</div>
                {/* Bottom bar */}
                <div
                  className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 ${
                    isDone ? 'bg-success w-full' : isActive ? 'bg-brand w-[30%]' : 'bg-transparent w-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-glass-1 border-thin border-border-medium rounded-frame p-8 min-h-[400px]">
          {/* Step header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-card bg-brand-soft border-thin border-brand flex items-center justify-center">
              {(() => {
                const Icon = STEPS[currentStep - 1].icon;
                return <Icon className="w-5 h-5 text-brand" strokeWidth={1.6} />;
              })()}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                Step {currentStep} of 5
              </div>
              <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
                {STEPS[currentStep - 1].title}
              </h2>
            </div>
          </div>

          {/* Step body */}
          {currentStep === 1 && <Step1ConnectApi />}
          {currentStep === 2 && <Step2DefineIntents />}
          {currentStep === 3 && <Step3DesignFlows />}
          {currentStep === 4 && <Step4SelectChannels />}
          {currentStep === 5 && <Step5GoLive completedSteps={completedSteps} />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-t-border-subtle">
            <button
              onClick={goBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-semibold transition-all duration-150 ${
                currentStep === 1
                  ? 'text-text-muted cursor-not-allowed'
                  : 'bg-glass-1 border-thin border-border-medium text-text-secondary hover:bg-glass-2 hover:text-text-primary'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    completedSteps.has(s.id)
                      ? 'bg-success'
                      : s.id === currentStep
                        ? 'bg-brand w-5'
                        : 'bg-glass-3'
                  }`}
                />
              ))}
            </div>

            {currentStep < 5 ? (
              <button
                onClick={completeAndNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-sm text-xs font-bold bg-gradient-to-br from-brand to-brand-dark text-white transition-all duration-150 hover:brightness-110"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={completeAndNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-sm text-xs font-bold bg-gradient-to-br from-success to-[#059669] text-white transition-all duration-150 hover:brightness-110"
              >
                <Zap className="w-3.5 h-3.5" /> Launch chatbot
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 1 — Connect API
// ═══════════════════════════════════════════════════════
function Step1ConnectApi() {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary leading-relaxed">
        Connect your business system's API so Lead360 knows what your system can do. Upload an
        OpenAPI/Swagger spec for automatic detection, or add endpoints manually.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold border-thin transition-all duration-150 ${
            mode === 'upload'
              ? 'bg-brand-soft border-brand text-brand'
              : 'bg-glass-1 border-border-subtle text-text-muted hover:text-text-secondary'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload spec file
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold border-thin transition-all duration-150 ${
            mode === 'manual'
              ? 'bg-brand-soft border-brand text-brand'
              : 'bg-glass-1 border-border-subtle text-text-muted hover:text-text-secondary'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Add manually
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="border-2 border-dashed border-border-medium rounded-card p-10 text-center hover:border-brand-light transition-all duration-200 cursor-pointer">
          <div className="w-12 h-12 rounded-card bg-brand-soft mx-auto mb-4 flex items-center justify-center">
            <FileJson className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">Drop your OpenAPI spec here</p>
          <p className="text-xs text-text-muted">Supports .json or .yaml — Swagger 2.0 and OpenAPI 3.x</p>
          <button className="mt-4 px-4 py-2 rounded-sm text-xs font-bold bg-glass-2 border-thin border-border-medium text-text-secondary hover:text-text-primary transition-all duration-150">
            Browse files
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[80px_1fr_180px] gap-2 items-center">
            <label className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted">Method</label>
            <label className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted">
              Endpoint path
            </label>
            <label className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted">
              Description
            </label>
          </div>
          <div className="grid grid-cols-[80px_1fr_180px] gap-2 items-center">
            <select className="bg-glass-2 border-thin border-border-subtle rounded-xs px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-brand">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input
              placeholder="/api/v1/products"
              className="bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted font-mono focus:outline-none focus:border-brand"
            />
            <input
              placeholder="List all products"
              className="bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
            />
          </div>
          <button className="flex items-center gap-1 text-xs text-brand font-semibold hover:brightness-125 transition-all">
            <Plus className="w-3 h-3" /> Add another endpoint
          </button>
        </div>
      )}

      {/* Auth config */}
      <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4">
        <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-3">
          API authentication
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted block mb-1.5">
              Auth type
            </label>
            <select className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand">
              <option>Bearer Token</option>
              <option>API Key</option>
              <option>Basic Auth</option>
              <option>OAuth 2.0</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted block mb-1.5">
              Token / Key
            </label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 2 — Define Intents
// ═══════════════════════════════════════════════════════
function Step2DefineIntents() {
  const [tab, setTab] = useState<'manual' | 'ai' | 'import'>('manual');

  const tabs = [
    { key: 'manual' as const, label: 'Manual', icon: Plus },
    { key: 'ai' as const, label: 'AI suggested', icon: Sparkles },
    { key: 'import' as const, label: 'Bulk import', icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary leading-relaxed">
        Intents define what your chatbot can understand and do. Add them manually, let AI suggest from your API, or import from a file.
      </p>

      {/* 3-track tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold border-thin transition-all duration-150 ${
              tab === t.key ? 'bg-brand-soft border-brand text-brand' : 'bg-glass-1 border-border-subtle text-text-muted hover:text-text-secondary'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'manual' && (
        <div className="space-y-3">
          {/* Intent form */}
          <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted block mb-1.5">Intent name</label>
                <input placeholder="e.g. Track Order" className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted block mb-1.5">Category</label>
                <select className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand">
                  <option>Customer service</option><option>Product</option><option>Booking</option><option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted block mb-1.5">Keywords (comma separated)</label>
              <input placeholder="where is my order, track delivery, order status" className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-[1px] text-text-muted block mb-1.5">Maps to API endpoint</label>
              <select className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand">
                <option>GET /api/v1/orders/{'{id}'}/track</option>
                <option>GET /api/v1/products</option>
                <option>POST /api/v1/orders</option>
                <option>None (static response)</option>
              </select>
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-bold bg-gradient-to-br from-brand to-brand-dark text-white">
              <Plus className="w-3 h-3" /> Add intent
            </button>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-6 text-center">
          <div className="w-12 h-12 rounded-card bg-brand-soft mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">AI will analyze your API</p>
          <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
            Based on your connected endpoints, we'll suggest intents with keywords, descriptions, and API mappings. You review and approve each one.
          </p>
          <button className="px-5 py-2 rounded-sm text-xs font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Generate suggestions</span>
          </button>
        </div>
      )}

      {tab === 'import' && (
        <div className="border-2 border-dashed border-border-medium rounded-card p-10 text-center hover:border-brand-light transition-all duration-200 cursor-pointer">
          <div className="w-12 h-12 rounded-card bg-brand-soft mx-auto mb-4 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">Import intents from file</p>
          <p className="text-xs text-text-muted mb-4">CSV or JSON with columns: name, keywords, description, category</p>
          <button className="px-4 py-2 rounded-sm text-xs font-bold bg-glass-2 border-thin border-border-medium text-text-secondary hover:text-text-primary transition-all">
            Upload file
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 3 — Design Flows
// ═══════════════════════════════════════════════════════
function Step3DesignFlows() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary leading-relaxed">
        Describe your chatbot's conversation flow in plain language. The AI will generate a menu structure with buttons, lists, and chat nodes. You can edit everything after.
      </p>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted block mb-2">Describe your flow</label>
        <textarea
          rows={4}
          placeholder="e.g. Main menu with: Browse Products, Track My Order, Book Appointment, and Talk to Support. When someone picks Track Order, ask for order number then call the tracking API."
          className="w-full bg-glass-2 border-thin border-border-subtle rounded-card px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand resize-none leading-relaxed"
        />
      </div>

      <button className="flex items-center gap-1.5 px-5 py-2 rounded-sm text-xs font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all">
        <Sparkles className="w-3.5 h-3.5" /> Generate flow
      </button>

      {/* Preview placeholder */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-3">Flow preview</div>
          <div className="space-y-2">
            {['Greeting menu', 'Browse Products', 'Track Order', 'Book Appointment', 'Talk to Support'].map((node, i) => (
              <div key={node} className="flex items-center gap-2">
                {i > 0 && <div className="w-3 border-t border-dashed border-border-medium" />}
                <div className={`flex-1 px-3 py-2 rounded-sm text-xs font-semibold border-thin ${
                  i === 0 ? 'bg-success-soft text-success border-[rgba(6,214,160,0.15)]' : 'bg-glass-2 text-text-secondary border-border-subtle'
                }`}>
                  {node}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp preview */}
        <div className="bg-glass-1 border-thin border-border-subtle rounded-card overflow-hidden">
          <div className="bg-[#075E54] px-4 py-2.5 text-text-primary text-xs font-bold">WhatsApp preview</div>
          <div className="bg-[#0B141A] p-3 space-y-2 min-h-[200px]">
            <div className="bg-[#1F2C34] rounded-lg rounded-tl-none px-3 py-2 text-xs text-[#E1E1E3] max-w-[85%]">
              Welcome to <span className="font-bold">Your Business</span>! How can I help you?
            </div>
            <div className="flex flex-wrap gap-1.5 ml-1">
              {['Browse Products', 'Track Order', 'Book Appointment', 'Support'].map((btn) => (
                <div key={btn} className="px-3 py-1.5 rounded-full border border-[#2A3942] text-[11px] text-[#53BDEB] font-medium">
                  {btn}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 4 — Select Channels
// ═══════════════════════════════════════════════════════
function Step4SelectChannels() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (ch: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(ch) ? next.delete(ch) : next.add(ch);
      return next;
    });
  };

  const channels = [
    { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Buttons, lists, product cards, interactive messages', icon: Phone, color: 'success' as const },
    { id: 'web', name: 'Web chat widget', desc: 'Embed on your website with one script tag', icon: Globe, color: 'info' as const },
    { id: 'sms', name: 'SMS (Twilio)', desc: 'Text-only, simplified menu navigation', icon: MessageSquare, color: 'brand' as const },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary leading-relaxed">
        Choose which channels your chatbot will be available on. You can add more channels later. Each channel automatically adapts your flows to its native format.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {channels.map((ch) => {
          const isOn = selected.has(ch.id);
          const colorMap = { success: 'bg-success-soft text-success border-[rgba(6,214,160,0.2)]', info: 'bg-info-soft text-info border-[rgba(59,130,246,0.2)]', brand: 'bg-brand-soft text-brand border-brand' };
          return (
            <button
              key={ch.id}
              onClick={() => toggle(ch.id)}
              className={`relative p-4 rounded-card border-thin text-left transition-all duration-200 ${
                isOn ? `${colorMap[ch.color]} bg-opacity-100` : 'bg-glass-1 border-border-subtle hover:border-border-medium'
              }`}
            >
              {isOn && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-3 h-3 text-text-primary" strokeWidth={3} />
                </div>
              )}
              <div className={`w-10 h-10 rounded-card flex items-center justify-center mb-3 ${
                isOn ? 'bg-glass-2' : 'bg-glass-2'
              }`}>
                <ch.icon className={`w-5 h-5 ${isOn ? '' : 'text-text-muted'}`} strokeWidth={1.6} />
              </div>
              <div className={`text-sm font-bold mb-1 ${isOn ? '' : 'text-text-primary'}`}>{ch.name}</div>
              <div className={`text-[11px] leading-snug ${isOn ? 'opacity-70' : 'text-text-muted'}`}>{ch.desc}</div>
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4">
          <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-3">
            Channel configuration — {selected.size} selected
          </div>
          {selected.has('whatsapp') && (
            <div className="space-y-2 mb-3">
              <div className="text-xs font-bold text-success">WhatsApp Business</div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Phone number ID" className="bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
                <input placeholder="Business Account ID" className="bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
              </div>
              <input type="password" placeholder="Permanent access token" className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
            </div>
          )}
          {selected.has('web') && (
            <div className="space-y-2 mb-3">
              <div className="text-xs font-bold text-info">Web chat widget</div>
              <input placeholder="Website URL (for CORS)" className="w-full bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
            </div>
          )}
          {selected.has('sms') && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-brand">SMS (Twilio)</div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Twilio Account SID" className="bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
                <input type="password" placeholder="Auth Token" className="bg-glass-2 border-thin border-border-subtle rounded-xs px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STEP 5 — Go Live
// ═══════════════════════════════════════════════════════
function Step5GoLive({ completedSteps }: { completedSteps: Set<StepId> }) {
  const checks = [
    { label: 'API connected', done: completedSteps.has(1) },
    { label: 'Intents defined', done: completedSteps.has(2) },
    { label: 'Flows designed', done: completedSteps.has(3) },
    { label: 'Channels configured', done: completedSteps.has(4) },
  ];
  const allDone = checks.every((c) => c.done);

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary leading-relaxed">
        Almost there! Review your setup and launch your chatbot. Once live, customers can start chatting immediately.
      </p>

      {/* Checklist */}
      <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted mb-2">Launch checklist</div>
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-3 py-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              c.done ? 'bg-success' : 'bg-glass-2 border-thin border-border-medium'
            }`}>
              {c.done && <Check className="w-3 h-3 text-text-primary" strokeWidth={3} />}
            </div>
            <span className={`text-sm font-medium ${c.done ? 'text-text-primary' : 'text-text-muted'}`}>{c.label}</span>
            {c.done && <span className="text-[11px] text-success font-bold uppercase tracking-wide ml-auto">Complete</span>}
            {!c.done && <span className="text-[11px] text-warning font-bold uppercase tracking-wide ml-auto">Incomplete</span>}
          </div>
        ))}
      </div>

      {allDone ? (
        <div className="bg-success-soft border-thin border-[rgba(6,214,160,0.2)] rounded-card p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-success mx-auto mb-4 flex items-center justify-center">
            <Zap className="w-7 h-7 text-text-primary" />
          </div>
          <p className="text-lg font-extrabold text-text-primary mb-1">Ready to launch!</p>
          <p className="text-xs text-success">All steps completed. Click "Launch chatbot" to go live.</p>
        </div>
      ) : (
        <div className="bg-warning-soft border-thin border-[rgba(245,158,11,0.15)] rounded-card p-4 text-center">
          <p className="text-sm font-semibold text-warning">Complete all steps before launching</p>
          <p className="text-xs text-text-muted mt-1">Go back and finish the incomplete steps above.</p>
        </div>
      )}
    </div>
  );
}
