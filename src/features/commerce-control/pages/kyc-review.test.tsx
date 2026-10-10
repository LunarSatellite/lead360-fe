import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  stylemintKycApi,
  type KycApplicationDetail,
  type KycReviewItem,
} from '../api/stylemint-kyc.api';
import { KycReviewPage } from './KycReviewPage';

/**
 * EMI phase 1 sends buyers' Tier-2 identity checks through the same queue as seller
 * applications. These tests pin what a reviewer must be able to see and do with one: tell it
 * apart from a vendor in the queue, find it with the filter, read who the buyer claims to be
 * without the full ID number on screen, put the ID photos beside the selfie, and reject with a
 * reason the backend will accept.
 */

vi.mock('../api/stylemint-kyc.api', async () => {
  const actual = await vi.importActual<typeof import('../api/stylemint-kyc.api')>(
    '../api/stylemint-kyc.api',
  );
  return {
    ...actual,
    stylemintKycApi: {
      queue: vi.fn(),
      get: vi.fn(),
      application: vi.fn(),
      documentLink: vi.fn(),
      assign: vi.fn(),
      decide: vi.fn(),
    },
  };
});

const queue = vi.mocked(stylemintKycApi.queue);
const application = vi.mocked(stylemintKycApi.application);
const documentLink = vi.mocked(stylemintKycApi.documentLink);
const assign = vi.mocked(stylemintKycApi.assign);
const decide = vi.mocked(stylemintKycApi.decide);

function renderPage(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}

function item(overrides: Partial<KycReviewItem> = {}): KycReviewItem {
  return {
    id: 'a1b2c3d4-0000-4000-8000-000000000003',
    applicantKind: 3,
    applicationId: 'a1b2c3d4-1111-4000-8000-000000000003',
    accountId: 'a1b2c3d4-2222-4000-8000-000000000003',
    state: 1,
    submittedUtc: '2026-10-08T04:00:00+00:00',
    dueByUtc: '2099-10-10T04:00:00+00:00',
    ...overrides,
  };
}

const vendorRow = item({
  id: 'v1b2c3d4-0000-4000-8000-000000000002',
  applicantKind: 2,
  accountId: 'v1b2c3d4-2222-4000-8000-000000000002',
});

