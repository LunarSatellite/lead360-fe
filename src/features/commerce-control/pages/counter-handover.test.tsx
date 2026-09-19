import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { stylemintFulfillmentApi } from '../api/stylemint-fulfillment.api';
import type { VendorSubOrderRow } from '../api/stylemint-fulfillment.api';
import { CounterHandoverPage } from './CounterHandoverPage';

/**
 * Recording a counter handover completes an order, opens a return window and
 * releases money. These tests are about what the screen has to SAY before and
 * after it does that, and about the two things it must never make up: a place
 * on an order that has no address, and a counter on an order that named none.
 */

vi.mock('../api/stylemint-fulfillment.api', async () => {
  const actual = await vi.importActual<typeof import('../api/stylemint-fulfillment.api')>(
    '../api/stylemint-fulfillment.api',
  );
  return {
    ...actual,
    stylemintFulfillmentApi: { subOrders: vi.fn(), subOrder: vi.fn(), markCollected: vi.fn() },
  };
});

const subOrders = vi.mocked(stylemintFulfillmentApi.subOrders);
const subOrder = vi.mocked(stylemintFulfillmentApi.subOrder);
const markCollected = vi.mocked(stylemintFulfillmentApi.markCollected);

function renderPage(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}

function row(overrides: Partial<VendorSubOrderRow> = {}): VendorSubOrderRow {
  return {
    id: '7e6a1d3b-1111-4c1f-9d4a-2b3c4d5e6f70',
    orderId: '7e6a1d3b-2222-4c1f-9d4a-2b3c4d5e6f70',
    orderNumber: 'SM-100234',
    vendorAccountId: '7e6a1d3b-3333-4c1f-9d4a-2b3c4d5e6f70',
    receiverName: 'Anita Shrestha',
    state: 12,
    shippingFeeAmount: 0,
    shippingFeeCurrency: 'NPR',
    subtotalAmount: 4200,
    subtotalCurrency: 'NPR',
    itemCount: 2,
    placedUtc: '2026-09-18T04:00:00+00:00',
    fulfillmentChannel: 2,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  markCollected.mockResolvedValue({ kind: 'completed', collectedUtc: null });
});

describe('CounterHandoverPage', () => {
  it('names the consequences in the confirmation instead of asking "are you sure?"', async () => {
    subOrders.mockResolvedValue({ items: [row()], nextCursor: null });
    renderPage(<CounterHandoverPage />);

    fireEvent.click(await screen.findByText('SM-100234'));
    fireEvent.click(await screen.findByRole('button', { name: /record counter handover/i }));

    const dialog = await screen.findByText(/record the counter handover for SM-100234/i);
    expect(dialog).toBeInTheDocument();

    expect(screen.getAllByText(/completes the order/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/return window/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/releases the seller's earnings/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cannot be undone/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('renders an absent counter as absent — never "Store", never the seller', async () => {
    subOrders.mockResolvedValue({
      items: [row({ fulfillmentLocationId: null })],
      nextCursor: null,
    });
    renderPage(<CounterHandoverPage />);

    fireEvent.click(await screen.findByText('SM-100234'));

    expect(await screen.findByText(/names no collection point/i)).toBeInTheDocument();
    // The seller's own name and a generic placeholder must not stand in for it.
    expect(screen.queryByText(/^Store$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Anita Shrestha's store/i)).not.toBeInTheDocument();
  });

  it('never formats an empty collection snapshot into a destination', async () => {
    subOrders.mockResolvedValue({ items: [row()], nextCursor: null });
    renderPage(<CounterHandoverPage />);

    fireEvent.click(await screen.findByText('SM-100234'));

    expect(await screen.findByText(/no delivery address/i)).toBeInTheDocument();
    // The bug both mobile clients shipped: an empty snapshot bottoming out as a place.
    expect(screen.queryByText(/location saved/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^NP$/)).not.toBeInTheDocument();
  });

  it('shows the refusal on a delivery sub-order rather than hiding the control', async () => {
    subOrders.mockResolvedValue({ items: [], nextCursor: null });
    subOrder.mockResolvedValue(row({ fulfillmentChannel: 1 }));
    renderPage(<CounterHandoverPage />);

    // A delivery sub-order never appears in the collection queue, which is
    // exactly how a control goes missing without explanation. The lookup is the
    // way an operator asks about one, and it has to answer.
    fireEvent.change(await screen.findByLabelText(/look up a sub-order/i), {
      target: { value: row().id },
    });
    fireEvent.click(screen.getByRole('button', { name: /open/i }));

    await waitFor(() => expect(subOrder).toHaveBeenCalledWith(row().id));

    const refusal = await screen.findByText(/this is a delivery sub-order/i);
    expect(refusal).toBeInTheDocument();
    expect(refusal.textContent).toMatch(/refused/i);
    expect(refusal.textContent).toMatch(/courier/i);

    // The action is not offered, and the reason is on screen instead.
    expect(screen.queryByRole('button', { name: /record counter handover/i })).toBeNull();
  });

  it('surfaces a backend refusal as text instead of swallowing it', async () => {
    subOrders.mockResolvedValue({ items: [row()], nextCursor: null });
    markCollected.mockResolvedValue({
      kind: 'refused',
      message: 'Only a collection sub-order can be handed over at a counter.',
    });
    renderPage(<CounterHandoverPage />);

    fireEvent.click(await screen.findByText('SM-100234'));
    fireEvent.click(await screen.findByRole('button', { name: /record counter handover/i }));
    fireEvent.click(await screen.findByRole('button', { name: /complete the order/i }));

    expect(
      await screen.findByText(/only a collection sub-order can be handed over at a counter/i),
    ).toBeInTheDocument();
  });

  it('confirms the completion without inventing a time the backend did not record', async () => {
    subOrders.mockResolvedValue({ items: [row()], nextCursor: null });
    markCollected.mockResolvedValue({ kind: 'completed', collectedUtc: null });
    renderPage(<CounterHandoverPage />);

    fireEvent.click(await screen.findByText('SM-100234'));
    fireEvent.click(await screen.findByRole('button', { name: /record counter handover/i }));
    fireEvent.click(await screen.findByRole('button', { name: /complete the order/i }));

    await waitFor(() => expect(markCollected).toHaveBeenCalledWith(row().id));
    expect(await screen.findByText(/handover recorded\./i)).toBeInTheDocument();
  });

  it('records nothing until the operator confirms', async () => {
    subOrders.mockResolvedValue({ items: [row()], nextCursor: null });
    renderPage(<CounterHandoverPage />);

    fireEvent.click(await screen.findByText('SM-100234'));
    fireEvent.click(await screen.findByRole('button', { name: /record counter handover/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^cancel$/i }));

    expect(markCollected).not.toHaveBeenCalled();
  });
});
