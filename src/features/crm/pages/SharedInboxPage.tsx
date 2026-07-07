import { useState } from 'react';
import { Inbox, Users, LifeBuoy, CheckSquare, Loader2, Hand } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useInbox, useInboxSummary, useClaimInboxItem } from '../api/crm.queries';
import { useInboxRealtime } from '../hooks/useInboxRealtime';
import {
  CrmInboxItemKind,
  CRM_INBOX_KIND_LABELS,
  type CrmInboxItemDto,
} from '../types/crm.types';

const KIND_ICON: Record<number, typeof Users> = {
  1: Users,
  2: LifeBuoy,
  3: CheckSquare,
};

const KIND_CHIP: Record<number, string> = {
  1: 'bg-brand-soft text-brand border-border-glow',
  2: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  3: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
};

type FilterTab = 'all' | CrmInboxItemKind;

function ItemRow({ item, onClaim, claiming }: {
  item: CrmInboxItemDto;
  onClaim: (item: CrmInboxItemDto) => void;
  claiming: boolean;
}) {
  const Icon = KIND_ICON[item.kind] ?? Inbox;
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border-subtle last:border-b-0 hover:bg-bg-elevated/50 transition-colors">
      <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${KIND_CHIP[item.kind] ?? 'bg-bg-elevated text-text-secondary border-border-subtle'}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text-primary truncate">{item.title || '(untitled)'}</span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${KIND_CHIP[item.kind] ?? ''}`}>
            {CRM_INBOX_KIND_LABELS[item.kind]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
          {item.status && <span>{item.status}</span>}
          {item.priority && <span>· {item.priority}</span>}
          {item.score != null && <span>· score {item.score}</span>}
          <span>· added {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      <button
        onClick={() => onClaim(item)}
        disabled={claiming}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hand className="w-4 h-4" />}
        Claim
      </button>
    </div>
  );
}

function Stat({ label, value, active, onClick }: {
  label: string; value: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[120px] rounded-2xl border px-4 py-3 text-left transition-all ${
        active ? 'border-brand bg-brand-soft' : 'border-border-subtle bg-bg-card hover:border-border-medium'
      }`}
    >
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
    </button>
  );
}

export function Component() {
  useInboxRealtime();
  const [tab, setTab] = useState<FilterTab>('all');
  const { data: summary } = useInboxSummary();
  const { data: inbox, isLoading } = useInbox(tab === 'all' ? {} : { kind: tab });
  const claim = useClaimInboxItem();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = (item: CrmInboxItemDto) => {
    setClaimingId(item.id);
    claim.mutate(
      { kind: item.kind, entityId: item.id },
      { onSettled: () => setClaimingId(null) },
    );
  };

  const items = inbox?.items ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <Inbox className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Shared Inbox</h1>
          <p className="text-sm text-text-muted">Unassigned work the whole team can pick up.</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Stat label="All unassigned" value={summary?.total ?? 0} active={tab === 'all'} onClick={() => setTab('all')} />
        <Stat label="Leads" value={summary?.leads ?? 0} active={tab === CrmInboxItemKind.Lead} onClick={() => setTab(CrmInboxItemKind.Lead)} />
        <Stat label="Support Cases" value={summary?.supportCases ?? 0} active={tab === CrmInboxItemKind.SupportCase} onClick={() => setTab(CrmInboxItemKind.SupportCase)} />
        <Stat label="Tasks" value={summary?.tasks ?? 0} active={tab === CrmInboxItemKind.Task} onClick={() => setTab(CrmInboxItemKind.Task)} />
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-10 h-10 text-text-muted mb-3" />
            <p className="font-semibold text-text-primary">Inbox zero</p>
            <p className="text-sm text-text-muted mt-1">No unassigned items right now. Nice work.</p>
          </div>
        ) : (
          items.map((item) => (
            <ItemRow
              key={`${item.kind}-${item.id}`}
              item={item}
              onClaim={handleClaim}
              claiming={claimingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
