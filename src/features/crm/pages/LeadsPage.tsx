import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { confirmDialog } from '@/shared/ui/confirm';
import { useLeads, useLeadStats, useImportLeadsCsv, useCreateLead, useFindContactDuplicates, useBulkLeadAction } from '../api/crm.queries';
import { BulkLeadAction } from '../types/crm.types';
import { CsvToolbar } from '../components/CsvToolbar';
import { DuplicateWarning } from '../components/DuplicateWarning';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type {
  LeadSummaryDto,
  LeadStatsDto,
  LeadFilter,
  PagedResult,
  CreateManualLeadRequest,
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
      onImport={file => importCsv.mutateAsync(file)}
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
  const [form, setForm]               = useState<CreateManualLeadRequest>({ stage: LeadStage.New });
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const createLead                    = useCreateLead();
  const bulkAction                    = useBulkLeadAction();

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
  const leadMatches = leadDupes ?? [];

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
            onClick={() => { setForm({ stage: LeadStage.New }); setShowCreate(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Lead
          </button>
          <CsvLeadsToolbar />
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-bg-card border border-border-subtle rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="text-sm font-bold text-text-primary">New Lead</h2>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name</label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
                  placeholder="John Doe"
                  value={form.customerName ?? ''}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Phone</label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
                  placeholder="+977 98XXXXXXXX"
                  value={form.customerPhone ?? ''}
                  onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
                  placeholder="john@example.com"
                  value={form.customerEmail ?? ''}
                  onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Stage</label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-medium"
                  value={form.stage ?? LeadStage.New}
                  onChange={e => setForm(f => ({ ...f, stage: Number(e.target.value) as LeadStage }))}
                >
                  <option value={LeadStage.New}>New</option>
                  <option value={LeadStage.Warm}>Warm</option>
                  <option value={LeadStage.Hot}>Hot</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Source / How did you meet?</label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium"
                  placeholder="Trade show, Referral, Cold outreach…"
                  value={form.adSource ?? ''}
                  onChange={e => setForm(f => ({ ...f, adSource: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium resize-none"
                  placeholder="Interested in enterprise plan, follow up next week…"
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              {leadMatches.length > 0 && (
                <DuplicateWarning
                  matches={leadMatches}
                  onCreateAnyway={() => createLead.mutate(form, { onSuccess: () => setShowCreate(false) })}
                  isSaving={createLead.isPending}
                />
              )}
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
                onClick={() => createLead.mutate(form, { onSuccess: () => setShowCreate(false) })}
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
