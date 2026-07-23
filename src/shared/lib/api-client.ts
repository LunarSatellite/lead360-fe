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
  // ngrok free-tier interstitial: skip the warning page for non-browser API callers
  config.headers['ngrok-skip-browser-warning'] = '1';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  return config;
});

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
  '/v1/compliance/profiles/recommended',
  '/v1/compliance/profiles',
  '/v1/users/me/change-password',
  '/v1/public/schedule',
  '/v1/public/pay',
  '/v1/book/',
];

function shouldSkipRedirect(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REDIRECT_PATHS.some((path) => url.includes(path));
}

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

    if (data === null || data === undefined || data === '') {
      return data;
    }

    if (typeof data === 'object' && 'success' in data) {
      const result = data as ServiceResult<unknown> & Record<string, unknown>;
      if (!result.success) {
        throw new ApiError(result.message ?? 'Operation failed', result.errorCode, result.errors);
      }

      // PagedServiceResult<T> has items[] inside `data` and totalCount/pageNumber
      // at the top level. Renormalize so callers get { items, totalCount, ... }.
      if (
        'totalCount' in result &&
        'pageNumber' in result &&
        'pageSize' in result &&
        'totalPages' in result
      ) {
        return {
          items: (result.data as unknown[]) ?? [],
          totalCount: result.totalCount as number,
          pageNumber: result.pageNumber as number,
          pageSize: result.pageSize as number,
          totalPages: result.totalPages as number,
          correlationId: result.correlationId,
        } as never;
      }

      return result.data as never;
    }

    return data;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      const requestUrl = error.config?.url;

      if (status === 401) {
        if (shouldSkipRedirect(requestUrl)) {
          const msg =
            data && typeof data === 'object' && 'message' in data ? (data as any).message : 'Unauthorized';
          throw new ApiError(msg, undefined, undefined, 401);
        }

        const originalRequest = error.config!;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            });
            setTimeout(() => reject(new ApiError('Session expired', undefined, undefined, 401)), 15_000);
          });
        }

        isRefreshing = true;
        const newToken = await tryRefreshToken();

        if (newToken) {
          onTokenRefreshed(newToken);
          isRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }

        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('omniflow_token');
        localStorage.removeItem('omniflow_refresh_token');
        localStorage.removeItem('omniflow_tenant_id');
        window.location.href = '/auth/login';
        return Promise.reject(new ApiError('Session expired', undefined, undefined, 401));
      }

      if (data && typeof data === 'object' && 'title' in data) {
        throw new ApiError(
          data.detail || data.title || 'Request failed',
          undefined,
          data.errors ? (Object.values(data.errors).flat() as string[]) : undefined,
          status,
        );
      }

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