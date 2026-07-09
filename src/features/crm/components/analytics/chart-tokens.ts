/**
 * Chart design tokens + number formatting.
 *
 * Colors are literal hex (mirroring `tailwind.config.js`) — NOT CSS vars.
 * Recharts renders these into raw SVG presentation attributes (`stop-color`,
 * `stroke`, `fill`), and `var()` is not resolved in presentation attributes, so
 * an undefined var silently falls back to black. This project is dark-only
 * (no light mode — see CLAUDE.md), so there's no theme to follow; keep hex here
 * and keep every value in sync with the matching token in tailwind.config.js.
 */

export const chartColors = {
  brand: '#00D98A',
  brandLight: '#00FFA3',
  teal: '#00B3C8',
  violet: '#7B61FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  info: '#3B82F6',
  grid: '#14302A', // border.subtle
  axis: '#7A9B8E', // text.muted
  surface: '#1A332C', // bg.elevated
  surfaceBorder: '#1C4132', // border.medium
  // Text + surface tokens used by SVG labels/callouts (same reason: no var() in attrs).
  textPrimary: '#FFFFFF',
  textSecondary: '#B8E6D5',
  textMuted: '#7A9B8E',
  bgCard: '#132420',
  bgElevated: '#1A332C',
  borderMedium: '#1C4132',
} as const;

/**
 * Ordered palette for multi-series / donut segments. Assign a color by a stable
 * category KEY (see `colorForIndex`) — never by a shifting array position, or
 * slices change color when the data reorders.
 */
export const chartPalette: readonly string[] = [
  chartColors.brand,
  chartColors.teal,
  chartColors.violet,
  chartColors.warning,
  chartColors.info,
  chartColors.danger,
];

/** Stable color for a 0-based category index (wraps around the palette). */
export function colorForIndex(index: number): string {
  return chartPalette[index % chartPalette.length];
}

// ─── Number formatting ──────────────────────────────────────────────────────
// Plain counts → "1,240". Money → "$82k". Ratios → "38%". Durations → "4.1h".

/** "1,240" — full grouped integer for small counts. */
export function formatCount(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** "$1,240" / "$82k" / "$1.2M" — compact currency for KPI tiles + axes. */
export function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

/** "38%" / "38.5%" — `digits` decimals (default 1, trimmed when whole). */
export function formatPercent(n: number, digits = 1): string {
  const rounded = Number(n.toFixed(digits));
  return `${rounded}%`;
}

/** "4.1h" — hour durations. */
export function formatDuration(hours: number): string {
  return `${hours.toFixed(1)}h`;
}
