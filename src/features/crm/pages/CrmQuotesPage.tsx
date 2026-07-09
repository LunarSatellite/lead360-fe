import { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader2, FileText, Send, Trash2, Pencil, Check, Package } from 'lucide-react';
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
} from '../types/crm.types';
import { CrmQuoteStatus, CRM_QUOTE_STATUS_LABELS, CRM_QUOTE_STATUS_COLORS } from '../types/crm.types';

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
  const priceBookList: CrmPriceBookDto[] = priceBooks ?? [];
  const [priceBookId, setPriceBookId] = useState('');
  const { data: bookDetail } = usePriceBook(priceBookId || undefined);
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && priceBookList.length > 0 && !priceBookId) {
      const def = priceBookList.find((b) => b.isDefault && b.isActive);
      if (def) { setPriceBookId(def.id); initRef.current = true; }
    }
  }, [priceBookList, priceBookId]);
  const bookEntries = bookDetail?.entries ?? [];

  // Bundle picker — expands a bundle's items into quote line items.
  const { data: bundles } = useProductBundles();
  const bundleList = bundles ?? [];
  const [bundleId, setBundleId] = useState('');
  const { data: bundleDetail } = useProductBundle(bundleId || undefined);
  function addBundle() {
    const items = bundleDetail?.items ?? [];
    if (!items.length) return;
    const bundleLines: CrmQuoteLineItemRequest[] = items.map((it) => ({
      description: it.productName, quantity: it.quantity, unitPrice: it.unitPrice, productId: it.productId,
    }));
    // Replace a single empty starter row; otherwise append.
    setLines((ls) => (ls.length === 1 && !ls[0].description ? bundleLines : [...ls, ...bundleLines]));
    if (bundleDetail?.currency) setCurrency(bundleDetail.currency);
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
      <SlideOver open={createOpen} onClose={() => { setCreateOpen(false); resetForm(); }} title={editingId ? 'Edit Quote' : 'New Quote'} wide>
        {!editingId && (
          <>
            <Field label="Deal">
              <select value={dealId} onChange={e => setDealId(e.target.value)} className={selectCls}>
                <option value="">Select a deal (optional)</option>
                {dealsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Contact">
              <select value={contactId} onChange={e => setContactId(e.target.value)} className={selectCls}>
                <option value="">Select a contact (optional)</option>
                {contactsList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </Field>
            <Field label="Price Book">
              <select
                value={priceBookId}
                onChange={e => {
                  setPriceBookId(e.target.value);
                  const pb = priceBookList.find(b => b.id === e.target.value);
                  if (pb) setCurrency(pb.currency);
                }}
                className={selectCls}
              >
                <option value="">No price book (manual pricing)</option>
                {priceBookList.map(pb => <option key={pb.id} value={pb.id}>{pb.name} ({pb.currency})</option>)}
              </select>
            </Field>
          </>
        )}
        <Field label="Currency"><input value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls} placeholder="USD" /></Field>
        {!editingId && (
          <Field label="Validity (days)"><input type="number" value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} className={inputCls} min={1} /></Field>
        )}
        <div>
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Line Items</p>
            <div className="flex items-center gap-2">
              {!editingId && bundleList.length > 0 && (
                <>
                  <select value={bundleId} onChange={e => setBundleId(e.target.value)} className={selectCls + ' !w-auto text-xs py-1'}>
                    <option value="">Add bundle…</option>
                    {bundleList.map(b => <option key={b.id} value={b.id}>{b.name} ({b.itemCount})</option>)}
                  </select>
                  <button type="button" onClick={addBundle} disabled={!bundleId || !bundleDetail}
                    className="text-xs font-semibold text-brand hover:underline disabled:opacity-40 disabled:no-underline">Add</button>
                </>
              )}
              <button onClick={() => setLines(ls => [...ls, emptyLine()])} className="text-xs text-brand hover:underline">+ Add Row</button>
            </div>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="space-y-1.5">
                {!editingId && priceBookId && bookEntries.length > 0 && (
                  <select
                    value=""
                    onChange={e => {
                      const en = bookEntries.find(x => x.id === e.target.value);
                      if (!en) return;
                      setLines(ls => ls.map((x, idx) => idx === i
                        ? { ...x, productId: en.productId ?? undefined, description: en.productName, unitPrice: en.unitPrice }
                        : x));
                    }}
                    className={selectCls + ' text-xs'}
                  >
                    <option value="">＋ Pick from {bookDetail?.name ?? 'price book'}…</option>
                    {bookEntries.map(en => (
                      <option key={en.id} value={en.id}>{en.productName} — {currency} {en.unitPrice.toLocaleString()}</option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-[1fr_80px_100px_32px] gap-2">
                  <input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description" className={inputCls} />
                  <input type="number" value={l.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} placeholder="Qty" className={inputCls} min={1} />
                  <input type="number" value={l.unitPrice} onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))} placeholder="Price" className={inputCls} min={0} step={0.01} />
                  <button onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition-colors" disabled={lines.length === 1}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 mt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Tax %</label>
              <input type="number" value={taxPercent} onChange={e => setTaxPercent(Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 rounded-lg bg-bg-input border border-border-subtle text-xs text-text-primary text-right focus:outline-none focus:border-brand" min={0} step={0.01} />
            </div>
          </div>
          <div className="text-xs text-text-secondary text-right space-y-0.5">
            <p>Subtotal: <span className="font-bold text-text-primary">{currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            {taxPercent > 0 && <p>Tax ({taxPercent}%): <span className="font-bold text-text-primary">{currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>}
            <p className="text-sm">Total: <span className="font-bold text-text-primary">{currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
          </div>
        </div>
        <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputCls} placeholder="Optional notes..." /></Field>
        <button onClick={handleSubmit} disabled={createQuote.isPending || updateQuote.isPending} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
          {(createQuote.isPending || updateQuote.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />)} {editingId ? 'Save Changes' : 'Create Quote'}
        </button>
      </SlideOver>

      {sendPreviewQuote && (
        <QuoteSendPreviewModal quote={sendPreviewQuote} onDone={() => setSendPreviewQuote(null)} />
      )}
    </div>
  );
}
