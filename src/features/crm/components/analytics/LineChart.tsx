import { useId, type ComponentProps, type ReactElement } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartColors } from './chart-tokens';
import { ChartTooltip } from './ChartTooltip';

export interface LinePoint {
  label: string;
  value: number;
  /** Optional secondary line shown in the hover tooltip (e.g. "7 deals won"). */
  note?: string;
}

interface LineChartProps {
  /** Already in chronological order — never re-sort a time series. */
  data: LinePoint[];
  color?: string;
  formatValue?: (v: number) => string;
  area?: boolean;
  height?: number;
  /** Show category labels along the X axis. */
  showXAxis?: boolean;
  /** Shorten each X-axis tick label (e.g. "Jun 2026" → "Jun"). Tooltip keeps the full label. */
  xTickFormatter?: (label: string) => string;
  /** Show a Y-axis scale + faint horizontal gridlines. */
  showYAxis?: boolean;
  /** Render a dot on every point. */
  showDots?: boolean;
  /** Highlight the peak point with a ring marker + value callout card. */
  markPeak?: boolean;
  /** Format for the peak callout value (defaults to `formatValue`). */
  markPeakFormat?: (v: number) => string;
  /** Draw a dashed reference line at the mean. */
  showAverage?: boolean;
  /** Draw a solid reference line at zero (for signed series like momentum). */
  showZero?: boolean;
  /** Axis title under the X axis (e.g. "Month"). Only shown when showXAxis is on. */
  xAxisLabel?: string;
  /** Rotated axis title beside the Y axis (e.g. "Won ($)"). Only shown when showYAxis is on. */
  yAxisLabel?: string;
}

/** Evenly-spaced "nice" axis ticks (0, 40k, 80k, 120k…) covering `max`. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const steps = [1, 2, 2.5, 4, 5, 7.5, 10];
  const rawStep = max / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep = (steps.find((s) => s >= rawStep / mag) ?? 10) * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + niceStep * 0.001; v += niceStep) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + niceStep);
  return ticks;
}

/** "Nice" ticks spanning a min..max range that may include negatives (e.g. NPS −100..100). */
function niceTicksSpan(min: number, max: number, count = 4): number[] {
  const range = max - min || 1;
  const steps = [1, 2, 2.5, 4, 5, 7.5, 10];
  const rawStep = range / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep = (steps.find((s) => s >= rawStep / mag) ?? 10) * mag;
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.001; v += niceStep) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

interface DotRenderProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: LinePoint;
}

/** Bright hollow ring + dark callout card anchored on the peak point (matches the mockup). */
function PeakMarker({ cx, cy, label, value }: { cx: number; cy: number; label: string; value: string }) {
  const W = 128;
  const H = 54;
  const left = cx > 160 ? cx - W - 16 : cx + 16;
  const top = Math.max(cy - 10, 2);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <g transform={`translate(${left}, ${top})`}>
        <rect width={W} height={H} rx={10} fill={chartColors.bgElevated} stroke={chartColors.borderMedium} strokeWidth={0.5} />
        <text x={14} y={22} fill={chartColors.textMuted} fontSize={11} fontWeight={700} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </text>
        <text x={14} y={43} fill={chartColors.textPrimary} fontSize={19} fontWeight={800}>
          {value}
        </text>
      </g>
      {/* halo + bright hollow ring, drawn last so it sits above the card edge */}
      <circle cx={cx} cy={cy} r={12} fill="none" stroke={chartColors.brandLight} strokeOpacity={0.2} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={7} fill={chartColors.bgCard} stroke={chartColors.brandLight} strokeWidth={3} />
    </g>
  );
}

/**
 * Single time series from `{label, value}[]`. Minimal by default; the `show*` /
 * `mark*` flags layer on a Y scale, gridlines, point dots, an average line, and
 * a peak ring + callout for a richer trend view. Data must already be
 * chronological; never re-sort.
 */
