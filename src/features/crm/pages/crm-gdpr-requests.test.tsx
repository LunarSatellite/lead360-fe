import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { CrmDataSubjectRequestDto } from '../types/crm-gdpr.types';

/**
 * The thing this page must not do is lie.
 *
 * `CrmGdprService.ProcessErasureRequestAsync` sets a status, a timestamp and a
 * fixed note — it deletes nothing. A surface that offers "Erase data" over
 * that endpoint would leave a record saying an erasure happened when it did
 * not, which is worse than having no surface at all: it is the evidence an
 * auditor would read. So the wording is asserted here, not left to review.
 */

const getSubjectRequests = vi.fn();
const createSubjectRequest = vi.fn();
const markErasureProcessed = vi.fn();
const getRetentionPolicies = vi.fn();
const createRetentionPolicy = vi.fn();

vi.mock('../api/crm-gdpr.api', () => ({
  crmGdprApi: {
    getSubjectRequests: (...a: unknown[]) => getSubjectRequests(...a),
    createSubjectRequest: (...a: unknown[]) => createSubjectRequest(...a),
    markErasureProcessed: (...a: unknown[]) => markErasureProcessed(...a),
    getRetentionPolicies: (...a: unknown[]) => getRetentionPolicies(...a),
    createRetentionPolicy: (...a: unknown[]) => createRetentionPolicy(...a),
  },
}));

vi.mock('@/features/auth/api/auth.queries', () => ({
  useProfile: () => ({ data: { role: 1 } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

const request = (over: Partial<CrmDataSubjectRequestDto> = {}): CrmDataSubjectRequestDto => ({
  id: 'req-1',
  contactId: null,
  requestorEmail: 'ada@example.com',
  requestType: 'Erasure',
  status: 'Pending',
  requestDetails: null,
  responseNotes: null,
  completedAt: null,
  handledByUserId: null,
  createdAt: daysAgo(2),
  ...over,
});

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderPage() {
  const { Component } = await import('./CrmGdprRequestsPage');
  render(
    <Providers>
      <Component />
    </Providers>
  );
  await waitFor(() => expect(getSubjectRequests).toHaveBeenCalled());
}

beforeEach(() => {
  vi.clearAllMocks();
  getSubjectRequests.mockResolvedValue({ items: [request()], totalCount: 1 });
  getRetentionPolicies.mockResolvedValue({ items: [], totalCount: 0 });
  markErasureProcessed.mockResolvedValue(undefined);
  createSubjectRequest.mockResolvedValue(request());
});

describe('GDPR data subject requests', () => {
  it('says plainly that marking a request processed deletes nothing', async () => {
    await renderPage();

    const notice = await screen.findByTestId('gdpr-manual-erasure-notice');
    expect(notice.textContent).toMatch(/does not delete data/i);
    // The action is named for what the endpoint does, not what the right is.
    expect(screen.getByRole('button', { name: /mark processed/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^erase/i })).toBeNull();
  });

  it('counts the requests still open against the deadline', async () => {
    getSubjectRequests.mockResolvedValue({
      items: [
        request({ id: 'a', status: 'Pending' }),
        request({ id: 'b', status: 'InProgress' }),
        request({ id: 'c', status: 'Completed', completedAt: daysAgo(1) }),
      ],
      totalCount: 3,
    });
    await renderPage();

    const count = await screen.findByTestId('gdpr-open-count');
    expect(count.textContent).toMatch(/2 open requests/i);
  });

  it('flags a request past the 30-day deadline', async () => {
    getSubjectRequests.mockResolvedValue({
      items: [request({ createdAt: daysAgo(45) })],
      totalCount: 1,
    });
    await renderPage();

    expect(await screen.findByText(/past the 30-day deadline/i)).toBeTruthy();
  });

  it('warns before the deadline rather than only after it', async () => {
    getSubjectRequests.mockResolvedValue({
      items: [request({ createdAt: daysAgo(26) })],
      totalCount: 1,
    });
    await renderPage();

    expect(await screen.findByText(/4 days left/i)).toBeTruthy();
  });

  it('logs a request with the type the operator picked', async () => {
    getSubjectRequests.mockResolvedValue({ items: [], totalCount: 0 });
    await renderPage();

    fireEvent.change(screen.getByLabelText(/requestor email/i), {
      target: { value: 'grace@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/request type/i), {
      target: { value: 'Portability' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log request/i }));

    await waitFor(() =>
      expect(createSubjectRequest).toHaveBeenCalledWith({
        requestorEmail: 'grace@example.com',
        requestType: 'Portability',
        requestDetails: null,
      })
    );
  });

  it('explains what the selected right obliges the business to do', async () => {
    await renderPage();

    fireEvent.change(screen.getByLabelText(/request type/i), {
      target: { value: 'Restriction' },
    });
    expect(
      screen.getByText(/keep the data but stop processing it/i)
    ).toBeTruthy();
  });

  it('marks a request processed through the endpoint', async () => {
    await renderPage();

    // renderPage only waits for the fetch to fire; the row lands a tick later.
    fireEvent.click(await screen.findByRole('button', { name: /mark processed/i }));
    await waitFor(() => expect(markErasureProcessed).toHaveBeenCalledWith('req-1'));
  });

  it('offers nothing to act on for a completed request', async () => {
    getSubjectRequests.mockResolvedValue({
      items: [request({ status: 'Completed', completedAt: daysAgo(1) })],
      totalCount: 1,
    });
    await renderPage();

    await screen.findByText('Completed');
    expect(screen.queryByRole('button', { name: /mark processed/i })).toBeNull();
  });

  it('keeps the page away from non-admins', async () => {
    vi.resetModules();
    vi.doMock('@/features/auth/api/auth.queries', () => ({
      useProfile: () => ({ data: { role: 3 } }),
    }));
    const { Component } = await import('./CrmGdprRequestsPage');
    render(
      <Providers>
        <Component />
      </Providers>
    );
    expect(screen.getByText(/restricted/i)).toBeTruthy();
    vi.doUnmock('@/features/auth/api/auth.queries');
  });
});
