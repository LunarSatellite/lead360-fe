import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Loader2, ChevronLeft, ChevronRight, Filter, X, User as UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { useActivityFeed } from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';
import type { ActivityEventDto, CrmActivityFeedFilter, PagedResult } from '../types/crm.types';
import {
  CRM_ACTIVITY_ENTITY_LABELS, CRM_ACTIVITY_EVENT_LABELS,
} from '../types/crm.types';
import { ROUTES } from '@/app/router/route-paths';

const PAGE_SIZE = 30;

// Entity kinds that have a per-record detail route we can deep-link into.
const ENTITY_LINK: Record<number, ((id: string) => string) | undefined> = {
  1: (id) => ROUTES.dashboard.crmContactDetail(id),
  2: (id) => ROUTES.dashboard.crmDealDetail(id),
  4: (id) => ROUTES.dashboard.crmLeadDetail(id),
};

// Soft colour per entity kind for the chip.
const ENTITY_CHIP: Record<number, string> = {
  1: 'text-[#60A5FA] bg-[rgba(96,165,250,0.1)] border-[rgba(96,165,250,0.2)]',
  2: 'text-brand bg-brand-soft border-border-glow',
  3: 'text-[#F59E0B] bg-warning-soft border-[rgba(245,158,11,0.2)]',
  4: 'text-[#A78BFA] bg-[rgba(167,139,250,0.1)] border-[rgba(167,139,250,0.2)]',
  5: 'text-[#34D399] bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.2)]',
  6: 'text-[#34D399] bg-[rgba(52,211,153,0.1)] border-[rgba(52,211,153,0.2)]',
  7: 'text-text-secondary bg-bg-elevated border-border-subtle',
};

export function Component() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [entityKind, setEntityKind] = useState<string>('');
  const [eventKind, setEventKind] = useState<string>('');
  const [actorUserId, setActorUserId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const { data: teamRaw } = useTeamMembers();
  const members = (teamRaw as unknown as UserDto[] | undefined) ?? [];
  const memberName = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((u) => map.set(u.id, u.fullName ?? `${u.firstName} ${u.lastName}`.trim()));
    return map;
  }, [members]);

  const filter: CrmActivityFeedFilter = {
    page,
    pageSize: PAGE_SIZE,
    entityKind: entityKind ? Number(entityKind) : undefined,
    eventKinds: eventKind ? [Number(eventKind)] : undefined,
    actorUserId: actorUserId || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
  };

  const { data: raw, isLoading, isFetching } = useActivityFeed(filter);
  const data = raw as unknown as PagedResult<ActivityEventDto> | undefined;
  const events = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const activeFilters = [entityKind, eventKind, actorUserId, from, to].filter(Boolean).length;
  const resetFilters = () => {
    setEntityKind(''); setEventKind(''); setActorUserId(''); setFrom(''); setTo(''); setPage(1);
  };
  // Any filter change resets to page 1.
  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };

  const selectCls =
    'px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-secondary focus:outline-none focus:border-border-glow transition-colors';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand" strokeWidth={1.8} />
            <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Audit Log</h1>
            {isFetching && <Loader2 className="w-3.5 h-3.5 text-text-muted animate-spin" />}
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Who changed what, across leads, contacts, deals, and more — newest first.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
          <Filter className="w-3.5 h-3.5" /> Filters
        </div>
        <select value={entityKind} onChange={(e) => onFilterChange(setEntityKind)(e.target.value)} className={selectCls}>
          <option value="">All records</option>
          {Object.entries(CRM_ACTIVITY_ENTITY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select value={eventKind} onChange={(e) => onFilterChange(setEventKind)(e.target.value)} className={selectCls}>
          <option value="">All events</option>
          {Object.entries(CRM_ACTIVITY_EVENT_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select value={actorUserId} onChange={(e) => onFilterChange(setActorUserId)(e.target.value)} className={selectCls}>
          <option value="">Anyone</option>
          {members.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName ?? `${u.firstName} ${u.lastName}`}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => onFilterChange(setFrom)(e.target.value)} className={selectCls} title="From date" />
        <input type="date" value={to} onChange={(e) => onFilterChange(setTo)(e.target.value)} className={selectCls} title="To date" />
        {activeFilters > 0 && (
          <button onClick={resetFilters} className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary transition-all">
            <X className="w-3.5 h-3.5" /> Clear ({activeFilters})
          </button>
        )}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History className="w-10 h-10 text-text-muted mb-3" strokeWidth={1.2} />
          <p className="text-text-secondary font-semibold">No activity found</p>
          <p className="text-sm text-text-muted mt-1">
            {activeFilters > 0 ? 'Try widening or clearing the filters.' : 'Changes to CRM records will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden divide-y divide-border-subtle">
          {events.map((ev) => {
            const entityLabel = CRM_ACTIVITY_ENTITY_LABELS[ev.entityKind] ?? 'Record';
            const eventLabel = CRM_ACTIVITY_EVENT_LABELS[ev.eventKind] ?? `Event ${ev.eventKind}`;
            const actor = ev.actorUserId ? (memberName.get(ev.actorUserId) ?? 'Unknown user') : 'System';
            const toDetail = ENTITY_LINK[ev.entityKind]?.(ev.entityId);

            return (
              <div
                key={ev.id}
                onClick={() => { if (toDetail) navigate(toDetail); }}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${toDetail ? 'cursor-pointer hover:bg-bg-elevated' : ''}`}
              >
                {/* Actor avatar */}
                <div className="w-8 h-8 rounded-card bg-glass-2 border-thin border-border-subtle flex items-center justify-center text-text-muted shrink-0 mt-0.5">
                  {ev.actorUserId ? (
                    <span className="text-xs font-black text-brand">{(actor[0] ?? '?').toUpperCase()}</span>
                  ) : (
                    <UserIcon className="w-4 h-4" strokeWidth={1.6} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{actor}</span>
                    <span className="text-xs text-text-muted">{eventLabel.toLowerCase()}</span>
                    <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border-thin ${ENTITY_CHIP[ev.entityKind] ?? ENTITY_CHIP[7]}`}>
                      {entityLabel}
                    </span>
                  </div>
                  {ev.summary && (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{ev.summary}</p>
                  )}
                </div>

                <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0 mt-0.5 tabular-nums">
                  {(() => { try { return format(new Date(ev.occurredAt), 'd MMM yyyy, HH:mm'); } catch { return '—'; } })()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages} · {totalCount.toLocaleString()} event{totalCount === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary disabled:opacity-40 hover:border-border-medium transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary disabled:opacity-40 hover:border-border-medium transition-all"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
