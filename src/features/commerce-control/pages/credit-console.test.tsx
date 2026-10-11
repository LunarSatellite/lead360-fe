import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InstalmentState,
  stylemintCreditApi,
  type CreditAgreement,
  type CreditPortfolio,
  type ReserveSummary,
  type RiskAssessment,
  type UnappliedPayment,
} from '../api/stylemint-credit.api';
import { CreditConsolePage } from './CreditConsolePage';

/**
 * The fixtures below are the backend serializer's own output, captured by
 * CreditWireContractTests in lead360 (which pins these names), with only ids shortened where a
 * test reads them. If the console stops reading these, it has drifted from the server.
 */

vi.mock('../api/stylemint-credit.api', async () => {
  const actual = await vi.importActual<typeof import('../api/stylemint-credit.api')>(
    '../api/stylemint-credit.api',
  );
  return {
    ...actual,
    stylemintCreditApi: {
      portfolio: vi.fn(),
      agreements: vi.fn(),
      agreement: vi.fn(),
      assessment: vi.fn(),
      review: vi.fn(),
      reserve: vi.fn(),
      addCapital: vi.fn(),
      unappliedPayments: vi.fn(),
      refundHeldPayment: vi.fn(),
      refundQuote: vi.fn(),
      refunds: vi.fn(),
      refundPlan: vi.fn(),
      retryRefundPayment: vi.fn(),
      runAging: vi.fn(),
      waiveLateFee: vi.fn(),
    },
  };
});

vi.mock('@/shared/ui/confirm', () => ({ confirmDialog: vi.fn(async () => true) }));

const api = vi.mocked(stylemintCreditApi);

const referred: CreditAgreement = {
  id: 'f90a6410-3076-4791-84cf-fa5c77f25a4c',
  buyerAccountId: '1f67201b-7d81-4a60-93c2-b8869639dadb',
  vendorAccountId: 'de135640-cc06-4ce7-9c2a-5804ecb88092',
  productId: '11645bf9-cfca-4df2-88fa-7ebaec17d369',
  variantId: 'f0a10cdf-15d7-4402-8774-9ac69f7aa421',
  kind: 1,
  guarantor: 1,
  state: 1,
  stateReasons: ['manual_review_required'],
  currency: 'NPR',
  price: 60000,
  downPayment: 12000,
  financed: 48000,
  tenureMonths: 3,
  interestMethod: 0,
  totalInterest: 0,
  totalPayable: 60000,
  aprPercent: 0,
  outstanding: 48000,
  outstandingPrincipal: 48000,
  payoffAmountToday: null,
  daysPastDue: 0,
  delinquency: 0,
  appliedUtc: '2026-03-02T06:00:00+00:00',
  approvalExpiresUtc: null,
  activatedUtc: null,
  goodsReleasedUtc: null,
  closedUtc: null,
  needsActivationPayment: false,
  orderId: null,
  reversedUtc: null,
  priceReduced: 0,
  instalments: [1, 2, 3].map((number) => ({
    number,
    dueDate: null,
    scheduledAmount: 16000,
    principalDue: 16000,
    interestDue: 0,
    lateFeeDue: 0,
    paid: 0,
    outstanding: 16000,
    state: 1,
    paidUtc: null,
    credited: 0,
  })),
};

const assessment: RiskAssessment = {
  id: '93b86bc8-ffae-4b95-8082-21ac4be8f5fa',
  buyerAccountId: referred.buyerAccountId,
  kind: 1,
  guarantor: 1,
  price: 60000,
  financed: 48000,
  score: 740,
  band: 2,
  creditLimit: 150000,
  availableCredit: 150000,
  outcome: 2,
  reasons: ['manual_review_required'],
  factors:
    '[{"code":"kyc_verified","points":60},{"code":"phone_verified","points":20},{"code":"email_verified","points":10},{"code":"account_age","points":60},{"code":"completed_orders","points":50},{"code":"completed_value","points":40}]',
  signals:
    '{"kycTier":2,"phoneVerified":true,"emailVerified":true,"accountAgeDays":600,"duplicateIdentitySuspected":false,"completedOrders":20,"completedOrderValue":200000,"returnedOrCancelledOrders":0,"onTimeInstalments":0,"lateInstalments":0,"priorDefaults":0,"outstandingPrincipal":0,"activeAgreements":0,"applicationsLast24Hours":0,"lastDeclineUtc":null}',
  policyVersion: 'scorecard-2026-10-v1',
  assessedUtc: '2026-03-02T06:00:00+00:00',
};

