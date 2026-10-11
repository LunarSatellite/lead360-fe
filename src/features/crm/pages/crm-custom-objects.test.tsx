import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type {
  CrmCustomObjectDefinitionDto,
  CrmCustomObjectDetailDto,
} from '../types/crm-custom-object.types';

const getDefinitions = vi.fn();
const getDefinition = vi.fn();
const createDefinition = vi.fn();
const deleteDefinition = vi.fn();
const addField = vi.fn();

vi.mock('../api/crm-custom-object.api', () => ({
  crmCustomObjectApi: {
    getDefinitions: (...a: unknown[]) => getDefinitions(...a),
    getDefinition: (...a: unknown[]) => getDefinition(...a),
    createDefinition: (...a: unknown[]) => createDefinition(...a),
    deleteDefinition: (...a: unknown[]) => deleteDefinition(...a),
    addField: (...a: unknown[]) => addField(...a),
  },
}));

vi.mock('@/features/auth/api/auth.queries', () => ({
  useProfile: () => ({ data: { role: 1 } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const def = (
  over: Partial<CrmCustomObjectDefinitionDto> = {}
): CrmCustomObjectDefinitionDto => ({
  id: 'obj-1',
  name: 'Service visit',
  apiName: 'Service_visit',
  pluralLabel: 'Service visits',
  description: null,
  isActive: true,
  allowReports: true,
  allowActivities: true,
  fieldCount: 0,
  createdAt: new Date().toISOString(),
  ...over,
});

const detail = (over: Partial<CrmCustomObjectDetailDto> = {}): CrmCustomObjectDetailDto => ({
  ...def(),
  fields: [],
  ...over,
});

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderPage() {
  const { Component } = await import('./CrmCustomObjectsPage');
  render(
    <Providers>
      <Component />
    </Providers>
  );
  await waitFor(() => expect(getDefinitions).toHaveBeenCalled());
}

beforeEach(() => {
  vi.clearAllMocks();
  getDefinitions.mockResolvedValue({ items: [def()], totalCount: 1 });
  getDefinition.mockResolvedValue(detail());
  createDefinition.mockResolvedValue(def());
  deleteDefinition.mockResolvedValue(undefined);
  addField.mockResolvedValue({});
});

describe('custom objects', () => {
  it('derives an identifier-safe api name and shows it before you commit', async () => {
    getDefinitions.mockResolvedValue({ items: [], totalCount: 0 });
    await renderPage();

    fireEvent.change(screen.getByLabelText(/object name/i), {
      target: { value: 'Service visit #2' },
    });
    // Punctuation and spaces collapse to underscores; no leading/trailing ones.
    expect(screen.getByText('Service_visit_2')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(createDefinition).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Service visit #2', apiName: 'Service_visit_2' })
      )
    );
  });

  it('will not create an object whose name has no usable identifier in it', async () => {
    getDefinitions.mockResolvedValue({ items: [], totalCount: 0 });
    await renderPage();

    fireEvent.change(screen.getByLabelText(/object name/i), {
      target: { value: '***' },
    });
    expect((screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('loads the fields only when an object is opened', async () => {
    await renderPage();
    expect(getDefinition).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole('button', { name: /fields of service visit/i }));
    await waitFor(() => expect(getDefinition).toHaveBeenCalledWith('obj-1'));
  });

  it('adds a field with the type that was chosen', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /fields of service visit/i }));
    await waitFor(() => expect(getDefinition).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/field name/i), {
      target: { value: 'Visit date' },
    });
    fireEvent.change(screen.getByLabelText(/field type/i), { target: { value: 'Date' } });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    await waitFor(() =>
      expect(addField).toHaveBeenCalledWith(
        'obj-1',
        expect.objectContaining({ name: 'Visit date', apiName: 'Visit_date', fieldType: 'Date' })
      )
    );
  });

  it('asks for the choices when the field type is Select, and sends them as JSON', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /fields of service visit/i }));
    await waitFor(() => expect(getDefinition).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/field name/i), {
      target: { value: 'Outcome' },
    });
    fireEvent.change(screen.getByLabelText(/field type/i), { target: { value: 'Select' } });
    fireEvent.change(screen.getByLabelText(/select options/i), {
      target: { value: 'Fixed, Parts needed , Revisit' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    await waitFor(() =>
      expect(addField).toHaveBeenCalledWith(
        'obj-1',
        expect.objectContaining({
          optionsJson: JSON.stringify(['Fixed', 'Parts needed', 'Revisit']),
        })
      )
    );
  });

  it('refuses a Reference field rather than sending one with no target', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /fields of service visit/i }));
    await waitFor(() => expect(getDefinition).toHaveBeenCalled());

    fireEvent.change(await screen.findByLabelText(/field name/i), {
      target: { value: 'Related deal' },
    });
    fireEvent.change(screen.getByLabelText(/field type/i), {
      target: { value: 'Reference' },
    });

    expect(screen.getByTestId('custom-object-reference-unsupported')).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: /add field/i }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(addField).not.toHaveBeenCalled();
  });

  it('deletes an object', async () => {
    await renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /delete service visit/i }));
    await waitFor(() => expect(deleteDefinition).toHaveBeenCalledWith('obj-1'));
  });

  it('keeps the page away from non-admins', async () => {
    vi.resetModules();
    vi.doMock('@/features/auth/api/auth.queries', () => ({
      useProfile: () => ({ data: { role: 3 } }),
    }));
    const { Component } = await import('./CrmCustomObjectsPage');
    render(
      <Providers>
        <Component />
      </Providers>
    );
    expect(screen.getByText(/restricted/i)).toBeTruthy();
    vi.doUnmock('@/features/auth/api/auth.queries');
  });
});
