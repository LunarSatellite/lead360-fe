import { useMemo } from 'react';
import { PIPELINE_STEPS, type PipelineStep } from '../types/api-connection.types';

interface JourneyMapProps {
  currentStep: PipelineStep;
  completedSteps: PipelineStep[];
  onStepClick: (step: PipelineStep) => void;
}

const COLORS: Record<PipelineStep, string> = {
  upload: '#10B981',
  endpoints: '#00D97E',
  capability: '#A78BFA',
  analysis: '#3B82F6',
  test: '#F59E0B',
  suggestions: '#EC4899',
};
const SHORT: Record<PipelineStep, string> = {
  upload: 'Upload',
  endpoints: 'Endpoints',
  capability: 'Map',
  analysis: 'Analysis',
  test: 'Test',
  suggestions: 'Suggest',
};

/* Wider wave: viewBox 1200x180 fills container edge-to-edge */
const ST: { x: number; y: number }[] = [
  { x: 60, y: 130 },
  { x: 270, y: 40 },
  { x: 480, y: 130 },
  { x: 690, y: 40 },
  { x: 900, y: 130 },
  { x: 1110, y: 40 },
];

const SEGS = [
  'M 60 130 C 165 130, 165 40, 270 40',
  'M 270 40 C 375 40, 375 130, 480 130',
  'M 480 130 C 585 130, 585 40, 690 40',
  'M 690 40 C 795 40, 795 130, 900 130',
  'M 900 130 C 1005 130, 1005 40, 1110 40',
];
const FULL =
  'M 60 130 C 165 130, 165 40, 270 40 C 375 40, 375 130, 480 130 C 585 130, 585 40, 690 40 C 795 40, 795 130, 900 130 C 1005 130, 1005 40, 1110 40';

