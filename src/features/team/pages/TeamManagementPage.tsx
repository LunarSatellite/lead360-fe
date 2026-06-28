import { useState, Fragment } from 'react';
import { confirmDialog } from '@/shared/ui/confirm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users, Mail, XCircle, RefreshCw, UserMinus, Plus, Send,
  Shield, ChevronRight, Trash2, Lock, Check, X,
} from 'lucide-react';
import {
  useTeamMembers, useInvitations, useSendInvitation, useCancelInvitation,
  useResendInvitation, useAdminUpdateUser, useDeactivateUser,
} from '../api/team.queries';
import { createInvitationSchema, type CreateInvitationFormData } from '../types/team.schemas';
import { InvitationStatus, INVITATION_STATUS_LABEL } from '../types/team.types';
import type { TeamInvitationDto } from '../types/team.types';
import { UserRole, UserStatus, USER_ROLE_LABEL, USER_STATUS_LABEL } from '@/features/auth/types/auth.types';
import type { UserDto, UserRoleValue, UserStatusValue } from '@/features/auth/types/auth.types';
import {
  useCrmRoles, useCreateCrmRole, useDeleteCrmRole,
  useUpdateCrmRolePermissions, useAssignCrmRole,
} from '@/features/crm/api/crm-rbac.queries';
import {
  CrmFeature, CRM_FEATURE_LABEL, CRM_FEATURE_GROUPS,
} from '@/features/crm/types/crm-rbac.types';
import type { CrmRoleDto, CrmRolePermissionDto, CrmFeatureValue } from '@/features/crm/types/crm-rbac.types';

type Tab = 'members' | 'roles';

