import { Cell, Pie, PieChart as RPieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { chartColors } from './chart-tokens';
import { ChartTooltip } from './ChartTooltip';

export interface DonutDatum {
  label: string;
  value: number;
  /** Color is assigned by the glue widget from a stable category key. */
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  centerValue?: string;
  centerLabel?: string;
  formatValue?: (v: number) => string;
  height?: number;
  /** When set, clicking a segment/legend row drills into the records behind it. */
  onSelect?: (datum: DonutDatum, index: number) => void;
  /** When set, clicking the center total drills into the full (unfiltered) record set. */
  onCenterSelect?: () => void;
}

/** Ring chart + legend from `{label, value, color}[]`, with an optional center total. */
export function DonutChart({ data, centerValue, centerLabel, formatValue, height = 220, onSelect, onCenterSelect }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke={chartColors.surface}
              strokeWidth={2}
              className={onSelect ? 'cursor-pointer' : undefined}
              onClick={onSelect ? (_: unknown, index: number) => onSelect(data[index], index) : undefined}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatValue={formatValue} />} />
          </RPieChart>
        </ResponsiveContainer>
        {centerValue && (
          // Overlay stays click-through so ring segments keep their clicks; only the
          // inner total bubble opts back into pointer events when it can drill.
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`flex flex-col items-center rounded-full px-3 py-2 ${
                onCenterSelect ? 'pointer-events-auto cursor-pointer hover:bg-glass-2 transition-colors' : ''
              }`}
              onClick={onCenterSelect}
              role={onCenterSelect ? 'button' : undefined}
              tabIndex={onCenterSelect ? 0 : undefined}
              aria-label={onCenterSelect && centerLabel ? `View all ${centerLabel}` : undefined}
              onKeyDown={
                onCenterSelect
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCenterSelect();
                      }
                    }
                  : undefined
              }
            >
              <span className="text-xl font-extrabold text-text-primary tabular-nums">{centerValue}</span>
              {centerLabel && (
                <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">{centerLabel}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-1.5 min-w-0">
        {data.map((d, i) => (
          <li
            key={d.label}
            onClick={onSelect ? () => onSelect(d, i) : undefined}
            className={`flex items-center justify-between gap-2 text-sm ${
              onSelect ? 'cursor-pointer rounded-sm px-1 -mx-1 hover:bg-glass-2 transition-colors' : ''
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-xs shrink-0" style={{ background: d.color }} />
              <span className="truncate text-text-secondary">{d.label}</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-text-primary tabular-nums">
                {formatValue ? formatValue(d.value) : d.value.toLocaleString('en-US')}
              </span>
              {total > 0 && (
                <span className="w-9 text-right text-2xs text-text-muted tabular-nums">
                  {Math.round((d.value / total) * 100)}%
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
