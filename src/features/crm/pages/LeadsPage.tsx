import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Flame,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bot,
  Megaphone,
  GitBranch,
  Plus,
  X,
  Check,
  Trash2,
  User,
  Phone,
  Mail,
  Layers,
  Star,
  Radio,
  FileText,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { confirmDialog } from '@/shared/ui/confirm';
import { useLeads, useLeadStats, useImportLeadsCsv, useCreateLead, useFindContactDuplicates, useBulkLeadAction, useContacts, useOrganizations } from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';
import { BulkLeadAction } from '../types/crm.types';
import { CsvToolbar } from '../components/CsvToolbar';
import { DuplicateWarning } from '../components/DuplicateWarning';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { CrmEntityType } from '../types/crm.types';
import { CustomFieldsInline } from '../components/CustomFieldsInline';
import { crmApi } from '../api/crm.api';
import type {
  LeadSummaryDto,
  LeadStatsDto,
  LeadFilter,
  PagedResult,
  CreateManualLeadRequest,
  CrmContactSummaryDto,
  CrmOrganizationSummaryDto,
  CrmDuplicateMatchDto,
} from '../types/crm.types';
import {
  LeadStage,
  LeadSource,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  CHANNEL_LABELS,
} from '../types/crm.types';

const PAGE_SIZE = 20;

// ─── Source section tabs ──────────────────────────────────────────────────────

type SourceTab = 'all' | 'chatbot' | 'campaign' | 'nurture';

const SOURCE_TABS: { key: SourceTab; label: string; icon: React.ElementType }[] = [
  { key: 'all',      label: 'All Leads',   icon: Users },
  { key: 'chatbot',  label: 'Chatbot',     icon: Bot },
  { key: 'campaign', label: 'Campaign',    icon: Megaphone },
  { key: 'nurture',  label: 'In Nurture',  icon: GitBranch },
];

const STAGE_PILLS: { label: string; value: LeadStage | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'New', value: LeadStage.New },
  { label: 'Warm', value: LeadStage.Warm },
  { label: 'Hot', value: LeadStage.Hot },
  { label: 'Nurturing', value: LeadStage.Nurturing },
  { label: 'Converted', value: LeadStage.Converted },
  { label: 'Lost', value: LeadStage.Lost },
];

const MIN_SCORE_OPTIONS = [
  { label: 'Any score', value: undefined },
  { label: '30+', value: 30 },
  { label: '50+', value: 50 },
  { label: '70+', value: 70 },
];

function scoreBarColor(score: number): string {
  if (score <= 30) return 'bg-text-muted';
  if (score <= 55) return 'bg-[#F59E0B]';
  return 'bg-brand';
}

const SOURCE_BADGE: Record<LeadSource, { label: string; cls: string } | null> = {
  0: null,
  1: { label: 'Chatbot',  cls: 'text-brand bg-brand-soft border-border-glow' },
  2: { label: 'Campaign', cls: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]' },
  3: { label: 'Manual',   cls: 'text-text-muted bg-bg-elevated border-border-subtle' },
};

function CsvLeadsToolbar() {
  const importCsv = useImportLeadsCsv();
  return (
    <CsvToolbar
      exportUrl="/v1/crm/leads/export-csv"
      templateUrl="/v1/crm/leads/csv-template"
      entityLabel="leads"
      onImport={async file => { await importCsv.mutateAsync(file); }}
      isImporting={importCsv.isPending}
    />
  );
}

