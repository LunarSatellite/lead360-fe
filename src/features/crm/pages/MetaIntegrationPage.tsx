import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Facebook, Loader2, CheckCircle, XCircle, RefreshCw, Zap, Plus,
  BarChart3, TrendingUp, Users, DollarSign,
  Eye, Play, Pause, ExternalLink, ChevronRight,
  Target, Pencil, Check, X, Bot, Copy, Link, Settings, AlertTriangle, Circle, Save,
  Instagram, Video, Heart, Share2, MessageCircle, ThumbsUp,
  Youtube, Twitter, Linkedin, Megaphone, Repeat2, UserPlus,
} from 'lucide-react';
import { apiClient } from '@/shared/lib/api-client';
import { AiCampaignWizard } from '../components/AiCampaignWizard';
import { AdsReportTab } from '../components/AdsReportTab';

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

interface MetaSetupCheck { key: string; label: string; status: string; detail: string | null; }
interface MetaSetupStatus {
  readyToRunAds: boolean; readyForLeadAds: boolean; readyForConversions: boolean;
  checks: MetaSetupCheck[];
}

interface FbOAuthConnect {
  adAccountId: string; adAccountName: string | null; currency: string | null;
  pageId: string | null; pageName: string | null;
  otherAdAccounts: number; otherPages: number; message: string;
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
  setupStatus:()  => apiClient.get<MetaSetupStatus>('/v1/meta/integration/setup-status'),
  oauthUrl:   (redirectUri: string) => apiClient.get<{ authUrl: string; state: string }>(`/v1/crm/fb-ads/oauth/url?redirectUri=${encodeURIComponent(redirectUri)}`),
  oauthCallback: (d: { code: string; redirectUri: string; state?: string }) => apiClient.post<FbOAuthConnect>('/v1/crm/fb-ads/oauth/callback', d),
};

// ─── New Platform Types ───────────────────────────────────────────────────────

interface GoogleAdAccount { id: string; customerId: string; businessName: string | null; currency: string | null; isActive: boolean; lastSyncedAt: string | null; totalCampaignsSynced: number; }
interface GoogleAdCampaign { id: string; googleCampaignId: string; name: string; campaignType: string | null; status: string; dailyBudget: number | null; budgetCurrency: string | null; impressions: number; clicks: number; spend: number; ctr: number | null; cpc: number | null; conversions: number; roas: number | null; createdFromOmniFlow: boolean; createdAt: string; }
interface GoogleAdAggregate { totalCampaigns: number; activeCampaigns: number; totalSpend: number; totalImpressions: number; totalClicks: number; totalConversions: number; overallCtr: number | null; overallCpc: number | null; }

interface TwitterAdAccount { id: string; twitterAccountId: string; businessName: string | null; currency: string | null; isActive: boolean; lastSyncedAt: string | null; }
interface TwitterAdCampaign { id: string; twitterCampaignId: string; name: string; objective: string | null; status: string; dailyBudget: number | null; budgetCurrency: string | null; impressions: number; clicks: number; spend: number; retweets: number; likes: number; replies: number; videoViews: number; ctr: number | null; cpc: number | null; createdFromOmniFlow: boolean; createdAt: string; }
interface TwitterAdAggregate { totalCampaigns: number; activeCampaigns: number; totalSpend: number; totalImpressions: number; totalClicks: number; totalRetweets: number; totalLikes: number; }

interface LinkedInAdAccount { id: string; adAccountUrn: string; businessName: string | null; currency: string | null; isActive: boolean; lastSyncedAt: string | null; }
interface LinkedInAdCampaign { id: string; linkedInCampaignId: string; name: string; objective: string | null; linkedInStatus: string; dailyBudget: number | null; budgetCurrency: string | null; impressions: number; clicks: number; spend: number; reactions: number; shares: number; comments: number; videoViews: number; leadsCount: number; ctr: number | null; createdFromOmniFlow: boolean; createdAt: string; }
interface LinkedInAdAggregate { totalCampaigns: number; activeCampaigns: number; totalSpend: number; totalImpressions: number; totalClicks: number; totalLeads: number; totalReactions: number; }

interface YouTubeAccount { id: string; channelId: string; channelTitle: string | null; channelThumbnailUrl: string | null; isActive: boolean; hasToken: boolean; subscriberCount: number | null; totalViewCount: number | null; videoCount: number | null; lastSyncedAt: string | null; totalVideosSynced: number; }
interface YouTubeVideo { id: string; youTubeVideoId: string; title: string; description: string | null; thumbnailUrl: string | null; privacyStatus: string; youTubeStatus: string; publishedAt: string | null; viewCount: number; likeCount: number; commentCount: number; shareCount: number; estimatedMinutesWatched: number; averageViewPercentage: number | null; createdFromOmniFlow: boolean; createdAt: string; }
interface YouTubeAggregate { totalVideos: number; publishedVideos: number; totalViews: number; totalLikes: number; totalComments: number; totalShares: number; totalEstimatedMinutesWatched: number; totalSubscribers: number | null; avgViewPercentage: number | null; }

interface SocialPostResult {
  postId: string; platform: string; isScheduled: boolean; postUrl: string | null; message: string;
}

const socialApi = {
  createPost: (d: { message?: string; imageUrl?: string; scheduledAt?: string; platform: string }) =>
    apiClient.post<SocialPostResult>('/v1/crm/social/posts', d),
};

const credApi = {
  get:  (platform: string) => apiClient.get<{ platform: string; clientId?: string; hasSecret: boolean; extraDataJson?: string; isConfigured: boolean }>(`/v1/crm/ad-platform-credentials/${platform}`),
  save: (platform: string, d: { clientId?: string; clientSecret?: string; extraDataJson?: string }) =>
    apiClient.put(`/v1/crm/ad-platform-credentials/${platform}`, d),
};

const googleApi = {
  accountGet:    () => apiClient.get<GoogleAdAccount | null>('/v1/crm/google-ads/account'),
  campaigns:     () => apiClient.get<GoogleAdCampaign[]>('/v1/crm/google-ads/campaigns'),
  sync:          () => apiClient.post<any>('/v1/crm/google-ads/campaigns/sync'),
  aggregate:     () => apiClient.get<GoogleAdAggregate>('/v1/crm/google-ads/aggregate'),
  oauthUrl:      (r: string) => apiClient.get<{ authUrl: string; state: string }>(`/v1/crm/google-ads/oauth/url?redirectUri=${encodeURIComponent(r)}`),
  oauthCallback: (d: { code: string; redirectUri: string; state?: string }) => apiClient.post<any>('/v1/crm/google-ads/oauth/callback', d),
  disconnect:    () => apiClient.delete('/v1/crm/google-ads/account'),
};

const twitterApi = {
  accountGet:    () => apiClient.get<TwitterAdAccount | null>('/v1/crm/twitter-ads/account'),
  campaigns:     () => apiClient.get<TwitterAdCampaign[]>('/v1/crm/twitter-ads/campaigns'),
  sync:          () => apiClient.post<any>('/v1/crm/twitter-ads/campaigns/sync'),
  aggregate:     () => apiClient.get<TwitterAdAggregate>('/v1/crm/twitter-ads/aggregate'),
  oauthUrl:      (r: string) => apiClient.get<{ authUrl: string; state: string }>(`/v1/crm/twitter-ads/oauth/url?redirectUri=${encodeURIComponent(r)}`),
  oauthCallback: (d: { code: string; redirectUri: string; state?: string; codeVerifier?: string }) => apiClient.post<any>('/v1/crm/twitter-ads/oauth/callback', d),
  disconnect:    () => apiClient.delete('/v1/crm/twitter-ads/account'),
};

const linkedInApi = {
  accountGet:    () => apiClient.get<LinkedInAdAccount | null>('/v1/crm/linkedin-ads/account'),
  campaigns:     () => apiClient.get<LinkedInAdCampaign[]>('/v1/crm/linkedin-ads/campaigns'),
  sync:          () => apiClient.post<any>('/v1/crm/linkedin-ads/campaigns/sync'),
  aggregate:     () => apiClient.get<LinkedInAdAggregate>('/v1/crm/linkedin-ads/aggregate'),
  oauthUrl:      (r: string) => apiClient.get<{ authUrl: string; state: string }>(`/v1/crm/linkedin-ads/oauth/url?redirectUri=${encodeURIComponent(r)}`),
  oauthCallback: (d: { code: string; redirectUri: string; state?: string }) => apiClient.post<any>('/v1/crm/linkedin-ads/oauth/callback', d),
  disconnect:    () => apiClient.delete('/v1/crm/linkedin-ads/account'),
};

