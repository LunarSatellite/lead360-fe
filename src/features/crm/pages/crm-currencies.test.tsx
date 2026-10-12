import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { CrmCurrencyDto } from '../types/crm-currency.types';

const getCurrencies = vi.fn();
const create = vi.fn();
const remove = vi.fn();
const setBase = vi.fn();
const setRate = vi.fn();

vi.mock('../api/crm-currency.api', () => ({
  crmCurrencyApi: {
    getCurrencies: (...a: unknown[]) => getCurrencies(...a),
    create: (...a: unknown[]) => create(...a),
    remove: (...a: unknown[]) => remove(...a),
    setBase: (...a: unknown[]) => setBase(...a),
    setRate: (...a: unknown[]) => setRate(...a),
  },
}));

vi.mock('@/features/auth/api/auth.queries', () => ({
  useProfile: () => ({ data: { role: 1 } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const currency = (over: Partial<CrmCurrencyDto> = {}): CrmCurrencyDto => ({
  id: 'cur-1',
  code: 'EUR',
  name: 'Euro',
  symbol: '€',
  decimalPlaces: 2,
  isBaseCurrency: false,
  isActive: true,
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
  const { Component } = await import('./CrmCurrenciesPage');
  render(
    <Providers>
      <Component />
    </Providers>
  );
  await waitFor(() => expect(getCurrencies).toHaveBeenCalled());
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrencies.mockResolvedValue({
    items: [currency({ id: 'base', code: 'NPR', name: 'Nepalese rupee', isBaseCurrency: true }), currency()],
    totalCount: 2,
  });
  create.mockResolvedValue(currency());
  setBase.mockResolvedValue(undefined);
  setRate.mockResolvedValue(undefined);
  remove.mockResolvedValue(undefined);
});

describe('currencies', () => {
  it('marks the base and offers no rate against itself', async () => {
    await renderPage();

    expect(await screen.findByText('Base')).toBeTruthy();
    // A base currency has no rate to itself, and cannot be "made base" again.
    expect(screen.queryByLabelText(/rate for npr/i)).toBeNull();
    expect(screen.getAllByRole('button', { name: /make base/i })).toHaveLength(1);
  });

  it('refuses to delete the base, because every rate hangs off it', async () => {
    await renderPage();

    const removeBase = await screen.findByRole('button', { name: /remove npr/i });
    expect((removeBase as HTMLButtonElement).disabled).toBe(true);
    const removeOther = screen.getByRole('button', { name: /remove eur/i });
    expect((removeOther as HTMLButtonElement).disabled).toBe(false);
  });

  it('warns when nothing is the base, since conversion has no footing', async () => {
    getCurrencies.mockResolvedValue({ items: [currency()], totalCount: 1 });
    await renderPage();

    const warn = await screen.findByTestId('currency-no-base-warning');
    expect(warn.textContent).toMatch(/no base currency/i);
  });

  it('saves a rate for a non-base currency', async () => {
    await renderPage();

    fireEvent.change(await screen.findByLabelText(/rate for eur/i), {
      target: { value: '0.0068' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save rate/i }));

    await waitFor(() =>
      expect(setRate).toHaveBeenCalledWith({ currencyId: 'cur-1', rate: 0.0068 })
    );
  });

  it('will not save a rate of zero or less', async () => {
    await renderPage();

    fireEvent.change(await screen.findByLabelText(/rate for eur/i), {
      target: { value: '0' },
    });
    const save = screen.getByRole('button', { name: /save rate/i });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    expect(setRate).not.toHaveBeenCalled();
  });

  it('upper-cases the code so eur and EUR are not two currencies', async () => {
    getCurrencies.mockResolvedValue({ items: [], totalCount: 0 });
    await renderPage();

    fireEvent.change(screen.getByLabelText(/currency code/i), {
      target: { value: 'gbp' },
    });
    fireEvent.change(screen.getByLabelText(/currency name/i), {
      target: { value: 'Pound sterling' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'GBP', name: 'Pound sterling' })
      )
    );
  });

  it('moves the base currency', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /make base/i }));
    await waitFor(() => expect(setBase).toHaveBeenCalledWith('cur-1'));
  });

  it('keeps the page away from non-admins', async () => {
    vi.resetModules();
    vi.doMock('@/features/auth/api/auth.queries', () => ({
      useProfile: () => ({ data: { role: 3 } }),
    }));
    const { Component } = await import('./CrmCurrenciesPage');
    render(
      <Providers>
        <Component />
      </Providers>
    );
    expect(screen.getByText(/restricted/i)).toBeTruthy();
    vi.doUnmock('@/features/auth/api/auth.queries');
  });
});
