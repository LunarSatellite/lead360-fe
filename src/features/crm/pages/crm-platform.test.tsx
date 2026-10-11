import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type {
  CrmFormulaFieldDto,
  CrmRollupSummaryDto,
  CrmValidationRuleDto,
} from '../types/crm-platform.types';

const listRules = vi.fn();
const createRule = vi.fn();
const removeRule = vi.fn();
const listFormulas = vi.fn();
const createFormula = vi.fn();
const removeFormula = vi.fn();
const listRollups = vi.fn();
const createRollup = vi.fn();
const removeRollup = vi.fn();

vi.mock('../api/crm-platform.api', () => ({
  crmValidationRuleApi: {
    list: (...a: unknown[]) => listRules(...a),
    create: (...a: unknown[]) => createRule(...a),
    remove: (...a: unknown[]) => removeRule(...a),
  },
  crmFormulaFieldApi: {
    list: (...a: unknown[]) => listFormulas(...a),
    create: (...a: unknown[]) => createFormula(...a),
    remove: (...a: unknown[]) => removeFormula(...a),
  },
  crmRollupApi: {
    list: (...a: unknown[]) => listRollups(...a),
    create: (...a: unknown[]) => createRollup(...a),
    remove: (...a: unknown[]) => removeRollup(...a),
  },
}));

