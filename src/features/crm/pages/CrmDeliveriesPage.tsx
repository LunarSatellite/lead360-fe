import { useState } from 'react';
import { Truck, X, Loader2, CheckCircle, XCircle, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAllDeliveries, useUpdateDeliveryStatus } from '../api/crm.queries';
import type { CrmDeliveryFilter } from '../types/crm.types';
import { CRM_DELIVERY_STATUS_LABELS, CRM_DELIVERY_STATUS_COLORS, CrmDeliveryStatus } from '../types/crm.types';
import type { CrmDeliveryDto } from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function SlideOver({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[520px] h-full flex flex-col bg-bg-shell border-l border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const NEXT_STATUS: Record<number, { status: number; label: string }[]> = {
  1: [{ status: 2, label: 'Picked Up' }],
  2: [{ status: 3, label: 'In Transit' }],
  3: [{ status: 4, label: 'Out for Delivery' }],
  4: [
    { status: 5, label: 'Delivered' },
    { status: 6, label: 'Failed' },
  ],
};

export function Component() {
  const [filter, setFilter] = useState<CrmDeliveryFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [selected, setSelected] = useState<CrmDeliveryDto | null>(null);

  const { data: raw, isLoading } = useAllDeliveries(filter);
  const items: CrmDeliveryDto[] = (raw as any)?.item1 ?? [];
  const total: number = (raw as any)?.item2 ?? 0;

  const updateStatus = useUpdateDeliveryStatus();

  const applyFilter = () => {
    setFilter(f => ({
      ...f, page: 1,
      search: search || undefined,
      status: statusF ? Number(statusF) as CrmDeliveryStatus : undefined,
    }));
  };

  const advance = (d: CrmDeliveryDto, toStatus: number) => {
    updateStatus.mutate(
      { deliveryId: d.id, data: { status: toStatus as CrmDeliveryStatus } },
      { onSuccess: () => setSelected(prev => prev?.id === d.id ? { ...prev, status: toStatus as CrmDeliveryStatus } : prev) }
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Deliveries</h2>
            <p className="text-xs text-text-muted mt-0.5">Track all shipments across orders</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilter()}
            placeholder="Search shipment #, tracking #, carrier..."
            className="flex-1 min-w-48 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none">
            <option value="">All Status</option>
            {Object.entries(CRM_DELIVERY_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-surface text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Truck className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No deliveries found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Shipment #', 'Status', 'Carrier', 'Tracking', 'Est. Delivery', 'Delivered At', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(d => (
                  <tr key={d.id} onClick={() => setSelected(d)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{d.shipmentNumber}</td>
                    <td className="px-4 py-3"><Badge value={d.status} labels={CRM_DELIVERY_STATUS_LABELS} colors={CRM_DELIVERY_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-secondary">{d.carrier ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{d.trackingNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{d.estimatedDeliveryDate ? format(parseISO(d.estimatedDeliveryDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-4 py-3 text-xs">{d.deliveredAt ? <span className="text-success">{format(parseISO(d.deliveredAt), 'MMM d, yyyy')}</span> : '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {(NEXT_STATUS[d.status] ?? []).map(ns => (
                          <button key={ns.status} onClick={() => advance(d, ns.status)}
                            disabled={updateStatus.isPending}
                            title={ns.label}
                            className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50">
                            {ns.status === 5 ? <CheckCircle className="w-4 h-4" /> : ns.status === 6 ? <XCircle className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > filter.pageSize! && (
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button disabled={filter.page === 1} onClick={() => setFilter(f => ({ ...f, page: f.page! - 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Prev</button>
              <button disabled={filter.page! * filter.pageSize! >= total} onClick={() => setFilter(f => ({ ...f, page: f.page! + 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Shipment Detail">
        {selected && (
          <div className="space-y-5">
            <div>
              <div className="font-mono text-xs text-text-muted mb-1">{selected.shipmentNumber}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge value={selected.status} labels={CRM_DELIVERY_STATUS_LABELS} colors={CRM_DELIVERY_STATUS_COLORS} />
              </div>
            </div>

            <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
              {selected.carrier && <div className="flex justify-between"><span className="text-text-muted">Carrier</span><span className="text-text-primary font-medium">{selected.carrier}</span></div>}
              {selected.trackingNumber && <div className="flex justify-between"><span className="text-text-muted">Tracking</span><span className="font-mono text-text-primary">{selected.trackingNumber}</span></div>}
              {selected.recipientName && <div className="flex justify-between"><span className="text-text-muted">Recipient</span><span className="text-text-primary">{selected.recipientName}</span></div>}
              {selected.estimatedDeliveryDate && <div className="flex justify-between"><span className="text-text-muted">Est. Delivery</span><span className="text-text-primary">{format(parseISO(selected.estimatedDeliveryDate), 'MMM d, yyyy')}</span></div>}
              {selected.shippedAt && <div className="flex justify-between"><span className="text-text-muted">Shipped</span><span className="text-text-primary">{format(parseISO(selected.shippedAt), 'MMM d, yyyy')}</span></div>}
              {selected.outForDeliveryAt && <div className="flex justify-between"><span className="text-text-muted">Out for Delivery</span><span className="text-text-primary">{format(parseISO(selected.outForDeliveryAt), 'MMM d, yyyy')}</span></div>}
              {selected.deliveredAt && <div className="flex justify-between"><span className="text-text-muted">Delivered</span><span className="text-success font-medium">{format(parseISO(selected.deliveredAt), 'MMM d, yyyy HH:mm')}</span></div>}
              {selected.failureReason && <div className="flex justify-between"><span className="text-text-muted">Failure Reason</span><span className="text-danger">{selected.failureReason}</span></div>}
              {selected.notes && <div className="flex justify-between"><span className="text-text-muted">Notes</span><span className="text-text-secondary">{selected.notes}</span></div>}
              <div className="flex justify-between text-xs text-text-muted pt-1 border-t border-border-subtle"><span>Created</span><span>{format(parseISO(selected.createdAt), 'MMM d, yyyy')}</span></div>
            </div>

            {(NEXT_STATUS[selected.status] ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                {(NEXT_STATUS[selected.status] ?? []).map(ns => (
                  <button key={ns.status} onClick={() => advance(selected, ns.status)}
                    disabled={updateStatus.isPending}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${ns.status === 5 ? 'text-success bg-success-soft border-[rgba(34,197,94,0.2)] hover:opacity-80' : ns.status === 6 ? 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)] hover:opacity-80' : 'text-text-secondary border-border-subtle hover:text-brand hover:bg-brand-soft'}`}>
                    {ns.status === 5 ? <CheckCircle className="w-3.5 h-3.5" /> : ns.status === 6 ? <XCircle className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                    {ns.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </>
  );
}
