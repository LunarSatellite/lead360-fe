import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './auth.api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/shared/config/query-keys';
import { ApiError } from '@/shared/lib/api-client';
import type {
  LoginRequest,
  GoogleLoginRequest,
  RegisterRequest,
  AuthResponse,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  ResendVerificationRequest,
} from '../types/auth.types';

// ─── Query Keys ───
export const authKeys = {
  all: QUERY_KEYS.auth,
  profile: () => [...authKeys.all, 'profile'] as const,
} as const;

// ─── Storage helpers ───
function persistTokens(auth: AuthResponse) {
  if (auth.accessToken) localStorage.setItem('omniflow_token', auth.accessToken);
  if (auth.refreshToken) localStorage.setItem('omniflow_refresh_token', auth.refreshToken);
  if (auth.user?.tenantId) localStorage.setItem('omniflow_tenant_id', auth.user.tenantId);
}

function clearTokens() {
  localStorage.removeItem('omniflow_token');
  localStorage.removeItem('omniflow_refresh_token');
  localStorage.removeItem('omniflow_tenant_id');
}

// ─── useLogin ───
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      const auth = data as unknown as AuthResponse;
      persistTokens(auth);
      qc.setQueryData(authKeys.profile(), auth.user);
      toast.success(`Welcome back, ${auth.user.firstName}!`);
    },
    onError: (err: ApiError) => {
      if (err.status === 401) toast.error('Invalid email or password.');
      else if (err.status === 429) toast.error('Account locked. Try again later.');
      else toast.error(err.message || 'Login failed.');
    },
  });
}

// ─── useGoogleLogin ───
export function useGoogleLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GoogleLoginRequest) => authApi.googleLogin(data),
    onSuccess: (data) => {
      const auth = data as unknown as AuthResponse;
      persistTokens(auth);
      qc.setQueryData(authKeys.profile(), auth.user);
      toast.success(`Welcome back, ${auth.user.firstName}!`);
    },
    onError: (err: ApiError) => {
      if (err.status === 401) toast.error('Google sign-in rejected.');
      else toast.error(err.message || 'Google sign-in failed.');
    },
  });
}

// ─── useRegister ───
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (_data) => {
      const res = _data as unknown as RegisterResponse;
      toast.success(res.message || 'Account created! Check your email to verify.');
    },
    onError: (err: ApiError) => {
      if (err.status === 400 && err.errors?.length) {
        err.errors.forEach((e) => toast.error(e));
      } else {
        toast.error(err.message || 'Registration failed.');
      }
    },
  });
}

// ─── useLogout (revokes refresh token on server) ───
export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem('omniflow_refresh_token');
      if (refreshToken) return authApi.revokeToken({ refreshToken });
      return Promise.resolve();
    },
    onSettled: () => {
      clearTokens();
      qc.clear();
      navigate('/auth/login');
      toast.success('Logged out.');
    },
  });
}

// ─── useProfile (GET /users/me) ───
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled: !!localStorage.getItem('omniflow_token'),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// ─── useUpdateProfile (PUT /users/me) ───
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authApi.updateProfile(data),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.profile(), data);
      toast.success('Profile updated.');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to update profile.'),
  });
}

// ─── useChangePassword (POST /users/me/change-password) ───
export function useChangePassword() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed. Please log in again.');
      clearTokens();
      qc.clear();
      navigate('/auth/login');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to change password.'),
  });
}

// ─── useForgotPassword ───
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
    onSuccess: () => toast.success('If the email exists, a reset link has been sent.'),
    onError: () => toast.success('If the email exists, a reset link has been sent.'),
  });
}

// ─── useResetPassword ───
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
    onSuccess: () => toast.success('Password reset successfully. You can now log in.'),
    onError: (err: ApiError) => toast.error(err.message || 'Reset failed. Link may have expired.'),
  });
}

// ─── useResendVerification ───
export function useResendVerification() {
  return useMutation({
    mutationFn: (data: ResendVerificationRequest) => authApi.resendVerification(data),
    onSuccess: () => toast.success('Verification email sent.'),
    onError: (err: ApiError) => toast.error(err.message || 'Failed to send email.'),
  });
}

// ─── Additional User Hooks (from swagger) ───

import { userApi } from './auth.api';

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
} as const;

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => userApi.getAll(),
  });
}

export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(userId!),
    queryFn: () => userApi.getById(userId!),
    enabled: !!userId,
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => userApi.delete(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success('User deactivated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to deactivate user'),
  });
}

export function useAdminUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { role?: number; status?: number } }) =>
      userApi.adminUpdate(userId, data),
    onSuccess: (_res, { userId }) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(userId) });
      qc.invalidateQueries({ queryKey: userKeys.list() });
      toast.success('User updated');
    },
    onError: (err: ApiError) => toast.error(err.message || 'Update failed'),
  });
}
