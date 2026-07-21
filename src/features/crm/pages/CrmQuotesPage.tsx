import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, FileText, Send, Trash2, Pencil, Check, Package, DollarSign, Calendar, User, Layers } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuotes, useCreateQuote, useUpdateQuote, useSendQuote, useDraftQuoteSendEmail, useAcceptQuote, useRejectQuote, useReviseQuote, useDeleteQuote, useDeals, useContacts, usePriceBooks, usePriceBook, useProductBundles, useProductBundle } from '../api/crm.queries';
import { AiSendPreviewModal } from '../components/AiSendPreviewModal';
import { crmApi } from '../api/crm.api';
import { confirmDialog } from '@/shared/ui/confirm';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { ApprovalEntityType } from '../types/crm.types';
import type {
  CrmQuoteSummaryDto, CrmQuoteCreateRequest, CrmQuoteUpdateRequest, CrmQuoteFilter,
  CrmQuoteLineItemRequest, CrmDealSummaryDto, CrmContactSummaryDto, CrmPriceBookDto,
  CrmPriceBookDetailDto,
} from '../types/crm.types';
import { CrmQuoteStatus, CRM_QUOTE_STATUS_LABELS, CRM_QUOTE_STATUS_COLORS } from '../types/crm.types';

// Shared input/select class
const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-colors';
const selectCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow transition-colors';

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

