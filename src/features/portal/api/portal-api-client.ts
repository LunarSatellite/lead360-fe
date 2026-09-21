import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/config/env';
import { ApiError } from '@/shared/lib/api-client';
import type { ServiceResult } from '@/shared/types/common.types';

export const portalApiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

portalApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('omniflow_portal_token');
  const tenantId = localStorage.getItem('omniflow_portal_tenant_id');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  return config;
});

const NO_REDIRECT_PATHS = [
  '/v1/portal/auth/request-link',
  '/v1/portal/auth/exchange',
  '/v1/portal/auth/refresh',
  '/v1/portal/auth/logout',
];

function shouldSkipRedirect(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REDIRECT_PATHS.some((path) => url.includes(path));
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

export async function tryPortalRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('omniflow_portal_refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${env.apiBaseUrl}/v1/portal/auth/refresh`, {
      refreshToken,
    });
    const raw = res.data;
    const payload = raw?.data ?? raw?.Data ?? raw;
    const accessToken: string | undefined = payload?.accessToken ?? payload?.AccessToken;
    const newRefreshToken: string | undefined = payload?.refreshToken ?? payload?.RefreshToken;

    if (accessToken) {
      localStorage.setItem('omniflow_portal_token', accessToken);
      if (newRefreshToken) localStorage.setItem('omniflow_portal_refresh_token', newRefreshToken);
      return accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

portalApiClient.interceptors.response.use(
  (response) => {
    const data = response.data;

    if (data === null || data === undefined || data === '') {
      return data;
    }

    if (typeof data === 'object' && 'success' in data) {
      const result = data as ServiceResult<unknown>;
      if (!result.success) {
        throw new ApiError(result.message ?? 'Operation failed', result.errorCode, result.errors);
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
            data && typeof data === 'object' && 'message' in data ? (data as Record<string, unknown>).message : 'Unauthorized';
          throw new ApiError(String(msg), undefined, undefined, 401);
        }

        const originalRequest = error.config!;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshSubscribers.push((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(portalApiClient(originalRequest));
            });
            setTimeout(() => reject(new ApiError('Session expired', undefined, undefined, 401)), 15_000);
          });
        }

        isRefreshing = true;
        const newToken = await tryPortalRefreshToken();

        if (newToken) {
          onTokenRefreshed(newToken);
          isRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return portalApiClient(originalRequest);
        }

        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('omniflow_portal_token');
        localStorage.removeItem('omniflow_portal_refresh_token');
        localStorage.removeItem('omniflow_portal_tenant_id');
        window.location.href = '/portal/auth';
        return Promise.reject(new ApiError('Session expired', undefined, undefined, 401));
      }

      if (data && typeof data === 'object' && 'title' in data) {
        const pd = data as Record<string, unknown>;
        throw new ApiError(
          String(pd.detail || pd.title || 'Request failed'),
          undefined,
          pd.errors ? (Object.values(pd.errors as Record<string, string[]>).flat() as string[]) : undefined,
          status,
        );
      }

      if (data && typeof data === 'object' && 'message' in data) {
        const sr = data as Record<string, unknown>;
        throw new ApiError(
          String(sr.message ?? error.message ?? 'Request failed'),
          sr.errorCode as string | undefined,
          sr.errors as string[] | undefined,
          status,
        );
      }

      throw new ApiError(error.message ?? 'Network error', undefined, undefined, status);
    }

    throw new ApiError(error instanceof Error ? error.message : 'Unknown error');
  },
);
