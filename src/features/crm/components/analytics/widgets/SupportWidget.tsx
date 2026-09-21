import { LifeBuoy, Clock, AlertTriangle, CheckCircle2, Timer, ShieldAlert, Bot, Cpu } from 'lucide-react';
import { useSupportAnalytics } from '../../../api/crm.queries';
import { CrmSupportCaseStatus, CRM_SUPPORT_PRIORITY_LABELS, type SupportAnalyticsDto } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToSupport } from '@/shared/lib';
import { KpiCard, ChartCard, BarChart, formatCount, type BarDatum } from '..';

/** Severity bar colors — Low → Critical. */
const SEVERITY_FILL: Record<number, string> = { 1: '#6B7280', 2: '#F59E0B', 3: '#FB7185', 4: '#F43F5E' };

/**
 * KPI family — support cases by status + service-quality metrics.
 * Backed by the aggregate report GET /crm/analytics/support (one call).
 * Each status tile drills to the Support page pre-filtered to that status.
 */
export function SupportWidget() {
  const drill = useDrillNavigate();
  const { data: raw, isLoading } = useSupportAnalytics();
  // apiClient unwraps the ServiceResult at runtime; the type still says AxiosResponse, so cast (codebase pattern).
  const data = raw as unknown as SupportAnalyticsDto | undefined;

  const countOf = (status: CrmSupportCaseStatus) =>
    data?.byStatus.find((b) => b.status === status)?.count ?? 0;

  // Status tiles map to the real backend statuses (source of truth). All three
  // terminal states (Resolved / AI resolved / Closed) get their own tile so the
  // resolved count isn't understated — each tile counts exactly one status.
  const STATUS_TILES = [
    { label: 'New', icon: LifeBuoy, status: CrmSupportCaseStatus.New, accent: 'info' as const },
    { label: 'AI handling', icon: Cpu, status: CrmSupportCaseStatus.AiHandling, accent: 'info' as const },
    { label: 'In progress', icon: Clock, status: CrmSupportCaseStatus.InProgress, accent: 'warning' as const },
    { label: 'Escalated', icon: AlertTriangle, status: CrmSupportCaseStatus.Escalated, accent: 'danger' as const },
    { label: 'Resolved', icon: CheckCircle2, status: CrmSupportCaseStatus.Resolved, accent: 'success' as const },
    { label: 'AI resolved', icon: Bot, status: CrmSupportCaseStatus.AiResolved, accent: 'success' as const },
    { label: 'Closed', icon: CheckCircle2, status: CrmSupportCaseStatus.Closed, accent: 'brand' as const },
  ];

  // Service-quality metrics surfaced by the aggregate report. Rates/averages aren't
  // a record set, except AI resolution → the AiResolved status is drillable.
  const METRIC_TILES = [
    { label: 'Avg resolution', icon: Timer, value: data ? `${data.avgResolutionHours}h` : '—', hint: 'hours to resolve', accent: 'brand' as const, onClick: undefined },
    { label: 'SLA breach rate', icon: ShieldAlert, value: data ? `${data.slaBreachRate}%` : '—', hint: 'breached either SLA', accent: 'danger' as const, onClick: undefined },
    {
      label: 'AI resolution',
      icon: Bot,
      value: data ? `${data.aiResolutionRate}%` : '—',
      hint: 'of resolved cases',
      accent: 'success' as const,
      onClick: () => drill(drillToSupport({ status: CrmSupportCaseStatus.AiResolved })),
    },
  ];

  const bySeverity: BarDatum[] = (data?.bySeverity ?? []).map((s) => ({
    label: CRM_SUPPORT_PRIORITY_LABELS[s.severity] ?? `Sev ${s.severity}`,
    value: s.count,
    color: SEVERITY_FILL[s.severity],
  }));

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Support</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_TILES.map((t) => (
          <KpiCard
            key={t.label}
            label={t.label}
            value={data ? formatCount(countOf(t.status)) : '—'}
            icon={t.icon}
            accent={t.accent}
            isLoading={isLoading}
            onClick={() => drill(drillToSupport({ status: t.status }))}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {METRIC_TILES.map((t) => (
          <KpiCard key={t.label} label={t.label} value={t.value} hint={t.hint} icon={t.icon} accent={t.accent} isLoading={isLoading} onClick={t.onClick} />
        ))}
      </div>
      <ChartCard title="By severity" subtitle="click a severity to list those cases" badge="BAR" minBodyHeight={100} isLoading={isLoading} isEmpty={bySeverity.length === 0} emptyMessage="No cases yet.">
        <BarChart
          data={bySeverity}
          orientation="horizontal"
          height={Math.max(bySeverity.length * 32, 80)}
          formatValue={formatCount}
          onSelect={(_d, i) => {
            const sev = data?.bySeverity[i]?.severity;
            if (sev) drill(drillToSupport({ priority: sev }));
          }}
        />
      </ChartCard>
    </section>
  );
}
