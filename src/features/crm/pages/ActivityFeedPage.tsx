import { useMemo, useState } from 'react';
import { Loader2, Activity, MessageSquare, ArrowRightLeft, PlusCircle, UserCog, CheckCircle2, Radio, Pencil } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useActivityFeed } from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';
import {
  CrmActivityEventKind,
  CrmActivityEntityKind,
  CRM_ACTIVITY_ENTITY_LABELS,
  type CrmActivityFeedFilter,
  type ActivityEventDto,
} from '../types/crm.types';

const EVENT_ICON: Record<number, typeof Activity> = {
  [CrmActivityEventKind.CommentAdded]: MessageSquare,
  [CrmActivityEventKind.StageChanged]: ArrowRightLeft,
  [CrmActivityEventKind.DealCreated]: PlusCircle,
  [CrmActivityEventKind.AssignmentChanged]: UserCog,
  [CrmActivityEventKind.TaskCompleted]: CheckCircle2,
  [CrmActivityEventKind.SignalReceived]: Radio,
  [CrmActivityEventKind.FieldEdited]: Pencil,
};

const ENTITY_TABS: { label: string; value?: CrmActivityEntityKind }[] = [
  { label: 'Everything' },
  { label: 'Deals', value: CrmActivityEntityKind.Deal },
  { label: 'Contacts', value: CrmActivityEntityKind.Contact },
  { label: 'Leads', value: CrmActivityEntityKind.Lead },
  { label: 'Tasks', value: CrmActivityEntityKind.Task },
  { label: 'Cases', value: CrmActivityEntityKind.SupportCase },
];

export function Component() {
  const [entityKind, setEntityKind] = useState<CrmActivityEntityKind | undefined>(undefined);
  const filter: CrmActivityFeedFilter = { pageSize: 100, ...(entityKind ? { entityKind } : {}) };
  const { data, isLoading } = useActivityFeed(filter);
  const { data: team } = useTeamMembers();

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    (team?.data ?? []).forEach((u: UserDto) => m.set(u.id, u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Teammate'));
    return m;
  }, [team]);

  const events = (data as unknown as { items?: ActivityEventDto[] } | undefined)?.items ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <Activity className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Activity Feed</h1>
          <p className="text-sm text-text-muted">Everything happening across your CRM, newest first.</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map((t) => {
          const active = entityKind === t.value;
          return (
            <button
              key={t.label}
              onClick={() => setEntityKind(t.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                active ? 'bg-brand-soft text-brand border-border-glow' : 'bg-bg-card text-text-secondary border-border-subtle hover:border-border-medium'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12 text-text-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : events.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">No activity yet.</p>
        ) : (
          <ol className="relative border-l border-border-subtle ml-3">
            {events.map((e) => {
              const Icon = EVENT_ICON[e.eventKind] ?? Activity;
              const actor = e.actorUserId ? (nameById.get(e.actorUserId) ?? 'A teammate') : 'System';
              return (
                <li key={e.id} className="mb-5 ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-bg-elevated border border-border-subtle">
                    <Icon className="w-3.5 h-3.5 text-text-secondary" />
                  </span>
                  <p className="text-sm text-text-primary">
                    <span className="font-semibold">{actor}</span> {e.summary}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    <span className="text-text-secondary">{CRM_ACTIVITY_ENTITY_LABELS[e.entityKind]}</span>
                    {' · '}{formatDistanceToNow(parseISO(e.occurredAt), { addSuffix: true })}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
