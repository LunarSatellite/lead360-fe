import { useQuery } from '@tanstack/react-query';
import { Loader2, RotateCw, Wrench, UserPlus, AlertTriangle } from 'lucide-react';
import { crmApi } from '../api/crm.api';
import { CRM_RETURN_STATUS_LABELS } from '../types/crm.types';
import { CRM_WORK_ORDER_STATUS_LABELS } from '../types/crm.types';
import { CRM_ONBOARDING_STATUS_LABELS } from '../types/crm.types';

function StatCard({ title, value, icon: Icon, sub, color }: { title: string; value: number; icon: any; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-elevated p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

function StatusBreakdown({ data, labels }: { data: Record<number, number>; labels: Record<number, string> }) {
  return (
    <div className="space-y-1.5">
      {Object.entries(data).map(([key, count]) => (
        <div key={key} className="flex justify-between text-xs">
          <span className="text-text-secondary">{labels[Number(key)] ?? key}</span>
          <span className="font-medium text-text-primary">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'ops-dashboard'],
    queryFn: () => crmApi.getOpsDashboard(),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>;

  const d = data?.data;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">Operations Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Returns" value={d?.totalReturns ?? 0} icon={RotateCw} color="text-blue-500" sub={`${d?.returnsAwaitingAction ?? 0} awaiting action`} />
        <StatCard title="Work Orders" value={d?.totalWorkOrders ?? 0} icon={Wrench} color="text-orange-500" sub={`${d?.workOrdersScheduledToday ?? 0} today, ${d?.workOrdersOverdue ?? 0} overdue`} />
        <StatCard title="Onboardings" value={d?.totalOnboardings ?? 0} icon={UserPlus} color="text-green-500" sub={`${d?.onboardingsBlocked ?? 0} blocked`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><RotateCw className="w-4 h-4 text-blue-500" /> Returns by Status</h3>
          {d?.returnsByStatus ? <StatusBreakdown data={d.returnsByStatus} labels={CRM_RETURN_STATUS_LABELS} /> : <p className="text-xs text-text-muted">No data</p>}
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-500" /> Work Orders by Status</h3>
          {d?.workOrdersByStatus ? <StatusBreakdown data={d.workOrdersByStatus} labels={CRM_WORK_ORDER_STATUS_LABELS} /> : <p className="text-xs text-text-muted">No data</p>}
        </div>
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-green-500" /> Onboardings by Status</h3>
          {d?.onboardingsByStatus ? <StatusBreakdown data={d.onboardingsByStatus} labels={CRM_ONBOARDING_STATUS_LABELS} /> : <p className="text-xs text-text-muted">No data</p>}
        </div>
      </div>

      {(d?.workOrdersOverdue ?? 0) > 0 && (
        <div className="rounded-xl border border-status-danger/20 bg-status-danger/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-status-danger shrink-0" />
          <p className="text-sm text-status-danger font-medium">{d?.workOrdersOverdue} overdue work orders need attention.</p>
        </div>
      )}
    </div>
  );
}
