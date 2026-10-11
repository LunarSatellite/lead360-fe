import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  EmailIntegrationStatus,
  EmailProvider,
  type EmailIntegrationSummaryDto,
} from '../types/crm-email-sync.types';

const list = vi.fn();
const disconnect = vi.fn();
const sync = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../api/crm-email-sync.api', () => ({
  crmEmailSyncApi: {
    list: (...a: unknown[]) => list(...a),
    disconnect: (...a: unknown[]) => disconnect(...a),
    sync: (...a: unknown[]) => sync(...a),
    getAuthUrl: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

const integration = (
  over: Partial<EmailIntegrationSummaryDto> = {}
): EmailIntegrationSummaryDto => ({
  id: 'int-1',
  userId: 'user-1',
  provider: EmailProvider.Gmail,
  email: 'rep@example.com',
  status: EmailIntegrationStatus.Active,
  lastSyncedAt: new Date(Date.now() - 3_600_000).toISOString(),
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
  const { Component } = await import('./CrmEmailSyncPage');
  render(
    <Providers>
      <Component />
    </Providers>
  );
  await waitFor(() => expect(list).toHaveBeenCalled());
}

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue([integration()]);
  disconnect.mockResolvedValue(undefined);
  sync.mockResolvedValue({
    integrationId: 'int-1',
    email: 'rep@example.com',
    provider: EmailProvider.Gmail,
    emailsProcessed: 12,
    signalsCreated: 3,
    skipped: 9,
    syncedAt: new Date().toISOString(),
    error: null,
  });
});

describe('email sync', () => {
  it('reads the numeric provider and status rather than showing blanks', async () => {
    await renderPage();
    // These arrive as numbers, not names — a string union here would render
    // two empty labels and look like missing data. The provider sits inside a
    // longer line, so match on content rather than the whole node.
    // findAllByText: the string also matches every ancestor of the node.
    expect(await screen.findAllByText(/Gmail/)).not.toHaveLength(0);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('says plainly when a mailbox has never synced', async () => {
    list.mockResolvedValue([integration({ lastSyncedAt: null })]);
    await renderPage();
    expect(await screen.findByText(/never synced/i)).toBeTruthy();
  });

  it('warns that an errored mailbox reads as a quiet customer', async () => {
    list.mockResolvedValue([
      integration({ status: EmailIntegrationStatus.Error }),
    ]);
    await renderPage();

    const banner = await screen.findByTestId('email-sync-error-banner');
    expect(banner.textContent).toMatch(/stopped syncing/i);
    expect(banner.textContent).toMatch(/went quiet/i);
  });

  it('reports what a sync actually brought in', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /sync now/i }));

    await waitFor(() => expect(sync).toHaveBeenCalledWith('int-1'));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('3 added to the CRM')
      )
    );
  });

  it('treats a 200 carrying an error as a failure, not a success', async () => {
    // The endpoint answers 200 with `error` set when the provider refuses.
    sync.mockResolvedValue({
      integrationId: 'int-1',
      email: 'rep@example.com',
      provider: EmailProvider.Gmail,
      emailsProcessed: 0,
      signalsCreated: 0,
      skipped: 0,
      syncedAt: new Date().toISOString(),
      error: 'Token expired',
    });
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /sync now/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Token expired'));
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('will not sync a mailbox that is already disconnected', async () => {
    list.mockResolvedValue([
      integration({ status: EmailIntegrationStatus.Disconnected }),
    ]);
    await renderPage();

    const btn = await screen.findByRole('button', { name: /sync now/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('disconnects a mailbox', async () => {
    await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: /disconnect rep@example.com/i })
    );
    await waitFor(() => expect(disconnect).toHaveBeenCalledWith('int-1'));
  });
});
