import { Smile, MessageSquareReply, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useNpsAnalytics } from '../../../api/crm.queries';
import type { NpsAnalyticsDto } from '../../../types/crm-analytics.types';
import { CrmNpsClassification } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToNps } from '@/shared/lib';
import { KpiCard, ChartCard, DonutChart, LineChart, type DonutDatum, type LinePoint, formatCount, formatPercent } from '..';

/** Net promoter score — split, response rate, and monthly trend. */
export function NpsWidget() {
  const drill = useDrillNavigate();
  const { data: raw, isLoading } = useNpsAnalytics();
  const data = raw as unknown as NpsAnalyticsDto | undefined;

  const split: DonutDatum[] = [
    { label: 'Promoters', value: data?.promoters ?? 0, color: '#00D97E' },
    { label: 'Passives', value: data?.passives ?? 0, color: '#F59E0B' },
    { label: 'Detractors', value: data?.detractors ?? 0, color: '#F43F5E' },
  ];

  const trend: LinePoint[] = (data?.monthlyTrend ?? []).map((m) => ({ label: m.monthLabel, value: m.npsScore }));

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Net promoter score</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="NPS" value={data ? Math.round(data.npsScore).toString() : '—'} hint="promoters − detractors" icon={Smile} isLoading={isLoading} onClick={() => drill(drillToNps())} />
        <KpiCard label="Response rate" value={data ? formatPercent(data.responseRate) : '—'} hint={data ? `${data.totalResponded}/${data.totalSent} answered` : undefined} icon={MessageSquareReply} accent="info" isLoading={isLoading} onClick={() => drill(drillToNps())} />
        <KpiCard label="Promoters" value={data ? formatCount(data.promoters) : '—'} hint={data ? formatPercent(data.promoterPct) : undefined} icon={ThumbsUp} accent="success" isLoading={isLoading} onClick={() => drill(drillToNps({ classification: CrmNpsClassification.Promoter }))} />
        <KpiCard label="Passives" value={data ? formatCount(data.passives) : '—'} hint={data ? formatPercent(data.passivePct) : undefined} icon={Minus} accent="warning" isLoading={isLoading} onClick={() => drill(drillToNps({ classification: CrmNpsClassification.Passive }))} />
        <KpiCard label="Detractors" value={data ? formatCount(data.detractors) : '—'} hint={data ? formatPercent(data.detractorPct) : undefined} icon={ThumbsDown} accent="danger" isLoading={isLoading} onClick={() => drill(drillToNps({ classification: CrmNpsClassification.Detractor }))} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Sentiment split" subtitle="responded surveys" isLoading={isLoading} isEmpty={!data || data.totalResponded === 0}>
          <DonutChart
            data={split}
            centerValue={data ? Math.round(data.npsScore).toString() : '0'}
            centerLabel="NPS"
            formatValue={formatCount}
            onCenterSelect={() => drill(drillToNps())}
            onSelect={(_d, i) =>
              drill(
                drillToNps({
                  classification: [
                    CrmNpsClassification.Promoter,
                    CrmNpsClassification.Passive,
                    CrmNpsClassification.Detractor,
                  ][i],
                }),
              )
            }
          />
        </ChartCard>
        <ChartCard title="NPS trend" subtitle="by month · above 0 = net-positive loyalty" isLoading={isLoading} isEmpty={!trend.length}>
          <LineChart
            data={trend}
            area
            showXAxis
            xTickFormatter={(label) => label.split(' ')[0]}
            showYAxis
            showDots
            showZero
            xAxisLabel="Month"
            yAxisLabel="NPS"
            height={260}
            formatValue={(v) => Math.round(v).toString()}
          />
        </ChartCard>
      </div>
    </section>
  );
}
