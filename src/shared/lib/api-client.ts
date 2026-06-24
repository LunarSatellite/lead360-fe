import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/config/env';
import type { ServiceResult } from '@/shared/types/common.types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly errorCode?: string,
    public readonly errors?: string[],
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('omniflow_token');
  const tenantId = localStorage.getItem('omniflow_tenant_id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  return config;
});

// ─── Paths that should NOT trigger 401 redirect ───
// These are either public endpoints or used on unauthenticated pages
const NO_REDIRECT_PATHS = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/refresh-token',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/verify-email',
  '/v1/auth/resend-verification',
  '/v1/team/invitations/validate',
  '/v1/team/invitations/accept',
  '/v1/compliance/profiles/recommended', // ★ used on register page (no token)
  '/v1/compliance/profiles', // ★ list profiles (may be called without auth)
  '/v1/users/me/change-password', // ★ wrong current password returns 401 — show error, don't redirect
  '/v1/public/schedule', // ★ contact-facing scheduling page — no auth required
  '/v1/book/',          // ★ public booking pages — no auth required
];

function shouldSkipRedirect(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REDIRECT_PATHS.some((path) => url.includes(path));
}

// ─── Refresh token mutex ───
// Only one refresh request goes out; other 401 failures queue behind it
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

export async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('omniflow_refresh_token');
  if (!refreshToken) return null;
  try {
    // Use raw axios to avoid interceptor loop.
    // BaseController wraps in { success, data } (lowercase anonymous object).
    // Inner DTO uses C# property names — handle both PascalCase and camelCase
    // so this works regardless of whether a global JSON naming policy is set.
    const res = await axios.post(`${env.apiBaseUrl}/v1/auth/refresh-token`, {
      refreshToken,
    });
    const raw = res.data;
    const payload = raw?.data ?? raw?.Data ?? raw;
    const accessToken: string | undefined = payload?.accessToken ?? payload?.AccessToken;
    const newRefreshToken: string | undefined = payload?.refreshToken ?? payload?.RefreshToken;

    if (accessToken) {
      localStorage.setItem('omniflow_token', accessToken);
      if (newRefreshToken) localStorage.setItem('omniflow_refresh_token', newRefreshToken);
      return accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;

    // Empty 200/204 responses (void endpoints like verify-email, revoke-token)
    if (data === null || data === undefined || data === '') {
      return data;
    }

    // ServiceResult wrapper from our backend
    if (typeof data === 'object' && 'success' in data) {
      const result = data as ServiceResult<unknown>;
      if (!result.success) {
        throw new ApiError(result.message ?? 'Operation failed', result.errorCode, result.errors);
      }
      return result.data as never;
    }

    // Plain response (not wrapped in ServiceResult)
    return data;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const requestUrl = error.config?.url;

      // 401 handling with refresh token mutex
      if (status === 401) {
        if (shouldSkipRedirect(requestUrl)) {
          // ★ Public/registration endpoint — throw error, don't redirect
          const msg =
            data && typeof data === 'object' && 'message' in data ? (data as any).message : 'Unauthorized';
          throw new ApiError(msg, undefined, undefined, 401);
        }

        const originalRequest = error.config!;

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            });
            // If refresh ultimately fails, the redirect below will fire
            setTimeout(() => reject(new ApiError('Session expired', undefined, undefined, 401)), 15_000);
          });
        }

        // First 401 — try refresh
        isRefreshing = true;
        const newToken = await tryRefreshToken();

        if (newToken) {
          // Notify queued requests BEFORE releasing the mutex so no second
          // refresh attempt can slip through between onTokenRefreshed and reset.
          onTokenRefreshed(newToken);
          isRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }

        // Refresh failed — reject all queued requests, clear session, redirect
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('omniflow_token');
        localStorage.removeItem('omniflow_refresh_token');
        localStorage.removeItem('omniflow_tenant_id');
        window.location.href = '/auth/login';
        return Promise.reject(new ApiError('Session expired', undefined, undefined, 401));
      }

      // ProblemDetails format (ASP.NET default error response)
      if (data && typeof data === 'object' && 'title' in data) {
        throw new ApiError(
          data.detail || data.title || 'Request failed',
          undefined,
          data.errors ? (Object.values(data.errors).flat() as string[]) : undefined,
          status,
        );
      }

      // ServiceResult error format
      if (data && typeof data === 'object' && 'message' in data) {
        throw new ApiError(
          data.message ?? error.message ?? 'Request failed',
          data.errorCode,
          data.errors,
          status,
        );
      }

      throw new ApiError(error.message ?? 'Network error', undefined, undefined, status);
    }

    throw new ApiError(error instanceof Error ? error.message : 'Unknown error');
  },
);
