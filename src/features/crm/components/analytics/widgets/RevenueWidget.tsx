import { TrendingUp, TrendingDown, DollarSign, CalendarClock } from 'lucide-react';
import { useRevenueAnalytics } from '../../../api/crm.queries';
import { type RevenueAnalyticsDto, CrmDealStatus } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToDeals } from '@/shared/lib';
import { ChartCard, KpiCard, LineChart, formatCurrency, type LinePoint } from '..';

/** LINE family — X axis is time. Keep the backend's chronological order + labels. */
export function RevenueWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading, isError, error, refetch } = useRevenueAnalytics();
  const revenue = data as unknown as RevenueAnalyticsDto | undefined;

  const trend: LinePoint[] = (revenue?.monthlyTrend ?? []).map((p) => ({
    label: p.monthLabel,
    value: Number(p.wonAmount),
    note: `${p.wonCount} ${p.wonCount === 1 ? 'deal' : 'deals'} won`,
  }));
  // Backend always returns 12 zero-filled months, so an all-zero series means no
  // won revenue yet — show the empty state rather than a flat line at zero.
  const isEmpty = trend.every((p) => p.value === 0);

  const wonThisPeriod = trend.reduce((sum, p) => sum + p.value, 0);
  const subtitle = `${formatCurrency(wonThisPeriod)} won this period · weighted forecast ${formatCurrency(revenue?.weightedForecast ?? 0)} open`;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Revenue</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Weighted forecast" value={revenue ? formatCurrency(revenue.weightedForecast) : '—'} icon={TrendingUp} isLoading={isLoading} />
        <KpiCard label="This week" value={revenue ? formatCurrency(revenue.expectedThisWeek) : '—'} icon={CalendarClock} accent="info" isLoading={isLoading} />
        <KpiCard label="This month" value={revenue ? formatCurrency(revenue.expectedThisMonth) : '—'} icon={DollarSign} isLoading={isLoading} />
        <KpiCard label="This quarter" value={revenue ? formatCurrency(revenue.expectedThisQuarter) : '—'} icon={DollarSign} isLoading={isLoading} />
        <KpiCard label="Won all time" value={revenue ? formatCurrency(revenue.totalWonAllTime) : '—'} icon={TrendingUp} accent="success" isLoading={isLoading} onClick={() => drill(drillToDeals({ status: CrmDealStatus.ClosedWon }))} />
        <KpiCard label="Lost pipeline" value={revenue ? formatCurrency(revenue.totalLostPipelineValue) : '—'} icon={TrendingDown} accent="danger" isLoading={isLoading} onClick={() => drill(drillToDeals({ status: CrmDealStatus.ClosedLost }))} />
      </div>

      <ChartCard
        title="Revenue — Won (12-month trend)"
        subtitle={subtitle}
        badge="LINE"
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={isEmpty}
        emptyMessage="No revenue yet."
        onRetry={refetch}
      >
        <LineChart
          data={trend}
          formatValue={formatCurrency}
          height={300}
          showXAxis
          xTickFormatter={(label) => label.split(' ')[0]}
          showYAxis
        />
      </ChartCard>
    </section>
  );
}