const portfolio: CreditPortfolio = {
  asOf: '2026-03-02',
  slices: [
    { state: 1, kind: 1, guarantor: 1, count: 1, outstandingPrincipal: 48000 },
    { state: 3, kind: 1, guarantor: 1, count: 2, outstandingPrincipal: 64000 },
  ],
  delinquency: [
    { bucket: 0, guarantor: 1, count: 1, outstandingPrincipal: 32000 },
    { bucket: 1, guarantor: 1, count: 1, outstandingPrincipal: 32000 },
  ],
  unappliedPaymentCount: 1,
  unappliedPaymentAmount: 12000,
};

const reserve: ReserveSummary = {
  reserveBalance: 100000,
  guaranteedOutstanding: 0,
  coverageRatio: null,
  minimumCoverageRatio: 0.15,
  guaranteeHeadroom: 666666,
  writtenOffToDate: 0,
  riskFeePercent: 3,
  platformGuaranteeEnabled: false,
};

const held: UnappliedPayment = {
  attemptId: '8632b793-a7c6-4fa3-8749-ccc44a126ada',
  agreementId: referred.id,
  buyerAccountId: referred.buyerAccountId,
  purpose: 1,
  state: 4,
  amountRequested: 12000,
  currency: 'NPR',
  amountReceived: 11000,
  currencyReceived: 'NPR',
  paymentIntentId: '9fc0ae0b-ca4d-4c44-b111-37f1fb02e644',
  reason: 'amount 11000 does not match the 12000 requested',
  initiatedUtc: '2026-03-02T06:00:00+00:00',
  heldUtc: '2026-03-02T06:03:00+00:00',
  refundRequestedUtc: null,
  refundNote: null,
  refundId: null,
  providerRefundId: null,
  refundedUtc: null,
  lastRefundError: null,
  reversedUtc: null,
};

