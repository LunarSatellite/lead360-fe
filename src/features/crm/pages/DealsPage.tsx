import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase, Plus, Loader2, LayoutGrid, List, Trophy,
  CheckCircle, XCircle, DollarSign, Calendar, ChevronLeft, ChevronRight, Search,
  Settings, Trash2, ChevronUp, ChevronDown, X, GitBranch, Filter, User, Check, Building2,
} from 'lucide-react';
import { confirmDialog } from '@/shared/ui/confirm';
import { crmApi } from '../api/crm.api';
import {
  useDeals, useDealStages, useMoveDealStage, useCloseDeal,
  useCreateDealStage, useUpdateDealStage, useDeleteDealStage, usePipelines,
  useImportDealsCsv, useCreateDeal, useBulkDeleteDeals, useBulkDealAction, useAccounts, useContacts,
} from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { CsvToolbar } from '../components/CsvToolbar';
import type { CrmDealStageCreateRequest, CrmDealCreateRequest } from '../types/crm.types';
import { CrmEntityType, BulkDealAction } from '../types/crm.types';
import { CustomFieldsInline } from '../components/CustomFieldsInline';
import type {
  CrmDealSummaryDto, CrmDealStageSummaryDto, CrmDealFilter, PagedResult,
} from '../types/crm.types';
import { CRM_DEAL_STATUS_LABELS, CRM_DEAL_STATUS_COLORS } from '../types/crm.types';
import { ROUTES } from '@/app/router/route-paths';
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

type View = 'kanban' | 'list';
const LIST_PAGE_SIZE = 20;

// ─── Deal Card ────────────────────────────────────────────────────────────────

interface DealCardProps {
  deal: CrmDealSummaryDto;
  isCloseMenuOpen: boolean;
  onToggleCloseMenu: (e: React.MouseEvent) => void;
  onCloseWon: () => void;
  onCloseLost: () => void;
  onDragStart: () => void;
  onClick: () => void;
}