function SlideOver({ open, onClose, title, subtitle, children, footer, wide, padRight }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean; padRight?: boolean;
}) {
  if (!open) return null;
  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-end${padRight ? ' pr-4' : ''}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`drawer-slide-in relative ${wide ? 'w-[640px]' : 'w-[520px]'} flex flex-col overflow-hidden`}
        style={{
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        {/* Accent bar */}
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
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

const emptyLine = (): CrmQuoteLineItemRequest => ({ description: '', quantity: 1, unitPrice: 0 });

function QuoteSendPreviewModal({ quote, onDone }: { quote: CrmQuoteSummaryDto; onDone: () => void }) {
  const draft = useDraftQuoteSendEmail();
  const send = useSendQuote();
  const [introText, setIntroText] = useState('');
  const [hasDrafted, setHasDrafted] = useState(false);

  const runDraft = () => {
    draft.mutate(quote.id, {
      onSuccess: (res: any) => { setIntroText(res?.introDraft ?? ''); setHasDrafted(true); },
    });
  };
  useEffect(() => { runDraft(); }, [quote.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AiSendPreviewModal
      open
      onClose={onDone}
      title={`Send Quote #${quote.quoteNumber}`}
      isDrafting={draft.isPending || !hasDrafted}
      draftText={introText}
      onIntroChange={setIntroText}
      onRegenerate={runDraft}
      isSending={send.isPending}
      onConfirmSend={() => send.mutate({ id: quote.id, introText }, { onSuccess: onDone })}
    >
      <div className="space-y-1">
        <div>Total: {quote.currency} {quote.totalAmount.toLocaleString()}</div>
        {quote.validUntil && <div>Valid until: {format(parseISO(quote.validUntil), 'MMM d, yyyy')}</div>}
      </div>
    </AiSendPreviewModal>
  );
}

export function Component() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<CrmQuoteFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CrmQuoteSummaryDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [dealId, setDealId] = useState(searchParams.get('dealId') ?? '');
  const [contactId, setContactId] = useState(searchParams.get('contactId') ?? '');

  // Dropdown state for Deal
  const [dealSearch, setDealSearch] = useState('');
  const [showDealDrop, setShowDealDrop] = useState(false);
  const dealDropRef = useRef<HTMLDivElement>(null);

  // Dropdown state for Contact
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDrop, setShowContactDrop] = useState(false);
  const contactDropRef = useRef<HTMLDivElement>(null);

  // Dropdown state for Price Book
  const [pbSearch, setPbSearch] = useState('');
  const [showPbDrop, setShowPbDrop] = useState(false);
  const pbDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dealDropRef.current && !dealDropRef.current.contains(e.target as Node)) setShowDealDrop(false);
      if (contactDropRef.current && !contactDropRef.current.contains(e.target as Node)) setShowContactDrop(false);
      if (pbDropRef.current && !pbDropRef.current.contains(e.target as Node)) setShowPbDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchParams.get('dealId') || searchParams.get('contactId')) {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const { data: dealsRaw } = useDeals({ pageSize: 200 });
  const dealsList: CrmDealSummaryDto[] = (dealsRaw as any)?.items ?? [];

  const { data: contactsRaw } = useContacts({ pageSize: 200 });
  const contactsList: CrmContactSummaryDto[] = (contactsRaw as any)?.items ?? [];
  const [currency, setCurrency] = useState('USD');
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<CrmQuoteLineItemRequest[]>([emptyLine()]);
  const { data: priceBooks } = usePriceBooks();
  const priceBookList: CrmPriceBookDto[] = (priceBooks as unknown as CrmPriceBookDto[]) ?? [];
  const [priceBookId, setPriceBookId] = useState('');
  const bookDetail = usePriceBook(priceBookId || undefined) as unknown as { data: { data: CrmPriceBookDetailDto } };
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && priceBookList.length > 0 && !priceBookId) {
      const def = priceBookList.find((b) => b.isDefault && b.isActive);
      if (def) { setPriceBookId(def.id); initRef.current = true; }
    }
  }, [priceBookList, priceBookId]);
  const bookEntries = (bookDetail as unknown as any)?.entries ?? [];

  // Bundle picker — expands a bundle's items into quote line items.
  const { data: bundles } = useProductBundles();
  const bundleList: any[] = (bundles as unknown as any[]) ?? [];
  const [bundleId, setBundleId] = useState('');
  const { data: bundleDetail } = useProductBundle(bundleId || undefined);
  function addBundle() {
    const bd = bundleDetail as unknown as any;
    const items = bd?.items ?? [];
    if (!items.length) return;
    const bundleLines: CrmQuoteLineItemRequest[] = items.map((it: any) => ({
      description: it.productName, quantity: it.quantity, unitPrice: it.unitPrice, productId: it.productId,
    }));
    // Replace a single empty starter row; otherwise append.
    setLines((ls) => (ls.length === 1 && !ls[0].description ? bundleLines : [...ls, ...bundleLines]));
    if (bd?.currency) setCurrency(bd.currency);
    setBundleId('');
  }

  const { data: raw, isLoading } = useQuotes(filter);
  const items: CrmQuoteSummaryDto[] = (raw as any)?.items ?? [];

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const [sendPreviewQuote, setSendPreviewQuote] = useState<CrmQuoteSummaryDto | null>(null);
  const acceptQuote = useAcceptQuote();
  const rejectQuote = useRejectQuote();
  const reviseQuote = useReviseQuote();
  const deleteQuote = useDeleteQuote();
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [taxPercent, setTaxPercent] = useState(0);
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = subtotal * taxPercent / 100;
  const total = subtotal + taxAmount;

  function resetForm() {
    setEditingId(null); setDealId(''); setContactId(''); setCurrency('USD');
    setValidityDays(30); setNotes(''); setLines([emptyLine()]); setPriceBookId(''); setTaxPercent(0);
  }

  async function openEdit(id: string) {
    setLoadingEdit(true);
    try {
      const detail: any = await crmApi.getQuoteById(id);
      setEditingId(id);
      setDealId(detail.dealId ?? '');
      setContactId(detail.contactId ?? '');
      setCurrency(detail.currency ?? 'USD');
      setNotes(detail.notes ?? '');
      setLines((detail.lineItems ?? []).length
        ? detail.lineItems.map((li: any) => ({ description: li.description, quantity: li.quantity, unitPrice: li.unitPrice }))
        : [emptyLine()]);
      setSelected(null);
      setCreateOpen(true);
    } catch (e: any) {
      toast.error(e?.message || 'Could not load quote.');
    } finally {
      setLoadingEdit(false);
    }
  }

  function handleSubmit() {
    if (!lines.some(l => l.description)) { toast.error('Add at least one line item.'); return; }
    const items = lines.filter(l => l.description);
    if (editingId) {
      const req: CrmQuoteUpdateRequest = { lineItems: items, currency, notes: notes || undefined, taxPercent: taxPercent || undefined };
      updateQuote.mutate({ id: editingId, data: req }, { onSuccess: () => { setCreateOpen(false); resetForm(); } });
    } else {
      const req: CrmQuoteCreateRequest = {
        dealId: dealId || undefined, contactId: contactId || undefined,
        lineItems: items, currency, validityDays, notes: notes || undefined,
        priceBookId: priceBookId || undefined, taxPercent: taxPercent || undefined,
      };
      createQuote.mutate(req, { onSuccess: () => { setCreateOpen(false); resetForm(); } });
    }
  }

  function updateLine(i: number, field: keyof CrmQuoteLineItemRequest, val: string | number) {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Quotes</h2>
          <p className="text-xs text-text-muted mt-0.5">{(raw as any)?.totalCount?.toLocaleString() ?? 0} total</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Quote
        </button>
      </div>

      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter(f => ({ ...f, search: search || undefined, page: 1 }))}
          placeholder="Search quotes..." className={inputCls + ' flex-1'} />
        <select className={selectCls + ' w-44'} value={filter.status ?? ''} onChange={e => setFilter(f => ({ ...f, status: e.target.value ? Number(e.target.value) as any : undefined, page: 1 }))}>
          <option value="">All Statuses</option>
          {Object.entries(CRM_QUOTE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <FileText className="w-8 h-8 opacity-30" strokeWidth={1.2} />
            <p className="text-sm">No quotes found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Quote #', 'Contact', 'Deal', 'Amount', 'Status', 'Valid Until', 'Sent At', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((q: CrmQuoteSummaryDto) => (
                <tr key={q.id} onClick={() => setSelected(q)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-semibold text-brand">{q.quoteNumber}</td>
                  <td className="px-4 py-3 text-text-secondary">{q.contactName ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{q.dealName ?? '—'}</td>
                  <td className="px-4 py-3 text-text-primary font-semibold">{q.currency} {q.totalAmount?.toLocaleString() ?? '0'}</td>
                  <td className="px-4 py-3"><Badge value={q.status} labels={CRM_QUOTE_STATUS_LABELS} colors={CRM_QUOTE_STATUS_COLORS} /></td>
                  <td className="px-4 py-3 text-text-muted text-xs">{q.validUntil ? format(parseISO(q.validUntil), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{q.sentAt ? format(parseISO(q.sentAt), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {q.status === CrmQuoteStatus.Draft && (
                        <button onClick={() => openEdit(q.id)} title="Edit" className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors">
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                      {q.status === CrmQuoteStatus.Draft && (
                        <button onClick={() => setSendPreviewQuote(q)} title="Send" className="p-1.5 rounded-lg text-brand hover:bg-brand-soft transition-colors">
                          <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                      <button onClick={() => confirmDialog({ message: 'Delete this quote?', confirmText: 'Delete', danger: true }).then((ok) => { if (ok) deleteQuote.mutate(q.id); })} title="Delete" className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors">
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail SlideOver */}
      <SlideOver open={!!selected} onClose={() => setSelected(null)} title={`Quote ${selected?.quoteNumber ?? ''}`} wide>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status"><Badge value={selected.status} labels={CRM_QUOTE_STATUS_LABELS} colors={CRM_QUOTE_STATUS_COLORS} /></Field>
              <Field label="Amount"><span className="text-text-primary font-semibold">{selected.currency} {selected.totalAmount?.toLocaleString() ?? '0'}</span></Field>
              <Field label="Contact"><span className="text-text-secondary text-sm">{selected.contactName ?? '—'}</span></Field>
              <Field label="Deal"><span className="text-text-secondary text-sm">{selected.dealName ?? '—'}</span></Field>
              <Field label="Valid Until"><span className="text-text-secondary text-sm">{selected.validUntil ? format(parseISO(selected.validUntil), 'MMM d, yyyy') : '—'}</span></Field>
              <Field label="Sent At"><span className="text-text-secondary text-sm">{selected.sentAt ? format(parseISO(selected.sentAt), 'MMM d, yyyy') : '—'}</span></Field>
            </div>
            {(selected as any).lineItems?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Line Items</p>
                <table className="w-full text-sm border border-border-subtle rounded-xl overflow-hidden">
                  <thead><tr className="bg-bg-subtle border-b border-border-subtle">
                    {['Description', 'Qty', 'Unit Price', 'Total'].map(h => <th key={h} className="text-left px-3 py-2 text-xs font-bold text-text-muted">{h}</th>)}
                  </tr></thead>
                  <tbody>{(selected as any).lineItems.map((li: any) => (
                    <tr key={li.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-3 py-2 text-text-primary">{li.description}</td>
                      <td className="px-3 py-2 text-text-secondary">{li.quantity}</td>
                      <td className="px-3 py-2 text-text-secondary">{selected.currency} {li.unitPrice?.toLocaleString() ?? '0'}</td>
                       <td className="px-3 py-2 font-semibold text-text-primary">{selected.currency} {li.lineTotal?.toLocaleString() ?? '0'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {/* Approval Panel */}
            {selected.id && <ApprovalPanel entityType={ApprovalEntityType.Quote} entityId={selected.id} entityName={`Quote ${selected.quoteNumber}`} />}

            {selected.status === CrmQuoteStatus.Draft && (
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(selected.id)} disabled={loadingEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-border-subtle text-text-primary text-sm font-bold hover:bg-bg-elevated disabled:opacity-60 transition-all">
                  {loadingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" strokeWidth={1.5} />} Edit
                </button>
                <button onClick={() => { setSendPreviewQuote(selected); setSelected(null); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light transition-all">
                  <Send className="w-4 h-4" strokeWidth={1.5} /> Send Quote
                </button>
              </div>
            )}
            {selected.status === 2 && ( /* Sent — customer can accept/reject */
              <div className="flex items-center gap-2">
                <button onClick={() => { reviseQuote.mutate(selected.id); setSelected(null); }} disabled={reviseQuote.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
                  {reviseQuote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" strokeWidth={1.5} />} Revise
                </button>
                <button onClick={() => { acceptQuote.mutate(selected.id); setSelected(null); }} disabled={acceptQuote.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-bg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all">
                  {acceptQuote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={1.5} />} Accept
                </button>
                <button onClick={() => { rejectQuote.mutate(selected.id); setSelected(null); }} disabled={rejectQuote.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger text-bg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all">
                  {rejectQuote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" strokeWidth={1.5} />} Reject
                </button>
              </div>
            )}
            {selected.status === 3 && ( /* Accepted — ready to create order */
              <div className="flex items-center gap-2">
                <button onClick={() => { reviseQuote.mutate(selected.id); setSelected(null); }} disabled={reviseQuote.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
                  {reviseQuote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" strokeWidth={1.5} />} Revise
                </button>
                <button onClick={() => { setSelected(null); navigate(`/dashboard/crm/orders?quoteId=${selected.id}`); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-bg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all">
                  <Package className="w-4 h-4" strokeWidth={1.5} /> Create Order
                </button>
              </div>
            )}
            <button onClick={() => confirmDialog({ message: 'Delete this quote?', confirmText: 'Delete', danger: true }).then((ok) => { if (ok) { deleteQuote.mutate(selected.id); setSelected(null); } })} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-soft text-danger text-sm font-bold hover:bg-danger hover:text-bg transition-all">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} /> Delete Quote
            </button>
          </div>
        )}
      </SlideOver>

      {/* Create / Edit SlideOver */}
      <SlideOver
        open={createOpen}
        onClose={() => { setCreateOpen(false); resetForm(); }}
        title={editingId ? 'Edit Quote' : 'New Quote'}
        subtitle={editingId ? 'Update this quote' : 'Create a new quote for your deal'}
        wide
        padRight
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setCreateOpen(false); resetForm(); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createQuote.isPending || updateQuote.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {createQuote.isPending || updateQuote.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : editingId ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingId ? 'Save Changes' : 'Create Quote'}
            </button>
          </div>
        }
      >
        {/* ── Deal & Contact ── */}
        {!editingId && (
          <>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Deal & Contact</span>
              <div className="h-px bg-brand/20" />
            </div>

            {/* Deal */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Deal</label>
              <div className="relative" ref={dealDropRef}>
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="Search existing deals…"
                  autoComplete="off"
                  value={dealSearch}
                  onChange={e => { setDealSearch(e.target.value); setShowDealDrop(true); }}
                  onFocus={() => setShowDealDrop(true)}
                />
                {dealSearch ? (
                  <button type="button" onClick={() => { setDealSearch(''); setShowDealDrop(false); setDealId(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                ) : null}
                {showDealDrop && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                    style={{ borderRadius: 12, background: '#132420', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)' }}
                  >
                    {dealsList.filter(d => !dealSearch || d.name.toLowerCase().includes(dealSearch.toLowerCase())).length > 0
                      ? dealsList.filter(d => !dealSearch || d.name.toLowerCase().includes(dealSearch.toLowerCase())).map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => { setDealId(d.id); setDealSearch(''); setShowDealDrop(false); }}
                          className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-glass-1 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 8px rgba(0,217,138,0.35), 0 0 16px rgba(0,217,138,0.15)' }}>
                            <Layers className="w-4 h-4 text-brand" strokeWidth={1.6} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-text-primary truncate">{d.name}</div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9), 0 0 12px rgba(0,217,138,0.5)' }} />
                        </button>
                      ))
                      : <div className="px-4 py-3 text-xs text-text-muted">No deals found</div>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Contact</label>
              <div className="relative" ref={contactDropRef}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="Search existing contacts…"
                  autoComplete="off"
                  value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setShowContactDrop(true); }}
                  onFocus={() => setShowContactDrop(true)}
                />
                {contactSearch ? (
                  <button type="button" onClick={() => { setContactSearch(''); setShowContactDrop(false); setContactId(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                ) : null}
                {showContactDrop && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                    style={{ borderRadius: 12, background: '#132420', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)' }}
                  >
                    {contactsList.filter(c => !contactSearch || c.fullName.toLowerCase().includes(contactSearch.toLowerCase())).length > 0
                      ? contactsList.filter(c => !contactSearch || c.fullName.toLowerCase().includes(contactSearch.toLowerCase())).map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setContactId(c.id); setContactSearch(''); setShowContactDrop(false); }}
                          className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-glass-1 transition-colors text-left"
                        >
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(0,217,138,0.35), 0 0 16px rgba(0,217,138,0.15)' }}>
                              <span className="text-xs font-bold text-brand">{c.fullName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-text-primary truncate">{c.fullName}</div>
                            {c.email && <div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-text-muted truncate">{c.email}</span></div>}
                          </div>
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9), 0 0 12px rgba(0,217,138,0.5)' }} />
                        </button>
                      ))
                      : <div className="px-4 py-3 text-xs text-text-muted">No contacts found</div>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Price Book */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Price Book</label>
              <div className="relative" ref={pbDropRef}>
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="Select a price book…"
                  autoComplete="off"
                  value={pbSearch}
                  onChange={e => { setPbSearch(e.target.value); setShowPbDrop(true); }}
                  onFocus={() => setShowPbDrop(true)}
                />
                {pbSearch ? (
                  <button type="button" onClick={() => { setPbSearch(''); setShowPbDrop(false); setPriceBookId(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                ) : null}
                {showPbDrop && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                    style={{ borderRadius: 12, background: '#132420', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)' }}
                  >
                    {priceBookList.filter(pb => !pbSearch || pb.name.toLowerCase().includes(pbSearch.toLowerCase())).length > 0
                      ? priceBookList.filter(pb => !pbSearch || pb.name.toLowerCase().includes(pbSearch.toLowerCase())).map(pb => (
                        <button
                          key={pb.id}
                          type="button"
                          onClick={() => { setPriceBookId(pb.id); setPbSearch(''); setShowPbDrop(false); if (pb.currency) setCurrency(pb.currency); }}
                          className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-glass-1 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 8px rgba(0,217,138,0.35), 0 0 16px rgba(0,217,138,0.15)' }}>
                            <FileText className="w-4 h-4 text-brand" strokeWidth={1.6} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-text-primary truncate">{pb.name}</div>
                            <div className="flex items-center gap-2 mt-0.5"><span className="text-xs text-text-muted">{pb.currency}</span></div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-brand shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9), 0 0 12px rgba(0,217,138,0.5)' }} />
                        </button>
                      ))
                      : <div className="px-4 py-3 text-xs text-text-muted">No price books found</div>
                    }
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Currency & Validity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Currency</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
              <input
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                placeholder="USD"
              />
            </div>
          </div>
          {!editingId && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Validity (days)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  type="number"
                  value={validityDays}
                  onChange={e => setValidityDays(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  min={1}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Line Items ── */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Line Items</span>
          <div className="h-px bg-brand/20" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <p className="text-xs font-semibold text-text-secondary">Items</p>
            <div className="flex items-center gap-2">
              {!editingId && bundleList.length > 0 && (
                <>
                  <select
                    value={bundleId}
                    onChange={e => setBundleId(e.target.value)}
                    className="text-xs py-1 px-2 rounded-lg border border-[rgba(0,217,138,0.20)] text-text-primary focus:outline-none"
                    style={{ backgroundColor: '#1A2F27' }}
                  >
                    <option value="">Add bundle…</option>
                    {bundleList.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.itemCount})</option>)}
                  </select>
                  <button type="button" onClick={addBundle} disabled={!bundleId || !bundleDetail}
                    className="text-xs font-semibold text-brand hover:underline disabled:opacity-40 disabled:no-underline">Add</button>
                </>
              )}
              <button onClick={() => setLines(ls => [...ls, emptyLine()])} className="text-xs text-brand hover:underline">+ Add Row</button>
            </div>
          </div>

          {/* Price book product picker */}
          {!editingId && priceBookId && bookEntries.length > 0 && (
            <div className="mb-2">
              <select
                value=""
                onChange={e => {
                  const en = bookEntries.find((x: any) => x.id === e.target.value);
                  if (!en) return;
                  setLines(ls => ls.map((x, idx) => idx === ls.length - 1
                    ? { ...x, productId: en.productId ?? undefined, description: en.productName, unitPrice: en.unitPrice }
                    : x));
                }}
                className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-xs text-text-primary focus:outline-none"
                style={{ backgroundColor: '#1A2F27' }}
              >
                <option value="">＋ Pick from {bookDetail?.data?.data?.name ?? 'price book'}…</option>
                {bookEntries.map((en: any) => (
                  <option key={en.id} value={en.id}>{en.productName} — {currency} {en.unitPrice.toLocaleString()}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i}>
                <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2">
                  <input
                    value={l.description}
                    onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  />
                  <input
                    type="number"
                    value={l.quantity}
                    onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    min={1}
                    className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  />
                  <input
                    type="number"
                    value={l.unitPrice}
                    onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))}
                    placeholder="Price"
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  />
                  <button
                    onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors disabled:opacity-30"
                    disabled={lines.length === 1}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tax + Totals */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-secondary">Tax %</label>
              <input
                type="number"
                value={taxPercent}
                onChange={e => setTaxPercent(Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1.5 rounded-xl border border-[rgba(0,217,138,0.20)] text-xs text-text-primary text-right focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={{ backgroundColor: '#1A2F27' }}
                min={0}
                step={0.01}
              />
            </div>
            <div className="text-xs text-text-secondary text-right space-y-0.5">
              <p>Subtotal: <span className="font-bold text-text-primary">{currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
              {taxPercent > 0 && <p>Tax ({taxPercent}%): <span className="font-bold text-text-primary">{currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>}
              <p className="text-sm">Total: <span className="font-bold text-brand">{currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
            style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
            placeholder="Optional notes…"
          />
        </div>
      </SlideOver>

      {sendPreviewQuote && (
        <QuoteSendPreviewModal quote={sendPreviewQuote} onDone={() => setSendPreviewQuote(null)} />
      )}
    </div>
  );
}
