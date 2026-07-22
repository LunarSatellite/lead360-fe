import { useState, useRef, useEffect } from 'react';
import { Plus, X, Loader2, FileText, CheckCircle, DollarSign, AlertTriangle, XCircle, ShieldCheck, Hash, Calendar, Building2, ChevronDown } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import {
  useSupplierInvoices, useCreateSupplierInvoice, useApproveSupplierInvoice,
  useRecordSupplierInvoicePayment, useDisputeSupplierInvoice, useVoidSupplierInvoice,
  useThreeWayMatch, useActiveVendors,
} from '../api/crm.queries';
import type { SupplierInvoiceDto, SupplierInvoiceCreateRequest, SupplierInvoiceFilter, VendorDto, ThreeWayMatchResult } from '../types/crm.types';
import { SI_STATUS_LABELS, SI_STATUS_COLORS, SupplierInvoiceStatus, THREE_WAY_MATCH_RISK_LABELS } from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>{labels[value] ?? value}</span>;
}

function SlideOver({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`drawer-slide-in relative ${wide ? 'w-[600px]' : 'w-[520px]'} h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle`} style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
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

function isOverdue(inv: SupplierInvoiceDto): boolean {
  if (inv.status === SupplierInvoiceStatus.Overdue) return true;
  if (inv.status === SupplierInvoiceStatus.Received || inv.status === SupplierInvoiceStatus.Approved) {
    return isPast(parseISO(inv.dueDate));
  }
  return false;
}

function NewSupplierInvoiceSlideOver({
  open, onClose, vendorList, form, setVendorId, setInvNumber, setPoId, setIssuedDate, setDueDate, setSubTotal, setTaxAmount, setCurrency, setNotes,
  totalAmount, onSubmit, isPending,
}: {
  open: boolean; onClose: () => void;
  vendorList: VendorDto[];
  form: { vendorId: string; invNumber: string; poId: string; issuedDate: string; dueDate: string; subTotal: string; taxAmount: string; currency: string; notes: string };
  setVendorId: (v: string) => void; setInvNumber: (v: string) => void; setPoId: (v: string) => void;
  setIssuedDate: (v: string) => void; setDueDate: (v: string) => void;
  setSubTotal: (v: string) => void; setTaxAmount: (v: string) => void; setCurrency: (v: string) => void; setNotes: (v: string) => void;
  totalAmount: number; onSubmit: (e: React.FormEvent) => void; isPending: boolean;
}) {
  const [vendorOpen, setVendorOpen] = useState(false);
  const vendorDropRef = useRef<HTMLDivElement>(null);
  const inputStyle = { backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' } as const;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (vendorDropRef.current && !vendorDropRef.current.contains(e.target as Node)) setVendorOpen(false);
    };
    if (open) { document.addEventListener('mousedown', handler); }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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
            <h2 className="text-base font-extrabold leading-tight" style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>New Supplier Invoice</h2>
            <p className="text-xs text-text-muted mt-0.5">Record an incoming invoice from a vendor</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <form id="si-form" onSubmit={onSubmit}>
          {/* ── Invoice Details ── */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Invoice Details</span>
            <div className="h-px bg-brand/20" />
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Vendor *</label>
            <div className="relative" ref={vendorDropRef}>
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none z-10" strokeWidth={1.6} />
              <button
                type="button"
                onClick={() => setVendorOpen(o => !o)}
                className="w-full flex items-center gap-2 pl-9 pr-3 py-2 rounded-xl text-sm text-text-primary text-left"
                style={{
                  backgroundColor: '#1A332C',
                  border: `1px solid ${vendorOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                  boxShadow: vendorOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                  outline: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <span className={`flex-1 font-medium ${form.vendorId ? 'text-text-primary' : 'text-text-muted'}`}>
                  {vendorList.find(v => v.id === form.vendorId)?.name ?? 'Select vendor...'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${vendorOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
              </button>
              {vendorOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                  style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}
                >
                  {vendorList.length === 0 && <div className="px-3 py-2.5 text-sm text-text-muted">No active vendors</div>}
                  {vendorList.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setVendorId(v.id); setVendorOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(0,217,138,0.08)] ${form.vendorId === v.id ? 'bg-[rgba(0,217,138,0.08)]' : ''} text-text-secondary`}
                    >
                      <Building2 className="w-3 h-3 text-text-muted shrink-0" strokeWidth={1.6} />
                      <span className="flex-1 text-left">{v.name}</span>
                      {form.vendorId === v.id && <span className="text-[10px] font-bold text-text-muted">selected</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Invoice Number *</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input required value={form.invNumber} onChange={e => setInvNumber(e.target.value)} placeholder="INV-2024-001"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">PO ID (optional)</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input value={form.poId} onChange={e => setPoId(e.target.value)} placeholder="po-uuid"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Issued Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input required type="date" value={form.issuedDate} onChange={e => setIssuedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', colorScheme: 'dark', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Due Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input required type="date" value={form.dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', colorScheme: 'dark', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
              </div>
            </div>
          </div>

          {/* ── Amount ── */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Amount</span>
            <div className="h-px bg-brand/20" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Subtotal *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input required type="number" min="0" step="0.01" value={form.subTotal} onChange={e => setSubTotal(e.target.value)} placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Tax Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input type="number" min="0" step="0.01" value={form.taxAmount} onChange={e => setTaxAmount(e.target.value)} placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Currency</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input value={form.currency} onChange={e => setCurrency(e.target.value)} placeholder="USD"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={inputStyle} />
              </div>
            </div>
          </div>

          {form.subTotal && (
            <div className="text-right text-sm font-bold text-text-primary">
              Total: {form.currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <textarea value={form.notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Invoice notes, payment terms reminder…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                style={inputStyle} />
            </div>
          </div>
          </form>
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all">Cancel</button>
            <button type="submit" form="si-form" disabled={isPending}
              className="flex-none px-6 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Component() {
  const [filter, setFilter] = useState<SupplierInvoiceFilter>({ page: 1, pageSize: 20 });
  const [statusF, setStatusF] = useState('');
  const [selected, setSelected] = useState<SupplierInvoiceDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [matchResult, setMatchResult] = useState<ThreeWayMatchResult | null>(null);

  // Create form
  const [vendorId, setVendorId] = useState('');
  const [poId, setPoId] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subTotal, setSubTotal] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');

  const { data: raw, isLoading } = useSupplierInvoices(filter);
  const items: SupplierInvoiceDto[] = (raw as any)?.items ?? [];
  const { data: vendors } = useActiveVendors();
  const vendorList: VendorDto[] = (vendors as any) ?? [];

  const createSI = useCreateSupplierInvoice();
  const approveSI = useApproveSupplierInvoice();
  const paySI = useRecordSupplierInvoicePayment();
  const disputeSI = useDisputeSupplierInvoice();
  const voidSI = useVoidSupplierInvoice();
  const threeWayMatch = useThreeWayMatch();

  const totalAmount = (Number(subTotal) || 0) + (Number(taxAmount) || 0);

  const resetCreate = () => { setVendorId(''); setPoId(''); setInvNumber(''); setIssuedDate(''); setDueDate(''); setSubTotal(''); setTaxAmount('0'); setCurrency('USD'); setNotes(''); };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const req: SupplierInvoiceCreateRequest = {
      vendorId, purchaseOrderId: poId.trim() || undefined, invoiceNumber: invNumber.trim(),
      issuedDate, dueDate, subTotal: Number(subTotal), taxAmount: Number(taxAmount),
      totalAmount, currency: currency || 'USD', notes: notes.trim() || undefined,
    };
    createSI.mutate(req, { onSuccess: () => { setShowCreate(false); resetCreate(); } });
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    paySI.mutate({ id: selected.id, data: { paymentReference: payRef.trim() || undefined, paidAt: payDate || undefined } }, {
      onSuccess: () => { setShowPay(false); setPayRef(''); setPayDate(''); setSelected(null); },
    });
  };

  const handleDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    disputeSI.mutate({ id: selected.id, data: { reason: disputeReason } }, {
      onSuccess: () => { setShowDispute(false); setDisputeReason(''); setSelected(null); },
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Supplier Invoices</h2>
            <p className="text-xs text-text-muted mt-0.5">{(raw as any)?.totalCount?.toLocaleString() ?? 0} total</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:opacity-90 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Invoice
          </button>
        </div>

        <div className="flex gap-2">
          <select value={statusF} onChange={e => { setStatusF(e.target.value); setFilter(f => ({ ...f, status: e.target.value ? Number(e.target.value) as SupplierInvoiceStatus : undefined, page: 1 })); }} className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none w-48">
            <option value="">All Statuses</option>
            {Object.entries(SI_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <FileText className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No supplier invoices found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Invoice #', 'Vendor', 'Amount', 'Status', 'Issued', 'Due', 'Paid At', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(inv => {
                  const overdue = isOverdue(inv);
                  return (
                    <tr key={inv.id} onClick={() => setSelected(inv)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-semibold text-brand">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-text-primary">{inv.vendorName ?? inv.vendorId}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{inv.currency} {inv.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {overdue
                          ? <span className="px-2 py-0.5 rounded-md text-xs font-semibold border bg-danger-soft text-danger border-danger">Overdue</span>
                          : <Badge value={inv.status} labels={SI_STATUS_LABELS} colors={SI_STATUS_COLORS} />
                        }
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(inv.issuedDate), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(inv.dueDate), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{inv.paidAt ? format(parseISO(inv.paidAt), 'MMM d, yyyy') : '—'}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {inv.status === SupplierInvoiceStatus.Received && (
                            <button onClick={() => approveSI.mutate(inv.id)} disabled={approveSI.isPending} title="Approve" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all disabled:opacity-50"><CheckCircle className="w-3.5 h-3.5" /></button>
                          )}
                          {(inv.status === SupplierInvoiceStatus.Approved || inv.status === SupplierInvoiceStatus.Overdue || inv.status === SupplierInvoiceStatus.PartiallyPaid) && (
                            <button onClick={() => { setSelected(inv); setShowPay(true); }} title="Record Payment" className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success-soft transition-all"><DollarSign className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create */}
      <NewSupplierInvoiceSlideOver
        open={showCreate}
        onClose={() => setShowCreate(false)}
        vendorList={vendorList}
        form={{ vendorId, invNumber, poId, issuedDate, dueDate, subTotal, taxAmount, currency, notes }}
        setVendorId={setVendorId} setInvNumber={setInvNumber} setPoId={setPoId}
        setIssuedDate={setIssuedDate} setDueDate={setDueDate}
        setSubTotal={setSubTotal} setTaxAmount={setTaxAmount} setCurrency={setCurrency} setNotes={setNotes}
        totalAmount={totalAmount}
        onSubmit={handleCreate}
        isPending={createSI.isPending}
      />

      {/* Detail */}
      <SlideOver open={!!selected && !showPay && !showDispute} onClose={() => setSelected(null)} title={`Invoice ${selected?.invoiceNumber ?? ''}`} wide>
        {selected && (
          <div className="space-y-5">
            <div>
              <div className="font-extrabold text-lg text-text-primary">{selected.vendorName}</div>
              <div className="flex items-center gap-2 mt-2">
                {isOverdue(selected)
                  ? <span className="px-2 py-0.5 rounded-md text-xs font-semibold border bg-danger-soft text-danger border-danger">Overdue</span>
                  : <Badge value={selected.status} labels={SI_STATUS_LABELS} colors={SI_STATUS_COLORS} />
                }
                {selected.poNumber && <span className="text-xs text-text-muted font-mono">PO: {selected.poNumber}</span>}
              </div>
            </div>

            <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>{selected.currency} {selected.subTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Tax</span><span>{selected.currency} {selected.taxAmount.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t border-border-subtle pt-2"><span>Total</span><span>{selected.currency} {selected.totalAmount.toLocaleString()}</span></div>
              {selected.paidAt && <div className="flex justify-between text-success text-xs"><span>Paid</span><span>{format(parseISO(selected.paidAt), 'MMM d, yyyy')}{selected.paymentReference ? ` — ${selected.paymentReference}` : ''}</span></div>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-text-muted block text-xs">Issued</span><span className="text-text-primary">{format(parseISO(selected.issuedDate), 'MMM d, yyyy')}</span></div>
              <div><span className="text-text-muted block text-xs">Due</span><span className={isOverdue(selected) ? 'text-danger font-semibold' : 'text-text-primary'}>{format(parseISO(selected.dueDate), 'MMM d, yyyy')}</span></div>
            </div>

            {selected.notes && <div><label className="text-xs font-semibold text-text-muted mb-1 block">Notes</label><p className="text-sm text-text-secondary bg-bg-surface rounded-xl p-3">{selected.notes}</p></div>}

            <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
              {selected.purchaseOrderId && (selected.status === SupplierInvoiceStatus.Received || selected.status === SupplierInvoiceStatus.Approved) && (
                <button onClick={() => threeWayMatch.mutate(selected.id, { onSuccess: (res: any) => setMatchResult(res) })} disabled={threeWayMatch.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50">
                  {threeWayMatch.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Run Match
                </button>
              )}
              {selected.status === SupplierInvoiceStatus.Received && (
                <button onClick={() => { approveSI.mutate(selected.id); setSelected(null); }} disabled={approveSI.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-success bg-success-soft border border-[rgba(34,197,94,0.2)] hover:opacity-80 disabled:opacity-50">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
              )}
              {(selected.status === SupplierInvoiceStatus.Approved || selected.status === SupplierInvoiceStatus.Overdue || selected.status === SupplierInvoiceStatus.PartiallyPaid) && (
                <button onClick={() => setShowPay(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-success transition-all">
                  <DollarSign className="w-3.5 h-3.5" /> Record Payment
                </button>
              )}
              {selected.status !== SupplierInvoiceStatus.Disputed && selected.status !== SupplierInvoiceStatus.Paid && selected.status !== SupplierInvoiceStatus.Void && (
                <button onClick={() => setShowDispute(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(245,158,11,0.3)] text-xs font-semibold text-[#F59E0B] bg-[rgba(245,158,11,0.08)] hover:opacity-80">
                  <AlertTriangle className="w-3.5 h-3.5" /> Dispute
                </button>
              )}
              {selected.status !== SupplierInvoiceStatus.Void && selected.status !== SupplierInvoiceStatus.Paid && (
                <button onClick={() => { if (confirm('Void this invoice?')) { voidSI.mutate(selected.id); setSelected(null); } }} disabled={voidSI.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(244,63,94,0.2)] text-xs font-semibold text-danger bg-danger-soft hover:opacity-80 disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /> Void
                </button>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Pay */}
      <SlideOver open={showPay} onClose={() => setShowPay(false)} title="Record Payment">
        <form onSubmit={handlePay} className="space-y-4">
          {selected && <p className="text-sm text-text-muted">Invoice <span className="font-semibold text-text-primary">{selected.invoiceNumber}</span> — {selected.currency} {selected.totalAmount.toLocaleString()}</p>}
          <Field label="Payment Reference"><input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Bank ref, cheque no..." className={inputCls} /></Field>
          <Field label="Paid At"><input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className={inputCls} /></Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={paySI.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {paySI.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4" /> Mark Paid</>}
            </button>
            <button type="button" onClick={() => setShowPay(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Dispute */}
      <SlideOver open={showDispute} onClose={() => setShowDispute(false)} title="Dispute Invoice">
        <form onSubmit={handleDispute} className="space-y-4">
          {selected && <p className="text-sm text-text-muted">Invoice <span className="font-semibold text-text-primary">{selected.invoiceNumber}</span></p>}
          <Field label="Dispute Reason *"><textarea required value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="Describe the dispute..." /></Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={disputeSI.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#F59E0B] text-bg text-sm font-bold hover:opacity-90 disabled:opacity-50">
              {disputeSI.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Dispute'}
            </button>
            <button type="button" onClick={() => setShowDispute(false)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          </div>
        </form>
      </SlideOver>

      {/* Three-Way Match result */}
      {matchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-bg border border-border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Three-Way Match — {THREE_WAY_MATCH_RISK_LABELS[matchResult.riskLevel]}
            </h3>

            {matchResult.riskLevel === 0 ? (
              <p className="text-sm text-text-muted">This invoice has no linked purchase order — nothing to match against.</p>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">Invoiced Amount</span><span className="text-text-primary font-medium">{matchResult.invoicedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Expected (PO × Received)</span><span className="text-text-primary font-medium">{matchResult.expectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between font-bold border-t border-border-subtle pt-2">
                    <span>Variance</span>
                    <span className={matchResult.varianceAmount === 0 ? 'text-text-primary' : matchResult.varianceAmount > 0 ? 'text-danger' : 'text-success'}>
                      {matchResult.varianceAmount > 0 ? '+' : ''}{matchResult.varianceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({matchResult.variancePercent}%)
                    </span>
                  </div>
                </div>

                {matchResult.lines.length > 0 && (
                  <div className="bg-bg-surface rounded-xl divide-y divide-border-subtle max-h-48 overflow-y-auto">
                    {matchResult.lines.map(l => (
                      <div key={l.poLineItemId} className="flex justify-between items-center px-3 py-2 text-xs">
                        <div>
                          <span className="font-medium text-text-primary">{l.productName}</span>
                          <div className="text-text-muted">{l.quantityReceived}/{l.quantityOrdered} received @ {l.unitCost}</div>
                        </div>
                        <span className="text-text-secondary">{l.expectedLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                )}

                {matchResult.riskLevel === 3 && (
                  <div className="px-3 py-2 rounded-lg bg-danger-soft border border-danger text-xs text-danger">
                    Major variance — verify with the vendor before approving payment.
                  </div>
                )}
                {matchResult.riskLevel === 2 && (
                  <div className="px-3 py-2 rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] text-xs text-[#F59E0B]">
                    Minor variance — within tolerance, but worth a second look.
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setMatchResult(null)} className="px-4 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
