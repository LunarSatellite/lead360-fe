import { AlertTriangle, Loader2, PackageX, RefreshCw } from 'lucide-react';

/**
 * Renders whatever a Stylemint report endpoint returned, without pretending to know its shape.
 *
 * These endpoints return rich, evolving reports rather than fixed records, so a narrow bespoke
 * layout would drift the first time a field is added. What IS stable — which report, whether it
 * is loading, whether it is empty, and the action that refreshes it — is what this provides.
 */
export function ReportPanel({
  title,
  query,
  emptyNote,
}: {
  title: string;
  query: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    data: unknown;
    refetch: () => void;
    isFetching: boolean;
  };
  emptyNote?: string;
}) {
  const code = query.isError && query.error instanceof Error ? query.error.message : null;
  const notFound = code === 'NOT_FOUND';
  // The backend build serving this environment does not carry the endpoint at all — which is a
  // different thing from having nothing to report, and must not read as an empty result.
  const notDeployed = code === 'NOT_DEPLOYED';

  return (
    <div className="rounded-frame border-thin border-border-subtle bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          {title}
        </p>
        <button
          onClick={() => query.refetch()}
          className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary hover:text-brand"
        >
          <RefreshCw
            className={`h-3 w-3 ${query.isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.6}
          />
          Refresh
        </button>
      </div>

      {query.isLoading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} /> Loading…
        </div>
      ) : notDeployed ? (
        <div className="mt-2 flex items-start gap-2">
          <PackageX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" strokeWidth={1.6} />
          <p className="text-xs text-text-secondary">
            This Stylemint build does not serve that endpoint yet, so there is nothing to show —
            not an empty result.
          </p>
        </div>
      ) : notFound ? (
        <p className="mt-2 text-xs text-text-muted">
          {emptyNote ?? 'Nothing has been recorded here yet.'}
        </p>
      ) : query.isError ? (
        <div className="mt-2 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" strokeWidth={1.6} />
          <p className="text-xs text-rose-300">
            {query.error instanceof Error ? query.error.message : 'Something went wrong.'}
          </p>
        </div>
      ) : isEmptyReport(query.data) ? (
        <p className="mt-2 text-xs text-text-muted">
          {serverStatement(query.data) ?? emptyNote ?? 'Nothing has been recorded here yet.'}
        </p>
      ) : (
        <pre className="mt-2 max-h-[28rem] overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
          {JSON.stringify(query.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * An empty array, or an object whose every value is empty, reads better as a sentence.
 *
 * When a response contains arrays at all, those decide: a report that carries a window, a
 * horizon and an empty `arms` list is empty in the way a reader means, even though the scalar
 * fields are populated. Under the older, stricter rule the decision twin and the cart-offer
 * readout both rendered as developer output. Only a response with no array anywhere falls back
 * to that rule.
 */
export function isEmptyReport(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    const values = Object.values(data as Record<string, unknown>);
    if (values.length === 0) return true;

    const collections = values.filter(Array.isArray) as unknown[][];
    if (collections.length > 0) return collections.every((c) => c.length === 0);

    return values.every((v) => v == null || (Array.isArray(v) && v.length === 0));
  }
  return false;
}

/**
 * The server's own words for why a report is empty, when it supplies them.
 *
 * These surfaces were deliberately written to explain an absence rather than show a zero — "That
 * is an absence of measurement, not a result" is the server's sentence, not ours. Falling
 * straight through to a generic note would throw that away and say something weaker in its place.
 */
export function serverStatement(data: unknown): string | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  for (const key of ['statement', 'summary', 'note', 'explanation', 'reason']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
}
