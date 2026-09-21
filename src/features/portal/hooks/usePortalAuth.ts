import type { PortalAuthResult } from '../types/portal.types';

const TOKEN_KEY = 'omniflow_portal_token';
const REFRESH_KEY = 'omniflow_portal_refresh_token';
const TENANT_KEY = 'omniflow_portal_tenant_id';

export function getPortalToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getPortalRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getPortalTenantId(): string | null {
  return localStorage.getItem(TENANT_KEY);
}

export function persistPortalTokens(result: PortalAuthResult, tenantId: string) {
  const r = result as unknown as Record<string, unknown>;
  const accessToken = r.accessToken ?? r.AccessToken;
  const refreshToken = r.refreshToken ?? r.RefreshToken;
  if (accessToken) localStorage.setItem(TOKEN_KEY, String(accessToken));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, String(refreshToken));
  localStorage.setItem(TENANT_KEY, tenantId);
}

export function clearPortalTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(TENANT_KEY);
}

export function isPortalTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return true;
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}
