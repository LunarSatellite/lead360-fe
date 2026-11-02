import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  stylemintDimensionsApi,
  type PendingDimensionClaimPage,
  type VendorProductDimensionTags,
} from '../api/stylemint-dimensions.api';
import { ProductDimensionsPanel } from './ProductDimensionsPanel';
import { ClaimVerificationPage } from '../pages/ClaimVerificationPage';

vi.mock('../api/stylemint-dimensions.api', async () => {
  const actual = await vi.importActual<typeof import('../api/stylemint-dimensions.api')>(
    '../api/stylemint-dimensions.api',
  );
  return {
    ...actual,
    stylemintDimensionsApi: {
      productTags: vi.fn(),
      saveProductTags: vi.fn(),
      pendingClaims: vi.fn(),
      verifyClaim: vi.fn(),
    },
  };
});

const auth = vi.hoisted(() => ({ role: 2 as number }));
vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => ({ user: { role: auth.role } }) }));

const api = vi.mocked(stylemintDimensionsApi);
const PRODUCT = '11111111-1111-1111-1111-111111111111';

/** A registry response the component has never seen keys for: nothing here is hard-coded in it. */
const fixture: VendorProductDimensionTags = {
  productId: PRODUCT,
  effective: [{ key: 'fabric.material', value: 'cotton', source: 'vendor', confidence: 1, verified: false }],
  vendorTags: [
    {
      subjectKind: 'product', subjectId: PRODUCT, key: 'fabric.material', value: 'cotton',
      source: 'vendor', confidence: 1, verified: false, updatedUtc: '2026-11-01T00:00:00Z',
    },
  ],
  suggestions: [
    {
      subjectKind: 'product', subjectId: PRODUCT, key: 'style.occasion', value: 'party',
      source: 'vision', confidence: 0.92, verified: false, updatedUtc: '2026-11-01T00:00:00Z',
    },
  ],
  taggable: [
    { key: 'fabric.material', label: 'Material', group: 'fabric', valueType: 'categorical', values: ['cotton', 'silk'], unit: null, departments: [], needsVerification: false },
    { key: 'style.occasion', label: 'Occasion', group: 'style', valueType: 'multi', values: ['party', 'office'], unit: null, departments: [], needsVerification: false },
    { key: 'ethics.halal', label: 'Halal', group: 'ethics', valueType: 'boolean', values: [], unit: null, departments: [], needsVerification: true },
    { key: 'size.length', label: 'Length', group: 'fit', valueType: 'numeric', values: [], unit: 'cm', departments: [], needsVerification: false },
  ],
};

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.role = 2;
  api.productTags.mockResolvedValue(fixture);
  api.saveProductTags.mockImplementation(async () => fixture);
});

describe('ProductDimensionsPanel', () => {
  it('renders every key from the registry response, grouped, by value type', async () => {
    wrap(<ProductDimensionsPanel productId={PRODUCT} />);
    expect(await screen.findByText('Product details for shoppers')).toBeTruthy();
    for (const group of ['fabric', 'style', 'ethics', 'fit']) expect(screen.getByText(group)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'cotton' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('switch', { name: 'Halal' })).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: 'Length' })).toBeTruthy();
    expect(screen.getByText('cm')).toBeTruthy();
  });

  it('shows the AI suggestion with its confidence, and accepting it fills the key', async () => {
    wrap(<ProductDimensionsPanel productId={PRODUCT} />);
    expect(await screen.findByText(/Suggested by AI from your photos — 92%/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Accept party for Occasion' }));
    expect(screen.queryByText(/Suggested by AI/)).toBeNull();
    expect(screen.getByRole('button', { name: 'party' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('rejecting a suggestion hides it without filling the key', async () => {
    wrap(<ProductDimensionsPanel productId={PRODUCT} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reject party for Occasion' }));
    expect(screen.queryByText(/Suggested by AI/)).toBeNull();
    expect(screen.getByRole('button', { name: 'party' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('saves the full value set of each changed key', async () => {
    wrap(<ProductDimensionsPanel productId={PRODUCT} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Accept party for Occasion' }));
    fireEvent.click(screen.getByRole('button', { name: 'office' }));
    fireEvent.click(screen.getByRole('button', { name: 'cotton' })); // clears the material
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Length' }), { target: { value: '72' } });
    fireEvent.click(screen.getByRole('button', { name: /Save details/ }));
    await waitFor(() => expect(api.saveProductTags).toHaveBeenCalledTimes(1));
    const [id, tags] = api.saveProductTags.mock.calls[0];
    expect(id).toBe(PRODUCT);
    expect(tags).toEqual(
      expect.arrayContaining([
        { key: 'fabric.material', values: [] },
        { key: 'style.occasion', values: ['party', 'office'] },
        { key: 'size.length', values: ['72'] },
      ]),
    );
    expect(tags).toHaveLength(3);
  });

  it('meters completeness and marks an unverified claim as pending', async () => {
    wrap(<ProductDimensionsPanel productId={PRODUCT} />);
    expect(await screen.findByText(/1 of 4 details filled — complete details help shoppers find you/)).toBeTruthy();
    fireEvent.click(screen.getByRole('switch', { name: 'Halal' }));
    expect(screen.getByText(/2 of 4 details filled/)).toBeTruthy();
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('2');
    expect(screen.getByText('Pending verification')).toBeTruthy();
  });
});

const page: PendingDimensionClaimPage = {
  items: [
    { subjectKind: 'product', subjectId: PRODUCT, key: 'ethics.halal', label: 'Halal', value: 'true', claimedUtc: '2026-11-01T10:00:00Z' },
  ],
  total: 1,
  skip: 0,
  take: 50,
};

describe('ClaimVerificationPage', () => {
  it('verifies a claim with the exact command the backend binds', async () => {
    api.pendingClaims.mockResolvedValue(page);
    api.verifyClaim.mockResolvedValue(null);
    wrap(<ClaimVerificationPage />);
    const list = await screen.findByRole('list', { name: 'Pending claims' });
    expect(within(list).getByText('Halal')).toBeTruthy();
    expect(within(list).getByText(PRODUCT)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Verify Halal true' }));
    await waitFor(() =>
      expect(api.verifyClaim).toHaveBeenCalledWith({
        subjectKind: 'product', subjectId: PRODUCT, key: 'ethics.halal', value: 'true', verified: true,
      }),
    );
  });

  it('rejects by sending verified: false', async () => {
    api.pendingClaims.mockResolvedValue(page);
    api.verifyClaim.mockResolvedValue(null);
    wrap(<ClaimVerificationPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reject Halal true' }));
    await waitFor(() =>
      expect(api.verifyClaim).toHaveBeenCalledWith(expect.objectContaining({ verified: false })),
    );
  });

  it('shows a read-only operator the queue without actions', async () => {
    auth.role = 3; // Agent
    api.pendingClaims.mockResolvedValue(page);
    wrap(<ClaimVerificationPage />);
    expect(await screen.findByText('Halal')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Verify/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Reject/ })).toBeNull();
    expect(screen.queryByText(/Evidence note/)).toBeNull();
    expect(screen.getByText(/Read-only/)).toBeTruthy();
  });
});
