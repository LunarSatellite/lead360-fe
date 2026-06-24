import { useState } from 'react';
import { Plus, X, Loader2, Package, CheckCircle, Truck, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useOrders, useCreateOrder, useConfirmOrder, useFulfillOrder, useCancelOrder,
} from '../api/crm.queries';
import type {
  CrmOrderSummaryDto, CrmOrderCreateRequest, CrmOrderLineItemRequest, CrmOrderFilter,
} from '../types/crm.types';
import {
  CrmOrderStatus,
  CRM_ORDER_STATUS_LABELS, CRM_ORDER_STATUS_COLORS,
  CRM_ORDER_FULFILLMENT_LABELS,
} from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-elevated shadow-2xl flex flex-col border-thin border-border-subtle rounded-card max-h-[90vh]">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const FULFILLMENT_COLORS: Record<number, string> = {
  1: 'text-text-secondary bg-bg-elevated border-border-subtle',
  2: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-text-muted bg-bg-card border-border-subtle',
};

type LineItem = { productName: string; quantity: string; unitPrice: string };
const emptyLine = (): LineItem => ({ productName: '', quantity: '1', unitPrice: '' });

export function Component() {
  const [filter, setFilter] = useState<CrmOrderFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [contactId, setContactId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);

  const [selectedOrder, setSelectedOrder] = useState<CrmOrderSummaryDto | null>(null);

  const { data: raw, isLoading } = useOrders(filter);
  const items: CrmOrderSummaryDto[] = (raw as any)?.items ?? [];

  const createOrder = useCreateOrder();
  const confirmOrder = useConfirmOrder();
  const fulfillOrder = useFulfillOrder();
  const cancelOrder = useCancelOrder();

  const applyFilter = () => {
    setFilter({ page: 1, pageSize: 20, search: search || undefined, status: statusF ? Number(statusF) as CrmOrderStatus : undefined });
  };

  const lineTotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const lineItems: CrmOrderLineItemRequest[] = lines
      .filter(l => l.productName.trim())
      .map(l => ({ productName: l.productName.trim(), quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) }));
    const req: CrmOrderCreateRequest = { contactId: contactId.trim(), lineItems, currency: currency || 'USD', notes: notes || undefined };
    createOrder.mutate(req, {
      onSuccess: () => {
        setShowCreate(false);
        setContactId(''); setCurrency('USD'); setNotes(''); setLines([emptyLine()]);
      },
    });
  };

  const addLine = () => setLines(ls => [...ls, emptyLine()]);
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const setLine = (i: number, k: keyof LineItem, v: string) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Orders</h2>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Order
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilter()} placeholder="Search orders..." className="flex-1 min-w-40 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40">
            <option value="">All Status</option>
            {Object.entries(CRM_ORDER_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={applyFilter} className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-surface text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Package className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No orders found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Order #', 'Contact', 'Total', 'Status', 'Fulfillment', 'Ordered', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((o: CrmOrderSummaryDto) => (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{o.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{o.contactName ?? o.contactId}</td>
                    <td className="px-4 py-3 text-text-secondary">{o.currency} {o.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3"><Badge value={o.status} labels={CRM_ORDER_STATUS_LABELS} colors={CRM_ORDER_STATUS_COLORS} /></td>
                    <td className="px-4 py-3"><Badge value={o.fulfillmentStatus} labels={CRM_ORDER_FULFILLMENT_LABELS} colors={FULFILLMENT_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(o.orderedAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {o.status === CrmOrderStatus.Pending && (
                          <button onClick={() => confirmOrder.mutate(o.id)} disabled={confirmOrder.isPending} title="Confirm" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all disabled:opacity-50">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {o.status === CrmOrderStatus.Confirmed && (
                          <button onClick={() => fulfillOrder.mutate(o.id)} disabled={fulfillOrder.isPending} title="Fulfill" className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50">
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {o.status !== CrmOrderStatus.Delivered && o.status !== CrmOrderStatus.Cancelled && (
                          <button onClick={() => cancelOrder.mutate(o.id)} disabled={cancelOrder.isPending} title="Cancel" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all disabled:opacity-50">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create SlideOver */}
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Contact ID *"><input required value={contactId} onChange={e => setContactId(e.target.value)} placeholder="contact-uuid" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency"><input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" className={inputCls} /></Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-muted">Line Items</label>
              <button type="button" onClick={addLine} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all">
                <Plus className="w-3 h-3" /> Add Row
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_28px] gap-1.5 items-center">
                  <input value={l.productName} onChange={e => setLine(i, 'productName', e.target.value)} placeholder="Product name" className={inputCls} />
                  <input type="number" min="1" value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} className={inputCls} />
                  <input type="number" min="0" step="0.01" value={l.unitPrice} onChange={e => setLine(i, 'unitPrice', e.target.value)} placeholder="0.00" className={inputCls} />
                  <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} className="p-1 rounded text-text-muted hover:text-danger disabled:opacity-30 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-bold text-text-primary">
              Total: {currency} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createOrder.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Order'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Detail SlideOver */}
      <SlideOver open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order">
        {selectedOrder && (
          <div className="space-y-5">
            <div>
              <div className="font-mono text-xs text-text-muted mb-1">{selectedOrder.orderNumber}</div>
              <div className="font-extrabold text-base text-text-primary">{selectedOrder.contactName ?? selectedOrder.contactId}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge value={selectedOrder.status} labels={CRM_ORDER_STATUS_LABELS} colors={CRM_ORDER_STATUS_COLORS} />
                <Badge value={selectedOrder.fulfillmentStatus} labels={CRM_ORDER_FULFILLMENT_LABELS} colors={FULFILLMENT_COLORS} />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {[
                ['Total', `${selectedOrder.currency} ${selectedOrder.totalAmount.toLocaleString()}`],
                ['Ordered', format(parseISO(selectedOrder.orderedAt), 'MMM d, yyyy')],
                ['Created', format(parseISO(selectedOrder.createdAt), 'MMM d, yyyy')],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-1.5 border-b border-border-subtle last:border-0">
                  <span className="text-text-muted">{k}</span>
                  <span className="text-text-primary font-medium">{String(v)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border-subtle">
              {selectedOrder.status === CrmOrderStatus.Pending && (
                <button onClick={() => { confirmOrder.mutate(selectedOrder.id); }} disabled={confirmOrder.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-success hover:bg-success-soft transition-all disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Confirm
                </button>
              )}
              {selectedOrder.status === CrmOrderStatus.Confirmed && (
                <button onClick={() => { fulfillOrder.mutate(selectedOrder.id); }} disabled={fulfillOrder.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50">
                  <Truck className="w-3.5 h-3.5" /> Fulfill
                </button>
              )}
              {selectedOrder.status !== CrmOrderStatus.Delivered && selectedOrder.status !== CrmOrderStatus.Cancelled && (
                <button onClick={() => { cancelOrder.mutate(selectedOrder.id, { onSuccess: () => setSelectedOrder(null) }); }} disabled={cancelOrder.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(244,63,94,0.2)] text-xs font-semibold text-danger bg-danger-soft hover:opacity-80 transition-all disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </>
  );
}
