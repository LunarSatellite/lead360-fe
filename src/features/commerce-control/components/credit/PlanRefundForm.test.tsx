import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stylemintCreditApi, type CreditRefundQuote } from '../../api/stylemint-credit.api';
import { PlanRefundForm } from './PlanRefundForm';

vi.mock('../../api/stylemint-credit.api', async () => {
  const actual = await vi.importActual<typeof import('../../api/stylemint-credit.api')>('../../api/stylemint-credit.api');
  return { ...actual, stylemintCreditApi: { refundQuote: vi.fn(), refundPlan: vi.fn() } };
});

const api = vi.mocked(stylemintCreditApi);
const PLAN = 'f90a6410-3076-4791-84cf-fa5c77f25a4c';

const quoteFor = (amount: number): CreditRefundQuote => ({
  agreementId: PLAN,
  currency: 'NPR',
  amount,
  maxAmount: 60000,
  credited: Math.min(amount, 32000),
  cash: Math.max(0, amount - 32000),
  vendorClawback: Math.max(0, amount - 32000),
  priceReduced: 0,
  payments: amount > 32000 ? [{ attemptId: 'a1', paymentIntentId: 'i1', amount: amount - 32000, paidUtc: null }] : [],
});

function renderForm(onDone = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  render(<PlanRefundForm agreementId={PLAN} orderNumber="NK2026-00042" onDone={onDone} />, { wrapper });
  return onDone;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.refundQuote.mockImplementation(async (_id: string, amount: number) => quoteFor(amount));
  api.refundPlan.mockResolvedValue({} as never);
});

describe('refunding part of a plan order', () => {
  it('quotes what the refund does before it can be made, then makes exactly that', async () => {
    const onDone = renderForm();

    expect(await screen.findByText(/up to/)).toHaveTextContent('60,000');
    fireEvent.change(screen.getByLabelText('Amount to refund'), { target: { value: '40000' } });
    fireEvent.change(screen.getByLabelText('Why'), { target: { value: 'Arrived scratched' } });

    const breakdown = await screen.findByLabelText('What this refund does');
    expect(breakdown).toHaveTextContent('32,000');
    expect(breakdown).toHaveTextContent('8,000');
    const submit = screen.getByRole('button', { name: /Refund part of the price/ });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(submit);

    await waitFor(() => expect(api.refundPlan).toHaveBeenCalledWith(PLAN, 40000, 'Arrived scratched', expect.any(String)));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('will not offer more than can be refunded', async () => {
    renderForm();
    await screen.findByText(/up to/);

    fireEvent.change(screen.getByLabelText('Amount to refund'), { target: { value: '60001' } });

    expect(screen.getByText(/At most/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refund part of the price/ })).toBeDisabled();
    expect(api.refundQuote).not.toHaveBeenCalledWith(PLAN, 60001);
  });
});
