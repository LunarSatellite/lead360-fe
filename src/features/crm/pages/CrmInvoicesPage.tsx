import { useState } from 'react';
import { Plus, X, Loader2, Receipt, DollarSign, Send, Link2 } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { toast } from 'sonner';
import {
  useInvoices, useGenerateInvoiceFromDeal, useRecordPayment,
  useDisputeInvoice, useSendInvoice, useVoidInvoice, useGenerateInvoicePaymentLink,
} from '../api/crm.queries';
import type {
  CrmInvoiceSummaryDto, CrmInvoiceFilter, CrmRecordPaymentRequest,
} from '../types/crm.types';
import {
  CrmInvoiceStatus, CrmPaymentMethod,
  CRM_INVOICE_STATUS_LABELS, CRM_INVOICE_STATUS_COLORS, CRM_PAYMENT_METHOD_LABELS,
} from '../types/crm.types';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';
const selectCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function SlideOver({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 flex flex-col bg-bg-elevated shadow-2xl border-thin border-border-subtle rounded-card max-h-[90vh] ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-card text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function isOverdue(inv: CrmInvoiceSummaryDto): boolean {
  if (inv.status === CrmInvoiceStatus.Overdue) return true;
  if (inv.status === CrmInvoiceStatus.Sent && inv.dueDate && isPast(parseISO(inv.dueDate))) return true;
  return false;
}

export function Component() {
  const [filter, setFilter] = useState<CrmInvoiceFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CrmInvoiceSummaryDto | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genDealId, setGenDealId] = useState('');

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<CrmPaymentMethod>(CrmPaymentMethod.BankTransfer);
  const [payDate, setPayDate] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const { data: raw, isLoading } = useInvoices(filter);
  const items: CrmInvoiceSummaryDto[] = (raw as any)?.items ?? [];

  const generateFromDeal = useGenerateInvoiceFromDeal();
  const recordPayment = useRecordPayment();
  const disputeInvoice = useDisputeInvoice();
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const genPayLink = useGenerateInvoicePaymentLink();

  function handleGenerate() {
    if (!genDealId.trim()) return;
    generateFromDeal.mutate(genDealId.trim(), { onSuccess: () => { setGenOpen(false); setGenDealId(''); } });
  }

  function handleRecordPayment() {
    if (!selected || !payAmount) return;
    const data: CrmRecordPaymentRequest = {
      amount: Number(payAmount),
      paymentMethod: payMethod,
      paidAt: payDate || undefined,
      notes: payNotes || undefined,
    };
    recordPayment.mutate({ id: selected.id, data }, {
      onSuccess: () => { setPayAmount(''); setPayDate(''); setPayNotes(''); setSelected(null); },
    });
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Invoices</h2>
          <p className="text-xs text-text-muted mt-0.5">{(raw as any)?.totalCount?.toLocaleString() ?? 0} total</p>
        </div>
        <button onClick={() => setGenOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Generate from Deal
        </button>
      </div>

      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter(f => ({ ...f, search: search || undefined, page: 1 }))}
          placeholder="Search invoices..." className={inputCls + ' flex-1'} />
        <select className={selectCls + ' w-44'} value={filter.status ?? ''} onChange={e => setFilter(f => ({ ...f, status: e.target.value ? Number(e.target.value) as any : undefined, page: 1 }))}>
          <option value="">All Statuses</option>
          {Object.entries(CRM_INVOICE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <Receipt className="w-8 h-8 opacity-30" strokeWidth={1.2} />
            <p className="text-sm">No invoices found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Invoice #', 'Account / Deal', 'Amount', 'Currency', 'Status', 'Due Date', 'Paid At'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((inv: CrmInvoiceSummaryDto) => {
                const overdue = isOverdue(inv);
                return (
                  <tr key={inv.id} onClick={() => setSelected(inv)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-semibold text-brand">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary font-medium">{inv.accountName ?? inv.dealName ?? '—'}</div>
                      {inv.accountName && inv.dealName && <div className="text-xs text-text-muted">{inv.dealName}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{inv.currency}</td>
                    <td className="px-4 py-3">
                      {overdue
                        ? <span className="px-2 py-0.5 rounded-md text-xs font-semibold border bg-danger-soft text-danger border-danger">Overdue</span>
                        : <Badge value={inv.status} labels={CRM_INVOICE_STATUS_LABELS} colors={CRM_INVOICE_STATUS_COLORS} />
                      }
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{inv.dueDate ? format(parseISO(inv.dueDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{inv.paidAt ? format(parseISO(inv.paidAt), 'MMM d, yyyy') : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail SlideOver */}
      <SlideOver open={!!selected} onClose={() => setSelected(null)} title={`Invoice ${selected?.invoiceNumber ?? ''}`} wide>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                {isOverdue(selected)
                  ? <span className="px-2 py-0.5 rounded-md text-xs font-semibold border bg-danger-soft text-danger border-danger">Overdue</span>
                  : <Badge value={selected.status} labels={CRM_INVOICE_STATUS_LABELS} colors={CRM_INVOICE_STATUS_COLORS} />
                }
              </Field>
              <Field label="Amount"><span className="font-semibold text-text-primary">{selected.currency} {selected.totalAmount.toLocaleString()}</span></Field>
              <Field label="Account / Deal"><span className="text-text-secondary text-sm">{selected.accountName ?? selected.dealName ?? '—'}</span></Field>
              <Field label="Due Date"><span className="text-text-secondary text-sm">{selected.dueDate ? format(parseISO(selected.dueDate), 'MMM d, yyyy') : '—'}</span></Field>
              <Field label="Paid At"><span className="text-text-secondary text-sm">{selected.paidAt ? format(parseISO(selected.paidAt), 'MMM d, yyyy') : '—'}</span></Field>
            </div>

            {/* Record Payment */}
            <div className="border border-border-subtle rounded-xl p-4 space-y-3 bg-bg-subtle">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Record Payment
              </p>
              <Field label="Amount">
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inputCls} placeholder="0.00" min={0} step={0.01} />
              </Field>
              <Field label="Payment Method">
                <select value={payMethod} onChange={e => setPayMethod(Number(e.target.value) as CrmPaymentMethod)} className={selectCls}>
                  {Object.entries(CRM_PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Paid At">
                <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Notes">
                <textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} rows={2} className={inputCls} placeholder="Optional notes..." />
              </Field>
              <button onClick={handleRecordPayment} disabled={recordPayment.isPending || !payAmount}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-success-soft text-success text-sm font-bold hover:bg-success hover:text-bg disabled:opacity-60 transition-all border border-success">
                {recordPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />} Record Payment
              </button>
            </div>

            {/* Send action for Draft invoices */}
            {selected.status === CrmInvoiceStatus.Draft && (
              <button onClick={() => { sendInvoice.mutate(selected.id); setSelected(null); }} disabled={sendInvoice.isPending}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
                {sendInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Invoice
              </button>
            )}

            {/* Payment link — share a pay-online URL with the customer */}
            {selected.status !== CrmInvoiceStatus.Paid && selected.status !== CrmInvoiceStatus.Void && (
              <button
                onClick={() => genPayLink.mutate(selected.id, {
                  onSuccess: (tk) => {
                    const url = `${window.location.origin}/pay/${tk}`;
                    navigator.clipboard?.writeText(url).catch(() => {});
                    toast.success('Payment link copied to clipboard');
                  },
                })}
                disabled={genPayLink.isPending}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-border-medium text-text-secondary bg-bg-elevated hover:bg-bg-card hover:text-text-primary disabled:opacity-60 transition-all text-sm font-bold">
                {genPayLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Copy payment link
              </button>
            )}

            {/* Dispute & Void actions */}
            <div className="flex gap-3">
              <button
                onClick={() => disputeInvoice.mutate(selected.id)}
                disabled={disputeInvoice.isPending || selected.status === CrmInvoiceStatus.Disputed}
                className="flex-1 py-2 rounded-xl text-sm font-bold border border-[#F59E0B] text-[#92400E] bg-[#FEF3C7] hover:bg-[#FDE68A] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {disputeInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Dispute'}
              </button>
              <button
                onClick={() => { if (confirm('Void this invoice?')) { voidInvoice.mutate(selected.id); setSelected(null); } }}
                disabled={voidInvoice.isPending || selected.status === CrmInvoiceStatus.Void}
                className="flex-1 py-2 rounded-xl text-sm font-bold border border-border-subtle text-text-secondary bg-bg-elevated hover:bg-bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {voidInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Void'}
              </button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Generate from Deal SlideOver */}
      <SlideOver open={genOpen} onClose={() => { setGenOpen(false); setGenDealId(''); }} title="Generate Invoice from Deal">
        <Field label="Deal ID *">
          <input value={genDealId} onChange={e => setGenDealId(e.target.value)} className={inputCls} placeholder="Enter Deal ID" />
        </Field>
        <button onClick={handleGenerate} disabled={generateFromDeal.isPending || !genDealId.trim()}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
          {generateFromDeal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Generate Invoice
        </button>
      </SlideOver>
    </div>
  );
}