export function Component() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab]     = useState<SourceTab>('all');
  const [page, setPage]               = useState(1);
  const [selectedStage, setSelectedStage] = useState<LeadStage | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [minScore, setMinScore]       = useState<number | undefined>(undefined);
  const [showCreate, setShowCreate]   = useState(false);
  const [stageOpen, setStageOpen]         = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [contactQuery, setContactQuery]   = useState('');
  const [showContactDrop, setShowContactDrop] = useState(false);
  const contactDropRef = useRef<HTMLDivElement>(null);
  const [orgSearch, setOrgSearch]         = useState('');
  const [orgQuery, setOrgQuery]           = useState('');
  const [showOrgDrop, setShowOrgDrop]     = useState(false);
  const orgDropRef                        = useRef<HTMLDivElement>(null);
  const [orgDetails, setOrgDetails]       = useState({ name: '', domain: '', industry: '', employeeCount: '', country: '', city: '', website: '' });
  const [form, setForm]               = useState<CreateManualLeadRequest>({ stage: LeadStage.New });
  const [leadCustomFields, setLeadCustomFields] = useState<Record<string, string>>({});
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const createLead                    = useCreateLead();
  const bulkAction                    = useBulkLeadAction();
  const { data: teamRaw }             = useTeamMembers();
  const teamMembers                   = (teamRaw as unknown as UserDto[] | undefined) ?? [];

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  // Advisory dedup check while creating a lead (debounced). Non-blocking: leads can legitimately
  // recur per channel, so we surface existing contacts/leads but don't prevent creation.
  const dupEmail = useDebounce(form.customerEmail ?? '', 400);
  const dupPhone = useDebounce(form.customerPhone ?? '', 400);
  const { data: leadDupes } = useFindContactDuplicates(
    showCreate ? dupEmail : undefined,
    showCreate ? dupPhone : undefined,
  );
  const leadMatches = (leadDupes as unknown as CrmDuplicateMatchDto[] | undefined) ?? [];

  const { data: rawContactData } = useContacts({ search: contactQuery || undefined, pageSize: 6 });
  const contactSuggestions = ((rawContactData as unknown as PagedResult<CrmContactSummaryDto> | undefined)?.items ?? [])
    .slice()
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const { data: rawOrgData } = useOrganizations({ search: orgQuery || undefined, pageSize: 6 });
  const orgSuggestions = (rawOrgData as unknown as PagedResult<CrmOrganizationSummaryDto> | undefined)?.items ?? [];

  // Debounce main search 300ms
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounce contact search 300ms
  useEffect(() => {
    const t = setTimeout(() => setContactQuery(contactSearch), 300);
    return () => clearTimeout(t);
  }, [contactSearch]);

  // Debounce org search 300ms
  useEffect(() => {
    const t = setTimeout(() => setOrgQuery(orgSearch), 300);
    return () => clearTimeout(t);
  }, [orgSearch]);

  // Close contact dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contactDropRef.current && !contactDropRef.current.contains(e.target as Node)) {
        setShowContactDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close org dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (orgDropRef.current && !orgDropRef.current.contains(e.target as Node)) {
        setShowOrgDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedStage, search, minScore]);

  // Drop selections whenever the visible set changes — selected ids may no longer be on screen.
  useEffect(() => {
    setSelected(new Set());
  }, [activeTab, selectedStage, search, minScore, page]);

  const runBulkStage = (stage: LeadStage) => {
    if (selected.size === 0) return;
    bulkAction.mutate(
      { leadIds: [...selected], action: BulkLeadAction.Stage, stage },
      { onSuccess: () => clearSelection() },
    );
  };
  const runBulkAssign = (userId: string | null) => {
    if (selected.size === 0) return;
    bulkAction.mutate(
      { leadIds: [...selected], action: BulkLeadAction.Assign, assignToUserId: userId },
      { onSuccess: () => clearSelection() },
    );
  };
  const runBulkDelete = async () => {
    if (selected.size === 0) return;
    const ok = await confirmDialog({
      message: `Delete ${selected.size} selected lead${selected.size > 1 ? 's' : ''}? This can't be undone from here.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    bulkAction.mutate(
      { leadIds: [...selected], action: BulkLeadAction.Delete },
      { onSuccess: () => clearSelection() },
    );
  };

  const filter: LeadFilter = {
    stage:      selectedStage,
    source:     activeTab === 'chatbot'  ? LeadSource.Chatbot
               : activeTab === 'campaign' ? LeadSource.Campaign
               : undefined,
    hasNurture: activeTab === 'nurture' ? true : undefined,
    search:     search || undefined,
    minScore,
    page,
    pageSize:   PAGE_SIZE,
  };

  const { data: rawLeads, isLoading: leadsLoading } = useLeads(filter);
  const { data: rawStats, isLoading: statsLoading } = useLeadStats();

  const pagedResult = rawLeads as unknown as PagedResult<LeadSummaryDto> | undefined;
  const stats       = rawStats as unknown as LeadStatsDto | undefined;

  const leads      = pagedResult?.items ?? [];
  const totalCount = pagedResult?.totalCount ?? 0;
  const fromItem   = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toItem     = Math.min(page * PAGE_SIZE, totalCount);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Tab count badges
  const tabCounts: Record<SourceTab, number | undefined> = {
    all:      stats?.total,
    chatbot:  stats?.chatbotCount,
    campaign: stats?.campaignCount,
    nurture:  stats?.inNurtureCount,
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">CRM — Leads</h1>
          <p className="text-sm text-text-secondary mt-1">
            Track and manage leads captured from bot conversations, campaigns, and nurture sequences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setForm({ stage: LeadStage.New }); setContactSearch(''); setOrgSearch(''); setOrgDetails({ name: '', domain: '', industry: '', employeeCount: '', country: '', city: '', website: '' }); setShowCreate(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Lead
          </button>
          <CsvLeadsToolbar />
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div
            className="drawer-slide-in relative w-[640px] flex flex-col overflow-hidden"
            style={{
              borderRadius: 18,
              background: 'var(--bg-card)',
              border: '1px solid rgba(0,217,138,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
              maxHeight: 'calc(100vh - 32px)',
            }}
          >
            {/* Accent bar — mirrors AuroraBI notification panel top stripe */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
            <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2
                  className="text-base font-extrabold leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >New Lead</h2>
                <p className="text-xs text-text-muted mt-0.5">Capture a new lead into your pipeline</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {/* ── Contact Details ── */}
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Contact Details</span>
                <div className="h-px bg-brand/20" />
              </div>

              {/* Contact search combobox */}
              <div className="relative" ref={contactDropRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="Search existing contacts…"
                  autoComplete="off"
                  value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setShowContactDrop(true); }}
                  onFocus={() => setShowContactDrop(true)}
                />
                {contactSearch && (
                  <button
                    type="button"
                    onClick={() => { setContactSearch(''); setContactQuery(''); setShowContactDrop(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                )}
                {showContactDrop && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                    style={{
                      borderRadius: 12,
                      background: '#132420',
                      border: '1px solid rgba(0,217,138,0.20)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)',
                    }}
                  >
                    {contactSuggestions.length > 0 ? contactSuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, customerName: c.fullName, customerPhone: c.phone ?? '', customerEmail: c.email ?? '' }));
                          setContactSearch('');
                          setContactQuery('');
                          setShowContactDrop(false);
                        }}
                        className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-glass-1 transition-colors text-left"
                      >
                        <div className="relative shrink-0">
                          <div
                            className="w-8 h-8 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center"
                            style={{ boxShadow: '0 0 8px rgba(0,217,138,0.35), 0 0 16px rgba(0,217,138,0.15)' }}
                          >
                            <span className="text-xs font-bold text-brand">
                              {c.fullName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-text-primary truncate">{c.fullName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.phone && <span className="text-xs text-text-muted">{c.phone}</span>}
                            {c.phone && c.email && <span className="text-xs text-text-muted">·</span>}
                            {c.email && <span className="text-xs text-text-muted truncate">{c.email}</span>}
                          </div>
                        </div>
                        <span
                          className="w-2 h-2 rounded-full bg-brand shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9), 0 0 12px rgba(0,217,138,0.5)' }}
                        />
                      </button>
                    )) : (
                      <div className="px-4 py-3 text-xs text-text-muted">No contacts found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-2xs text-text-muted">or fill manually</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              {/* Full Name + Phone — two columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="John Doe"
                      value={form.customerName ?? ''}
                      onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="+977 98XXXXXXXX"
                      value={form.customerPhone ?? ''}
                      onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="john@example.com"
                    value={form.customerEmail ?? ''}
                    onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                  />
                </div>
              </div>
              {/* ── Organization Details ── */}
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Organization Details</span>
                <div className="h-[1.5px] bg-brand/20" />
              </div>

              {/* Org search combobox */}
              <div className="relative" ref={orgDropRef}>
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                <input
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-colors"
                  style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  placeholder="Search existing organizations…"
                  autoComplete="off"
                  value={orgSearch}
                  onChange={e => { setOrgSearch(e.target.value); setShowOrgDrop(true); }}
                  onFocus={() => setShowOrgDrop(true)}
                />
                {orgSearch && (
                  <button
                    type="button"
                    onClick={() => { setOrgSearch(''); setOrgQuery(''); setShowOrgDrop(false); setForm(f => ({ ...f, organizationId: undefined })); setOrgDetails({ name: '', domain: '', industry: '', employeeCount: '', country: '', city: '', website: '' }); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                )}
                {showOrgDrop && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 z-20 overflow-hidden"
                    style={{ borderRadius: 12, background: '#132420', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,217,138,0.08)' }}
                  >
                    {orgSuggestions.length > 0 ? orgSuggestions.map(org => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, organizationId: org.id }));
                          setOrgDetails({ name: org.name, domain: org.domain ?? '', industry: org.industry ?? '', employeeCount: org.employeeCount?.toString() ?? '', country: org.country ?? '', city: '', website: '' });
                          setOrgSearch('');
                          setOrgQuery('');
                          setShowOrgDrop(false);
                        }}
                        className="group w-full flex items-center gap-3 px-3 py-2.5 hover:bg-glass-1 transition-colors text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center shrink-0"
                          style={{ boxShadow: '0 0 8px rgba(0,217,138,0.35), 0 0 16px rgba(0,217,138,0.15)' }}
                        >
                          <Building2 className="w-4 h-4 text-brand" strokeWidth={1.6} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-text-primary truncate">{org.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {org.domain && <span className="text-xs text-text-muted">{org.domain}</span>}
                            {org.domain && org.industry && <span className="text-xs text-text-muted">·</span>}
                            {org.industry && <span className="text-xs text-text-muted truncate">{org.industry}</span>}
                          </div>
                        </div>
                        <span
                          className="w-2 h-2 rounded-full bg-brand shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ boxShadow: '0 0 6px rgba(0,217,138,0.9), 0 0 12px rgba(0,217,138,0.5)' }}
                        />
                      </button>
                    )) : (
                      <div className="px-4 py-3 text-xs text-text-muted">No organizations found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Org "or fill manually" divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-2xs text-text-muted">or fill manually</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              {/* Company Name + Domain */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="Acme Corp"
                      value={orgDetails.name}
                      onChange={e => setOrgDetails(d => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Domain</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="acme.com"
                      value={orgDetails.domain}
                      onChange={e => setOrgDetails(d => ({ ...d, domain: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              {/* Industry + Employees */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Industry</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="SaaS, Retail…"
                      value={orgDetails.industry}
                      onChange={e => setOrgDetails(d => ({ ...d, industry: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Employees</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      type="number" min={0}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="250"
                      value={orgDetails.employeeCount}
                      onChange={e => setOrgDetails(d => ({ ...d, employeeCount: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              {/* Country + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Country</label>
                  <div className="relative">
                    <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="US"
                      value={orgDetails.country}
                      onChange={e => setOrgDetails(d => ({ ...d, country: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">City</label>
                  <div className="relative">
                    <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="New York"
                      value={orgDetails.city}
                      onChange={e => setOrgDetails(d => ({ ...d, city: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Website</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="https://acme.com"
                    value={orgDetails.website}
                    onChange={e => setOrgDetails(d => ({ ...d, website: e.target.value }))}
                  />
                </div>
              </div>

              {/* ── Lead ── */}
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Lead</span>
                <div className="h-px bg-brand/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Stage</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStageOpen(o => !o)}
                      className="w-full flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl text-sm text-text-primary"
                      style={{
                        backgroundColor: '#1A332C',
                        border: `1px solid ${stageOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                        boxShadow: stageOpen
                          ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)'
                          : 'none',
                        outline: 'none',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      <Layers className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.6} />
                      <span className={`flex-1 text-left font-medium ${
                        form.stage === LeadStage.Hot  ? 'text-danger' :
                        form.stage === LeadStage.Warm ? 'text-[#F59E0B]' : 'text-text-secondary'
                      }`}>
                        {LEAD_STAGE_LABELS[form.stage ?? LeadStage.New]}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${stageOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
                    </button>
                    {stageOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-10 overflow-hidden"
                        style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)' }}
                      >
                        {([
                          { value: LeadStage.New,  label: 'New',  dot: '#B8E6D5', hover: 'hover:bg-[rgba(184,230,213,0.08)]',  text: 'text-text-secondary' },
                          { value: LeadStage.Warm, label: 'Warm', dot: '#F59E0B', hover: 'hover:bg-[rgba(245,158,11,0.10)]',   text: 'text-[#F59E0B]' },
                          { value: LeadStage.Hot,  label: 'Hot',  dot: '#F43F5E', hover: 'hover:bg-[rgba(244,63,94,0.10)]',    text: 'text-danger' },
                        ] as const).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setForm(f => ({ ...f, stage: opt.value })); setStageOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors ${opt.hover} ${opt.text} ${form.stage === opt.value ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.dot, boxShadow: `0 0 6px ${opt.dot}` }} />
                            {opt.label}
                            {form.stage === opt.value && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Lead Score (0–100)</label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                      placeholder="e.g. 75"
                      value={form.score ?? ''}
                      onChange={e => setForm(f => ({ ...f, score: e.target.value ? Math.min(100, Math.max(0, Number(e.target.value))) : undefined }))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Source / How did you meet?</label>
                <div className="relative">
                  <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="Trade show, Referral, Cold outreach…"
                    value={form.adSource ?? ''}
                    onChange={e => setForm(f => ({ ...f, adSource: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <textarea
                    rows={3}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] resize-none"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    placeholder="Interested in enterprise plan, follow up next week…"
                    value={form.notes ?? ''}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              {leadMatches.length > 0 && (
                <DuplicateWarning
                  matches={leadMatches}
                  onCreateAnyway={() => createLead.mutate({
                    ...form,
                    companyName: orgDetails.name || undefined,
                    companyDomain: orgDetails.domain || undefined,
                    companyIndustry: orgDetails.industry || undefined,
                    companyEmployeeCount: orgDetails.employeeCount ? Number(orgDetails.employeeCount) : undefined,
                    companyCity: orgDetails.city || undefined,
                    companyCountry: orgDetails.country || undefined,
                    companyWebsite: orgDetails.website || undefined,
                  }, { onSuccess: (result: any) => {
                    const id = result?.id;
                    if (id) {
                      const toSave = Object.entries(leadCustomFields).filter(([, v]) => v);
                      if (toSave.length > 0) crmApi.setCustomFieldValues(id, CrmEntityType.Lead, { values: toSave.map(([d, v]) => ({ definitionId: d, value: v })) });
                    }
                    setShowCreate(false);
                  }})}
                  isSaving={createLead.isPending}
                />
              )}
            </div>
            <div className="px-6 py-3">
              <CustomFieldsInline entityType={CrmEntityType.Lead} onValuesChange={setLeadCustomFields} />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
              >
                Cancel
              </button>
              <button
                disabled={createLead.isPending || (!form.customerName && !form.customerPhone && !form.customerEmail)}
                onClick={() => createLead.mutate({
                  ...form,
                  companyName: orgDetails.name || undefined,
                  companyDomain: orgDetails.domain || undefined,
                  companyIndustry: orgDetails.industry || undefined,
                  companyEmployeeCount: orgDetails.employeeCount ? Number(orgDetails.employeeCount) : undefined,
                  companyCountry: orgDetails.country || undefined,
                  companyCity: orgDetails.city || undefined,
                  companyWebsite: orgDetails.website || undefined,
                }, { onSuccess: (result: any) => {
                  const id = result?.id;
                  if (id) {
                    const toSave = Object.entries(leadCustomFields).filter(([, v]) => v);
                    if (toSave.length > 0) crmApi.setCustomFieldValues(id, CrmEntityType.Lead, { values: toSave.map(([d, v]) => ({ definitionId: d, value: v })) });
                  }
                  setShowCreate(false);
                }})}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createLead.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          <StatCard label="Total Leads"     value={stats?.total ?? 0}                         valueClass="text-text-primary" />
          <StatCard label="New"             value={stats?.newCount ?? 0}                       valueClass="text-[#60A5FA]" />
          <StatCard label="Warm"            value={stats?.warmCount ?? 0}                      valueClass="text-[#F59E0B]" />
          <StatCard label="Hot"             value={stats?.hotCount ?? 0}                       valueClass="text-danger"
            icon={<Flame className="w-4 h-4 text-danger" />} />
          <StatCard label="Converted"       value={stats?.convertedCount ?? 0}                 valueClass="text-success" />
          <StatCard label="Conversion Rate" value={`${(stats?.conversionRate ?? 0).toFixed(1)}%`} valueClass="text-brand" />
          <StatCard label="From Chatbot"    value={stats?.chatbotCount ?? 0}                   valueClass="text-brand"
            icon={<Bot className="w-4 h-4 text-brand" />} />
          <StatCard label="From Campaign"   value={stats?.campaignCount ?? 0}                  valueClass="text-[#A78BFA]"
            icon={<Megaphone className="w-4 h-4 text-[#A78BFA]" />} />
          <StatCard label="In Nurture"      value={stats?.inNurtureCount ?? 0}                 valueClass="text-[#34D399]"
            icon={<GitBranch className="w-4 h-4 text-[#34D399]" />} />
        </div>
      )}

      {/* Source section tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {SOURCE_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const count    = tabCounts[key];
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-brand-soft text-brand' : 'bg-bg-elevated text-text-muted'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, phone, intent..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg-elevated border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow transition-colors"
          />
        </div>

        {/* Stage pills */}
        <div className="flex gap-1.5 flex-wrap">
          {STAGE_PILLS.map((pill) => {
            const isActive = pill.value === selectedStage;
            return (
              <button
                key={pill.label}
                onClick={() => setSelectedStage(pill.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  isActive
                    ? 'bg-brand-soft text-brand border-border-glow'
                    : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Min score */}
        <select
          value={minScore ?? ''}
          onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2 text-text-secondary focus:outline-none focus:border-border-glow transition-colors cursor-pointer"
        >
          {MIN_SCORE_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lead list */}
      {leadsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.2} />
          <p className="text-text-secondary font-semibold">No leads yet</p>
          <p className="text-sm text-text-muted mt-1">
            {activeTab === 'chatbot'
              ? 'No leads captured from chatbot conversations yet'
              : activeTab === 'campaign'
              ? 'No leads created from campaign replies yet'
              : activeTab === 'nurture'
              ? 'No leads are currently in an active nurture sequence'
              : 'Leads are captured automatically when customers interact with your bot'}
          </p>
        </div>
      ) : (
        <>
          {/* Select-all toolbar */}
          <div className="flex items-center gap-3 -mb-1">
            <button
              onClick={() =>
                setSelected((prev) =>
                  prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id)),
                )
              }
              className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
            >
              <span
                className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all ${
                  selected.size === leads.length
                    ? 'bg-brand border-brand text-bg'
                    : 'border-border-medium'
                }`}
              >
                {selected.size === leads.length && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              {selected.size === leads.length ? 'Deselect all' : 'Select all on page'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                selected={selected.has(lead.id)}
                onToggle={() => toggleSelect(lead.id)}
                onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
              />
            ))}
          </div>
        </>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-bg-elevated border border-border-medium shadow-2xl">
          <span className="text-xs font-bold text-text-primary whitespace-nowrap">
            {selected.size} selected
          </span>
          <div className="h-5 w-px bg-border-subtle" />
          <select
            value=""
            disabled={bulkAction.isPending}
            onChange={(e) => { if (e.target.value) runBulkStage(Number(e.target.value) as LeadStage); }}
            className="text-xs bg-bg border border-border-subtle rounded-xl px-3 py-1.5 text-text-secondary focus:outline-none focus:border-border-glow cursor-pointer disabled:opacity-50"
          >
            <option value="">Set stage…</option>
            {STAGE_PILLS.filter((p) => p.value !== undefined).map((p) => (
              <option key={p.label} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value=""
            disabled={bulkAction.isPending}
            onChange={(e) => {
              if (e.target.value === 'unassign') runBulkAssign(null);
              else if (e.target.value) runBulkAssign(e.target.value);
            }}
            className="text-xs bg-bg border border-border-subtle rounded-xl px-3 py-1.5 text-text-secondary focus:outline-none focus:border-border-glow cursor-pointer disabled:opacity-50"
          >
            <option value="">Assign to…</option>
            <option value="unassign">Unassign</option>
            {teamMembers.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
          <button
            onClick={runBulkDelete}
            disabled={bulkAction.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-danger border border-border-subtle hover:bg-danger-soft hover:border-danger transition-all disabled:opacity-50"
          >
            {bulkAction.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete
          </button>
          <button
            onClick={clearSelection}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-muted">
            Showing {fromItem}–{toItem} of {totalCount} leads
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary disabled:opacity-40 hover:border-border-medium transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary disabled:opacity-40 hover:border-border-medium transition-all"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  valueClass?: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, valueClass = 'text-text-primary', icon }: StatCardProps) {
  return (
    <div className="flex-shrink-0 bg-bg-card border border-border-subtle rounded-2xl p-4 min-w-[120px]">
      <div className={`flex items-center gap-1.5 text-2xl font-extrabold ${valueClass}`}>
        {icon}
        {value}
      </div>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  );
}

interface LeadCardProps {
  lead: LeadSummaryDto;
  onClick: () => void;
  selected: boolean;
  onToggle: () => void;
}

function LeadCard({ lead, onClick, selected, onToggle }: LeadCardProps) {
  const displayName = lead.customerName || lead.channelHandle;
  const initial = (displayName?.[0] ?? '?').toUpperCase();
  const channelLabel = CHANNEL_LABELS[lead.channel] ?? 'Unknown';
  const stageLabel   = LEAD_STAGE_LABELS[lead.stage];
  const stageColor   = LEAD_STAGE_COLORS[lead.stage];
  const sourceBadge  = SOURCE_BADGE[lead.source ?? 0];

  const lastActive = (() => {
    try {
      return formatDistanceToNow(new Date(lead.lastActivityAt), { addSuffix: true });
    } catch {
      return '—';
    }
  })();

  return (
    <div
      onClick={onClick}
      className={`relative bg-glass-1 border-thin rounded-card p-3.5 flex flex-col gap-3 cursor-pointer hover:bg-glass-2 transition-all ${
        selected ? 'border-border-glow bg-brand-soft' : 'border-border-subtle hover:border-border-medium'
      }`}
    >
      {/* Avatar + stage badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`w-5 h-5 rounded-[5px] border flex items-center justify-center transition-all shrink-0 ${
              selected ? 'bg-brand border-brand text-bg' : 'border-border-medium text-transparent hover:border-brand'
            }`}
            title={selected ? 'Deselect' : 'Select'}
          >
            <Check className="w-3 h-3" strokeWidth={3} />
          </button>
          <div className="w-10 h-10 rounded-card bg-brand-soft border-thin border-border-glow flex items-center justify-center text-sm font-black text-brand">
            {initial}
          </div>
        </div>
        <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border-thin ${stageColor}`}>
          {stageLabel}
        </span>

        {/* Source badge */}
        {sourceBadge && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${sourceBadge.cls}`}>
            {sourceBadge.label}
          </span>
        )}
      </div>

      {/* Name + source + intent */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-bold text-text-primary truncate">{displayName}</span>
          {sourceBadge && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${sourceBadge.cls}`}>
              {sourceBadge.label}
            </span>
          )}
        </div>
        <span className="text-[10px] text-text-muted italic truncate">
          {lead.intentSummary || channelLabel}
        </span>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className={`h-full rounded-full ${scoreBarColor(lead.score)}`}
            style={{ width: `${lead.score}%` }}
          />
        </div>
        <span className="text-[10px] font-black text-text-secondary tabular-nums">{lead.score}</span>
      </div>

      {/* Footer: assigned + last active */}
      <div className="flex items-center justify-between pt-0.5 border-t border-thin border-border-subtle">
        <span className="text-[10px] text-text-muted truncate">
          {lead.assignedToUserName ?? 'Unassigned'}
        </span>
        <span className="text-[10px] text-text-muted whitespace-nowrap">{lastActive}</span>
      </div>
    </div>
  );
}
