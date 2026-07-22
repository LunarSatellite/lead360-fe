import type { UserRoleValue, UserStatusValue } from '@/features/auth/types/auth.types';

// ─── Enums ───
export const InvitationStatus = { Pending: 1, Accepted: 2, Cancelled: 3, Expired: 4 } as const;
export type InvitationStatusValue = (typeof InvitationStatus)[keyof typeof InvitationStatus];
export const INVITATION_STATUS_LABEL: Record<InvitationStatusValue, string> = {
  [InvitationStatus.Pending]: 'Pending',
  [InvitationStatus.Accepted]: 'Accepted',
  [InvitationStatus.Cancelled]: 'Cancelled',
  [InvitationStatus.Expired]: 'Expired',
};

// ─── TeamInvitationDto ───
export interface TeamInvitationDto {
  id: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  isDeleted: boolean;
  tenantId: string;
  tenantName: string | null;
  invitedByUserId: string;
  invitedByName: string | null;
  email: string | null;
  role: UserRoleValue;
  status: InvitationStatusValue;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedByUserId: string | null;
  acceptedByName: string | null;
  personalMessage: string | null;
  isExpired: boolean;
  isPending: boolean;
}

// ─── CreateInvitationRequest (POST /api/v1/team/invite) ───
export interface CreateInvitationRequest {
  email: string;                // required, email, maxLength 254
  role: UserRoleValue;          // required, enum 1|2|3
  personalMessage?: string;     // nullable, maxLength 500
}

// ─── AcceptInvitationRequest (POST /api/v1/team/invitations/accept) ───
export interface AcceptInvitationRequest {
  token: string;       // required
  email: string;       // required, email
  firstName: string;   // required, maxLength 100
  lastName: string;    // required, maxLength 100
  password: string;    // required, minLength 8, maxLength 128
  phone?: string;      // nullable, maxLength 20
}

// ─── AdminUpdateUserRequest (PUT /api/v1/users/{userId}/admin) ───
export interface AdminUpdateUserRequest {
  role?: UserRoleValue;
  phone?: string | null;       // optional, maxLength 20
  status?: UserStatusValue;
  jobTitle?: string | null;     // optional, maxLength 100
  department?: string | null;  // optional, maxLength 100
}
