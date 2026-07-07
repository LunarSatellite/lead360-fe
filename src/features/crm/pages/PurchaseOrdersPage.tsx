import { useState } from 'react';
import { Plus, X, Loader2, ShoppingCart, CheckCircle, Send, XCircle, Lock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  usePurchaseOrders, useCreatePurchaseOrder, useSubmitPurchaseOrderForApproval,
  useApprovePurchaseOrder, useRejectPurchaseOrder, useMarkPurchaseOrderSentToVendor,
  useCancelPurchaseOrder, useClosePurchaseOrder, useActiveVendors,
} from '../api/crm.queries';
import type { PurchaseOrderDto, PurchaseOrderCreateRequest, PurchaseOrderLineItemRequest, PurchaseOrderFilter, VendorDto } from '../types/crm.types';
import { PO_STATUS_LABELS, PO_STATUS_COLORS, PurchaseOrderStatus } from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>{labels[value] ?? value}</span>;
}

function SlideOver({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`drawer-slide-in relative ${wide ? 'w-[640px]' : 'w-[560px]'} h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle`} style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-text-muted mb-1.5">{label}</label>{children}</div>;
}

type LineItem = { productName: string; sku: string; quantity: string; unitCost: string; notes: string };
const emptyLine = (): LineItem => ({ productName: '', sku: '', quantity: '1', unitCost: '', notes: '' });

