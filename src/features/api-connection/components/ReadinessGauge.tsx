interface ReadinessGaugeProps {
  score: number; // 0-100
  size?: number;
}

export function ReadinessGauge({ score, size = 120 }: ReadinessGaugeProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#F43F5E';
  const trackColor =
    score >= 80 ? 'rgba(16,185,129,0.12)' : score >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.12)';
  const label = score >= 80 ? 'Ready' : score >= 50 ? 'Needs Work' : 'Not Ready';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={8} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: size * 0.22, fontWeight: 800, color, letterSpacing: '-0.5px' }}>
            {score}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#708A7E',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            /100
          </span>
        </div>
      </div>
      <span className="mt-2" style={{ fontSize: 12, fontWeight: 700, color }}>
        {label}
      </span>
    </div>
  );
}