const youtubeApi = {
  accountGet:    () => apiClient.get<YouTubeAccount | null>('/v1/crm/youtube/account'),
  videos:        () => apiClient.get<YouTubeVideo[]>('/v1/crm/youtube/videos'),
  aggregate:     () => apiClient.get<YouTubeAggregate>('/v1/crm/youtube/aggregate'),
  sync:          () => apiClient.post<any>('/v1/crm/youtube/videos/sync'),
  oauthUrl:      (r: string) => apiClient.get<{ authUrl: string; state: string }>(`/v1/crm/youtube/oauth/url?redirectUri=${encodeURIComponent(r)}`),
  oauthCallback: (d: { code: string; redirectUri: string; state?: string }) => apiClient.post<YouTubeAccount>('/v1/crm/youtube/oauth/callback', d),
  disconnect:    () => apiClient.delete('/v1/crm/youtube/account'),
};
const youtubeApiShape = youtubeApi;

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

// ─── Left panel: Setup checklist ──────────────────────────────────────────────

function CheckIcon({ status }: { status: string }) {
  if (status === 'ok')   return <CheckCircle className="w-4 h-4 text-success shrink-0" />;
  if (status === 'fail') return <XCircle className="w-4 h-4 text-danger shrink-0" />;
  if (status === 'warn') return <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />;
  return <Circle className="w-4 h-4 text-text-muted shrink-0" />;
}

