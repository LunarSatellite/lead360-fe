import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from './team.api';
import { toast } from 'sonner';
import { ApiError } from '@/shared/lib/api-client';
import type { CreateInvitationRequest, AcceptInvitationRequest, AdminUpdateUserRequest } from '../types/team.types';
import type { AuthResponse, UserRoleValue } from '@/features/auth/types/auth.types';

export const teamKeys = {
  all: ['team'] as const,
  users: () => [...teamKeys.all, 'users'] as const,
  invitations: () => [...teamKeys.all, 'invitations'] as const,
} as const;

// ─── List team members ───
export function useTeamMembers() {
  return useQuery({
    queryKey: teamKeys.users(),
    queryFn: () => teamApi.listUsers(),
  });
}

// ─── List invitations ───
export function useInvitations() {
  return useQuery({
    queryKey: teamKeys.invitations(),
    queryFn: () => teamApi.listInvitations(),
  });
}

// ─── Send invitation ───
export function useSendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvitationRequest) => teamApi.sendInvitation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.invitations() });
      toast.success('Invitation sent!');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to send invitation.'),
  });
}

// ─── Cancel invitation ───
export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamApi.cancelInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.invitations() });
      toast.success('Invitation cancelled.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to cancel invitation.'),
  });
}

// ─── Resend invitation ───
export function useResendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamApi.resendInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.invitations() });
      toast.success('Invitation resent with a new link.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to resend.'),
  });
}

// ─── Validate invitation (public — from email link) ───
export function useValidateInvitation(token: string | null, email: string | null) {
  return useQuery({
    queryKey: [...teamKeys.all, 'validate', token, email] as const,
    queryFn: () => teamApi.validateInvitation(token!, email!),
    enabled: !!token && !!email,
    retry: false,
    staleTime: Infinity,
  });
}

// ─── Accept invitation (public — creates account + auto-login) ───
export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (data: AcceptInvitationRequest) => teamApi.acceptInvitation(data),
    onSuccess: (data) => {
      const auth = data as unknown as AuthResponse;
      if (auth?.accessToken) {
        localStorage.setItem('omniflow_token', auth.accessToken);
        if (auth.refreshToken) localStorage.setItem('omniflow_refresh_token', auth.refreshToken);
        if (auth.user?.tenantId) localStorage.setItem('omniflow_tenant_id', auth.user.tenantId);
      }
      toast.success('Welcome to the team!');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to accept invitation.'),
  });
}

// ─── Admin: update user role/status ───
export function useAdminUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AdminUpdateUserRequest }) =>
      teamApi.adminUpdateUser(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.users() });
      toast.success('User updated.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to update user.'),
  });
}

// ─── Deactivate user ───
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => teamApi.deactivateUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.users() });
      toast.success('User deactivated.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to deactivate user.'),
  });
}
