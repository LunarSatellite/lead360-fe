import { useId } from 'react';
import {
  Bar,
  BarChart as RBarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartColors } from './chart-tokens';
import { ChartTooltip } from './ChartTooltip';

export interface BarDatum {
  label: string;
  value: number;
  /** Optional per-bar color (defaults to the gradient accent). */
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  formatValue?: (v: number) => string;
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  /** When set, clicking a bar drills into the records behind it. */
  onSelect?: (datum: BarDatum, index: number) => void;
}

/**
 * Vertical bars in the editorial style: value printed above each bar, italic
 * category label below, soft vertical gradient with rounded tops, and the
 * tallest bar brightened. No grid/axes — values are always visible.
 */
export function BarChart({ data, formatValue, orientation = 'vertical', height = 220, onSelect }: BarChartProps) {
  // Gradient ids MUST be unique per instance — many BarCharts share one page, and
  // duplicate SVG ids make `url(#id)` resolve to the wrong (or an empty) gradient.
  const uid = useId().replace(/:/g, '');
  const gradientId = `crm-bar-fill-${uid}`;
  const gradientMaxId = `crm-bar-fill-max-${uid}`;

  if (orientation === 'horizontal') return <HorizontalBars data={data} formatValue={formatValue} height={height} onSelect={onSelect} />;

  const max = Math.max(...data.map((d) => d.value), 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.brandLight} stopOpacity={0.95} />
            <stop offset="100%" stopColor={chartColors.brand} stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id={gradientMaxId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.brandLight} stopOpacity={1} />
            <stop offset="100%" stopColor={chartColors.brand} stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fill: chartColors.axis, fontSize: 11, fontStyle: 'italic' }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis hide domain={[0, max * 1.2 || 1]} />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
          className={onSelect ? 'cursor-pointer' : undefined}
          onClick={onSelect ? (_: unknown, index: number) => onSelect(data[index], index) : undefined}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? `url(#${d.value === max ? gradientMaxId : gradientId})`} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            offset={8}
            formatter={(v: number) => (formatValue ? formatValue(v) : v.toLocaleString('en-US'))}
            style={{ fill: chartColors.textSecondary, fontSize: 11, fontWeight: 700 }}
          />
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}

/** Simpler horizontal variant (kept for category lists). */
function HorizontalBars({
  data,
  formatValue,
  height,
  onSelect,
}: {
  data: BarDatum[];
  formatValue?: (v: number) => string;
  height: number;
  onSelect?: (datum: BarDatum, index: number) => void;
}) {
  const gradientId = `crm-bar-fill-h-${useId().replace(/:/g, '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={chartColors.brand} stopOpacity={0.55} />
            <stop offset="100%" stopColor={chartColors.brandLight} stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: chartColors.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={88}
        />
        <Tooltip cursor={{ fill: '#1C3328' }} content={<ChartTooltip formatValue={formatValue} />} />
        <Bar
          dataKey="value"
          radius={[0, 6, 6, 0]}
          maxBarSize={32}
          className={onSelect ? 'cursor-pointer' : undefined}
          onClick={onSelect ? (_: unknown, index: number) => onSelect(data[index], index) : undefined}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? `url(#${gradientId})`} />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