function SetupChecklist() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['meta-setup-status'],
    queryFn: api.setupStatus,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const status = data as unknown as MetaSetupStatus | undefined;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-primary">Setup checklist</p>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-1 text-[10px] font-semibold text-brand hover:underline disabled:opacity-50">
          {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Re-check
        </button>
      </div>

      {!status && isFetching && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
        </div>
      )}

      {status && (
        <>
          <div className="space-y-2">
            {status.checks.map(c => (
              <div key={c.key} className="flex items-start gap-2">
                <CheckIcon status={c.status} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-text-primary leading-tight">{c.label}</p>
                  {c.detail && <p className="text-[10px] text-text-muted leading-snug mt-0.5">{c.detail}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
            status.readyToRunAds
              ? 'bg-success-soft text-success border border-[rgba(34,197,94,0.2)]'
              : 'bg-bg-elevated text-text-muted border border-border-subtle'
          }`}>
            {status.readyToRunAds
              ? <><CheckCircle className="w-3 h-3" /> Ready to run ads</>
              : <><Circle className="w-3 h-3" /> Connect Page + Ad account to run ads</>}
          </div>
        </>
      )}
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
                  {c.createdFromOmniFlow && ' · OmniFlow'}
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
                  OmniFlow
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

  const startOAuth = async () => {
    try {
      const redirectUri = window.location.origin + window.location.pathname;
      const res = (await api.oauthUrl(redirectUri)) as unknown as { authUrl: string; state: string };
      sessionStorage.setItem('fb_oauth_redirect', redirectUri);
      sessionStorage.setItem('fb_oauth_state', res.state);
      window.location.href = res.authUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start Facebook connect');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pr-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="drawer-slide-in relative w-[640px] flex flex-col overflow-hidden"
        style={{
          borderRadius: 18,
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,217,138,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 24px rgba(0,217,138,0.25), inset 0 1px 0 rgba(0,255,163,0.05)',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00D98A 35%, #00FFA3 65%, transparent)', flexShrink: 0 }} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-base font-extrabold leading-tight flex items-center gap-2" style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              <Facebook className="w-5 h-5 text-[#1877F2]" style={{ WebkitTextFillColor: 'unset' }} /> Connect Ad Account
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Link your Meta ad account to run campaigns</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* One-click OAuth */}
          <button onClick={startOAuth}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1877F2] text-white font-bold text-sm hover:opacity-90 transition-all">
            <Facebook className="w-4 h-4" /> Connect with Facebook
          </button>
          <p className="text-[10px] text-text-muted text-center -mt-1">
            Requires your Meta App ID/Secret saved, and this page's URL added to the app's Valid OAuth Redirect URIs.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-[10px] text-text-muted">or enter manually</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

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
            <label className="block text-xs font-semibold text-text-secondary mb-1">Ad Account ID <span className="text-danger">*</span></label>
            <input value={form.adAccountId} onChange={e => setForm(f => ({ ...f, adAccountId: e.target.value }))}
              placeholder="act_123456789"
              className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Access Token <span className="text-danger">*</span></label>
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} value={form.accessToken}
                onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                placeholder="EAABsbCS..."
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
                style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
              <button type="button" onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Business Name</label>
            <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              placeholder="Acme Marketing"
              className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Currency</label>
            <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              placeholder="USD"
              className="w-full pl-3 pr-3 py-2 rounded-xl border border-[rgba(0,217,138,0.20)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)]"
              style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)' }} />
          </div>
        </div>
        <div className="shrink-0 px-6 py-4 border-t border-border-subtle flex gap-3">
          <button onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.adAccountId || !form.accessToken}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1877F2] text-white font-bold text-sm disabled:opacity-50 transition-all">
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Facebook className="w-4 h-4" />}
            Connect & Save
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border-subtle text-sm text-text-secondary hover:border-border-medium transition-all">
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

// ─── TikTok Ads types (local) ────────────────────────────────────────────────

interface TikTokAdAccount {
  id: string; advertiserId: string; businessName?: string;
  isActive: boolean; hasToken: boolean; lastSyncedAt?: string; totalCampaignsSynced: number;
}

interface TikTokAdCampaign {
  id: string; tikTokCampaignId: string; name: string; objective?: string;
  status: string; dailyBudget?: number; lifetimeBudget?: number; budgetCurrency?: string;
  startTime?: string; stopTime?: string;
  impressions: number; clicks: number; spend: number; reach: number;
  ctr?: number; cpc?: number; conversions: number; costPerConversion?: number;
  videoViews: number; likes: number; shares: number; comments: number;
  insightsSyncedAt?: string; createdFromOmniFlow: boolean; createdAt: string; updatedAt: string;
}

interface TikTokAggregate {
  totalCampaigns: number; activeCampaigns: number; totalSpend: number;
  totalImpressions: number; totalClicks: number; totalReach: number;
  totalConversions: number; totalVideoViews: number;
  totalLikes: number; totalShares: number; totalComments: number;
  overallCtr?: number; overallCpc?: number;
}

const ttApi = {
  accountGet: () => apiClient.get<TikTokAdAccount | null>('/v1/crm/tiktok-ads/account'),
  accountConnect: (d: any) => apiClient.post<TikTokAdAccount>('/v1/crm/tiktok-ads/account', d),
  accountDisconnect: () => apiClient.delete('/v1/crm/tiktok-ads/account'),
  campaigns: () => apiClient.get<TikTokAdCampaign[]>('/v1/crm/tiktok-ads/campaigns'),
  sync: () => apiClient.post<any>('/v1/crm/tiktok-ads/campaigns/sync', {}),
  aggregate: () => apiClient.get<TikTokAggregate>('/v1/crm/tiktok-ads/aggregate'),
};

// ─── Post Composer Drawer ────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { label: string; icon: React.ReactElement; color: string; note?: string; requiresImage?: boolean }> = {
  facebook:  { label: 'Facebook',    icon: <Facebook  className="w-5 h-5 text-[#1877F2]" strokeWidth={1.6} />, color: '#1877F2' },
  instagram: { label: 'Instagram',   icon: <Instagram className="w-5 h-5 text-[#E4405F]" strokeWidth={1.6} />, color: '#E4405F',
    note: 'Instagram posts require an image URL. Make sure your Instagram Business account is linked to your Facebook Page.',
    requiresImage: true },
  tiktok:    { label: 'TikTok',      icon: <Video     className="w-5 h-5 text-text-secondary" strokeWidth={1.6} />, color: '#010101',
    note: 'TikTok organic posts require a video URL. Make sure your TikTok Business account credentials are configured.' },
  linkedin:  { label: 'LinkedIn',    icon: <Linkedin  className="w-5 h-5 text-[#0A66C2]" strokeWidth={1.6} />, color: '#0A66C2' },
  x:         { label: 'X (Twitter)', icon: <Twitter   className="w-5 h-5 text-text-primary" strokeWidth={1.6} />, color: '#000000',
    note: 'Posts to X are limited to 280 characters.' },
};

function PostComposer({ platform, onClose }: { platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'x'; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const meta = PLATFORM_META[platform] ?? PLATFORM_META.facebook;

  const mut = useMutation({
    mutationFn: () => {
      let scheduledAt: string | undefined;
      if (scheduleDate) {
        const dt = scheduleTime ? `${scheduleDate}T${scheduleTime}:00` : `${scheduleDate}T09:00:00`;
        scheduledAt = new Date(dt).toISOString();
      }
      return socialApi.createPost({
        platform,
        message: message || undefined,
        imageUrl: imageUrl || undefined,
        scheduledAt,
      });
    },
    onSuccess: (res: any) => {
      const r = res as unknown as SocialPostResult;
      toast.success(r.message || 'Post published!');
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to post'),
  });

  const canSubmit = !mut.isPending && (!!message || !!imageUrl);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-bg-card border-l border-border-subtle flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            {meta.icon}
            New {meta.label} Post
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Platform note */}
          {meta.note && (
            <div className="rounded-xl bg-brand-soft border border-border-glow p-3 text-xs text-text-secondary">
              {meta.note}
            </div>
          )}

          {/* Message / Caption */}
          <div>
            <label className={labelCls}>
              {platform === 'instagram' ? 'Caption' : 'Message'}
              {platform !== 'instagram' && <span className="text-text-muted font-normal"> *</span>}
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={
                platform === 'instagram' ? 'Write a caption for your photo…' :
                platform === 'x' ? "What's happening? (280 chars)" :
                platform === 'linkedin' ? 'Share a professional update…' :
                platform === 'tiktok' ? 'Add a caption for your video…' :
                "What's on your mind?"
              }
              className={inputCls + ' resize-none'}
              maxLength={platform === 'x' ? 280 : undefined}
            />
            {platform === 'x' && (
              <p className="text-[10px] text-text-muted mt-1 text-right">{message.length}/280</p>
            )}
          </div>

          {/* Image / Video URL */}
          <div>
            <label className={labelCls}>
              {platform === 'tiktok' ? 'Video URL' : 'Image URL'}
              {meta.requiresImage && <span className="text-danger font-semibold"> *</span>}
              {!meta.requiresImage && <span className="text-text-muted font-normal"> (optional)</span>}
            </label>
            <input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder={platform === 'tiktok' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
              className={inputCls}
            />
            {imageUrl && platform !== 'tiktok' && (
              <img src={imageUrl} alt="preview" onError={e => (e.currentTarget.style.display = 'none')}
                className="mt-2 rounded-lg max-h-40 object-cover border border-border-subtle" />
            )}
          </div>

          {/* Schedule */}
          <div>
            <label className={labelCls}>Schedule (optional — leave blank to post now)</label>
            <div className="flex gap-2">
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                className={inputCls + ' flex-1'} />
              <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                className={inputCls + ' w-32'} disabled={!scheduleDate} />
            </div>
            {scheduleDate && (
              <p className="text-[10px] text-text-muted mt-1">Post will be scheduled — requires publishing permissions.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium hover:text-text-primary transition-all">
            Cancel
          </button>
          <button onClick={() => mut.mutate()} disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-brand text-bg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {mut.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
              : scheduleDate
              ? <><Play className="w-4 h-4" /> Schedule Post</>
              : <><Zap className="w-4 h-4" /> Publish Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Instagram Ads Tab Content ───────────────────────────────────────────────

function InstagramAdsTab({
  account, campaigns, campaignsLoading, onCreateClick, onNewPost,
}: {
  account: FbAdAccount | null;
  campaigns: FbAdCampaign[];
  campaignsLoading: boolean;
  aggregate?: FbAggregate | null;
  onCreateClick: () => void;
  onNewPost: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = campaigns.find(c => c.id === selectedId) ?? null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 max-w-sm">
        {/* Connection status */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(228,64,95,0.1)] flex items-center justify-center shrink-0">
            <Instagram className="w-4 h-4 text-[#E4405F]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary">Instagram Ads</p>
            <p className="text-[10px] text-text-muted truncate">
              {account?.isActive ? 'Via Meta Ad Account' : 'Connect Meta Ad Account first'}
            </p>
          </div>
          {account?.isActive
            ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
            : <span className="text-[10px] text-text-muted shrink-0">Requires FB</span>}
        </div>

        {!account?.isActive && (
          <div className="rounded-xl border border-dashed border-border-medium bg-bg-card p-5 text-center">
            <Instagram className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
            <p className="text-xs font-semibold text-text-secondary">Connect Meta first</p>
            <p className="text-[10px] text-text-muted mt-0.5">Instagram ads use the Meta Ads API. Connect your FB Ad Account on the Facebook Ads tab.</p>
          </div>
        )}

        {account?.isActive && (
          <>
            <div className="flex gap-2">
              <button onClick={onCreateClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl bg-brand text-bg hover:opacity-90 transition-all">
                <Plus className="w-3.5 h-3.5" /> New Campaign
              </button>
              <button onClick={onNewPost}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-[rgba(228,64,95,0.4)] bg-[rgba(228,64,95,0.08)] text-[#E4405F] hover:bg-[rgba(228,64,95,0.14)] transition-all">
                <Pencil className="w-3.5 h-3.5" /> New Post
              </button>
            </div>

            {campaignsLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            )}

            {!campaignsLoading && campaigns.length === 0 && (
              <div className="rounded-xl border border-dashed border-border-medium bg-bg-card p-5 text-center">
                <Instagram className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
                <p className="text-xs font-semibold text-text-secondary">No Instagram campaigns</p>
                <p className="text-[10px] text-text-muted mt-0.5">Create one targeting Instagram</p>
              </div>
            )}

            {campaigns.map(c => {
              const isActive = selectedId === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    isActive ? 'border-brand bg-brand-soft' : 'border-border-subtle bg-bg-card hover:border-border-medium hover:bg-bg-elevated'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{c.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {OBJECTIVE_LABELS[c.objective ?? ''] ?? c.objective ?? '---'}
                      </p>
                    </div>
                    <StatusBadge status={c.fbStatus} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {c.spend > 0 && <span className="text-[10px] font-bold text-text-primary">{fmtMoney(c.spend, c.budgetCurrency || 'USD')}</span>}
                    <span className="text-[10px] text-text-muted">{fmtN(c.reach)} reach</span>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Instagram campaign detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setSelectedId(null)} />
          <div className="w-full max-w-lg bg-bg-card border-l border-border-subtle flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2 min-w-0">
                <Instagram className="w-4 h-4 text-[#E4405F] shrink-0" strokeWidth={1.6} />
                <h3 className="font-bold text-text-primary truncate">{selected.name}</h3>
                <StatusBadge status={selected.fbStatus} />
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <p className="text-xs text-text-muted">
                {OBJECTIVE_LABELS[selected.objective ?? ''] ?? selected.objective ?? 'Campaign'} · Started {fmtDate(selected.startTime)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Reach" value={fmtN(selected.reach)} accent="text-brand" />
                <Metric label="Impressions" value={fmtN(selected.impressions)} />
                <Metric label="Clicks" value={fmtN(selected.clicks)} />
                <Metric label="Spend" value={fmtMoney(selected.spend, selected.budgetCurrency || 'USD')} />
                <Metric label="CTR" value={selected.ctr != null ? `${selected.ctr.toFixed(2)}%` : '---'} />
                <Metric label="CPC" value={selected.cpc != null ? fmtMoney(selected.cpc, selected.budgetCurrency || 'USD') : '---'} />
                <Metric label="Frequency" value={selected.frequency != null ? selected.frequency.toFixed(2) : '---'} />
                <Metric label="Leads" value={selected.leadsCount} sub="via lead forms" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TikTok Ads Tab Content ──────────────────────────────────────────────────

function TikTokConnectDrawer({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ advertiserId: '', accessToken: '', businessName: '' });
  const [showToken, setShowToken] = useState(false);

  const mut = useMutation({
    mutationFn: () => ttApi.accountConnect(form),
    onSuccess: () => {
      toast.success('TikTok Ad account connected!');
      qc.invalidateQueries({ queryKey: ['tt-account'] });
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
            <Video className="w-5 h-5 text-text-secondary" strokeWidth={1.6} /> Connect TikTok Ads
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-xl bg-brand-soft border border-border-glow p-4 text-xs text-text-secondary space-y-1">
            <p className="font-bold text-brand">How to get your TikTok credentials:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Go to TikTok Ads Manager -- Developer tools</li>
              <li>Create an App and generate an Access Token</li>
              <li>Copy your Advertiser ID from the account page</li>
            </ol>
          </div>
          <div>
            <label className={labelCls}>Advertiser ID *</label>
            <input value={form.advertiserId} onChange={e => setForm(f => ({ ...f, advertiserId: e.target.value }))}
              placeholder="7012345678901234567" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Access Token *</label>
            <div className="relative">
              <input type={showToken ? 'text' : 'password'} value={form.accessToken}
                onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                placeholder="Enter your TikTok access token" className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Business Name</label>
            <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              placeholder="Your Business" className={inputCls} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border-subtle flex gap-3">
          <button onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.advertiserId || !form.accessToken}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand text-bg font-bold text-sm disabled:opacity-50 transition-all">
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" strokeWidth={1.6} />}
            Connect
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-bg-elevated transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TikTokAdsTab({ onNewPost }: { onNewPost?: () => void }) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const { data: rawAccount } = useQuery({ queryKey: ['tt-account'], queryFn: ttApi.accountGet });
  const { data: rawCampaigns, isLoading: campaignsLoading } = useQuery({ queryKey: ['tt-campaigns'], queryFn: ttApi.campaigns, enabled: !!(rawAccount as any)?.isActive });
  const { data: rawAggregate } = useQuery({ queryKey: ['tt-aggregate'], queryFn: ttApi.aggregate, enabled: !!(rawAccount as any)?.isActive });

  const account = rawAccount as unknown as TikTokAdAccount | null;
  const campaigns = (rawCampaigns as unknown as TikTokAdCampaign[]) ?? [];
  const aggregate = rawAggregate as unknown as TikTokAggregate | null;
  const selected = campaigns.find(c => c.id === selectedId) ?? null;

  const syncMut = useMutation({
    mutationFn: ttApi.sync,
    onSuccess: (res: any) => {
      toast.success(`Synced ${res?.campaignsSynced ?? 0} TikTok campaigns`);
      qc.invalidateQueries({ queryKey: ['tt-campaigns'] });
      qc.invalidateQueries({ queryKey: ['tt-aggregate'] });
      qc.invalidateQueries({ queryKey: ['tt-account'] });
    },
    onError: (e: any) => toast.error(e?.message || 'TikTok sync failed'),
  });

  return (
    <div className="flex gap-5 flex-1 min-h-0">
      {/* Left panel */}
      <div className="w-[280px] shrink-0 flex flex-col gap-4 overflow-y-auto">
        {/* Connection card */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 text-text-secondary" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary">TikTok Ad Account</p>
            <p className="text-[10px] text-text-muted truncate">
              {account?.isActive ? `${account.businessName || account.advertiserId}` : 'Not connected'}
            </p>
          </div>
          {account?.isActive
            ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
            : <button onClick={() => setShowConnect(true)}
                className="text-[10px] font-bold text-brand hover:underline shrink-0">Connect</button>}
        </div>

        {account?.isActive && (
          <>
            <div className="flex gap-2">
              <button onClick={() => setShowConnect(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl bg-brand text-bg hover:opacity-90 transition-all">
                <Plus className="w-3.5 h-3.5" /> New
              </button>
              <button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium disabled:opacity-50 transition-all">
                {syncMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            </div>
            {onNewPost && (
              <button onClick={onNewPost}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium hover:text-text-primary transition-all">
                <Pencil className="w-3.5 h-3.5" /> New TikTok Post
              </button>
            )}

            {campaignsLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            )}

            {!campaignsLoading && campaigns.length === 0 && (
              <div className="rounded-xl border border-dashed border-border-medium bg-bg-card p-5 text-center">
                <Video className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
                <p className="text-xs font-semibold text-text-secondary">No TikTok campaigns</p>
                <p className="text-[10px] text-text-muted mt-0.5">Sync from TikTok Ads Manager</p>
              </div>
            )}

            {campaigns.map(c => {
              const isSelected = selectedId === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    isSelected ? 'border-brand bg-brand-soft' : 'border-border-subtle bg-bg-card hover:border-border-medium hover:bg-bg-elevated'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{c.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{c.objective ?? '---'}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {c.spend > 0 && <span className="text-[10px] font-bold text-text-primary">{fmtMoney(c.spend, c.budgetCurrency || 'USD')}</span>}
                    {c.videoViews > 0 && (
                      <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                        <Play className="w-3 h-3" /> {fmtN(c.videoViews)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </>
        )}

        {!account?.isActive && (
          <div className="rounded-xl border border-dashed border-border-medium bg-bg-card p-5 text-center">
            <Video className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
            <p className="text-xs font-semibold text-text-secondary">Connect TikTok Ads</p>
            <p className="text-[10px] text-text-muted mt-0.5">Enter your Advertiser ID and access token to get started</p>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selected ? (
          <div className="space-y-5">
            {/* Campaign header */}
            <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Video className="w-5 h-5 text-text-secondary" strokeWidth={1.6} />
                <h2 className="text-lg font-extrabold text-text-primary">{selected.name}</h2>
                <StatusBadge status={selected.status} />
                {selected.createdFromOmniFlow && (
                  <span className="text-[10px] font-bold text-brand bg-brand-soft border border-border-glow px-2 py-0.5 rounded-full">OmniFlow</span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                {selected.objective ?? 'Campaign'} · Started {fmtDate(selected.startTime ?? null)}
              </p>
            </div>

            {/* Standard metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric label="Impressions" value={fmtN(selected.impressions)} />
              <Metric label="Clicks" value={fmtN(selected.clicks)} />
              <Metric label="Spend" value={fmtMoney(selected.spend, selected.budgetCurrency || 'USD')} />
              <Metric label="Reach" value={fmtN(selected.reach)} />
              <Metric label="CTR" value={selected.ctr != null ? `${selected.ctr.toFixed(2)}%` : '---'} />
              <Metric label="CPC" value={selected.cpc != null ? fmtMoney(selected.cpc, selected.budgetCurrency || 'USD') : '---'} />
              <Metric label="Conversions" value={fmtN(selected.conversions)} accent="text-success" />
              <Metric label="Cost/Conv" value={selected.costPerConversion != null ? fmtMoney(selected.costPerConversion, selected.budgetCurrency || 'USD') : '---'} />
            </div>

            {/* TikTok-specific engagement */}
            <div className="rounded-2xl border border-border-subtle bg-bg-card p-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" strokeWidth={1.6} /> Engagement
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Play className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
                    <p className="text-[10px] text-text-muted">Video Views</p>
                  </div>
                  <p className="text-lg font-extrabold text-text-primary">{fmtN(selected.videoViews)}</p>
                </div>
                <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ThumbsUp className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
                    <p className="text-[10px] text-text-muted">Likes</p>
                  </div>
                  <p className="text-lg font-extrabold text-text-primary">{fmtN(selected.likes)}</p>
                </div>
                <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Share2 className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
                    <p className="text-[10px] text-text-muted">Shares</p>
                  </div>
                  <p className="text-lg font-extrabold text-text-primary">{fmtN(selected.shares)}</p>
                </div>
                <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageCircle className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
                    <p className="text-[10px] text-text-muted">Comments</p>
                  </div>
                  <p className="text-lg font-extrabold text-text-primary">{fmtN(selected.comments)}</p>
                </div>
              </div>
            </div>

            {selected.insightsSyncedAt && (
              <p className="text-[10px] text-text-muted text-right">
                Insights last synced {new Date(selected.insightsSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {aggregate && account?.isActive && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Metric label="Total Spend" value={fmtMoney(aggregate.totalSpend)} />
                <Metric label="Impressions" value={fmtN(aggregate.totalImpressions)} />
                <Metric label="Video Views" value={fmtN(aggregate.totalVideoViews)} accent="text-brand" />
                <Metric label="Conversions" value={fmtN(aggregate.totalConversions)} accent="text-success" />
                <Metric label="Active" value={aggregate.activeCampaigns} sub={`of ${aggregate.totalCampaigns} total`} />
                <Metric label="Clicks" value={fmtN(aggregate.totalClicks)} />
                <Metric label="Likes" value={fmtN(aggregate.totalLikes)} />
                <Metric label="Shares" value={fmtN(aggregate.totalShares)} />
              </div>
            )}

            {!account?.isActive && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mx-auto">
                    <Video className="w-8 h-8 text-text-muted" strokeWidth={1.6} />
                  </div>
                  <p className="text-base font-bold text-text-primary">Connect TikTok Ads</p>
                  <p className="text-sm text-text-muted">
                    Sync your TikTok campaigns, track video performance, and monitor engagement metrics.
                  </p>
                  <button onClick={() => setShowConnect(true)}
                    className="px-5 py-2.5 rounded-xl bg-brand text-bg font-bold text-sm hover:opacity-90 transition-all">
                    Connect Now
                  </button>
                </div>
              </div>
            )}

            {account?.isActive && campaigns.length > 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-text-muted">Select a campaign to view details</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showConnect && <TikTokConnectDrawer onClose={() => setShowConnect(false)} />}
    </div>
  );
}

// ─── OAuth Platform Tab (shared template) ────────────────────────────────────

function OAuthPlatformTab({
  queryKey, platformSlug, accountApi, campaignsApi, syncApi, aggregateApi, oauthUrlApi, oauthCallbackApi, disconnectApi,
  icon: Icon, platformName, platformColor, campaignStatusKey = 'status',
  metricsConfig, engagementConfig, credentialFields, onNewPost,
}: {
  queryKey: string; platformSlug: string;
  accountApi: () => Promise<any>; campaignsApi: () => Promise<any>;
  syncApi: () => Promise<any>; aggregateApi: () => Promise<any>;
  oauthUrlApi: (r: string) => Promise<any>;
  oauthCallbackApi: (d: { code: string; redirectUri: string; state?: string; codeVerifier?: string }) => Promise<any>;
  disconnectApi: () => Promise<any>;
  icon: typeof Facebook; platformName: string; platformColor: string;
  campaignStatusKey?: string;
  metricsConfig: Array<{ label: string; key: string; format?: 'money' | 'number' | 'percent'; currency?: string }>;
  engagementConfig?: Array<{ label: string; key: string; icon: typeof Facebook }>;
  credentialFields: Array<{ key: string; label: string; placeholder: string; secret?: boolean }>;
  onNewPost?: () => void;
}) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [credValues, setCredValues] = useState<Record<string, string>>({});
  const [savingCreds, setSavingCreds] = useState(false);

  const { data: rawCred, refetch: refetchCred } = useQuery({
    queryKey: [queryKey + '-cred'],
    queryFn: () => credApi.get(platformSlug),
  });
  const savedCred = rawCred as any;
  const credConfigured = !!(savedCred?.isConfigured);


  const { data: rawAccount } = useQuery({ queryKey: [queryKey + '-account'], queryFn: accountApi });
  const account = rawAccount as any;
  const isConnected = !!(account?.isActive);

  const { data: rawCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: [queryKey + '-campaigns'], queryFn: campaignsApi, enabled: isConnected,
  });
  const { data: rawAggregate } = useQuery({
    queryKey: [queryKey + '-aggregate'], queryFn: aggregateApi, enabled: isConnected,
  });

  const campaigns = (rawCampaigns as any[]) ?? [];
  const aggregate = rawAggregate as any;
  const selected = campaigns.find((c: any) => c.id === selectedId) ?? null;

  const syncMut = useMutation({
    mutationFn: syncApi,
    onSuccess: (res: any) => {
      toast.success(`Synced ${res?.campaignsSynced ?? 0} ${platformName} campaigns`);
      qc.invalidateQueries({ queryKey: [queryKey + '-campaigns'] });
      qc.invalidateQueries({ queryKey: [queryKey + '-aggregate'] });
    },
    onError: (e: any) => toast.error(e?.message || `${platformName} sync failed`),
  });

  const disconnectMut = useMutation({
    mutationFn: disconnectApi,
    onSuccess: () => {
      toast.success(`${platformName} disconnected`);
      qc.invalidateQueries({ queryKey: [queryKey + '-account'] });
      qc.invalidateQueries({ queryKey: [queryKey + '-campaigns'] });
      qc.invalidateQueries({ queryKey: [queryKey + '-aggregate'] });
    },
  });

  // Complete OAuth flow when the platform redirects back with ?code=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const pendingPlatform = sessionStorage.getItem('ads_oauth_pending_platform');
    if (!code || pendingPlatform !== queryKey) return;

    const redirectUri = sessionStorage.getItem(queryKey + '_oauth_redirect') || (window.location.origin + window.location.pathname);
    const state = sessionStorage.getItem(queryKey + '_oauth_state') ?? undefined;
    const codeVerifier = sessionStorage.getItem(queryKey + '_code_verifier') ?? undefined;

    window.history.replaceState({}, '', window.location.pathname);
    sessionStorage.removeItem('ads_oauth_pending_platform');
    sessionStorage.removeItem(queryKey + '_oauth_redirect');
    sessionStorage.removeItem(queryKey + '_oauth_state');
    sessionStorage.removeItem(queryKey + '_code_verifier');

    (async () => {
      try {
        const res = await oauthCallbackApi({ code, redirectUri, state, codeVerifier }) as any;
        toast.success(res?.message || `${platformName} connected!`);
        qc.invalidateQueries({ queryKey: [queryKey + '-account'] });
        qc.invalidateQueries({ queryKey: [queryKey + '-campaigns'] });
        qc.invalidateQueries({ queryKey: [queryKey + '-aggregate'] });
      } catch (e: any) {
        toast.error(e?.message || `${platformName} connection failed`);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const redir = window.location.origin + window.location.pathname;
      const res = await oauthUrlApi(redir) as any;
      sessionStorage.setItem('ads_oauth_pending_platform', queryKey);
      sessionStorage.setItem(queryKey + '_oauth_redirect', redir);
      if (res.state) sessionStorage.setItem(queryKey + '_oauth_state', res.state);
      if (res.codeVerifier) sessionStorage.setItem(queryKey + '_code_verifier', res.codeVerifier);
      window.location.href = res.authUrl;
    } catch (e: any) {
      toast.error(e?.message || `Failed to start ${platformName} login`);
      setConnecting(false);
    }
  };

  const handleSaveCreds = async () => {
    setSavingCreds(true);
    try {
      const clientId = credValues['clientId'] || undefined;
      const clientSecret = credValues['clientSecret'] || undefined;
      const extra = credValues['developerToken']
        ? JSON.stringify({ developerToken: credValues['developerToken'] })
        : undefined;
      await credApi.save(platformSlug, { clientId, clientSecret, extraDataJson: extra });
      await refetchCred();
      toast.success(`${platformName} credentials saved`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save credentials');
    } finally {
      setSavingCreds(false);
    }
  };

  const CONSOLE_URLS: Record<string, string> = {
    google: 'https://console.cloud.google.com/apis/credentials',
    twitter: 'https://developer.twitter.com/en/portal/dashboard',
    linkedin: 'https://www.linkedin.com/developers/apps',
  };
  const consoleUrl = CONSOLE_URLS[platformSlug] ?? '#';
  const redirectUri = window.location.origin + window.location.pathname;

  const fmtVal = (val: any, format?: string, currency?: string) => {
    if (val == null || val === 0) return '—';
    if (format === 'money') return fmtMoney(val, currency || 'USD');
    if (format === 'percent') return `${Number(val).toFixed(2)}%`;
    return fmtN(Number(val));
  };

  return (
    <div className="flex gap-5 flex-1 min-h-0">
      {/* Left panel */}
      <div className="w-[280px] shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="rounded-xl border border-border-subtle bg-bg-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-text-secondary" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-primary">{platformName} Ads</p>
            <p className="text-[10px] text-text-muted truncate">
              {isConnected ? account?.businessName || account?.customerId || account?.twitterAccountId || account?.adAccountUrn || 'Connected' : 'Not connected'}
            </p>
          </div>
          {isConnected
            ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
            : <button onClick={handleConnect} disabled={connecting || !credConfigured}
                className="text-[10px] font-bold text-brand hover:underline shrink-0 disabled:opacity-40">
                {connecting ? 'Opening...' : 'Connect'}
              </button>}
        </div>

        {isConnected && (
          <>
            <div className="flex gap-2">
              <button onClick={handleConnect} disabled={connecting}
                style={{ background: platformColor }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-60">
                <Plus className="w-3.5 h-3.5" /> New Campaign
              </button>
              <button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium disabled:opacity-50 transition-all">
                {syncMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            </div>
            {onNewPost && (
              <button onClick={onNewPost}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-medium hover:text-text-primary transition-all">
                <Pencil className="w-3.5 h-3.5" /> New {platformName} Post
              </button>
            )}

            {campaignsLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            )}

            {!campaignsLoading && campaigns.length === 0 && (
              <div className="rounded-xl border border-dashed border-border-medium bg-bg-card p-5 text-center">
                <Icon className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
                <p className="text-xs font-semibold text-text-secondary">No {platformName} campaigns</p>
                <p className="text-[10px] text-text-muted mt-0.5">Create one or sync from {platformName}</p>
              </div>
            )}

            {campaigns.map((c: any) => {
              const isSelected = selectedId === c.id;
              const statusVal = c[campaignStatusKey] ?? c.status ?? '';
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    isSelected ? 'border-brand bg-brand-soft' : 'border-border-subtle bg-bg-card hover:border-border-medium hover:bg-bg-elevated'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{c.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{c.objective ?? c.campaignType ?? '—'}</p>
                    </div>
                    <StatusBadge status={statusVal} />
                  </div>
                  {c.spend > 0 && (
                    <p className="text-[10px] font-bold text-text-primary mt-1.5">
                      {fmtMoney(c.spend, c.budgetCurrency || 'USD')} spent
                    </p>
                  )}
                </button>
              );
            })}

            <button onClick={() => disconnectMut.mutate()} disabled={disconnectMut.isPending}
              className="text-[10px] text-text-muted hover:text-danger transition-all text-center py-1">
              Disconnect {platformName}
            </button>
          </>
        )}

        {!isConnected && (
          <div className="rounded-xl border border-dashed border-border-medium bg-bg-card p-5 text-center">
            <Icon className="w-6 h-6 text-text-muted mx-auto mb-2" strokeWidth={1.6} />
            <p className="text-xs font-semibold text-text-secondary">Connect {platformName} Ads</p>
            <p className="text-[10px] text-text-muted mt-0.5">Authenticate with {platformName} to get started</p>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selected ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon className="w-5 h-5 text-text-secondary" strokeWidth={1.6} />
                <h2 className="text-lg font-extrabold text-text-primary">{selected.name}</h2>
                <StatusBadge status={selected[campaignStatusKey] ?? selected.status ?? ''} />
                {selected.createdFromOmniFlow && (
                  <span className="text-[10px] font-bold text-brand bg-brand-soft border border-border-glow px-2 py-0.5 rounded-full">OmniFlow</span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1.5">{selected.objective ?? selected.campaignType ?? 'Campaign'}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {metricsConfig.map(m => (
                <Metric key={m.label} label={m.label} value={fmtVal(selected[m.key], m.format, m.currency || selected.budgetCurrency)} />
              ))}
            </div>

            {engagementConfig && engagementConfig.some(e => (selected[e.key] ?? 0) > 0) && (
              <div className="rounded-2xl border border-border-subtle bg-bg-card p-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Engagement</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {engagementConfig.map(e => (
                    <div key={e.label} className="rounded-xl bg-bg-elevated border border-border-subtle p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <e.icon className="w-3 h-3 text-text-muted" strokeWidth={1.6} />
                        <p className="text-[10px] text-text-muted">{e.label}</p>
                      </div>
                      <p className="text-lg font-extrabold text-text-primary">{fmtN(selected[e.key] ?? 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {aggregate && isConnected && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Metric label="Total Spend" value={fmtMoney(aggregate.totalSpend ?? 0)} />
                <Metric label="Impressions" value={fmtN(aggregate.totalImpressions ?? 0)} />
                <Metric label="Clicks" value={fmtN(aggregate.totalClicks ?? 0)} />
                <Metric label="Active" value={aggregate.activeCampaigns ?? 0} sub={`of ${aggregate.totalCampaigns ?? 0} total`} />
              </div>
            )}
            {!isConnected && (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-lg space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-text-secondary" strokeWidth={1.6} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-text-primary">Connect {platformName} Ads</h3>
                      <p className="text-xs text-text-muted">3 steps — takes about 2 minutes</p>
                    </div>
                  </div>

                  {/* Step 1 */}
                  <div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-brand text-bg text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                      <p className="text-sm font-bold text-text-primary">Create an OAuth App on {platformName}</p>
                    </div>
                    <p className="text-xs text-text-muted pl-8">
                      Go to the {platformName} developer console, create a new OAuth 2.0 app, and enable the Ads / Marketing API.
                    </p>
                    <div className="pl-8">
                      <a href={consoleUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-medium text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-glow transition-all">
                        <ExternalLink className="w-3 h-3" /> Open {platformName} Developer Console
                      </a>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-brand text-bg text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                      <p className="text-sm font-bold text-text-primary">Add this Redirect URI to your app</p>
                    </div>
                    <p className="text-xs text-text-muted pl-8">
                      In your app's OAuth settings, add this exact URL as an authorized redirect URI:
                    </p>
                    <div className="pl-8 flex items-center gap-2">
                      <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-bg-input border border-border-subtle text-[11px] text-brand font-mono truncate">
                        {redirectUri}
                      </code>
                      <button onClick={() => { navigator.clipboard.writeText(redirectUri); toast.success('Copied!'); }}
                        className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-medium transition-all shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-brand text-bg text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                      <p className="text-sm font-bold text-text-primary">Enter your credentials</p>
                    </div>
                    {credConfigured && (
                      <div className="pl-8 flex items-center gap-1.5 text-xs text-success">
                        <CheckCircle className="w-3.5 h-3.5" /> Credentials saved — leave fields blank to keep existing values
                      </div>
                    )}
                    <div className="pl-8 space-y-3">
                      {credentialFields.map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-text-secondary mb-1">{f.label}</label>
                          <input
                            type={f.secret ? 'password' : 'text'}
                            placeholder={f.secret && savedCred?.hasSecret ? '•••••••• (saved — leave blank to keep)' : f.placeholder}
                            value={credValues[f.key] ?? ''}
                            onChange={e => setCredValues(v => ({ ...v, [f.key]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:border-border-glow focus:bg-glass-1 outline-none transition-all"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <button onClick={handleSaveCreds} disabled={savingCreds}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-bg text-sm font-bold hover:bg-brand-light transition-all disabled:opacity-50">
                          {savingCreds ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2} />}
                          {credConfigured ? 'Update' : 'Save Credentials'}
                        </button>
                        {credConfigured && (
                          <button onClick={handleConnect} disabled={connecting}
                            style={{ background: platformColor }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60">
                            {connecting
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                              : <><Icon className="w-4 h-4" strokeWidth={1.6} /> Connect {platformName}</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isConnected && campaigns.length > 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-text-muted">Select a campaign to view details</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

type AdTab = 'facebook' | 'instagram' | 'tiktok' | 'google' | 'twitter' | 'linkedin' | 'youtube' | 'report';

export function Component() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdTab>('facebook');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [postComposerPlatform, setPostComposerPlatform] = useState<'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'x' | null>(null);

  const { data: rawMeta } = useQuery({ queryKey: ['meta-integration'], queryFn: api.metaGet });
  const { data: rawAccount } = useQuery({ queryKey: ['fb-account'], queryFn: api.accountGet });
  const { data: rawCampaigns, isLoading: campaignsLoading } = useQuery({ queryKey: ['fb-campaigns'], queryFn: api.campaigns });
  const { data: rawAggregate } = useQuery({ queryKey: ['fb-aggregate'], queryFn: api.aggregate, enabled: !!(rawAccount as any)?.isActive });

  const meta      = rawMeta as unknown as MetaIntegration | null;
  const account   = rawAccount as unknown as FbAdAccount | null;
  const allCampaigns = (rawCampaigns as unknown as FbAdCampaign[]) ?? [];
  const aggregate = rawAggregate as unknown as FbAggregate | null;

  // Filter campaigns for Instagram tab — those targeting Instagram platform
  const igCampaigns = allCampaigns.filter(c => {
    try {
      const t = JSON.parse(c.targetingSummaryJson ?? '{}');
      return t?.platforms?.includes?.('instagram');
    } catch { return false; }
  });

  const selectedCampaign = allCampaigns.find(c => c.id === selectedId) ?? null;

  // Restore the correct tab when returning from an ads platform OAuth redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('code')) return;
    const pending = sessionStorage.getItem('ads_oauth_pending_platform');
    if (pending === 'google-ads') setActiveTab('google');
    else if (pending === 'twitter-ads') setActiveTab('twitter');
    else if (pending === 'linkedin-ads') setActiveTab('linkedin');
    // Also restore YouTube tab on ytcallback
    const ytcallback = new URLSearchParams(window.location.search).get('ytcallback');
    if (ytcallback === '1') setActiveTab('youtube');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle the Facebook OAuth redirect-back (?code=...) — exchange it and connect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    // Let the platform-specific tab handle non-Facebook redirects.
    const pendingPlatform = sessionStorage.getItem('ads_oauth_pending_platform');
    if (pendingPlatform && pendingPlatform !== 'facebook') return;
    const state = params.get('state') ?? undefined;
    const redirectUri = sessionStorage.getItem('fb_oauth_redirect') || (window.location.origin + window.location.pathname);
    window.history.replaceState({}, '', window.location.pathname); // drop ?code so a refresh won't re-run
    (async () => {
      try {
        const res = (await api.oauthCallback({ code, redirectUri, state })) as unknown as FbOAuthConnect;
        toast.success(res.message || 'Connected with Facebook!');
        ['fb-account', 'meta-integration', 'meta-setup-status', 'fb-aggregate', 'fb-campaigns']
          .forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Facebook connection failed');
      }
    })();
  }, [qc]);

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

  const TAB_CONFIG: { key: AdTab; label: string; icon: typeof Facebook }[] = [
    { key: 'facebook',  label: 'Facebook',  icon: Facebook },
    { key: 'instagram', label: 'Instagram', icon: Instagram },
    { key: 'tiktok',    label: 'TikTok',    icon: Video },
    { key: 'google',    label: 'Google Ads', icon: Youtube },
    { key: 'twitter',   label: 'X / Twitter', icon: Twitter },
    { key: 'linkedin',  label: 'LinkedIn',  icon: Linkedin },
    { key: 'youtube',   label: 'YouTube',   icon: Youtube },
    { key: 'report',    label: 'Report',    icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}>
            <Megaphone className="w-5 h-5" style={{ color: '#0A0F0D' }} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-text-primary">Ads Manager</h2>
            <p className="text-xs text-text-muted">Facebook, Instagram, TikTok, YouTube, X & LinkedIn</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-border-subtle">
        {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setActiveTab(key); setSelectedId(null); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
              activeTab === key ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}>
            <Icon className="w-3.5 h-3.5" strokeWidth={1.6} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'facebook' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-4 max-w-sm">
            <ConnectionCards meta={meta} account={account} onConnectAccount={() => setShowConnect(true)} onSetupWebhook={() => setShowWebhook(true)} />
            {meta?.isActive && (
              <button onClick={() => setPostComposerPlatform('facebook')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl border border-[rgba(24,119,242,0.4)] bg-[rgba(24,119,242,0.08)] text-[#1877F2] hover:bg-[rgba(24,119,242,0.14)] transition-all">
                <Pencil className="w-3.5 h-3.5" /> New Facebook Post
              </button>
            )}
            <SetupChecklist />
            <div className="h-px bg-border-subtle" />
            <CampaignList
              campaigns={allCampaigns}
              loading={campaignsLoading}
              selected={selectedId}
              onSelect={setSelectedId}
              onCreateClick={account?.isActive ? () => setShowCreate(true) : () => setShowConnect(true)}
              onSyncClick={() => syncMut.mutate()}
              isSyncing={syncMut.isPending}
            />
          </div>
        </div>
      )}

      {/* Campaign detail drawer (Facebook) */}
      {selectedCampaign && activeTab === 'facebook' && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setSelectedId(null)} />
          <div className="w-full max-w-lg bg-bg-card border-l border-border-subtle flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-bold text-text-primary truncate">{selectedCampaign.name}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <CampaignDetail
                campaign={selectedCampaign}
                currency={account?.currency || 'USD'}
                onToggled={handleToggled}
                onBudgetUpdated={handleBudgetUpdated}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'instagram' && (
        <InstagramAdsTab
          account={account}
          campaigns={igCampaigns}
          campaignsLoading={campaignsLoading}
          aggregate={aggregate}
          onCreateClick={account?.isActive ? () => setShowCreate(true) : () => setShowConnect(true)}
          onNewPost={() => setPostComposerPlatform('instagram')}
        />
      )}

      {activeTab === 'tiktok' && <TikTokAdsTab onNewPost={() => setPostComposerPlatform('tiktok')} />}

      {activeTab === 'google' && <OAuthPlatformTab
        queryKey="google-ads"
        platformSlug="google"
        accountApi={googleApi.accountGet}
        campaignsApi={googleApi.campaigns}
        syncApi={googleApi.sync}
        aggregateApi={googleApi.aggregate}
        oauthUrlApi={googleApi.oauthUrl}
        oauthCallbackApi={googleApi.oauthCallback}
        disconnectApi={googleApi.disconnect}
        icon={Youtube}
        platformName="Google Ads"
        credentialFields={[
          { key: 'clientId', label: 'Client ID', placeholder: 'Your Google OAuth Client ID' },
          { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your Client Secret', secret: true },
          { key: 'developerToken', label: 'Developer Token (optional)', placeholder: 'Google Ads Developer Token' },
        ]}
        platformColor="#FF0000"
        campaignStatusKey="status"
        metricsConfig={[
          { label: 'Spend', key: 'spend', format: 'money', currency: 'USD' },
          { label: 'Impressions', key: 'impressions', format: 'number' },
          { label: 'Clicks', key: 'clicks', format: 'number' },
          { label: 'CTR', key: 'ctr', format: 'percent' },
          { label: 'CPC', key: 'cpc', format: 'money' },
          { label: 'Conversions', key: 'conversions', format: 'number' },
          { label: 'ROAS', key: 'roas', format: 'number' },
          { label: 'Daily Budget', key: 'dailyBudget', format: 'money' },
        ]}
      />}
      {activeTab === 'twitter' && <OAuthPlatformTab
        queryKey="twitter-ads"
        platformSlug="twitter"
        accountApi={twitterApi.accountGet}
        campaignsApi={twitterApi.campaigns}
        syncApi={twitterApi.sync}
        aggregateApi={twitterApi.aggregate}
        oauthUrlApi={twitterApi.oauthUrl}
        oauthCallbackApi={twitterApi.oauthCallback}
        disconnectApi={twitterApi.disconnect}
        icon={Twitter}
        platformName="X / Twitter"
        onNewPost={() => setPostComposerPlatform('x')}
        credentialFields={[
          { key: 'clientId', label: 'Client ID', placeholder: 'Your Twitter OAuth 2.0 Client ID' },
          { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your Client Secret', secret: true },
        ]}
        platformColor="#000000"
        campaignStatusKey="status"
        metricsConfig={[
          { label: 'Spend', key: 'spend', format: 'money' },
          { label: 'Impressions', key: 'impressions', format: 'number' },
          { label: 'Clicks', key: 'clicks', format: 'number' },
          { label: 'CTR', key: 'ctr', format: 'percent' },
          { label: 'CPC', key: 'cpc', format: 'money' },
          { label: 'Daily Budget', key: 'dailyBudget', format: 'money' },
        ]}
        engagementConfig={[
          { label: 'Likes', key: 'likes', icon: Heart },
          { label: 'Retweets', key: 'retweets', icon: Repeat2 },
          { label: 'Replies', key: 'replies', icon: MessageCircle },
          { label: 'Follows', key: 'follows', icon: UserPlus },
        ]}
      />}
      {activeTab === 'linkedin' && <OAuthPlatformTab
        queryKey="linkedin-ads"
        platformSlug="linkedin"
        accountApi={linkedInApi.accountGet}
        campaignsApi={linkedInApi.campaigns}
        syncApi={linkedInApi.sync}
        aggregateApi={linkedInApi.aggregate}
        oauthUrlApi={linkedInApi.oauthUrl}
        oauthCallbackApi={linkedInApi.oauthCallback}
        disconnectApi={linkedInApi.disconnect}
        icon={Linkedin}
        platformName="LinkedIn"
        onNewPost={() => setPostComposerPlatform('linkedin')}
        credentialFields={[
          { key: 'clientId', label: 'Client ID', placeholder: 'Your LinkedIn App Client ID' },
          { key: 'clientSecret', label: 'Client Secret', placeholder: 'Your Client Secret', secret: true },
        ]}
        platformColor="#0A66C2"
        campaignStatusKey="linkedInStatus"
        metricsConfig={[
          { label: 'Spend', key: 'spend', format: 'money' },
          { label: 'Impressions', key: 'impressions', format: 'number' },
          { label: 'Clicks', key: 'clicks', format: 'number' },
          { label: 'CTR', key: 'ctr', format: 'percent' },
          { label: 'CPC', key: 'cpc', format: 'money' },
          { label: 'Daily Budget', key: 'dailyBudget', format: 'money' },
        ]}
        engagementConfig={[
          { label: 'Reactions', key: 'reactions', icon: Heart },
          { label: 'Shares', key: 'shares', icon: Repeat2 },
          { label: 'Comments', key: 'comments', icon: MessageCircle },
          { label: 'Video Views', key: 'videoViews', icon: Play },
        ]}
      />}

      {activeTab === 'youtube' && (
        <YouTubeTab youtubeApi={youtubeApi} />
      )}

      {activeTab === 'report' && <AdsReportTab />}

      {/* Drawers */}
      {showCreate  && <AiCampaignWizard onClose={() => setShowCreate(false)} onSetupRequired={() => { setShowCreate(false); setShowConnect(true); }} />}
      {showConnect && <ConnectAccountDrawer onClose={() => setShowConnect(false)} />}
      {showWebhook && <WebhookSetupDrawer meta={meta} onClose={() => setShowWebhook(false)} />}
      {postComposerPlatform && (
        <PostComposer platform={postComposerPlatform} onClose={() => setPostComposerPlatform(null)} />
      )}
    </div>
  );
}

// ─── YouTube Tab ──────────────────────────────────────────────────────────────

function YouTubeTab({ youtubeApi }: { youtubeApi: typeof youtubeApiShape }) {
  const qc = useQueryClient();
  const { data: accountRaw } = useQuery({ queryKey: ['yt-account'], queryFn: youtubeApi.accountGet });
  const { data: aggregateRaw } = useQuery({ queryKey: ['yt-aggregate'], queryFn: youtubeApi.aggregate });
  const { data: videosRaw } = useQuery({ queryKey: ['yt-videos'], queryFn: youtubeApi.videos });
  const account = accountRaw as unknown as YouTubeAccount | null;
  const agg = aggregateRaw as unknown as YouTubeAggregate | null;
  const videos = (videosRaw as unknown as YouTubeVideo[]) ?? [];

  const syncMutation = useMutation({ mutationFn: youtubeApi.sync, onSuccess: () => { qc.invalidateQueries({ queryKey: ['yt-videos'] }); qc.invalidateQueries({ queryKey: ['yt-aggregate'] }); toast.success('YouTube videos synced'); } });
  const disconnectMutation = useMutation({ mutationFn: youtubeApi.disconnect, onSuccess: () => { qc.invalidateQueries({ queryKey: ['yt-account'] }); toast.success('YouTube disconnected'); } });

  const fmtYt = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n);

  if (!account?.hasToken) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Youtube className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-text-primary mb-1">Connect YouTube</h3>
          <p className="text-sm text-text-secondary max-w-sm">Connect your YouTube channel to manage videos and track analytics from OmniFlow.</p>
        </div>
        <button
          onClick={async () => {
            try {
              const redirectUri = `${window.location.origin}/dashboard/crm/integrations?ytcallback=1`;
              const res = await youtubeApi.oauthUrl(redirectUri);
              const { authUrl } = res as unknown as { authUrl: string };
              window.location.href = authUrl;
            } catch (e: any) { toast.error(e?.message ?? 'Failed to get OAuth URL'); }
          }}
          className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center gap-2"
        >
          <Youtube className="w-4 h-4" />
          Connect with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Account card */}
      <div className="bg-glass-1 border-thin border-border-subtle rounded-card p-4 flex items-center gap-4">
        {account.channelThumbnailUrl && (
          <img src={account.channelThumbnailUrl} alt="channel" className="w-12 h-12 rounded-full object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            <span className="font-bold text-text-primary">{account.channelTitle ?? account.channelId}</span>
            <span className={account.isActive ? 'text-xs text-success font-semibold' : 'text-xs text-text-muted font-semibold'}>
              {account.isActive ? '● Live' : '○ Inactive'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {account.subscriberCount != null && `${fmtYt(account.subscriberCount)} subscribers · `}
            {account.videoCount != null && `${fmtYt(account.videoCount)} videos`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="px-3 py-1.5 rounded-sm bg-glass-2 border-thin border-border-subtle text-xs font-semibold text-text-primary hover:border-brand transition-colors flex items-center gap-1.5">
            <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync
          </button>
          <button onClick={() => { if (confirm('Disconnect YouTube?')) disconnectMutation.mutate(); }} className="px-3 py-1.5 rounded-sm bg-glass-2 border-thin border-border-subtle text-xs font-semibold text-red-400 hover:border-red-400 transition-colors">
            Disconnect
          </button>
        </div>
      </div>

      {/* Aggregate stats */}
      {agg && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Videos', value: String(agg.totalVideos), icon: Video },
            { label: 'Total Views', value: fmtYt(agg.totalViews), icon: Eye },
            { label: 'Total Likes', value: fmtYt(agg.totalLikes), icon: ThumbsUp },
            { label: 'Watch Mins', value: fmtYt(agg.totalEstimatedMinutesWatched), icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-glass-1 border-thin border-border-subtle rounded-card p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-red-400" strokeWidth={1.6} />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
              </div>
              <div className="text-xl font-extrabold text-text-primary">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Videos list */}
      <div className="bg-glass-1 border-thin border-border-subtle rounded-card overflow-hidden">
        <div className="px-4 py-3 border-b border-thin border-border-subtle flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Videos ({videos.length})</span>
        </div>
        {videos.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-muted">No videos synced yet. Click Sync to pull from YouTube.</div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {videos.slice(0, 20).map(v => (
              <div key={v.id} className="px-4 py-3 flex items-center gap-3 hover:bg-glass-2 transition-colors">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt={v.title} className="w-16 h-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-10 rounded bg-glass-2 flex items-center justify-center shrink-0">
                    <Youtube className="w-5 h-5 text-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{v.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {fmtYt(v.viewCount)} views · {fmtYt(v.likeCount)} likes · {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-thin ${
                  v.privacyStatus === 'public' ? 'bg-success-soft text-success border-border-success' : 'bg-glass-2 text-text-muted border-border-subtle'
                }`}>
                  {v.privacyStatus}
                </span>
                <a href={`https://www.youtube.com/watch?v=${v.youTubeVideoId}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted hover:text-text-primary transition-colors" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