export function Component() {
  const [filter, setFilter] = useState<PurchaseOrderFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrderDto | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [vendorId, setVendorId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);

  const { data: raw, isLoading } = usePurchaseOrders(filter);
  const items: PurchaseOrderDto[] = (raw as any)?.items ?? [];
  const { data: vendors } = useActiveVendors();
  const vendorList: VendorDto[] = (vendors as any) ?? [];

  const createPO = useCreatePurchaseOrder();
  const submitApproval = useSubmitPurchaseOrderForApproval();
  const approvePO = useApprovePurchaseOrder();
  const rejectPO = useRejectPurchaseOrder();
  const sendToVendor = useMarkPurchaseOrderSentToVendor();
  const cancelPO = useCancelPurchaseOrder();
  const closePO = useClosePurchaseOrder();

  const lineTotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);

  const addLine = () => setLines(ls => [...ls, emptyLine()]);
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const setLine = (i: number, k: keyof LineItem, v: string) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const resetCreate = () => { setVendorId(''); setExpectedDelivery(''); setShippingAddress(''); setCurrency('USD'); setNotes(''); setLines([emptyLine()]); };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const lineItems: PurchaseOrderLineItemRequest[] = lines.filter(l => l.productName.trim()).map(l => ({
      productName: l.productName.trim(), sku: l.sku.trim() || undefined, quantityOrdered: Number(l.quantity), unitCost: Number(l.unitCost), notes: l.notes.trim() || undefined,
    }));
    const req: PurchaseOrderCreateRequest = { vendorId, expectedDeliveryDate: expectedDelivery || undefined, shippingAddress: shippingAddress || undefined, currency: currency || 'USD', notes: notes || undefined, lineItems };
    createPO.mutate(req, { onSuccess: () => { setShowCreate(false); resetCreate(); } });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    rejectPO.mutate({ id: selected.id, data: { reason: rejectReason } }, { onSuccess: () => { setShowReject(false); setRejectReason(''); setSelected(null); } });
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    cancelPO.mutate({ id: selected.id, reason: cancelReason || undefined }, { onSuccess: () => { setShowCancel(false); setCancelReason(''); setSelected(null); } });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Purchase Orders</h2>
            <p className="text-xs text-text-muted mt-0.5">{(raw as any)?.totalCount?.toLocaleString() ?? 0} total</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New PO
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter(f => ({ ...f, search: search || undefined, page: 1 }))}
            placeholder="Search POs..." className="flex-1 min-w-40 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none">
            <option value="">All Status</option>
            {Object.entries(PO_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={() => setFilter(f => ({ ...f, search: search || undefined, status: statusF ? Number(statusF) as PurchaseOrderStatus : undefined, page: 1 }))} className="px-4 py-2 rounded-xl border border-border-subtle bg-bg-elevated text-sm text-text-secondary hover:text-text-primary transition-all">Search</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <ShoppingCart className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No purchase orders found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['PO #', 'Vendor', 'Total', 'Currency', 'Status', 'Expected', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(po => (
                  <tr key={po.id} onClick={() => setSelected(po)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{po.poNumber}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{po.vendorName ?? po.vendorId}</td>
                    <td className="px-4 py-3 text-text-secondary">{po.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{po.currency}</td>
                    <td className="px-4 py-3"><Badge value={po.status} labels={PO_STATUS_LABELS} colors={PO_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{po.expectedDeliveryDate ? format(parseISO(po.expectedDeliveryDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {po.status === PurchaseOrderStatus.Draft && (
                          <button onClick={() => submitApproval.mutate(po.id)} disabled={submitApproval.isPending} title="Submit for Approval" className="p-1.5 rounded-lg text-text-muted hover:text-[#F59E0B] hover:bg-[rgba(245,158,11,0.1)] transition-all disabled:opacity-50"><Send className="w-3.5 h-3.5" /></button>
                        )}
                        {po.status === PurchaseOrderStatus.PendingApproval && (
                          <>
                            <button onClick={() => approvePO.mutate(po.id)} disabled={approvePO.isPending} title="Approve" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all disabled:opacity-50"><CheckCircle className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setSelected(po); setShowReject(true); }} title="Reject" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all"><XCircle className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                        {po.status === PurchaseOrderStatus.Approved && (
                          <button onClick={() => sendToVendor.mutate(po.id)} disabled={sendToVendor.isPending} title="Mark Sent to Vendor" className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50"><Send className="w-3.5 h-3.5" /></button>
                        )}
                        {(po.status === PurchaseOrderStatus.FullyReceived) && (
                          <button onClick={() => closePO.mutate(po.id)} disabled={closePO.isPending} title="Close PO" className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-surface transition-all disabled:opacity-50"><Lock className="w-3.5 h-3.5" /></button>
                        )}
                        {po.status <= PurchaseOrderStatus.Approved && (
                          <button onClick={() => { setSelected(po); setShowCancel(true); }} title="Cancel" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all"><XCircle className="w-3.5 h-3.5" /></button>
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

      {/* Create */}
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Purchase Order" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Vendor *">
            <select required value={vendorId} onChange={e => setVendorId(e.target.value)} className={inputCls}>
              <option value="">Select vendor...</option>
              {vendorList.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expected Delivery"><input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} className={inputCls} /></Field>
            <Field label="Currency"><input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" className={inputCls} /></Field>
          </div>
          <Field label="Shipping Address"><textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-muted">Line Items</label>
              <button type="button" onClick={addLine} className="flex items-center gap-1 px-2 py-1 rounded border border-border-subtle text-xs text-text-secondary hover:bg-bg-surface transition-all"><Plus className="w-3 h-3" /> Add Row</button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_70px_80px_28px] gap-1.5 items-center">
                  <input value={l.productName} onChange={e => setLine(i, 'productName', e.target.value)} placeholder="Product" className={inputCls} />
                  <input value={l.sku} onChange={e => setLine(i, 'sku', e.target.value)} placeholder="SKU" className={inputCls} />
                  <input type="number" min="1" value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} className={inputCls} />
                  <input type="number" min="0" step="0.01" value={l.unitCost} onChange={e => setLine(i, 'unitCost', e.target.value)} placeholder="0.00" className={inputCls} />
                  <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} className="p-1 rounded text-text-muted hover:text-danger disabled:opacity-30"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-sm font-bold text-text-primary">
              Total: {currency} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createPO.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {createPO.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Purchase Order'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Detail */}
      <SlideOver open={!!selected && !showReject && !showCancel} onClose={() => setSelected(null)} title="Purchase Order" wide>
        {selected && (
          <div className="space-y-5">
            <div>
              <div className="font-mono text-xs text-text-muted mb-1">{selected.poNumber}</div>
              <div className="font-extrabold text-lg text-text-primary">{selected.vendorName}</div>
              <div className="mt-2"><Badge value={selected.status} labels={PO_STATUS_LABELS} colors={PO_STATUS_COLORS} /></div>
            </div>

            <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>{selected.currency} {selected.subTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Tax</span><span>{selected.currency} {selected.taxAmount.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t border-border-subtle pt-2"><span>Total</span><span>{selected.currency} {selected.totalAmount.toLocaleString()}</span></div>
            </div>

            {selected.expectedDeliveryDate && <div className="text-sm text-text-secondary">Expected: {format(parseISO(selected.expectedDeliveryDate), 'MMM d, yyyy')}</div>}
            {selected.approvedAt && <div className="text-sm text-success">Approved: {format(parseISO(selected.approvedAt), 'MMM d, yyyy')} by {selected.approvedByName}</div>}
            {selected.sentToVendorAt && <div className="text-sm text-brand">Sent to vendor: {format(parseISO(selected.sentToVendorAt), 'MMM d, yyyy')}</div>}
            {selected.cancellationReason && <div className="text-sm text-danger bg-danger-soft rounded-xl p-3">Cancelled: {selected.cancellationReason}</div>}

            {selected.lineItems?.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Line Items</label>
                <div className="bg-bg-surface rounded-xl divide-y divide-border-subtle">
                  {selected.lineItems.map(li => (
                    <div key={li.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                      <div>
                        <span className="text-text-primary font-medium">{li.productName}</span>
                        {li.sku && <span className="text-text-muted text-xs ml-2">SKU: {li.sku}</span>}
                        <div className="text-xs text-text-muted mt-0.5">Ordered: {li.quantityOrdered} | Received: {li.quantityReceived}</div>
                      </div>
                      <div className="text-right text-text-secondary">
                        <div>{li.quantityOrdered} × {selected.currency} {li.unitCost}</div>
                        <div className="font-semibold text-text-primary">{selected.currency} {li.totalCost.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.notes && <div><label className="text-xs font-semibold text-text-muted mb-1 block">Notes</label><p className="text-sm text-text-secondary bg-bg-surface rounded-xl p-3">{selected.notes}</p></div>}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
              {selected.status === PurchaseOrderStatus.Draft && (
                <button onClick={() => { submitApproval.mutate(selected.id); setSelected(null); }} disabled={submitApproval.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-[#F59E0B] transition-all disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> Submit for Approval
                </button>
              )}
              {selected.status === PurchaseOrderStatus.PendingApproval && (
                <>
                  <button onClick={() => { approvePO.mutate(selected.id); setSelected(null); }} disabled={approvePO.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-success bg-success-soft border border-[rgba(34,197,94,0.2)] hover:opacity-80 disabled:opacity-50">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-danger bg-danger-soft border border-[rgba(244,63,94,0.2)] hover:opacity-80">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
              {selected.status === PurchaseOrderStatus.Approved && (
                <button onClick={() => { sendToVendor.mutate(selected.id); setSelected(null); }} disabled={sendToVendor.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand transition-all disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> Mark Sent to Vendor
                </button>
              )}
              {selected.status === PurchaseOrderStatus.FullyReceived && (
                <button onClick={() => { closePO.mutate(selected.id); setSelected(null); }} disabled={closePO.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary transition-all disabled:opacity-50">
                  <Lock className="w-3.5 h-3.5" /> Close PO
                </button>
              )}
              {selected.status <= PurchaseOrderStatus.Approved && (
                <button onClick={() => setShowCancel(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(244,63,94,0.2)] text-xs font-semibold text-danger bg-danger-soft hover:opacity-80">
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Reject */}
      <SlideOver open={showReject} onClose={() => setShowReject(false)} title="Reject Purchase Order">
        <form onSubmit={handleReject} className="space-y-4">
          <p className="text-sm text-text-muted">PO <span className="font-mono text-text-primary">{selected?.poNumber}</span></p>
          <Field label="Rejection Reason *"><textarea required value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="Reason for rejection..." /></Field>
          <div className="flex gap-3">
            <button type="submit" disabled={rejectPO.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-danger text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {rejectPO.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
            </button>
            <button type="button" onClick={() => setShowReject(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Cancel */}
      <SlideOver open={showCancel} onClose={() => setShowCancel(false)} title="Cancel Purchase Order">
        <form onSubmit={handleCancel} className="space-y-4">
          <p className="text-sm text-text-muted">PO <span className="font-mono text-text-primary">{selected?.poNumber}</span></p>
          <Field label="Reason (optional)"><textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Optional cancellation reason..." /></Field>
          <div className="flex gap-3">
            <button type="submit" disabled={cancelPO.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-danger text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {cancelPO.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Order'}
            </button>
            <button type="button" onClick={() => setShowCancel(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Back</button>
          </div>
        </form>
      </SlideOver>
    </>
  );
}
