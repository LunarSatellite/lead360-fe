import { Users, TrendingUp, BarChart3 } from 'lucide-react';
import { useLeadFunnelAnalytics } from '../../../api/crm.queries';
import { type LeadFunnelAnalyticsDto, ChannelType, CHANNEL_LABELS, LeadStage } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToLeads } from '@/shared/lib';
import {
  ChartCard,
  KpiCard,
  BarChart,
  DonutChart,
  colorForIndex,
  formatCount,
  formatPercent,
  type BarDatum,
  type DonutDatum,
} from '..';

/**
 * Resolve the funnel's channel string back to a ChannelType for drilling. The backend
 * sends the enum NAME (Channel.ToString()), so match by name first, with the display
 * label as a fallback — avoids a silent no-op if the name and label ever diverge.
 */
const CHANNEL_BY_KEY: Record<string, ChannelType> = {
  ...Object.fromEntries(Object.entries(ChannelType).map(([name, value]) => [name.toLowerCase(), value as ChannelType])),
  ...Object.fromEntries(Object.entries(CHANNEL_LABELS).map(([value, label]) => [label.toLowerCase(), Number(value) as ChannelType])),
};

/** Per-stage bar fill: progression in brand/warm tones, Converted green, Lost muted. */
const STAGE_FILL: Record<number, string> = {
  [LeadStage.New]: '#7B61FF',
  [LeadStage.Warm]: '#F59E0B',
  [LeadStage.Hot]: '#FB7185',
  [LeadStage.Nurturing]: '#3B82F6',
  [LeadStage.Converted]: '#00D97E',
  [LeadStage.Lost]: '#6B7280',
};

/** BAR family — funnel stages as a single-accent horizontal bar. */
export function LeadFunnelWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading, isError, error, refetch } = useLeadFunnelAnalytics();
  const funnel = data as unknown as LeadFunnelAnalyticsDto | undefined;
  const isEmpty = !funnel || funnel.totalLeads === 0;

  const funnelStages = funnel?.funnel ?? [];
  // Bars are scaled to the largest stage (usually New), so the funnel reads as a taper.
  const maxStageCount = Math.max(...funnelStages.map((s) => s.count), 0);

  const scores: BarDatum[] = (funnel?.scoreDistribution ?? []).map((b) => ({ label: b.label, value: b.count }));
  const channels: DonutDatum[] = (funnel?.byChannel ?? []).map((c, i) => ({
    label: c.channel,
    value: c.count,
    color: colorForIndex(i),
  }));

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Lead funnel</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Total leads" value={funnel ? formatCount(funnel.totalLeads) : '—'} icon={Users} isLoading={isLoading} onClick={() => drill(drillToLeads())} />
        <KpiCard label="Overall conversion" value={funnel ? formatPercent(funnel.overallConversionRate) : '—'} icon={TrendingUp} accent="success" isLoading={isLoading} />
        <KpiCard label="Avg lead score" value={funnel ? Math.round(funnel.avgLeadScore).toString() : '—'} hint="out of 100" icon={BarChart3} isLoading={isLoading} />
      </div>

      <ChartCard
        title="Funnel stages"
        subtitle="stage distribution & step conversion · click a stage to list its leads"
        badge="FUNNEL"
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={isEmpty || funnelStages.length === 0}
        onRetry={refetch}
      >
        <div className="space-y-2.5">
          {funnelStages.map((s) => {
            const widthPct =
              maxStageCount > 0 ? Math.max((s.count / maxStageCount) * 100, s.count > 0 ? 4 : 0) : 0;
            // Lost isn't downstream of Converted, so the backend's conversionFromPrev for it is meaningless — hide it.
            const showConv = s.conversionFromPrev != null && s.stage !== LeadStage.Lost;
            return (
              <button
                key={s.stage}
                onClick={() => drill(drillToLeads({ stage: s.stage }))}
                className="w-full text-left group"
                title={`List ${s.stageName} leads`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                    {s.stageName}
                    {showConv && (
                      <span className="text-2xs font-medium text-text-muted">
                        {Math.round(s.conversionFromPrev!)}% from prev
                      </span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums text-text-muted">
                    {formatCount(s.count)} · {s.pctOfTotal}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-glass-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all group-hover:opacity-80"
                    style={{ width: `${widthPct}%`, backgroundColor: STAGE_FILL[s.stage] ?? '#7B61FF' }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Lead score distribution" badge="BAR" isLoading={isLoading} isError={isError} error={error} isEmpty={isEmpty || scores.length === 0} onRetry={refetch}>
          <BarChart
            data={scores}
            formatValue={formatCount}
            onSelect={(_, i) => drill(drillToLeads({ minScore: funnel?.scoreDistribution[i]?.min }))}
          />
        </ChartCard>
        <ChartCard
          title="Leads by channel"
          badge="DONUT"
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={isEmpty || channels.length === 0}
          onRetry={refetch}
        >
          <DonutChart
            data={channels}
            centerValue={funnel ? formatCount(funnel.totalLeads) : undefined}
            centerLabel="Leads"
            formatValue={formatCount}
            onCenterSelect={() => drill(drillToLeads())}
            onSelect={(d) => {
              const channel = CHANNEL_BY_KEY[d.label.toLowerCase()];
              if (channel) drill(drillToLeads({ channel }));
            }}
          />
        </ChartCard>
      </div>
    </section>
  );
}
