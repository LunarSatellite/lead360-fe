import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/shared/lib/api-client';

console.log('[captcha] useCaptchaToken module loaded');

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

interface CaptchaConfig {
  enabled: boolean;
  siteKey: string;
}

let cachedConfig: CaptchaConfig | null = null;
let inflightConfig: Promise<CaptchaConfig> | null = null;
let scriptPromise: Promise<void> | null = null;

function getCaptchaConfig(): Promise<CaptchaConfig> {
  if (cachedConfig) return Promise.resolve(cachedConfig);
  if (!inflightConfig) {
    inflightConfig = (async () => {
      try {
        const res = await apiClient.get<CaptchaConfig>('/v1/public/captcha-config');
        // api-client unwraps ServiceResult.data automatically, so res is the inner payload
        const payload = (res as any)?.data ?? res;
        cachedConfig = (payload && typeof payload === 'object' && 'enabled' in payload)
          ? payload as CaptchaConfig
          : { enabled: false, siteKey: '' };
        console.log('[captcha] config loaded', cachedConfig);
      } catch (e: any) {
        console.error('[captcha] config fetch failed', e?.response?.status, e?.message, e?.response?.data);
        cachedConfig = { enabled: false, siteKey: '' };
      }
      return cachedConfig;
    })();
  }
  return inflightConfig;
}

function loadScript(siteKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha) {
    scriptPromise = Promise.resolve();
    return scriptPromise;
  }
  scriptPromise = new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      resolve();
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface UseCaptchaTokenResult {
  enabled: boolean;
  getToken: (action: string) => Promise<string | null>;
}

export function useCaptchaToken(): UseCaptchaTokenResult {
  const [config, setConfig] = useState<CaptchaConfig>({ enabled: false, siteKey: '' });

  useEffect(() => {
    let mounted = true;
    getCaptchaConfig().then((c) => {
      if (mounted) setConfig(c);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getToken = useCallback(
    async (action: string): Promise<string | null> => {
      // Always await the config so first submit after page load still gets a token
      // (not just subsequent submits after the useEffect has resolved).
      const cfg = cachedConfig ?? (await getCaptchaConfig());
      if (!cfg.enabled || !cfg.siteKey) {
        if (typeof console !== 'undefined') console.log('[captcha] disabled or no site key', cfg);
        return null;
      }
      if (typeof console !== 'undefined') console.log('[captcha] loading script for', cfg.siteKey);
      await loadScript(cfg.siteKey);
      if (!window.grecaptcha) {
        if (typeof console !== 'undefined') console.warn('[captcha] grecaptcha not available after script load');
        return null;
      }
      return new Promise<string | null>((resolve) => {
        try {
          window.grecaptcha!.ready(async () => {
            try {
              const token = await window.grecaptcha!.execute(cfg.siteKey, { action });
              if (typeof console !== 'undefined') console.log('[captcha] got token', token.substring(0, 30) + '...');
              resolve(token);
            } catch (e) {
              if (typeof console !== 'undefined') console.error('[captcha] execute failed', e);
              resolve(null);
            }
          });
        } catch {
          resolve(null);
        }
      });
    },
    [config.enabled, config.siteKey]
  );

  return { enabled: config.enabled, getToken };
}