export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  wsUrl: import.meta.env.VITE_WS_URL as string,
  enableMsw: import.meta.env.VITE_ENABLE_MSW === 'true',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
