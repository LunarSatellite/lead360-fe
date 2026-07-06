import { Package, Loader2, Inbox } from 'lucide-react';
import { usePortalOrders } from '../api/portal.queries';
import type { PortalOrderDto } from '../types/portal.types';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Confirmed: { bg: 'bg-success-500/10', text: 'text-success-400' },
  Processing: { bg: 'bg-info-500/10', text: 'text-info-400' },
  Shipped: { bg: 'bg-brand-soft', text: 'text-brand' },
  Delivered: { bg: 'bg-success-500/10', text: 'text-success-400' },
  Cancelled: { bg: 'bg-danger-500/10', text: 'text-danger-400' },
  Pending: { bg: 'bg-warning-500/10', text: 'text-warning-400' },
};

function getStatus(status: string) {
  return STATUS_STYLES[status] ?? { bg: 'bg-glass-2', text: 'text-text-muted' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function Component() {
  const { data, isPending } = usePortalOrders();
  const orders = (data ?? []) as PortalOrderDto[];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-extrabold text-text-primary">Orders</h1>
        <p className="text-xs text-text-muted mt-0.5">Your order history</p>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-card bg-glass-1 border-thin border-border-subtle flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-semibold text-text-secondary mb-1">No orders</p>
          <p className="text-xs text-text-muted">Your orders will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => {
            const s = getStatus(order.status);
            const fs = getStatus(order.fulfillmentStatus);
            return (
              <div
                key={order.id}
                className="bg-glass-1 border-thin border-border-subtle rounded-card p-3.5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-sm bg-brand-soft flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-brand" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary">{order.orderNumber}</p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(order.orderDate)}</p>
                </div>
                <span className="text-sm font-extrabold text-text-primary tabular-nums shrink-0">
                  {formatAmount(order.totalAmount, order.currency)}
                </span>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-2xs font-semibold ${s.bg} ${s.text} border-thin border-transparent`}>
                    {order.status}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-2xs font-semibold ${fs.bg} ${fs.text} border-thin border-transparent`}>
                    {order.fulfillmentStatus}
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
