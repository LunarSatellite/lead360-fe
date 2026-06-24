import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { tryRefreshToken } from '@/shared/lib/api-client';

function getTokenExpiry(token: string): number | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function useTokenAutoRefresh() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current);

      const token = localStorage.getItem('omniflow_token');
      if (!token) return;

      const expiry = getTokenExpiry(token);
      if (!expiry) return;

      const delay = expiry - Date.now() - 60_000; // refresh 60s before expiry

      if (delay <= 0) {
        doRefresh();
        return;
      }

      timerRef.current = setTimeout(doRefresh, delay);
    }

    async function doRefresh() {
      const newToken = await tryRefreshToken();
      if (newToken) {
        schedule();
      } else {
        localStorage.removeItem('omniflow_token');
        localStorage.removeItem('omniflow_refresh_token');
        localStorage.removeItem('omniflow_tenant_id');
        qc.clear();
        navigate('/auth/login');
      }
    }

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, qc]);
}
