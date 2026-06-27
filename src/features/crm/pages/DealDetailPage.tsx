import { useState, useEffect } from 'react';
import type { CrmDealAiSummaryDto } from '../types/crm.types';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Briefcase, DollarSign, Calendar, Tag, FileText, ClipboardList, Package, Phone, Video, MessageSquare, Save, Users, Target, Sword, TrendingUp, GitBranch, Sparkles, RefreshCw, Building2, Pencil, X } from 'lucide-react';
import { ROUTES } from '@/app/router/route-paths';
import { useDealById, useTimeline, useLogActivity, useDealStrategy, useUpdateDealStrategy, useMoveDealStage, useDealStages, useRefreshDealSummary, useUpdateDeal, useAccounts } from '../api/crm.queries';
import type { CrmDealDetailDto, CrmDealUpdateRequest } from '../types/crm.types';
import { CRM_DEAL_STATUS_LABELS, CRM_DEAL_STATUS_COLORS, CrmActivityEventKind, CrmActivityEntityKind } from '../types/crm.types';
import { formatDistanceToNow, format } from 'date-fns';
import { DealGateChecklist } from '../components/DealGateChecklist';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { ApprovalEntityType, CrmEntityType } from '../types/crm.types';
import { CustomFieldsPanel } from '../components/CustomFieldsPanel';

