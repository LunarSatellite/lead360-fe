import type { TooltipProps } from 'recharts';

/**
 * Shared Recharts tooltip styled with design tokens. A line/bar chart without a
 * tooltip is unreadable, so Bar/Line always wire this in.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: TooltipProps<number, string> & { formatValue?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const value = typeof point.value === 'number' ? point.value : Number(point.value ?? 0);
  // Optional secondary line carried on the data point (LinePoint.note).
  const note = (point.payload as { note?: string } | undefined)?.note;

  return (
    <div className="rounded-sm border-thin border-border-medium bg-bg-elevated px-2.5 py-1.5 shadow-none">
      {label != null && (
        <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      )}
      <p className="text-sm font-extrabold text-text-primary tabular-nums">
        {formatValue ? formatValue(value) : value.toLocaleString('en-US')}
      </p>
      {note && <p className="text-2xs text-text-muted">{note}</p>}
    </div>
  );
}
