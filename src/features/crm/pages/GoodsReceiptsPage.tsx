import { useState } from 'react';
import { Plus, X, Loader2, PackageCheck, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useGoodsReceipts, useCreateGoodsReceipt, useConfirmGoodsReceipt, useVoidGoodsReceipt,
} from '../api/crm.queries';
import type { GoodsReceiptDto, GoodsReceiptCreateRequest, GoodsReceiptLineItemRequest, GoodsReceiptFilter } from '../types/crm.types';
import { GR_STATUS_LABELS, GR_STATUS_COLORS, GOODS_CONDITION_LABELS, GoodsCondition, GoodsReceiptStatus } from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>{labels[value] ?? value}</span>;
}

function SlideOver({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`drawer-slide-in relative ${wide ? 'w-[620px]' : 'w-[560px]'} h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle`} style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
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

type GrLine = { poLineItemId: string; quantityReceived: string; condition: string; rejectedQty: string; rejectionReason: string };
const emptyGrLine = (): GrLine => ({ poLineItemId: '', quantityReceived: '1', condition: '1', rejectedQty: '0', rejectionReason: '' });

export function Component() {
  const [filter, setFilter] = useState<GoodsReceiptFilter>({ page: 1, pageSize: 20 });
  const [statusF, setStatusF] = useState('');
  const [poFilter, setPoFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<GoodsReceiptDto | null>(null);

  const [poId, setPoId] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<GrLine[]>([emptyGrLine()]);

  const { data: raw, isLoading } = useGoodsReceipts(filter);
  const items: GoodsReceiptDto[] = (raw as any)?.items ?? [];

  const createGR = useCreateGoodsReceipt();
  const confirmGR = useConfirmGoodsReceipt();
  const voidGR = useVoidGoodsReceipt();

  const addLine = () => setLines(ls => [...ls, emptyGrLine()]);
  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const setLine = (i: number, k: keyof GrLine, v: string) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const resetCreate = () => { setPoId(''); setWarehouse(''); setNotes(''); setLines([emptyGrLine()]); };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const lineItems: GoodsReceiptLineItemRequest[] = lines.map(l => ({
      poLineItemId: l.poLineItemId.trim() || undefined,
      quantityReceived: Number(l.quantityReceived),
      condition: Number(l.condition) as GoodsCondition,
      rejectedQty: Number(l.rejectedQty) || undefined,
      rejectionReason: l.rejectionReason.trim() || undefined,
    }));
    const req: GoodsReceiptCreateRequest = { purchaseOrderId: poId.trim(), warehouseLocation: warehouse.trim() || undefined, notes: notes.trim() || undefined, lineItems };
    createGR.mutate(req, { onSuccess: () => { setShowCreate(false); resetCreate(); } });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Goods Receipts</h2>
            <p className="text-xs text-text-muted mt-0.5">{(raw as any)?.totalCount?.toLocaleString() ?? 0} total</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Receipt
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={poFilter} onChange={e => setPoFilter(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter(f => ({ ...f, purchaseOrderId: poFilter.trim() || undefined, page: 1 }))}
            placeholder="Filter by PO ID..." className="flex-1 min-w-40 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none">
            <option value="">All Status</option>
            {Object.entries(GR_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={() => setFilter(f => ({ ...f, purchaseOrderId: poFilter.trim() || undefined, status: statusF ? Number(statusF) as GoodsReceiptStatus : undefined, page: 1 }))} className="px-4 py-2 rounded-xl border border-border-subtle bg-bg-elevated text-sm text-text-secondary hover:text-text-primary transition-all">Filter</button>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <PackageCheck className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No goods receipts found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['GRN #', 'PO #', 'Vendor', 'Status', 'Received At', 'Warehouse', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(gr => (
                  <tr key={gr.id} onClick={() => setSelected(gr)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{gr.receiptNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{gr.poNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-text-primary">{gr.vendorName ?? '—'}</td>
                    <td className="px-4 py-3"><Badge value={gr.status} labels={GR_STATUS_LABELS} colors={GR_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(gr.receivedAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-text-secondary">{gr.warehouseLocation ?? '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {gr.status === GoodsReceiptStatus.Draft && (
                          <button onClick={() => confirmGR.mutate(gr.id)} disabled={confirmGR.isPending} title="Confirm Receipt" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all disabled:opacity-50"><CheckCircle className="w-3.5 h-3.5" /></button>
                        )}
                        {gr.status === GoodsReceiptStatus.Confirmed && (
                          <button onClick={() => { if (confirm('Void this receipt? Stock will be reversed.')) voidGR.mutate(gr.id); }} disabled={voidGR.isPending} title="Void Receipt" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all disabled:opacity-50"><XCircle className="w-3.5 h-3.5" /></button>
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
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Goods Receipt" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Purchase Order ID *"><input required value={poId} onChange={e => setPoId(e.target.value)} placeholder="po-uuid" className={inputCls} /></Field>
          <Field label="Warehouse Location"><input value={warehouse} onChange={e => setWarehouse(e.target.value)} placeholder="Warehouse A, Bay 3..." className={inputCls} /></Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-muted">Received Items</label>
              <button type="button" onClick={addLine} className="flex items-center gap-1 px-2 py-1 rounded border border-border-subtle text-xs text-text-secondary hover:bg-bg-surface transition-all"><Plus className="w-3 h-3" /> Add Row</button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="bg-bg-surface rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={l.poLineItemId} onChange={e => setLine(i, 'poLineItemId', e.target.value)} placeholder="PO Line Item ID (optional)" className={inputCls} />
                    <input type="number" min="0" value={l.quantityReceived} onChange={e => setLine(i, 'quantityReceived', e.target.value)} placeholder="Qty received" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={l.condition} onChange={e => setLine(i, 'condition', e.target.value)} className={inputCls}>
                      {Object.entries(GOODS_CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {Number(l.condition) === GoodsCondition.Rejected && (
                      <input type="number" min="0" value={l.rejectedQty} onChange={e => setLine(i, 'rejectedQty', e.target.value)} placeholder="Rejected qty" className={inputCls} />
                    )}
                  </div>
                  {Number(l.condition) !== GoodsCondition.Good && (
                    <input value={l.rejectionReason} onChange={e => setLine(i, 'rejectionReason', e.target.value)} placeholder="Rejection/damage reason" className={inputCls} />
                  )}
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(i)} className="flex items-center gap-1 text-xs text-danger hover:underline"><X className="w-3 h-3" /> Remove row</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createGR.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {createGR.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Receipt'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Detail */}
      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Goods Receipt" wide>
        {selected && (
          <div className="space-y-5">
            <div>
              <div className="font-mono text-xs text-text-muted mb-1">{selected.receiptNumber}</div>
              <div className="font-extrabold text-lg text-text-primary">{selected.vendorName ?? 'Vendor'}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge value={selected.status} labels={GR_STATUS_LABELS} colors={GR_STATUS_COLORS} />
                {selected.poNumber && <span className="text-xs text-text-muted font-mono">PO: {selected.poNumber}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-text-muted block text-xs">Received At</span><span className="text-text-primary">{format(parseISO(selected.receivedAt), 'MMM d, yyyy')}</span></div>
              {selected.warehouseLocation && <div><span className="text-text-muted block text-xs">Warehouse</span><span className="text-text-primary">{selected.warehouseLocation}</span></div>}
            </div>

            {selected.lineItems?.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 block">Received Items ({selected.lineItems.length})</label>
                <div className="bg-bg-surface rounded-xl divide-y divide-border-subtle">
                  {selected.lineItems.map(li => (
                    <div key={li.id} className="px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-text-primary font-medium">Qty: {li.quantityReceived}</span>
                          {li.rejectedQty ? <span className="text-danger text-xs ml-2">Rejected: {li.rejectedQty}</span> : null}
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${li.condition === GoodsCondition.Good ? 'text-success bg-success-soft' : li.condition === GoodsCondition.Damaged ? 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)]' : 'text-danger bg-danger-soft'}`}>
                          {GOODS_CONDITION_LABELS[li.condition]}
                        </span>
                      </div>
                      {li.rejectionReason && <div className="text-xs text-text-muted mt-1">{li.rejectionReason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.notes && <div><label className="text-xs font-semibold text-text-muted mb-1 block">Notes</label><p className="text-sm text-text-secondary bg-bg-surface rounded-xl p-3">{selected.notes}</p></div>}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
              {selected.status === GoodsReceiptStatus.Draft && (
                <button onClick={() => { confirmGR.mutate(selected.id); setSelected(null); }} disabled={confirmGR.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-success bg-success-soft border border-[rgba(34,197,94,0.2)] hover:opacity-80 disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Confirm Receipt
                </button>
              )}
              {selected.status === GoodsReceiptStatus.Confirmed && (
                <button onClick={() => { if (confirm('Void this receipt? Stock adjustments will be reversed.')) { voidGR.mutate(selected.id); setSelected(null); } }} disabled={voidGR.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(244,63,94,0.2)] text-xs font-semibold text-danger bg-danger-soft hover:opacity-80 disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /> Void
                </button>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </>
  );
}
