import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { CrmSsoConfigurationDto } from '../types/crm-sso.types';

/**
 * `CrmSsoService.TestConnectionAsync` stamps `TestedAt` and saves. It never
 * contacts the identity provider. The dangerous version of this page is the
 * one with a "Test connection" button that goes green — an admin trusts it,
 * ticks "Require for everyone", and locks the workspace out of its own CRM.
 * The wording is asserted here so a later tidy-up cannot shorten it back.
 */

const getAll = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();
const recordTest = vi.fn();

vi.mock('../api/crm-sso.api', () => ({
  crmSsoApi: {
    getAll: (...a: unknown[]) => getAll(...a),
    create: (...a: unknown[]) => create(...a),
    update: (...a: unknown[]) => update(...a),
    remove: (...a: unknown[]) => remove(...a),
    recordTest: (...a: unknown[]) => recordTest(...a),
  },
}));

vi.mock('@/features/auth/api/auth.queries', () => ({
  useProfile: () => ({ data: { role: 1 } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const config = (over: Partial<CrmSsoConfigurationDto> = {}): CrmSsoConfigurationDto => ({
  id: 'sso-1',
  name: 'Staff sign-in',
  provider: 'AzureAD',
  clientId: 'abc',
  authorityUrl: 'https://login.microsoftonline.com/t/v2.0',
  metadataUrl: null,
  isActive: true,
  enforceForAllUsers: false,
  testedAt: null,
  createdAt: new Date().toISOString(),
  ...over,
});

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderPage() {
  const { Component } = await import('./CrmSsoPage');
  render(
    <Providers>
      <Component />
    </Providers>
  );
  await waitFor(() => expect(getAll).toHaveBeenCalled());
}

beforeEach(() => {
  vi.clearAllMocks();
  getAll.mockResolvedValue([config()]);
  create.mockResolvedValue(config());
  recordTest.mockResolvedValue(undefined);
  remove.mockResolvedValue(undefined);
});

describe('SSO configuration', () => {
  it('says there is no live connection test, and why that matters', async () => {
    await renderPage();

    const notice = await screen.findByTestId('sso-no-live-test-notice');
    expect(notice.textContent).toMatch(/no live connection test/i);
    expect(notice.textContent).toMatch(/lock the whole workspace out/i);
    // Named for what it does. Nothing offers to "test the connection".
    expect(await screen.findByRole('button', { name: /record a check/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /test connection/i })).toBeNull();
  });

  it('shows a connection that has never been checked as exactly that', async () => {
    await renderPage();
    expect(await screen.findByText(/never checked/i)).toBeTruthy();
  });

  it('marks an enforced connection so the risky one is visible at a glance', async () => {
    getAll.mockResolvedValue([config({ enforceForAllUsers: true })]);
    await renderPage();
    expect(await screen.findByText('Required')).toBeTruthy();
  });

  it('asks for a metadata URL for SAML and a client for the OIDC family', async () => {
    await renderPage();

    // Default is Entra ID — an OIDC provider.
    expect(screen.getByLabelText(/client id/i)).toBeTruthy();
    expect(screen.queryByLabelText(/metadata url/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/identity provider/i), {
      target: { value: 'Saml2' },
    });

    expect(screen.getByLabelText(/metadata url/i)).toBeTruthy();
    expect(screen.queryByLabelText(/client id/i)).toBeNull();
  });

  it('explains that a stored secret cannot be displayed back', async () => {
    await renderPage();
    const note = screen.getByTestId('sso-secret-note');
    expect(note.textContent).toMatch(/never sends it back/i);
  });

  it('creates a connection with the provider that was chosen', async () => {
    await renderPage();

    fireEvent.change(screen.getByLabelText(/connection name/i), {
      target: { value: 'Okta staff' },
    });
    fireEvent.change(screen.getByLabelText(/identity provider/i), {
      target: { value: 'Okta' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save connection/i }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Okta staff', provider: 'Okta' })
      )
    );
  });

  it('records a check through the endpoint', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /record a check/i }));
    await waitFor(() => expect(recordTest).toHaveBeenCalledWith('sso-1'));
  });

  it('removes a connection', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /remove staff sign-in/i }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('sso-1'));
  });

  it('keeps the page away from non-admins', async () => {
    vi.resetModules();
    vi.doMock('@/features/auth/api/auth.queries', () => ({
      useProfile: () => ({ data: { role: 3 } }),
    }));
    const { Component } = await import('./CrmSsoPage');
    render(
      <Providers>
        <Component />
      </Providers>
    );
    expect(screen.getByText(/restricted/i)).toBeTruthy();
    vi.doUnmock('@/features/auth/api/auth.queries');
  });
});
