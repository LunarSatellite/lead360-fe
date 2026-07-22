import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Loader2, Sparkles, Rocket, Facebook, Video, CheckCircle, LogIn, Youtube, Twitter, Linkedin } from 'lucide-react';
import { apiClient } from '@/shared/lib/api-client';

interface AiDraft {
  name: string; objective: string; adName: string; headline: string;
  adBody: string; callToAction: string; ageMin: number; ageMax: number;
  suggestedDailyBudget: number; interestKeywords: string[];
  rationale?: string; usedFallback: boolean;
}

interface FbAccount { isActive: boolean; }
interface TtAccount { isActive: boolean; }
interface PlatformAccount { isActive: boolean; }

const TT_OBJ: Record<string, string> = {
  OUTCOME_LEADS: 'LEAD_GENERATION', OUTCOME_TRAFFIC: 'TRAFFIC',
  OUTCOME_AWARENESS: 'REACH', OUTCOME_ENGAGEMENT: 'REACH', OUTCOME_SALES: 'CONVERSIONS',
};

export function AiCampaignWizard({ onClose, onSetupRequired }: { onClose: () => void; onSetupRequired?: () => void }) {
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [showTtFields, setShowTtFields] = useState(false);
  const [ttId, setTtId] = useState('');
  const [ttToken, setTtToken] = useState('');
  const [connectingFb, setConnectingFb] = useState(false);

  const { data: rawFb } = useQuery({
    queryKey: ['fb-account'],
    queryFn: () => apiClient.get<FbAccount | null>('/v1/crm/fb-ads/account'),
  });
  const { data: rawTt } = useQuery({
    queryKey: ['tt-account'],
    queryFn: () => apiClient.get<TtAccount | null>('/v1/crm/tiktok-ads/account'),
  });
  const { data: rawGoogle } = useQuery({
    queryKey: ['google-ads-account'],
    queryFn: () => apiClient.get<PlatformAccount | null>('/v1/crm/google-ads/account'),
  });
  const { data: rawTwitter } = useQuery({
    queryKey: ['twitter-ads-account'],
    queryFn: () => apiClient.get<PlatformAccount | null>('/v1/crm/twitter-ads/account'),
  });
  const { data: rawLinkedIn } = useQuery({
    queryKey: ['linkedin-ads-account'],
    queryFn: () => apiClient.get<PlatformAccount | null>('/v1/crm/linkedin-ads/account'),
  });

  const fbReady = !!(rawFb as unknown as FbAccount | null)?.isActive;
  const ttReady = !!(rawTt as unknown as TtAccount | null)?.isActive;
  const googleReady = !!(rawGoogle as unknown as PlatformAccount | null)?.isActive;
  const twitterReady = !!(rawTwitter as unknown as PlatformAccount | null)?.isActive;
  const linkedInReady = !!(rawLinkedIn as unknown as PlatformAccount | null)?.isActive;
  const anyReady = fbReady || ttReady || googleReady || twitterReady || linkedInReady;

  const connectFb = async () => {
    setConnectingFb(true);
    try {
      const redir = window.location.origin + window.location.pathname;
      const res = await apiClient.get<{ authUrl: string; state: string }>(
        `/v1/crm/fb-ads/oauth/url?redirectUri=${encodeURIComponent(redir)}`
      ) as unknown as { authUrl: string; state: string };
      sessionStorage.setItem('fb_oauth_redirect', redir);
      window.location.href = res.authUrl;
    } catch {
      setConnectingFb(false);
      if (onSetupRequired) {
        onClose();
        onSetupRequired();
      } else {
        toast.error('Meta App not configured. Open Setup to add your App ID and App Secret.');
      }
    }
  };

  const ttConnect = useMutation({
    mutationFn: () => apiClient.post('/v1/crm/tiktok-ads/account', {
      advertiserId: ttId, accessToken: ttToken, businessName: 'My Business',
    }),
    onSuccess: () => {
      toast.success('TikTok connected!');
      qc.invalidateQueries({ queryKey: ['tt-account'] });
      setShowTtFields(false);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed'),
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const draft = await apiClient.post('/v1/crm/fb-ads/campaigns/ai-draft', {
        prompt, objective: 'OUTCOME_LEADS',
      }) as unknown as AiDraft;

      const base = {
        name: draft.name, adName: draft.adName || draft.name,
        headline: draft.headline, callToAction: draft.callToAction || 'LEARN_MORE',
        destinationUrl: 'https://example.com',
        startTime: new Date().toISOString(),
        ageMin: draft.ageMin || 18, ageMax: draft.ageMax || 65,
      };
      let ok = 0;

      if (fbReady) {
        await apiClient.post('/v1/crm/fb-ads/campaigns', {
          ...base, objective: draft.objective || 'OUTCOME_LEADS',
          budgetType: 'daily', budget: draft.suggestedDailyBudget || 10,
          genders: [], countryCodes: ['US'], interests: [],
          platforms: ['facebook', 'instagram'], adBody: draft.adBody,
        });
        ok++;
      }
      if (ttReady) {
        await apiClient.post('/v1/crm/tiktok-ads/campaigns', {
          ...base, name: draft.name + ' (TikTok)',
          objective: TT_OBJ[draft.objective] || 'TRAFFIC',
          budgetType: 'BUDGET_MODE_DAY', budget: draft.suggestedDailyBudget || 10,
          genders: [], locationIds: [], interestCategoryIds: [],
          platforms: ['tiktok'], adText: draft.adBody,
          ageMax: Math.min(draft.ageMax || 55, 55),
        });
        ok++;
      }
      if (googleReady) {
        await apiClient.post('/v1/crm/google-ads/campaigns', {
          name: draft.name + ' (Google)', campaignType: 'SEARCH',
          dailyBudget: draft.suggestedDailyBudget || 10, budgetCurrency: 'USD',
          headline: draft.headline, adBody: draft.adBody,
          callToAction: draft.callToAction || 'Learn more',
          targetLocations: ['US'], targetKeywords: draft.interestKeywords || [],
        });
        ok++;
      }
      if (twitterReady) {
        await apiClient.post('/v1/crm/twitter-ads/campaigns', {
          name: draft.name + ' (X/Twitter)', objective: 'TWEET_ENGAGEMENTS',
          dailyBudget: draft.suggestedDailyBudget || 10,
          tweetText: draft.adBody, targeting: {},
        });
        ok++;
      }
      if (linkedInReady) {
        await apiClient.post('/v1/crm/linkedin-ads/campaigns', {
          name: draft.name + ' (LinkedIn)', objective: 'BRAND_AWARENESS',
          dailyBudget: draft.suggestedDailyBudget || 10,
          headline: draft.headline, body: draft.adBody,
          targeting: {},
        });
        ok++;
      }
      return ok;
    },
    onSuccess: (ok) => {
      [
        'fb-campaigns', 'fb-aggregate',
        'tt-campaigns', 'tt-aggregate',
        'google-ads-campaigns', 'google-ads-aggregate',
        'twitter-ads-campaigns', 'twitter-ads-aggregate',
        'linkedin-ads-campaigns', 'linkedin-ads-aggregate',
      ].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      toast.success(`Campaign created on ${ok} platform${ok > 1 ? 's' : ''}! Saved as PAUSED.`);
      onClose();
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : '';
      if (msg.toLowerCase().includes('page') || msg.toLowerCase().includes('app id')) {
        if (onSetupRequired) { onClose(); onSetupRequired(); }
        else toast.error('Facebook Page not connected. Open Setup to complete your Meta configuration.');
      } else {
        toast.error(msg || 'Failed to create campaign');
      }
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim()) { toast.error('Tell us what you want to promote'); return; }
    if (!anyReady) return;
    createMut.mutate();
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
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <div>
            <h2 className="text-base font-extrabold leading-tight flex items-center gap-2" style={{ background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #00FFAA 0%, #00B368 100%)' }}>
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} style={{ color: '#0A0F0D' }} />
              </div>
              AI Campaign
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Create ads with AI in seconds</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <textarea
            className="w-full px-3.5 py-3 rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,217,138,0.50)] transition-all min-h-[100px] resize-none"
            style={{ backgroundColor: '#1A2F27', backgroundImage: 'linear-gradient(to bottom, rgba(123,97,255,0.11) 0%, rgba(123,97,255,0.03) 40%, rgba(0,0,0,0.08) 100%)', border: '1px solid rgba(0,217,138,0.20)' }}
            placeholder="e.g. Summer 30% off on all laptops for young professionals"
            value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={500} autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />

          {/* Quick ideas */}
          <div className="flex flex-wrap gap-1.5">
            {['New product launch', 'Get more leads', 'Drive website traffic', 'Brand awareness'].map(s => (
              <button key={s} onClick={() => setPrompt(s)}
                className="px-2.5 py-1 rounded-full border border-border-subtle text-[10px] font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary transition-all">
                {s}
              </button>
            ))}
          </div>

          {/* Connected badges */}
          {anyReady && (
            <div className="flex flex-wrap gap-2">
              {fbReady && <Badge icon={Facebook} label="Facebook" />}
              {ttReady && <Badge icon={Video} label="TikTok" />}
              {googleReady && <Badge icon={Youtube} label="Google" />}
              {twitterReady && <Badge icon={Twitter} label="X / Twitter" />}
              {linkedInReady && <Badge icon={Linkedin} label="LinkedIn" />}
            </div>
          )}

          {/* Connect section — only when no platform connected */}
          {!anyReady && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-text-muted">Connect a platform to get started:</p>

              <button onClick={connectFb} disabled={connectingFb}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1877F2] text-white font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-all">
                {connectingFb
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                  : <><LogIn className="w-4 h-4" /> Login with Facebook</>}
              </button>
              <p className="text-[10px] text-text-muted text-center">
                One click — auto-connects your Ad Account, Page & credentials
              </p>

              {!showTtFields ? (
                <button onClick={() => setShowTtFields(true)}
                  className="w-full text-center text-[10px] text-text-muted hover:text-text-secondary transition-all py-1">
                  or connect TikTok manually
                </button>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 space-y-2">
                  <input value={ttId} onChange={e => setTtId(e.target.value)}
                    placeholder="Advertiser ID"
                    className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
                  <input value={ttToken} onChange={e => setTtToken(e.target.value)}
                    placeholder="Access Token" type="password"
                    className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
                  <button onClick={() => ttConnect.mutate()}
                    disabled={ttConnect.isPending || !ttId || !ttToken}
                    className="w-full py-2 rounded-lg bg-brand text-bg text-xs font-bold disabled:opacity-40 transition-all">
                    {ttConnect.isPending ? 'Connecting...' : 'Connect TikTok'}
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-text-muted text-center">
            {anyReady
              ? 'AI picks copy, audience, budget & platforms. Campaigns launch as PAUSED.'
              : 'After connecting, just type what you want to promote and hit launch.'}
          </p>
        </div>

        {/* Footer — sticky action button */}
        {anyReady && (
          <div className="shrink-0 px-6 py-4 border-t border-border-subtle">
            <button onClick={handleSubmit} disabled={createMut.isPending || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-bg font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-all">
              {createMut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> AI is creating your campaign...</>
                : <><Rocket className="w-4 h-4" /> Create & Launch</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }: { icon: typeof Facebook; label: string }) {
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-success bg-success-soft border border-[rgba(34,197,94,0.2)]">
      <Icon className="w-3 h-3" strokeWidth={1.6} /> {label} <CheckCircle className="w-3 h-3" />
    </span>
  );
}