function renderAt(search = '') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/dashboard/stylemint/credit${search}`]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(<CreditConsolePage />, { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.portfolio.mockResolvedValue(portfolio);
  api.reserve.mockResolvedValue(reserve);
  api.agreements.mockResolvedValue([referred]);
  api.agreement.mockResolvedValue(referred);
  api.assessment.mockResolvedValue(assessment);
  api.unappliedPayments.mockResolvedValue([held]);
  api.refunds.mockResolvedValue([]);
});

describe('late fees', () => {
  it('shows the fee a plan was signed on, and waives a charged one only with a reason', async () => {
    const running: CreditAgreement = {
      ...referred,
      state: 3,
      stateReasons: [],
      lateFeeAmount: 250,
      lateFeeGraceDays: 5,
      instalments: referred.instalments.map((i) =>
        i.number === 1
          ? {
              ...i,
              dueDate: '2026-04-02',
              state: InstalmentState.Overdue,
              lateFeeDue: 250,
              outstanding: 16250,
            }
          : i,
      ),
    };
    api.agreement.mockResolvedValue(running);
    api.waiveLateFee.mockResolvedValue({ ...running, lateFeeAmount: 250 });
    renderAt(`?agreement=${running.id}`);

    expect(await screen.findByText(/250.00 after 5 days late/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Waive fee' }));
    const confirm = screen.getByRole('button', { name: /Waive .*250/ });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Why waive the late fee on payment 1'), {
      target: { value: 'Salary delayed by the strike' },
    });
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(api.waiveLateFee).toHaveBeenCalledWith(running.id, 1, 'Salary delayed by the strike'),
    );
  });
});

describe('the credit console', () => {
  it('leads with what is owed, what is late, the reserve and money held', async () => {
    renderAt();

    // Owed is the running credit only: the referral's 48,000 would be lent, not owed.
    expect(await screen.findByText(/64,000/)).toBeInTheDocument();
    expect(screen.getByText(/1 plan · 50\.0% of owed/)).toBeInTheDocument();
    expect(screen.getByText(/100,000/)).toBeInTheDocument();
    expect(screen.getByText('1 to return to buyers')).toBeInTheDocument();
    expect(screen.getByText(/1 plan is waiting for a decision/)).toBeInTheDocument();
  });

  it('shows the risk decision behind an agreement as it was recorded', async () => {
    renderAt(`?agreement=${referred.id}`);

    expect(await screen.findByText('740 · band B')).toBeInTheDocument();
    expect(screen.getByText('Referred for a decision')).toBeInTheDocument();
    expect(screen.getByText('Identity verified')).toBeInTheDocument();
    // Identity verified and account age both moved it by 60.
    expect(screen.getAllByText('+60', { selector: 'span' })).toHaveLength(2);
    expect(screen.getByText('scorecard-2026-10-v1')).toBeInTheDocument();
    expect(screen.getAllByText("Seller's terms ask to review every request").length).toBeGreaterThan(0);
  });

  it('says whether an approved plan has been checked out, and names its order', async () => {
    api.agreement.mockResolvedValue({ ...referred, state: 2, stateReasons: [] });
    const first = renderAt(`?agreement=${referred.id}`);
    expect(await screen.findByText('Not checked out yet')).toBeInTheDocument();
    first.unmount();

    const orderId = '7a1e3f52-9a0b-4c55-8d1e-2b6f0c9e4d11';
    api.agreement.mockResolvedValue({ ...referred, state: 2, stateReasons: [], orderId });
    renderAt(`?agreement=${referred.id}`);
    expect(await screen.findByText(orderId)).toBeInTheDocument();
    expect(screen.queryByText('Not checked out yet')).not.toBeInTheDocument();
  });

  it('warns before deciding a plan the seller carries, and needs a reason to decline', async () => {
    api.review.mockResolvedValue({ ...referred, state: 6, stateReasons: ['insufficient_history'] });
    renderAt(`?agreement=${referred.id}`);

    expect(await screen.findByText(/commits the seller's money/)).toBeInTheDocument();
    const decline = screen.getByRole('button', { name: /Decline/ });
    expect(decline).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Not enough purchase history'));
    fireEvent.click(decline);

    await waitFor(() => expect(api.review).toHaveBeenCalledTimes(1));
    const [id, decision, key] = api.review.mock.calls[0];
    expect(id).toBe(referred.id);
    expect(decision).toEqual({ approve: false, reasons: ['insufficient_history'] });
    expect(key).toMatch(/[0-9a-f-]{36}/);
  });

  it('retries a failed decision with the same idempotency key', async () => {
    api.review
      .mockRejectedValueOnce(new Error('Gateway timeout'))
      .mockResolvedValueOnce({ ...referred, state: 2 });
    renderAt(`?agreement=${referred.id}`);

    const approve = await screen.findByRole('button', { name: /Approve/ });
    fireEvent.click(approve);
    expect(await screen.findByText('Gateway timeout')).toBeInTheDocument();
    fireEvent.click(approve);

    await waitFor(() => expect(api.review).toHaveBeenCalledTimes(2));
    expect(api.review.mock.calls[0][2]).toBe(api.review.mock.calls[1][2]);
  });

  it('records reserve capital once per movement, confirmed first', async () => {
    api.addCapital
      .mockRejectedValueOnce(new Error('Gateway timeout'))
      .mockResolvedValueOnce({ ...reserve, reserveBalance: 150000 });
    renderAt('?tab=reserve');

    expect(await screen.findByText(/guarantee is switched off/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('100000'), { target: { value: '50000' } });
    const record = screen.getByRole('button', { name: /Record capital/ });
    fireEvent.click(record);
    expect(await screen.findByText('Gateway timeout')).toBeInTheDocument();
    fireEvent.click(record);

    expect(await screen.findByText(/The reserve now holds/)).toBeInTheDocument();
    expect(api.addCapital).toHaveBeenCalledTimes(2);
    expect(api.addCapital.mock.calls[0]).toEqual([50000, api.addCapital.mock.calls[1][1]]);
  });

  it('lists held payments with what arrived, what was asked, and the intent', async () => {
    renderAt('?tab=held');

    const table = await screen.findByRole('table');
    expect(within(table).getByText(held.reason)).toBeInTheDocument();
    expect(within(table).getByText(held.paymentIntentId!)).toBeInTheDocument();
    expect(within(table).getByText(/11,000/)).toBeInTheDocument();
    expect(within(table).getByText(/asked .*12,000/)).toBeInTheDocument();
  });

  it('refunds what arrived after confirming, and shows it returned', async () => {
    api.refundHeldPayment.mockResolvedValue({ ...held, state: 6 });
    renderAt('?tab=held');

    fireEvent.click(await screen.findByRole('button', { name: /Refund/ }));

    await waitFor(() => expect(api.refundHeldPayment).toHaveBeenCalledTimes(1));
    const [attemptId, note, key] = api.refundHeldPayment.mock.calls[0];
    expect(attemptId).toBe(held.attemptId);
    expect(note).toBe('');
    expect(key).toMatch(/[0-9a-f-]{36}/);
    const { confirmDialog } = await import('@/shared/ui/confirm');
    expect(vi.mocked(confirmDialog).mock.calls[0][0].message).toContain('11,000');
  });

  it('a refused refund says why and can be tried again as a new refund', async () => {
    api.refundHeldPayment
      .mockRejectedValueOnce(new Error('eSewa rejected the refund.'))
      .mockResolvedValueOnce({ ...held, state: 6 });
    renderAt('?tab=held');

    const button = await screen.findByRole('button', { name: /Refund/ });
    fireEvent.click(button);
    expect(await screen.findByText('eSewa rejected the refund.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Refund/ }));

    await waitFor(() => expect(api.refundHeldPayment).toHaveBeenCalledTimes(2));
    expect(api.refundHeldPayment.mock.calls[0][2]).not.toBe(api.refundHeldPayment.mock.calls[1][2]);
  });

  it('shows a refund under way and one already returned without offering to refund again', async () => {
    api.unappliedPayments.mockResolvedValue([
      { ...held, attemptId: 'a-requested', state: 5, refundRequestedUtc: '2026-03-02T07:00:00+00:00' },
      {
        ...held,
        attemptId: 'a-refunded',
        state: 6,
        refundedUtc: '2026-03-02T07:01:00+00:00',
        providerRefundId: 'PSP-R-1',
      },
    ]);
    renderAt('?tab=held');

    expect(await screen.findByText('Refund under way')).toBeInTheDocument();
    expect(screen.getByText('PSP-R-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Refund$/ })).not.toBeInTheDocument();
  });

  it('marks money owed back from a reversed plan, and when it became owed', async () => {
    api.unappliedPayments.mockResolvedValue([
      {
        ...held,
        state: 7,
        amountReceived: 12000,
        reason: 'The plan was reversed: its order was cancelled.',
        reversedUtc: '2026-03-20T09:00:00+00:00',
        lastRefundError: 'eSewa rejected the refund.',
      },
    ]);
    renderAt('?tab=held');

    expect(await screen.findByText('plan reversed')).toBeInTheDocument();
    expect(screen.getByText('The plan was reversed: its order was cancelled.')).toBeInTheDocument();
    expect(screen.getByText(/Last refund: eSewa rejected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refund/ })).toBeEnabled();
  });

  it("lists a plan's partial refunds and retries a part the provider refused", async () => {
    api.agreement.mockResolvedValue({ ...referred, state: 4, stateReasons: [], priceReduced: 5000 });
    api.refunds.mockResolvedValue([
      {
        id: 'r1',
        agreementId: referred.id,
        amount: 5000,
        credited: 0,
        cash: 5000,
        vendorClawback: 5000,
        currency: 'NPR',
        reason: 'Arrived scratched',
        requestedById: 'admin',
        requestedUtc: '2026-03-20T09:00:00+00:00',
        payments: [
          {
            id: 'p1',
            attemptId: 'a1',
            paymentIntentId: '9fc0ae0b-ca4d-4c44-b111-37f1fb02e644',
            amount: 5000,
            currency: 'NPR',
            state: 4,
            requestedUtc: '2026-03-20T09:00:00+00:00',
            completedUtc: null,
            providerRefundId: null,
            lastError: 'eSewa rejected the refund.',
            supersededUtc: null,
          },
        ],
      },
    ]);
    api.retryRefundPayment.mockResolvedValue({} as never);
    renderAt(`?agreement=${referred.id}`);

    expect(await screen.findByText('Arrived scratched')).toBeInTheDocument();
    expect(screen.getByText('eSewa rejected the refund.')).toBeInTheDocument();
    expect(screen.getByText('Did not go through')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
    await waitFor(() => expect(api.retryRefundPayment).toHaveBeenCalledWith('p1', expect.any(String)));
  });

  it('says a reversed plan was refunded, and why', async () => {
    api.agreement.mockResolvedValue({
      ...referred,
      state: 9,
      stateReasons: ['order_returned'],
      reversedUtc: '2026-03-20T09:00:00+00:00',
    });
    renderAt(`?agreement=${referred.id}`);

    // The state filter offers the label too, so wait for the panel's own explanation.
    expect(
      await screen.findByText(/The item was returned; every payment is being refunded/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Reversed — refunded').length).toBeGreaterThan(1);
  });

  it('shows why the last refund failed on a payment held again', async () => {
    api.unappliedPayments.mockResolvedValue([
      { ...held, lastRefundError: 'The refund could not be confirmed. Check the payment at the provider.' },
    ]);
    renderAt('?tab=held');

    expect(await screen.findByText(/Last refund: The refund could not be confirmed/)).toBeInTheDocument();
  });

  it('shows delinquency by guarantor from the database sums', async () => {
    renderAt('?tab=book');

    // The first table is delinquency; the second is the book by state.
    const [table] = await screen.findAllByRole('table');
    expect(within(table).getByText('1–30 days late')).toBeInTheDocument();
    expect(within(table).getAllByText(/1 · .*32,000/).length).toBe(2);
  });

  it('says which role is missing rather than failing silently', async () => {
    api.portfolio.mockRejectedValue(
      new Error(
        'Your operator account needs the Stylemint SuperAdmin, PayoutsOps or Readonly role for this.',
      ),
    );
    renderAt();

    expect(
      await screen.findByText(/needs the Stylemint SuperAdmin, PayoutsOps or Readonly role/),
    ).toBeInTheDocument();
  });
});
