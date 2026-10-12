import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Receipt } from 'lucide-react';
import { ListState, ResultCount } from './QueryState';

/**
 * The four outcomes, and the one that caused the bug.
 *
 * `paused` is the case worth staring at. React Query reports it as
 * `isPending: true, isLoading: false, isError: false`, so a page that
 * branches on `isLoading` falls straight through to "no rows" and tells
 * the operator their invoices are gone. That exact state was observed in
 * a browser against an unreachable API before these tests were written.
 */

const rows = <table><tbody><tr><td>INV-001</td></tr></tbody></table>;

function list(query: Parameters<typeof ListState>[0]['query'], isEmpty = true) {
  return (
    <ListState query={query} isEmpty={isEmpty} noun="invoices" icon={Receipt} emptyTitle="No invoices found">
      {rows}
    </ListState>
  );
}

describe('ListState', () => {
  it('shows the rows when the query answered with some', () => {
    render(list({ isPending: false, isError: false, fetchStatus: 'idle' }, false));
    expect(screen.getByText('INV-001')).toBeTruthy();
  });

  it('shows the empty state only when the query really answered "none"', () => {
    render(list({ isPending: false, isError: false, fetchStatus: 'idle' }, true));
    expect(screen.getByText('No invoices found')).toBeTruthy();
  });

  it('shows a spinner while a request is in flight', () => {
    render(list({ isPending: true, isLoading: true, isError: false, fetchStatus: 'fetching' }));
    expect(screen.getByText('Loading invoices')).toBeTruthy();
    expect(screen.queryByText('No invoices found')).toBeNull();
  });

  it('says it failed, not that the list is empty', () => {
    render(list({ isPending: false, isError: true, error: new Error('Network Error'), fetchStatus: 'idle' }));
    expect(screen.getByText('Could not load invoices')).toBeTruthy();
    expect(screen.getByText('Network Error')).toBeTruthy();
    expect(screen.queryByText('No invoices found')).toBeNull();
  });

  it('says it is waiting for a connection when React Query paused the request', () => {
    /**
     * The regression test for the actual defect. `isLoading` is false
     * here — that is React Query's own behaviour for a paused query, not
     * a contrived value — so anything keying off `isLoading` renders the
     * empty state and lies.
     */
    render(list({ isPending: true, isLoading: false, isError: false, fetchStatus: 'paused' }));
    expect(screen.getByText('Waiting for a connection')).toBeTruthy();
    expect(screen.queryByText('No invoices found')).toBeNull();
  });

  it('offers a retry that actually refetches', () => {
    const refetch = vi.fn();
    render(list({ isPending: false, isError: true, error: new Error('nope'), fetchStatus: 'idle', refetch }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});

describe('ResultCount', () => {
  it('shows the count when there is one', () => {
    render(<ResultCount query={{ isPending: false, isError: false, fetchStatus: 'idle' }} total={1284} />);
    expect(screen.getByText(/1,284 total/)).toBeTruthy();
  });

  it('shows zero when the answer really was zero', () => {
    render(<ResultCount query={{ isPending: false, isError: false, fetchStatus: 'idle' }} total={0} />);
    expect(screen.getByText(/0 total/)).toBeTruthy();
  });

  it('never prints "0 total" for an unknown count', () => {
    /** `data?.totalCount ?? 0` is what this replaces. */
    for (const query of [
      { isPending: false, isError: true, fetchStatus: 'idle' as const },
      { isPending: true, isLoading: false, isError: false, fetchStatus: 'paused' as const },
      { isPending: false, isError: false, fetchStatus: 'idle' as const },
    ]) {
      const { unmount } = render(<ResultCount query={query} total={undefined} />);
      expect(screen.getByText('Count unavailable')).toBeTruthy();
      unmount();
    }
  });

  it('does not leave "Loading…" on screen once the request has stopped', () => {
    render(<ResultCount query={{ isPending: false, isError: true, fetchStatus: 'idle' }} total={undefined} />);
    expect(screen.queryByText('Loading…')).toBeNull();
  });
});
