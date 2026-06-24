import { BarChart3, Zap, MessageSquare, Target, ShieldCheck } from 'lucide-react';
import { GlassCard, GlassCardHeader } from '@/shared/components';
import { useConversationStats, useRoutingPaths, useSessionsByChannel } from '@/features/conversations/api/conversation.queries';
import { tokenBudgetApi, crossReferenceApi, executorApi } from '@/features/api-connection/api/api-connection.api';
import { useQuery } from '@tanstack/react-query';

export function Component() {
  const { data: stats } = useConversationStats();
  const { data: routing } = useRoutingPaths();
  const { data: channels } = useSessionsByChannel();
  const { data: tokenUsage } = useQuery({ queryKey: ['token-usage'], queryFn: () => tokenBudgetApi.getUsage() });
  const { data: coverage } = useQuery({ queryKey: ['coverage'], queryFn: () => crossReferenceApi.getCoverage() });
  const { data: health } = useQuery({ queryKey: ['api-health'], queryFn: () => executorApi.health() });

  const tu = tokenUsage as any;
  const cov = coverage as any;
  const h = health as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Token usage, conversation metrics, API health, intent coverage</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Tokens Today" value={tu?.todayTokens?.toLocaleString() ?? '—'} sub={tu?.dailyLimit ? `${tu.dailyUsagePercent?.toFixed(0)}% of limit` : 'No limit'} icon={<Zap className="w-5 h-5 text-warning" />} pct={tu?.dailyUsagePercent} color="bg-warning" />
        <MetricCard label="Tokens Month" value={tu?.monthTokens?.toLocaleString() ?? '—'} sub={tu?.monthlyLimit ? `${tu.monthlyUsagePercent?.toFixed(0)}% of limit` : 'No limit'} icon={<Zap className="w-5 h-5 text-brand" />} pct={tu?.monthlyUsagePercent} color="bg-brand" />
        <MetricCard label="Sessions" value={stats?.sessionCount?.toString() ?? '0'} sub={`${stats?.messageCount ?? 0} messages`} icon={<MessageSquare className="w-5 h-5 text-info" />} />
        <MetricCard label="Coverage" value={cov ? `${cov.coverageScore}%` : '—'} sub={cov ? `${cov.validMappings}/${cov.totalIntents} mapped` : 'N/A'} icon={<Target className="w-5 h-5 text-success" />} pct={cov?.coverageScore} color="bg-success" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard>
          <GlassCardHeader title="API Health" icon={<ShieldCheck className="w-4 h-4" />} />
          <div className="p-5">
            {h ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${h.healthStatus === 'Healthy' ? 'bg-success' : h.healthStatus === 'Degraded' ? 'bg-warning' : 'bg-danger'}`} />
                  <span className="text-sm font-bold text-text-primary">{h.healthStatus ?? 'Unknown'}</span>
                  {h.lastResponseTimeMs != null && <span className="text-2xs text-text-muted ml-auto">{h.lastResponseTimeMs}ms</span>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center"><div className="text-lg font-extrabold text-text-primary">{h.totalCallsLast24h}</div><div className="text-2xs text-text-muted">Calls 24h</div></div>
                  <div className="text-center"><div className="text-lg font-extrabold text-danger">{h.failedCallsLast24h}</div><div className="text-2xs text-text-muted">Failed</div></div>
                  <div className="text-center"><div className="text-lg font-extrabold text-success">{h.successRateLast24h?.toFixed(1)}%</div><div className="text-2xs text-text-muted">Success</div></div>
                </div>
              </>
            ) : <p className="text-sm text-text-muted">No health data</p>}
          </div>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader title="Routing Paths" icon={<BarChart3 className="w-4 h-4" />} />
          <div className="p-5 space-y-2">
            {routing && Object.keys(routing).length > 0 ? Object.entries(routing).map(([path, count]) => {
              const total = Object.values(routing).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={path} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-[110px] truncate">{path}</span>
                  <div className="flex-1 h-2 bg-glass-1 rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} /></div>
                  <span className="text-2xs text-text-muted w-8 text-right">{count}</span>
                </div>
              );
            }) : <p className="text-sm text-text-muted">No data yet</p>}
          </div>
        </GlassCard>
      </div>

      {channels && Object.keys(channels).length > 0 && (
        <GlassCard>
          <GlassCardHeader title="Sessions by Channel" icon={<MessageSquare className="w-4 h-4" />} />
          <div className="p-5 grid grid-cols-4 gap-4">
            {Object.entries(channels).map(([ch, count]) => (
              <div key={ch} className="text-center p-3 rounded-lg bg-glass-1">
                <div className="text-xl font-extrabold text-text-primary">{count}</div>
                <div className="text-2xs text-text-muted">{ch}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, icon, pct, color }: { label: string; value: string; sub: string; icon: React.ReactNode; pct?: number; color?: string }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-3">{icon}<span className="text-2xs text-text-muted font-bold">{label}</span></div>
      <div className="text-2xl font-extrabold text-text-primary">{value}</div>
      <div className="text-2xs text-text-muted mt-1">{sub}</div>
      {pct != null && color && (
        <div className="w-full h-1.5 bg-glass-1 rounded-full mt-3 overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      )}
    </GlassCard>
  );
}
