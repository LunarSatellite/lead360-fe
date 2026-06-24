import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, Mail, XCircle, RefreshCw, UserMinus, Plus, Send } from 'lucide-react';
import { useTeamMembers, useInvitations, useSendInvitation, useCancelInvitation, useResendInvitation, useAdminUpdateUser, useDeactivateUser } from '../api/team.queries';
import { createInvitationSchema, type CreateInvitationFormData } from '../types/team.schemas';
import { InvitationStatus, INVITATION_STATUS_LABEL } from '../types/team.types';
import type { TeamInvitationDto } from '../types/team.types';
import { UserRole, UserStatus, USER_ROLE_LABEL, USER_STATUS_LABEL } from '@/features/auth/types/auth.types';
import type { UserDto, UserRoleValue, UserStatusValue } from '@/features/auth/types/auth.types';

export function Component() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Team</h1>
          <p className="text-base text-text-secondary mt-1">Manage your team members and invitations</p>
        </div>
        <button onClick={() => setShowInviteForm(!showInviteForm)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-br from-brand to-brand-dark text-white hover:brightness-110 transition-all">
          <Plus className="w-4 h-4" /> Invite member
        </button>
      </div>
      {showInviteForm && <InviteForm onClose={() => setShowInviteForm(false)} />}
      <MembersSection />
      <InvitationsSection />
    </div>
  );
}

function InviteForm({ onClose }: { onClose: () => void }) {
  const send = useSendInvitation();
  const form = useForm<CreateInvitationFormData>({ resolver: zodResolver(createInvitationSchema), defaultValues: { email: '', role: UserRole.Agent, personalMessage: '' } });
  const onSubmit = (data: CreateInvitationFormData) => {
    send.mutate({ ...data, personalMessage: data.personalMessage || undefined } as any, { onSuccess: () => { form.reset(); onClose(); } });
  };
  const input = "w-full px-4 py-3 rounded-lg bg-bg border border-border-subtle text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all";
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
          <label className="text-xs font-bold uppercase tracking-[2px] text-text-muted block mb-2">Personal message <span className="opacity-40">(optional)</span></label>
          <textarea {...form.register('personalMessage')} placeholder="Hey, join our team on OmniFlow!" rows={2} className={`${input} resize-none`} />
        </div>
        {send.isError && <div className="px-4 py-3 rounded-lg bg-danger-soft border border-[rgba(244,63,94,0.15)] text-sm text-danger">{send.error?.message || 'Failed.'}</div>}
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
  const adminUpdate = useAdminUpdateUser();
  const deactivate = useDeactivateUser();
  const roleBadge: Record<number, string> = { [UserRole.Owner]: 'bg-warning-soft text-warning', [UserRole.Admin]: 'bg-brand-soft text-brand', [UserRole.Agent]: 'bg-glass-2 text-text-secondary' };
  const statusBadge: Record<number, string> = { [UserStatus.Active]: 'bg-success-soft text-success', [UserStatus.Inactive]: 'bg-glass-2 text-text-muted', [UserStatus.Suspended]: 'bg-danger-soft text-danger', [UserStatus.PendingVerification]: 'bg-warning-soft text-warning' };

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
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${roleBadge[user.role] || 'bg-glass-2 text-text-muted'}`}>{USER_ROLE_LABEL[user.role as UserRoleValue] || 'Unknown'}</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusBadge[user.status] || 'bg-glass-2 text-text-muted'}`}>{USER_STATUS_LABEL[user.status as UserStatusValue] || 'Unknown'}</span>
                {user.role !== UserRole.Owner && (
                  <div className="flex items-center gap-2">
                    <select defaultValue={user.role} onChange={(e) => adminUpdate.mutate({ userId: user.id, data: { role: Number(e.target.value) as UserRoleValue } })} className="px-2 py-1 rounded-lg bg-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand">
                      <option value={UserRole.Admin} className="bg-bg">Admin</option>
                      <option value={UserRole.Agent} className="bg-bg">Agent</option>
                    </select>
                    <button onClick={() => { if (confirm(`Deactivate ${user.firstName}?`)) deactivate.mutate(user.id); }} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all" title="Deactivate">
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
  const statusBadge: Record<number, string> = { [InvitationStatus.Pending]: 'bg-warning-soft text-warning', [InvitationStatus.Accepted]: 'bg-success-soft text-success', [InvitationStatus.Cancelled]: 'bg-glass-2 text-text-muted', [InvitationStatus.Expired]: 'bg-danger-soft text-danger' };

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
              <div className="w-10 h-10 rounded-lg bg-glass-2 flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5 text-text-muted" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-text-primary">{inv.email}</div>
                <div className="text-xs text-text-muted">by {inv.invitedByName} · {USER_ROLE_LABEL[inv.role as UserRoleValue]} · Expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusBadge[inv.status] || 'bg-glass-2 text-text-muted'}`}>
                {inv.isExpired && isPending ? 'Expired' : INVITATION_STATUS_LABEL[inv.status as keyof typeof INVITATION_STATUS_LABEL]}
              </span>
              {(isPending || inv.isExpired) && (
                <div className="flex items-center gap-2">
                  <button onClick={() => resend.mutate(inv.id)} disabled={resend.isPending} className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-soft transition-all" title="Resend"><RefreshCw className="w-4 h-4" /></button>
                  {isPending && !inv.isExpired && (
                    <button onClick={() => cancel.mutate(inv.id)} disabled={cancel.isPending} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-all" title="Cancel"><XCircle className="w-4 h-4" /></button>
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
