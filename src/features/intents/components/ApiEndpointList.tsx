import { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronRight, X, Shield, AlertTriangle,
} from 'lucide-react';
import { HttpMethodBadge } from '@/shared/components';
import { parseJsonField, HTTP_METHOD_COLOR } from '../types/api-specs.types';
import type { ApiEndpointDto } from '../types/api-specs.types';

interface ApiEndpointListProps {
  endpoints: ApiEndpointDto[];
  isLoading?: boolean;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

export function ApiEndpointList({ endpoints, isLoading }: ApiEndpointListProps) {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = endpoints;
    if (methodFilter) {
      result = result.filter((e) => e.httpMethod.toUpperCase() === methodFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.path.toLowerCase().includes(q) ||
          e.summary?.toLowerCase().includes(q) ||
          e.operationId?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [endpoints, search, methodFilter]);

  // Method counts for filter chips
  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    endpoints.forEach((e) => {
      const m = e.httpMethod.toUpperCase();
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [endpoints]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-glass-1 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (endpoints.length === 0) {
    return (
      <p className="text-sm text-text-muted py-8 text-center">No endpoints parsed.</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" strokeWidth={1.6} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by path, summary..."
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

        {/* Method filter chips */}
        <div className="flex items-center gap-1.5">
          {METHODS.filter((m) => methodCounts[m]).map((m) => {
            const isActive = methodFilter === m;
            const colorMap: Record<string, string> = {
              success: isActive ? 'bg-success text-white' : 'bg-success-soft text-success hover:brightness-110',
              info: isActive ? 'bg-info text-white' : 'bg-info-soft text-info hover:brightness-110',
              warning: isActive ? 'bg-warning text-white' : 'bg-warning-soft text-warning hover:brightness-110',
              danger: isActive ? 'bg-danger text-white' : 'bg-danger-soft text-danger hover:brightness-110',
              brand: isActive ? 'bg-brand text-white' : 'bg-brand-soft text-brand hover:brightness-110',
            };
            const color = HTTP_METHOD_COLOR[m] ?? 'info';
            return (
              <button
                key={m}
                onClick={() => setMethodFilter(isActive ? null : m)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${colorMap[color]}`}
              >
                {m}
                <span className="opacity-70">{methodCounts[m]}</span>
              </button>
            );
          })}
          {methodFilter && (
            <button
              onClick={() => setMethodFilter(null)}
              className="text-xs text-text-muted hover:text-text-secondary transition-all ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-[10px] text-text-muted font-semibold">
        {filtered.length} of {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
      </p>

      {/* Endpoint rows */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">No endpoints match your filters.</p>
        ) : (
          filtered.map((ep) => {
            const isExpanded = expandedId === ep.id;
            const tags = parseJsonField<string[]>(ep.tagsJson);

            return (
              <div key={ep.id} className="border-b border-border-subtle last:border-b-0">
                {/* Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-glass-1 transition-all cursor-pointer"
                >
                  {/* Expand icon */}
                  <span className="text-text-muted flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.6} />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6} />
                    )}
                  </span>

                  {/* Method badge */}
                  <HttpMethodBadge method={ep.httpMethod.toUpperCase() as any} />

                  {/* Path */}
                  <code className="text-xs font-mono font-semibold text-text-primary flex-1 min-w-0 truncate">
                    {ep.path}
                  </code>

                  {/* Summary */}
                  <span className="text-xs text-text-muted truncate max-w-[250px] hidden md:block">
                    {ep.summary || '—'}
                  </span>

                  {/* Tags */}
                  {tags && tags.length > 0 && (
                    <div className="hidden lg:flex items-center gap-1">
                      {tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-glass-2 text-[9px] font-bold text-text-muted uppercase tracking-wide"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 2 && (
                        <span className="text-[9px] text-text-muted">+{tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Deprecated */}
                  {ep.isDeprecated && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning-soft text-[9px] font-bold text-warning">
                      <AlertTriangle className="w-3 h-3" strokeWidth={1.8} />
                      Deprecated
                    </span>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && <EndpointDetail endpoint={ep} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Expanded endpoint detail ───

function EndpointDetail({ endpoint }: { endpoint: ApiEndpointDto }) {
  const pathParams = parseJsonField<any[]>(endpoint.pathParametersJson);
  const queryParams = parseJsonField<any[]>(endpoint.queryParametersJson);
  const headerParams = parseJsonField<any[]>(endpoint.headerParametersJson);
  const requestBody = parseJsonField<any>(endpoint.requestBodyJson);
  const responseSchemas = parseJsonField<any>(endpoint.responseSchemasJson);
  const security = parseJsonField<any[]>(endpoint.securityRequirementsJson);

  const hasParams = (pathParams?.length || 0) + (queryParams?.length || 0) + (headerParams?.length || 0) > 0;

  return (
    <div className="px-4 pb-4 pt-1 bg-glass-1 border-t border-border-subtle">
      <div className="space-y-4 max-w-3xl">
        {/* Description */}
        {endpoint.description && (
          <div>
            <SectionLabel>Description</SectionLabel>
            <p className="text-xs text-text-secondary leading-relaxed">{endpoint.description}</p>
          </div>
        )}

        {/* Operation ID */}
        {endpoint.operationId && (
          <div>
            <SectionLabel>Operation ID</SectionLabel>
            <code className="text-xs font-mono text-brand font-semibold">{endpoint.operationId}</code>
          </div>
        )}

        {/* Parameters */}
        {hasParams && (
          <div>
            <SectionLabel>Parameters</SectionLabel>
            <div className="bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
              <div className="grid grid-cols-[100px_1fr_80px_60px] gap-2 px-3 py-2 border-b border-border-subtle text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted">
                <span>Name</span>
                <span>Description</span>
                <span>Type</span>
                <span>Required</span>
              </div>
              {[
                ...(pathParams || []).map((p: any) => ({ ...p, _in: 'path' })),
                ...(queryParams || []).map((p: any) => ({ ...p, _in: 'query' })),
                ...(headerParams || []).map((p: any) => ({ ...p, _in: 'header' })),
              ].map((param: any, idx: number) => (
                <div
                  key={idx}
                  className="grid grid-cols-[100px_1fr_80px_60px] gap-2 px-3 py-2 border-b border-border-subtle last:border-b-0 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <code className="font-mono font-semibold text-text-primary truncate">
                      {param.name || param.Name}
                    </code>
                    <span className="text-[8px] font-bold text-text-muted uppercase">
                      {param._in}
                    </span>
                  </div>
                  <span className="text-text-muted truncate">
                    {param.description || param.Description || '—'}
                  </span>
                  <code className="font-mono text-[10px] text-text-secondary">
                    {param.type || param.Type || param.schema?.type || '—'}
                  </code>
                  <span>
                    {(param.required ?? param.Required) ? (
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

        {/* Request Body */}
        {requestBody && (
          <div>
            <SectionLabel>
              Request Body
              {endpoint.requestContentType && (
                <span className="ml-2 text-[9px] font-normal text-text-muted">
                  {endpoint.requestContentType}
                </span>
              )}
            </SectionLabel>
            <JsonBlock data={requestBody} />
          </div>
        )}

        {/* Response Schemas */}
        {responseSchemas && (
          <div>
            <SectionLabel>Response Schemas</SectionLabel>
            <JsonBlock data={responseSchemas} />
          </div>
        )}

        {/* Security */}
        {security && security.length > 0 && (
          <div>
            <SectionLabel>Security Requirements</SectionLabel>
            <div className="flex items-center gap-2 flex-wrap">
              {security.map((sec: any, idx: number) => {
                const schemes = typeof sec === 'object' ? Object.keys(sec) : [String(sec)];
                return schemes.map((scheme) => (
                  <span
                    key={`${idx}-${scheme}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning-soft border border-[rgba(245,158,11,0.12)] text-[10px] font-bold text-warning"
                  >
                    <Shield className="w-3 h-3" strokeWidth={1.8} />
                    {scheme}
                  </span>
                ));
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-text-muted mb-1.5">
      {children}
    </p>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="bg-bg-card border border-border-subtle rounded-lg p-3 text-[10px] font-mono text-text-secondary leading-relaxed overflow-x-auto max-h-[200px]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