export function JourneyMap({ currentStep, completedSteps, onStepClick }: JourneyMapProps) {
  const ci = PIPELINE_STEPS.findIndex((s) => s.id === currentStep);

  const { pp, fs } = useMemo(() => {
    const d: string[] = [];
    for (let i = 0; i < ci && i < SEGS.length; i++) d.push(SEGS[i]);
    const pPath = d.length > 0 ? d.map((s, i) => (i === 0 ? s : s.replace(/^M \d+ \d+ /, ''))).join(' ') : '';
    const future: { d: string; color: string; op: number }[] = [];
    for (let i = ci; i < SEGS.length; i++) {
      const step = PIPELINE_STEPS[i + 1];
      if (step)
        future.push({ d: SEGS[i], color: COLORS[step.id], op: Math.max(0.04, 0.16 - (i - ci) * 0.03) });
    }
    return { pp: pPath, fs: future };
  }, [ci]);

  return (
    <div style={{ padding: '12px 16px 6px', position: 'relative' }}>
      <svg
        width="100%"
        height="180"
        viewBox="0 0 1200 180"
        style={{ display: 'block' }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="jgl">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="jgl2">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="jgl3">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <linearGradient id="jpg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#00D97E" />
          </linearGradient>
          <radialGradient id="jdot">
            <stop offset="0%" stopColor="#00FF94" />
            <stop offset="100%" stopColor="#00FF94" stopOpacity="0" />
          </radialGradient>
          {/* Vertical beam gradient */}
          <linearGradient id="jbeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D97E" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#00D97E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="jbeam-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D97E" stopOpacity="0" />
            <stop offset="100%" stopColor="#00D97E" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* ★ Twinkling background stars */}
        {[
          [80, 20],
          [180, 155],
          [320, 12],
          [440, 160],
          [560, 18],
          [650, 150],
          [780, 25],
          [890, 155],
          [1020, 15],
          [1140, 158],
          [150, 85],
          [400, 90],
          [700, 88],
          [950, 82],
          [250, 45],
          [500, 130],
          [850, 55],
          [1080, 110],
        ].map(([x, y], i) => (
          <circle key={`star-${i}`} cx={x} cy={y} r="1" fill="#E8F0EC">
            <animate
              attributeName="opacity"
              values={`${0.05 + (i % 3) * 0.04};${0.15 + (i % 4) * 0.05};${0.05 + (i % 3) * 0.04}`}
              dur={`${2 + (i % 5) * 0.7}s`}
              repeatCount="indefinite"
              begin={`-${i * 0.4}s`}
            />
          </circle>
        ))}

        {/* ★ Aurora glow behind completed path */}
        {pp && (
          <path
            d={pp}
            fill="none"
            stroke="#00D97E"
            strokeWidth="30"
            strokeLinecap="round"
            opacity="0.04"
            filter="url(#jgl3)"
          >
            <animate attributeName="opacity" values="0.03;0.06;0.03" dur="4s" repeatCount="indefinite" />
          </path>
        )}

        {/* ★ Vertical light beams from active station */}
        {(() => {
          const ap = ST[ci];
          return (
            <>
              <rect x={ap.x - 15} y="0" width="30" height={ap.y} fill="url(#jbeam)" opacity="0.6">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect
                x={ap.x - 15}
                y={ap.y}
                width="30"
                height={180 - ap.y}
                fill="url(#jbeam-down)"
                opacity="0.6"
              >
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
              </rect>
            </>
          );
        })()}

        {/* ★ Soft glow halos behind done stations */}
        {PIPELINE_STEPS.map((step, i) => {
          if (!completedSteps.includes(step.id)) return null;
          const p = ST[i];
          return (
            <circle
              key={`halo-${i}`}
              cx={p.x}
              cy={p.y}
              r="35"
              fill="#10B981"
              opacity="0.03"
              filter="url(#jgl3)"
            >
              <animate
                attributeName="r"
                values="30;40;30"
                dur="4s"
                repeatCount="indefinite"
                begin={`-${i}s`}
              />
            </circle>
          );
        })}

        {/* Background track */}
        <path d={FULL} fill="none" stroke="#162019" strokeWidth="5" strokeLinecap="round" />

        {/* Progress fill — glowing */}
        {pp && (
          <>
            {/* Wide soft shadow path */}
            <path
              d={pp}
              fill="none"
              stroke="#00D97E"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.06"
              filter="url(#jgl)"
            />
            {/* Main glow path */}
            <path
              d={pp}
              fill="none"
              stroke="url(#jpg)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#jgl)"
            />
            {/* Animated flow dashes */}
            <path
              d={pp}
              fill="none"
              stroke="#00FF94"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="8 10"
              opacity="0.35"
              style={{ animation: 'jd 0.8s linear infinite' }}
            />
            {/* ★ Traveling energy dot with comet glow */}
            <circle r="8" fill="url(#jdot)" opacity="0.5">
              <animateMotion dur="3s" repeatCount="indefinite" path={pp} />
            </circle>
            <circle r="5" fill="#00FF94" filter="url(#jgl2)">
              <animateMotion dur="3s" repeatCount="indefinite" path={pp} />
              <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Trailing dot */}
            <circle r="3" fill="#00FF94" opacity="0.4">
              <animateMotion dur="3s" repeatCount="indefinite" path={pp} begin="-1.5s" />
              <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* ★ Third micro dot for depth */}
            <circle r="2" fill="#00FF94" opacity="0.2">
              <animateMotion dur="3s" repeatCount="indefinite" path={pp} begin="-0.8s" />
            </circle>
          </>
        )}

        {/* Future path hints — with marching dashes animation */}
        {fs.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeDasharray="5 7"
            opacity={s.op}
            style={{ animation: `jd ${3 + i}s linear infinite reverse` }}
          />
        ))}

        {/* Station nodes */}
        {PIPELINE_STEPS.map((step, i) => {
          const p = ST[i];
          const c = COLORS[step.id];
          const done = completedSteps.includes(step.id);
          const active = currentStep === step.id;
          const fop = Math.max(0.18, 0.6 - (i - ci) * 0.1);
          const labelY = p.y > 90 ? p.y + 38 : p.y - 22;

          return (
            <g key={step.id} onClick={() => onStepClick(step.id)} style={{ cursor: 'pointer' }}>
              {done && (
                <>
                  {/* ★ Subtle ring pulse on done stations */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="22"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1"
                    opacity="0.15"
                  >
                    <animate attributeName="r" values="22;30;22" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.15;0;0.15" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={p.x} cy={p.y} r="22" fill="#0A0F0D" stroke="#10B981" strokeWidth="3.5" />
                  <circle cx={p.x} cy={p.y} r="12" fill="#10B981" />
                  <polyline
                    points={`${p.x - 6},${p.y} ${p.x - 1},${p.y + 5} ${p.x + 7},${p.y - 4}`}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
              {active && (
                <>
                  {/* ★ Expanding ring 1 */}
                  <circle cx={p.x} cy={p.y} fill="none" stroke={c} strokeWidth="1.5" opacity="0">
                    <animate attributeName="r" values="20;38" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  {/* ★ Expanding ring 2 (offset) */}
                  <circle cx={p.x} cy={p.y} fill="none" stroke={c} strokeWidth="1" opacity="0">
                    <animate
                      attributeName="r"
                      values="20;42"
                      dur="2.5s"
                      repeatCount="indefinite"
                      begin="-1.25s"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.15;0"
                      dur="2.5s"
                      repeatCount="indefinite"
                      begin="-1.25s"
                    />
                  </circle>
                  {/* Outer glow ring */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="28"
                    fill={`${c}08`}
                    stroke={c}
                    strokeWidth="4"
                    filter="url(#jgl)"
                    style={{ animation: 'jg 3s ease infinite' }}
                  />
                  {/* Inner filled */}
                  <circle cx={p.x} cy={p.y} r="17" fill={`${c}20`} stroke={`${c}40`} strokeWidth="1.5" />
                  <text
                    x={p.x}
                    y={p.y + 6}
                    textAnchor="middle"
                    fill={c}
                    fontSize="17"
                    fontWeight="800"
                    fontFamily="Inter,system-ui,sans-serif"
                  >
                    {step.num}
                  </text>
                  {/* ★ Orbiting sparkle dots */}
                  <circle r="2.5" fill={c} opacity="0.6">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      path={`M ${p.x} ${p.y - 32} A 32 32 0 1 1 ${p.x - 0.01} ${p.y - 32}`}
                    />
                  </circle>
                  <circle r="1.5" fill={c} opacity="0.35">
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      begin="-2s"
                      path={`M ${p.x} ${p.y - 32} A 32 32 0 1 1 ${p.x - 0.01} ${p.y - 32}`}
                    />
                  </circle>
                  {/* Pulse */}
                  <circle cx={p.x} cy={p.y} fill={c} opacity="0.35">
                    <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
                    <animate
                      attributeName="opacity"
                      values="0.35;0.08;0.35"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}
              {!done && !active && (
                <>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="19"
                    fill="#0A0F0D"
                    stroke={c}
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    opacity={fop}
                    style={{ animation: `jd ${4 + i}s linear infinite` }}
                  />
                  <text
                    x={p.x}
                    y={p.y + 5}
                    textAnchor="middle"
                    fill={c}
                    fontSize="14"
                    fontWeight="700"
                    opacity={fop}
                    fontFamily="Inter,system-ui,sans-serif"
                  >
                    {step.num}
                  </text>
                </>
              )}

              {/* Label */}
              <text
                x={p.x}
                y={labelY}
                textAnchor="middle"
                fill={done ? '#10B981' : c}
                opacity={done || active ? 1 : fop}
                fontSize={active ? 14 : 12}
                fontWeight={active ? 700 : 600}
                fontFamily="Inter,system-ui,sans-serif"
              >
                {SHORT[step.id]}
              </text>

              {/* "skip to" hint for future steps */}
              {!done && !active && i > ci && (
                <text
                  x={p.x}
                  y={labelY + 14}
                  textAnchor="middle"
                  fill={c}
                  opacity={fop * 0.6}
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="Inter,system-ui,sans-serif"
                >
                  skip to →
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
