import { AlertTriangle, Loader2, WifiOff, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { EmptyState } from './Surface';

/**
 * Telling "it failed" apart from "there are none".
 *
 * Nearly every list in this admin was written with two states:
 *
 *   {isLoading ? <spinner/> : !items.length ? <Empty/> : <table/>}
 *
 * A request that did not succeed has no items, so it lands in the second
 * branch. With the API unreachable, the invoices page said "No invoices
 * found" under a heading reading "0 total", and contacts said "No
 * contacts found". Both are confident statements about the business, and
 * both are false: nothing was ever successfully asked.
 *
 * An empty spinner is a bad state. A wrong answer delivered calmly is
 * worse, because the operator has no reason to doubt it — they go looking
 * for who deleted the invoices.
 *
 * The part that makes `isLoading` actively dangerous rather than merely
 * incomplete: React Query has four outcomes here, not three. When it
 * decides the connection is down it *pauses* the query, and a paused
 * query reports
 *
 *   status: 'pending', fetchStatus: 'paused', isLoading: false, isError: false
 *
 * `isLoading` is false by design, because nothing is in flight. So a page
 * branching on `isLoading` alone renders its empty state for every list
 * in the product the moment the network drops — not an error, not a
 * spinner, just a calm "No invoices found". That state was observed in
 * the browser, not inferred; it is why `isPending` and `fetchStatus` are
 * both read below.
 *
 * Of 365 data reads in this codebase, 20 handled failure. These two
 * components make the correct version shorter to write than the wrong
 * one, which is the only way the rest ever get fixed.
 */

type QueryLike = {
  isLoading?: boolean;
  isPending?: boolean;
  isError?: boolean;
  fetchStatus?: 'fetching' | 'paused' | 'idle';
  error?: unknown;
  refetch?: () => unknown;
};

function messageOf(error: unknown): string | undefined {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return undefined;
}

/** No answer yet, for any reason — loading, retrying, or paused offline. */
export function hasNoAnswerYet(query: QueryLike): boolean {
  return query.isPending ?? query.isLoading ?? false;
}

export function isWaitingForConnection(query: QueryLike): boolean {
  return query.fetchStatus === 'paused';
}

function RetryButton({ query }: { query: QueryLike }) {
  if (!query.refetch) return null;
  return (
    <Button variant="soft" size="sm" onClick={() => query.refetch?.()}>
      Try again
    </Button>
  );
}

export function ListState({
  query,
  isEmpty,
  noun,
  icon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: {
  query: QueryLike;
  /** The page decides this: `!items.length`, `!data?.items.length`, … */
  isEmpty: boolean;
  /** Plain plural used in the messages: "Could not load invoices". */
  noun: string;
  icon?: LucideIcon;
  emptyTitle: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  children: ReactNode;
}) {
  /**
   * Everything that is not a successful answer is checked before
   * emptiness, never after. A list that failed is also a list with no
   * rows, so the other order silently restores the bug this exists to
   * prevent.
   */
  if (query.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={`Could not load ${noun}`}
        description={
          messageOf(query.error) ??
          `The request failed, so this is not showing your ${noun}. The list is not empty.`
        }
        action={<RetryButton query={query} />}
      />
    );
  }

  if (isWaitingForConnection(query)) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Waiting for a connection"
        description={`This is not showing your ${noun} — the request is paused until the network is back. The list is not empty.`}
        action={<RetryButton query={query} />}
      />
    );
  }

  if (hasNoAnswerYet(query)) {
    return (
      <div className="flex h-48 items-center justify-center text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading {noun}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}

/**
 * The count that sits under a list heading.
 *
 * "0 total" was rendered from `data?.totalCount ?? 0` — the `?? 0` turns
 * "we don't know" into "zero", which is the same lie as the empty state
 * and harder to notice. Contacts took the other route and left the word
 * "Loading..." on screen permanently once its request had stopped, since
 * it only ever checked whether `data` had arrived.
 */
export function ResultCount({
  query,
  total,
  noun = 'total',
}: {
  query: QueryLike;
  total: number | undefined;
  noun?: string;
}) {
  if (query.isError || isWaitingForConnection(query)) return <>Count unavailable</>;
  if (hasNoAnswerYet(query)) return <>Loading…</>;
  // Answered, but without a count in it. Saying "Loading…" here would
  // leave the word on screen for good, which is the bug this replaced.
  if (total === undefined) return <>Count unavailable</>;
  return (
    <>
      {total.toLocaleString()} {noun}
    </>
  );
}
