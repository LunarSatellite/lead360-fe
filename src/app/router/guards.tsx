import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { env } from '@/shared/config/env';
import {
  getPortalToken,
  isPortalTokenExpired,
  clearPortalTokens,
} from '@/features/portal/hooks/usePortalAuth';
import { tryPortalRefreshToken } from '@/features/portal/api/portal-api-client';

// ─── Helpers ───

/** Decode JWT payload without a library */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return null;
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Check if JWT is expired (with 30s buffer) */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now() + 30_000; // 30s buffer
}

function clearAllTokens() {
  localStorage.removeItem('omniflow_token');
  localStorage.removeItem('omniflow_refresh_token');
  localStorage.removeItem('omniflow_tenant_id');
}

// ─── Loading Spinner ───

function AuthLoading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
        <span className="text-xs text-text-muted font-medium">Verifying session...</span>
      </div>
    </div>
  );
}

// ─── RequireAuth ───
// 1. No token at all → redirect to login
// 2. Token exists but expired → try refresh → if fail, redirect to login
// 3. Token valid → verify profile via useProfile → render children

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [authState, setAuthState] = useState<'checking' | 'valid' | 'invalid'>('checking');

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = localStorage.getItem('omniflow_token');

      // No token at all
      if (!token) {
        if (!cancelled) setAuthState('invalid');
        return;
      }

      // Token exists and not expired — good to go
      if (!isTokenExpired(token)) {
        if (!cancelled) setAuthState('valid');
        return;
      }

      // Token expired — try refresh
      const refreshToken = localStorage.getItem('omniflow_refresh_token');
      if (!refreshToken) {
        clearAllTokens();
        if (!cancelled) setAuthState('invalid');
        return;
      }

      try {
        const res = await axios.post(`${env.apiBaseUrl}/v1/auth/refresh-token`, { refreshToken });
        const raw = res.data;
        const payload = raw?.data ?? raw?.Data ?? raw;
        const accessToken: string | undefined = payload?.accessToken ?? payload?.AccessToken;
        const newRefreshToken: string | undefined = payload?.refreshToken ?? payload?.RefreshToken;
        if (accessToken) {
          localStorage.setItem('omniflow_token', accessToken);
          if (newRefreshToken) localStorage.setItem('omniflow_refresh_token', newRefreshToken);
          if (!cancelled) setAuthState('valid');
        } else {
          clearAllTokens();
          if (!cancelled) setAuthState('invalid');
        }
      } catch {
        clearAllTokens();
        if (!cancelled) setAuthState('invalid');
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authState === 'checking') return <AuthLoading />;
  if (authState === 'invalid') return <Navigate to="/auth/login" state={{ from: location }} replace />;

  return <>{children}</>;
}

// ─── RedirectIfAuth ───
// If user has a valid (non-expired) token, send them to dashboard

export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('omniflow_token');

  // No token or expired token → show auth page
  if (!token || isTokenExpired(token)) {
    // If expired, clean up silently
    if (token && isTokenExpired(token)) clearAllTokens();
    return <>{children}</>;
  }

  return <Navigate to="/dashboard/crm/analytics" replace />;
}

// ─── RequirePortalAuth ───

export function RequirePortalAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [authState, setAuthState] = useState<'checking' | 'valid' | 'invalid'>('checking');

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = getPortalToken();

      if (!token) {
        if (!cancelled) setAuthState('invalid');
        return;
      }

      if (!isPortalTokenExpired(token)) {
        if (!cancelled) setAuthState('valid');
        return;
      }

      const newToken = await tryPortalRefreshToken();
      if (newToken) {
        if (!cancelled) setAuthState('valid');
      } else {
        clearPortalTokens();
        if (!cancelled) setAuthState('invalid');
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authState === 'checking') return <AuthLoading />;
  if (authState === 'invalid') return <Navigate to="/portal/auth" state={{ from: location }} replace />;

  return <>{children}</>;
}

// ─── RedirectIfPortalAuth ───

export function RedirectIfPortalAuth({ children }: { children: ReactNode }) {
  const token = getPortalToken();

  if (!token || isPortalTokenExpired(token)) {
    if (token && isPortalTokenExpired(token)) clearPortalTokens();
    return <>{children}</>;
  }

  return <Navigate to="/portal/cases" replace />;
}
