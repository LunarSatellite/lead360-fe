import { DollarSign, TrendingUp, RefreshCw, AlertCircle, ShieldAlert, CalendarClock } from 'lucide-react';
import { useRecurringRevenueAnalytics } from '../../../api/crm.queries';
import type { RecurringRevenueAnalyticsDto } from '../../../types/crm-analytics.types';
import { CrmInvoiceStatus, CrmSubscriptionStatus } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToInvoices, drillToSubscriptions } from '@/shared/lib';
import { KpiCard, ChartCard, BarChart, type BarDatum, formatCurrency, formatPercent, formatCount } from '..';

const TIER_LABELS: Record<number, string> = { 1: 'Free', 2: 'Starter', 3: 'Professional', 4: 'Enterprise' };

/** Recurring revenue & renewals — MRR/ARR, renewal health, collections. */
export function RecurringRevenueWidget() {
  const drill = useDrillNavigate();
  const { data: raw, isLoading } = useRecurringRevenueAnalytics();
  const data = raw as unknown as RecurringRevenueAnalyticsDto | undefined;

  const byTier: BarDatum[] = (data?.byPlanTier ?? []).map((t) => ({
    label: TIER_LABELS[t.planTier] ?? `Tier ${t.planTier}`,
    value: t.mrr,
  }));

  // totalOutstanding already includes the overdue amount, so subtract it to keep
  // the three bars additive (Collected + Not yet due + Overdue) — no double-count.
  const notYetDue = Math.max(0, (data?.totalOutstanding ?? 0) - (data?.overdueAmount ?? 0));
  const collections: BarDatum[] = [
    { label: 'Collected (all-time)', value: data?.collectedAllTime ?? 0, color: '#00D97E' },
    { label: 'Not yet due', value: notYetDue, color: '#F59E0B' },
    { label: 'Overdue', value: data?.overdueAmount ?? 0, color: '#F43F5E' },
  ];

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Recurring revenue</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="MRR" value={data ? formatCurrency(data.mrr) : '—'} hint={data ? `${data.activeSubscriptions} active` : undefined} icon={DollarSign} isLoading={isLoading} onClick={() => drill(drillToSubscriptions())} />
        <KpiCard label="ARR" value={data ? formatCurrency(data.arr) : '—'} hint={data ? `${formatCurrency(data.avgRevenuePerAccount)} / account` : undefined} icon={TrendingUp} isLoading={isLoading} onClick={() => drill(drillToSubscriptions())} />
        <KpiCard label="Renewal rate" value={data ? formatPercent(data.renewalRate) : '—'} hint={data ? `${data.renewedCount} renewed · ${data.churnedCount} churned` : undefined} icon={RefreshCw} accent="success" isLoading={isLoading} />
        <KpiCard label="Overdue" value={data ? formatCurrency(data.overdueAmount) : '—'} hint={data ? `${data.overdueInvoices} invoices` : undefined} icon={AlertCircle} accent="danger" isLoading={isLoading} onClick={() => drill(drillToInvoices({ status: CrmInvoiceStatus.Overdue }))} />
        <KpiCard label="At-risk value" value={data ? formatCurrency(data.contractValueAtRisk) : '—'} hint="renewals flagged at-risk" icon={ShieldAlert} accent="warning" isLoading={isLoading} />
        <KpiCard label="Upcoming renewals" value={data ? formatCount(data.upcomingRenewals) : '—'} hint="due to renew" icon={CalendarClock} accent="info" isLoading={isLoading} />
      </div>
      {data && (
        <p className="text-xs text-text-muted">
          {formatCount(data.pausedSubscriptions)} paused · {formatCount(data.cancelledSubscriptions)} cancelled subscriptions
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="MRR by plan tier" subtitle="active subscriptions · click a tier to list them" isLoading={isLoading} isEmpty={!byTier.some((d) => d.value > 0)} emptyMessage="No active subscriptions.">
          <BarChart
            data={byTier}
            formatValue={formatCurrency}
            onSelect={(_d, i) => {
              const tier = data?.byPlanTier[i]?.planTier;
              // Chart shows active MRR per tier, so the drill filters to active too (counts reconcile).
              if (tier) drill(drillToSubscriptions({ planTier: tier, status: CrmSubscriptionStatus.Active }));
            }}
          />
        </ChartCard>
        <ChartCard title="Collections" subtitle={data ? `${formatCount(data.paidInvoices)} paid invoices · click a bar to list invoices` : undefined} isLoading={isLoading} isEmpty={!collections.some((d) => d.value > 0)} emptyMessage="No invoices yet.">
          <BarChart
            data={collections}
            formatValue={formatCurrency}
            onSelect={(_d, i) => {
              // 0 = Collected (Paid) · 1 = Not yet due (Sent + PartiallyPaid → no single-status filter, list all) · 2 = Overdue
              if (i === 0) drill(drillToInvoices({ status: CrmInvoiceStatus.Paid }));
              else if (i === 2) drill(drillToInvoices({ status: CrmInvoiceStatus.Overdue }));
              else drill(drillToInvoices());
            }}
          />
        </ChartCard>
      </div>
    </section>
  );
}
