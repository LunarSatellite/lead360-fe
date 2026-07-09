import { Activity } from 'lucide-react';
import { useActivityAnalytics } from '../../../api/crm.queries';
import { type ActivityAnalyticsDto, CRM_SIGNAL_KIND_LABELS, CRM_SIGNAL_SOURCE_LABELS } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToContactDetail } from '@/shared/lib';
import { ChartCard, KpiCard, BarChart, LineChart, formatCount, type BarDatum, type LinePoint } from '..';

/** Engagement-signal pulse — KPIs, 30-day trend, kind/source breakdown, top contacts. Full-width. */
export function ActivityWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading, isError, error, refetch } = useActivityAnalytics();
  const activity = data as unknown as ActivityAnalyticsDto | undefined;
  const top = activity?.topContacts ?? [];

  const trend: LinePoint[] = (activity?.dailyTrend ?? []).map((d) => ({ label: d.dateLabel, value: d.count }));
  const byKind: BarDatum[] = (activity?.byKind ?? [])
    .slice(0, 6)
    .map((k) => ({ label: CRM_SIGNAL_KIND_LABELS[k.kind] ?? `Kind ${k.kind}`, value: k.count }));
  const bySource: BarDatum[] = (activity?.bySource ?? [])
    .slice(0, 6)
    .map((s) => ({ label: CRM_SIGNAL_SOURCE_LABELS[s.source] ?? `Source ${s.source}`, value: s.count }));

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Activity</h3>

      {/* KPIs + 30-day trend take 2/3; top engaged contacts the remaining 1/3. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Signals · 30 days" value={activity ? formatCount(activity.totalSignals30d) : '—'} icon={Activity} isLoading={isLoading} />
            <KpiCard label="Signals · 7 days" value={activity ? formatCount(activity.totalSignals7d) : '—'} icon={Activity} accent="info" isLoading={isLoading} />
          </div>
          <ChartCard
            title="Signals · 30 days"
            subtitle="daily volume"
            badge="LINE"
            isLoading={isLoading}
            isError={isError}
            error={error}
            isEmpty={!trend.some((p) => p.value > 0)}
            emptyMessage="No signals yet."
            onRetry={refetch}
          >
            <LineChart data={trend} area showXAxis showYAxis height={180} formatValue={formatCount} />
          </ChartCard>
        </div>

        <ChartCard
          title="Top engaged contacts"
          badge="LIST"
          minBodyHeight={120}
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={top.length === 0}
          emptyMessage="No engagement signals yet."
          onRetry={refetch}
        >
          <ul className="flex flex-col gap-1">
            {top.slice(0, 6).map((c) => (
              <li
                key={c.contactId}
                onClick={() => drill(drillToContactDetail(c.contactId))}
                title={`Open ${c.fullName}`}
                className="flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded-sm text-sm cursor-pointer hover:bg-glass-2 transition-colors"
              >
                <span className="min-w-0 truncate">
                  <span className="font-semibold text-text-primary truncate">{c.fullName}</span>
                  {c.email && <span className="ml-2 text-2xs text-text-muted">{c.email}</span>}
                </span>
                <span className="shrink-0 font-extrabold text-brand tabular-nums">{formatCount(c.signalCount)}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* Breakdowns split the width evenly. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="By kind" badge="BAR" minBodyHeight={100} isLoading={isLoading} isEmpty={byKind.length === 0} emptyMessage="No signals yet.">
          <BarChart data={byKind} orientation="horizontal" height={Math.max(byKind.length * 32, 80)} formatValue={formatCount} />
        </ChartCard>
        <ChartCard title="By source" badge="BAR" minBodyHeight={100} isLoading={isLoading} isEmpty={bySource.length === 0} emptyMessage="No signals yet.">
          <BarChart data={bySource} orientation="horizontal" height={Math.max(bySource.length * 32, 80)} formatValue={formatCount} />
        </ChartCard>
      </div>
    </section>
  );
}
