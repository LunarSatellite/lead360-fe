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
          {emptyNote ?? 'Nothing has been recorded here yet.'}
        </p>
      ) : (
        <pre className="mt-2 max-h-[28rem] overflow-auto rounded-sm border-thin border-border-subtle bg-bg-input p-2.5 font-mono text-[11px] leading-relaxed text-text-secondary">
          {JSON.stringify(query.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/** An empty array, or an object whose every value is empty, reads better as a sentence. */
function isEmptyReport(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    const values = Object.values(data as Record<string, unknown>);
    if (values.length === 0) return true;
    return values.every((v) => v == null || (Array.isArray(v) && v.length === 0));
  }
  return false;
}
