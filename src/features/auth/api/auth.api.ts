import axios from 'axios';
import { apiClient } from '../../../shared/lib/api-client';
import { env } from '@/shared/config/env';
import type {
  RegisterRequest, RegisterResponse, LoginRequest, AuthResponse,
  GoogleLoginRequest,
  RefreshTokenRequest, RevokeTokenRequest, VerifyEmailRequest,
  ResendVerificationRequest, ForgotPasswordRequest, ResetPasswordRequest,
  UserProfileDto, UpdateProfileRequest, ChangePasswordRequest,
} from '../types/auth.types';

export const authApi = {
  // POST /api/v1/auth/register [AllowAnonymous] → 201 RegisterResponse
  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/v1/auth/register', data),

  // POST /api/v1/auth/login [AllowAnonymous] → 200 AuthResponse
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/v1/auth/login', data),

  // POST /api/v1/auth/google [AllowAnonymous] → 200 AuthResponse
  googleLogin: (data: GoogleLoginRequest) =>
    apiClient.post<AuthResponse>('/v1/auth/google', data),

  // POST /api/v1/auth/refresh-token [AllowAnonymous] → 200 AuthResponse
  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.post<AuthResponse>('/v1/auth/refresh-token', data),

  // POST /api/v1/auth/revoke-token (logout) → 200
  revokeToken: (data: RevokeTokenRequest) =>
    apiClient.post<void>('/v1/auth/revoke-token', data),

  // POST /api/v1/auth/verify-email → 200
  verifyEmail: async (data: VerifyEmailRequest) => {
    const response = await axios.post(`${env.apiBaseUrl}/v1/auth/verify-email`, data);
    return response.data as { success: boolean; message?: string };
  },

  // POST /api/v1/auth/resend-verification → 200
  resendVerification: (data: ResendVerificationRequest) =>
    apiClient.post<void>('/v1/auth/resend-verification', data),

  // POST /api/v1/auth/forgot-password → 200
  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<void>('/v1/auth/forgot-password', data),

  // POST /api/v1/auth/reset-password → 200
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<void>('/v1/auth/reset-password', data),

  // GET /api/v1/users/me [Authorize] → UserProfileDto
  getProfile: () =>
    apiClient.get<UserProfileDto>('/v1/users/me'),

  // PUT /api/v1/users/me [Authorize] → UserProfileDto
  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<UserProfileDto>('/v1/users/me', data),

  // POST /api/v1/users/me/change-password [Authorize] → 200
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<void>('/v1/users/me/change-password', data),
} as const;

// ─── Additional User Endpoints (from swagger) ───

import type { UserDto, UserRoleValue, UserStatusValue } from '../types/auth.types';

export const userApi = {
  // GET /api/v1/users → UserDto[]
  getAll: () =>
    apiClient.get<UserDto[]>('/v1/users'),

  // GET /api/v1/users/{userId} → UserDto
  getById: (userId: string) =>
    apiClient.get<UserDto>(`/v1/users/${userId}`),

  // DELETE /api/v1/users/{userId} → void (soft delete)
  delete: (userId: string) =>
    apiClient.delete<void>(`/v1/users/${userId}`),

  // PUT /api/v1/users/{userId}/admin → UserDto
  adminUpdate: (userId: string, data: { role?: UserRoleValue; status?: UserStatusValue }) =>
    apiClient.put<UserDto>(`/v1/users/${userId}/admin`, data),
} as const;