vi.mock('@/features/auth/api/auth.queries', () => ({
  useProfile: () => ({ data: { role: 1 } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const rule = (over: Partial<CrmValidationRuleDto> = {}): CrmValidationRuleDto => ({
  id: 'rule-1',
  name: 'Close date is required',
  description: null,
  entityType: 'Deal',
  fieldName: 'CloseDate',
  operator: 'IsNotNull',
  compareValue: null,
  errorMessage: 'Pick a close date',
  isActive: true,
  severity: 'Error',
  createdAt: new Date().toISOString(),
  ...over,
});

const formula = (over: Partial<CrmFormulaFieldDto> = {}): CrmFormulaFieldDto => ({
  id: 'f-1',
  name: 'Weighted amount',
  apiName: 'Weighted_amount',
  entityType: 'Deal',
  expression: 'Amount * Probability / 100',
  returnType: 'Currency',
  decimalPlaces: 2,
  isActive: true,
  createdAt: new Date().toISOString(),
  ...over,
});

const rollup = (over: Partial<CrmRollupSummaryDto> = {}): CrmRollupSummaryDto => ({
  id: 'r-1',
  name: 'Total open pipeline',
  parentEntityType: 'Account',
  childEntityType: 'Deal',
  childRelationshipField: 'AccountId',
  aggregateField: 'Amount',
  aggregateFunction: 'SUM',
  filterCriteriaJson: null,
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
  const { Component } = await import('./CrmPlatformPage');
  render(
    <Providers>
      <Component />
    </Providers>
  );
  await waitFor(() => expect(listRules).toHaveBeenCalled());
}

/** The formula and rollup lists only load once their tab is opened. */
async function openTab(label: RegExp) {
  fireEvent.click(await screen.findByRole('button', { name: label }));
}

beforeEach(() => {
  vi.clearAllMocks();
  listRules.mockResolvedValue({ items: [rule()], totalCount: 1 });
  listFormulas.mockResolvedValue({ items: [formula()], totalCount: 1 });
  listRollups.mockResolvedValue({ items: [rollup()], totalCount: 1 });
  createRule.mockResolvedValue(rule());
  createFormula.mockResolvedValue(formula());
  createRollup.mockResolvedValue(rollup());
  removeRule.mockResolvedValue(undefined);
  removeFormula.mockResolvedValue(undefined);
  removeRollup.mockResolvedValue(undefined);
});

describe('platform configuration', () => {
  it('says on every tab that nothing applies these definitions yet', async () => {
    // The whole justification for the page: these three services store and
    // nothing reads. An admin who records a required-field rule must not walk
    // away believing bad saves are now blocked.
    await renderPage();
    const notice = screen.getByTestId('platform-not-enforced-notice');
    expect(notice.textContent).toMatch(/not yet applied/i);
    expect(notice.textContent).toMatch(/will not\s+stop a save/i);

    await openTab(/formula fields/i);
    expect(screen.getByTestId('platform-not-enforced-notice')).toBeTruthy();

    await openTab(/rollup summaries/i);
    expect(screen.getByTestId('platform-not-enforced-notice')).toBeTruthy();
  });

  it('sends the operator as the enum name, which Enum.Parse requires', async () => {
    listRules.mockResolvedValue({ items: [], totalCount: 0 });
    await renderPage();

    fireEvent.change(screen.getByLabelText(/rule name/i), {
      target: { value: 'Amount must be positive' },
    });
    fireEvent.change(screen.getByLabelText(/field name/i), {
      target: { value: 'Amount' },
    });
    fireEvent.change(screen.getByLabelText(/^operator$/i), {
      target: { value: 'GreaterThan' },
    });
    fireEvent.change(await screen.findByLabelText(/compare value/i), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: /record rule/i }));

    await waitFor(() =>
      expect(createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          operator: 'GreaterThan',
          compareValue: '0',
          severity: 'Error',
        })
      )
    );
  });

  it('drops the compare value for an operator that takes none', async () => {
    listRules.mockResolvedValue({ items: [], totalCount: 0 });
    await renderPage();

    // GreaterThan shows the box; switching to IsNull must remove it and send null.
    fireEvent.change(screen.getByLabelText(/^operator$/i), {
      target: { value: 'GreaterThan' },
    });
    expect(screen.getByLabelText(/compare value/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^operator$/i), {
      target: { value: 'IsNull' },
    });
    expect(screen.queryByLabelText(/compare value/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/rule name/i), {
      target: { value: 'Owner must be unset' },
    });
    fireEvent.change(screen.getByLabelText(/field name/i), {
      target: { value: 'OwnerId' },
    });
    fireEvent.click(screen.getByRole('button', { name: /record rule/i }));

    await waitFor(() =>
      expect(createRule).toHaveBeenCalledWith(
        expect.objectContaining({ operator: 'IsNull', compareValue: null })
      )
    );
  });

  it('will not submit a comparing rule with nothing to compare against', async () => {
    listRules.mockResolvedValue({ items: [], totalCount: 0 });
    await renderPage();

    fireEvent.change(screen.getByLabelText(/rule name/i), {
      target: { value: 'Stage must be Won' },
    });
    fireEvent.change(screen.getByLabelText(/field name/i), {
      target: { value: 'Stage' },
    });
    fireEvent.change(screen.getByLabelText(/^operator$/i), {
      target: { value: 'Equals' },
    });

    expect(
      (screen.getByRole('button', { name: /record rule/i }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(createRule).not.toHaveBeenCalled();
  });

  it('shows a stored rule in words rather than enum names', async () => {
    await renderPage();
    expect(await screen.findByText(/close date is required/i)).toBeTruthy();
    // "IsNotNull" is the wire value; the row reads "is not empty". Scoped to
    // the row because the operator <select> carries that label as an option.
    const row = (await screen.findByText('CloseDate')).parentElement;
    expect(row?.textContent).toMatch(/is not empty/i);
    expect(row?.textContent).not.toMatch(/IsNotNull/);
  });

  it('derives the formula api name and says the expression is unchecked', async () => {
    await renderPage();
    await openTab(/formula fields/i);
    await waitFor(() => expect(listFormulas).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/formula name/i), {
      target: { value: 'Weighted amount!' },
    });
    fireEvent.change(screen.getByLabelText(/expression/i), {
      target: { value: 'Amount * Probability / 100' },
    });

    expect(screen.getByTestId('formula-expression-unchecked').textContent).toMatch(
      /nothing parses it/i
    );

    fireEvent.click(screen.getByRole('button', { name: /record formula/i }));
    await waitFor(() =>
      expect(createFormula).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Weighted amount!',
          apiName: 'Weighted_amount',
          returnType: 'Number',
          expression: 'Amount * Probability / 100',
        })
      )
    );
  });

  it('offers decimal places only for the return types that have them', async () => {
    await renderPage();
    await openTab(/formula fields/i);
    await waitFor(() => expect(listFormulas).toHaveBeenCalled());

    // Default is Number, so the box is there.
    expect(await screen.findByLabelText(/decimal places/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/return type/i), {
      target: { value: 'Boolean' },
    });
    expect(screen.queryByLabelText(/decimal places/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/formula name/i), {
      target: { value: 'Is big' },
    });
    fireEvent.change(screen.getByLabelText(/expression/i), {
      target: { value: 'Amount > 1000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /record formula/i }));

    await waitFor(() =>
      expect(createFormula).toHaveBeenCalledWith(
        expect.objectContaining({ returnType: 'Boolean', decimalPlaces: 0 })
      )
    );
  });

  it('asks for no column when the rollup only counts rows', async () => {
    await renderPage();
    await openTab(/rollup summaries/i);
    await waitFor(() => expect(listRollups).toHaveBeenCalled());

    expect(await screen.findByLabelText(/aggregate field/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/aggregate function/i), {
      target: { value: 'COUNT' },
    });
    expect(screen.queryByLabelText(/aggregate field/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/rollup name/i), {
      target: { value: 'Open deals' },
    });
    fireEvent.change(screen.getByLabelText(/relationship field/i), {
      target: { value: 'AccountId' },
    });
    fireEvent.click(screen.getByRole('button', { name: /record rollup/i }));

    // The column is non-nullable server-side, so COUNT sends the key.
    await waitFor(() =>
      expect(createRollup).toHaveBeenCalledWith(
        expect.objectContaining({ aggregateFunction: 'COUNT', aggregateField: 'Id' })
      )
    );
  });

  it('deletes each kind from its own tab', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /delete close date is required/i }));
    await waitFor(() => expect(removeRule).toHaveBeenCalledWith('rule-1'));

    await openTab(/formula fields/i);
    fireEvent.click(await screen.findByRole('button', { name: /delete weighted amount/i }));
    await waitFor(() => expect(removeFormula).toHaveBeenCalledWith('f-1'));

    await openTab(/rollup summaries/i);
    fireEvent.click(await screen.findByRole('button', { name: /delete total open pipeline/i }));
    await waitFor(() => expect(removeRollup).toHaveBeenCalledWith('r-1'));
  });

  it('keeps the page away from non-admins', async () => {
    vi.resetModules();
    vi.doMock('@/features/auth/api/auth.queries', () => ({
      useProfile: () => ({ data: { role: 3 } }),
    }));
    const { Component } = await import('./CrmPlatformPage');
    render(
      <Providers>
        <Component />
      </Providers>
    );
    expect(screen.getByText(/restricted/i)).toBeTruthy();
    vi.doUnmock('@/features/auth/api/auth.queries');
  });
});
