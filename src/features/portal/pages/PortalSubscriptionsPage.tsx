import { RefreshCw, Loader2, Inbox } from 'lucide-react';
import { usePortalSubscriptions } from '../api/portal.queries';
import type { PortalSubscriptionDto } from '../types/portal.types';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Active: { bg: 'bg-success-500/10', text: 'text-success-400' },
  Trialing: { bg: 'bg-info-500/10', text: 'text-info-400' },
  PastDue: { bg: 'bg-warning-500/10', text: 'text-warning-400' },
  Cancelled: { bg: 'bg-danger-500/10', text: 'text-danger-400' },
  Paused: { bg: 'bg-glass-2', text: 'text-text-muted' },
  Expired: { bg: 'bg-glass-2', text: 'text-text-muted' },
};

function getStatus(status: string) {
  return STATUS_STYLES[status] ?? { bg: 'bg-glass-2', text: 'text-text-muted' };
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function Component() {
  const { data, isPending } = usePortalSubscriptions();
  const subscriptions = (data ?? []) as PortalSubscriptionDto[];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-extrabold text-text-primary">Subscriptions</h1>
        <p className="text-xs text-text-muted mt-0.5">Your active and past subscriptions</p>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-card bg-glass-1 border-thin border-border-subtle flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-semibold text-text-secondary mb-1">No subscriptions</p>
          <p className="text-xs text-text-muted">Your subscriptions will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {subscriptions.map((sub) => {
            const s = getStatus(sub.status);
            return (
              <div
                key={sub.id}
                className="bg-glass-1 border-thin border-border-subtle rounded-card p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-sm bg-brand-soft flex items-center justify-center shrink-0">
                      <RefreshCw className="w-4 h-4 text-brand" strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{sub.planName}</p>
                      <p className="text-xs text-text-muted capitalize">{sub.billingCadence}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-2xs font-semibold ${s.bg} ${s.text} border-thin border-transparent shrink-0`}>
                    {sub.status === 'PastDue' ? 'Past Due' : sub.status}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div className="flex flex-col gap-0.5 text-xs text-text-muted">
                    <span>Started {formatDate(sub.startDate)}</span>
                    {sub.nextBillingDate && <span>Next billing {formatDate(sub.nextBillingDate)}</span>}
                    {sub.endDate && <span>Ends {formatDate(sub.endDate)}</span>}
                  </div>
                  <span className="text-lg font-black text-text-primary tabular-nums">
                    {formatAmount(sub.amount, sub.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
