import { Users } from 'lucide-react';
import { useContactStatsAnalytics } from '../../../api/crm.queries';
import {
  type ContactStatsDto,
  type CrmContactSourceKind,
  CRM_CONTACT_SOURCE_LABELS,
} from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToContacts } from '@/shared/lib';
import {
  ChartCard,
  KpiCard,
  DonutChart,
  chartPalette,
  formatCount,
  type DonutDatum,
  type KpiDelta,
} from '..';

/** Stable color per source kind so a slice keeps its color as data shifts. */
const SOURCE_COLOR: Record<CrmContactSourceKind, string> = {
  1: chartPalette[0],
  2: chartPalette[1],
  3: chartPalette[2],
  4: chartPalette[3],
  5: chartPalette[4],
};

function monthOverMonthDelta(current: number, previous: number): KpiDelta | undefined {
  if (previous === 0) return undefined; // no comparison basis — don't fabricate
  const pct = ((current - previous) / previous) * 100;
  const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  return { text: `${Math.abs(Math.round(pct))}% vs last mo`, direction, tone: direction === 'down' ? 'bad' : 'good' };
}

/** DONUT family — segments colored by category key, capped + grouped into "Other". */
export function ContactsWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading, isError, error, refetch } = useContactStatsAnalytics();
  const contacts = data as unknown as ContactStatsDto | undefined;
  const isEmpty = !contacts || contacts.total === 0;

  const sorted = [...(contacts?.bySource ?? [])].sort((a, b) => b.count - a.count);
  const head = sorted.slice(0, 5);
  const tail = sorted.slice(5);
  const sources: DonutDatum[] = head.map((s) => ({
    label: CRM_CONTACT_SOURCE_LABELS[s.source] ?? `Source ${s.source}`,
    value: s.count,
    color: SOURCE_COLOR[s.source] ?? chartPalette[5],
  }));
  if (tail.length) {
    sources.push({ label: 'Other', value: tail.reduce((sum, s) => sum + s.count, 0), color: chartPalette[5] });
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Contacts</h3>
      {/* Donut keeps its natural (half) width; KPIs stack alongside so the row fills evenly. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title="Contacts by source"
          subtitle={contacts ? `${formatCount(contacts.total)} total contacts` : undefined}
          badge="DONUT"
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={isEmpty || sources.length === 0}
          onRetry={refetch}
        >
          <DonutChart
            data={sources}
            centerValue={contacts ? formatCount(contacts.total) : undefined}
            centerLabel="Total"
            formatValue={formatCount}
            onCenterSelect={() => drill(drillToContacts())}
            onSelect={(_, i) => {
              // head slices map 1:1 to sources[0..head.length); the grouped "Other" tail is not drillable
              if (i < head.length) drill(drillToContacts({ sourceKind: head[i].source }));
            }}
          />
        </ChartCard>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-4 content-start">
          <KpiCard label="Total" value={contacts ? formatCount(contacts.total) : '—'} icon={Users} isLoading={isLoading} onClick={() => drill(drillToContacts())} />
          <KpiCard
            label="This month"
            value={contacts ? formatCount(contacts.createdThisMonth) : '—'}
            delta={contacts ? monthOverMonthDelta(contacts.createdThisMonth, contacts.createdLastMonth) : undefined}
            icon={Users}
            accent="success"
            isLoading={isLoading}
          />
          <KpiCard label="Last month" value={contacts ? formatCount(contacts.createdLastMonth) : '—'} icon={Users} isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
}
