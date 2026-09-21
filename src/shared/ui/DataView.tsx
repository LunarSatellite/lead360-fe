import type { ReactNode } from 'react';
import { Loader2, Inbox, AlertCircle, RotateCw } from 'lucide-react';
import { getApiError } from '@/shared/lib/get-api-error';

/** Minimal shape compatible with a TanStack Query result. */
interface QueryLike<T> {
  data: T | undefined;
  isPending?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: () => void;
}

interface Props<T> {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  /** Render when data is present but "empty" (e.g. []). Optional. */
  empty?: ReactNode;
  /** Treat data as empty when this returns true (defaults to empty-array check). */
  isEmpty?: (data: T) => boolean;
  loading?: ReactNode;
}

function defaultIsEmpty(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0;
}

/**
 * Renders the correct loading / error / empty / data state for a query so child components
 * never touch `data` while it's undefined. This is the guard that stops the app-wide
 * `data.items.map(...)`-on-undefined crashes.
 *
 *   <DataView query={contactsQuery} empty={<EmptyContacts/>}>
 *     {(data) => data.items.map((c) => <Row key={c.id} contact={c} />)}
 *   </DataView>
 */
export function DataView<T>({ query, children, empty, isEmpty = defaultIsEmpty, loading }: Props<T>) {
  const pending = query.isPending ?? query.isLoading ?? query.data === undefined;

  if (query.isError) {
    const { message } = getApiError(query.error, 'Failed to load.');
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-card border-thin border-border-subtle bg-glass-1 p-8 text-center">
        <AlertCircle size={18} strokeWidth={1.6} className="text-danger" />
        <p className="max-w-md text-xs text-text-muted">{message}</p>
        {query.refetch && (
          <button
            onClick={() => query.refetch?.()}
            className="flex items-center gap-1.5 rounded-sm border-thin border-border-medium px-3 py-1.5 text-xs font-600 text-text-secondary hover:bg-glass-2 hover:text-text-primary"
          >
            <RotateCw size={13} strokeWidth={1.6} />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (pending || query.data === undefined) {
    return (
      loading ?? (
        <div className="flex items-center justify-center gap-2 p-8 text-text-muted">
          <Loader2 size={16} strokeWidth={1.6} className="animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      )
    );
  }

  if (isEmpty(query.data)) {
    return (
      empty ?? (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-text-muted">
          <Inbox size={18} strokeWidth={1.6} />
          <span className="text-xs">Nothing here yet.</span>
        </div>
      )
    );
  }

  return <>{children(query.data)}</>;
}
