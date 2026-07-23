import { useState, useMemo } from 'react';
import {
  Plug,
  Upload,
  FileCode2,
  Sparkles,
  Brain,
  Zap,
  MessageSquare,
  FileJson,
  ArrowRight,
} from 'lucide-react';
import { JourneyMap } from '../components/JourneyMap';
import { SpecUploadZone } from '../components/SpecUploadZone';
import { SpecListTable } from '../components/SpecListTable';
import { EndpointTable } from '../components/EndpointTable';
import { CapabilityMapView } from '../components/CapabilityMapView';
import { AnalysisView } from '../components/AnalysisView';
import { TestConsole } from '../components/TestConsole';
import { SuggestionsView } from '../components/SuggestionsView';
import { useSpecs, useEndpoints } from '../api/api-connection.queries';
import { SpecStatus, PIPELINE_STEPS } from '../types/api-connection.types';
import type { ApiSpecDto, EndpointDto, PipelineStep } from '../types/api-connection.types';

const STEP_META: Record<PipelineStep, { icon: typeof Plug; color: string; desc: string }> = {
  upload: {
    icon: Upload,
    color: '#10B981',
    desc: 'Upload your OpenAPI / Swagger spec to begin the pipeline',
  },
  endpoints: { icon: FileCode2, color: '#00D97E', desc: 'Browse and explore your parsed API endpoints' },
  capability: {
    icon: Sparkles,
    color: '#A78BFA',
    desc: 'AI generates a business capability map from your endpoints',
  },
  analysis: {
    icon: Brain,
    color: '#3B82F6',
    desc: 'AI analyzes readiness, identifies gaps, and scores your API',
  },
  test: { icon: Zap, color: '#F59E0B', desc: 'Test individual endpoints with live API calls' },
  suggestions: {
    icon: MessageSquare,
    color: '#EC4899',
    desc: 'AI suggests intents and conversation flows from your API',
  },
};

