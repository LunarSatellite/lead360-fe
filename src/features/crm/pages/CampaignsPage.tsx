import { useState } from 'react';
import {
  Plus, Zap, ChevronDown, ChevronUp, X, Loader2,
  Send, Clock, Ban, BarChart2, Mail, MessageSquare, Trash2,
  Calendar, Users, TrendingUp, DollarSign, Target, Link2,
  PlusCircle, RefreshCw, Unplug,
} from 'lucide-react';
import {
  // B2B campaigns
  useCrmCampaigns, useCreateCrmCampaign, useDeleteCrmCampaign,
  usePreviewCrmCampaign, useScheduleCrmCampaign, useLaunchCrmCampaign,
  useCancelCrmCampaign, useCrmCampaignPerformance,
  useCrmCampaignsAggregate,
  useCrmCampaignAttributions, useAddCrmCampaignAttribution, useDeleteCrmCampaignAttribution,
  useUpdateCrmCampaignBudget, useCrmCampaignRecipients,
  // Lead campaigns (existing)
  useCampaigns, useCreateCampaign, usePreviewSegment, useExecuteCampaign,
  // Facebook Ads
  useFbAdAccount, useFbAdCampaigns, useFbAdAggregate,
  useConnectFbAdAccount, useDisconnectFbAdAccount, useSyncFbAdCampaigns,
} from '../api/crm.queries';
import type {
  CrmCampaignSummaryDto, CrmCampaignPreviewDto,
  CrmCampaignPerformanceDashboardDto, CrmCampaignAttributionDto,
  CrmCampaignRecipientDto,
  CrmCampaignCreateRequest, CrmCampaignAttributionCreateRequest,
  CrmCampaignBudgetUpdateRequest,
  LeadCampaignDto, LeadCampaignCreateRequest, LeadSegmentFilter,
  FbAdCampaignDto, FbAdAccountConnectRequest,
} from '../types/crm.types';
import {
  CrmCampaignChannelType, CRM_CAMPAIGN_CHANNEL_LABELS,
  CampaignStatus, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  CampaignGoalType, CAMPAIGN_GOAL_LABELS,
  CampaignAttributionModel, ATTRIBUTION_MODEL_LABELS,
  CampaignAttributedEntityType, ATTRIBUTED_ENTITY_LABELS,
  LeadStage, LEAD_STAGE_LABELS,
} from '../types/crm.types';
import { formatDistanceToNow, format } from 'date-fns';

type MainTab = 'b2b' | 'leads' | 'fb-ads';

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-medium';

// Matches backend RecipientStatus enum: Pending=1, Sent=2, Failed=3, Replied=4, Opened=5
const RECIPIENT_STATUS_LABEL: Record<number, string> = {
  1: 'Pending', 2: 'Sent', 3: 'Failed', 4: 'Replied', 5: 'Opened',
};
const RECIPIENT_STATUS_CLS: Record<number, string> = {
  2: 'text-success', 3: 'text-danger', 4: 'text-brand', 5: 'text-brand',
};

const selectCls = `${inputCls} cursor-pointer`;

// ─── Shared centered modal ────────────────────────────────────────────────────

