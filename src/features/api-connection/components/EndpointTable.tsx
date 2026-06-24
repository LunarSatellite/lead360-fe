import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, X, Shield, AlertTriangle } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import { parseJson } from '../types/api-connection.types';
import type { EndpointDto } from '../types/api-connection.types';

interface EndpointTableProps {
  endpoints: EndpointDto[];
  isLoading?: boolean;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

export function EndpointTable({ endpoints, isLoading }: EndpointTableProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = endpoints;
    if (methodFilter) r = r.filter((e) => e.httpMethod.toUpperCase() === methodFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((e) => e.path.toLowerCase().includes(q) || e.summary?.toLowerCase().includes(q));
    }
    return r;
  }, [endpoints, search, methodFilter]);

  const methodCounts = useMemo(() => {
    const c: Record<string, number> = {};
    endpoints.forEach((e) => {
      const m = e.httpMethod.toUpperCase();
      c[m] = (c[m] || 0) + 1;
    });
    return c;
  }, [endpoints]);

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-11 bg-glass-1 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  if (endpoints.length === 0)
    return <p className="text-sm text-text-muted py-8 text-center">No endpoints parsed.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted"
            strokeWidth={1.6}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search path, summary..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-glass-1 border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {METHODS.filter((m) => methodCounts[m]).map((m) => {
            const active = methodFilter === m;
            return (
              <button
                key={m}
                onClick={() => setMethodFilter(active ? null : m)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${active ? 'bg-brand text-white' : 'bg-glass-1 text-text-secondary hover:bg-glass-2'}`}
              >
                {m} <span className="opacity-60 ml-0.5">{methodCounts[m]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-text-muted font-semibold">
        {filtered.length} of {endpoints.length} endpoints
      </p>

      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">No endpoints match filters.</p>
        ) : (
          filtered.map((ep) => {
            const expanded = expandedId === ep.id;
            const tags = parseJson<string[]>(ep.tagsJson);
            return (
              <div key={ep.id} className="border-b border-border-subtle last:border-b-0">
                <div
                  onClick={() => setExpandedId(expanded ? null : ep.id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-glass-1 transition-all cursor-pointer"
                >
                  <span className="text-text-muted flex-shrink-0">
                    {expanded ? (
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.6} />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} />
                    )}
                  </span>
                  <MethodBadge method={ep.httpMethod} />
                  <code className="text-xs font-mono font-semibold text-text-primary flex-1 min-w-0 truncate">
                    {ep.path}
                  </code>
                  <span className="text-xs text-text-muted truncate max-w-[220px] hidden md:block">
                    {ep.summary || '—'}
                  </span>
                  {tags && tags.length > 0 && (
                    <div className="hidden lg:flex items-center gap-1">
                      {tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-glass-2 text-[9px] font-bold text-text-muted uppercase tracking-wide"
                        >
                          {t}
                        </span>
                      ))}
                      {tags.length > 2 && (
                        <span className="text-[9px] text-text-muted">+{tags.length - 2}</span>
                      )}
                    </div>
                  )}
                  {ep.isDeprecated && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-warning-soft text-[9px] font-bold text-warning">
                      <AlertTriangle className="w-3 h-3" strokeWidth={1.8} />
                      Deprecated
                    </span>
                  )}
                </div>
                {expanded && <EndpointDetail endpoint={ep} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EndpointDetail({ endpoint }: { endpoint: EndpointDto }) {
  const pathParams = parseJson<Record<string, unknown>[]>(endpoint.pathParametersJson);
  const queryParams = parseJson<Record<string, unknown>[]>(endpoint.queryParametersJson);
  const requestBody = parseJson<unknown>(endpoint.requestBodyJson);
  const responseSchemas = parseJson<unknown>(endpoint.responseSchemasJson);
  const security = parseJson<unknown[]>(endpoint.securityRequirementsJson);
  const allParams = [
    ...(pathParams || []).map((p) => ({ ...p, _in: 'path' })),
    ...(queryParams || []).map((p) => ({ ...p, _in: 'query' })),
  ];

  return (
    <div className="px-4 pb-4 pt-1 bg-glass-1 border-t border-border-subtle">
      <div className="space-y-4 max-w-3xl">
        {endpoint.description && (
          <div>
            <Label>Description</Label>
            <p className="text-xs text-text-secondary leading-relaxed">{endpoint.description}</p>
          </div>
        )}
        {endpoint.operationId && (
          <div>
            <Label>Operation ID</Label>
            <code className="text-xs font-mono text-brand font-semibold">{endpoint.operationId}</code>
          </div>
        )}

        {allParams.length > 0 && (
          <div>
            <Label>Parameters</Label>
            <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
              <div className="grid grid-cols-[100px_1fr_70px_50px] gap-2 px-3 py-2 border-b border-border-subtle text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted">
                <span>Name</span>
                <span>Description</span>
                <span>Type</span>
                <span>Req</span>
              </div>
              {allParams.map((p: any, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[100px_1fr_70px_50px] gap-2 px-3 py-2 border-b border-border-subtle last:border-b-0 text-xs"
                >
                  <div className="flex items-center gap-1">
                    <code className="font-mono font-semibold text-text-primary truncate">
                      {p.name || p.Name}
                    </code>
                    <span className="text-[8px] text-text-muted uppercase">{p._in}</span>
                  </div>
                  <span className="text-text-muted truncate">{p.description || p.Description || '—'}</span>
                  <code className="font-mono text-[10px] text-text-secondary">
                    {p.type || p.Type || p.schema?.type || '—'}
                  </code>
                  <span>
                    {(p.required ?? p.Required) ? (
                      <span className="text-danger font-bold text-[10px]">Yes</span>
                    ) : (
                      <span className="text-text-muted text-[10px]">No</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {requestBody != null ? (
          <div>
            <Label>
              Request Body{' '}
              {endpoint.requestContentType && (
                <span className="ml-2 text-[9px] font-normal text-text-muted">
                  {endpoint.requestContentType}
                </span>
              )}
            </Label>
            <JsonBlock data={requestBody} />
          </div>
        ) : null}
        {responseSchemas != null ? (
          <div>
            <Label>Response Schemas</Label>
            <JsonBlock data={responseSchemas} />
          </div>
        ) : null}

        {security && security.length > 0 && (
          <div>
            <Label>Security</Label>
            <div className="flex flex-wrap gap-2">
              {security.map((s: any, i) =>
                Object.keys(typeof s === 'object' ? s : {}).map((k) => (
                  <span
                    key={`${i}-${k}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning-soft text-[10px] font-bold text-warning"
                  >
                    <Shield className="w-3 h-3" strokeWidth={1.8} />
                    {k}
                  </span>
                )),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted mb-1.5">{children}</p>;
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="bg-bg-card border border-border-subtle rounded-lg p-3 text-[10px] font-mono text-text-secondary leading-relaxed overflow-x-auto max-h-[200px]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
