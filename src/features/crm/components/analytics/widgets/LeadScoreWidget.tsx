import { Gauge, ArrowUpDown } from 'lucide-react';
import { useLeadScoreAnalytics } from '../../../api/crm.queries';
import type { LeadScoreAnalyticsDto } from '../../../types/crm-analytics.types';
import { KpiCard, ChartCard, LineChart, type LinePoint, formatCount } from '..';

/**
 * Lead score TREND — the new capability the funnel report lacks.
 * The score-band distribution already lives in LeadFunnelWidget, so it's not
 * duplicated here; this widget owns the monthly momentum from score history.
 */
export function LeadScoreWidget() {
  const { data: raw, isLoading } = useLeadScoreAnalytics();
  const data = raw as unknown as LeadScoreAnalyticsDto | undefined;

  // Momentum = net score change per month (new − previous). Crosses zero:
  // above = leads warming, below = cooling. (avgScore is the level, shown in the KPI.)
  const trend: LinePoint[] = (data?.monthlyTrend ?? []).map((m) => ({ label: m.monthLabel, value: m.avgChange }));
  const fmtDelta = (v: number) => {
    const r = Math.round(v);
    return `${r > 0 ? '+' : ''}${r}`;
  };

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Lead score trend</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Avg score" value={data ? Math.round(data.currentAvgScore).toString() : '—'} hint="current" icon={Gauge} isLoading={isLoading} />
        <KpiCard label="Score changes" value={data ? formatCount(data.totalScoreChanges) : '—'} hint="in window" icon={ArrowUpDown} accent="info" isLoading={isLoading} />
      </div>
      <ChartCard title="Score momentum" subtitle="net score change by month · above 0 = warming, below = cooling" isLoading={isLoading} isEmpty={!trend.length} emptyMessage="No score history yet.">
        <LineChart data={trend} area showXAxis showYAxis showDots showZero formatValue={fmtDelta} />
      </ChartCard>
    </section>
  );
}
