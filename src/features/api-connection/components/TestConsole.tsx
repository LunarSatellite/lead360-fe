import { useState, useMemo } from 'react';
import { Play, Loader2, Wifi, Clock, CheckCircle, XCircle } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import { useTestEndpoint, useApiHealth } from '../api/api-connection.queries';
import { parseJson } from '../types/api-connection.types';
import type { EndpointDto, EndpointTestResult } from '../types/api-connection.types';

interface TestConsoleProps {
  endpoints: EndpointDto[];
}

export function TestConsole({ endpoints }: TestConsoleProps) {
  const [selectedId, setSelectedId] = useState('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EndpointTestResult | null>(null);

  const testEndpoint = useTestEndpoint();
  const { data: rawHealth } = useApiHealth();
  const health = rawHealth as any;

  const selected = useMemo(() => endpoints.find((e) => e.id === selectedId), [endpoints, selectedId]);

  // Build param fields from selected endpoint
  const paramFields = useMemo(() => {
    if (!selected) return [];
    const pathP = parseJson<{ name: string; type?: string }[]>(selected.pathParametersJson) || [];
    const queryP = parseJson<{ name: string; type?: string }[]>(selected.queryParametersJson) || [];
    return [
      ...pathP.map((p) => ({ name: p.name || (p as any).Name, source: 'path', type: p.type || 'string' })),
      ...queryP.map((p) => ({ name: p.name || (p as any).Name, source: 'query', type: p.type || 'string' })),
    ];
  }, [selected]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setParams({});
    setResult(null);
  };

  const handleExecute = () => {
    if (!selectedId) return;
    testEndpoint.mutate(
      { endpointId: selectedId, params },
      {
        onSuccess: (res) => setResult(res as unknown as EndpointTestResult),
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* API Health */}
      {health && (
        <div className="flex items-center gap-4 bg-bg-card border border-border-subtle rounded-xl px-5 py-3 ">
          <div className="flex items-center gap-2">
            <Wifi
              className={`w-4 h-4 ${health.status === 'healthy' ? 'text-success' : 'text-danger'}`}
              strokeWidth={1.8}
            />
            <span className="text-xs font-bold text-text-primary">API Health</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${health.status === 'healthy' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}
          >
            {health.status || 'unknown'}
          </span>
          {health.responseTimeMs != null && (
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <Clock className="w-3 h-3" />
              {health.responseTimeMs}ms
            </span>
          )}
          {health.successRate24h != null && (
            <span className="text-[11px] text-text-muted">24h: {health.successRate24h}%</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: select + params */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Select Endpoint</label>
            <select
              value={selectedId}
              onChange={(e) => handleSelect(e.target.value)}
              className="form-input appearance-none cursor-pointer"
            >
              <option value="">— Choose an endpoint —</option>
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.httpMethod.toUpperCase()} {ep.path} {ep.summary ? `— ${ep.summary}` : ''}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="bg-bg-card border border-border-subtle rounded-xl p-4 ">
              <div className="flex items-center gap-2 mb-3">
                <MethodBadge method={selected.httpMethod} />
                <code className="text-xs font-mono font-semibold text-text-primary">{selected.path}</code>
              </div>

              {paramFields.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted">
                    Parameters
                  </p>
                  {paramFields.map((f) => (
                    <div key={f.name}>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        {f.name} <span className="text-[11px] text-text-muted font-normal">({f.source})</span>
                      </label>
                      <input
                        value={params[f.name] || ''}
                        onChange={(e) => setParams((prev) => ({ ...prev, [f.name]: e.target.value }))}
                        placeholder={`Enter ${f.name}...`}
                        className="form-input"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No parameters required.</p>
              )}
            </div>
          )}

          <button
            onClick={handleExecute}
            disabled={!selectedId || testEndpoint.isPending}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
          >
            {testEndpoint.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" strokeWidth={2} />
            )}
            Execute
          </button>
        </div>

        {/* Right: response */}
        <div>
          {result ? (
            <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden ">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border-subtle">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-success" strokeWidth={1.8} />
                ) : (
                  <XCircle className="w-4 h-4 text-danger" strokeWidth={1.8} />
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${result.statusCode < 400 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}
                >
                  {result.statusCode}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="w-3 h-3" />
                  {result.responseTimeMs}ms
                </span>
              </div>
              <pre className="p-4 text-[11px] font-mono text-text-secondary leading-relaxed overflow-auto max-h-[400px]">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-glass-1 border border-border-subtle rounded-2xl">
              <Play className="w-8 h-8 text-text-muted mb-2" strokeWidth={1.4} />
              <p className="text-sm text-text-muted">
                Select an endpoint and click Execute to see the response.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
