import { Users, UserX } from 'lucide-react';
import { useTeamPerformanceAnalytics } from '../../../api/crm.queries';
import type { TeamPerformanceAnalyticsDto, TeamMemberPerformance } from '../../../types/crm-analytics.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToDeals, drillToTeam } from '@/shared/lib';
import { KpiCard, ChartCard, DataTable, type Column, formatCount, formatCurrency, formatPercent } from '..';

/** Team performance — per-owner deals, leads, cases, and time logged. */
export function TeamPerformanceWidget() {
  const drill = useDrillNavigate();
  const { data: raw, isLoading } = useTeamPerformanceAnalytics();
  const data = raw as unknown as TeamPerformanceAnalyticsDto | undefined;

  const cols: Column<TeamMemberPerformance>[] = [
    {
      header: 'Member',
      accessor: 'fullName',
      render: (r) => (
        <span className="flex flex-col min-w-0">
          <span className="font-medium text-text-primary truncate">{r.fullName}</span>
          {r.email && <span className="text-2xs text-text-muted truncate">{r.email}</span>}
        </span>
      ),
    },
    { header: 'Won value', accessor: 'wonValue', align: 'right', format: (v) => formatCurrency(Number(v)) },
    { header: 'Win rate', accessor: 'winRate', align: 'right', format: (v) => formatPercent(Number(v)) },
    { header: 'W–L', accessor: 'wonDeals', align: 'right', format: (_v, r) => `${r.wonDeals}–${r.lostDeals}` },
    { header: 'Leads', accessor: 'assignedLeads', align: 'right', format: (v, r) => `${v} (${r.convertedLeads})` },
    { header: 'Cases', accessor: 'assignedCases', align: 'right', format: (v, r) => `${v} (${r.resolvedCases})` },
    {
      header: 'Hours · util',
      accessor: 'hoursLogged',
      align: 'right',
      // Utilization = billable ÷ total hours. Guard the 0-hours case (no % rather than NaN).
      format: (v, r) => {
        const total = Number(v);
        if (total <= 0) return '0h';
        return `${total}h · ${Math.round((r.billableHoursLogged / total) * 100)}%`;
      },
    },
  ];

  const unassigned = (data?.unassignedDeals ?? 0) + (data?.unassignedLeads ?? 0) + (data?.unassignedCases ?? 0);

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Team performance</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Members" value={data ? formatCount(data.teamMembers) : '—'} hint="with CRM activity" icon={Users} isLoading={isLoading} onClick={() => drill(drillToTeam())} />
        <KpiCard label="Unassigned" value={formatCount(unassigned)} hint={data ? `${data.unassignedLeads} leads · ${data.unassignedDeals} deals` : undefined} icon={UserX} accent="warning" isLoading={isLoading} />
      </div>
      <ChartCard title="Performance leaderboard" subtitle="ranked by won value · click a member to see their deals" isLoading={isLoading} isEmpty={!data?.members.length} emptyMessage="No team activity yet.">
        <DataTable
          columns={cols}
          rows={data?.members ?? []}
          rowKey={(r) => r.userId}
          onRowClick={(r) => drill(drillToDeals({ ownedByUserId: r.userId }))}
        />
      </ChartCard>
    </section>
  );
}
