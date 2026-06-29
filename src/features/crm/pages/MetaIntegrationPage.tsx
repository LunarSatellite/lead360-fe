import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Facebook, Loader2, CheckCircle, RefreshCw, Zap, Plus,
  BarChart3, TrendingUp, Users, DollarSign,
  Eye, Play, Pause, ExternalLink, ChevronRight,
  Target, Pencil, Check, X, Bot, Copy, Link, Settings,
} from 'lucide-react';
import { apiClient } from '@/shared/lib/api-client';
import { CreateCampaignDrawer } from '../components/CreateCampaignDrawer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetaIntegration {
  id: string; appId: string; pageId: string | null; pixelId: string | null;
  isActive: boolean; lastWebhookAt: string | null; totalLeadsReceived: number;
  totalConversionsSent: number; hasPageToken: boolean; hasCapiToken: boolean;
  webhookUrl: string;
}

interface FbAdAccount {
  id: string; adAccountId: string; businessName: string | null;
  currency: string | null; isActive: boolean; hasToken: boolean;
  lastSyncedAt: string | null; totalCampaignsSynced: number;
}

interface FbAdCampaign {
  id: string; fbCampaignId: string; name: string; objective: string | null;
  fbStatus: string; dailyBudget: number | null; lifetimeBudget: number | null;
  budgetCurrency: string | null; startTime: string | null; stopTime: string | null;
  impressions: number; clicks: number; spend: number; reach: number;
  ctr: number | null; cpc: number | null; frequency: number | null;
  leadsCount: number; attributedRevenue: number; crmLeadsCount: number;
  insightsSyncedAt: string | null; fbAdSetId: string | null;
  targetingSummaryJson: string | null; createdFromOmniFlow: boolean;
  createdAt: string; updatedAt: string;
}

interface FbAggregate {
  totalCampaigns: number; activeCampaigns: number; totalSpend: number;
  totalImpressions: number; totalClicks: number; totalReach: number;
  totalLeads: number; totalRevenue: number; overallCtr: number | null;
  overallCpc: number | null; overallRoas: number | null; totalCrmLeads: number;
}

interface CrmLead {
  id: string; customerName: string | null; customerEmail: string | null;
  customerPhone: string | null; stage: number; score: number;
  intentSummary: string | null; createdAt: string; lastActivityAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const api = {
  metaGet:    ()  => apiClient.get<MetaIntegration | null>('/v1/meta/integration'),
  accountGet: ()  => apiClient.get<FbAdAccount | null>('/v1/crm/fb-ads/account'),
  accountConnect: (d: any) => apiClient.post<FbAdAccount>('/v1/crm/fb-ads/account', d),
  accountDisconnect: () => apiClient.delete('/v1/crm/fb-ads/account'),
  campaigns:  ()  => apiClient.get<FbAdCampaign[]>('/v1/crm/fb-ads/campaigns'),
  sync:       ()  => apiClient.post<any>('/v1/crm/fb-ads/campaigns/sync'),
  aggregate:  ()  => apiClient.get<FbAggregate>('/v1/crm/fb-ads/aggregate'),
  toggle:     (id: string) => apiClient.post(`/v1/crm/fb-ads/campaigns/${id}/toggle-status`),
  budget:     (id: string, data: any) => apiClient.patch(`/v1/crm/fb-ads/campaigns/${id}/budget`, data),
  crmLeads:   (fbCampaignId: string) => apiClient.get<CrmLead[]>(`/v1/crm/fb-ads/campaigns/${fbCampaignId}/crm-leads`),
  metaSave:   (d: any) => apiClient.post('/v1/meta/integration', d),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtN = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n);
const fmtMoney = (n: number, c = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n);
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString() : '—';

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_LEADS: 'Lead Gen', OUTCOME_TRAFFIC: 'Traffic',
  OUTCOME_AWARENESS: 'Awareness', OUTCOME_ENGAGEMENT: 'Engagement', OUTCOME_SALES: 'Sales',
};

