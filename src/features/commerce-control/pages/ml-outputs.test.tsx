import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { stylemintMlOutputsApi } from '../api/stylemint-ml-outputs.api';
import { OrderRiskReviewPage } from './OrderRiskReviewPage';
import { VendorMlInsightsPage } from './VendorMlInsightsPage';

vi.mock('../api/stylemint-ml-outputs.api', async () => {
  const actual = await vi.importActual<typeof import('../api/stylemint-ml-outputs.api')>(
    '../api/stylemint-ml-outputs.api',
  );
  return {
    ...actual,
    stylemintMlOutputsApi: { orderRiskReviewQueue: vi.fn(), demandGaps: vi.fn(), audienceSegments: vi.fn() },
  };
});

const api = vi.mocked(stylemintMlOutputsApi);

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.resetAllMocks());

describe('OrderRiskReviewPage', () => {
  it('shows the recommendations-only banner, human reason labels and an order link', async () => {
    // Shape of OrderRiskReviewPage as serialized by ASP.NET (camelCase).
    api.orderRiskReviewQueue.mockResolvedValue({
      items: [
        {
          orderId: 'SM-1001',
          ruleScore: 0.82,
          anomalyScore: null,
          reasons: ['new_account_high_value', 'cod_above_history', 'something_new'],
          modelVersion: 'order_risk-2026.10.27',
          asOf: '2026-10-27T00:00:00Z',
        },
      ],
      total: 1,
      skip: 0,
      take: 25,
    });

    wrap(<OrderRiskReviewPage />);

    expect(screen.getByText('Recommendations only — no order is blocked or changed automatically.')).toBeInTheDocument();
    expect(await screen.findByText('New account, high order value')).toBeInTheDocument();
    expect(screen.getByText('Cash on delivery above usual amount')).toBeInTheDocument();
    expect(screen.getByText('something new')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'SM-1001' })).toHaveAttribute(
      'href',
      '/dashboard/stylemint/orders?q=SM-1001',
    );
    expect(screen.getByText('0.82')).toBeInTheDocument();
    expect(api.orderRiskReviewQueue).toHaveBeenCalledWith(0, 25);
    // Read only: no action buttons beyond pagination.
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Previous page',
      'Next page',
    ]);
  });
});

describe('VendorMlInsightsPage', () => {
  it('explains empty states', async () => {
    api.demandGaps.mockResolvedValue([]);
    api.audienceSegments.mockResolvedValue([]);
    wrap(<VendorMlInsightsPage />);
    expect(await screen.findByText(/No demand gaps yet/)).toBeInTheDocument();
    expect(await screen.findByText(/No audience segments yet/)).toBeInTheDocument();
  });

  it('renders gaps and segment summaries', async () => {
    api.demandGaps.mockResolvedValue([
      { region: 'Kinshasa', category: 'dresses', score: 0.734, evidence: '120 searches, 3 listings', supply: 3, modelVersion: 'v1', asOf: '2026-10-27T00:00:00Z' },
    ]);
    api.audienceSegments.mockResolvedValue([
      { segment: 'budget_streetwear', size: 240, profile: { median_price: 25, top_categories: ['sneakers', 'tees'] }, modelVersion: 'v1', asOf: '2026-10-27T00:00:00Z' },
    ]);
    wrap(<VendorMlInsightsPage />);
    expect(await screen.findByText('Kinshasa')).toBeInTheDocument();
    expect(screen.getByText('0.73')).toBeInTheDocument();
    expect(screen.getByText('120 searches, 3 listings')).toBeInTheDocument();
    expect(await screen.findByText('budget_streetwear')).toBeInTheDocument();
    expect(screen.getByText('240 shoppers')).toBeInTheDocument();
    expect(screen.getByText('top categories: sneakers, tees')).toBeInTheDocument();
  });
});
