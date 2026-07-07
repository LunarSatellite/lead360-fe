import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, DollarSign, Eye, MousePointer, Users,
  Target, BarChart3, Facebook, Video, Loader2, Zap,
} from 'lucide-react';
import { apiClient } from '@/shared/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FbAggregate {
  totalCampaigns: number; activeCampaigns: number; totalSpend: number;
  totalImpressions: number; totalClicks: number; totalReach: number;
  totalLeads: number; totalRevenue: number; overallCtr: number | null;
  overallCpc: number | null; overallCpm: number | null;
}

interface TikTokAggregate {
  totalCampaigns: number; activeCampaigns: number; totalSpend: number;
  totalImpressions: number; totalClicks: number; totalReach: number;
  totalConversions: number; totalVideoViews: number;
  totalLikes: number; totalShares: number; totalComments: number;
  overallCtr?: number; overallCpc?: number;
}

interface FbCampaign {
  id: string; name: string; fbStatus: string; objective?: string;
  dailyBudget?: number; lifetimeBudget?: number; budgetCurrency?: string;
  impressions: number; clicks: number; spend: number; reach: number;
  ctr?: number; cpc?: number; leads: number; revenue: number;
  createdAt: string;
}

interface TtCampaign {
  id: string; name: string; status: string; objective?: string;
  dailyBudget?: number; lifetimeBudget?: number;
  impressions: number; clicks: number; spend: number; reach: number;
  ctr?: number; cpc?: number; conversions: number; videoViews: number;
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdsReportTab() {
  const { data: rawFbAgg, isLoading: fbLoading } = useQuery({
    queryKey: ['fb-aggregate'], queryFn: () => apiClient.get<FbAggregate>('/v1/crm/fb-ads/aggregate'),
  });
  const { data: rawTtAgg, isLoading: ttLoading } = useQuery({
    queryKey: ['tt-aggregate'], queryFn: () => apiClient.get<TikTokAggregate>('/v1/crm/tiktok-ads/aggregate'),
  });
  const { data: rawFbCampaigns } = useQuery({
    queryKey: ['fb-campaigns'], queryFn: () => apiClient.get<FbCampaign[]>('/v1/crm/fb-ads/campaigns'),
  });
  const { data: rawTtCampaigns } = useQuery({
    queryKey: ['tt-campaigns'], queryFn: () => apiClient.get<TtCampaign[]>('/v1/crm/tiktok-ads/campaigns'),
  });

  const fb = rawFbAgg as unknown as FbAggregate | null;
  const tt = rawTtAgg as unknown as TikTokAggregate | null;
  const fbCampaigns = ((rawFbCampaigns as unknown as FbCampaign[]) ?? []);
  const ttCampaigns = ((rawTtCampaigns as unknown as TtCampaign[]) ?? []);
  const loading = fbLoading || ttLoading;

  const totalSpend = (fb?.totalSpend ?? 0) + (tt?.totalSpend ?? 0);
  const totalImpressions = (fb?.totalImpressions ?? 0) + (tt?.totalImpressions ?? 0);
  const totalClicks = (fb?.totalClicks ?? 0) + (tt?.totalClicks ?? 0);
  const totalReach = (fb?.totalReach ?? 0) + (tt?.totalReach ?? 0);
  const totalCampaigns = (fb?.totalCampaigns ?? 0) + (tt?.totalCampaigns ?? 0);
  const activeCampaigns = (fb?.activeCampaigns ?? 0) + (tt?.activeCampaigns ?? 0);
  const totalLeads = (fb?.totalLeads ?? 0) + (tt?.totalConversions ?? 0);
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  const allCampaigns = [
    ...fbCampaigns.map(c => ({
      id: c.id, name: c.name, platform: 'facebook' as const,
      status: c.fbStatus, objective: c.objective,
      budget: c.dailyBudget ?? c.lifetimeBudget ?? 0,
      budgetType: c.dailyBudget ? 'daily' : 'lifetime',
      impressions: c.impressions, clicks: c.clicks,
      spend: c.spend, reach: c.reach,
      ctr: c.ctr ?? 0, cpc: c.cpc ?? 0,
      results: c.leads, createdAt: c.createdAt,
    })),
    ...ttCampaigns.map(c => ({
      id: c.id, name: c.name, platform: 'tiktok' as const,
      status: c.status, objective: c.objective,
      budget: c.dailyBudget ?? c.lifetimeBudget ?? 0,
      budgetType: c.dailyBudget ? 'daily' : 'lifetime',
      impressions: c.impressions, clicks: c.clicks,
      spend: c.spend, reach: c.reach,
      ctr: c.ctr ?? 0, cpc: c.cpc ?? 0,
      results: c.conversions, createdAt: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!fb && !tt) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <BarChart3 className="w-10 h-10 text-text-muted mx-auto" />
          <p className="text-sm text-text-muted">Connect an ad platform to see reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-y-auto flex-1">
      {/* Combined metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={DollarSign} label="Total Spend" value={`$${fmtNum(totalSpend)}`} color="text-[#F59E0B]" bgColor="bg-[rgba(245,158,11,0.08)]" />
        <MetricCard icon={Eye} label="Impressions" value={fmtNum(totalImpressions)} color="text-brand" bgColor="bg-brand-soft" />
        <MetricCard icon={MousePointer} label="Clicks" value={fmtNum(totalClicks)} color="text-info" bgColor="bg-info-soft" />
        <MetricCard icon={Users} label="Reach" value={fmtNum(totalReach)} color="text-success" bgColor="bg-success-soft" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Results / Leads" value={fmtNum(totalLeads)} color="text-[#E4405F]" bgColor="bg-[rgba(228,64,95,0.08)]" />
        <MetricCard icon={TrendingUp} label="CTR" value={`${overallCtr.toFixed(2)}%`} color="text-brand" bgColor="bg-brand-soft" />
        <MetricCard icon={DollarSign} label="Avg CPC" value={`$${overallCpc.toFixed(2)}`} color="text-[#F59E0B]" bgColor="bg-[rgba(245,158,11,0.08)]" />
        <MetricCard icon={Zap} label="Active / Total" value={`${activeCampaigns} / ${totalCampaigns}`} color="text-success" bgColor="bg-success-soft" />
      </div>

      {/* Platform breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fb && (
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(24,119,242,0.1)] flex items-center justify-center shrink-0">
                <Facebook className="w-4 h-4 text-[#1877F2]" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Facebook & Instagram</p>
                <p className="text-[10px] text-text-muted">{fb.activeCampaigns} active of {fb.totalCampaigns}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Spend" value={`$${fmtNum(fb.totalSpend)}`} />
              <MiniStat label="Impressions" value={fmtNum(fb.totalImpressions)} />
              <MiniStat label="Clicks" value={fmtNum(fb.totalClicks)} />
              <MiniStat label="CTR" value={fb.overallCtr ? `${fb.overallCtr.toFixed(2)}%` : '—'} />
              <MiniStat label="CPC" value={fb.overallCpc ? `$${fb.overallCpc.toFixed(2)}` : '—'} />
              <MiniStat label="Leads" value={fmtNum(fb.totalLeads)} />
            </div>
          </div>
        )}

        {tt && (
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-text-secondary" strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">TikTok Ads</p>
                <p className="text-[10px] text-text-muted">{tt.activeCampaigns} active of {tt.totalCampaigns}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Spend" value={`$${fmtNum(tt.totalSpend)}`} />
              <MiniStat label="Impressions" value={fmtNum(tt.totalImpressions)} />
              <MiniStat label="Clicks" value={fmtNum(tt.totalClicks)} />
              <MiniStat label="CTR" value={tt.overallCtr ? `${tt.overallCtr.toFixed(2)}%` : '—'} />
              <MiniStat label="Video Views" value={fmtNum(tt.totalVideoViews)} />
              <MiniStat label="Conversions" value={fmtNum(tt.totalConversions)} />
            </div>
          </div>
        )}
      </div>

      {/* Campaign performance table */}
      <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand" strokeWidth={1.6} />
          <p className="text-sm font-bold text-text-primary">Campaign Performance</p>
          <span className="text-[10px] text-text-muted ml-auto">{allCampaigns.length} campaigns</span>
        </div>

        {allCampaigns.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">No campaigns yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-2.5 text-text-muted font-semibold">Campaign</th>
                  <th className="text-left px-3 py-2.5 text-text-muted font-semibold">Platform</th>
                  <th className="text-left px-3 py-2.5 text-text-muted font-semibold">Status</th>
                  <th className="text-right px-3 py-2.5 text-text-muted font-semibold">Spend</th>
                  <th className="text-right px-3 py-2.5 text-text-muted font-semibold">Impressions</th>
                  <th className="text-right px-3 py-2.5 text-text-muted font-semibold">Clicks</th>
                  <th className="text-right px-3 py-2.5 text-text-muted font-semibold">CTR</th>
                  <th className="text-right px-3 py-2.5 text-text-muted font-semibold">CPC</th>
                  <th className="text-right px-4 py-2.5 text-text-muted font-semibold">Results</th>
                </tr>
              </thead>
              <tbody>
                {allCampaigns.map(c => (
                  <tr key={c.id} className="border-b border-border-subtle last:border-0 hover:bg-glass-1 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-text-primary font-semibold truncate max-w-[200px]">{c.name}</p>
                      <p className="text-[10px] text-text-muted">{formatObjective(c.objective)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <PlatformBadge platform={c.platform} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-text-primary">${fmtNum(c.spend)}</td>
                    <td className="px-3 py-2.5 text-right text-text-secondary">{fmtNum(c.impressions)}</td>
                    <td className="px-3 py-2.5 text-right text-text-secondary">{fmtNum(c.clicks)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={c.ctr > 2 ? 'text-success' : c.ctr > 0.5 ? 'text-text-secondary' : 'text-text-muted'}>
                        {c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-text-secondary">{c.cpc > 0 ? `$${c.cpc.toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-brand">{fmtNum(c.results)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, color, bgColor }: {
  icon: typeof DollarSign; label: string; value: string; color: string; bgColor: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} strokeWidth={1.6} />
        </div>
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-lg font-extrabold text-text-primary">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className="text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: 'facebook' | 'tiktok' }) {
  if (platform === 'facebook') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#1877F2] bg-[rgba(24,119,242,0.08)] border border-[rgba(24,119,242,0.15)]">
        <Facebook className="w-2.5 h-2.5" /> Meta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-text-secondary bg-bg-elevated border border-border-subtle">
      <Video className="w-2.5 h-2.5" strokeWidth={1.6} /> TikTok
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() ?? '';
  const isActive = s === 'ACTIVE';
  const isPaused = s === 'PAUSED';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      isActive ? 'text-success bg-success-soft border-[rgba(16,185,129,0.15)]'
      : isPaused ? 'text-[#F59E0B] bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.15)]'
      : 'text-text-muted bg-bg-elevated border-border-subtle'
    }`}>
      {isActive ? '● Active' : isPaused ? '◆ Paused' : status || 'Unknown'}
    </span>
  );
}

function formatObjective(obj?: string) {
  const map: Record<string, string> = {
    OUTCOME_LEADS: 'Leads', OUTCOME_TRAFFIC: 'Traffic',
    OUTCOME_AWARENESS: 'Awareness', OUTCOME_ENGAGEMENT: 'Engagement',
    OUTCOME_SALES: 'Sales', TRAFFIC: 'Traffic', REACH: 'Reach',
    CONVERSIONS: 'Conversions', VIDEO_VIEWS: 'Video Views',
    LEAD_GENERATION: 'Leads',
  };
  return map[obj ?? ''] || obj || '—';
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}
