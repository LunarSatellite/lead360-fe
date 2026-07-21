import { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Loader2, ClipboardList, Send, AlertTriangle, FilePlus, RefreshCw, Save, Layers, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useProposals, useProposalById, useGenerateProposal, useCreateProposal, useCreateProposalFromLead, useSendProposal, useAcceptProposal, useRejectProposal, useProposalTemplates, useDeals, useContacts, useLeads, useUpdateProposalSection, useRegenerateProposalSection } from '../api/crm.queries';
import type {
  CrmProposalSummaryDto, CrmProposalDetailDto, CrmProposalGenerateRequest, CrmProposalCreateRequest,
  CrmProposalFromLeadRequest, CrmProposalSectionInput, CrmProposalFilter, CrmDealSummaryDto, CrmContactSummaryDto,
  LeadSummaryDto,
} from '../types/crm.types';
import { CrmProposalStatus, CRM_PROPOSAL_STATUS_LABELS, CRM_PROPOSAL_STATUS_COLORS, PROPOSAL_SECTION_KINDS, ApprovalEntityType } from '../types/crm.types';
import { ApprovalPanel } from '../components/ApprovalPanel';

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

function SlideOver({ open, onClose, title, subtitle, children, footer, wide, padRight }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; wide?: boolean; padRight?: boolean;
}) {
  if (!open) return null;
  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-end${padRight ? ' pr-4' : ''}`}>
      <div className="absolute inset-0 min-h-screen bg-black/40 backdrop-blur-sm" onClick={onClose} />
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

// ─── Editable Section ─────────────────────────────────────────────────────────
function EditableSection({ proposalId, section }: { proposalId: string; section: any }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(section.content ?? '');
  const updateSection = useUpdateProposalSection();
  const regenerateSection = useRegenerateProposalSection();

  const handleSave = () => {
    updateSection.mutate({ proposalId, sectionId: section.id, content });
    setEditing(false);
  };

  return (
    <div className="p-3 rounded-xl bg-bg-subtle border border-border-subtle space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-text-primary">{section.title}</p>
        <div className="flex gap-1">
          {!editing ? (
            <button onClick={() => { setContent(section.content ?? ''); setEditing(true); }} className="text-[10px] text-brand hover:underline">Edit</button>
          ) : (
            <>
              <button onClick={handleSave} disabled={updateSection.isPending} className="flex items-center gap-1 text-[10px] text-success hover:underline font-medium">
                {updateSection.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
              <button onClick={() => setEditing(false)} className="text-[10px] text-text-muted hover:underline">Cancel</button>
            </>
          )}
          <button onClick={() => regenerateSection.mutate({ proposalId, sectionId: section.id })} disabled={regenerateSection.isPending}
            className="flex items-center gap-1 text-[10px] text-brand hover:underline font-medium">
            {regenerateSection.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
          </button>
        </div>
      </div>

      {editing ? (
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
          className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary resize-y focus:outline-none focus:border-border-glow" />
      ) : (
        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{section.content || '—'}</p>
      )}

      {section.gapFlags?.length > 0 && !section.gapsDismissed && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {section.gapFlags.map((g: string, i: number) => (
            <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium border border-[#FDE68A]">
              <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={1.5} /> {g}
            </span>
          ))}
        </div>
      )}
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

  // Dropdown state for Generate form
  const [genDealSearch, setGenDealSearch] = useState('');
  const [showGenDealDrop, setShowGenDealDrop] = useState(false);
  const genDealDropRef = useRef<HTMLDivElement>(null);

  const [genContactSearch, setGenContactSearch] = useState('');
  const [showGenContactDrop, setShowGenContactDrop] = useState(false);
  const genContactDropRef = useRef<HTMLDivElement>(null);

  const [genTemplateSearch, setGenTemplateSearch] = useState('');
  const [showGenTemplateDrop, setShowGenTemplateDrop] = useState(false);
  const genTemplateDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (genDealDropRef.current && !genDealDropRef.current.contains(e.target as Node)) setShowGenDealDrop(false);
      if (genContactDropRef.current && !genContactDropRef.current.contains(e.target as Node)) setShowGenContactDrop(false);
      if (genTemplateDropRef.current && !genTemplateDropRef.current.contains(e.target as Node)) setShowGenTemplateDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

            {/* Editable Sections */}
            {(detailData.sections?.length ?? 0) > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Sections ({detailData.openGapsCount} open gap{detailData.openGapsCount !== 1 ? 's' : ''})</p>
                {detailData.sections!.map((s) => (
                  <EditableSection
                    key={s.id}
                    proposalId={detailData.id}
                    section={s}
                  />
                ))}
              </div>
            )}

            {/* Approval */}
            {detailData.id && <ApprovalPanel entityType={ApprovalEntityType.Proposal} entityId={detailData.id} entityName={detailData.title} />}

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
      <SlideOver
        open={genOpen}
        onClose={() => { setGenOpen(false); resetForm(); }}
        title="Generate Proposal"
        subtitle="Create a proposal from an existing deal"
        wide
        padRight
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setGenOpen(false); resetForm(); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generateProposal.isPending || !dealId.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generateProposal.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <ClipboardList className="w-3.5 h-3.5" />}
              Generate Proposal
            </button>
          </div>
        }
      >
        {/* ── Deal & Contact ── */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Deal & Contact</span>
          <div className="h-px bg-brand/20" />
        </div>

        {/* Deal */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Deal <span className="text-danger">*</span></label>
          <div className="relative" ref={genDealDropRef}>
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              placeholder="Search existing deals…"
              autoComplete="off"
              value={genDealSearch}
              onChange={e => { setGenDealSearch(e.target.value); setShowGenDealDrop(true); }}
              onFocus={() => setShowGenDealDrop(true)}
            />
            {genDealSearch ? (
              <button type="button" onClick={() => { setGenDealSearch(''); setShowGenDealDrop(false); setDealId(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            ) : null}
            {showGenDealDrop && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                style={{ borderRadius: 12, background: '#132420', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)' }}
              >
                {dealsList.filter(d => !genDealSearch || d.name.toLowerCase().includes(genDealSearch.toLowerCase())).length > 0
                  ? dealsList.filter(d => !genDealSearch || d.name.toLowerCase().includes(genDealSearch.toLowerCase())).map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setDealId(d.id); setGenDealSearch(''); setShowGenDealDrop(false); }}
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
          <div className="relative" ref={genContactDropRef}>
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              placeholder="Search existing contacts…"
              autoComplete="off"
              value={genContactSearch}
              onChange={e => { setGenContactSearch(e.target.value); setShowGenContactDrop(true); }}
              onFocus={() => setShowGenContactDrop(true)}
            />
            {genContactSearch ? (
              <button type="button" onClick={() => { setGenContactSearch(''); setShowGenContactDrop(false); setContactId(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            ) : null}
            {showGenContactDrop && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                style={{ borderRadius: 12, background: '#132420', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)' }}
              >
                {contactsList.filter(c => !genContactSearch || c.fullName.toLowerCase().includes(genContactSearch.toLowerCase())).length > 0
                  ? contactsList.filter(c => !genContactSearch || c.fullName.toLowerCase().includes(genContactSearch.toLowerCase())).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setContactId(c.id); setGenContactSearch(''); setShowGenContactDrop(false); }}
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

        {/* Template */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">Template</label>
          <div className="relative" ref={genTemplateDropRef}>
            <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
            <input
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
              placeholder="Select a template…"
              autoComplete="off"
              value={genTemplateSearch}
              onChange={e => { setGenTemplateSearch(e.target.value); setShowGenTemplateDrop(true); }}
              onFocus={() => setShowGenTemplateDrop(true)}
            />
            {genTemplateSearch ? (
              <button type="button" onClick={() => { setGenTemplateSearch(''); setShowGenTemplateDrop(false); setTemplateId(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            ) : null}
            {showGenTemplateDrop && (
              <div
                className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                style={{ borderRadius: 12, background: '#132420', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)' }}
              >
                {templates.filter((t: any) => !genTemplateSearch || t.name.toLowerCase().includes(genTemplateSearch.toLowerCase())).length > 0
                  ? templates.filter((t: any) => !genTemplateSearch || t.name.toLowerCase().includes(genTemplateSearch.toLowerCase())).map((t: any) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setTemplateId(t.id); setGenTemplateSearch(''); setShowGenTemplateDrop(false); }}
                      className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-glass-1 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 8px rgba(0,217,138,0.35), 0 0 16px rgba(0,217,138,0.15)' }}>
                        <ClipboardList className="w-4 h-4 text-brand" strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-text-primary truncate">{t.name}</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-brand shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9), 0 0 12px rgba(0,217,138,0.5)' }} />
                    </button>
                  ))
                  : <div className="px-4 py-3 text-xs text-text-muted">No templates found</div>
                }
              </div>
            )}
          </div>
        </div>
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