export function Component() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: raw, isLoading } = useDealById(id);
  const deal = raw as unknown as CrmDealDetailDto | undefined;

  // Timeline
  const { data: timelineRaw } = useTimeline(2, id ?? '');
  const timeline: any[] = (timelineRaw as any)?.items ?? [];
  const logActivity = useLogActivity();
  const [logOpen, setLogOpen] = useState<'call' | 'meeting' | 'note' | null>(null);
  const [logText, setLogText] = useState('');

  // Stage change
  const moveStage = useMoveDealStage();
  const { data: stagesRaw } = useDealStages(deal?.pipelineId ? { pipelineId: deal.pipelineId } : undefined);
  const stages = (stagesRaw as any[]) ?? [];

  // AI Summary
  const refreshSummary = useRefreshDealSummary();
  const [aiSummary, setAiSummary] = useState<CrmDealAiSummaryDto | null>(null);
  useEffect(() => {
    if (deal?.aiSummaryJson) {
      try { setAiSummary(JSON.parse(deal.aiSummaryJson)); } catch { /* ignore malformed */ }
    }
  }, [deal?.aiSummaryJson]);

  // Strategy
  const { data: strategyRaw } = useDealStrategy(id);
  const strategy: any = strategyRaw ?? {};
  const updateStrategy = useUpdateDealStrategy();
  const [stratEdit, setStratEdit] = useState(false);
  const [stratForm, setStratForm] = useState<any>({});

  // Edit deal
  const updateDeal = useUpdateDeal();
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<CrmDealUpdateRequest>({});
  const { data: accountsRaw } = useAccounts({ pageSize: 200 });
  const accountsList = (accountsRaw as any)?.items ?? [];

  function openEdit() {
    setEditForm({
      name: deal?.name ?? '',
      amount: deal?.amount ?? undefined,
      currency: deal?.currency ?? 'USD',
      closeDate: deal?.closeDate ? format(new Date(deal.closeDate), 'yyyy-MM-dd') : '',
      source: deal?.source ?? '',
      notes: deal?.notes ?? '',
      accountId: deal?.accountId ?? undefined,
    });
    setShowEdit(true);
  }

  function saveEdit() {
    if (!id) return;
    const payload: CrmDealUpdateRequest = {
      ...editForm,
      amount: editForm.amount ? Number(editForm.amount) : undefined,
      closeDate: editForm.closeDate ? new Date(editForm.closeDate).toISOString() : undefined,
      source: editForm.source || undefined,
      notes: editForm.notes || undefined,
    };
    updateDeal.mutate({ id, data: payload }, { onSuccess: () => setShowEdit(false) });
  }

  function handleLog(kind: 'call' | 'meeting' | 'note') {
    if (!logText.trim() || !id) return;
    const eventKind = kind === 'call' ? 17 : kind === 'meeting' ? 18 : 19;
    logActivity.mutate({ entityKind: 2, entityId: id, eventKind, summary: logText.trim() }, {
      onSuccess: () => { setLogOpen(null); setLogText(''); }
    });
  }

  function openStratEdit() {
    setStratForm({ champion: strategy?.champion ?? '', competition: strategy?.competition ?? '', winPlan: strategy?.winPlan ?? '', nextSteps: strategy?.nextSteps ?? '' });
    setStratEdit(true);
  }
  function saveStrategy() {
    if (!id) return;
    updateStrategy.mutate({ id, data: stratForm }, { onSuccess: () => setStratEdit(false) });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
        <Briefcase className="w-8 h-8 opacity-30" strokeWidth={1.2} />
        <p className="text-sm">Deal not found.</p>
        <button onClick={() => navigate(-1)} className="text-xs text-brand hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* ── LEFT COLUMN ── */}
      <div className="space-y-6">

      <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-text-primary">{deal.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${CRM_DEAL_STATUS_COLORS[deal.status]}`}>
              {CRM_DEAL_STATUS_LABELS[deal.status]}
            </span>
            <button onClick={openEdit} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors" title="Edit deal">
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
            <span className="text-text-secondary">{deal.accountName ?? '—'}</span>
          </div>
          {deal.amount != null && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-text-secondary font-semibold">
                {deal.currency} {deal.amount.toLocaleString()}
              </span>
            </div>
          )}
          {deal.pipelineName && (
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-text-secondary">{deal.pipelineName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
            {stages.length > 0 ? (
              <select
                value={deal.stageId ?? ''}
                onChange={(e) => {
                  if (id && e.target.value) moveStage.mutate({ id, data: { stageId: e.target.value } });
                }}
                disabled={moveStage.isPending}
                className="bg-bg-elevated text-text-secondary text-sm border border-border-subtle rounded-lg px-2 py-1 outline-none cursor-pointer hover:text-text-primary focus:border-border-glow disabled:opacity-50"
              >
                {stages.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-text-secondary">{deal.stageName}</span>
            )}
            {moveStage.isPending && <Loader2 className="w-3 h-3 animate-spin text-text-muted" />}
          </div>
          {deal.ownedByUserName && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-text-secondary">{deal.ownedByUserName}</span>
            </div>
          )}
          {deal.closeDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-text-secondary">
                Close: {format(new Date(deal.closeDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {deal.source && (
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-text-muted shrink-0" strokeWidth={1.5} />
              <span className="text-text-secondary">Source: {deal.source}</span>
            </div>
          )}
        </div>

        {/* AI Summary Card */}
        <div className="mt-5 pt-4 border-t border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-wider">AI Summary</span>
              {aiSummary && (
                <span className="text-2xs text-text-muted">{new Date(aiSummary.generatedAt).toLocaleTimeString()}</span>
              )}
            </div>
            <button
              onClick={() => id && refreshSummary.mutate(id, {
                onSuccess: (data) => setAiSummary(data as unknown as CrmDealAiSummaryDto),
              })}
              disabled={refreshSummary.isPending}
              className="flex items-center gap-1 text-2xs text-text-muted hover:text-brand transition-colors disabled:opacity-50"
              title="Regenerate AI summary"
            >
              {refreshSummary.isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <RefreshCw className="w-3 h-3" />}
              {aiSummary ? 'Refresh' : 'Generate'}
            </button>
          </div>
          {aiSummary ? (
            <div className="space-y-3">
              <p className="text-sm text-text-primary">{aiSummary.headline}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-2xs px-2 py-0.5 rounded-full font-medium border ${
                  aiSummary.riskLevel === 'High' ? 'bg-danger-soft text-danger border-[rgba(244,63,94,0.2)]'
                  : aiSummary.riskLevel === 'Medium' ? 'bg-warning-soft text-warning border-[rgba(245,158,11,0.2)]'
                  : 'bg-success-soft text-success border-[rgba(16,185,129,0.2)]'
                }`}>
                  {aiSummary.riskLevel} Risk
                </span>
                <span className="text-2xs text-text-muted">
                  Win probability: {Math.round(aiSummary.winProbabilityEstimate * 100)}%
                </span>
              </div>
              {aiSummary.keyInsights?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiSummary.keyInsights.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated border border-border-subtle text-text-secondary">{p}</span>
                  ))}
                </div>
              )}
              {aiSummary.nextActions?.length > 0 && (
                <div className="p-3 rounded-xl bg-brand-soft border border-border-glow">
                  <p className="text-xs font-semibold text-brand mb-1.5">Next Actions</p>
                  <ul className="space-y-1">
                    {aiSummary.nextActions.map((a, i) => (
                      <li key={i} className="text-xs text-text-primary flex items-start gap-1.5">
                        <span className="text-brand mt-0.5">›</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No summary yet. Click Generate to have AI analyse this deal.</p>
          )}
        </div>

        {deal.notes && (
          <div className="mt-5 pt-4 border-t border-border-subtle">
            <p className="text-xs text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-secondary whitespace-pre-line">{deal.notes}</p>
          </div>
        )}

        {deal.lostReason && (
          <div className="mt-4 p-3 rounded-xl bg-danger-soft border border-[rgba(244,63,94,0.2)]">
            <p className="text-xs text-danger font-semibold">Lost reason</p>
            <p className="text-sm text-text-secondary mt-0.5">{deal.lostReason}</p>
          </div>
        )}

        <p className="mt-4 text-xs text-text-muted">
          Created {formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true })}
        </p>

      </div>

      {/* ── Gate Checklist ── */}
      {id && <DealGateChecklist dealId={id} />}

      {/* ── Approval ── */}
      {id && deal && (
        <ApprovalPanel
          entityType={ApprovalEntityType.Deal}
          entityId={id}
          entityName={deal.name}
        />
      )}

      {id && <CustomFieldsPanel recordId={id} entityType={CrmEntityType.Deal} />}

      <div className="rounded-2xl border border-border-subtle bg-bg-card p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`${ROUTES.dashboard.crmQuotes}?dealId=${id}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light transition-all">
            <FileText className="w-4 h-4" strokeWidth={1.5} /> Create Quote
          </button>
          <button onClick={() => navigate(`${ROUTES.dashboard.crmProposals}?dealId=${id}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary text-sm font-bold hover:bg-bg-card transition-all">
            <ClipboardList className="w-4 h-4" strokeWidth={1.5} /> Generate Proposal
          </button>
          {deal.status === 2 && (
            <button onClick={() => navigate(`${ROUTES.dashboard.crmOrders}?dealId=${id}&accountId=${deal.accountId ?? ''}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-bg text-sm font-bold hover:opacity-90 transition-all">
              <Package className="w-4 h-4" strokeWidth={1.5} /> Create Order
            </button>
          )}
        </div>
      </div>

      </div>{/* end left column */}

      {/* ── RIGHT COLUMN ── */}
      <div className="space-y-6">

      {/* ── Strategy ── */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Deal Strategy</span>
          <button onClick={stratEdit ? saveStrategy : openStratEdit} disabled={updateStrategy.isPending}
            className="text-xs text-brand hover:underline font-medium">{stratEdit ? (updateStrategy.isPending ? 'Saving...' : 'Save') : 'Edit'}</button>
        </div>
        {stratEdit ? (
          <div className="space-y-3">
            <div><label className="text-xs text-text-muted block mb-1">Champion</label>
              <input value={stratForm.champion ?? ''} onChange={e => setStratForm({ ...stratForm, champion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary" placeholder="Who is our champion?" /></div>
            <div><label className="text-xs text-text-muted block mb-1">Competition</label>
              <input value={stratForm.competition ?? ''} onChange={e => setStratForm({ ...stratForm, competition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary" placeholder="Who are we competing against?" /></div>
            <div><label className="text-xs text-text-muted block mb-1">Win Plan</label>
              <textarea value={stratForm.winPlan ?? ''} onChange={e => setStratForm({ ...stratForm, winPlan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary min-h-[60px]" placeholder="How will we win?" /></div>
            <div><label className="text-xs text-text-muted block mb-1">Next Steps</label>
              <textarea value={stratForm.nextSteps ?? ''} onChange={e => setStratForm({ ...stratForm, nextSteps: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary min-h-[60px]" placeholder="What are the next actions?" /></div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {strategy?.champion && <p className="flex items-start gap-2"><Users className="w-4 h-4 text-text-muted shrink-0 mt-0.5" /><span><strong>Champion:</strong> {strategy.champion}</span></p>}
            {strategy?.competition && <p className="flex items-start gap-2"><Sword className="w-4 h-4 text-text-muted shrink-0 mt-0.5" /><span><strong>Competition:</strong> {strategy.competition}</span></p>}
            {strategy?.winPlan && <p className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-text-muted shrink-0 mt-0.5" /><span><strong>Win Plan:</strong> {strategy.winPlan}</span></p>}
            {strategy?.nextSteps && <p className="flex items-start gap-2"><ArrowLeft className="w-4 h-4 text-text-muted shrink-0 mt-0.5 rotate-180" /><span><strong>Next Steps:</strong> {strategy.nextSteps}</span></p>}
            {!strategy?.champion && !strategy?.competition && !strategy?.winPlan && !strategy?.nextSteps && <p className="text-text-muted italic text-xs">No strategy set. Click Edit to add one.</p>}
          </div>
        )}
      </div>

      {/* ── Activity Timeline ── */}
      <div className="rounded-2xl border border-border-subtle bg-bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Activity Timeline</span>
          <div className="flex gap-1.5">
            <button onClick={() => setLogOpen('call')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-primary hover:bg-brand-soft hover:text-brand transition-all"><Phone className="w-3 h-3" /> Call</button>
            <button onClick={() => setLogOpen('meeting')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-primary hover:bg-brand-soft hover:text-brand transition-all"><Video className="w-3 h-3" /> Meeting</button>
            <button onClick={() => setLogOpen('note')} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-primary hover:bg-brand-soft hover:text-brand transition-all"><MessageSquare className="w-3 h-3" /> Note</button>
          </div>
        </div>

        {logOpen && (
          <div className="p-3 rounded-xl bg-bg-subtle border border-border-subtle space-y-2">
            <textarea autoFocus value={logText} onChange={e => setLogText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary min-h-[60px]"
              placeholder={logOpen === 'call' ? 'Describe the call...' : logOpen === 'meeting' ? 'Describe the meeting...' : 'Write a note...'} />
            <div className="flex gap-2">
              <button onClick={() => handleLog(logOpen)} disabled={logActivity.isPending || !logText.trim()}
                className="px-3 py-1.5 rounded-lg bg-brand text-bg text-xs font-bold hover:opacity-90 disabled:opacity-50">{logActivity.isPending ? 'Saving...' : 'Save'}</button>
              <button onClick={() => { setLogOpen(null); setLogText(''); }} className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-muted">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2 min-h-[120px] max-h-[500px] overflow-y-auto">
          {timeline.length === 0 && <p className="text-xs text-text-muted italic">No activity yet.</p>}
          {timeline.map((e: any) => (
            <div key={e.id} className="p-3 rounded-xl bg-bg-subtle border border-border-subtle">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-text-muted">
                  {e.eventKind === 17 ? '📞 Call'
                    : e.eventKind === 18 ? '📅 Meeting'
                    : e.eventKind === 19 ? '📝 Note'
                    : e.eventKind === 3  ? '🤝 Deal Created'
                    : e.eventKind === 2  ? '🔀 Stage Changed'
                    : e.eventKind === 4  ? '👤 Assigned'
                    : e.eventKind === 8  ? '📄 Quote Drafted'
                    : e.eventKind === 9  ? '📤 Quote Sent'
                    : e.eventKind === 10 ? '✅ Quote Accepted'
                    : e.eventKind === 12 ? '📋 Proposal Drafted'
                    : e.eventKind === 13 ? '📤 Proposal Sent'
                    : e.eventKind === 14 ? '✅ Proposal Accepted'
                    : '📌 Activity'}
                </span>
                <span className="text-2xs text-text-muted">{formatDistanceToNow(new Date(e.occurredAt), { addSuffix: true })}</span>
              </div>
              <p className="text-xs text-text-primary whitespace-pre-wrap">{e.summary}</p>
            </div>
          ))}
        </div>
      </div>

      </div>{/* end right column */}
      </div>{/* end grid */}

      {/* ── Edit Deal Slide-over ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
          <div className="drawer-slide-in relative w-[480px] h-full flex flex-col bg-bg-shell border-l border-thin border-border-subtle" style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
              <h3 className="font-bold text-text-primary">Edit Deal</h3>
              <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Deal Name</label>
                <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Account</label>
                <select value={editForm.accountId ?? ''} onChange={e => setEditForm(f => ({ ...f, accountId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow">
                  <option value="">— No account —</option>
                  {accountsList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Amount</label>
                  <input type="number" min={0} value={editForm.amount ?? ''} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Currency</label>
                  <select value={editForm.currency ?? 'USD'} onChange={e => setEditForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow">
                    {['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Close Date</label>
                <input type="date" value={editForm.closeDate ?? ''} onChange={e => setEditForm(f => ({ ...f, closeDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Source</label>
                <input value={editForm.source ?? ''} onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="e.g. Referral, Inbound, Campaign"
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Notes</label>
                <textarea rows={3} value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-bg border border-border-subtle text-sm text-text-primary focus:outline-none focus:border-border-glow resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border-subtle shrink-0 flex gap-3">
              <button onClick={saveEdit} disabled={updateDeal.isPending}
                className="flex-1 py-2 rounded-xl bg-brand text-bg text-sm font-bold hover:bg-brand-light disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {updateDeal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setShowEdit(false)}
                className="px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
