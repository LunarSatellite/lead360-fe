import { useMemo, useState } from 'react';
import { Loader2, ShieldCheck, PlusCircle, Pencil, Trash2, Lock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuditFeed } from '../api/crm.queries';
import { useProfile } from '@/features/auth/api/auth.queries';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';
import {
  CrmAuditOperation,
  CrmActivityEntityKind,
  CRM_ACTIVITY_ENTITY_LABELS,
  type CrmAuditFilter,
  type CrmAuditLogDto,
} from '../types/crm.types';

const OP_ICON: Record<number, typeof Pencil> = {
  [CrmAuditOperation.Created]: PlusCircle,
  [CrmAuditOperation.Updated]: Pencil,
  [CrmAuditOperation.Deleted]: Trash2,
};

const ENTITY_TABS: { label: string; value?: CrmActivityEntityKind }[] = [
  { label: 'Everything' },
  { label: 'Contacts', value: CrmActivityEntityKind.Contact },
  { label: 'Deals', value: CrmActivityEntityKind.Deal },
  { label: 'Leads', value: CrmActivityEntityKind.Lead },
  { label: 'Accounts', value: CrmActivityEntityKind.Account },
  { label: 'Organizations', value: CrmActivityEntityKind.Organization },
];

function describe(row: CrmAuditLogDto): string {
  if (row.operation === CrmAuditOperation.Created) return 'created the record';
  if (row.operation === CrmAuditOperation.Deleted) return 'deleted the record';
  return `changed ${row.fieldName} from "${row.oldValue ?? '∅'}" to "${row.newValue ?? '∅'}"`;
}

export function Component() {
  const { data: profile } = useProfile();
  const { data: team } = useTeamMembers();

  const role = (profile as any)?.role ?? 0;
  const isManager = role === 1 || role === 2;

  const [entityKind, setEntityKind] = useState<CrmActivityEntityKind | undefined>(undefined);
  const filter: CrmAuditFilter = { pageSize: 100, ...(entityKind ? { entityKind } : {}) };
  const { data, isLoading } = useAuditFeed(filter, isManager);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    const members = (team as unknown as UserDto[]) ?? [];
    members.forEach((u) => m.set(u.id, u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Teammate'));
    return m;
  }, [team]);

  if (profile && !isManager) {
    return (
      <div className="py-16 text-center">
        <Lock className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <h1 className="text-lg font-bold text-text-primary">Restricted</h1>
        <p className="text-sm text-text-muted mt-1">The tenant audit log is available to Owners and Admins only.</p>
      </div>
    );
  }

  const rows = ((data as unknown as any)?.data?.items ?? []) as CrmAuditLogDto[];

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-soft border border-border-glow flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Audit log</h1>
          <p className="text-sm text-text-muted">Who changed what, across the workspace — newest first.</p>
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
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">No changes recorded yet.</p>
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
                    <span className="text-text-secondary">{CRM_ACTIVITY_ENTITY_LABELS[r.entityKind]}</span>
                    {' · '}{formatDistanceToNow(parseISO(r.changedAt), { addSuffix: true })}
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