function DealCard({
  deal, isCloseMenuOpen, onToggleCloseMenu, onCloseWon, onCloseLost, onDragStart, onClick,
}: DealCardProps) {
  const isOpen = deal.status === 1; // CrmDealStatus.Open

  let closeDateColor = 'text-text-muted';
  let closeDateLabel: string | null = null;
  if (deal.closeDate) {
    const d = new Date(deal.closeDate);
    const daysLeft = differenceInDays(d, new Date());
    if (isPast(d)) {
      closeDateColor = 'text-danger';
      closeDateLabel = `${format(d, 'MMM d')} (overdue)`;
    } else if (daysLeft <= 7) {
      closeDateColor = 'text-[#F59E0B]';
      closeDateLabel = format(d, 'MMM d');
    } else {
      closeDateLabel = format(d, 'MMM d');
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
      onClick={onClick}
      className="group relative rounded-xl border border-border-subtle bg-bg-elevated p-3 cursor-pointer hover:border-border-medium hover:shadow-sm transition-all"
    >
      <div className="font-semibold text-sm text-text-primary leading-snug pr-6">{deal.name}</div>
      {deal.accountName && (
        <div className="text-xs text-text-muted mt-0.5 truncate">{deal.accountName}</div>
      )}

      <div className="flex items-center gap-3 mt-2.5 text-xs flex-wrap">
        {deal.amount != null && (
          <span className="flex items-center gap-1 text-text-secondary font-semibold">
            <DollarSign className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
            {deal.currency} {deal.amount.toLocaleString()}
          </span>
        )}
        {closeDateLabel && (
          <span className={`flex items-center gap-1 ${closeDateColor}`}>
            <Calendar className="w-3 h-3" strokeWidth={1.5} />
            {closeDateLabel}
          </span>
        )}
        {deal.ownedByUserName && (
          <span className="flex items-center gap-1 text-text-muted">
            <User className="w-3 h-3" strokeWidth={1.5} />
            {deal.ownedByUserName}
          </span>
        )}
      </div>

      {/* Close deal quick action — only for open deals */}
      {isOpen && (
        <div
          className="absolute top-2.5 right-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {isCloseMenuOpen ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onCloseWon}
                className="p-1 rounded-md bg-success-soft text-success hover:bg-success hover:text-bg transition-all"
                title="Won"
              >
                <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={onCloseLost}
                className="p-1 rounded-md bg-danger-soft text-danger hover:bg-danger hover:text-bg transition-all"
                title="Lost"
              >
                <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={onToggleCloseMenu}
              className="p-1 rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:bg-bg-card hover:text-text-secondary transition-all"
              title="Close deal"
            >
              <Trophy className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}

      {/* Closed badge */}
      {!isOpen && (
        <div className="mt-2">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${CRM_DEAL_STATUS_COLORS[deal.status]}`}>
            {CRM_DEAL_STATUS_LABELS[deal.status]}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── CSV Toolbar ──────────────────────────────────────────────────────────────

function CsvDealsToolbar() {
  const importCsv = useImportDealsCsv();
  return (
    <CsvToolbar
      exportUrl="/v1/crm/deals/export-csv"
      templateUrl="/v1/crm/deals/csv-template"
      entityLabel="deals"
      onImport={async (file) => { await importCsv.mutateAsync(file); }}
      isImporting={importCsv.isPending}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Drill-down from analytics widgets lands here pre-filtered: ?status= / ?stageId= / ?ownedByUserId= open the list view filtered.
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status');
  const initialStageId = searchParams.get('stageId');
  const initialOwnedByUserId = searchParams.get('ownedByUserId');
  const [view, setView] = useState<View>(
    initialStatus || initialStageId || initialOwnedByUserId ? 'list' : 'kanban',
  );
  const [search, setSearch] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<CrmDealFilter>({
    page: 1,
    pageSize: LIST_PAGE_SIZE,
    status: initialStatus ? (Number(initialStatus) as CrmDealFilter['status']) : undefined,
    stageId: initialStageId ?? undefined,
    ownedByUserId: initialOwnedByUserId ?? undefined,
  });
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [closeMenuId, setCloseMenuId] = useState<string | null>(null);
  const dragDealRef = useRef<string | null>(null);

  const [showNewDeal, setShowNewDeal] = useState(false);
  const [ndName, setNdName] = useState('');
  const [ndStageId, setNdStageId] = useState('');
  const [ndStageOpen, setNdStageOpen] = useState(false);
  const ndStageRef = useRef<HTMLDivElement>(null);
  const [ndAmount, setNdAmount] = useState('');
  const [ndCloseDate, setNdCloseDate] = useState('');
  const [ndOwnerId, setNdOwnerId] = useState('');
  const [ndAccountId, setNdAccountId] = useState('');
  const [ndContactId, setNdContactId] = useState('');
  const [ndCustomFields, setNdCustomFields] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterOwnerId, setFilterOwnerId] = useState('');
  const [filterCloseDateFrom, setFilterCloseDateFrom] = useState('');
  const [filterCloseDateTo, setFilterCloseDateTo] = useState('');
  const [filterInactive, setFilterInactive] = useState(false);

  function toggleInactive() {
    const next = !filterInactive;
    setFilterInactive(next);
    setListFilter((f) => ({ ...f, inactiveSinceDays: next ? 7 : undefined, page: 1 }));
  }

  const { data: rawPipelines } = usePipelines();
  const pipelines = (rawPipelines as any) ?? [];
  const activePipelineId = selectedPipelineId ?? (pipelines[0]?.id ?? null);

  const { data: rawStages } = useDealStages(activePipelineId ? { pipelineId: activePipelineId } : undefined);
  const stages = (rawStages as unknown as CrmDealStageSummaryDto[] | undefined)
    ?.slice()
    .sort((a, b) => a.order - b.order) ?? [];

  const { data: teamRaw } = useTeamMembers();
  const teamMembers = (teamRaw as unknown as UserDto[] | undefined) ?? [];

  const kanbanFilter: CrmDealFilter = {
    pageSize: 500,
    pipelineId: activePipelineId ?? undefined,
    ownedByUserId: filterOwnerId || undefined,
    closeDateFrom: filterCloseDateFrom || undefined,
    closeDateTo: filterCloseDateTo || undefined,
    inactiveSinceDays: filterInactive ? 7 : undefined,
  };

  const { data: rawKanban, isLoading: kanbanLoading } = useDeals(kanbanFilter);
  const kanbanData = rawKanban as unknown as PagedResult<CrmDealSummaryDto> | undefined;

  const { data: rawList, isLoading: listLoading } = useDeals(listFilter);
  const listData = rawList as unknown as PagedResult<CrmDealSummaryDto> | undefined;

  const moveStage = useMoveDealStage();
  const closeDeal = useCloseDeal();
  const [winReason, setWinReason] = useState('');
  const [winDealId, setWinDealId] = useState<string | null>(null);
  const createDeal = useCreateDeal();
  const bulkDelete = useBulkDeleteDeals();
  const bulkAction = useBulkDealAction();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const listItems = listData?.items ?? [];
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  // Drop selections when the visible list changes (filter/page) or the view switches.
  useEffect(() => { setSelected(new Set()); }, [listFilter, view]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ndStageRef.current && !ndStageRef.current.contains(e.target as Node)) setNdStageOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const runBulkDelete = async () => {
    if (selected.size === 0) return;
    const ok = await confirmDialog({
      message: `Delete ${selected.size} selected deal${selected.size > 1 ? 's' : ''}? This can't be undone from here.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    bulkDelete.mutate([...selected], { onSuccess: () => clearSelection() });
  };
  const runBulkStage = (stageId: string) => {
    if (selected.size === 0) return;
    bulkAction.mutate(
      { dealIds: [...selected], action: BulkDealAction.Stage, stageId },
      { onSuccess: () => clearSelection() },
    );
  };
  const runBulkAssign = (userId: string | null) => {
    if (selected.size === 0) return;
    bulkAction.mutate(
      { dealIds: [...selected], action: BulkDealAction.Assign, assignToUserId: userId },
      { onSuccess: () => clearSelection() },
    );
  };

  const activeFiltersCount = [filterOwnerId, filterCloseDateFrom, filterCloseDateTo, filterInactive ? 'inactive' : ''].filter(Boolean).length;

  const { data: accountsRaw } = useAccounts({ pageSize: 200 });
  const accountsList = (accountsRaw as any)?.items ?? [];
  const { data: contactsRaw } = useContacts({ pageSize: 200 });
  const contactsList = (contactsRaw as any)?.items ?? [];

  function resetNewDeal() {
    setNdName(''); setNdStageId(''); setNdStageOpen(false); setNdAmount(''); setNdCloseDate(''); setNdOwnerId(''); setNdAccountId(''); setNdContactId(''); setNdCustomFields({});
  }

  function submitNewDeal() {
    if (!ndName.trim() || !ndStageId) return;
    const payload: CrmDealCreateRequest = {
      name: ndName.trim(),
      stageId: ndStageId,
      pipelineId: activePipelineId ?? undefined,
      amount: ndAmount ? parseFloat(ndAmount) : undefined,
      closeDate: ndCloseDate || undefined,
      ownedByUserId: ndOwnerId || undefined,
      accountId: ndAccountId || undefined,
      contactId: ndContactId || undefined,
    };
    createDeal.mutate(payload, {
      onSuccess: (result: any) => {
        const dealId = result?.id;
        if (dealId) {
          const toSave = Object.entries(ndCustomFields).filter(([, v]) => v);
          if (toSave.length > 0) {
            crmApi.setCustomFieldValues(dealId, CrmEntityType.Deal, { values: toSave.map(([definitionId, value]) => ({ definitionId, value })) });
          }
        }
        setShowNewDeal(false); resetNewDeal(); toast.success('Deal created');
      },
      onError: () => toast.error('Failed to create deal'),
    });
  }
  const createStage = useCreateDealStage();
  const updateStage = useUpdateDealStage();
  const deleteStage = useDeleteDealStage();
  const [showPipeline, setShowPipeline] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [editingProb, setEditingProb] = useState(0);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');

  const dealsByStage = (kanbanData?.items ?? []).reduce<Record<string, CrmDealSummaryDto[]>>(
    (acc, d) => {
      if (!acc[d.stageId]) acc[d.stageId] = [];
      acc[d.stageId].push(d);
      return acc;
    },
    {}
  );

  // Sort deals within each column by closeDate ascending (nulls last)
  Object.values(dealsByStage).forEach((arr) => {
    arr.sort((a, b) => {
      if (!a.closeDate && !b.closeDate) return 0;
      if (!a.closeDate) return 1;
      if (!b.closeDate) return -1;
      return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
    });
  });

  const handleDrop = (stageId: string) => {
    const dealId = dragDealRef.current;
    if (!dealId) return;
    dragDealRef.current = null;
    setDragOverStageId(null);
    moveStage.mutate({ id: dealId, data: { stageId } });
  };

  const totalPages = listData ? Math.ceil(listData.totalCount / LIST_PAGE_SIZE) : 1;
  const currentPage = listFilter.page ?? 1;

  return (
    <div className="flex flex-col space-y-4" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Deals</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {kanbanData ? `${kanbanData.totalCount.toLocaleString()} total` : 'Pipeline'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard/crm/pipelines"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-primary transition-all"
          >
            <GitBranch className="w-3.5 h-3.5" /> Manage Pipelines
          </a>
          <div className="flex rounded-xl border border-border-subtle overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                view === 'kanban' ? 'bg-brand text-bg' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} /> Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors border-l border-border-subtle ${
                view === 'list' ? 'bg-brand text-bg' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" strokeWidth={1.5} /> List
            </button>
          </div>
          <button onClick={() => setShowPipeline(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-primary transition-all">
            <Settings className="w-3.5 h-3.5" /> Pipeline
          </button>
          <CsvDealsToolbar />
          <button
            onClick={() => {
              if (filterOwnerId === user?.id) { setFilterOwnerId(''); setListFilter(f => ({ ...f, ownedByUserId: undefined, page: 1 })); }
              else { setFilterOwnerId(user?.id ?? ''); setListFilter(f => ({ ...f, ownedByUserId: user?.id, page: 1 })); }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterOwnerId === user?.id ? 'bg-brand text-bg border-brand' : 'bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            My Deals
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </button>
          <button
            onClick={() => setShowNewDeal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Deal
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-bg-elevated border border-border-subtle shrink-0">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Owner / Rep</label>
            <select
              value={filterOwnerId}
              onChange={e => setFilterOwnerId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow"
            >
              <option value="">All reps</option>
              {teamMembers.map(u => (
                <option key={u.id} value={u.id}>{u.fullName ?? `${u.firstName} ${u.lastName}`}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Close Date From</label>
            <input type="date" value={filterCloseDateFrom} onChange={e => setFilterCloseDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Close Date To</label>
            <input type="date" value={filterCloseDateTo} onChange={e => setFilterCloseDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Stale Deals</label>
            <button
              onClick={toggleInactive}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterInactive ? 'bg-warning/10 border-warning text-warning' : 'bg-bg border-border-subtle text-text-secondary hover:text-text-primary'}`}
            >
              {filterInactive ? '⚠ No activity 7+ days' : 'No activity 7+ days'}
            </button>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setFilterOwnerId(''); setFilterCloseDateFrom(''); setFilterCloseDateTo(''); setFilterInactive(false); setListFilter((f) => ({ ...f, ownedByUserId: undefined, closeDateFrom: undefined, closeDateTo: undefined, inactiveSinceDays: undefined, page: 1 })); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-danger border border-danger/30 hover:bg-danger-soft transition-all self-end"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Pipeline Tabs ── */}
      {pipelines.length > 0 && (
        <div className="flex items-center gap-1 shrink-0 border-b border-border-subtle pb-0 -mb-2">
          {pipelines.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedPipelineId(p.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                activePipelineId === p.id
                  ? 'border-brand text-brand bg-brand/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-medium'
              }`}
            >
              {p.color && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ background: p.color }}
                />
              )}
              {p.name}
              {p.isDefault && (
                <span className="ml-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wide">default</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Kanban ── */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4 -mx-1 px-1">
          {kanbanLoading ? (
            <div className="flex items-center justify-center h-64 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="flex gap-4" style={{ minWidth: 'max-content', minHeight: 520 }}>
              {stages.map((stage) => {
                const stageDeals = dealsByStage[stage.id] ?? [];
                const totalValue = stageDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
                const isDragOver = dragOverStageId === stage.id;

                return (
                  <div
                    key={stage.id}
                    className={`flex flex-col w-72 rounded-2xl border transition-colors ${
                      isDragOver ? 'border-brand bg-brand-soft' : 'border-border-subtle bg-bg-card'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverStageId(stage.id); }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverStageId(null);
                      }
                    }}
                    onDrop={() => handleDrop(stage.id)}
                  >
                    {/* Column header */}
                    <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {stage.color ? (
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: stage.color }}
                          />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-border-subtle" />
                        )}
                        <span className="font-bold text-sm text-text-primary truncate">{stage.name}</span>
                        {stage.isWon && (
                          <Trophy className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} />
                        )}
                        {stage.isClosed && !stage.isWon && (
                          <XCircle className="w-3.5 h-3.5 text-danger shrink-0" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-text-muted font-semibold">{stageDeals.length}</span>
                        {totalValue > 0 && (
                          <span className="text-xs text-brand font-bold">
                            ${totalValue.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                      {stageDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          isCloseMenuOpen={closeMenuId === deal.id}
                          onToggleCloseMenu={(e) => {
                            e.stopPropagation();
                            setCloseMenuId(closeMenuId === deal.id ? null : deal.id);
                          }}
                          onCloseWon={() => { setWinDealId(deal.id); setWinReason(''); setCloseMenuId(null); }}
                          onCloseLost={() => {
                            closeDeal.mutate({ id: deal.id, data: { isWon: false } });
                            setCloseMenuId(null);
                          }}
                          onDragStart={() => { dragDealRef.current = deal.id; }}
                          onClick={() => navigate(ROUTES.dashboard.crmDealDetail(deal.id))}
                        />
                      ))}

                      {stageDeals.length === 0 && (
                        <div
                          className={`flex items-center justify-center h-16 rounded-xl border-2 border-dashed text-xs transition-colors ${
                            isDragOver
                              ? 'border-brand text-brand bg-brand-soft'
                              : 'border-border-subtle text-text-muted'
                          }`}
                        >
                          {isDragOver ? 'Drop here' : 'No deals'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}



              {stages.length === 0 && (
                <div className="flex flex-col items-center justify-center w-full h-64 gap-3 text-text-muted rounded-2xl border border-border-subtle">
                  <Briefcase className="w-8 h-8 opacity-30" strokeWidth={1.2} />
                  <p className="text-sm">No pipeline stages configured</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── List ── */}
      {view === 'list' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setListFilter((f) => ({
                ...f,
                search: search || undefined,
                ownedByUserId: filterOwnerId || undefined,
                closeDateFrom: filterCloseDateFrom || undefined,
                closeDateTo: filterCloseDateTo || undefined,
                inactiveSinceDays: filterInactive ? 7 : undefined,
                page: 1,
              }));
            }}
            className="flex flex-wrap gap-2"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deals..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium" />
            </div>
            <select value={filterOwnerId} onChange={e => setFilterOwnerId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-medium">
              <option value="">All reps</option>
              {teamMembers.map(u => (
                <option key={u.id} value={u.id}>{u.fullName ?? `${u.firstName} ${u.lastName}`}</option>
              ))}
            </select>
            <button type="submit"
              className="px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">
              Search
            </button>
          </form>

          <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
            {listLoading ? (
              <div className="flex items-center justify-center h-48 text-text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : !listData?.items.length ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
                <Briefcase className="w-8 h-8 opacity-30" strokeWidth={1.2} />
                <p className="text-sm">No deals found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="w-10 px-4 py-3">
                      <button
                        onClick={() =>
                          setSelected((prev) =>
                            prev.size === listItems.length ? new Set() : new Set(listItems.map((d) => d.id)),
                          )
                        }
                        className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all ${
                          listItems.length > 0 && selected.size === listItems.length
                            ? 'bg-brand border-brand text-bg'
                            : 'border-border-medium text-transparent hover:border-brand'
                        }`}
                        title="Select all on page"
                      >
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Deal</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Stage</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Close Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden xl:table-cell">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {listData.items.map((d: CrmDealSummaryDto) => (
                    <tr
                      key={d.id}
                      onClick={() => navigate(ROUTES.dashboard.crmDealDetail(d.id))}
                      className={`border-b border-border-subtle last:border-0 cursor-pointer transition-colors ${
                        selected.has(d.id) ? 'bg-brand-soft' : 'hover:bg-bg-elevated'
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(d.id)}
                          className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all ${
                            selected.has(d.id) ? 'bg-brand border-brand text-bg' : 'border-border-medium text-transparent hover:border-brand'
                          }`}
                          title={selected.has(d.id) ? 'Deselect' : 'Select'}
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-primary">{d.name}</div>
                        {d.accountName && (
                          <div className="text-xs text-text-muted">{d.accountName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                        {d.stageName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                        {d.amount != null ? `${d.currency} ${d.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${CRM_DEAL_STATUS_COLORS[d.status]}`}>
                          {CRM_DEAL_STATUS_LABELS[d.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                        {d.closeDate
                          ? formatDistanceToNow(new Date(d.closeDate), { addSuffix: true })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs hidden xl:table-cell">
                        {d.ownedByUserName ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setListFilter((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  className="p-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setListFilter((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  className="p-1.5 rounded-lg border border-border-subtle hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-bg-elevated border border-border-medium shadow-2xl">
              <span className="text-xs font-bold text-text-primary whitespace-nowrap">{selected.size} selected</span>
              <div className="h-5 w-px bg-border-subtle" />
              <select
                value=""
                disabled={bulkAction.isPending}
                onChange={(e) => { if (e.target.value) runBulkStage(e.target.value); }}
                className="text-xs bg-bg border border-border-subtle rounded-xl px-3 py-1.5 text-text-secondary focus:outline-none focus:border-border-glow cursor-pointer disabled:opacity-50"
              >
                <option value="">Set stage…</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
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
                disabled={bulkDelete.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-danger border border-border-subtle hover:bg-danger-soft hover:border-danger transition-all disabled:opacity-50"
              >
                {bulkDelete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
        </div>
      )}

      {/* ── New Deal Modal ── */}
      {showNewDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowNewDeal(false); resetNewDeal(); }} />
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
            {/* Accent bar */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />

            {/* Header */}
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
                >New Deal</h2>
                <p className="text-xs text-text-muted mt-0.5">Create a deal directly in your pipeline</p>
              </div>
              <button onClick={() => { setShowNewDeal(false); resetNewDeal(); }} className="text-text-muted hover:text-text-primary mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {/* Deal Name */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Deal Name *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                  <input
                    value={ndName}
                    onChange={e => setNdName(e.target.value)}
                    placeholder="e.g. Acme Corp — Enterprise"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                    style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                  />
                </div>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Stage *</label>
                <div className="relative" ref={ndStageRef}>
                  <button
                    type="button"
                    onClick={() => setNdStageOpen(o => !o)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary"
                    style={{
                      backgroundColor: '#1A2F27',
                      backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
                      border: `1px solid ${ndStageOpen ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
                      boxShadow: ndStageOpen ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
                      outline: 'none',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.6} />
                    <span className={`flex-1 text-left font-medium ${ndStageId ? 'text-text-primary' : 'text-text-muted'}`}>
                      {ndStageId ? (stages.find(s => s.id === ndStageId)?.name ?? 'Select stage') : 'Select stage'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${ndStageOpen ? 'rotate-180' : ''}`} strokeWidth={1.6} />
                  </button>
                  {ndStageOpen && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1.5 z-10 overflow-hidden"
                      style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)', maxHeight: 240, overflowY: 'auto' }}
                    >
                      {stages.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setNdStageId(s.id); setNdStageOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-glass-1 text-text-secondary ${ndStageId === s.id ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}
                        >
                          {s.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />}
                          {s.name}
                          {ndStageId === s.id && <span className="ml-auto text-[10px] font-bold text-text-muted">selected</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount + Close Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      type="number"
                      value={ndAmount}
                      onChange={e => setNdAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Expected Close Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <input
                      type="date"
                      value={ndCloseDate}
                      onChange={e => setNdCloseDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Owner + Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Owner</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <select
                      value={ndOwnerId}
                      onChange={e => setNdOwnerId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] appearance-none"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    >
                      <option value="">Assign to me (default)</option>
                      {teamMembers.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName ?? `${u.firstName} ${u.lastName}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Account</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" strokeWidth={1.6} />
                    <select
                      value={ndAccountId}
                      onChange={e => { setNdAccountId(e.target.value); setNdContactId(''); }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary focus:outline-none focus:border-[rgba(0,217,138,0.50)] appearance-none"
                      style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }}
                    >
                      <option value="">No account linked</option>
                      {accountsList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary Contact */}
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Primary Contact</label>
                <ContactDropdown
                  value={ndContactId}
                  contacts={contactsList}
                  onChange={setNdContactId}
                />
              </div>
            </div>
            <div className="px-5 py-3">
              <CustomFieldsInline entityType={CrmEntityType.Deal} onValuesChange={setNdCustomFields} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle shrink-0">
              <button
                onClick={() => { setShowNewDeal(false); resetNewDeal(); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary border border-border-subtle hover:border-border-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitNewDeal}
                disabled={!ndName.trim() || !ndStageId || createDeal.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createDeal.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline Management Panel ── */}
      {showPipeline && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPipeline(false)} />
          <div className="relative w-full max-w-md bg-bg-card border-l border-border-subtle h-full overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Manage Pipeline</h2>
                <p className="text-xs text-text-muted mt-0.5">Add, edit or reorder deal stages</p>
              </div>
              <button onClick={() => setShowPipeline(false)} className="p-1.5 text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              {stages.map((stage, idx) => (
                <div key={stage.id} className="border border-border-subtle rounded-xl overflow-hidden">
                  {editingStageId === stage.id ? (
                    <div className="p-3 space-y-2 bg-bg-elevated">
                      <input value={editingName} onChange={e => setEditingName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
                      <div className="flex items-center gap-2">
                        <input type="color" value={editingColor} onChange={e => setEditingColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border-subtle" />
                        <span className="text-xs text-text-muted">Color</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Win probability</span>
                        <div className="flex items-center gap-1">
                          <input type="range" min={0} max={100} value={editingProb} onChange={e => setEditingProb(Number(e.target.value))} className="w-24 accent-brand" />
                          <span className="text-xs text-text-primary font-semibold tabular-nums w-8 text-right">{editingProb}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { updateStage.mutate({ id: stage.id, data: { name: editingName, color: editingColor, defaultProbability: editingProb / 100 } }); setEditingStageId(null); }}
                          className="flex-1 py-1.5 rounded-lg bg-brand text-bg text-xs font-bold">Save</button>
                        <button onClick={() => setEditingStageId(null)} className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs text-text-secondary">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color ?? '#6366f1' }} />
                      <span className="flex-1 text-sm text-text-primary">{stage.name}</span>
                      <span className="text-xs text-text-muted font-semibold tabular-nums">{Math.round((stage.defaultProbability ?? 0) * 100)}%</span>
                      {stage.isClosed && <span className="text-2xs text-text-muted border border-border-subtle px-1.5 py-0.5 rounded">{stage.isWon ? 'Won' : 'Lost'}</span>}
                      <div className="flex items-center gap-1">
                        <button disabled={idx === 0} onClick={() => updateStage.mutate({ id: stage.id, data: { order: stage.order - 1 } })}
                          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button disabled={idx === stages.length - 1} onClick={() => updateStage.mutate({ id: stage.id, data: { order: stage.order + 1 } })}
                          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setEditingStageId(stage.id); setEditingName(stage.name); setEditingColor(stage.color ?? '#6366f1'); setEditingProb(Math.round((stage.defaultProbability ?? 0) * 100)); }}
                          className="p-1 text-text-muted hover:text-text-primary"><Settings className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteStage.mutate(stage.id)} className="p-1 text-text-muted hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="border border-dashed border-border-subtle rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-text-muted">Add Stage</p>
                <input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Stage name"
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
                <div className="flex items-center gap-2">
                  <input type="color" value={newStageColor} onChange={e => setNewStageColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border-subtle" />
                  <span className="text-xs text-text-muted">Color</span>
                </div>
                <button disabled={!newStageName.trim() || createStage.isPending}
                  onClick={() => createStage.mutate({ name: newStageName.trim(), order: stages.length + 1, color: newStageColor, pipelineId: activePipelineId ?? undefined } as CrmDealStageCreateRequest, { onSuccess: () => setNewStageName('') })}
                  className="w-full py-2 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {createStage.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Win Reason Modal */}
      {winDealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-bg border border-border-subtle rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-text-primary">Mark as Won</h3>
            <p className="text-xs text-text-muted">Enter the win reason to record why this deal was closed.</p>
            <textarea
              autoFocus
              value={winReason}
              onChange={e => setWinReason(e.target.value)}
              rows={4}
              placeholder="e.g. Best TCO vs DeLonghi. Anita championed. Rajesh approved."
              className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary resize-none focus:outline-none focus:border-border-glow"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setWinDealId(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary border border-border-subtle hover:bg-bg-elevated">Cancel</button>
              <button onClick={() => { closeDeal.mutate({ id: winDealId, data: { isWon: true, winReason: winReason.trim() || undefined } }); setWinDealId(null); }}
                disabled={closeDeal.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-success hover:opacity-90 disabled:opacity-50">
                {closeDeal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirm Won
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactDropdown({
  value,
  contacts,
  onChange,
}: {
  value: string;
  contacts: Array<{ id: string; fullName: string; email?: string; phone?: string }>;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = contacts.find((c) => c.id === value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = contacts.filter((c) =>
    !search ? true : c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-primary"
        style={{
          backgroundColor: '#1A2F27',
          backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)',
          border: `1px solid ${open ? 'rgba(0,217,138,0.50)' : 'rgba(0,217,138,0.20)'}`,
          boxShadow: open ? '0 0 0 1px rgba(0,217,138,0.50), 0 0 10px rgba(0,217,138,0.20), 0 0 20px rgba(0,217,138,0.08)' : 'none',
          outline: 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <User className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.6} />
        <span className={`flex-1 text-left font-medium ${value ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected ? selected.fullName : 'Select a contact…'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} strokeWidth={1.6} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-10 overflow-hidden"
          style={{ borderRadius: 12, background: 'var(--bg-card)', border: '1px solid rgba(0,217,138,0.20)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(0,217,138,0.08)', maxHeight: 240, overflowY: 'auto' }}
        >
          <div className="p-2 border-b border-border-subtle">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-glow"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-text-muted">No contacts found</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-glass-1 transition-colors ${value === c.id ? 'bg-[rgba(0,217,138,0.08)]' : ''}`}
              >
                <div className="w-8 h-8 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center text-xs font-bold text-brand shrink-0">
                  {c.fullName.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-primary truncate">{c.fullName}</div>
                  {c.email && <div className="text-xs text-text-muted truncate">{c.email}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
