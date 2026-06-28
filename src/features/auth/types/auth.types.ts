// ═══════════════════════════════════════════════════════════════
// Auth types — exact mirror of Lead360 Swagger spec
// Source: /api/v1/auth/* + /api/v1/users/*
// ═══════════════════════════════════════════════════════════════

// ─── Enums ───

export const UserRole = { Owner: 1, Admin: 2, Agent: 3, Manager: 4 } as const;
export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLE_LABEL: Record<UserRoleValue, string> = {
  [UserRole.Owner]: 'Owner', [UserRole.Admin]: 'Admin', [UserRole.Agent]: 'Agent', [UserRole.Manager]: 'Manager',
};

export const UserStatus = { Pending: 1, Active: 2, Suspended: 3, Deactivated: 4 } as const;
export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus];
export const USER_STATUS_LABEL: Record<UserStatusValue, string> = {
  [UserStatus.Pending]: 'Pending', [UserStatus.Active]: 'Active',
  [UserStatus.Suspended]: 'Suspended', [UserStatus.Deactivated]: 'Deactivated',
};

export const BusinessType = { Goods: 1, Services: 2, Hybrid: 3 } as const;
export type BusinessTypeValue = (typeof BusinessType)[keyof typeof BusinessType];
export const BUSINESS_TYPE_LABEL: Record<BusinessTypeValue, string> = {
  [BusinessType.Goods]: 'Goods-based', [BusinessType.Services]: 'Service-based', [BusinessType.Hybrid]: 'Hybrid',
};

// ─── RegisterRequest (POST /api/v1/auth/register) ───
export interface RegisterRequest {
  businessName: string;            // required, maxLength 200
  businessType: BusinessTypeValue; // required, enum 1|2|3
  industry: string;                // required, maxLength 100
  businessDescription?: string;    // nullable, maxLength 500
  firstName: string;               // required, maxLength 100
  lastName: string;                // required, maxLength 100
  email: string;                   // required, email format, maxLength 254
  password: string;                // required, minLength 8, maxLength 128
  phone?: string;                  // nullable, maxLength 20
}

// ─── RegisterResponse ───
export interface RegisterResponse {
  tenantId: string;
  userId: string;
  email: string | null;
  businessName: string | null;
  message: string | null;
}

// ─── LoginRequest (POST /api/v1/auth/login) ───
export interface LoginRequest {
  email: string;     // required, email format
  password: string;  // required
}

// ─── GoogleLoginRequest (POST /api/v1/auth/google) ───
export interface GoogleLoginRequest {
  idToken: string;   // required, Google ID token JWT from @react-oauth/google
}

// ─── AuthResponse (login + refresh response) ───
export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserProfileDto;
}

// ─── RefreshTokenRequest (POST /api/v1/auth/refresh-token) ───
export interface RefreshTokenRequest {
  refreshToken: string; // required
}

// ─── RevokeTokenRequest (POST /api/v1/auth/revoke-token — logout) ───
export interface RevokeTokenRequest {
  refreshToken: string; // required
}

// ─── VerifyEmailRequest (POST /api/v1/auth/verify-email) ───
export interface VerifyEmailRequest {
  token: string;  // required
  email: string;  // required, email format
}

// ─── ResendVerificationRequest (POST /api/v1/auth/resend-verification) ───
export interface ResendVerificationRequest {
  email: string; // required, email format
}

// ─── ForgotPasswordRequest (POST /api/v1/auth/forgot-password) ───
export interface ForgotPasswordRequest {
  email: string; // required, email format
}

// ─── ResetPasswordRequest (POST /api/v1/auth/reset-password) ───
export interface ResetPasswordRequest {
  token: string;       // required
  email: string;       // required, email format
  newPassword: string; // required, minLength 8, maxLength 128
}

// ─── ChangePasswordRequest (POST /api/v1/users/me/change-password) ───
export interface ChangePasswordRequest {
  currentPassword: string; // required
  newPassword: string;     // required, minLength 8, maxLength 128
}

// ─── UpdateProfileRequest (PUT /api/v1/users/me) ───
export interface UpdateProfileRequest {
  firstName?: string | null;  // maxLength 100
  lastName?: string | null;   // maxLength 100
  phone?: string | null;      // maxLength 20
  avatarUrl?: string | null;  // maxLength 500
}

// ─── UserProfileDto (returned in AuthResponse.user, GET /api/v1/users/me) ───
export interface UserProfileDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRoleValue;
  tenantName: string | null;
  tenantId: string;
}

// ─── UserDto (full user, GET /api/v1/users, admin endpoints) ───
export interface UserDto {
  id: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  tenantId: string;
  tenantName: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRoleValue;
  status: UserStatusValue;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  crmRoleId: string | null;
}
