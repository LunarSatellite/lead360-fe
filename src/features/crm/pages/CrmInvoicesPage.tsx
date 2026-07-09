import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Loader2, Receipt, DollarSign, Send, Link2, Bell, Pause, Play } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { toast } from 'sonner';
import { confirmDialog } from '@/shared/ui/confirm';
import {
  useInvoices, useGenerateInvoiceFromDeal, useGenerateInvoiceFromOrder, useRecordPayment,
  useDisputeInvoice, useSendInvoice, useDraftInvoiceSendEmail, useVoidInvoice, useGenerateInvoicePaymentLink,
  useIssueCreditNote, useDunningHistory, usePauseDunning, useResumeDunning, useSendReminderNow,
} from '../api/crm.queries';
import { AiSendPreviewModal } from '../components/AiSendPreviewModal';
import type {
  CrmInvoiceSummaryDto, CrmInvoiceFilter, CrmRecordPaymentRequest, CreditNoteApplyMethod,
  DunningPauseReason,
} from '../types/crm.types';
import {
  CrmInvoiceStatus, CrmPaymentMethod,
  CRM_INVOICE_STATUS_LABELS, CRM_INVOICE_STATUS_COLORS, CRM_PAYMENT_METHOD_LABELS,
  CreditNoteApplyMethod as CNApplyMethod, CREDIT_NOTE_APPLY_METHOD_LABELS,
  DunningEventKind, DunningPauseReason as PauseReasonEnum,
  DUNNING_STAGE_LABELS, DUNNING_EVENT_KIND_LABELS, DUNNING_PAUSE_REASON_LABELS,
} from '../types/crm.types';

function balanceDue(inv: CrmInvoiceSummaryDto): number {
  return inv.totalAmount - (inv.amountPaid ?? 0) - (inv.creditAppliedAmount ?? 0);
}

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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`drawer-slide-in relative ${wide ? 'w-[600px]' : 'w-[520px]'} h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle`} style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
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

