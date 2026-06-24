import { apiClient } from '@/shared/lib/api-client';
import type { UserDto, AuthResponse } from '@/features/auth/types/auth.types';
import type {
  TeamInvitationDto, CreateInvitationRequest, AcceptInvitationRequest, AdminUpdateUserRequest,
} from '../types/team.types';

export const teamApi = {
  // POST /api/v1/team/invite [Authorize Owner/Admin] → 201 TeamInvitationDto
  sendInvitation: (data: CreateInvitationRequest) =>
    apiClient.post<TeamInvitationDto>('/v1/team/invite', data),

  // GET /api/v1/team/invitations [Authorize] → TeamInvitationDto[]
  listInvitations: () =>
    apiClient.get<TeamInvitationDto[]>('/v1/team/invitations'),

  // POST /api/v1/team/invitations/:id/cancel [Authorize]
  cancelInvitation: (invitationId: string) =>
    apiClient.post<void>(`/v1/team/invitations/${invitationId}/cancel`),

  // POST /api/v1/team/invitations/:id/resend [Authorize]
  resendInvitation: (invitationId: string) =>
    apiClient.post<TeamInvitationDto>(`/v1/team/invitations/${invitationId}/resend`),

  // GET /api/v1/team/invitations/validate?token=...&email=... [Public]
  validateInvitation: (token: string, email: string) =>
    apiClient.get<TeamInvitationDto>('/v1/team/invitations/validate', { params: { token, email } }),

  // POST /api/v1/team/invitations/accept [Public] → AuthResponse (auto-login)
  acceptInvitation: (data: AcceptInvitationRequest) =>
    apiClient.post<AuthResponse>('/v1/team/invitations/accept', data),

  // GET /api/v1/users [Authorize] → UserDto[]
  listUsers: () =>
    apiClient.get<UserDto[]>('/v1/users'),

  // DELETE /api/v1/users/:userId [Authorize]
  deactivateUser: (userId: string) =>
    apiClient.delete<void>(`/v1/users/${userId}`),

  // PUT /api/v1/users/:userId/admin [Authorize Owner/Admin]
  adminUpdateUser: (userId: string, data: AdminUpdateUserRequest) =>
    apiClient.put<UserDto>(`/v1/users/${userId}/admin`, data),
} as const;
