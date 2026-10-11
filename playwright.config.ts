import { defineConfig, devices } from '@playwright/test';

/**
 * The browser half of the accessibility check.
 *
 * `test:e2e` has been in package.json for a while pointing at nothing: there
 * was no config and `tests/` held one .gitkeep. This gives it something to
 * run.
 *
 * It exists for one rule the unit tests cannot reach. jsdom computes no
 * layout, so axe's colour-contrast rule is skipped there — and colour
 * contrast is exactly where this admin's measurable defects have been: 77
 * controls with white on a brand fill, and the Field error text at 4.39:1
 * against a 4.5:1 floor. Both needed a real browser to find.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  // One worker: the dev server is shared, and a flaky parallel run would
  // teach everyone to re-run rather than read the failure.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // A fixed viewport: contrast results do not depend on it, but a stable
    // one keeps a failure reproducible.
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    // `vite preview` over a production build: it is what the audit should
    // measure. A dev build injects the router's error overlay and HMR
    // client, which axe then reports on instead of the application.
    // `--host 127.0.0.1` explicitly: vite preview otherwise binds ::1
    // only, and Playwright's health check on 127.0.0.1 waits out the
    // whole timeout against a server that is already up.
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      // The build refuses to run without this, correctly: shipping without
      // it produces an app that calls `undefined/...` and looks like an API
      // outage. The audit intercepts every request before it leaves the
      // page, so the value only has to exist. A deliberately dead origin,
      // so that an interception this spec forgets to make fails visibly
      // rather than reaching something real.
      VITE_API_BASE_URL: 'http://127.0.0.1:9/never-reached',
    },
  },
});