function RemindersSection({ invoiceId }: { invoiceId: string }) {
  const [showPause, setShowPause] = useState(false);
  const [pauseReason, setPauseReason] = useState<DunningPauseReason>(PauseReasonEnum.ManualHold);
  const [pauseUntil, setPauseUntil] = useState('');

  const { data: history, isLoading } = useDunningHistory(invoiceId);
  const events = (history as any) ?? [];
  const pause = usePauseDunning();
  const resume = useResumeDunning();
  const sendNow = useSendReminderNow();

  const latest = events[0];
  const isPaused = latest?.kind === DunningEventKind.Paused;

  return (
    <div className="border border-border-subtle rounded-xl p-4 space-y-3 bg-bg-subtle">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Reminders
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => sendNow.mutate(invoiceId)} disabled={sendNow.isPending}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-text-secondary hover:text-brand hover:bg-brand-soft transition-all disabled:opacity-50">
            {sendNow.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send Now
          </button>
          {isPaused ? (
            <button onClick={() => resume.mutate(invoiceId)} disabled={resume.isPending}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-success hover:bg-success-soft transition-all disabled:opacity-50">
              {resume.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Resume
            </button>
          ) : (
            <button onClick={() => setShowPause(v => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-text-secondary hover:text-[#F59E0B] transition-all">
              <Pause className="w-3 h-3" /> Pause
            </button>
          )}
        </div>
      </div>

      {isPaused && (
        <div className="px-2 py-1.5 rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] text-xs text-[#F59E0B]">
          Paused — {latest.pauseReason ? DUNNING_PAUSE_REASON_LABELS[latest.pauseReason as DunningPauseReason] : 'reason not set'}
          {latest.pausedUntil && ` until ${format(parseISO(latest.pausedUntil), 'MMM d, yyyy')}`}
        </div>
      )}

      {showPause && (
        <div className="space-y-2 pt-1">
          <select value={pauseReason} onChange={e => setPauseReason(Number(e.target.value) as DunningPauseReason)} className={selectCls}>
            {Object.entries(DUNNING_PAUSE_REASON_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input type="date" value={pauseUntil} onChange={e => setPauseUntil(e.target.value)} className={inputCls} placeholder="Paused until (optional)" />
          <button onClick={() => pause.mutate({ id: invoiceId, data: { reason: pauseReason, until: pauseUntil || undefined } }, { onSuccess: () => setShowPause(false) })}
            disabled={pause.isPending} className="w-full py-1.5 rounded-lg bg-[#F59E0B] text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
            {pause.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Confirm Pause'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-3 text-text-muted"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : !events.length ? (
        <p className="text-xs text-text-muted">No reminders sent yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {events.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-bg-surface">
              <div>
                <span className="font-semibold text-text-primary">{DUNNING_EVENT_KIND_LABELS[e.kind as import('../types/crm.types').DunningEventKind] ?? e.kind}</span>
                {e.kind === DunningEventKind.ReminderSent && (
                  <span className="text-text-muted ml-1.5">— {DUNNING_STAGE_LABELS[e.stage as import('../types/crm.types').DunningStage] ?? e.stage}</span>
                )}
                {e.channel && <span className="text-text-muted ml-1.5">via {e.channel}</span>}
              </div>
              <span className="text-text-muted">{format(parseISO(e.createdAt), 'MMM d, HH:mm')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isOverdue(inv: CrmInvoiceSummaryDto): boolean {
  if (inv.status === CrmInvoiceStatus.Overdue) return true;
  if (inv.status === CrmInvoiceStatus.Sent && inv.dueDate && isPast(parseISO(inv.dueDate))) return true;
  return false;
}

function InvoiceSendPreviewModal({ invoice, onDone }: { invoice: CrmInvoiceSummaryDto; onDone: () => void }) {
  const draft = useDraftInvoiceSendEmail();
  const send = useSendInvoice();
  const [introText, setIntroText] = useState('');
  const [hasDrafted, setHasDrafted] = useState(false);

  const runDraft = () => {
    draft.mutate(invoice.id, {
      onSuccess: (res: any) => { setIntroText(res?.introDraft ?? ''); setHasDrafted(true); },
    });
  };
  useEffect(() => { runDraft(); }, [invoice.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AiSendPreviewModal
      open
      onClose={onDone}
      title={`Send Invoice #${invoice.invoiceNumber}`}
      isDrafting={draft.isPending || !hasDrafted}
      draftText={introText}
      onIntroChange={setIntroText}
      onRegenerate={runDraft}
      isSending={send.isPending}
      onConfirmSend={() => send.mutate({ id: invoice.id, introText }, { onSuccess: onDone })}
    >
      <div className="space-y-1">
        <div>Total: {invoice.currency} {invoice.totalAmount.toLocaleString()}</div>
        {invoice.dueDate && <div>Due: {format(parseISO(invoice.dueDate), 'MMM d, yyyy')}</div>}
      </div>
    </AiSendPreviewModal>
  );
}

export function Component() {
  // Drill-down from the Recurring-revenue widget lands here pre-filtered: ?status= opens the list filtered to that invoice status.
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status');
  const [filter, setFilter] = useState<CrmInvoiceFilter>({
    page: 1,
    pageSize: 20,
    status: initialStatus ? (Number(initialStatus) as CrmInvoiceFilter['status']) : undefined,
  });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CrmInvoiceSummaryDto | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genSource, setGenSource] = useState<'deal' | 'order'>('deal');
  const [genDealId, setGenDealId] = useState('');
  const [genOrderId, setGenOrderId] = useState('');

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<CrmPaymentMethod>(CrmPaymentMethod.BankTransfer);
  const [payDate, setPayDate] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [showCreditNote, setShowCreditNote] = useState(false);
  const [cnAmount, setCnAmount] = useState('');
  const [cnReason, setCnReason] = useState('');
  const [cnApplyMethod, setCnApplyMethod] = useState<CreditNoteApplyMethod>(CNApplyMethod.AccountBalance);

  const { data: raw, isLoading } = useInvoices(filter);
  const items: CrmInvoiceSummaryDto[] = (raw as any)?.items ?? [];

  const generateFromDeal = useGenerateInvoiceFromDeal();
  const generateFromOrder = useGenerateInvoiceFromOrder();
  const recordPayment = useRecordPayment();
  const disputeInvoice = useDisputeInvoice();
  const [sendPreviewInvoice, setSendPreviewInvoice] = useState<CrmInvoiceSummaryDto | null>(null);
  const voidInvoice = useVoidInvoice();
  const genPayLink = useGenerateInvoicePaymentLink();
  const issueCreditNote = useIssueCreditNote();

  function handleGenerate() {
    if (!genDealId.trim()) return;
    generateFromDeal.mutate(genDealId.trim(), { onSuccess: () => { setGenOpen(false); setGenDealId(''); } });
  }
  function handleGenerateFromOrder() {
    if (!genOrderId.trim()) return;
    generateFromOrder.mutate(genOrderId.trim(), { onSuccess: () => { setGenOpen(false); setGenOrderId(''); } });
  }

  function handleIssueCreditNote() {
    if (!selected || !cnAmount || !cnReason.trim()) return;
    issueCreditNote.mutate(
      { originalInvoiceId: selected.id, amount: Number(cnAmount), reason: cnReason.trim(), applyMethod: cnApplyMethod },
      { onSuccess: () => { setShowCreditNote(false); setCnAmount(''); setCnReason(''); setSelected(null); } },
    );
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
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Invoice
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
              {balanceDue(selected) !== selected.totalAmount && balanceDue(selected) > 0 && (
                <Field label="Balance due">
                  <span className="font-semibold text-warning">
                    {selected.currency} {balanceDue(selected).toLocaleString()}
                    <span className="text-text-muted font-normal">
                      {' '}({[
                        selected.amountPaid ? `${selected.currency} ${selected.amountPaid.toLocaleString()} paid` : null,
                        selected.creditAppliedAmount ? `${selected.currency} ${selected.creditAppliedAmount.toLocaleString()} credited` : null,
                      ].filter(Boolean).join(', ')})
                    </span>
                  </span>
                </Field>
              )}
              <Field label="Account / Deal"><span className="text-text-secondary text-sm">{selected.accountName ?? selected.dealName ?? '—'}</span></Field>
              <Field label="Due Date"><span className="text-text-secondary text-sm">{selected.dueDate ? format(parseISO(selected.dueDate), 'MMM d, yyyy') : '—'}</span></Field>
              <Field label="Paid At"><span className="text-text-secondary text-sm">{selected.paidAt ? format(parseISO(selected.paidAt), 'MMM d, yyyy') : '—'}</span></Field>
              <Field label="Customer PO #"><span className="text-text-primary font-semibold text-sm">{(selected as any).customerPONumber || '—'}</span></Field>
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

            {/* Reminders / Dunning */}
            {selected.status !== CrmInvoiceStatus.Draft && selected.status !== CrmInvoiceStatus.Void && (
              <RemindersSection invoiceId={selected.id} />
            )}

            {/* Send action for Draft invoices */}
            {selected.status === CrmInvoiceStatus.Draft && (
              <button onClick={() => { setSendPreviewInvoice(selected); setSelected(null); }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
                <Send className="w-4 h-4" /> Send Invoice
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
                onClick={() => confirmDialog({ message: 'Void this invoice? This cannot be undone.', confirmText: 'Void invoice', danger: true }).then((ok) => { if (ok) { voidInvoice.mutate(selected.id); setSelected(null); } })}
                disabled={voidInvoice.isPending || selected.status === CrmInvoiceStatus.Void}
                className="flex-1 py-2 rounded-xl text-sm font-bold border border-border-subtle text-text-secondary bg-bg-elevated hover:bg-bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {voidInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Void'}
              </button>
              {selected.status !== CrmInvoiceStatus.Draft && selected.status !== CrmInvoiceStatus.Void && (
                <button
                  onClick={() => { setCnAmount(balanceDue(selected).toFixed(2)); setShowCreditNote(v => !v); }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border border-border-subtle text-text-secondary bg-bg-elevated hover:bg-bg-card transition-all">
                  Issue Credit Note
                </button>
              )}
            </div>

            {showCreditNote && (
              <div className="border border-border-subtle rounded-xl p-4 space-y-3 bg-bg-subtle">
                <Field label="Amount">
                  <input type="number" value={cnAmount} onChange={e => setCnAmount(e.target.value)} className={inputCls} placeholder="0.00" min={0} step={0.01} />
                </Field>
                <Field label="Apply Method">
                  <select value={cnApplyMethod} onChange={e => setCnApplyMethod(Number(e.target.value) as CreditNoteApplyMethod)} className={selectCls}>
                    {Object.entries(CREDIT_NOTE_APPLY_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Reason">
                  <textarea value={cnReason} onChange={e => setCnReason(e.target.value)} rows={2} className={inputCls} placeholder="Why is this credit note being issued?" />
                </Field>
                <button onClick={handleIssueCreditNote} disabled={issueCreditNote.isPending || !cnAmount || !cnReason.trim()}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
                  {issueCreditNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue Credit Note'}
                </button>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Generate Invoice SlideOver */}
      <SlideOver open={genOpen} onClose={() => { setGenOpen(false); setGenDealId(''); setGenOrderId(''); }} title="New Invoice">
        <div className="space-y-3">
          <Field label="Source">
            <select value={genSource} onChange={e => setGenSource(e.target.value as 'deal' | 'order')} className={selectCls}>
              <option value="deal">From Deal</option>
              <option value="order">From Order</option>
            </select>
          </Field>
          {genSource === 'deal' ? (
            <Field label="Deal ID *">
              <input value={genDealId} onChange={e => setGenDealId(e.target.value)} className={inputCls} placeholder="Enter Deal ID" />
            </Field>
          ) : (
            <Field label="Order Number *">
              <input value={genOrderId} onChange={e => setGenOrderId(e.target.value)} className={inputCls} placeholder="e.g. ORD-20260701-XXXX" />
            </Field>
          )}
          <button onClick={genSource === 'deal' ? handleGenerate : handleGenerateFromOrder}
            disabled={(genSource === 'deal' ? generateFromDeal : generateFromOrder).isPending || !(genSource === 'deal' ? genDealId : genOrderId).trim()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
            {(genSource === 'deal' ? generateFromDeal : generateFromOrder).isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Generate Invoice
          </button>
        </div>
      </SlideOver>

      {sendPreviewInvoice && (
        <InvoiceSendPreviewModal invoice={sendPreviewInvoice} onDone={() => setSendPreviewInvoice(null)} />
      )}
    </div>
  );
}
