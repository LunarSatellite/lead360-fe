import { useMemo } from 'react';
import { Loader2, History, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRecordAudit } from '../api/crm.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import { CrmAuditOperation, type CrmAuditLogDto } from '../types/crm.types';

const OP_ICON: Record<number, typeof History> = {
  [CrmAuditOperation.Created]: PlusCircle,
  [CrmAuditOperation.Updated]: Pencil,
  [CrmAuditOperation.Deleted]: Trash2,
};

function describe(row: CrmAuditLogDto): string {
  if (row.operation === CrmAuditOperation.Created) return 'created this record';
  if (row.operation === CrmAuditOperation.Deleted) return 'deleted this record';
  const oldV = row.oldValue ?? '∅';
  const newV = row.newValue ?? '∅';
  return `changed ${row.fieldName} from "${oldV}" to "${newV}"`;
}

/** Per-record field-level audit trail. `kind` is the CrmActivityEntityKind (Contact=1, Deal=2, …). */
export function RecordAuditTrail({ kind, entityId }: { kind: number; entityId: string }) {
  const { data, isLoading } = useRecordAudit(kind, entityId);
  const { data: team } = useTeamMembers();

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    (team ?? []).forEach((u) => m.set(u.id, u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Teammate'));
    return m;
  }, [team]);

  const rows = data?.items ?? [];

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border-subtle">
        <History className="w-4 h-4 text-text-muted" />
        <h3 className="font-semibold text-text-primary">Audit trail</h3>
        <span className="text-xs text-text-muted">{data?.totalCount ?? 0}</span>
      </div>

      <div className="px-5 py-4 max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No changes recorded yet.</p>
        ) : (
          <ol className="relative border-l border-border-subtle ml-3">
            {rows.map((r) => {
              const Icon = OP_ICON[r.operation] ?? Pencil;
              const actor = r.changedByUserId ? (nameById.get(r.changedByUserId) ?? 'A teammate') : 'System';
              return (
                <li key={r.id} className="mb-5 ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-bg-elevated border border-border-subtle">
                    <Icon className="w-3.5 h-3.5 text-text-secondary" />
                  </span>
                  <p className="text-sm text-text-primary">
                    <span className="font-semibold">{actor}</span> {describe(r)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDistanceToNow(parseISO(r.changedAt), { addSuffix: true })}
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