export function Component() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [tab, setTab] = useState<Tab>('members');

  const tabCls = (t: Tab) =>
    `px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${tab === t
      ? 'bg-glass-2 text-text-primary border border-border-medium'
      : 'text-text-secondary hover:text-text-primary'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Team</h1>
          <p className="text-base text-text-secondary mt-1">Manage members, roles and permissions</p>
        </div>
        {tab === 'members' && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Invite member
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button className={tabCls('members')} onClick={() => setTab('members')}>
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Members</span>
        </button>
        <button className={tabCls('roles')} onClick={() => setTab('roles')}>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Roles & Permissions</span>
        </button>
      </div>

      {tab === 'members' && (
        <>
          {showInviteForm && <InviteForm onClose={() => setShowInviteForm(false)} />}
          <MembersSection />
          <InvitationsSection />
        </>
      )}
      {tab === 'roles' && <RolesSection />}
    </div>
  );
}

function InviteForm({ onClose }: { onClose: () => void }) {
  const send = useSendInvitation();
  const form = useForm<CreateInvitationFormData>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: '', role: UserRole.Agent, personalMessage: '' },
  });
  const onSubmit = (data: CreateInvitationFormData) => {
    send.mutate(
      { ...data, personalMessage: data.personalMessage || undefined } as any,
      { onSuccess: () => { form.reset(); onClose(); } },
    );
  };
  const input = 'w-full px-4 py-3 rounded-lg bg-bg border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
  return (
    <div className="bg-glass-1 border border-brand rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-text-primary">Send invitation</div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary"><XCircle className="w-5 h-5" /></button>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Email</label>
            <input {...form.register('email')} type="email" placeholder="team@company.com" className={input} />
            {form.formState.errors.email && <p className="text-xs text-danger mt-1.5">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Role</label>
            <select {...form.register('role', { valueAsNumber: true })} className={input}>
              <option value={UserRole.Admin} className="bg-bg">Admin</option>
              <option value={UserRole.Agent} className="bg-bg">Agent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">
            Personal message <span className="opacity-40">(optional)</span>
          </label>
          <textarea {...form.register('personalMessage')} placeholder="Hey, join our team!" rows={2} className={`${input} resize-none`} />
        </div>
        {send.isError && (
          <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">
            {send.error?.message || 'Failed.'}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary transition-all">Cancel</button>
          <button type="submit" disabled={send.isPending} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 disabled:opacity-50 transition-all">
            {send.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            {send.isPending ? 'Sending...' : 'Send invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MembersSection() {
  const { data, isLoading } = useTeamMembers();
  const members = (data as unknown as UserDto[]) || [];
  const { data: rolesData } = useCrmRoles();
  const roles = (rolesData as unknown as CrmRoleDto[]) || [];
  const adminUpdate = useAdminUpdateUser();
  const deactivate = useDeactivateUser();
  const assignCrmRole = useAssignCrmRole();

  const roleBadge: Record<number, string> = {
    [UserRole.Owner]: 'bg-warning-soft text-warning',
    [UserRole.Admin]: 'bg-brand-soft text-brand',
    [UserRole.Agent]: 'bg-glass-2 text-text-secondary',
  };
  const statusBadge: Record<number, string> = {
    [UserStatus.Active]: 'bg-success-soft text-success',
    [UserStatus.Inactive]: 'bg-glass-2 text-text-muted',
    [UserStatus.Suspended]: 'bg-danger-soft text-danger',
    [UserStatus.PendingVerification]: 'bg-warning-soft text-warning',
  };

  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-b-border-subtle flex items-center gap-2.5">
        <Users className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
        <span className="text-base font-bold text-text-primary">Team members</span>
        <span className="text-xs text-text-muted ml-2">{members.length}</span>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-sm text-text-muted">Loading...</div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center text-sm text-text-muted">No team members yet.</div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {members.map((user) => {
            const initials = `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}`;
            return (
              <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-glass-2 transition-all">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand to-pink-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-text-primary">{user.fullName || `${user.firstName} ${user.lastName}`}</div>
                  <div className="text-xs text-text-muted">{user.email}</div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${roleBadge[user.role] || 'bg-glass-2 text-text-muted'}`}>
                  {USER_ROLE_LABEL[user.role as UserRoleValue] || 'Unknown'}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusBadge[user.status] || 'bg-glass-2 text-text-muted'}`}>
                  {USER_STATUS_LABEL[user.status as UserStatusValue] || 'Unknown'}
                </span>
                {user.role !== UserRole.Owner && (
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={user.role}
                      onChange={(e) => adminUpdate.mutate({ userId: user.id, data: { role: Number(e.target.value) as UserRoleValue } })}
                      className="px-2 py-1 rounded-lg bg-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                    >
                      <option value={UserRole.Admin} className="bg-bg">Admin</option>
                      <option value={UserRole.Agent} className="bg-bg">Agent</option>
                    </select>
                    {roles.length > 0 && (
                      <select
                        value={user.crmRoleId ?? ''}
                        onChange={(e) => assignCrmRole.mutate({ userId: user.id, roleId: e.target.value || null })}
                        className="px-2 py-1 rounded-lg bg-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand"
                        title="CRM Role"
                      >
                        <option value="" className="bg-bg">No CRM role</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id} className="bg-bg">{r.name}</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => confirmDialog({ message: `Deactivate ${user.firstName}?`, confirmText: 'Deactivate', danger: true }).then((ok) => { if (ok) deactivate.mutate(user.id); })}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
                      title="Deactivate"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InvitationsSection() {
  const { data, isLoading } = useInvitations();
  const invitations = (data as unknown as TeamInvitationDto[]) || [];
  const cancel = useCancelInvitation();
  const resend = useResendInvitation();
  const statusBadge: Record<number, string> = {
    [InvitationStatus.Pending]: 'bg-warning-soft text-warning',
    [InvitationStatus.Accepted]: 'bg-success-soft text-success',
    [InvitationStatus.Cancelled]: 'bg-glass-2 text-text-muted',
    [InvitationStatus.Expired]: 'bg-danger-soft text-danger',
  };
  if (isLoading || invitations.length === 0) return null;
  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-b-border-subtle flex items-center gap-2.5">
        <Mail className="w-5 h-5 text-text-muted" strokeWidth={1.6} />
        <span className="text-base font-bold text-text-primary">Invitations</span>
        <span className="text-xs text-text-muted ml-2">{invitations.length}</span>
      </div>
      <div className="divide-y divide-border-subtle">
        {invitations.map((inv) => {
          const isPending = inv.status === InvitationStatus.Pending;
          return (
            <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-glass-2 transition-all">
              <div className="w-10 h-10 rounded-lg bg-glass-2 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-primary">{inv.email}</div>
                <div className="text-xs text-text-muted">
                  by {inv.invitedByName} · {USER_ROLE_LABEL[inv.role as UserRoleValue]} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusBadge[inv.status] || 'bg-glass-2 text-text-muted'}`}>
                {inv.isExpired && isPending ? 'Expired' : INVITATION_STATUS_LABEL[inv.status as keyof typeof INVITATION_STATUS_LABEL]}
              </span>
              {(isPending || inv.isExpired) && (
                <div className="flex items-center gap-2">
                  <button onClick={() => resend.mutate(inv.id)} disabled={resend.isPending} className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all" title="Resend">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {isPending && !inv.isExpired && (
                    <button onClick={() => cancel.mutate(inv.id)} disabled={cancel.isPending} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all" title="Cancel">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Roles tab ─────────────────────────────────────────────────────────────
function RolesSection() {
  const { data, isLoading } = useCrmRoles();
  const roles = (data as unknown as CrmRoleDto[]) || [];
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  if (isLoading) return <div className="p-8 text-center text-sm text-text-muted">Loading roles...</div>;

  return (
    <div className="grid grid-cols-3 gap-4 items-start">
      <div className="col-span-1 bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Roles</span>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-glass-2 border border-border-medium text-text-secondary hover:text-text-primary transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
        <div className="divide-y divide-border-subtle">
          {roles.map((role) => (
            <RoleListItem
              key={role.id}
              role={role}
              isSelected={role.id === selectedRoleId}
              onClick={() => { setSelectedRoleId(role.id); setShowCreateForm(false); }}
            />
          ))}
        </div>
        {showCreateForm && (
          <div className="border-t border-border-subtle p-3">
            <CreateRoleForm
              onDone={(id) => { setSelectedRoleId(id); setShowCreateForm(false); }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
      </div>

      <div className="col-span-2">
        {selectedRole ? (
          <PermissionMatrix role={selectedRole} />
        ) : (
          <div className="bg-glass-1 border border-border-subtle rounded-2xl p-12 text-center text-sm text-text-muted">
            Select a role to view and edit permissions
          </div>
        )}
      </div>
    </div>
  );
}

function RoleListItem({ role, isSelected, onClick }: { role: CrmRoleDto; isSelected: boolean; onClick: () => void }) {
  const deleteRole = useDeleteCrmRole();
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${isSelected ? 'bg-brand-soft border-l-2 border-l-brand' : 'hover:bg-glass-2 border-l-2 border-l-transparent'}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
          {role.name}
          {role.isSystem && <Lock className="w-3 h-3 text-text-muted" />}
        </div>
        {role.description && <div className="text-xs text-text-muted truncate">{role.description}</div>}
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
      {!role.isSystem && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            confirmDialog({ message: `Delete role "${role.name}"?`, confirmText: 'Delete', danger: true }).then(
              (ok) => { if (ok) deleteRole.mutate(role.id); },
            );
          }}
          className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function CreateRoleForm({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const create = useCreateCrmRole();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim() }, { onSuccess: (data: any) => onDone(data?.id || '') });
  };
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Role name..."
        className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border-medium text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
      />
      <button type="submit" disabled={create.isPending || !name.trim()} className="p-2 rounded-lg bg-brand text-white hover:brightness-110 disabled:opacity-50">
        <Check className="w-4 h-4" />
      </button>
      <button type="button" onClick={onCancel} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-2">
        <X className="w-4 h-4" />
      </button>
    </form>
  );
}

// ── Permission matrix ──────────────────────────────────────────────────────
const PERM_COLS = [
  { key: 'canView',    label: 'View' },
  { key: 'canViewAll', label: 'View All' },
  { key: 'canCreate',  label: 'Create' },
  { key: 'canEdit',    label: 'Edit' },
  { key: 'canDelete',  label: 'Delete' },
  { key: 'canApprove', label: 'Approve' },
] as const;
type PermKey = (typeof PERM_COLS)[number]['key'];

function PermissionMatrix({ role }: { role: CrmRoleDto }) {
  const updatePerms = useUpdateCrmRolePermissions();
  const [dirty, setDirty] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState(role.id);

  const buildMap = (r: CrmRoleDto) => {
    const map: Record<number, CrmRolePermissionDto> = {};
    for (const f of Object.values(CrmFeature) as CrmFeatureValue[]) {
      const existing = r.permissions.find((p) => p.feature === f);
      map[f] = existing ?? { feature: f, canView: false, canViewAll: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false };
    }
    return map as Record<CrmFeatureValue, CrmRolePermissionDto>;
  };

  const [perms, setPerms] = useState<Record<CrmFeatureValue, CrmRolePermissionDto>>(() => buildMap(role));

  if (role.id !== currentRoleId) {
    setCurrentRoleId(role.id);
    setDirty(false);
    setPerms(buildMap(role));
  }

  const toggle = (feature: CrmFeatureValue, key: PermKey) => {
    if (role.isSystem) return;
    setDirty(true);
    setPerms((prev) => {
      const updated = { ...prev[feature], [key]: !prev[feature][key] };
      if (key === 'canView' && !updated.canView) {
        updated.canViewAll = false; updated.canCreate = false;
        updated.canEdit = false; updated.canDelete = false; updated.canApprove = false;
      }
      return { ...prev, [feature]: updated };
    });
  };

  const save = () => {
    updatePerms.mutate(
      { roleId: role.id, data: { permissions: Object.values(perms) } },
      { onSuccess: () => setDirty(false) },
    );
  };

  const cell = (feature: CrmFeatureValue, key: PermKey) => {
    const val = perms[feature]?.[key] ?? false;
    const disabled = role.isSystem || (key !== 'canView' && !perms[feature]?.canView);
    return (
      <td key={key} className="px-2 py-2 text-center">
        <button
          disabled={disabled}
          onClick={() => toggle(feature, key)}
          className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-all ${
            disabled
              ? 'opacity-30 cursor-not-allowed'
              : val
              ? 'bg-brand text-white'
              : 'bg-glass-2 border border-border-medium text-transparent hover:border-brand'
          }`}
        >
          {val && <Check className="w-3 h-3" />}
        </button>
      </td>
    );
  };

  return (
    <div className="bg-glass-1 border border-border-subtle rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
        <div>
          <div className="text-base font-bold text-text-primary flex items-center gap-2">
            {role.name}
            {role.isSystem && (
              <span className="flex items-center gap-1 text-xs font-semibold text-text-muted bg-glass-2 border border-border-subtle px-2 py-0.5 rounded-lg">
                <Lock className="w-3 h-3" /> System
              </span>
            )}
          </div>
          {role.description && <div className="text-xs text-text-muted mt-0.5">{role.description}</div>}
        </div>
        {!role.isSystem && dirty && (
          <button
            onClick={save}
            disabled={updatePerms.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 disabled:opacity-50"
          >
            {updatePerms.isPending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Check className="w-4 h-4" />}
            Save changes
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[1.5px] text-text-muted w-44">Feature</th>
              {PERM_COLS.map((c) => (
                <th key={c.key} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-[1.5px] text-text-muted">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {CRM_FEATURE_GROUPS.map((group) => (
              <Fragment key={group.label}>
                <tr className="bg-glass-2">
                  <td colSpan={7} className="px-5 py-1.5 text-xs font-bold text-text-muted uppercase tracking-[1.5px]">{group.label}</td>
                </tr>
                {group.features.map((f) => (
                  <tr key={f} className="hover:bg-glass-2 transition-all">
                    <td className="px-5 py-2 text-sm font-medium text-text-primary">{CRM_FEATURE_LABEL[f]}</td>
                    {PERM_COLS.map((c) => cell(f, c.key))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {role.isSystem && (
        <div className="px-5 py-3 border-t border-border-subtle text-xs text-text-muted flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> System role permissions are managed automatically and cannot be edited.
        </div>
      )}
    </div>
  );
}
