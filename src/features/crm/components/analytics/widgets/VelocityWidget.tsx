import { Timer } from 'lucide-react';
import { useVelocityAnalytics } from '../../../api/crm.queries';
import { type VelocityAnalyticsDto, CrmDealStatus } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToDeals } from '@/shared/lib';
import { KpiCard, ChartCard, BarChart, type BarDatum } from '..';

/** KPI family — durations in days. */
export function VelocityWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading } = useVelocityAnalytics();
  const v = data as unknown as VelocityAnalyticsDto | undefined;
  const days = (n: number) => `${n.toFixed(1)}d`;

  // Per-stage avg dwell time for open deals, kept in the backend's stage order.
  const byStage: BarDatum[] = (v?.byStage ?? []).map((s) => ({ label: s.stageName, value: s.avgDaysInStage }));

  // slowest/fastestStage are stage *names*; resolve back to an id so the label can drill.
  const stageIdByName = (name: string | null) => v?.byStage.find((s) => s.stageName === name)?.stageId;
  const goToStage = (name: string | null) => {
    const id = stageIdByName(name);
    if (id) drill(drillToDeals({ stageId: id, status: CrmDealStatus.Open }));
  };

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Deal velocity</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Avg days to close" value={v ? days(v.avgDaysToClose) : '—'} icon={Timer} isLoading={isLoading} />
        <KpiCard label="Median days to close" value={v ? days(v.medianDaysToClose) : '—'} icon={Timer} isLoading={isLoading} />
        <KpiCard label="Avg open deal age" value={v ? days(v.avgOpenDealAge) : '—'} icon={Timer} isLoading={isLoading} onClick={() => drill(drillToDeals({ status: CrmDealStatus.Open }))} />
      </div>

      <ChartCard
        title="Avg days in stage"
        subtitle="how long open deals sit in each stage · click a stage to list its deals"
        badge="BAR"
        isLoading={isLoading}
        isEmpty={!byStage.some((d) => d.value > 0)}
        emptyMessage="No open deals to measure."
      >
        <BarChart
          data={byStage}
          formatValue={days}
          onSelect={(_d, i) => {
            const stageId = v?.byStage[i]?.stageId;
            if (stageId) drill(drillToDeals({ stageId, status: CrmDealStatus.Open }));
          }}
        />
      </ChartCard>

      {v?.slowestStage && (
        <p className="text-xs text-text-muted">
          Slowest stage:{' '}
          <button onClick={() => goToStage(v.slowestStage)} className="font-bold text-danger hover:underline" title={`List open ${v.slowestStage} deals`}>
            {v.slowestStage}
          </button>
          {v.fastestStage && (
            <>
              {' · '}Fastest:{' '}
              <button onClick={() => goToStage(v.fastestStage)} className="font-bold text-success hover:underline" title={`List open ${v.fastestStage} deals`}>
                {v.fastestStage}
              </button>
            </>
          )}
        </p>
      )}
    </section>
  );
}