const METHOD_COLORS: Record<string, [string, string]> = {
  GET: ['#2563EB', '#3B82F6'],
  POST: ['#059669', '#10B981'],
  PUT: ['#D97706', '#F59E0B'],
  DELETE: ['#E11D48', '#F43F5E'],
  PATCH: ['#00B368', '#00D97E'],
};
const METHOD_ORDER = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export function Component() {
  const { data: rawSpecs, isLoading: specsLoading } = useSpecs();
  const specs = (rawSpecs as unknown as ApiSpecDto[]) ?? [];
  const [step, setStep] = useState<PipelineStep>('upload');
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);

  const activeSpec = useMemo(() => {
    if (selectedSpecId) return specs.find((s) => s.id === selectedSpecId);
    return specs.find((s) => s.status === SpecStatus.Parsed) || specs[0];
  }, [specs, selectedSpecId]);

  const { data: rawEndpoints } = useEndpoints(activeSpec?.id);
  const endpoints = (rawEndpoints as unknown as EndpointDto[]) ?? [];

  const completedSteps = useMemo<PipelineStep[]>(() => {
    const done: PipelineStep[] = [];
    if (specs.some((s) => s.status === SpecStatus.Parsed)) done.push('upload');
    if (activeSpec && activeSpec.endpointCount > 0)
      done.push('endpoints', 'capability', 'analysis', 'test', 'suggestions');
    return done;
  }, [specs, activeSpec]);

  const handleSpecUploaded = (specId: string) => {
    setSelectedSpecId(specId);
    setStep('endpoints');
  };
  const handleSelectSpec = (spec: ApiSpecDto) => {
    setSelectedSpecId(spec.id);
    setStep('endpoints');
  };

  const currentIdx = PIPELINE_STEPS.findIndex((s) => s.id === step);
  const nextStep = PIPELINE_STEPS[currentIdx + 1];
  const meta = STEP_META[step];
  const Icon = meta.icon;

  const methodCounts = useMemo(() => {
    const c: Record<string, number> = {};
    endpoints.forEach((e) => {
      const m = e.httpMethod.toUpperCase();
      c[m] = (c[m] || 0) + 1;
    });
    return c;
  }, [endpoints]);
  const totalEp = endpoints.length || activeSpec?.endpointCount || 0;

  return (
    <div className="space-y-0">
      {/* ═══ HEADER ═══ */}
      <div
        style={{
          padding: '16px 0',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #111916',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#E8F0EC' }}>API Connection</h1>
          <div style={{ height: 16, width: 1, background: '#1E2E26' }} />
          {activeSpec ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 8,
                background: 'rgba(0,217,126,0.06)',
                border: '1px solid rgba(0,217,126,0.1)',
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#00D97E',
                  boxShadow: '0 0 6px rgba(0,217,126,0.3)',
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E8F0EC' }}>{activeSpec.name}</span>
              <span style={{ fontSize: 12, color: '#708A7E' }}>· {activeSpec.endpointCount} endpoints</span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: '#708A7E' }}>No spec uploaded yet</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {specs.length > 1 && step !== 'upload' && (
            <select
              value={activeSpec?.id || ''}
              onChange={(e) => setSelectedSpecId(e.target.value)}
              className="cfi appearance-none cursor-pointer"
              style={{ maxWidth: 180, padding: '7px 12px', fontSize: 12 }}
            >
              {specs
                .filter((s) => s.status === SpecStatus.Parsed)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          )}
          <button
            onClick={() => setStep('upload')}
            style={{
              padding: '7px 14px',
              borderRadius: 9,
              background: '#0A0F0D',
              border: '1px solid #162019',
              fontSize: 12,
              color: '#8A9B91',
              cursor: 'pointer',
            }}
          >
            Upload new
          </button>
        </div>
      </div>

      {/* ═══ JOURNEY MAP — big contained glass panel ═══ */}
      <div
        style={{
          margin: '16px 0 0',
          borderRadius: 20,
          background: 'linear-gradient(180deg, #080B0A, #050808)',
          border: '1.5px solid #1E2E26',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.025,
            backgroundImage: 'radial-gradient(circle, #00D97E 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Ambient glow behind active area */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '20%',
            left: `${(currentIdx / 5) * 80 + 5}%`,
            width: 180,
            height: 120,
            borderRadius: '50%',
            background: `${meta.color}06`,
            transition: 'left 0.7s ease',
            filter: 'blur(30px)',
          }}
        />
        <JourneyMap currentStep={step} completedSteps={completedSteps} onStepClick={setStep} />
        {/* Bottom: skip navigation */}
        <div
          style={{
            padding: '0 20px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {PIPELINE_STEPS.map((s, i) => {
            const c = STEP_META[s.id].color;
            const isActive = step === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? `1.5px solid ${c}40` : '1px solid transparent',
                  background: isActive ? `${c}12` : 'transparent',
                  color: isActive ? c : '#708A7E',
                  transition: 'all 0.15s',
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = c;
                    e.currentTarget.style.background = `${c}08`;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#708A7E';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ STEP GUIDE HEADER ═══ */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          margin: '16px 0 0',
          borderRadius: 16,
          background: '#0A0F0D',
          border: `1.5px solid ${meta.color}20`,
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}15)` }} />
        <div
          className="absolute pointer-events-none"
          style={{
            top: -40,
            left: 24,
            width: 160,
            height: 120,
            borderRadius: '50%',
            background: `${meta.color}06`,
          }}
        />
        <div
          style={{
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: `${meta.color}18`,
              border: `2px solid ${meta.color}35`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 24px ${meta.color}10`,
            }}
          >
            <Icon style={{ width: 24, height: 24, color: meta.color }} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#E8F0EC' }}>
              {PIPELINE_STEPS[currentIdx]?.label}
            </div>
            <div style={{ fontSize: 13, color: '#708A7E', marginTop: 2 }}>{meta.desc}</div>
          </div>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 9,
              background: `${meta.color}0C`,
              border: `1px solid ${meta.color}18`,
              fontSize: 12,
              fontWeight: 600,
              color: meta.color,
            }}
          >
            Step {currentIdx + 1} of 6
          </div>
          {nextStep && (
            <button
              onClick={() => setStep(nextStep.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: `${STEP_META[nextStep.id].color}14`,
                border: `1.5px solid ${STEP_META[nextStep.id].color}25`,
                fontSize: 12,
                fontWeight: 600,
                color: STEP_META[nextStep.id].color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {nextStep.label} <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ CONTENT ZONE ═══ */}
      <div style={{ padding: '16px 0 24px' }}>
        {/* ── UPLOAD STEP ── */}
        {step === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upload zone card */}
            <div
              style={{
                borderRadius: 16,
                background: '#0A0F0D',
                border: '1.5px solid #1E2E26',
                overflow: 'hidden',
              }}
            >
              <div
                style={{ height: 2, background: 'linear-gradient(90deg, #10B981, rgba(16,185,129,0.1))' }}
              />
              <div style={{ padding: 22 }}>
                <div className="flex items-center gap-2 mb-5">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(0,217,126,0.08)',
                      border: '1.5px solid rgba(0,217,126,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plug style={{ width: 16, height: 16, color: '#00D97E' }} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E8F0EC' }}>Upload New Spec</h3>
                </div>
                <SpecUploadZone onSuccess={handleSpecUploaded} />
              </div>
            </div>

            {/* Spec list card */}
            <div
              style={{
                borderRadius: 16,
                background: '#0A0F0D',
                border: '1.5px solid #1E2E26',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #162019',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FileJson style={{ width: 16, height: 16, color: '#708A7E' }} strokeWidth={1.5} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: '#708A7E',
                  }}
                >
                  Previously Uploaded
                </span>
                {specs.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#00D97E', marginLeft: 'auto' }}>
                    {specs.length}
                  </span>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <SpecListTable specs={specs} isLoading={specsLoading} onSelect={handleSelectSpec} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEPS WITH SIDEBAR ── */}
        {step !== 'upload' && (
          <div style={{ display: 'grid', gridTemplateColumns: activeSpec ? '1fr 260px' : '1fr', gap: 12 }}>
            {/* Main content */}
            <div
              style={{
                gridRow: activeSpec ? 'span 3' : undefined,
                borderRadius: 16,
                background: '#0A0F0D',
                border: '1px solid #1E2E26',
                overflow: 'hidden',
                padding: step === 'endpoints' ? 0 : 20,
              }}
            >
              {step === 'endpoints' && activeSpec && (
                <EndpointTable endpoints={endpoints} isLoading={!rawEndpoints && !!activeSpec.id} />
              )}
              {step === 'capability' && activeSpec && <CapabilityMapView specId={activeSpec.id} />}
              {step === 'analysis' && activeSpec && <AnalysisView specId={activeSpec.id} />}
              {step === 'test' && activeSpec && <TestConsole endpoints={endpoints} />}
              {step === 'suggestions' && activeSpec && <SuggestionsView specId={activeSpec.id} />}
              {!activeSpec && (
                <div className="flex flex-col items-center py-16 text-center">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: 'rgba(0,217,126,0.06)',
                      border: '1.5px solid rgba(0,217,126,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                    }}
                  >
                    <Plug style={{ width: 28, height: 28, color: '#708A7E' }} strokeWidth={1.4} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#8A9B91' }}>Upload a spec first</p>
                  <p style={{ fontSize: 13, color: '#708A7E', marginTop: 4 }}>
                    Your API journey starts with an OpenAPI spec
                  </p>
                  <button
                    onClick={() => setStep('upload')}
                    style={{
                      marginTop: 14,
                      padding: '10px 20px',
                      borderRadius: 10,
                      background: 'rgba(0,217,126,0.08)',
                      border: '1.5px solid rgba(0,217,126,0.15)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#00D97E',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Upload style={{ width: 14, height: 14 }} strokeWidth={1.8} /> Go to Upload
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            {activeSpec && (
              <>
                {/* Method bar chart */}
                {totalEp > 0 && <MethodChart counts={methodCounts} />}

                {/* Spec info */}
                <div
                  style={{
                    borderRadius: 14,
                    background: '#0A0F0D',
                    border: '1px solid #1E2E26',
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#708A7E',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      marginBottom: 10,
                    }}
                  >
                    Active spec
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        background: 'rgba(0,217,126,0.08)',
                        border: '1.5px solid rgba(0,217,126,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileCode2 style={{ width: 16, height: 16, color: '#00D97E' }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#E8F0EC' }}>{activeSpec.name}</div>
                      <div style={{ fontSize: 11, color: '#708A7E' }}>
                        {activeSpec.fileFormat || 'json'} · {activeSpec.endpointCount} endpoints
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next step CTA */}
                {nextStep &&
                  (() => {
                    const nc = STEP_META[nextStep.id].color;
                    const NI = STEP_META[nextStep.id].icon;
                    return (
                      <div
                        onClick={() => setStep(nextStep.id)}
                        style={{
                          borderRadius: 14,
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          background: `linear-gradient(145deg, ${nc}0D, ${nc}03)`,
                          border: `1.5px solid ${nc}20`,
                          padding: 16,
                          animation: 'j-float 5s ease infinite',
                        }}
                      >
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            top: -16,
                            right: -8,
                            width: 56,
                            height: 44,
                            borderRadius: '50%',
                            background: `${nc}06`,
                          }}
                        />
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 9,
                              background: `${nc}18`,
                              border: `1.5px solid ${nc}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <NI style={{ width: 14, height: 14, color: nc }} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: nc }}>
                              Next: {nextStep.label}
                            </div>
                            <div style={{ fontSize: 11, color: '#708A7E' }}>Step {nextStep.num} of 6</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#708A7E', lineHeight: 1.4, marginBottom: 10 }}>
                          {STEP_META[nextStep.id].desc}
                        </div>
                        <div
                          style={{
                            padding: 9,
                            borderRadius: 9,
                            background: `${nc}14`,
                            border: `1px solid ${nc}18`,
                            textAlign: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                            color: nc,
                          }}
                        >
                          Continue →
                        </div>
                      </div>
                    );
                  })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ METHOD BAR CHART ═══ */
function MethodChart({ counts }: { counts: Record<string, number> }) {
  const maxC = Math.max(...Object.values(counts), 1);
  return (
    <div style={{ borderRadius: 14, background: '#0A0F0D', border: '1px solid #1E2E26', padding: 18 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#708A7E',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: 14,
        }}
      >
        Method breakdown
      </div>
      {/* Counts */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        {METHOD_ORDER.map((m) => {
          const c = counts[m] || 0;
          const cl = METHOD_COLORS[m] || ['#708A7E', '#8A9B91'];
          return (
            <div key={m} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: c > 0 ? cl[1] : '#253D32' }}>{c}</span>
            </div>
          );
        })}
      </div>
      {/* Bars */}
      <div style={{ display: 'flex', gap: 8, height: 90, alignItems: 'flex-end' }}>
        {METHOD_ORDER.map((m) => {
          const c = counts[m] || 0;
          const pct = c > 0 ? Math.max(10, (c / maxC) * 100) : 3;
          const cl = METHOD_COLORS[m] || ['#708A7E', '#8A9B91'];
          return (
            <div
              key={m}
              style={{
                flex: 1,
                borderRadius: '6px 6px 2px 2px',
                height: `${pct}%`,
                minHeight: c > 0 ? 10 : 3,
                background: c > 0 ? `linear-gradient(180deg, ${cl[0]}, ${cl[1]})` : '#162019',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {c > 0 && c === maxC && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: '50%',
                    height: '100%',
                    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)',
                    animation: 'bar-shine 2.5s ease infinite',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {METHOD_ORDER.map((m) => {
          const c = counts[m] || 0;
          const cl = METHOD_COLORS[m] || ['#708A7E', '#8A9B91'];
          return (
            <div key={m} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: c > 0 ? cl[1] : '#253D32' }}>
                {m === 'DELETE' ? 'DEL' : m}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
