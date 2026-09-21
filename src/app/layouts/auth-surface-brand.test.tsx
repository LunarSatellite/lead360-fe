import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * Both consoles are the same bundle with one build flag flipped, so the only
 * honest test renders each build and reads what is on the screen.
 *
 * `isStyleMintConsole` is resolved once, when `env.ts` is first evaluated —
 * which is why every case stubs the variable, resets the module registry and
 * *then* imports. A top-level import would freeze whichever build happened to
 * load first and quietly test it twice.
 *
 * Assertions run against the rendered tree on purpose. Grepping the source for
 * "Lead360" passes on a file that still renders it through a variable, and
 * fails on a comment no operator will ever read.
 */

// The Google button needs an OAuth provider context that has nothing to do with
// the wording under test, and would otherwise throw on render.
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div>Continue with Google</div>,
}));

// jsdom has no layout engine and so no `scrollIntoView`; the lead360 chat demo
// calls it as each message lands. Only the lead360 build renders that demo,
// which is the whole point of the StyleMint cases below.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

type Product = 'lead360' | 'stylemint';
type AuthPage = { Component: React.ComponentType };

async function loadPage(page: 'login' | 'register'): Promise<AuthPage> {
  // Two literal specifiers rather than one computed one: a dynamic import built
  // from a variable escapes the `@/` alias and resolves at runtime, if at all.
  return page === 'login'
    ? await import('@/features/auth/pages/LoginPage')
    : await import('@/features/auth/pages/RegisterPage');
}

/** Renders the auth chrome around one auth page, as the router composes them. */
async function renderAuthSurface(product: Product, page: 'login' | 'register') {
  vi.stubEnv('VITE_CONSOLE_PRODUCT', product);
  vi.resetModules();

  const { AuthLayout } = await import('./AuthLayout');
  const { Component } = await loadPage(page);

  render(
    <Providers>
      <MemoryRouter initialEntries={[`/auth/${page}`]}>
        <Routes>
          <Route path="/auth" element={<AuthLayout />}>
            <Route path={page} element={<Component />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Providers>,
  );
}

/** Everything an operator would read as "this is the chatbot product". */
const CHATBOT_WORDING = [
  /chatbot/i,
  /\bbots?\b/i,
  /Zova/i,
  /any industry/i,
  /teams already building/i,
  /setup time/i,
  /channels/i,
  /conversations/i,
];

const visibleText = () => document.body.textContent ?? '';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('the StyleMint build never shows an operator the chatbot product', () => {
  it.each(['login', 'register'] as const)(
    'names no chatbot and no Lead360 on the %s screen',
    async (page) => {
      await renderAuthSurface('stylemint', page);
      const text = visibleText();

      expect(text).not.toMatch(/Lead360/i);
      for (const pattern of CHATBOT_WORDING) {
        expect(text).not.toMatch(pattern);
      }
    },
  );

  it("does not hang Lead360's mark in the header when StyleMint has none of its own", async () => {
    await renderAuthSurface('stylemint', 'login');
    for (const img of screen.queryAllByRole('img')) {
      expect(img.getAttribute('src') ?? '').not.toMatch(/Lead360/i);
    }
  });

  it('calls the product StyleMint and says what it is for', async () => {
    await renderAuthSurface('stylemint', 'login');

    expect(screen.getByText('StyleMint')).toBeInTheDocument();
    expect(screen.getByText('Commerce operations')).toBeInTheDocument();
  });

  it('sells the operator nothing on the way in — no counts, no social proof', async () => {
    await renderAuthSurface('stylemint', 'register');
    const text = visibleText();

    expect(text).not.toMatch(/50\+/);
    expect(text).not.toMatch(/<5 min/);
    expect(text).not.toMatch(/\bfree\b/i);
    // What replaces the pitch names the work instead.
    expect(screen.getByText('Orders and returns')).toBeInTheDocument();
    expect(screen.getByText('Payouts')).toBeInTheDocument();
  });
});

describe('the lead360 build reads exactly as it did before the flag existed', () => {
  it('keeps the product name, tagline and mark on the sign-in screen', async () => {
    await renderAuthSurface('lead360', 'login');

    expect(screen.getByText('Lead360')).toBeInTheDocument();
    expect(screen.getByText('CRM & automation')).toBeInTheDocument();
    expect(screen.getByAltText('Lead360')).toHaveAttribute('src', '/Lead360logo/1.png');
  });

  it('keeps the sign-in heading and the free-signup invitation', async () => {
    await renderAuthSurface('lead360', 'login');

    // "Welcome back" is both the form heading and the panel eyebrow.
    expect(screen.getAllByText('Welcome back').length).toBeGreaterThan(0);
    expect(screen.getByText('Sign in to your workspace')).toBeInTheDocument();
    expect(screen.getByText('Create one free')).toBeInTheDocument();
  });

  it('keeps the register heading and the chatbot pitch beside it', async () => {
    await renderAuthSurface('lead360', 'register');

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Create your account to get started')).toBeInTheDocument();
    expect(screen.getByText("This is what you'll build")).toBeInTheDocument();
    expect(visibleText()).toMatch(/teams already building/);
    expect(visibleText()).toMatch(/chatbot/i);
  });

  it('defaults to the lead360 wording when the flag is unset entirely', async () => {
    vi.stubEnv('VITE_CONSOLE_PRODUCT', '');
    vi.resetModules();
    const { consoleBrand } = await import('@/shared/config/console-brand');

    expect(consoleBrand.name).toBe('Lead360');
    expect(consoleBrand.showsProductMarketing).toBe(true);
  });
});