function SlideOver({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-elevated shadow-2xl flex flex-col border-thin border-border-subtle rounded-card max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest pt-2">{label}</p>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// B2B CAMPAIGNS TAB
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Create form ──────────────────────────────────────────────────────────────

type B2BFormState = {
  name: string;
  description: string;
  channelType: CrmCampaignChannelType;
  subject: string;
  bodyTemplate: string;
  targetFilterJson: string;
  scheduledAt: string;
  // Budget
  budgetAmount: string;
  budgetCurrency: string;
  costPerSend: string;
  // Goal
  goalType: string;
  goalTarget: string;
  // Attribution
  defaultAttributionModel: string;
  // UTM
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
};

const EMPTY_B2B: B2BFormState = {
  name: '', description: '',
  channelType: CrmCampaignChannelType.Email,
  subject: '', bodyTemplate: '', targetFilterJson: '', scheduledAt: '',
  budgetAmount: '', budgetCurrency: 'USD', costPerSend: '',
  goalType: '', goalTarget: '',
  defaultAttributionModel: String(CampaignAttributionModel.LastTouch),
  utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '',
};

const CHANNEL_ICONS: Record<number, React.ElementType> = {
  1: Mail,        // Email
  2: MessageSquare, // WhatsApp
  3: MessageSquare, // SMS
};
const ChannelIconFallback = Send; // shown for any future channel type

function B2BCreateForm({ onSave, onCancel, isSaving }: {
  onSave: (req: CrmCampaignCreateRequest) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<B2BFormState>(EMPTY_B2B);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterJsonError, setFilterJsonError] = useState('');
  const set = (k: keyof B2BFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const isEmailChannel = form.channelType === CrmCampaignChannelType.Email;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.targetFilterJson) {
      try { JSON.parse(form.targetFilterJson); }
      catch { setFilterJsonError('Invalid JSON — fix syntax before saving.'); return; }
    }
    setFilterJsonError('');
    const req: CrmCampaignCreateRequest = {
      name: form.name,
      description: form.description || undefined,
      channelType: form.channelType,
      subject: isEmailChannel ? form.subject : undefined,
      bodyTemplate: form.bodyTemplate,
      targetFilterJson: form.targetFilterJson || undefined,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      // Budget
      budgetAmount: form.budgetAmount ? parseFloat(form.budgetAmount) : undefined,
      budgetCurrency: form.budgetCurrency || 'USD',
      costPerSend: form.costPerSend ? parseFloat(form.costPerSend) : undefined,
      // Goal
      goalType: form.goalType ? (parseInt(form.goalType) as CampaignGoalType) : undefined,
      goalTarget: form.goalTarget ? parseFloat(form.goalTarget) : undefined,
      // Attribution
      defaultAttributionModel: form.defaultAttributionModel
        ? (parseInt(form.defaultAttributionModel) as CampaignAttributionModel)
        : undefined,
      // UTM
      utmSource: form.utmSource || undefined,
      utmMedium: form.utmMedium || undefined,
      utmCampaign: form.utmCampaign || undefined,
      utmContent: form.utmContent || undefined,
    };
    onSave(req);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Core */}
      <SectionLabel label="Campaign" />
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Campaign Name *</label>
        <input required value={form.name} onChange={set('name')} placeholder="May B2B Outreach" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label>
        <input value={form.description} onChange={set('description')} placeholder="What is this campaign for?" className={inputCls} />
      </div>

      {/* Channel */}
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Channel</label>
        <div className="flex gap-2">
          {([CrmCampaignChannelType.Email, CrmCampaignChannelType.WhatsApp, CrmCampaignChannelType.SMS] as CrmCampaignChannelType[]).map((ch) => {
            const Icon = CHANNEL_ICONS[ch] ?? ChannelIconFallback;
            const active = form.channelType === ch;
            return (
              <button
                key={ch} type="button"
                onClick={() => setForm((f) => ({ ...f, channelType: ch }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${active ? 'bg-brand text-bg border-brand' : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-medium'}`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {CRM_CAMPAIGN_CHANNEL_LABELS[ch]}
              </button>
            );
          })}
        </div>
      </div>

      {isEmailChannel && (
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Subject Line *</label>
          <input required value={form.subject} onChange={set('subject')} placeholder="Exclusive offer for {{FullName}}" className={inputCls} />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Message Body *</label>
        <textarea required rows={4} value={form.bodyTemplate} onChange={set('bodyTemplate')}
          placeholder={isEmailChannel
            ? `Hi {{FullName}},\n\nWe wanted to reach out…`
            : `Hi {{FirstName}}! We have something special for you. Reply to learn more.`}
          className={`${inputCls} resize-none`} />
        <p className="text-xs text-text-muted mt-1">
          Tokens: <code className="text-brand">{'{{FullName}}'}</code>{' '}
          <code className="text-brand">{'{{Email}}'}</code>
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">
          Target Filter JSON <span className="text-text-muted font-normal">(leave blank for all contacts)</span>
        </label>
        <textarea rows={2} value={form.targetFilterJson}
          onChange={(e) => { set('targetFilterJson')(e); setFilterJsonError(''); }}
          placeholder={'{"hasOpenDeals": true}'} className={`${inputCls} resize-none font-mono text-xs ${filterJsonError ? 'border-danger' : ''}`} />
        {filterJsonError && <p className="text-xs text-danger mt-1">{filterJsonError}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">
          Schedule At <span className="text-text-muted font-normal">(leave blank to save as draft)</span>
        </label>
        <input type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} className={inputCls} />
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showAdvanced ? 'Hide' : 'Show'} Budget, Goals &amp; UTM
      </button>

      {showAdvanced && (
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-4">
          {/* Budget */}
          <SectionLabel label="Budget" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-text-muted mb-1">Budget Amount</label>
              <input type="number" min="0" step="0.01" value={form.budgetAmount} onChange={set('budgetAmount')} placeholder="5000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Currency</label>
              <input value={form.budgetCurrency} onChange={set('budgetCurrency')} placeholder="USD" maxLength={3} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Cost Per Send</label>
            <input type="number" min="0" step="0.0001" value={form.costPerSend} onChange={set('costPerSend')} placeholder="0.05" className={inputCls} />
          </div>

          {/* Goal */}
          <SectionLabel label="Goal" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Goal Type</label>
              <select value={form.goalType} onChange={set('goalType')} className={selectCls}>
                <option value="">No goal</option>
                {Object.entries(CAMPAIGN_GOAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Target</label>
              <input type="number" min="0" step="1" value={form.goalTarget} onChange={set('goalTarget')} placeholder="100" className={inputCls} />
            </div>
          </div>

          {/* Attribution */}
          <SectionLabel label="Attribution" />
          <div>
            <label className="block text-xs text-text-muted mb-1">Default Attribution Model</label>
            <select value={form.defaultAttributionModel} onChange={set('defaultAttributionModel')} className={selectCls}>
              {Object.entries(ATTRIBUTION_MODEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* UTM */}
          <SectionLabel label="UTM Tracking" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Source</label>
              <input value={form.utmSource} onChange={set('utmSource')} placeholder="email" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Medium</label>
              <input value={form.utmMedium} onChange={set('utmMedium')} placeholder="newsletter" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Campaign</label>
              <input value={form.utmCampaign} onChange={set('utmCampaign')} placeholder="q2_launch" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Content</label>
              <input value={form.utmContent} onChange={set('utmContent')} placeholder="subject_a" className={inputCls} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isSaving || !form.name.trim() || !form.bodyTemplate.trim() || (isEmailChannel && !form.subject.trim())}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Create Campaign</>}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({ onClose }: { onClose: () => void }) {
  const [filterJson, setFilterJson] = useState('{}');
  const [jsonError, setJsonError] = useState('');
  const preview = usePreviewCrmCampaign();
  const result = preview.data as unknown as CrmCampaignPreviewDto | undefined;

  const handlePreview = () => {
    try {
      JSON.parse(filterJson || '{}');
      setJsonError('');
      preview.mutate(filterJson || '{}');
    } catch {
      setJsonError('Invalid JSON — check syntax and try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5">Target Filter JSON</label>
        <textarea rows={3} value={filterJson} onChange={(e) => { setFilterJson(e.target.value); setJsonError(''); }}
          className={`${inputCls} resize-none font-mono text-xs ${jsonError ? 'border-danger' : ''}`} />
        {jsonError && <p className="text-xs text-danger mt-1">{jsonError}</p>}
      </div>
      <button onClick={handlePreview} disabled={preview.isPending}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-soft text-brand border border-border-glow text-sm font-semibold hover:bg-brand hover:text-bg transition-all disabled:opacity-50">
        {preview.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" strokeWidth={1.5} />}
        Preview Recipients
      </button>
      {preview.isError && (
        <p className="text-xs text-danger">Failed to preview recipients. Check filter and try again.</p>
      )}
      {result && (
        <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
          <p className="text-sm font-semibold text-text-primary">
            ~{result.estimatedRecipients} recipient{result.estimatedRecipients !== 1 ? 's' : ''}
          </p>
          {result.contacts.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {result.contacts.map((c) => (
                <div key={c.contactId} className="flex items-center justify-between text-xs gap-2">
                  <span className="font-medium text-text-primary truncate">{c.fullName}</span>
                  <span className="text-text-muted shrink-0">{c.email ?? c.phone ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button onClick={onClose} className="text-xs text-text-muted hover:text-text-primary">Close</button>
    </div>
  );
}

// ─── Performance panel ────────────────────────────────────────────────────────

function PerformancePanel({ campaignId }: { campaignId: string }) {
  const { data: raw, isLoading, isError } = useCrmCampaignPerformance(campaignId);
  const d = raw as unknown as CrmCampaignPerformanceDashboardDto | undefined;

  if (isLoading) return <div className="flex items-center justify-center h-24 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (isError) return <p className="text-sm text-danger">Failed to load performance data.</p>;
  if (!d) return <p className="text-sm text-text-muted">No data yet.</p>;

  const fmt = (n: number | null | undefined, suffix = '') =>
    n != null ? `${n.toFixed(1)}${suffix}` : '—';
  const fmtMoney = (n: number | null | undefined, currency = 'USD') =>
    n != null ? `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  const deliveryRows = [
    { label: 'Total Recipients', value: d.totalRecipients },
    { label: 'Sent', value: `${d.sentCount} (${fmt(d.deliveryRate, '%')})` },
    { label: 'Opened', value: `${d.openedCount} (${fmt(d.openRate, '%')})` },
    { label: 'Clicked', value: `${d.clickCount} (${fmt(d.clickRate, '%')})` },
    { label: 'Replied', value: `${d.repliedCount} (${fmt(d.replyRate, '%')})` },
    { label: 'Converted', value: `${d.convertedCount} (${fmt(d.conversionRate, '%')})` },
    { label: 'Failed', value: d.failedCount },
  ];

  const budgetRows = d.budgetAmount != null ? [
    { label: 'Budget', value: fmtMoney(d.budgetAmount, d.budgetCurrency) },
    { label: 'Spent', value: fmtMoney(d.actualSpend, d.budgetCurrency) },
    { label: 'Remaining', value: fmtMoney(d.budgetRemaining, d.budgetCurrency) },
    { label: 'Utilization', value: fmt(d.budgetUtilizationPct, '%') },
  ] : [];

  const efficiencyRows = [
    { label: 'Cost / Send', value: fmtMoney(d.costPerSend) },
    { label: 'Cost / Open', value: fmtMoney(d.costPerOpen) },
    { label: 'Cost / Click', value: fmtMoney(d.costPerClick) },
    { label: 'Cost / Conversion', value: fmtMoney(d.costPerConversion) },
    { label: 'Cost / Lead', value: fmtMoney(d.costPerLead) },
  ].filter((r) => r.value !== '—');

  const roiRows = [
    { label: 'Attributed Revenue', value: fmtMoney(d.attributedRevenue) },
    { label: 'Attributed Leads', value: d.attributedLeadsCount },
    { label: 'ROI', value: d.roi != null ? `${d.roi.toFixed(1)}%` : '—' },
    { label: 'Revenue / Send', value: fmtMoney(d.revenuePerSend) },
  ];

  if (d.goalType != null && d.goalAchievementPct != null) {
    roiRows.push({ label: `${CAMPAIGN_GOAL_LABELS[d.goalType as CampaignGoalType]} Goal`, value: `${d.goalAchievementPct.toFixed(1)}% achieved` });
  }

  const Row = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Delivery Funnel</p>
        {deliveryRows.map((r) => <Row key={r.label} {...r} />)}
      </div>
      {budgetRows.length > 0 && (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Budget</p>
          {budgetRows.map((r) => <Row key={r.label} {...r} />)}
        </div>
      )}
      {efficiencyRows.length > 0 && (
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Efficiency</p>
          {efficiencyRows.map((r) => <Row key={r.label} {...r} />)}
        </div>
      )}
      <div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Revenue &amp; ROI</p>
        {roiRows.map((r) => <Row key={r.label} {...r} />)}
      </div>
      {d.durationMinutes != null && (
        <p className="text-xs text-text-muted">Duration: {d.durationMinutes < 60 ? `${d.durationMinutes}m` : `${(d.durationMinutes / 60).toFixed(1)}h`}</p>
      )}
    </div>
  );
}

// ─── Attribution panel ────────────────────────────────────────────────────────

function AttributionPanel({ campaignId }: { campaignId: string }) {
  const { data: raw, isLoading, isError } = useCrmCampaignAttributions(campaignId);
  const attributions = (raw as unknown as CrmCampaignAttributionDto[] | undefined) ?? [];
  const addAttribution = useAddCrmCampaignAttribution();
  const removeAttribution = useDeleteCrmCampaignAttribution();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ entityType: string; entityId: string; revenue: string; model: string; notes: string }>({
    entityType: String(CampaignAttributedEntityType.Lead),
    entityId: '', revenue: '0', model: '', notes: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CrmCampaignAttributionCreateRequest = {
      entityType: parseInt(form.entityType) as typeof CampaignAttributedEntityType[keyof typeof CampaignAttributedEntityType],
      entityId: form.entityId.trim(),
      attributionModel: form.model ? parseInt(form.model) as CampaignAttributionModel : undefined,
      attributedRevenue: parseFloat(form.revenue) || 0,
      notes: form.notes || undefined,
    };
    addAttribution.mutate({ id: campaignId, data: req }, {
      onSuccess: () => { setShowForm(false); setForm({ entityType: '1', entityId: '', revenue: '0', model: '', notes: '' }); },
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-16 text-text-muted"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  if (isError) return <p className="text-xs text-danger">Failed to load attributions.</p>;

  return (
    <div className="space-y-3">
      {attributions.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-3">No attributions recorded yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {attributions.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle gap-2">
              <div className="min-w-0">
                <span className="font-semibold text-text-primary">{ATTRIBUTED_ENTITY_LABELS[a.entityType]}</span>
                <span className="text-text-muted ml-1.5">{a.entityId.slice(0, 8)}…</span>
                {a.attributedRevenue > 0 && (
                  <span className="text-success ml-1.5">+${a.attributedRevenue.toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-text-muted">{ATTRIBUTION_MODEL_LABELS[a.attributionModel]}</span>
                <button
                  onClick={() => removeAttribution.mutate({ campaignId, attributionId: a.id })}
                  disabled={removeAttribution.isPending}
                  className="p-0.5 text-text-muted hover:text-danger transition-colors"
                ><X className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="rounded-xl border border-border-subtle bg-bg-elevated p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.entityType} onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))} className={selectCls}>
              {Object.entries(ATTRIBUTED_ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input required value={form.entityId} onChange={(e) => setForm((f) => ({ ...f, entityId: e.target.value }))}
              placeholder="Entity ID (GUID)" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-text-muted mb-1">Revenue ($)</label>
              <input type="number" min="0" step="0.01" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-1">Attribution Model</label>
              <select value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className={selectCls}>
                <option value="">Default</option>
                {Object.entries(ATTRIBUTION_MODEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" className={inputCls} />
          <div className="flex gap-2">
            <button type="submit" disabled={addAttribution.isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-bg text-xs font-bold disabled:opacity-50">
              {addAttribution.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-text-muted hover:text-text-primary">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Add Attribution
        </button>
      )}
    </div>
  );
}

// ─── Budget update panel ──────────────────────────────────────────────────────

function BudgetPanel({ campaign, onDone }: { campaign: CrmCampaignSummaryDto; onDone: () => void }) {
  const updateBudget = useUpdateCrmCampaignBudget();
  const [form, setForm] = useState({
    budgetAmount: campaign.budgetAmount?.toString() ?? '',
    budgetCurrency: campaign.budgetCurrency ?? 'USD',
    costPerSend: campaign.costPerSend?.toString() ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const req: CrmCampaignBudgetUpdateRequest = {
      budgetAmount: form.budgetAmount ? parseFloat(form.budgetAmount) : undefined,
      budgetCurrency: form.budgetCurrency || 'USD',
      costPerSend: form.costPerSend ? parseFloat(form.costPerSend) : undefined,
    };
    updateBudget.mutate({ id: campaign.id, data: req }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-[10px] text-text-muted mb-1">Budget Amount</label>
          <input type="number" min="0" step="0.01" value={form.budgetAmount}
            onChange={(e) => setForm((f) => ({ ...f, budgetAmount: e.target.value }))}
            placeholder="5000" className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] text-text-muted mb-1">Currency</label>
          <input value={form.budgetCurrency} maxLength={3}
            onChange={(e) => setForm((f) => ({ ...f, budgetCurrency: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-text-muted mb-1">Cost Per Send</label>
        <input type="number" min="0" step="0.0001" value={form.costPerSend}
          onChange={(e) => setForm((f) => ({ ...f, costPerSend: e.target.value }))}
          placeholder="0.05" className={inputCls} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={updateBudget.isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-bg text-xs font-bold disabled:opacity-50">
          {updateBudget.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update'}
        </button>
        <button type="button" onClick={onDone} className="text-xs text-text-muted hover:text-text-primary">Cancel</button>
      </div>
    </form>
  );
}

// ─── Recipients panel ─────────────────────────────────────────────────────────

function RecipientsPanel({ campaignId }: { campaignId: string }) {
  const { data: raw, isLoading, isError } = useCrmCampaignRecipients(campaignId);
  const recipients = (raw as unknown as CrmCampaignRecipientDto[] | undefined) ?? [];

  if (isLoading) return <div className="flex items-center justify-center h-16 text-text-muted"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  if (isError) return <p className="text-xs text-danger">Failed to load recipients.</p>;
  if (recipients.length === 0) return <p className="text-xs text-text-muted text-center py-3">No recipients yet. Launch the campaign to populate this list.</p>;

  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto">
      {recipients.map((r) => (
        <div key={r.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-bg-elevated border border-border-subtle gap-2">
          <div className="min-w-0">
            <span className="font-medium text-text-primary truncate">{r.contactName ?? r.toAddress ?? r.contactId.slice(0, 8)}</span>
            {r.toAddress && <span className="text-text-muted ml-1.5">{r.toAddress}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`${RECIPIENT_STATUS_CLS[r.status] ?? 'text-text-muted'} font-semibold`}>
              {RECIPIENT_STATUS_LABEL[r.status] ?? 'Unknown'}
            </span>
            {r.failureReason && (
              <span className="text-danger text-[10px] truncate max-w-[100px]" title={r.failureReason}>
                {r.failureReason}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Schedule inline ──────────────────────────────────────────────────────────

function ScheduleInline({ campaignId, onDone }: { campaignId: string; onDone: () => void }) {
  const [dt, setDt] = useState('');
  const schedule = useScheduleCrmCampaign();

  return (
    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
      <input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)}
        className="px-2 py-1 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-primary focus:outline-none" />
      <button
        disabled={!dt || schedule.isPending}
        onClick={() => {
          const iso = new Date(dt).toISOString();
          schedule.mutate({ id: campaignId, scheduledAt: iso }, { onSuccess: onDone });
        }}
        className="px-3 py-1 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold hover:bg-brand hover:text-bg transition-all disabled:opacity-50"
      >
        {schedule.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Set'}
      </button>
      <button onClick={onDone} className="text-xs text-text-muted hover:text-text-primary">×</button>
    </div>
  );
}

// ─── B2B Campaign card ────────────────────────────────────────────────────────

type CardPanel = 'none' | 'preview' | 'performance' | 'schedule' | 'attribution' | 'budget' | 'recipients';

function B2BCampaignCard({ campaign }: { campaign: CrmCampaignSummaryDto }) {
  const [panel, setPanel] = useState<CardPanel>('none');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const launch = useLaunchCrmCampaign();
  const cancel = useCancelCrmCampaign();
  const deleteCampaign = useDeleteCrmCampaign();

  const isDraft = campaign.status === CampaignStatus.Draft;
  const isScheduled = campaign.status === CampaignStatus.Scheduled;
  const isRunning = campaign.status === CampaignStatus.Running;
  const ChannelIcon = CHANNEL_ICONS[campaign.channelType] ?? ChannelIconFallback;

  const togglePanel = (p: CardPanel) => setPanel((prev) => prev === p ? 'none' : p);

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-text-primary truncate">{campaign.name}</h3>
            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}>
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </span>
          </div>
          {campaign.description && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 text-xs text-text-muted px-2 py-1 rounded-lg bg-bg-elevated border border-border-subtle">
            <ChannelIcon className="w-3 h-3" strokeWidth={1.5} />
            {CRM_CAMPAIGN_CHANNEL_LABELS[campaign.channelType]}
          </span>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => deleteCampaign.mutate(campaign.id)} disabled={deleteCampaign.isPending}
                className="px-2 py-1 rounded-lg bg-danger text-bg text-xs font-bold disabled:opacity-50">
                {deleteCampaign.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Del'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-text-muted">×</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft border border-transparent hover:border-[rgba(244,63,94,0.2)] transition-all">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {(campaign.sentCount > 0 || campaign.totalRecipients > 0) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
          <span><span className="font-semibold text-text-primary">{campaign.totalRecipients}</span> recipients</span>
          <span><span className="font-semibold text-text-primary">{campaign.sentCount}</span> sent</span>
          {campaign.openedCount > 0 && (
            <span><span className="font-semibold text-text-primary">{campaign.openedCount}</span> opened</span>
          )}
          {campaign.attributedRevenue > 0 && (
            <span className="text-success font-semibold">${campaign.attributedRevenue.toLocaleString()} attributed</span>
          )}
          {campaign.budgetAmount != null && (
            <span className="text-text-muted">
              Budget: ${campaign.actualSpend.toLocaleString()} / ${campaign.budgetAmount.toLocaleString()} {campaign.budgetCurrency}
            </span>
          )}
        </div>
      )}

      {/* Goal badge */}
      {campaign.goalType != null && (
        <div className="flex items-center gap-1.5 text-xs">
          <Target className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
          <span className="text-text-muted">
            {CAMPAIGN_GOAL_LABELS[campaign.goalType]}
            {campaign.goalTarget != null && ` · target: ${campaign.goalTarget}`}
          </span>
        </div>
      )}

      {/* Dates */}
      <p className="text-xs text-text-muted">
        {isScheduled && campaign.scheduledAt && <>Scheduled for {format(new Date(campaign.scheduledAt), 'MMM d, HH:mm')} · </>}
        Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle flex-wrap">
        {isDraft && (
          <>
            <button onClick={() => togglePanel('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panel === 'preview' ? 'border-brand text-brand bg-brand-soft' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} /> Preview
            </button>
            <button onClick={() => togglePanel('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panel === 'schedule' ? 'border-brand text-brand bg-brand-soft' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} /> Schedule
            </button>
            <button onClick={() => launch.mutate(campaign.id)} disabled={launch.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-soft text-brand border border-border-glow text-xs font-semibold hover:bg-brand hover:text-bg transition-all disabled:opacity-50">
              {launch.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" strokeWidth={1.5} /> Launch</>}
            </button>
          </>
        )}
        {(isScheduled || isRunning) && (
          <button onClick={() => cancel.mutate(campaign.id)} disabled={cancel.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-secondary hover:text-danger hover:bg-danger-soft hover:border-[rgba(244,63,94,0.2)] transition-all disabled:opacity-50">
            {cancel.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Ban className="w-3.5 h-3.5" strokeWidth={1.5} /> Cancel</>}
          </button>
        )}
        {/* Always available */}
        <button onClick={() => togglePanel('performance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panel === 'performance' ? 'border-brand text-brand bg-brand-soft' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
          <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Performance
        </button>
        {campaign.totalRecipients > 0 && (
          <button onClick={() => togglePanel('recipients')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panel === 'recipients' ? 'border-brand text-brand bg-brand-soft' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
            <Users className="w-3.5 h-3.5" strokeWidth={1.5} /> Recipients
            <span className="ml-0.5 px-1 rounded bg-bg-elevated text-text-muted text-[10px] font-bold">{campaign.totalRecipients}</span>
          </button>
        )}
        <button onClick={() => togglePanel('attribution')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panel === 'attribution' ? 'border-brand text-brand bg-brand-soft' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
          <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Attribution
          {campaign.attributedLeadsCount > 0 && (
            <span className="ml-0.5 px-1 rounded bg-brand-soft text-brand text-[10px] font-bold">{campaign.attributedLeadsCount}</span>
          )}
        </button>
        <button onClick={() => togglePanel('budget')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${panel === 'budget' ? 'border-brand text-brand bg-brand-soft' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated'}`}>
          <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} /> Budget
        </button>
      </div>

      {/* Inline panels */}
      {panel !== 'none' && (
        <div className="pt-3 border-t border-border-subtle">
          {panel === 'preview' && <PreviewPanel onClose={() => setPanel('none')} />}
          {panel === 'performance' && <PerformancePanel campaignId={campaign.id} />}
          {panel === 'recipients' && <RecipientsPanel campaignId={campaign.id} />}
          {panel === 'attribution' && <AttributionPanel campaignId={campaign.id} />}
          {panel === 'budget' && <BudgetPanel campaign={campaign} onDone={() => setPanel('none')} />}
          {panel === 'schedule' && <ScheduleInline campaignId={campaign.id} onDone={() => setPanel('none')} />}
          {panel !== 'preview' && panel !== 'schedule' && (
            <button onClick={() => setPanel('none')} className="mt-3 text-xs text-text-muted hover:text-text-primary">Close</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Aggregate bar ────────────────────────────────────────────────────────────

function AggregateBar() {
  const { data: raw } = useCrmCampaignsAggregate();
  const agg = raw as any;
  if (!agg) return null;

  const items = [
    { icon: Send, label: 'Campaigns', value: agg.totalCampaigns, sub: `${agg.runningCount} running` },
    { icon: Users, label: 'Total Sent', value: (agg.totalSent as number).toLocaleString(), sub: `${agg.overallOpenRate?.toFixed(1)}% open` },
    { icon: TrendingUp, label: 'Total Revenue', value: `$${(agg.totalAttributedRevenue as number).toLocaleString()}`, sub: `${agg.totalAttributedLeads} leads` },
    { icon: DollarSign, label: 'Total Spend', value: `$${(agg.totalActualSpend as number).toLocaleString()}`, sub: agg.overallRoi != null ? `ROI ${agg.overallRoi.toFixed(1)}%` : 'no ROI data' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ icon: Icon, label, value, sub }) => (
        <div key={label} className="rounded-xl border border-border-subtle bg-bg-card px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</span>
          </div>
          <p className="text-lg font-extrabold text-text-primary">{value}</p>
          <p className="text-[10px] text-text-muted">{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── B2B campaigns tab ────────────────────────────────────────────────────────

function B2BCampaignsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: raw, isLoading } = useCrmCampaigns();
  const campaigns = (raw as unknown as CrmCampaignSummaryDto[] | undefined) ?? [];
  const createCampaign = useCreateCrmCampaign();

  return (
    <>
      <div className="space-y-4">
        <AggregateBar />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
          </p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Campaign
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted rounded-2xl border border-border-subtle bg-bg-card">
            <Send className="w-8 h-8 opacity-25" strokeWidth={1.2} />
            <p className="text-sm font-semibold">No campaigns yet</p>
            <p className="text-xs text-center max-w-xs">Create a B2B campaign to send targeted messages to your CRM contacts.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.map((c: CrmCampaignSummaryDto) => (
              <B2BCampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
      {showCreate && (
        <SlideOver title="New B2B Campaign" onClose={() => setShowCreate(false)}>
          <B2BCreateForm
            onSave={(req) => createCampaign.mutate(req, { onSuccess: () => setShowCreate(false) })}
            onCancel={() => setShowCreate(false)}
            isSaving={createCampaign.isPending}
          />
        </SlideOver>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD OUTREACH TAB (existing B2C campaigns — preserved)
// ═══════════════════════════════════════════════════════════════════════════════

const SELECTABLE_STAGES: LeadStage[] = [LeadStage.New, LeadStage.Warm, LeadStage.Hot, LeadStage.Nurturing];

function StageCheckboxes({ selected, onChange }: { selected: LeadStage[]; onChange: (s: LeadStage[]) => void }) {
  const toggle = (s: LeadStage) =>
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);
  return (
    <div className="flex flex-wrap gap-2">
      {SELECTABLE_STAGES.map((s) => (
        <button key={s} type="button" onClick={() => toggle(s)}
          className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${selected.includes(s) ? 'text-brand bg-brand-soft border-border-glow' : 'text-text-secondary bg-bg-elevated border-border-subtle hover:border-border-medium'}`}>
          {LEAD_STAGE_LABELS[s]}
        </button>
      ))}
    </div>
  );
}

interface LeadCampaignFormState {
  name: string; description: string; messageTemplate: string;
  stages: LeadStage[]; minScore: number; lastActiveDays: number;
}
function emptyLeadForm(): LeadCampaignFormState {
  return { name: '', description: '', messageTemplate: '', stages: [], minScore: 0, lastActiveDays: 30 };
}
function formToLeadRequest(f: LeadCampaignFormState): LeadCampaignCreateRequest {
  const filter: LeadSegmentFilter = {};
  if (f.stages.length > 0) filter.stages = f.stages;
  if (f.minScore > 0) filter.minScore = f.minScore;
  if (f.lastActiveDays > 0) filter.lastActiveDays = f.lastActiveDays;
  return {
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    messageTemplate: f.messageTemplate.trim(),
    segmentFilter: Object.keys(filter).length > 0 ? filter : undefined,
  };
}

function LeadCreateModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<LeadCampaignFormState>(emptyLeadForm());
  const createCampaign = useCreateCampaign();
  const previewSegment = usePreviewSegment();
  const setField = <K extends keyof LeadCampaignFormState>(k: K, v: LeadCampaignFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const preview = previewSegment.data as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-elevated border-thin border-border-subtle rounded-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-text-primary">New Lead Outreach Campaign</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); createCampaign.mutate(formToLeadRequest(form), { onSuccess: onClose }); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Name *</label>
            <input required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="May Warm Lead Outreach" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Description</label>
            <input value={form.description} onChange={(e) => setField('description', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Message Template *</label>
            <textarea rows={4} required value={form.messageTemplate} onChange={(e) => setField('messageTemplate', e.target.value)}
              placeholder="Hi {{CustomerName}}, we have a special offer for you…" className={`${inputCls} resize-none`} />
          </div>
          <div className="bg-bg-elevated border border-border-subtle rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Segment Filter</p>
            <div>
              <label className="block text-xs text-text-muted mb-2">Lead Stages</label>
              <StageCheckboxes selected={form.stages} onChange={(s) => setField('stages', s)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Min Score (0–100)</label>
                <input type="number" min={0} max={100} value={form.minScore} onChange={(e) => setField('minScore', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Active in last (days)</label>
                <input type="number" min={1} value={form.lastActiveDays} onChange={(e) => setField('lastActiveDays', Number(e.target.value))} className={inputCls} />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button type="button"
                onClick={() => previewSegment.mutate({ stages: form.stages.length > 0 ? form.stages : undefined, minScore: form.minScore > 0 ? form.minScore : undefined, lastActiveDays: form.lastActiveDays > 0 ? form.lastActiveDays : undefined })}
                disabled={previewSegment.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-soft border border-border-glow px-3 py-1.5 rounded-xl transition-all disabled:opacity-50">
                {previewSegment.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Preview Segment
              </button>
              {preview && <span className="text-xs text-text-secondary"><span className="font-semibold text-text-primary">{preview.matchCount}</span> leads match</span>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">Cancel</button>
            <button type="submit" disabled={createCampaign.isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all">
              {createCampaign.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadCampaignCard({ campaign }: { campaign: LeadCampaignDto }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmExecute, setConfirmExecute] = useState(false);
  const executeCampaign = useExecuteCampaign();
  const isDraft = campaign.status === CampaignStatus.Draft;

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-text-primary truncate">{campaign.name}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold border ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}>
          {CAMPAIGN_STATUS_LABELS[campaign.status]}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span><span className="font-semibold text-text-primary">{campaign.totalRecipients}</span> recipients</span>
        <span><span className="font-semibold text-text-primary">{campaign.sentCount}</span> sent</span>
        <span><span className="font-semibold text-text-primary">{campaign.failedCount}</span> failed</span>
      </div>
      <p className="text-xs text-text-muted">
        {(campaign as any).executedAt ? `Executed ${new Date((campaign as any).executedAt).toLocaleDateString()}` : 'Not yet executed'}
      </p>
      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
        {isDraft && (
          <>
            {confirmExecute ? (
              <div className="flex items-center gap-2">
                <button onClick={() => executeCampaign.mutate(campaign.id, { onSuccess: () => setConfirmExecute(false) })} disabled={executeCampaign.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-bg text-xs font-bold disabled:opacity-50">
                  {executeCampaign.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3" /> Confirm</>}
                </button>
                <button onClick={() => setConfirmExecute(false)} className="text-xs text-text-muted hover:text-text-primary">×</button>
              </div>
            ) : (
              <button onClick={() => setConfirmExecute(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-soft border border-border-glow px-3 py-1.5 rounded-xl transition-all">
                <Zap className="w-3.5 h-3.5" /> Execute
              </button>
            )}
          </>
        )}
        <button onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-bg-elevated border border-border-subtle px-3 py-1.5 rounded-xl transition-all ml-auto">
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</> : <><ChevronDown className="w-3.5 h-3.5" /> Details</>}
        </button>
      </div>
      {expanded && (
        <div className="pt-2 border-t border-border-subtle">
          {campaign.recipients.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-3">No recipients yet.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {campaign.recipients.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-bg-elevated">
                  <span className="text-text-secondary truncate">{r.leadId}</span>
                  <span className={RECIPIENT_STATUS_CLS[r.status] ?? 'text-text-muted'}>
                    {RECIPIENT_STATUS_LABEL[r.status] ?? 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeadOutreachTab() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useCampaigns(1);
  const campaigns = (data as any)?.items ?? [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-muted">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Campaign
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted rounded-2xl border border-border-subtle bg-bg-card">
            <Calendar className="w-8 h-8 opacity-25" strokeWidth={1.2} />
            <p className="text-sm font-semibold">No lead outreach campaigns</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.map((c: LeadCampaignDto) => <LeadCampaignCard key={c.id} campaign={c} />)}
          </div>
        )}
      </div>
      {showCreate && <LeadCreateModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACEBOOK / INSTAGRAM ADS TAB
// ═══════════════════════════════════════════════════════════════════════════════

const FB_STATUS_CLS: Record<string, string> = {
  ACTIVE: 'text-success bg-success-soft border-[rgba(34,197,94,0.2)]',
  PAUSED: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]',
  DELETED: 'text-danger bg-danger-soft border-[rgba(244,63,94,0.2)]',
  ARCHIVED: 'text-text-muted bg-bg-card border-border-subtle',
};

function FbAdCampaignCard({ c }: { c: FbAdCampaignDto }) {
  const statusCls = FB_STATUS_CLS[c.fbStatus] ?? 'text-text-muted bg-bg-card border-border-subtle';
  const budget = c.lifetimeBudget ?? c.dailyBudget;
  const budgetLabel = c.lifetimeBudget ? 'Lifetime' : c.dailyBudget ? 'Daily' : null;
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-text-primary text-sm truncate">{c.name}</p>
          {c.objective && <p className="text-[11px] text-text-muted mt-0.5">{c.objective}</p>}
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls}`}>
          {c.fbStatus}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Impressions', val: c.impressions.toLocaleString() },
          { label: 'Clicks', val: c.clicks.toLocaleString() },
          { label: 'Spend', val: `${c.budgetCurrency ?? '$'}${c.spend.toFixed(2)}` },
          { label: 'CTR', val: c.ctr != null ? `${c.ctr.toFixed(2)}%` : '—' },
          { label: 'CPC', val: c.cpc != null ? `${c.budgetCurrency ?? '$'}${c.cpc.toFixed(2)}` : '—' },
          { label: 'Leads', val: c.leadsCount.toString() },
        ].map(({ label, val }) => (
          <div key={label} className="bg-bg-elevated rounded-xl px-3 py-2">
            <p className="text-[10px] text-text-muted">{label}</p>
            <p className="text-sm font-bold text-text-primary mt-0.5">{val}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle">
        {budget != null && budgetLabel ? (
          <span>{budgetLabel} budget: <span className="text-text-secondary font-semibold">{c.budgetCurrency ?? '$'}{budget.toFixed(2)}</span></span>
        ) : <span />}
        {c.crmLeadsCount > 0 && (
          <span className="text-brand font-semibold">{c.crmLeadsCount} CRM lead{c.crmLeadsCount !== 1 ? 's' : ''}</span>
        )}
        {c.insightsSyncedAt && (
          <span>Synced {formatDistanceToNow(new Date(c.insightsSyncedAt), { addSuffix: true })}</span>
        )}
      </div>
    </div>
  );
}

function FbAdsTab() {
  const { data: accountRes, isLoading: loadingAccount } = useFbAdAccount();
  const { data: campaignsRes, isLoading: loadingCampaigns } = useFbAdCampaigns();
  const { data: aggregateRes } = useFbAdAggregate();
  const connectMutation = useConnectFbAdAccount();
  const disconnectMutation = useDisconnectFbAdAccount();
  const syncMutation = useSyncFbAdCampaigns();

  const account = (accountRes as any)?.data ?? null;
  const campaigns: FbAdCampaignDto[] = (campaignsRes as any)?.data ?? [];
  const agg = (aggregateRes as any)?.data ?? null;

  const [showConnect, setShowConnect] = useState(false);
  const [form, setForm] = useState<FbAdAccountConnectRequest>({
    adAccountId: '', accessToken: '', businessName: '', currency: 'USD',
  });

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    connectMutation.mutate(form, { onSuccess: () => setShowConnect(false) });
  }

  if (loadingAccount) {
    return <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Account card */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-5">
        {account && account.isActive ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-text-primary">
                {account.businessName ?? 'Facebook Ad Account'}
                <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-soft text-success border border-[rgba(34,197,94,0.2)]">Connected</span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">{account.adAccountId} · {account.currency}</p>
              {account.lastSyncedAt && (
                <p className="text-[11px] text-text-muted mt-1">Last synced {formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true })}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-all disabled:opacity-50">
                {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sync Campaigns
              </button>
              <button onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-elevated border border-border-subtle text-text-muted hover:text-danger transition-all disabled:opacity-50">
                <Unplug className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="font-bold text-text-primary">Connect Facebook Ad Account</p>
              <p className="text-xs text-text-muted mt-1">Sync campaigns from Meta Marketing API to view performance analytics</p>
            </div>
            <button onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-bg bg-brand hover:bg-brand-light transition-all">
              <Link2 className="w-3.5 h-3.5" /> Connect Ad Account
            </button>
          </div>
        )}
      </div>

      {/* Connect form slide-over */}
      {showConnect && (
        <SlideOver title="Connect Facebook Ad Account" onClose={() => setShowConnect(false)}>
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="p-3 bg-bg-elevated rounded-xl border border-border-subtle text-xs text-text-muted space-y-1">
              <p className="font-semibold text-text-secondary">How to get your credentials:</p>
              <p>1. Go to <span className="font-mono text-brand">business.facebook.com</span> → Ad Accounts</p>
              <p>2. Copy your Ad Account ID (format: <span className="font-mono">act_123456789</span>)</p>
              <p>3. Generate a System User Access Token with <span className="font-mono">ads_read</span> permission</p>
            </div>
            <SectionLabel label="Ad Account" />
            <div>
              <label className="text-xs text-text-muted">Ad Account ID *</label>
              <input value={form.adAccountId} onChange={e => setForm(f => ({ ...f, adAccountId: e.target.value }))}
                placeholder="act_123456789 or 123456789" className={`mt-1 ${inputCls}`} required />
            </div>
            <div>
              <label className="text-xs text-text-muted">Access Token *</label>
              <input type="password" value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))}
                placeholder="EAAxxxx..." className={`mt-1 ${inputCls}`} required />
            </div>
            <div>
              <label className="text-xs text-text-muted">Business Name</label>
              <input value={form.businessName ?? ''} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                placeholder="My Business" className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className="text-xs text-text-muted">Currency</label>
              <input value={form.currency ?? 'USD'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                placeholder="USD" className={`mt-1 ${inputCls}`} maxLength={10} />
            </div>
            <button type="submit" disabled={connectMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-bg bg-brand hover:bg-brand-light transition-all disabled:opacity-50">
              {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Connect
            </button>
          </form>
        </SlideOver>
      )}

      {/* Aggregate bar */}
      {agg && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Campaigns', val: agg.totalCampaigns, sub: `${agg.activeCampaigns} active` },
            { label: 'Total Spend', val: `$${agg.totalSpend.toFixed(2)}` },
            { label: 'Impressions', val: agg.totalImpressions.toLocaleString() },
            { label: 'Clicks', val: agg.totalClicks.toLocaleString() },
            { label: 'CTR', val: agg.overallCtr != null ? `${agg.overallCtr.toFixed(2)}%` : '—' },
            { label: 'Leads', val: agg.totalLeads.toLocaleString() },
            { label: 'CRM Leads', val: agg.totalCrmLeads.toLocaleString(), sub: agg.overallRoas != null ? `${agg.overallRoas.toFixed(2)}x ROAS` : undefined },
          ].map(({ label, val, sub }) => (
            <div key={label} className="bg-bg-card border border-border-subtle rounded-2xl px-4 py-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
              <p className="text-lg font-extrabold text-text-primary mt-0.5">{val}</p>
              {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Campaign list */}
      {account && account.isActive && (
        loadingCampaigns ? (
          <div className="flex items-center justify-center h-48 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted rounded-2xl border border-border-subtle bg-bg-card">
            <BarChart2 className="w-8 h-8 opacity-25" strokeWidth={1.2} />
            <p className="text-sm font-semibold">No campaigns synced yet</p>
            <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Sync Now
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {campaigns.map((c: FbAdCampaignDto) => <FbAdCampaignCard key={c.id} c={c} />)}
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function Component() {
  const [tab, setTab] = useState<MainTab>('b2b');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Campaigns</h2>
        <p className="text-xs text-text-muted mt-0.5">Send targeted messages to contacts and leads</p>
      </div>
      <div className="flex rounded-xl border border-border-subtle overflow-hidden w-fit">
        <button onClick={() => setTab('b2b')}
          className={`px-4 py-2 text-xs font-semibold transition-colors ${tab === 'b2b' ? 'bg-brand text-bg' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'}`}>
          B2B Campaigns
        </button>
        <button onClick={() => setTab('leads')}
          className={`px-4 py-2 text-xs font-semibold border-l border-border-subtle transition-colors ${tab === 'leads' ? 'bg-brand text-bg' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'}`}>
          Lead Outreach
        </button>
        <button onClick={() => setTab('fb-ads')}
          className={`px-4 py-2 text-xs font-semibold border-l border-border-subtle transition-colors ${tab === 'fb-ads' ? 'bg-brand text-bg' : 'bg-bg-elevated text-text-secondary hover:text-text-primary'}`}>
          Facebook Ads
        </button>
      </div>
      {tab === 'b2b' ? <B2BCampaignsTab /> : tab === 'leads' ? <LeadOutreachTab /> : <FbAdsTab />}
    </div>
  );
}