const STAGE_LABELS: Record<number, string> = { 1:'New', 2:'Warm', 3:'Hot', 4:'Nurturing', 5:'Converted', 6:'Lost' };
const STAGE_COLORS: Record<number, string> = {
  1:'text-text-secondary bg-bg-elevated border-border-subtle',
  2:'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  3:'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  4:'text-brand bg-brand-soft border-border-glow',
  5:'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  6:'text-text-muted bg-bg-card border-border-subtle',
};

const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-all';
const labelCls = 'block text-xs font-semibold text-text-muted mb-1.5';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cfg = s === 'ACTIVE'
    ? { cls: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]', dot: 'bg-success' }
    : s === 'PAUSED'
    ? { cls: 'text-[#F59E0B] bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.25)]', dot: 'bg-[#F59E0B]' }
    : { cls: 'text-text-muted bg-bg-elevated border-border-subtle', dot: 'bg-text-muted' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status.toLowerCase()}
    </span>
  );
}

// ─── Metric Tile ──────────────────────────────────────────────────────────────

function Metric({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-bg-elevated border border-border-subtle p-4">
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${accent ?? 'text-text-primary'}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Left panel: Connection status cards ─────────────────────────────────────

function ConnectionCards({
  meta, account,
  onConnectAccount,
  onSetupWebhook,
}: { meta: MetaIntegration | null; account: FbAdAccount | null; onConnectAccount: () => void; onSetupWebhook: () => void }) {
  return (
    <div className="space-y-2">
      {/* Lead Ads (Meta page) */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(24,119,242,0.1)] flex items-center justify-center shrink-0">
          <Facebook className="w-4 h-4 text-[#1877F2]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-text-primary">Lead Ads Webhook</p>
          <p className="text-[10px] text-text-muted truncate">
            {meta?.isActive ? `Leads received: ${meta.totalLeadsReceived}` : 'Not connected'}
          </p>
        </div>
        <button onClick={onSetupWebhook}
          className="text-[10px] font-bold text-brand hover:underline shrink-0 flex items-center gap-0.5">
          {meta?.isActive ? <><Settings className="w-3 h-3" /> Manage</> : <><Link className="w-3 h-3" /> Setup</>}
        </button>
      </div>

      {/* Ad Account */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(24,119,242,0.1)] flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4 text-[#1877F2]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-text-primary">Ad Account</p>
          <p className="text-[10px] text-text-muted truncate">
            {account?.isActive
              ? `${account.businessName || account.adAccountId} · ${account.currency || 'USD'}`
              : 'Not connected'}
          </p>
        </div>
        {account?.isActive
          ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
          : <button onClick={onConnectAccount}
              className="text-[10px] font-bold text-brand hover:underline shrink-0">Connect</button>}
      </div>
    </div>
  );
}

// ─── Left panel: Campaign list ────────────────────────────────────────────────

function CampaignList({
  campaigns, loading, selected, onSelect, onCreateClick, onSyncClick, isSyncing,
}: {
  campaigns: FbAdCampaign[]; loading: boolean; selected: string | null;
  onSelect: (id: string) => void; onCreateClick: () => void;
  onSyncClick: () => void; isSyncing: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onCreateClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl bg-brand text-bg hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
        <button onClick={onSyncClick} disabled={isSyncing}
          className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium disabled:opacity-50 transition-all">
          {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-medium bg-bg-card p-5 text-center">
          <BarChart3 className="w-6 h-6 text-text-muted mx-auto mb-2" />
          <p className="text-xs font-semibold text-text-secondary">No campaigns</p>
          <p className="text-[10px] text-text-muted mt-0.5">Create one or sync from Meta</p>
        </div>
      )}

      {campaigns.map(c => {
        const isActive = selected === c.id;
        const spend = c.spend > 0 ? fmtMoney(c.spend, c.budgetCurrency || 'USD') : null;
        return (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className={`w-full text-left rounded-xl border p-3 transition-all ${
              isActive
                ? 'border-brand bg-brand-soft'
                : 'border-border-subtle bg-bg-card hover:border-border-medium hover:bg-bg-elevated'
            }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{c.name}</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {OBJECTIVE_LABELS[c.objective ?? ''] ?? c.objective ?? '—'}
                  {c.createdFromOmniFlow && ' · Lead360'}
                </p>
              </div>
              <StatusBadge status={c.fbStatus} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              {spend && <span className="text-[10px] font-bold text-text-primary">{spend}</span>}
              {c.crmLeadsCount > 0 && (
                <span className="text-[10px] font-semibold text-brand flex items-center gap-0.5">
                  <Users className="w-3 h-3" /> {c.crmLeadsCount}
                </span>
              )}
              {c.impressions > 0 && (
                <span className="text-[10px] text-text-muted">{fmtN(c.impressions)} imp</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Right panel: Empty state ─────────────────────────────────────────────────

function EmptyState({ aggregate, account }: { aggregate: FbAggregate | null; account: FbAdAccount | null }) {
  return (
    <div className="h-full flex flex-col">
      {/* Aggregate stats */}
      {aggregate && account?.isActive && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Metric label="Total Spend"   value={fmtMoney(aggregate.totalSpend, account.currency || 'USD')} accent="text-text-primary" />
          <Metric label="Impressions"   value={fmtN(aggregate.totalImpressions)} sub="lifetime" />
          <Metric label="Clicks"        value={fmtN(aggregate.totalClicks)} sub={aggregate.overallCtr != null ? `CTR ${aggregate.overallCtr.toFixed(2)}%` : undefined} />
          <Metric label="CRM Leads"     value={aggregate.totalCrmLeads} sub="via Lead360" accent="text-brand" />
          <Metric label="Active Campaigns" value={aggregate.activeCampaigns} sub={`of ${aggregate.totalCampaigns} total`} />
          <Metric label="Reach"         value={fmtN(aggregate.totalReach)} />
          <Metric label="CPC"           value={aggregate.overallCpc != null ? fmtMoney(aggregate.overallCpc, account.currency || 'USD') : '—'} />
          <Metric label="ROAS"          value={aggregate.overallRoas != null ? `${aggregate.overallRoas.toFixed(2)}x` : '—'} accent="text-success" />
        </div>
      )}

      {!account?.isActive && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(24,119,242,0.1)] border border-[rgba(24,119,242,0.2)] flex items-center justify-center mx-auto">
              <Facebook className="w-8 h-8 text-[#1877F2]" />
            </div>
            <p className="text-base font-bold text-text-primary">Connect Your Ad Account</p>
            <p className="text-sm text-text-muted">
              Pull live campaign analytics, create campaigns, manage budgets and targeting — all from Lead360.
            </p>
          </div>
        </div>
      )}

      {account?.isActive && aggregate?.totalCampaigns === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm space-y-3">
            <Zap className="w-10 h-10 text-brand mx-auto" />
            <p className="text-base font-bold text-text-primary">Ready to launch</p>
            <p className="text-sm text-text-muted">Create your first campaign or sync existing ones from Meta.</p>
          </div>
        </div>
      )}

      {account?.isActive && aggregate && aggregate.totalCampaigns > 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-text-muted">← Select a campaign to manage it</p>
        </div>
      )}
    </div>
  );
}

// ─── Right panel: Campaign detail workspace ───────────────────────────────────

function CampaignDetail({
  campaign, currency, onToggled, onBudgetUpdated,
}: {
  campaign: FbAdCampaign;
  currency: string;
  onToggled: (newStatus: string) => void;
  onBudgetUpdated: (newBudget: number, type: string) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editBudget, setEditBudget] = useState(false);
  const [budgetVal, setBudgetVal] = useState(String(campaign.dailyBudget ?? campaign.lifetimeBudget ?? ''));
  const [budgetType, setBudgetType] = useState(campaign.lifetimeBudget ? 'lifetime' : 'daily');
  const [crmTab, setCrmTab] = useState<'metrics' | 'leads'>('metrics');

  const toggleMut = useMutation({
    mutationFn: () => api.toggle(campaign.id),
    onSuccess: (res: any) => {
      const newStatus = res?.data?.newStatus ?? (campaign.fbStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
      toast.success(`Campaign ${newStatus.toLowerCase()}`);
      onToggled(newStatus);
      qc.invalidateQueries({ queryKey: ['fb-campaigns'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Toggle failed'),
  });

  const budgetMut = useMutation({
    mutationFn: () => api.budget(campaign.id, { budgetType, budget: parseFloat(budgetVal) }),
    onSuccess: () => {
      toast.success('Budget updated on Meta!');
      setEditBudget(false);
      onBudgetUpdated(parseFloat(budgetVal), budgetType);
      qc.invalidateQueries({ queryKey: ['fb-campaigns'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Budget update failed'),
  });

  const { data: crmLeadsRaw, isLoading: crmLoading } = useQuery({
    queryKey: ['fb-crm-leads', campaign.fbCampaignId],
    queryFn: () => api.crmLeads(campaign.fbCampaignId),
    enabled: crmTab === 'leads',
  });
  const crmLeads = (crmLeadsRaw as unknown as CrmLead[]) ?? [];

  const targeting = (() => {
    try { return JSON.parse(campaign.targetingSummaryJson ?? '{}'); }
    catch { return null; }
  })();

  const budget = campaign.lifetimeBudget
    ? `${fmtMoney(campaign.lifetimeBudget, currency)} lifetime`
    : campaign.dailyBudget
    ? `${fmtMoney(campaign.dailyBudget, currency)}/day`
    : '—';

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      {/* Campaign header */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-text-primary">{campaign.name}</h2>
              <StatusBadge status={campaign.fbStatus} />
              {campaign.createdFromOmniFlow && (
                <span className="text-[10px] font-bold text-brand bg-brand-soft border border-border-glow px-2 py-0.5 rounded-full">
                  Lead360
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <span className="text-xs text-text-muted">
                {OBJECTIVE_LABELS[campaign.objective ?? ''] ?? campaign.objective ?? 'Campaign'}
              </span>
              <span className="text-xs text-text-muted">Started {fmtDate(campaign.startTime)}</span>
              {campaign.stopTime && <span className="text-xs text-text-muted">Ends {fmtDate(campaign.stopTime)}</span>}
            </div>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button onClick={() => toggleMut.mutate()} disabled={toggleMut.isPending}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                campaign.fbStatus === 'ACTIVE'
                  ? 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.2)]'
                  : 'bg-success-soft text-success border border-[rgba(34,197,94,0.2)] hover:bg-[rgba(34,197,94,0.2)]'
              }`}>
              {toggleMut.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : campaign.fbStatus === 'ACTIVE'
                ? <><Pause className="w-4 h-4" /> Pause</>
                : <><Play className="w-4 h-4" /> Resume</>}
            </button>
            <a href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${campaign.fbCampaignId}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-subtle text-xs font-semibold text-text-secondary hover:border-border-medium transition-all">
              <ExternalLink className="w-3.5 h-3.5" /> Ads Manager
            </a>
          </div>
        </div>

        {/* Budget row */}
        <div className="mt-4 pt-4 border-t border-border-subtle">
          {!editBudget ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-text-muted" />
                <span className="text-sm font-bold text-text-primary">{budget}</span>
              </div>
              {campaign.fbAdSetId && (
                <button onClick={() => { setEditBudget(true); setBudgetVal(String(campaign.dailyBudget ?? campaign.lifetimeBudget ?? '')); }}
                  className="flex items-center gap-1 text-xs text-brand hover:underline">
                  <Pencil className="w-3 h-3" /> Edit budget
                </button>
              )}
              {!campaign.fbAdSetId && (
                <span className="text-xs text-text-muted">(Sync to enable budget editing)</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <select value={budgetType} onChange={e => setBudgetType(e.target.value)}
                className="text-xs bg-bg-elevated border border-border-subtle rounded-lg px-2 py-1.5 text-text-secondary focus:outline-none focus:border-brand">
                <option value="daily">Daily</option>
                <option value="lifetime">Lifetime</option>
              </select>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">{currency}</span>
                <input type="number" min={1} step={0.01} value={budgetVal}
                  onChange={e => setBudgetVal(e.target.value)}
                  className="pl-10 pr-3 py-1.5 text-sm bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-brand w-28"
                />
              </div>
              <button onClick={() => budgetMut.mutate()} disabled={budgetMut.isPending || !budgetVal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-bg text-xs font-bold disabled:opacity-50">
                {budgetMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button onClick={() => setEditBudget(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Metrics / CRM Leads */}
      <div className="flex gap-1 border-b border-border-subtle">
        {[
          { key: 'metrics', label: 'Performance', icon: BarChart3 },
          { key: 'leads',   label: `CRM Leads${campaign.crmLeadsCount > 0 ? ` (${campaign.crmLeadsCount})` : ''}`, icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setCrmTab(key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
              crmTab === key ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {crmTab === 'metrics' && (
        <div className="space-y-4">
          {/* Metric grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Impressions"   value={fmtN(campaign.impressions)} />
            <Metric label="Clicks"        value={fmtN(campaign.clicks)} />
            <Metric label="Spend"         value={fmtMoney(campaign.spend, currency)} accent="text-text-primary" />
            <Metric label="Reach"         value={fmtN(campaign.reach)} />
            <Metric label="CTR"           value={campaign.ctr != null ? `${campaign.ctr.toFixed(2)}%` : '—'} accent={campaign.ctr && campaign.ctr > 2 ? 'text-success' : undefined} />
            <Metric label="CPC"           value={campaign.cpc != null ? fmtMoney(campaign.cpc, currency) : '—'} />
            <Metric label="Frequency"     value={campaign.frequency != null ? campaign.frequency.toFixed(2) : '—'} />
            <Metric label="Meta Leads"    value={campaign.leadsCount} sub="via lead forms" />
          </div>

          {/* Revenue */}
          {campaign.attributedRevenue > 0 && (
            <div className="rounded-2xl border border-[rgba(34,197,94,0.2)] bg-success-soft p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-success uppercase tracking-wider">Attributed Revenue</p>
                <p className="text-2xl font-extrabold text-success mt-1">{fmtMoney(campaign.attributedRevenue, currency)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success opacity-40" />
            </div>
          )}

          {/* Targeting summary */}
          {targeting && (
            <div className="rounded-2xl border border-border-subtle bg-bg-card p-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Audience Targeting
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-text-muted font-semibold">Age</p>
                  <p className="text-text-primary mt-0.5">{targeting.ageMin ?? 18}–{targeting.ageMax ?? 65}</p>
                </div>
                {targeting.genders?.length > 0 && (
                  <div>
                    <p className="text-text-muted font-semibold">Gender</p>
                    <p className="text-text-primary mt-0.5">{targeting.genders.map((g: number) => g === 1 ? 'Male' : 'Female').join(', ')}</p>
                  </div>
                )}
                {targeting.countries?.length > 0 && (
                  <div>
                    <p className="text-text-muted font-semibold">Countries</p>
                    <p className="text-text-primary mt-0.5">{targeting.countries.join(', ')}</p>
                  </div>
                )}
                {targeting.platforms?.length > 0 && (
                  <div>
                    <p className="text-text-muted font-semibold">Platforms</p>
                    <p className="text-text-primary mt-0.5 capitalize">{targeting.platforms.join(', ')}</p>
                  </div>
                )}
                {targeting.interests?.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-text-muted font-semibold mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {targeting.interests.map((i: string) => (
                        <span key={i} className="px-2 py-0.5 bg-brand-soft text-brand border border-border-glow rounded-full text-[10px] font-semibold">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {campaign.insightsSyncedAt && (
            <p className="text-[10px] text-text-muted text-right">
              Insights last synced {new Date(campaign.insightsSyncedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {crmTab === 'leads' && (
        <div className="space-y-3">
          {/* CRM leads header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-primary">
              {campaign.crmLeadsCount} CRM Lead{campaign.crmLeadsCount !== 1 ? 's' : ''} attributed to this campaign
            </p>
            {campaign.crmLeadsCount > 0 && (
              <button onClick={() => navigate(`/dashboard/crm/leads`)}
                className="text-xs text-brand hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {crmLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          )}

          {!crmLoading && crmLeads.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border-medium bg-bg-card p-8 text-center">
              <Bot className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm font-semibold text-text-secondary">No CRM leads yet</p>
              <p className="text-xs text-text-muted mt-1">
                Leads will appear here when someone fills your lead form or your chatbot links them to this campaign.
              </p>
            </div>
          )}

          {crmLeads.map(lead => (
            <button key={lead.id} onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
              className="w-full text-left rounded-xl border border-border-subtle bg-bg-card px-4 py-3 hover:border-border-medium hover:bg-bg-elevated transition-all">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STAGE_COLORS[lead.stage]}`}>
                  {STAGE_LABELS[lead.stage] ?? 'Unknown'}
                </span>
                <span className="text-sm font-bold text-text-primary flex-1 truncate">
                  {lead.customerName || lead.customerEmail || 'Unknown'}
                </span>
                {/* Score bar */}
                <div className="flex items-center gap-2 w-20">
                  <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div className={`h-full rounded-full ${lead.score >= 70 ? 'bg-brand' : lead.score >= 40 ? 'bg-[#F59E0B]' : 'bg-text-muted'}`}
                      style={{ width: `${lead.score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-text-muted">{lead.score}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
              </div>
              {lead.intentSummary && (
                <p className="text-[10px] text-text-muted italic mt-1.5 truncate pl-0.5">{lead.intentSummary}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Connect Account Drawer ───────────────────────────────────────────────────

function ConnectAccountDrawer({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ adAccountId: '', accessToken: '', businessName: '', currency: 'USD' });
  const [showToken, setShowToken] = useState(false);

  const mut = useMutation({
    mutationFn: () => api.accountConnect(form),
    onSuccess: () => {
      toast.success('Ad account connected!');
      qc.invalidateQueries({ queryKey: ['fb-account'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to connect'),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-bg-card border-l border-border-subtle flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            <Facebook className="w-5 h-5 text-[#1877F2]" /> Connect Ad Account
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-xl bg-brand-soft border border-border-glow p-4 text-xs text-text-secondary space-y-1">
            <p className="font-bold text-brand">How to get your credentials:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Go to Business Settings → System Users</li>
              <li>Create System User → Generate New Token</li>
              <li>Add <code className="text-brand">ads_read</code> + <code className="text-brand">ads_management</code> permissions</li>
              <li>Copy token + Ad Account ID from Ads Manager</li>
            </ol>
          </div>
          <div>
            <label className={labelCls}>Ad Account ID *</label>
            <input value={form.adAccountId} onChange={e => setForm(f => ({ ...f, adAccountId: e.target.value }))}
              placeholder="act_123456789" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Access Token *</label>
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} value={form.accessToken}
                onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                placeholder="EAABsbCS..." className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Business Name</label>
            <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              placeholder="Acme Marketing" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              placeholder="USD" className={inputCls} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border-subtle flex gap-3">
          <button onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.adAccountId || !form.accessToken}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1877F2] text-white font-bold text-sm disabled:opacity-50 transition-all">
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Facebook className="w-4 h-4" />}
            Connect & Save
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-bg-elevated transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Webhook Setup Drawer ─────────────────────────────────────────────────────

function WebhookSetupDrawer({ meta, onClose }: { meta: MetaIntegration | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    appId: meta?.appId ?? '',
    pageAccessToken: '',
    pixelId: meta?.pixelId ?? '',
    capiToken: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [showCapi, setShowCapi] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = meta?.webhookUrl ?? `${window.location.origin}/webhooks/meta/leads`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const mut = useMutation({
    mutationFn: () => api.metaSave({
      appId: form.appId,
      pageAccessToken: form.pageAccessToken || undefined,
      pixelId: form.pixelId || undefined,
      capiToken: form.capiToken || undefined,
    }),
    onSuccess: () => {
      toast.success('Webhook configuration saved!');
      qc.invalidateQueries({ queryKey: ['meta-integration'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to save configuration'),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-bg-card border-l border-border-subtle flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            <Link className="w-5 h-5 text-[#1877F2]" /> Lead Ads Webhook Setup
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Status chips */}
          {meta?.isActive && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border text-success bg-success-soft border-[rgba(34,197,94,0.2)]">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
              {meta.hasPageToken && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border text-brand bg-brand-soft border-border-glow">
                  <CheckCircle className="w-3 h-3" /> Page Token Set
                </span>
              )}
              {meta.hasCapiToken && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border text-[#F59E0B] bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.25)]">
                  <CheckCircle className="w-3 h-3" /> CAPI Token Set
                </span>
              )}
              {meta.pixelId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border text-text-secondary bg-bg-elevated border-border-subtle">
                  <Target className="w-3 h-3" /> Pixel Configured
                </span>
              )}
            </div>
          )}

          {/* Webhook URL */}
          <div>
            <label className={labelCls}>Webhook URL <span className="text-text-muted font-normal">(copy to Facebook App settings)</span></label>
            <div className="flex gap-2">
              <input readOnly value={webhookUrl}
                className={inputCls + ' flex-1 bg-bg font-mono text-[11px] text-text-secondary cursor-text select-all'} />
              <button onClick={handleCopy}
                className="px-3 py-2.5 rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium hover:text-text-primary transition-all shrink-0">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Hint */}
          <div className="rounded-xl bg-brand-soft border border-border-glow p-4 text-xs text-text-secondary space-y-1">
            <p className="font-bold text-brand">Setup steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>In Facebook Developers, open your App → <strong>Webhooks</strong></li>
              <li>Add a Page subscription — paste the Webhook URL above</li>
              <li>Generate a <strong>Page Access Token</strong> (Messenger or Leads Access)</li>
              <li>Optionally link your <strong>Facebook Pixel ID</strong> for conversions</li>
              <li>Optionally add a <strong>Conversions API token</strong> for server-side events</li>
            </ol>
          </div>

          {/* App ID */}
          <div>
            <label className={labelCls}>Facebook App ID *</label>
            <input value={form.appId} onChange={e => setForm(f => ({ ...f, appId: e.target.value }))}
              placeholder="1234567890123456" className={inputCls} />
            {meta?.appId && <p className="text-[10px] text-text-muted mt-1">Current: {meta.appId}</p>}
          </div>

          {/* Page Access Token */}
          <div>
            <label className={labelCls}>Page Access Token</label>
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} value={form.pageAccessToken}
                onChange={e => setForm(f => ({ ...f, pageAccessToken: e.target.value }))}
                placeholder={meta?.hasPageToken ? '••••••• (leave blank to keep current)' : 'EAABsbCS...'}
                className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pixel ID */}
          <div>
            <label className={labelCls}>Facebook Pixel ID <span className="text-text-muted font-normal">(optional)</span></label>
            <input value={form.pixelId} onChange={e => setForm(f => ({ ...f, pixelId: e.target.value }))}
              placeholder="987654321098765" className={inputCls} />
          </div>

          {/* CAPI Token */}
          <div>
            <label className={labelCls}>Conversions API Token <span className="text-text-muted font-normal">(optional)</span></label>
            <div className="relative">
              <input type={showCapi ? 'text' : 'password'} value={form.capiToken}
                onChange={e => setForm(f => ({ ...f, capiToken: e.target.value }))}
                placeholder={meta?.hasCapiToken ? '••••••• (leave blank to keep current)' : 'EAABsbCS...'}
                className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowCapi(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats if active */}
          {meta?.isActive && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3 text-center">
                <p className="text-lg font-extrabold text-text-primary">{meta.totalLeadsReceived}</p>
                <p className="text-[10px] text-text-muted">Leads received</p>
              </div>
              <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3 text-center">
                <p className="text-lg font-extrabold text-text-primary">{meta.totalConversionsSent}</p>
                <p className="text-[10px] text-text-muted">Conversions sent</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex gap-3">
          <button onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.appId}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1877F2] text-white font-bold text-sm disabled:opacity-50 transition-all">
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            Save Configuration
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-bg-elevated transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Component() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  const { data: rawMeta } = useQuery({ queryKey: ['meta-integration'], queryFn: api.metaGet });
  const { data: rawAccount } = useQuery({ queryKey: ['fb-account'], queryFn: api.accountGet });
  const { data: rawCampaigns, isLoading: campaignsLoading } = useQuery({ queryKey: ['fb-campaigns'], queryFn: api.campaigns });
  const { data: rawAggregate } = useQuery({ queryKey: ['fb-aggregate'], queryFn: api.aggregate, enabled: !!(rawAccount as any)?.isActive });

  const meta      = rawMeta as unknown as MetaIntegration | null;
  const account   = rawAccount as unknown as FbAdAccount | null;
  const campaigns = (rawCampaigns as unknown as FbAdCampaign[]) ?? [];
  const aggregate = rawAggregate as unknown as FbAggregate | null;

  const selectedCampaign = campaigns.find(c => c.id === selectedId) ?? null;

  const syncMut = useMutation({
    mutationFn: api.sync,
    onSuccess: (res: any) => {
      toast.success(`Synced ${res?.campaignsSynced ?? 0} campaigns`);
      qc.invalidateQueries({ queryKey: ['fb-campaigns'] });
      qc.invalidateQueries({ queryKey: ['fb-aggregate'] });
      qc.invalidateQueries({ queryKey: ['fb-account'] });
    },
    onError: (e: any) => toast.error(e?.message || 'Sync failed'),
  });

  const handleToggled = (newStatus: string) => {
    qc.setQueryData(['fb-campaigns'], (old: any) =>
      Array.isArray(old)
        ? old.map((c: FbAdCampaign) => c.id === selectedId ? { ...c, fbStatus: newStatus } : c)
        : old
    );
  };

  const handleBudgetUpdated = (newBudget: number, type: string) => {
    qc.setQueryData(['fb-campaigns'], (old: any) =>
      Array.isArray(old)
        ? old.map((c: FbAdCampaign) => c.id === selectedId
            ? { ...c, dailyBudget: type === 'daily' ? newBudget : null, lifetimeBudget: type === 'lifetime' ? newBudget : null }
            : c)
        : old
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0">
            <Facebook className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-text-primary">Meta Ads</h2>
            <p className="text-xs text-text-muted">Facebook &amp; Instagram — Create, manage and track campaigns</p>
          </div>
        </div>
        <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-subtle text-xs font-semibold text-text-muted hover:text-text-primary hover:border-border-medium transition-all">
          <ExternalLink className="w-3.5 h-3.5" /> Open Ads Manager
        </a>
      </div>

      {/* Two-column workspace */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── Left panel (fixed 280px) ── */}
        <div className="w-[280px] shrink-0 flex flex-col gap-4 overflow-y-auto">
          <ConnectionCards meta={meta} account={account} onConnectAccount={() => setShowConnect(true)} onSetupWebhook={() => setShowWebhook(true)} />
          <div className="h-px bg-border-subtle" />
          <CampaignList
            campaigns={campaigns}
            loading={campaignsLoading}
            selected={selectedId}
            onSelect={setSelectedId}
            onCreateClick={() => setShowCreate(true)}
            onSyncClick={() => syncMut.mutate()}
            isSyncing={syncMut.isPending}
          />
        </div>

        {/* ── Right panel (flexible) ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {selectedCampaign
            ? <CampaignDetail
                campaign={selectedCampaign}
                currency={account?.currency || 'USD'}
                onToggled={handleToggled}
                onBudgetUpdated={handleBudgetUpdated}
              />
            : <EmptyState aggregate={aggregate} account={account} />
          }
        </div>
      </div>

      {/* Drawers */}
      {showCreate  && <CreateCampaignDrawer onClose={() => setShowCreate(false)} />}
      {showConnect && <ConnectAccountDrawer onClose={() => setShowConnect(false)} />}
      {showWebhook && <WebhookSetupDrawer meta={meta} onClose={() => setShowWebhook(false)} />}
    </div>
  );
}
