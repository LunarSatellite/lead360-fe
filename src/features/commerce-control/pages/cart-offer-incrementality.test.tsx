import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { stylemintCartOffersApi } from '../api/stylemint-cart-offers.api';
import type { CartOfferIncrementalityReadout } from '../api/stylemint-cart-offers.api';
import { CartOfferIncrementalityPage } from './CartOfferIncrementalityPage';

/**
 * The readout is a measurement claim, so these tests are about what the page
 * refuses to say. An absent arm must never read as a zero; a difference must
 * never appear without the interval around it; and when the server declines to
 * compare, the page has to say so rather than leaving a hole a reader fills in.
 */

vi.mock('../api/stylemint-cart-offers.api', async () => {
  const actual = await vi.importActual<typeof import('../api/stylemint-cart-offers.api')>(
    '../api/stylemint-cart-offers.api',
  );
  return { ...actual, stylemintCartOffersApi: { incrementality: vi.fn() } };
});

const incrementality = vi.mocked(stylemintCartOffersApi.incrementality);

function renderPage(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}

function readout(overrides: Partial<CartOfferIncrementalityReadout> = {}) {
  return {
    windowFromUtc: '2026-08-20T00:00:00+00:00',
    windowToUtc: '2026-09-19T00:00:00+00:00',
    conversionHorizonHours: 72,
    minimumObservationsPerArm: 30,
    arms: [
      {
        armCode: 'holdout_control',
        armLabel: 'Holdout control — offers withheld',
        hasObservations: true,
        observations: 1000,
        conversions: 100,
        conversionPercent: 10,
        meetsMinimumObservations: true,
      },
      {
        armCode: 'offers_eligible',
        armLabel: 'Offer-eligible — outside the holdout',
        hasObservations: true,
        observations: 1000,
        conversions: 140,
        conversionPercent: 14,
        meetsMinimumObservations: true,
      },
    ],
    uplift: {
      basis: 'Conversion percentage of the offer-eligible arm minus that of the holdout control.',
      method: 'Wald interval on the difference of two proportions.',
      intervalCoveragePercent: 95,
      pointEstimatePercentagePoints: 4,
      lowerBoundPercentagePoints: 1.16,
      upperBoundPercentagePoints: 6.84,
      intervalSpansZero: false,
    },
    statement: 'Difference +4 percentage points, 95% interval +1.16 to +6.84.',
    caveats: ['This is a readout. It does not change any offer, price or stock level.'],
    ...overrides,
  } satisfies CartOfferIncrementalityReadout;
}

describe('cart offer incrementality readout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the difference only alongside its interval', async () => {
    incrementality.mockResolvedValue(readout());
    renderPage(<CartOfferIncrementalityPage />);

    const uplift = await screen.findByTestId('uplift');
    expect(uplift).toHaveTextContent('+4.00 pp');
    // The bounds travel with it, always, in the same sentence.
    expect(uplift).toHaveTextContent('+1.16 pp');
    expect(uplift).toHaveTextContent('+6.84 pp');
    expect(uplift).toHaveTextContent('95% interval');
  });

  it('says the interval includes zero when it does', async () => {
    incrementality.mockResolvedValue(
      readout({
        uplift: {
          ...readout().uplift!,
          pointEstimatePercentagePoints: 0.4,
          lowerBoundPercentagePoints: -2.1,
          upperBoundPercentagePoints: 2.9,
          intervalSpansZero: true,
        },
      }),
    );
    renderPage(<CartOfferIncrementalityPage />);

    expect(await screen.findByTestId('uplift')).toHaveTextContent(
      'consistent with the offers having made no difference',
    );
  });

  it('renders an unobserved arm as not recorded, never as a zero', async () => {
    incrementality.mockResolvedValue(
      readout({
        arms: [
          {
            armCode: 'holdout_control',
            armLabel: 'Holdout control — offers withheld',
            hasObservations: false,
            observations: 0,
            conversions: null,
            conversionPercent: null,
            meetsMinimumObservations: false,
          },
          readout().arms[1],
        ],
        uplift: null,
        statement: 'Nothing was recorded for the holdout control arm in this window.',
      }),
    );
    renderPage(<CartOfferIncrementalityPage />);

    const control = await screen.findByTestId('arm-holdout_control');
    expect(control).toHaveTextContent('Not recorded');
    expect(control).toHaveTextContent('absence of measurement, not a zero');
    expect(control.textContent).not.toMatch(/\b0(\.00)?%/);
  });

  it('renders a measured zero as a zero — an observed none is a result', async () => {
    incrementality.mockResolvedValue(
      readout({
        arms: [
          {
            armCode: 'holdout_control',
            armLabel: 'Holdout control — offers withheld',
            hasObservations: true,
            observations: 64,
            conversions: 0,
            conversionPercent: 0,
            meetsMinimumObservations: true,
          },
          readout().arms[1],
        ],
        uplift: null,
      }),
    );
    renderPage(<CartOfferIncrementalityPage />);

    const control = await screen.findByTestId('arm-holdout_control');
    expect(control).toHaveTextContent('0.00%');
    expect(control).toHaveTextContent('0 of 64 observations converted');
    expect(control).not.toHaveTextContent('Not recorded');
  });

  it('states that no comparison was made instead of leaving a hole', async () => {
    incrementality.mockResolvedValue(
      readout({
        uplift: null,
        statement: 'Fewer than 30 recorded observations in at least one arm.',
      }),
    );
    renderPage(<CartOfferIncrementalityPage />);

    const panel = await screen.findByTestId('no-comparison');
    expect(panel).toHaveTextContent('No difference is stated');
    expect(panel).toHaveTextContent('30 recorded observations');
    expect(screen.queryByTestId('uplift')).not.toBeInTheDocument();
  });

  it('flags an arm below the minimum rather than comparing it', async () => {
    incrementality.mockResolvedValue(
      readout({
        arms: [
          {
            armCode: 'holdout_control',
            armLabel: 'Holdout control — offers withheld',
            hasObservations: true,
            observations: 9,
            conversions: 2,
            conversionPercent: 22.22,
            meetsMinimumObservations: false,
          },
          readout().arms[1],
        ],
        uplift: null,
      }),
    );
    renderPage(<CartOfferIncrementalityPage />);

    expect(await screen.findByTestId('arm-holdout_control')).toHaveTextContent(
      'Below the 30-observation minimum — counted, not compared',
    );
  });

  it('prints the server statement verbatim rather than a rewording', async () => {
    const data = readout();
    incrementality.mockResolvedValue(data);
    renderPage(<CartOfferIncrementalityPage />);

    expect(await screen.findByTestId('statement')).toHaveTextContent(data.statement);
  });

  it('reads the holdout and nothing else — the page issues no write', async () => {
    incrementality.mockResolvedValue(readout());
    renderPage(<CartOfferIncrementalityPage />);
    await screen.findByTestId('uplift');

    // §5.9: a readout reads. The client exposes exactly one call, a GET.
    expect(Object.keys(stylemintCartOffersApi)).toEqual(['incrementality']);
  });
});
