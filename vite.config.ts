/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * A production build with no API base url is the failure this guard exists for.
 *
 * `env.ts` reads `import.meta.env.VITE_API_BASE_URL as string`. Vite replaces
 * that literally at build time, and the `as string` cast makes `undefined`
 * type-check cleanly — so an unset variable produces a bundle whose every
 * request goes to `undefined/...`. The app loads, renders its chrome, and
 * every panel shows an error. It looks like the API is down.
 *
 * There is no safe default: guessing localhost is how a deployed console ends
 * up pointing at the operator's laptop. So the build fails instead, naming the
 * variable. Dev and test are untouched — `.env.development` supplies it there.
 */
function requireApiBaseUrl(mode: string) {
  if (mode !== 'production') return;
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const value = env.VITE_API_BASE_URL ?? process.env.VITE_API_BASE_URL;
  if (value && value.trim().length > 0) return;
  throw new Error(
    'VITE_API_BASE_URL is not set, so this build would ship an app that ' +
      'calls `undefined/...` on every request and look like an API outage. ' +
      'Set it to the deployed API origin (see .env.production.example) ' +
      'either in .env.production or in the build environment.',
  );
}

export default defineConfig(({ mode }) => {
  requireApiBaseUrl(mode);
  return {
  plugins: [react()],
  // react-draggable (a react-grid-layout dependency) reads process.env.DRAGGABLE_DEBUG
  // unconditionally. Vite doesn't polyfill `process` in the browser, so without this the
  // access throws ReferenceError the instant a drag starts, silently aborting it.
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    // recharts is only pulled in by the lazy-loaded CRM analytics page. Pre-bundle
    // it up front so Vite doesn't re-optimize mid-navigation (which forces a reload
    // that fails the in-flight dynamic import of CrmAnalyticsPage).
    include: ['recharts'],
  },

  // Vitest was already a dependency with @testing-library/react, but had no
  // configuration and so no DOM: the three existing suites are pure-logic and
  // run under Node. Pointing it at jsdom keeps those passing and makes the
  // component tests this repo was already equipped for actually runnable.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Agent worktrees under .claude/ are whole checkouts of this repo. Without this every
    // suite is collected once per worktree, so one failure reports N times and each run pays
    // for trees that are not this one.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query'],
          router: ['react-router', 'react-router-dom'],
        },
      },
    },
  },
};
});
