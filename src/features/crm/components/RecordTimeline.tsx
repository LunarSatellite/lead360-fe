import { useMemo } from 'react';
import { Loader2, MessageSquare, ArrowRightLeft, PlusCircle, UserCog, CheckCircle2, Radio, Pencil, Activity } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRecordTimeline } from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import { CrmActivityEventKind } from '../types/crm.types';

const EVENT_ICON: Record<number, typeof Activity> = {
  [CrmActivityEventKind.CommentAdded]: MessageSquare,
  [CrmActivityEventKind.StageChanged]: ArrowRightLeft,
  [CrmActivityEventKind.DealCreated]: PlusCircle,
  [CrmActivityEventKind.AssignmentChanged]: UserCog,
  [CrmActivityEventKind.TaskCompleted]: CheckCircle2,
  [CrmActivityEventKind.SignalReceived]: Radio,
  [CrmActivityEventKind.FieldEdited]: Pencil,
};

/** Per-record activity timeline. `kind` is the CrmActivityEntityKind (Contact=1, Deal=2, …). */
export function RecordTimeline({ kind, entityId }: { kind: number; entityId: string }) {
  const { data, isLoading } = useRecordTimeline(kind, entityId);
  const { data: team } = useTeamMembers();

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    (team ?? []).forEach((u) => m.set(u.id, u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Teammate'));
    return m;
  }, [team]);

  const events = data?.items ?? [];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border-subtle">
        <Activity className="w-4 h-4 text-text-muted" />
        <h3 className="font-semibold text-text-primary">Timeline</h3>
        <span className="text-xs text-text-muted">{data?.totalCount ?? 0}</span>
      </div>

      <div className="px-5 py-4 max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : events.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No activity recorded yet.</p>
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
                    {formatDistanceToNow(parseISO(e.occurredAt), { addSuffix: true })}
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
