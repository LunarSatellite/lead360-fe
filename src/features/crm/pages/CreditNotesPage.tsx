import { useState } from 'react';
import { X, Loader2, Receipt, CheckCircle, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCreditNotes, useApplyCreditNote, useRefundCreditNote, useInvoices } from '../api/crm.queries';
import type { CrmCreditNoteDto, CrmCreditNoteFilter } from '../types/crm.types';
import { CREDIT_NOTE_STATUS_LABELS, CREDIT_NOTE_STATUS_COLORS, CREDIT_NOTE_APPLY_METHOD_LABELS, CreditNoteStatus, CreditNoteApplyMethod } from '../types/crm.types';

const inputCls = 'w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/40';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>{labels[value] ?? value}</span>;
}

function SlideOver({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[520px] h-full flex flex-col bg-bg-shell border-l border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ApplyForm({ note, onDone }: { note: CrmCreditNoteDto; onDone: () => void }) {
  const [search, setSearch] = useState('');
  const [targetInvoiceId, setTargetInvoiceId] = useState('');
  const apply = useApplyCreditNote();
  const { data: raw } = useInvoices({ search: search || undefined, page: 1, pageSize: 10 });
  const results = (raw as any)?.items ?? [];

  const handleApply = () => {
    if (!targetInvoiceId) return;
    apply.mutate({ id: note.id, data: { targetInvoiceId } }, { onSuccess: onDone });
  };

  return (
    <div className="space-y-3 bg-bg-surface rounded-xl p-4 mt-3">
      <p className="text-xs font-semibold text-text-muted">Apply to Invoice</p>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice number..." className={inputCls} />
      {results.length > 0 && (
        <div className="rounded-lg border border-border-subtle divide-y divide-border-subtle max-h-40 overflow-y-auto">
          {results.map((inv: any) => (
            <button key={inv.id} onClick={() => setTargetInvoiceId(inv.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-elevated transition-colors ${targetInvoiceId === inv.id ? 'bg-brand-soft text-brand font-semibold' : 'text-text-secondary'}`}>
              {inv.invoiceNumber} — {inv.currency} {inv.totalAmount.toLocaleString()}
            </button>
          ))}
        </div>
      )}
      <button onClick={handleApply} disabled={!targetInvoiceId || apply.isPending} className="w-full py-2 rounded-lg bg-brand text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
        {apply.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Apply Credit Note'}
      </button>
    </div>
  );
}

function RefundForm({ note, onDone }: { note: CrmCreditNoteDto; onDone: () => void }) {
  const [reference, setReference] = useState('');
  const refund = useRefundCreditNote();

  return (
    <div className="space-y-3 bg-bg-surface rounded-xl p-4 mt-3">
      <p className="text-xs font-semibold text-text-muted">Record Refund</p>
      <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Payment reference (optional)" className={inputCls} />
      <button onClick={() => refund.mutate({ id: note.id, data: { refundReference: reference.trim() || undefined } }, { onSuccess: onDone })}
        disabled={refund.isPending} className="w-full py-2 rounded-lg bg-success text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
        {refund.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Mark Refunded'}
      </button>
    </div>
  );
}

function DetailPanel({ note }: { note: CrmCreditNoteDto }) {
  const [showApply, setShowApply] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">{note.creditNoteNumber}</div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge value={note.status} labels={CREDIT_NOTE_STATUS_LABELS} colors={CREDIT_NOTE_STATUS_COLORS} />
          <span className="text-xs text-text-muted bg-bg-surface px-2 py-0.5 rounded-full">{CREDIT_NOTE_APPLY_METHOD_LABELS[note.applyMethod]}</span>
        </div>
      </div>

      <div className="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-text-muted">Account</span><span className="text-text-primary">{note.accountName ?? note.accountId}</span></div>
        <div className="flex justify-between"><span className="text-text-muted">Amount</span><span className="text-text-primary font-bold">{note.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
        <div className="flex justify-between"><span className="text-text-muted">Original Invoice</span><span className="text-text-primary">{note.originalInvoiceNumber ?? note.originalInvoiceId}</span></div>
        {note.appliedToInvoiceNumber && <div className="flex justify-between"><span className="text-text-muted">Applied To</span><span className="text-success">{note.appliedToInvoiceNumber}</span></div>}
        {note.refundReference && <div className="flex justify-between"><span className="text-text-muted">Refund Ref</span><span className="font-mono text-xs">{note.refundReference}</span></div>}
        <div className="flex justify-between text-xs"><span className="text-text-muted">Issued</span><span>{format(parseISO(note.issuedAt), 'MMM d, yyyy')}</span></div>
        {note.appliedAt && <div className="flex justify-between text-xs"><span className="text-text-muted">Applied</span><span>{format(parseISO(note.appliedAt), 'MMM d, yyyy')}</span></div>}
        {note.refundedAt && <div className="flex justify-between text-xs"><span className="text-text-muted">Refunded</span><span>{format(parseISO(note.refundedAt), 'MMM d, yyyy')}</span></div>}
      </div>

      <div>
        <label className="text-xs font-semibold text-text-muted mb-1 block">Reason</label>
        <p className="text-sm text-text-secondary bg-bg-surface rounded-xl p-3">{note.reason}</p>
      </div>

      {note.status === CreditNoteStatus.Issued && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
          {(note.applyMethod === CreditNoteApplyMethod.AccountBalance || note.applyMethod === CreditNoteApplyMethod.NextInvoice) && (
            <button onClick={() => setShowApply(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-brand hover:bg-brand-soft transition-all">
              <CheckCircle className="w-3.5 h-3.5" /> Apply to Invoice
            </button>
          )}
          {note.applyMethod === CreditNoteApplyMethod.CashRefund && (
            <button onClick={() => setShowRefund(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-success bg-success-soft border border-[rgba(34,197,94,0.2)] hover:opacity-80 transition-all">
              <Wallet className="w-3.5 h-3.5" /> Record Refund
            </button>
          )}
        </div>
      )}

      {showApply && <ApplyForm note={note} onDone={() => setShowApply(false)} />}
      {showRefund && <RefundForm note={note} onDone={() => setShowRefund(false)} />}
    </div>
  );
}

export function Component() {
  const [filter, setFilter] = useState<CrmCreditNoteFilter>({ page: 1, pageSize: 20 });
  const [statusF, setStatusF] = useState('');
  const [selected, setSelected] = useState<CrmCreditNoteDto | null>(null);

  const { data: raw, isLoading } = useCreditNotes(filter);
  const items: CrmCreditNoteDto[] = (raw as any)?.items ?? [];
  const total: number = (raw as any)?.totalCount ?? 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Credit Notes</h2>
            <p className="text-xs text-text-muted mt-0.5">{total.toLocaleString()} total</p>
          </div>
        </div>

        <div className="flex gap-2">
          <select value={statusF} onChange={e => { setStatusF(e.target.value); setFilter(f => ({ ...f, status: e.target.value ? Number(e.target.value) as CreditNoteStatus : undefined, page: 1 })); }} className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none w-48">
            <option value="">All Statuses</option>
            {Object.entries(CREDIT_NOTE_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : !items.length ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-text-muted">
              <Receipt className="w-8 h-8 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">No credit notes.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Number', 'Account', 'Amount', 'Status', 'Method', 'Issued'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(n => (
                  <tr key={n.id} onClick={() => setSelected(n)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{n.creditNoteNumber}</td>
                    <td className="px-4 py-3 text-text-primary">{n.accountName ?? n.accountId}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{n.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3"><Badge value={n.status} labels={CREDIT_NOTE_STATUS_LABELS} colors={CREDIT_NOTE_STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-text-muted text-xs">{CREDIT_NOTE_APPLY_METHOD_LABELS[n.applyMethod]}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(n.issuedAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > (filter.pageSize ?? 20) && (
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button disabled={filter.page === 1} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) - 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Prev</button>
              <button disabled={(filter.page ?? 1) * (filter.pageSize ?? 20) >= total} onClick={() => setFilter(f => ({ ...f, page: (f.page ?? 1) + 1 }))} className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Credit Note">
        {selected && <DetailPanel note={selected} />}
      </SlideOver>
    </>
  );
}