function customerDetail(overrides: Partial<KycApplicationDetail> = {}): KycApplicationDetail {
  return {
    kycItemId: item().id,
    applicantKind: 3,
    applicationId: item().applicationId,
    accountId: item().accountId,
    displayName: 'Anita',
    fullName: 'Anita Shrestha',
    dateOfBirth: '1995-04-12',
    documentType: 'Citizenship',
    documentNumber: '12-01-75-01234',
    addressLine: 'Jhamsikhel Road 4',
    city: 'Lalitpur',
    countryCode: 'NP',
    submittedUtc: '2026-10-08T04:00:00+00:00',
    documents: [
      {
        id: 'doc-front',
        documentType: 'Citizenship',
        kind: 'CitizenshipFront',
        status: 'Uploaded',
        contentType: 'image/jpeg',
        contentSizeBytes: 210_000,
        uploadedUtc: '2026-10-08T03:50:00+00:00',
      },
      {
        id: 'doc-back',
        documentType: 'Citizenship',
        kind: 'CitizenshipBack',
        status: 'Uploaded',
        contentType: 'image/jpeg',
        contentSizeBytes: 190_000,
        uploadedUtc: '2026-10-08T03:51:00+00:00',
      },
      {
        id: 'doc-selfie',
        documentType: 'SelfiePhoto',
        kind: 'Selfie',
        status: 'Uploaded',
        contentType: 'image/jpeg',
        contentSizeBytes: 150_000,
        uploadedUtc: '2026-10-08T03:52:00+00:00',
      },
    ],
    previousAttempts: [
      {
        kycItemId: 'prev-1',
        submittedUtc: '2026-10-01T04:00:00+00:00',
        decidedUtc: '2026-10-02T04:00:00+00:00',
        decision: 2,
        decisionReasonCode: 'DOCS_UNCLEAR',
        decisionNote: 'The back of the citizenship was blurred.',
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  queue.mockResolvedValue({ items: [item(), vendorRow], totalCount: 2, pageNumber: 1, pageSize: 50 });
  application.mockResolvedValue(customerDetail());
  documentLink.mockImplementation(async (_kycItemId, documentId) => `https://r2.example/${documentId}.jpg`);
  assign.mockResolvedValue(item({ state: 2 }));
  decide.mockImplementation(async () => item({ state: 3, decision: 2 }));
});

describe('KycReviewPage — buyer identity checks', () => {
  it('labels each row with who is applying', async () => {
    renderPage(<KycReviewPage />);

    expect(await screen.findByText('Buyer identity check (EMI)')).toBeInTheDocument();
    expect(screen.getByText('Vendor application')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Vendor')).toBeInTheDocument();
  });

  it('reads the kind when the backend sends it as a name', async () => {
    queue.mockResolvedValue({
      items: [item({ applicantKind: 'Customer' })],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 50,
    });
    renderPage(<KycReviewPage />);

    expect(await screen.findByText('Buyer identity check (EMI)')).toBeInTheDocument();
  });

  it('filters by applicant type on the server, and again on the page', async () => {
    renderPage(<KycReviewPage />);
    await screen.findByText('Vendor application');

    fireEvent.change(screen.getByLabelText(/applicant/i), { target: { value: 'Customer' } });

    await waitFor(() =>
      expect(queue).toHaveBeenLastCalledWith(expect.objectContaining({ applicantKind: 'Customer' })),
    );
    // The mock ignores the filter, as a backend that had not learned it would.
    await waitFor(() => expect(screen.queryByText('Vendor application')).not.toBeInTheDocument());
    expect(screen.getByText('Buyer identity check (EMI)')).toBeInTheDocument();
  });

  it('shows who the buyer claims to be, with the ID number masked to its last four', async () => {
    renderPage(<KycReviewPage />);
    fireEvent.click(await screen.findByText('Buyer identity check (EMI)'));

    // In the panel heading and in the identity fields.
    expect(await screen.findAllByText('Anita Shrestha')).toHaveLength(2);
    expect(screen.getByText(/12 Apr 1995|Apr 12, 1995/)).toHaveTextContent(/\d+ years/);
    expect(screen.getByText('Citizenship certificate')).toBeInTheDocument();
    expect(screen.getByText('••-••-••-•1234')).toBeInTheDocument();
    expect(screen.queryByText(/12-01-75-01234/)).not.toBeInTheDocument();
    expect(screen.getByText(/Jhamsikhel Road 4, Lalitpur, NP/)).toBeInTheDocument();
  });

  it('lists the earlier rejected attempt and why it was rejected', async () => {
    renderPage(<KycReviewPage />);
    fireEvent.click(await screen.findByText('Buyer identity check (EMI)'));

    expect(await screen.findByText(/previous attempts \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Documents unclear or unreadable')).toBeInTheDocument();
    expect(screen.getByText('The back of the citizenship was blurred.')).toBeInTheDocument();
  });

  it('loads no image until the reviewer asks, then puts the ID beside the selfie', async () => {
    renderPage(<KycReviewPage />);
    fireEvent.click(await screen.findByText('Buyer identity check (EMI)'));
    await screen.findAllByText('Anita Shrestha');

    expect(documentLink).not.toHaveBeenCalled();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show side by side/i }));

    expect(await screen.findByRole('img', { name: 'Selfie' })).toHaveAttribute(
      'src',
      'https://r2.example/doc-selfie.jpg',
    );
    expect(screen.getByRole('img', { name: 'ID front' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ID back' })).toBeInTheDocument();
    expect(documentLink).toHaveBeenCalledTimes(3);
    expect(documentLink).toHaveBeenCalledWith(item().id, 'doc-selfie');
  });

  it('says which photo is missing instead of leaving a gap', async () => {
    application.mockResolvedValue(
      customerDetail({
        documents: customerDetail().documents.filter((document) => document.kind !== 'Selfie'),
      }),
    );
    renderPage(<KycReviewPage />);
    fireEvent.click(await screen.findByText('Buyer identity check (EMI)'));

    expect(await screen.findByText(/missing: selfie/i)).toBeInTheDocument();
  });

  it('flags a buyer under 18', async () => {
    application.mockResolvedValue(customerDetail({ dateOfBirth: '2015-01-01' }));
    renderPage(<KycReviewPage />);
    fireEvent.click(await screen.findByText('Buyer identity check (EMI)'));

    expect(await screen.findByText(/EMI needs 18 or over/i)).toBeInTheDocument();
  });

  it('will not reject without a reason, and sends the reason and the message to the buyer', async () => {
    renderPage(<KycReviewPage />);
    fireEvent.click(await screen.findByText('Buyer identity check (EMI)'));
    await screen.findAllByText('Anita Shrestha');

    fireEvent.click(screen.getByRole('button', { name: /reject — may reapply/i }));

    const confirm = screen.getByRole('button', { name: /yes, record it/i });
    expect(confirm).toBeDisabled();

    const reason = screen.getByLabelText(/reason/i);
    // Only codes the backend pairs with a retryable rejection, and none about product categories.
    const offered = within(reason).getAllByRole('option').map((option) => option.getAttribute('value'));
    expect(offered).toEqual(['', 'DOCS_UNCLEAR', 'DOCS_MISMATCH', 'POLICY_VIOLATION_RECOVERABLE']);

    fireEvent.change(reason, { target: { value: 'DOCS_UNCLEAR' } });
    fireEvent.change(screen.getByLabelText(/message to the buyer/i), {
      target: { value: 'Please retake the back of your citizenship.' },
    });
    expect(screen.getByText(/the buyer sees the reason and this message/i)).toBeInTheDocument();

    fireEvent.click(confirm);

    await waitFor(() =>
      expect(decide).toHaveBeenCalledWith(
        item().id,
        2,
        'DOCS_UNCLEAR',
        'Please retake the back of your citizenship.',
      ),
    );
    // Claimed on the way through: a Pending item cannot be decided.
    expect(assign).toHaveBeenCalledWith(item().id);
  });

  it('approves without asking for a reason', async () => {
    decide.mockResolvedValue(item({ state: 3, decision: 1 }));
    renderPage(<KycReviewPage />);
    fireEvent.click(await screen.findByText('Buyer identity check (EMI)'));
    await screen.findAllByText('Anita Shrestha');

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));
    expect(screen.queryByLabelText(/^reason/i)).not.toBeInTheDocument();
    expect(screen.getByText(/KYC Tier 2, which EMI requires/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /yes, record it/i }));

    await waitFor(() => expect(decide).toHaveBeenCalledWith(item().id, 1, '', ''));
  });
});
