import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  isMutation,
  pathParameters,
  resolvePath,
  stylemintOperationsApi,
  type OperationResponse,
  type StylemintOperation,
} from '../api/stylemint-operations.api';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/features/auth/types/auth.types';

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-sky-400/10 text-sky-300 border-sky-400/25',
  POST: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25',
  PUT: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
  PATCH: 'bg-violet-400/10 text-violet-300 border-violet-400/25',
  DELETE: 'bg-rose-400/10 text-rose-300 border-rose-400/25',
};

/**
 * Every Stylemint operator capability, in one place.
 *
 * The curated pages (orders, vendor, customers, content, finance) stay the right tool for
 * day-to-day work — they carry the domain workflow. This page exists so the long tail is
 * reachable at all: the commerce platform exposes far more administration and vendor
 * operations than any hand-built screen covers, and before this they simply could not be
 * driven from Lead360. The operation list is fetched from the backend, not hard-coded, so
 * a commerce module that gains an endpoint is manageable here immediately.
 */
export function CommerceOperationsPage() {
  const { user } = useAuth();
  const canOperate = user?.role === UserRole.Owner || user?.role === UserRole.Admin;

  const [areaFilter, setAreaFilter] = useState('');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [openOperation, setOpenOperation] = useState<string | null>(null);

  const catalog = useQuery({
    queryKey: ['stylemint-operations-catalog'],
    queryFn: () => stylemintOperationsApi.catalog(),
    staleTime: 5 * 60_000,
  });

  const areas = catalog.data?.areas ?? [];

  const visibleAreas = useMemo(() => {
    const needle = areaFilter.trim().toLowerCase();
    if (!needle) return areas;
    return areas
      .map((area) => ({
        ...area,
        operations: area.operations.filter(
          (op) =>
            op.path.toLowerCase().includes(needle) ||
            op.area.toLowerCase().includes(needle) ||
            (op.summary ?? '').toLowerCase().includes(needle),
        ),
      }))
      .filter((area) => area.area.toLowerCase().includes(needle) || area.operations.length > 0);
  }, [areas, areaFilter]);

  const active = visibleAreas.find((a) => a.area === selectedArea) ?? visibleAreas[0];

  if (!canOperate) {
    return (
      <div className="mx-auto max-w-2xl rounded-frame border-thin border-amber-400/25 bg-amber-400/5 p-8 text-center">
        <ShieldCheck strokeWidth={1.6} className="mx-auto h-9 w-9 text-amber-400" />
        <h1 className="mt-4 text-xl font-black text-text-primary">Operator access required</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Commerce operations run against the live Stylemint platform with an administrator or
          vendor credential. Ask an Owner to grant you the operator role.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Stylemint commerce platform
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-text-primary">
            Commerce operations
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            The complete administration and vendor-operations surface, driven from Lead360.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {catalog.data && (
            <span className="text-xs font-bold text-text-muted">
              {catalog.data.operationCount} operations · {catalog.data.areaCount} areas
            </span>
          )}
          <button
            onClick={() => catalog.refetch()}
            className="flex items-center gap-2 rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand"
          >
            <RefreshCw strokeWidth={1.6} className={`h-3.5 w-3.5 ${catalog.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {catalog.isError && (
        <div className="flex items-start gap-3 rounded-frame border-thin border-rose-400/25 bg-rose-400/5 p-4">
          <AlertTriangle strokeWidth={1.6} className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          <p className="text-sm text-text-secondary">{(catalog.error as Error).message}</p>
        </div>
      )}

      {catalog.isLoading ? (
        <div className="flex items-center gap-3 rounded-frame border-thin border-border-subtle bg-bg-card p-8 text-sm text-text-muted">
          <Loader2 strokeWidth={1.6} className="h-4 w-4 animate-spin" /> Loading the operations catalogue…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            <label className="flex items-center gap-2 rounded-card border-thin border-border-subtle bg-bg-elevated px-3">
              <Search strokeWidth={1.6} className="h-4 w-4 text-text-muted" />
              <input
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value)}
                placeholder="Filter areas and paths"
                className="w-full bg-transparent py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>

            <nav className="max-h-[70vh] space-y-1 overflow-y-auto rounded-frame border-thin border-border-subtle bg-bg-card p-2">
              {visibleAreas.map((area) => {
                const isActive = area.area === active?.area;
                return (
                  <button
                    key={area.area}
                    onClick={() => {
                      setSelectedArea(area.area);
                      setOpenOperation(null);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-card px-3 py-2 text-left text-xs font-bold transition ${
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <span className="truncate">{area.area}</span>
                    <span className="shrink-0 text-[10px] text-text-muted">
                      {area.operations.length}
                    </span>
                  </button>
                );
              })}
              {visibleAreas.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-text-muted">
                  Nothing matches “{areaFilter}”.
                </p>
              )}
            </nav>
          </aside>

          <section className="space-y-2">
            {active?.operations.map((operation) => {
              const key = `${operation.method} ${operation.path}`;
              return (
                <OperationRow
                  key={key}
                  operation={operation}
                  isOpen={openOperation === key}
                  onToggle={() => setOpenOperation(openOperation === key ? null : key)}
                />
              );
            })}
            {active && active.operations.length === 0 && (
              <p className="rounded-frame border-thin border-border-subtle bg-bg-card p-6 text-sm text-text-muted">
                No operations in this area match the filter.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function OperationRow({
  operation,
  isOpen,
  onToggle,
}: {
  operation: StylemintOperation;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const parameters = useMemo(() => pathParameters(operation.path), [operation.path]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<OperationResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const mutation = isMutation(operation.method);
  const missing = parameters.filter((name) => !values[name]?.trim());
  const resolved = resolvePath(operation.path, values);

  async function run() {
    setRunning(true);
    setError(null);
    setConfirming(false);
    try {
      setResponse(
        await stylemintOperationsApi.invoke({
          method: operation.method,
          path: resolved,
          query,
          body,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be sent.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-frame border-thin border-border-subtle bg-bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg-elevated"
      >
        <ChevronRight strokeWidth={1.6}
          className={`h-4 w-4 shrink-0 text-text-muted transition ${isOpen ? 'rotate-90' : ''}`}
        />
        <span
          className={`shrink-0 rounded-sm border px-2 py-0.5 text-[10px] font-black ${
            METHOD_STYLES[operation.method] ?? 'border-border-subtle text-text-muted'
          }`}
        >
          {operation.method}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary">
          /{operation.path}
        </span>
        <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wider text-text-muted sm:inline">
          {operation.credential}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-border-subtle p-4">
          {operation.summary && <p className="text-sm text-text-secondary">{operation.summary}</p>}

          {parameters.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {parameters.map((name) => (
                <label key={name} className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                    {name}
                  </span>
                  <input
                    value={values[name] ?? ''}
                    onChange={(event) =>
                      setValues((previous) => ({ ...previous, [name]: event.target.value }))
                    }
                    placeholder={name}
                    className="w-full rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-brand"
                  />
                </label>
              ))}
            </div>
          )}

          <label className="block space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
              Query string
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="page=1&pageSize=20"
              className="w-full rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-brand"
            />
          </label>

          {mutation && operation.method !== 'DELETE' && (
            <label className="block space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
                JSON body
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                placeholder="{ }"
                spellCheck={false}
                className="w-full rounded-card border-thin border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-brand"
              />
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {confirming ? (
              <>
                <span className="text-xs font-bold text-amber-300">
                  This changes live commerce data. Run it?
                </span>
                <button
                  onClick={run}
                  className="rounded-card bg-rose-500/90 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500"
                >
                  Yes, run {operation.method}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-card border-thin border-border-subtle px-3 py-2 text-xs font-bold text-text-secondary"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => (mutation ? setConfirming(true) : run())}
                disabled={running || missing.length > 0}
                className="flex items-center gap-2 rounded-card bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {running ? (
                  <Loader2 strokeWidth={1.6} className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play strokeWidth={1.6} className="h-3.5 w-3.5" />
                )}
                Run
              </button>
            )}

            {missing.length > 0 && (
              <span className="text-xs text-text-muted">
                Fill in {missing.join(', ')} first.
              </span>
            )}

            <span className="ml-auto font-mono text-[10px] text-text-muted">
              /{resolved}
              {query ? `?${query.replace(/^\?/, '')}` : ''}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-card border-thin border-rose-400/25 bg-rose-400/5 p-3">
              <AlertTriangle strokeWidth={1.6} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
              <p className="text-xs text-text-secondary">{error}</p>
            </div>
          )}

          {response && <ResponsePanel response={response} />}
        </div>
      )}
    </div>
  );
}

function ResponsePanel({ response }: { response: OperationResponse }) {
  const ok = response.status >= 200 && response.status < 300;
  const text =
    typeof response.body === 'string'
      ? response.body
      : JSON.stringify(response.body, null, 2) ?? '';

  return (
    <div className="space-y-2 rounded-card border-thin border-border-subtle bg-bg-elevated p-3">
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
        <span
          className={`rounded-sm border px-2 py-0.5 ${
            ok
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
              : 'border-rose-400/25 bg-rose-400/10 text-rose-300'
          }`}
        >
          HTTP {response.status}
        </span>
        <span className="text-text-muted">{response.durationMs} ms</span>
        {response.correlationId && (
          <span className="font-mono text-text-muted">{response.correlationId}</span>
        )}
        {response.status === 503 && (
          <span className="text-amber-300">
            Stylemint operator credentials are not configured for this environment.
          </span>
        )}
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-text-secondary">
        {text || <span className="text-text-muted">(empty response)</span>}
      </pre>
    </div>
  );
}

export { CommerceOperationsPage as Component };
