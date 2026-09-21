import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

/**
 * Each case here resets the module registry and re-imports the whole route graph, which takes
 * 1.4-2.5s on its own. Against vitest's 5s default that is comfortable alone and marginal
 * inside the full suite, where 32 other files hold their own jsdom environments.
 *
 * It failed roughly two runs in three when the suite's output was piped to another process,
 * and in none of ten runs when it was redirected to a file — consistent with the reporter
 * blocking on a slow reader and stealing from the budget, though that mechanism is inferred
 * from the correlation rather than measured.
 *
 * The second failure was always a consequence of the first: a timed-out test's `render()`
 * still resolves, but after its own cleanup has run, so the stray tree is found by the next
 * case as a duplicate `data-testid="landed"`. Only the timeout needs fixing.
 */
vi.setConfig({ testTimeout: 20_000 });

/**
 * What `/` opens, per build.
 *
 * `VITE_CONSOLE_PRODUCT` is read at module scope — by `env.ts` and, for the
 * landing branch, by `route-table.tsx` — so a build is chosen once, when the
 * module first evaluates. Stubbing the variable therefore has to come with a
 * module reset and a fresh dynamic import; setting it after the fact changes
 * nothing.
 */
async function routeTableFor(product: 'lead360' | 'stylemint') {
  vi.resetModules();
  vi.stubEnv('VITE_CONSOLE_PRODUCT', product);
  const [table, env] = await Promise.all([
    import('./route-table'),
    import('@/shared/config/env'),
  ]);
  return { ...table, isStyleMintConsole: env.isStyleMintConsole };
}

function WhereAmI() {
  const location = useLocation();
  return <span data-testid="landed">{location.pathname}</span>;
}

/** Resolves the `/` route for a build and renders whatever it hands back. */
async function renderRoot(product: 'lead360' | 'stylemint') {
  const { routeObjects } = await routeTableFor(product);
  const root = routeObjects.find((r: RouteObject) => r.path === '/');
  const resolved = await (root!.lazy as () => Promise<{ Component?: React.ComponentType }>)();
  const Component = resolved.Component!;

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Component />} />
        <Route path="*" element={<WhereAmI />} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.queryByTestId('landed')?.textContent ?? null;
}

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe('the StyleMint console does not open on chatbot marketing', () => {
  it('sends a signed-out visitor from "/" to sign-in', async () => {
    expect(await renderRoot('stylemint')).toBe('/auth/login');
  });

  it('renders no marketing page at "/" — no pricing, no WhatsApp pitch', async () => {
    await renderRoot('stylemint');
    // Over the rendered tree, not the source: the point is that the operator
    // never sees this, however the route happens to be wired.
    expect(screen.queryByText(/chatbot/i)).toBeNull();
    expect(screen.queryByText(/pricing/i)).toBeNull();
    expect(screen.queryByText(/whatsapp/i)).toBeNull();
  });

  it('agrees with the flag every other call site reads', async () => {
    expect((await routeTableFor('stylemint')).isStyleMintConsole).toBe(true);
    expect((await routeTableFor('lead360')).isStyleMintConsole).toBe(false);
  });
});

describe('the lead360 console keeps its landing page', () => {
  it('still resolves "/" to the marketing page for a signed-out visitor', async () => {
    const { routeObjects } = await routeTableFor('lead360');
    const root = routeObjects.find((r: RouteObject) => r.path === '/');
    const resolved = await (root!.lazy as () => Promise<{ Component?: React.ComponentType }>)();

    // Not a redirect: the real page module, which is what the StyleMint build
    // must not even load.
    const marketing = await import('@/features/landing/pages/LandingPage');
    expect(resolved.Component).toBe(marketing.Component);
  });
});

describe('a signed-in operator lands in the same place in both builds', () => {
  /** A token shaped like the one `guards.tsx` accepts, valid for an hour. */
  function liveToken(): string {
    const payload = { exp: Math.floor(Date.now() / 1000) + 60 * 60 };
    return `header.${btoa(JSON.stringify(payload))}.signature`;
  }

  it.each(['lead360', 'stylemint'] as const)('%s skips "/" for the dashboard', async (product) => {
    localStorage.setItem('omniflow_token', liveToken());
    const { POST_AUTH_LANDING } = await import('./route-paths');
    expect(await renderRoot(product)).toBe(POST_AUTH_LANDING);
  });
});
