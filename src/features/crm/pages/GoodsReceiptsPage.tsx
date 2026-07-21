import { useState, useRef, useEffect } from 'react';
import { Plus, X, Loader2, PackageCheck, CheckCircle, XCircle, Hash, MapPin, FileText, PlusCircle, ChevronDown, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  useGoodsReceipts, useCreateGoodsReceipt, useConfirmGoodsReceipt, useVoidGoodsReceipt,
} from '../api/crm.queries';
import type { GoodsReceiptDto, GoodsReceiptCreateRequest, GoodsReceiptLineItemRequest, GoodsReceiptFilter } from '../types/crm.types';
import { GR_STATUS_LABELS, GR_STATUS_COLORS, GOODS_CONDITION_LABELS, GoodsCondition, GoodsReceiptStatus } from '../types/crm.types';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>{labels[value] ?? value}</span>;
}

function SlideOver({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="drawer-slide-in relative flex flex-col overflow-hidden"
        style={{
          width: '640px',
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h2
              className="text-base font-extrabold leading-tight"
              style={{
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>{children}</div>;
}

type GrLine = { poLineItemId: string; quantityReceived: string; condition: string; rejectedQty: string; rejectionReason: string };
const emptyGrLine = (): GrLine => ({ poLineItemId: '', quantityReceived: '1', condition: '1', rejectedQty: '0', rejectionReason: '' });

const inputStyle = { backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' } as const;

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
  const [conditionDropOpen, setConditionDropOpen] = useState<number | null>(null);
  const conditionDropRef = useRef<HTMLDivElement>(null);

  // Close condition dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (conditionDropRef.current && !conditionDropRef.current.contains(e.target as Node)) {
        setConditionDropOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      <SlideOver open={showCreate} onClose={() => setShowCreate(false)} title="New Goods Receipt" subtitle="Record incoming inventory from a purchase order"
        footer={
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="gr-form" disabled={createGR.isPending}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {createGR.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Receipt'}
            </button>
          </div>
        }
      >
        <form id="gr-form" onSubmit={handleCreate} className="space-y-4">
          {/* ── Receipt Info ── */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Receipt Info</span>
            <div className="h-px bg-brand/20" />
          </div>

          <Field label="Purchase Order ID *">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input required value={poId} onChange={e => setPoId(e.target.value)} placeholder="po-uuid"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={inputStyle} />
            </div>
          </Field>

          <Field label="Warehouse Location">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input value={warehouse} onChange={e => setWarehouse(e.target.value)} placeholder="Warehouse A, Bay 3..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={inputStyle} />
            </div>
          </Field>

          {/* ── Received Items ── */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Received Items</span>
            <div className="h-px bg-brand/20" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-secondary">Items</label>
              <button type="button" onClick={addLine} className="flex items-center gap-1 px-2 py-1 rounded border border-border-subtle text-xs text-text-secondary hover:bg-bg-surface transition-all"><PlusCircle className="w-3 h-3" /> Add Row</button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="bg-glass-1 border-thin border-border-subtle rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" strokeWidth={1.6} />
                      <input value={l.poLineItemId} onChange={e => setLine(i, 'poLineItemId', e.target.value)} placeholder="PO Line Item ID"
                        className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                        style={inputStyle} />
                    </div>
                    <div className="relative">
                      <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" strokeWidth={1.6} />
                      <input type="number" min="0" value={l.quantityReceived} onChange={e => setLine(i, 'quantityReceived', e.target.value)} placeholder="Qty received"
                        className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                        style={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Condition dropdown */}
                    <div className="relative" ref={conditionDropRef}>
                      <PackageCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none z-10" strokeWidth={1.6} />
                      <button
                        type="button"
                        onClick={() => setConditionDropOpen(conditionDropOpen === i ? null : i)}
                        className="w-full flex items-center gap-2 pl-8 pr-2 py-1.5 rounded-xl text-sm text-text-primary text-left"
                        style={{
                          backgroundColor: '#1A332C',
                          border: `1px solid ${conditionDropOpen === i ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                          boxShadow: conditionDropOpen === i
                            ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)'
                            : 'none',
                          outline: 'none',
                          transition: 'box-shadow 0.2s ease',
                        }}
                      >
                        <span className={`flex-1 font-medium ${
                          Number(l.condition) === GoodsCondition.Good ? 'text-success' :
                          Number(l.condition) === GoodsCondition.Damaged ? 'text-[#F59E0B]' :
                          Number(l.condition) === GoodsCondition.Rejected ? 'text-danger' : 'text-text-secondary'
                        }`}>
                          {GOODS_CONDITION_LABELS[Number(l.condition) as GoodsCondition]}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${conditionDropOpen === i ? 'rotate-180' : ''}`} strokeWidth={1.6} />
                      </button>
                      {conditionDropOpen === i && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                          style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}
                        >
                          {([
                            { value: GoodsCondition.Good, label: GOODS_CONDITION_LABELS[GoodsCondition.Good], dot: '#10B981', text: 'text-success', hover: 'hover:bg-[rgba(16,185,129,0.08)]' },
                            { value: GoodsCondition.Damaged, label: GOODS_CONDITION_LABELS[GoodsCondition.Damaged], dot: '#F59E0B', text: 'text-[#F59E0B]', hover: 'hover:bg-[rgba(245,158,11,0.10)]' },
                            { value: GoodsCondition.Rejected, label: GOODS_CONDITION_LABELS[GoodsCondition.Rejected], dot: '#F43F5E', text: 'text-danger', hover: 'hover:bg-[rgba(244,63,94,0.10)]' },
                          ] as const).map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setLine(i, 'condition', String(opt.value)); setConditionDropOpen(null); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors ${opt.hover} ${opt.text} ${Number(l.condition) === opt.value ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.dot, boxShadow: `0 0 6px ${opt.dot}` }} />
                              {opt.label}
                              {Number(l.condition) === opt.value && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {Number(l.condition) === GoodsCondition.Rejected && (
                      <div className="relative">
                        <XCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" strokeWidth={1.6} />
                        <input type="number" min="0" value={l.rejectedQty} onChange={e => setLine(i, 'rejectedQty', e.target.value)} placeholder="Rejected qty"
                          className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                          style={inputStyle} />
                      </div>
                    )}
                  </div>
                  {Number(l.condition) !== GoodsCondition.Good && (
                    <div className="relative">
                      <FileText className="absolute left-2.5 top-3 w-3 h-3 text-text-muted pointer-events-none" strokeWidth={1.6} />
                      <input value={l.rejectionReason} onChange={e => setLine(i, 'rejectionReason', e.target.value)} placeholder="Rejection/damage reason"
                        className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                        style={inputStyle} />
                    </div>
                  )}
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(i)} className="flex items-center gap-1 text-xs text-danger hover:underline"><X className="w-3 h-3" /> Remove row</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field label="Notes">
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Delivery notes, carrier info, exceptions…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                style={inputStyle} />
            </div>
          </Field>
        </form>
      </SlideOver>

      {/* Detail */}
      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Goods Receipt" subtitle="Receipt details and actions">
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