export function LineChart({
  data,
  color = chartColors.brand,
  formatValue,
  area = true,
  height = 220,
  showXAxis = false,
  xTickFormatter,
  showYAxis = false,
  showDots = false,
  markPeak = false,
  markPeakFormat,
  showAverage = false,
  showZero = false,
  xAxisLabel,
  yAxisLabel,
}: LineChartProps) {
  // Unique per instance — multiple area charts on one page would otherwise share
  // `id="crm-line-area-fill"`, and `url(#id)` resolves to the first match in the DOM.
  const gradientId = `crm-line-area-fill-${useId().replace(/:/g, '')}`;
  const fmt = (v: number) => (formatValue ? formatValue(v) : v.toLocaleString('en-US'));
  const fmtPeak = (v: number) => (markPeakFormat ? markPeakFormat(v) : fmt(v));

  const peakIndex = data.length ? data.reduce((best, d, i, arr) => (d.value > arr[best].value ? i : best), 0) : -1;
  const average = data.length ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0;
  const maxValue = data.length ? Math.max(...data.map((d) => d.value)) : 0;
  const minValue = data.length ? Math.min(...data.map((d) => d.value)) : 0;
  // Positive-only series keep the original 0-based ticks; negatives (e.g. NPS) span min..max.
  const yTicks = showYAxis ? (minValue < 0 ? niceTicksSpan(minValue, maxValue, 4) : niceTicks(maxValue, 4)) : undefined;
  const yMin = yTicks ? yTicks[0] : 0;
  const yMax = yTicks ? yTicks[yTicks.length - 1] : 0;

  const renderDot = (props: DotRenderProps): ReactElement => {
    const { cx, cy, index, payload } = props;
    // Recharts maps this over every point, so each returned node needs a stable key.
    const key = `dot-${index ?? 0}`;
    if (cx == null || cy == null) return <g key={key} />;
    if (markPeak && index === peakIndex && payload) {
      return <PeakMarker key={key} cx={cx} cy={cy} label={payload.label} value={fmtPeak(payload.value)} />;
    }
    if (showDots) return <circle key={key} cx={cx} cy={cy} r={2.5} fill={color} />;
    return <g key={key} />;
  };

  const dot = (markPeak || showDots ? renderDot : false) as ComponentProps<typeof Area>['dot'];
  const activeDot = { r: 5, strokeWidth: 2, stroke: chartColors.bgCard, fill: chartColors.brandLight };

  // Recharts renders its children via React.Children, which flattens ARRAYS but
  // treats a <>fragment</> as one opaque node — so axes/grid/tooltip wrapped in a
  // fragment compute their scales (findAllByType flattens) yet never render. Pass
  // an array (with keys) instead so each axis is a real, rendered child.
  const overlays = [
    showYAxis ? (
      <CartesianGrid key="grid" stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
    ) : null,
    <XAxis
      key="x"
      dataKey="label"
      hide={!showXAxis}
      tick={{ fill: chartColors.textSecondary, fontSize: 13, fontWeight: 600 }}
      tickLine={false}
      axisLine={false}
      interval={data.length <= 14 ? 0 : 'preserveStartEnd'}
      minTickGap={8}
      dy={6}
      tickFormatter={xTickFormatter ? (v) => xTickFormatter(String(v)) : undefined}
      label={
        showXAxis && xAxisLabel
          ? { value: xAxisLabel, position: 'insideBottom', offset: -6, style: { fill: chartColors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' } }
          : undefined
      }
    />,
    showYAxis ? (
      <YAxis
        key="y"
        domain={[yMin, yMax || 1]}
        ticks={yTicks}
        tick={{ fill: chartColors.textSecondary, fontSize: 12, fontWeight: 600 }}
        tickLine={false}
        axisLine={false}
        tickFormatter={fmt}
        width={yAxisLabel ? 68 : 52}
        label={
          yAxisLabel
            ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: chartColors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textAnchor: 'middle' } }
            : undefined
        }
      />
    ) : (
      <YAxis key="y" hide domain={['dataMin', 'dataMax']} />
    ),
    <Tooltip key="tip" content={<ChartTooltip formatValue={formatValue} />} />,
    showAverage && average > 0 ? (
      <ReferenceLine
        key="avg"
        y={average}
        stroke={chartColors.axis}
        strokeDasharray="4 4"
        strokeOpacity={0.5}
        label={{ value: `avg ${fmt(average)}`, position: 'insideTopRight', fill: chartColors.axis, fontSize: 10 }}
      />
    ) : null,
    showZero ? (
      <ReferenceLine key="zero" y={0} stroke={chartColors.axis} strokeOpacity={0.6} strokeWidth={1} />
    ) : null,
  ].filter(Boolean);

  const margin = { top: markPeak ? 16 : 8, right: 16, bottom: xAxisLabel ? 20 : 0, left: 8 };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {area ? (
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {overlays}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={dot} activeDot={activeDot} />
        </AreaChart>
      ) : (
        <RLineChart data={data} margin={margin}>
          {overlays}
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={dot} activeDot={activeDot} />
        </RLineChart>
      )}
    </ResponsiveContainer>
  );
}
