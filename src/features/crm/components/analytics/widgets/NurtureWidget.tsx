import { Users, Activity, Zap, BarChart3, TrendingUp, Target, UserX } from 'lucide-react';
import { useNurtureAnalytics } from '../../../api/crm.queries';
import type { NurtureAnalyticsDto, NurtureSequenceStatsDto } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToLeads } from '@/shared/lib';
import { ChartCard, DataTable, KpiCard, formatCount, formatPercent, type Column } from '..';

const COLUMNS: Column<NurtureSequenceStatsDto>[] = [
  { header: 'Sequence', accessor: 'sequenceName' },
  { header: 'Enrolled', accessor: 'enrollments', align: 'right', sortable: true, format: (v) => formatCount(Number(v)) },
  { header: 'Sent', accessor: 'messagesSent', align: 'right', sortable: true, format: (v) => formatCount(Number(v)) },
  { header: 'Replies', accessor: 'replies', align: 'right', sortable: true, format: (v) => formatCount(Number(v)) },
  { header: 'Response %', accessor: 'responseRatePercent', align: 'right', sortable: true, format: (v) => formatPercent(Number(v)) },
  { header: 'Converted', accessor: 'conversions', align: 'right', sortable: true, format: (v) => formatCount(Number(v)) },
  { header: 'Conv %', accessor: 'conversionRatePercent', align: 'right', sortable: true, format: (v) => formatPercent(Number(v)) },
];

/** KPI tiles + TABLE per sequence. */
export function NurtureWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading, isError, error, refetch } = useNurtureAnalytics();
  const nurture = data as unknown as NurtureAnalyticsDto | undefined;
  const sequences = nurture?.bySequence ?? [];

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Nurture performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total enrolled" value={nurture ? formatCount(nurture.totalEnrollments) : '—'} icon={Users} isLoading={isLoading} onClick={() => drill(drillToLeads({ inNurture: true }))} />
        <KpiCard label="Active" value={nurture ? formatCount(nurture.activeEnrollments) : '—'} hint={nurture ? `${formatCount(nurture.completedEnrollments)} completed · ${formatCount(nurture.cancelledEnrollments)} cancelled` : undefined} icon={Activity} isLoading={isLoading} onClick={() => drill(drillToLeads({ inNurture: true }))} />
        <KpiCard label="Messages sent" value={nurture ? formatCount(nurture.messagesSent) : '—'} hint={nurture ? `${formatCount(nurture.customerReplies)} replies` : undefined} icon={Zap} accent="info" isLoading={isLoading} />
        <KpiCard label="Response rate" value={nurture ? formatPercent(nurture.responseRatePercent) : '—'} icon={BarChart3} accent="info" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Converted from nurture" value={nurture ? formatCount(nurture.convertedFromNurture) : '—'} icon={TrendingUp} accent="success" isLoading={isLoading} />
        <KpiCard label="Conversion rate" value={nurture ? formatPercent(nurture.conversionRatePercent) : '—'} icon={Target} accent="success" isLoading={isLoading} />
        <KpiCard label="Exhausted → lost" value={nurture ? formatCount(nurture.exhaustedAsLost) : '—'} icon={UserX} accent="danger" isLoading={isLoading} />
      </div>

      <ChartCard
        title="Per sequence"
        badge="TABLE"
        minBodyHeight={120}
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={sequences.length === 0}
        emptyMessage="No nurture sequences yet."
        onRetry={refetch}
      >
        <DataTable columns={COLUMNS} rows={sequences} rowKey={(s) => s.sequenceId} />
      </ChartCard>
    </section>
  );
}
