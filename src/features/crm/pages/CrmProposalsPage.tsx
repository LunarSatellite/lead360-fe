import { useState, useEffect, type ReactNode } from 'react';
import { Plus, X, Loader2, ClipboardList, Send, AlertTriangle, FilePlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useProposals, useProposalById, useGenerateProposal, useCreateProposal, useCreateProposalFromLead, useSendProposal, useAcceptProposal, useRejectProposal, useProposalTemplates, useDeals, useContacts, useLeads } from '../api/crm.queries';
import type {
  CrmProposalSummaryDto, CrmProposalDetailDto, CrmProposalGenerateRequest, CrmProposalCreateRequest,
  CrmProposalFromLeadRequest, CrmProposalSectionInput, CrmProposalFilter, CrmDealSummaryDto, CrmContactSummaryDto,
  LeadSummaryDto,
} from '../types/crm.types';
import { CrmProposalStatus, CRM_PROPOSAL_STATUS_LABELS, CRM_PROPOSAL_STATUS_COLORS, PROPOSAL_SECTION_KINDS } from '../types/crm.types';

const inputCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow';
const selectCls = 'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow';

function Badge({ value, labels, colors }: { value: number; labels: Record<number, string>; colors: Record<number, string> }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[value] ?? ''}`}>
      {labels[value] ?? value}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function SlideOver({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean;
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

export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<CrmProposalFilter>({ page: 1, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(!!searchParams.get('dealId') || !!searchParams.get('contactId'));
  const [dealId, setDealId] = useState(searchParams.get('dealId') ?? '');
  const [contactId, setContactId] = useState(searchParams.get('contactId') ?? '');
  const [templateId, setTemplateId] = useState('');

  // Consume query params once on mount — don't reopen on refresh
  useEffect(() => {
    if (searchParams.get('dealId') || searchParams.get('contactId')) {
      const params = new URLSearchParams(searchParams);
      params.delete('dealId');
      params.delete('contactId');
      setSearchParams(params, { replace: true });
    }
  }, []);

  const { data: raw, isLoading } = useProposals(filter);
  const items: CrmProposalSummaryDto[] = (raw as any)?.items ?? [];

  const { data: detail, isLoading: detailLoading } = useProposalById(selectedId ?? undefined);
  const detailData = detail as unknown as CrmProposalDetailDto | undefined;

  const { data: rawTemplates } = useProposalTemplates();
  const templates: any[] = (rawTemplates as any) ?? [];

  const { data: dealsRaw } = useDeals({ pageSize: 200 });
  const dealsList: CrmDealSummaryDto[] = (dealsRaw as any)?.items ?? [];

  const { data: contactsRaw } = useContacts({ pageSize: 200 });
  const contactsList: CrmContactSummaryDto[] = (contactsRaw as any)?.items ?? [];

  const { data: leadsRaw } = useLeads({ pageSize: 200 });
  const leadsList: LeadSummaryDto[] = (leadsRaw as any)?.items ?? [];

  const generateProposal = useGenerateProposal();
  const createProposal = useCreateProposal();
  const createFromLead = useCreateProposalFromLead();
  const sendProposal = useSendProposal();
  const acceptProposal = useAcceptProposal();
  const rejectProposal = useRejectProposal();

  // ── Manual build-your-own state ──
  const [manualOpen, setManualOpen] = useState(false);
  const emptySection = (): CrmProposalSectionInput => ({ title: '', content: '', kind: 1 });
  const [mSource, setMSource] = useState<'deal' | 'lead'>('deal');
  const [mTitle, setMTitle] = useState('');
  const [mDealId, setMDealId] = useState('');
  const [mLeadId, setMLeadId] = useState('');
  const [mContactId, setMContactId] = useState('');
  const [mSections, setMSections] = useState<CrmProposalSectionInput[]>([emptySection()]);

  function resetForm() { setDealId(''); setContactId(''); setTemplateId(''); }
  function resetManual() { setMSource('deal'); setMTitle(''); setMDealId(''); setMLeadId(''); setMContactId(''); setMSections([emptySection()]); }

  function handleGenerate() {
    if (!dealId.trim()) { return; }
    const req: CrmProposalGenerateRequest = {
      dealId: dealId.trim(),
      contactId: contactId.trim() || undefined,
      templateId: templateId || undefined,
    };
    generateProposal.mutate(req, { onSuccess: () => { setGenOpen(false); resetForm(); } });
  }

  function updateSection(i: number, field: keyof CrmProposalSectionInput, val: string | number) {
    setMSections(ss => ss.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }

  function handleCreateManual() {
    if (!mTitle.trim()) { toast.error('Add a title.'); return; }
    const sections = mSections.filter(s => s.content.trim() || s.title.trim());
    if (!sections.length) { toast.error('Add at least one section.'); return; }

    if (mSource === 'lead') {
      if (!mLeadId.trim()) { toast.error('Pick a lead.'); return; }
      const req: CrmProposalFromLeadRequest = { leadId: mLeadId.trim(), title: mTitle.trim(), sections };
      createFromLead.mutate(req, { onSuccess: () => { setManualOpen(false); resetManual(); } });
    } else {
      if (!mDealId.trim()) { toast.error('Pick a deal.'); return; }
      const req: CrmProposalCreateRequest = {
        dealId: mDealId.trim(), title: mTitle.trim(),
        contactId: mContactId.trim() || undefined,
        sections,
      };
      createProposal.mutate(req, { onSuccess: () => { setManualOpen(false); resetManual(); } });
    }
  }

  const canSend = (p: CrmProposalDetailDto | CrmProposalSummaryDto) =>
    p.status !== CrmProposalStatus.Sent && p.status !== CrmProposalStatus.Accepted;

  const selectedSummary = items.find(p => p.id === selectedId);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Proposals</h2>
          <p className="text-xs text-text-muted mt-0.5">{(raw as any)?.totalCount?.toLocaleString() ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManualOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-text-primary bg-bg-card border border-border-subtle hover:bg-bg-elevated transition-all">
            <FilePlus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Proposal
          </button>
          <button onClick={() => setGenOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Generate Proposal
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setFilter(f => ({ ...f, search: search || undefined, page: 1 }))}
          placeholder="Search proposals..." className={inputCls + ' flex-1'} />
        <select className={selectCls + ' w-44'} value={filter.status ?? ''} onChange={e => setFilter(f => ({ ...f, status: e.target.value ? Number(e.target.value) as any : undefined, page: 1 }))}>
          <option value="">All Statuses</option>
          {Object.entries(CRM_PROPOSAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <ClipboardList className="w-8 h-8 opacity-30" strokeWidth={1.2} />
            <p className="text-sm">No proposals found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                {['Title', 'Deal', 'Contact', 'Status', 'Sections', 'Sent At', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p: CrmProposalSummaryDto) => (
                <tr key={p.id} onClick={() => setSelectedId(p.id)} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-semibold text-text-primary">{p.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.dealName ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.contactName ?? '—'}</td>
                  <td className="px-4 py-3"><Badge value={p.status} labels={CRM_PROPOSAL_STATUS_LABELS} colors={CRM_PROPOSAL_STATUS_COLORS} /></td>
                  <td className="px-4 py-3 text-text-muted">{p.sectionsCount}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{p.sentAt ? format(parseISO(p.sentAt), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{format(parseISO(p.createdAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail SlideOver */}
      <SlideOver open={!!selectedId} onClose={() => setSelectedId(null)} title="Proposal Detail" wide>
        {detailLoading ? (
          <div className="flex items-center justify-center py-12 text-text-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : detailData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title"><span className="text-text-primary font-semibold text-sm">{detailData.title}</span></Field>
              <Field label="Status"><Badge value={detailData.status} labels={CRM_PROPOSAL_STATUS_LABELS} colors={CRM_PROPOSAL_STATUS_COLORS} /></Field>
              <Field label="Deal"><span className="text-text-secondary text-sm">{selectedSummary?.dealName ?? '—'}</span></Field>
              <Field label="Contact"><span className="text-text-secondary text-sm">{selectedSummary?.contactName ?? '—'}</span></Field>
            </div>

            {/* Sections with gap warnings */}
            {(detailData.sections?.length ?? 0) > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Sections ({detailData.openGapsCount} open gap{detailData.openGapsCount !== 1 ? 's' : ''})</p>
                {detailData.sections!.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-bg-subtle border border-border-subtle space-y-2">
                    <p className="text-xs font-bold text-text-primary">{s.title}</p>
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{s.content?.slice(0, 200)}{(s.content?.length ?? 0) > 200 ? '…' : ''}</p>
                    {(s.gapFlags?.length ?? 0) > 0 && !s.gapsDismissed && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {s.gapFlags!.map((g, i) => (
                          <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FDE68A]">
                            <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={1.5} /> {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canSend(detailData) && (
              <button onClick={() => { sendProposal.mutate(detailData.id); setSelectedId(null); }} disabled={sendProposal.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
                {sendProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.5} />} Send Proposal
              </button>
            )}
            {detailData.status === 4 && (
              <div className="flex gap-2">
                <button onClick={() => { acceptProposal.mutate(detailData.id); setSelectedId(null); }} disabled={acceptProposal.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-bg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all">
                  {acceptProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Accept
                </button>
                <button onClick={() => { rejectProposal.mutate(detailData.id); setSelectedId(null); }} disabled={rejectProposal.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger text-bg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all">
                  {rejectProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reject
                </button>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Generate SlideOver */}
      <SlideOver open={genOpen} onClose={() => { setGenOpen(false); resetForm(); }} title="Generate Proposal">
        <Field label="Deal *">
          <select value={dealId} onChange={e => setDealId(e.target.value)} className={selectCls}>
            <option value="">Select a deal (required)</option>
            {dealsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Contact">
          <select value={contactId} onChange={e => setContactId(e.target.value)} className={selectCls}>
            <option value="">Select a contact (optional)</option>
            {contactsList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
        </Field>
        <Field label="Template">
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} className={selectCls}>
            <option value="">No template</option>
            {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <button onClick={handleGenerate} disabled={generateProposal.isPending || !dealId.trim()}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
          {generateProposal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />} Generate
        </button>
      </SlideOver>

      {/* Manual Build SlideOver */}
      <SlideOver open={manualOpen} onClose={() => { setManualOpen(false); resetManual(); }} title="New Proposal" wide>
        <Field label="Title *">
          <input value={mTitle} onChange={e => setMTitle(e.target.value)} className={inputCls} placeholder="e.g. Website Redesign Proposal — Acme Co" />
        </Field>
        <Field label="Start from">
          <div className="flex gap-2">
            {(['deal', 'lead'] as const).map(src => (
              <button key={src} onClick={() => setMSource(src)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${mSource === src ? 'bg-brand text-bg border-brand' : 'bg-bg-card text-text-secondary border-border-subtle hover:bg-bg-elevated'}`}>
                {src === 'deal' ? 'Existing Deal' : 'A Lead'}
              </button>
            ))}
          </div>
        </Field>
        {mSource === 'deal' ? (
          <>
            <Field label="Deal *">
              <select value={mDealId} onChange={e => setMDealId(e.target.value)} className={selectCls}>
                <option value="">Select a deal (required)</option>
                {dealsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Contact">
              <select value={mContactId} onChange={e => setMContactId(e.target.value)} className={selectCls}>
                <option value="">Select a contact (optional)</option>
                {contactsList.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </Field>
          </>
        ) : (
          <Field label="Lead *">
            <select value={mLeadId} onChange={e => setMLeadId(e.target.value)} className={selectCls}>
              <option value="">Select a lead (required)</option>
              {leadsList.map(l => <option key={l.id} value={l.id}>{l.customerName ?? l.channelHandle}</option>)}
            </select>
            <p className="text-xs text-text-muted mt-1">A deal + contact will be created (or reused) for this lead automatically.</p>
          </Field>
        )}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Sections</p>
            <button onClick={() => setMSections(ss => [...ss, emptySection()])} className="text-xs text-brand hover:underline">+ Add Section</button>
          </div>
          <div className="space-y-3">
            {mSections.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-bg-subtle border border-border-subtle space-y-2">
                <div className="flex gap-2">
                  <select value={s.kind} onChange={e => updateSection(i, 'kind', Number(e.target.value))} className={selectCls + ' w-48'}>
                    {Object.entries(PROPOSAL_SECTION_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input value={s.title} onChange={e => updateSection(i, 'title', e.target.value)} placeholder="Section heading (optional)" className={inputCls + ' flex-1'} />
                  <button onClick={() => setMSections(ss => ss.filter((_, idx) => idx !== i))} disabled={mSections.length === 1}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger-soft disabled:opacity-40 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea value={s.content} onChange={e => updateSection(i, 'content', e.target.value)} rows={3} className={inputCls} placeholder="Section content..." />
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleCreateManual}
          disabled={createProposal.isPending || createFromLead.isPending || !mTitle.trim() || (mSource === 'deal' ? !mDealId.trim() : !mLeadId.trim())}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-60 transition-all">
          {(createProposal.isPending || createFromLead.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />} Create Proposal
        </button>
      </SlideOver>
    </div>
  );
}
