import { AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { useChurnRiskAnalytics } from '../../../api/crm.queries';
import type { ChurnRiskAnalyticsDto, ChurnRiskContact } from '../../../types/crm-analytics.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToContactDetail, drillToContacts } from '@/shared/lib';
import { KpiCard, ChartCard, DonutChart, DataTable, type Column, type DonutDatum, formatCount, formatPercent } from '..';

// Donut slice order → Churn30 probability range (min inclusive, max exclusive) for the drill.
const BAND_RANGES = [
  { minChurnProbability: 0.7 },                              // High (≥70%)
  { minChurnProbability: 0.4, maxChurnProbability: 0.7 },    // Medium (40–70%)
  { maxChurnProbability: 0.4 },                              // Low (<40%)
] as const;

/** Portfolio churn risk (30-day) — bands, coverage, and the top at-risk contacts. */
export function ChurnRiskWidget() {
  const drill = useDrillNavigate();
  const { data: raw, isLoading } = useChurnRiskAnalytics();
  const data = raw as unknown as ChurnRiskAnalyticsDto | undefined;
  const c = data?.churn30;

  const bands: DonutDatum[] = [
    { label: 'High (≥70%)', value: c?.highRiskCount ?? 0, color: '#F43F5E' },
    { label: 'Medium', value: c?.mediumRiskCount ?? 0, color: '#F59E0B' },
    { label: 'Low', value: c?.lowRiskCount ?? 0, color: '#00D97E' },
  ];

  const atRiskCols: Column<ChurnRiskContact>[] = [
    {
      header: 'Customer',
      accessor: 'fullName',
      render: (r) => (
        <span className="flex flex-col min-w-0">
          <span className="font-medium text-text-primary truncate">{r.fullName}</span>
          {r.email && <span className="text-2xs text-text-muted truncate">{r.email}</span>}
        </span>
      ),
    },
    { header: 'Churn', accessor: 'churnProbabilityPct', align: 'right', format: (v) => formatPercent(Number(v)) },
    { header: 'Scored', accessor: 'computedAt', align: 'right', format: (v) => new Date(String(v)).toLocaleDateString() },
  ];

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Churn risk</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="High risk" value={c ? formatCount(c.highRiskCount) : '—'} hint="≥70% — auto-nurtured" icon={AlertTriangle} accent="danger" isLoading={isLoading} onClick={() => drill(drillToContacts({ minChurnProbability: 0.7 }))} />
        <KpiCard label="Coverage" value={c ? formatPercent(c.coverage) : '—'} hint={data ? `${c?.contactsScored}/${data.totalContacts} scored` : undefined} icon={ShieldCheck} accent="success" isLoading={isLoading} />
        <KpiCard label="Avg risk" value={c ? formatPercent(c.avgChurnProbabilityPct) : '—'} hint="across scored" icon={Activity} accent="warning" isLoading={isLoading} />
        <KpiCard label="60-day high" value={data?.churn60 ? formatCount(data.churn60.highRiskCount) : '—'} hint="medium-term" icon={AlertTriangle} accent="danger" isLoading={isLoading} onClick={() => drill(drillToContacts({ minChurnProbability: 0.7, churnKind: 3 }))} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Risk bands" subtitle="30-day horizon · click a band to list those contacts" badge="AI ESTIMATE" isLoading={isLoading} isEmpty={!c || c.contactsScored === 0} emptyMessage="No contacts scored yet.">
          <DonutChart
            data={bands}
            centerValue={c ? formatCount(c.contactsScored) : '0'}
            centerLabel="scored"
            formatValue={formatCount}
            onSelect={(_d, i) => drill(drillToContacts(BAND_RANGES[i]))}
          />
        </ChartCard>
        <ChartCard title="Top at-risk" subtitle="highest churn probability" badge="AI ESTIMATE" isLoading={isLoading} isEmpty={!data?.topAtRisk.length} emptyMessage="No at-risk contacts.">
          <DataTable
            columns={atRiskCols}
            rows={(data?.topAtRisk ?? []).slice(0, 8)}
            rowKey={(r) => r.contactId}
            onRowClick={(r) => drill(drillToContactDetail(r.contactId))}
          />
        </ChartCard>
      </div>
    </section>
  );
}
