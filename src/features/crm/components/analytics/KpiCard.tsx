import type { ElementType } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

/**
 * A KPI delta. `tone` (good/bad/neutral) is decoupled from `direction`
 * (up/down/flat) on purpose — rising churn is up + bad. Omit the delta entirely
 * when the endpoint has no comparison field; never fabricate one.
 */
export interface KpiDelta {
  text: string;
  direction: 'up' | 'down' | 'flat';
  tone: 'good' | 'bad' | 'neutral';
}

/**
 * Semantic accent for the tile — colors the icon square and (for alert tones)
 * the value, so meaning reads at a glance: risk/overdue = danger, at-risk/
 * pending = warning, done/collected = success, informational = info. Defaults
 * to `brand` (the neutral green). Follows the "color = meaning" rule in CLAUDE.md.
 */
export type KpiAccent = 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface KpiCardProps {
  label: string;
  /** Pre-formatted display string (e.g. "38%", "$82k"). */
  value: string;
  hint?: string;
  delta?: KpiDelta;
  icon?: ElementType;
  accent?: KpiAccent;
  isLoading?: boolean;
  /** When set, the tile drills into the underlying record list. */
  onClick?: () => void;
}

/**
 * Per-accent classes for the icon square, icon glyph, and value. Alert tones
 * (danger/warning) tint the number so it pops; calmer tones keep the bold white
 * value and let the icon square carry the color.
 */
const ACCENT_CLASS: Record<KpiAccent, { square: string; icon: string; value: string }> = {
  brand: { square: 'bg-brand-soft border-border-glow', icon: 'text-brand', value: 'text-text-primary' },
  success: { square: 'bg-success-soft border-border-success', icon: 'text-success', value: 'text-text-primary' },
  info: { square: 'bg-info-soft border-info/25', icon: 'text-info', value: 'text-text-primary' },
  warning: { square: 'bg-warning-soft border-warning/25', icon: 'text-warning', value: 'text-warning' },
  danger: { square: 'bg-danger-soft border-danger/25', icon: 'text-danger', value: 'text-danger' },
};

const DIRECTION_ICON: Record<KpiDelta['direction'], ElementType> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const TONE_CLASS: Record<KpiDelta['tone'], string> = {
  good: 'bg-success-soft text-success border-border-success',
  bad: 'bg-danger-soft text-danger border-border-subtle',
  neutral: 'bg-glass-2 text-text-muted border-border-subtle',
};

/** Self-contained stat tile. Never shows an empty state — 0 is valid data. */
export function KpiCard({ label, value, hint, delta, icon: Icon, accent = 'brand', isLoading, onClick }: KpiCardProps) {
  const DeltaIcon = delta ? DIRECTION_ICON[delta.direction] : null;
  const tone = ACCENT_CLASS[accent];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 transition-all hover:border-border-medium ${
        onClick ? 'cursor-pointer hover:bg-glass-2 hover:border-border-glow' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <div className={`w-7 h-7 rounded-sm border-thin flex items-center justify-center shrink-0 ${tone.square}`}>
            <Icon className={`w-3.5 h-3.5 ${tone.icon}`} strokeWidth={1.6} />
          </div>
        )}
        <span className="text-2xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-text-muted" strokeWidth={1.6} />
      ) : (
        <div className={`text-2xl font-extrabold tabular-nums ${tone.value}`}>{value}</div>
      )}

      <div className="mt-1 flex items-center gap-2">
        {delta && DeltaIcon && (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-xs border-thin text-2xs font-bold ${TONE_CLASS[delta.tone]}`}>
            <DeltaIcon className="w-3 h-3" strokeWidth={2.2} />
            {delta.text}
          </span>
        )}
        {hint && <span className="text-2xs text-text-muted">{hint}</span>}
      </div>
    </div>
  );
}
