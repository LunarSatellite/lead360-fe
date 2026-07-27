import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus, Trash2, RotateCw, Wrench, UserPlus as UserPlusIcon, Users, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import { crmApi } from '../api/crm.api';
import { useTeamMembers } from '@/features/team/api/team.queries';
import type { UserDto } from '@/features/auth/types/auth.types';

const ENTITY_TYPES = ['Lead', 'SupportCase', 'WorkOrder', 'Return', 'Onboarding'] as const;
const ENTITY_LABELS: Record<string, string> = {
  Lead: 'Sales Lead Pool', SupportCase: 'Support Ticket Pool',
  WorkOrder: 'Field Tech Pool', Return: 'Returns Pool', Onboarding: 'Onboarding Pool',
};
const ENTITY_ICONS: Record<string, any> = {
  Lead: Users, SupportCase: LifeBuoy, WorkOrder: Wrench, Return: RotateCw, Onboarding: UserPlusIcon,
};

export function Component() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('Return');
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: rawMembers, isLoading } = useQuery({
    queryKey: ['crm', 'assignment-rotation', selectedType],
    queryFn: () => crmApi.getRotationMembers(selectedType),
  });
  const memberIds: string[] = (rawMembers as unknown as string[] | undefined) ?? [];

  const { data: teamRaw } = useTeamMembers();
  const teamMembers: UserDto[] = (teamRaw as unknown as UserDto[] | undefined) ?? [];

  const addMutation = useMutation({
    mutationFn: (userId: string) => crmApi.addRotationMember(selectedType, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'assignment-rotation', selectedType] });
      setSelectedUserId('');
      toast.success('Member added to rotation.');
    },
    onError: (err: any) => toast.error(err?.message || 'Error adding member.'),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => crmApi.removeRotationMember(selectedType, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'assignment-rotation', selectedType] });
      toast.success('Member removed.');
    },
    onError: (err: any) => toast.error(err?.message || 'Error removing member.'),
  });

  function userName(u: UserDto) {
    return u.fullName?.trim() || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.id;
  }

  // Members not yet in this pool — available to add
  const available = teamMembers.filter(u => !memberIds.includes(u.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Assignment Rotation</h1>
        <p className="text-sm text-text-muted mt-1">
          Team members added here are auto-assigned new items in round-robin order — least-recently assigned person gets the next one.
          Each entity type has its own independent pool.
        </p>
      </div>

      {/* Entity type tabs */}
      <div className="flex gap-2">
        {ENTITY_TYPES.map(t => {
          const Icon = ENTITY_ICONS[t];
          return (
            <button key={t} onClick={() => { setSelectedType(t); setSelectedUserId(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedType === t ? 'bg-brand text-white' : 'bg-glass-1 border border-border-subtle text-text-secondary hover:bg-glass-2'}`}>
              <Icon className="w-4 h-4" /> {ENTITY_LABELS[t]}
            </button>
          );
        })}
      </div>

      {/* Add member */}
      <div className="flex gap-2">
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-border-subtle bg-bg-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <option value="">— Select a team member to add —</option>
          {available.map(u => (
            <option key={u.id} value={u.id}>{userName(u)}</option>
          ))}
        </select>
        <button
          onClick={() => selectedUserId && addMutation.mutate(selectedUserId)}
          disabled={!selectedUserId || addMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50"
        >
          {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Add</>}
        </button>
      </div>

      {/* Pool members */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-text-muted" /></div>
      ) : memberIds.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-border-subtle bg-glass-1">
          <p className="text-sm font-semibold text-text-muted">No members in the {ENTITY_LABELS[selectedType]} rotation</p>
          <p className="text-xs text-text-muted mt-1">New {ENTITY_LABELS[selectedType].toLowerCase()} will not be auto-assigned until you add at least one member.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{memberIds.length} member{memberIds.length !== 1 ? 's' : ''} in pool</p>
          {memberIds.map((userId: string, idx: number) => {
            const user = teamMembers.find(u => u.id === userId);
            const displayName = user ? userName(user) : userId;
            const email = user?.email ?? null;
            return (
              <div key={userId} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-glass-1 px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{displayName}</p>
                  {email && <p className="text-xs text-text-muted">{email}</p>}
                </div>
                <button
                  onClick={() => removeMutation.mutate(userId)}
                  disabled={removeMutation.isPending}
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
