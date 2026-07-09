import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
});
