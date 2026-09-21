import { FileText, Loader2, Inbox } from 'lucide-react';
import { usePortalInvoices } from '../api/portal.queries';
import type { PortalInvoiceDto } from '../types/portal.types';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Paid: { bg: 'bg-success-500/10', text: 'text-success-400' },
  Sent: { bg: 'bg-info-500/10', text: 'text-info-400' },
  Overdue: { bg: 'bg-danger-500/10', text: 'text-danger-400' },
  Draft: { bg: 'bg-glass-2', text: 'text-text-muted' },
  Void: { bg: 'bg-glass-2', text: 'text-text-muted' },
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
  const { data, isPending } = usePortalInvoices();
  const invoices = (data ?? []) as PortalInvoiceDto[];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-extrabold text-text-primary">Invoices</h1>
        <p className="text-xs text-text-muted mt-0.5">Your billing history</p>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-card bg-glass-1 border-thin border-border-subtle flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-semibold text-text-secondary mb-1">No invoices</p>
          <p className="text-xs text-text-muted">Your invoices will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((inv) => {
            const s = getStatus(inv.status);
            return (
              <div
                key={inv.id}
                className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-sm bg-brand-soft flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-brand" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{inv.invoiceNumber}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Due {formatDate(inv.dueDate)}
                    {inv.paidAt && <> &middot; Paid {formatDate(inv.paidAt)}</>}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-text-primary tabular-nums shrink-0">
                  {formatAmount(inv.totalAmount, inv.currency)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-2xs font-semibold ${s.bg} ${s.text} border-thin border-transparent shrink-0`}>
                  {inv.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
