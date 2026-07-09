import { Zap, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { useDealStatsAnalytics } from '../../../api/crm.queries';
import { type DealStatsDto, CrmDealStatus } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToDeals } from '@/shared/lib';
import { KpiCard, formatCount, formatCurrency, formatPercent } from '..';

/** KPI family — one endpoint powers several tiles. No empty state (0 is valid). */
export function DealStatsWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading } = useDealStatsAnalytics();
  const stats = data as unknown as DealStatsDto | undefined;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Deals</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Open" value={stats ? formatCount(stats.openCount) : '—'} icon={Zap} isLoading={isLoading} onClick={() => drill(drillToDeals({ status: CrmDealStatus.Open }))} />
        <KpiCard label="Win rate" value={stats ? formatPercent(stats.winRate) : '—'} icon={BarChart3} accent="success" isLoading={isLoading} onClick={() => drill(drillToDeals({ status: CrmDealStatus.ClosedWon }))} />
        <KpiCard
          label="Pipeline"
          value={stats ? formatCurrency(stats.totalPipelineValue) : '—'}
          hint={stats ? `Avg ${formatCurrency(stats.avgDealSize)}` : undefined}
          icon={DollarSign}
          isLoading={isLoading}
          onClick={() => drill(drillToDeals({ status: CrmDealStatus.Open }))}
        />
        <KpiCard
          label="Closing this month"
          value={stats ? formatCount(stats.closingThisMonthCount) : '—'}
          hint={stats ? formatCurrency(stats.closingThisMonthValue) : undefined}
          icon={TrendingUp}
          accent="info"
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
