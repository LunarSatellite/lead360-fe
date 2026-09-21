import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { tryPortalRefreshToken } from '../api/portal-api-client';
import { getPortalToken, clearPortalTokens } from './usePortalAuth';

function getTokenExpiry(token: string): number | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function usePortalTokenRefresh() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current);

      const token = getPortalToken();
      if (!token) return;

      const expiry = getTokenExpiry(token);
      if (!expiry) return;

      const delay = expiry - Date.now() - 60_000;

      if (delay <= 0) {
        doRefresh();
        return;
      }

      timerRef.current = setTimeout(doRefresh, delay);
    }

    async function doRefresh() {
      const newToken = await tryPortalRefreshToken();
      if (newToken) {
        schedule();
      } else {
        clearPortalTokens();
        qc.clear();
        navigate('/portal/auth');
      }
    }

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, qc]);
}
