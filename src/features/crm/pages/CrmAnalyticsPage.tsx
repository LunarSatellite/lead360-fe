import { useState } from 'react';
import { Undo2, X } from 'lucide-react';
import {
  useAiActions,
  usePendingAiActions,
  useApproveAiAction,
  useRejectAiAction,
  useUndoAiAction,
} from '../api/crm.queries';
import type { CrmAiActionDto } from '../types/crm.types';
import {
  CrmAiActionStatus,
  CRM_AI_ACTION_STATUS_LABELS,
  CRM_AI_ACTION_STATUS_COLORS,
  CRM_AI_ACTION_TIER_LABELS,
  CRM_AI_ACTION_KIND_LABELS,
} from '../types/crm.types';

const SUBJECT_LABELS: Record<number, string> = { 1: 'Lead', 2: 'Contact', 3: 'Account', 4: 'Deal' };
const kindLabel = (k: number) => CRM_AI_ACTION_KIND_LABELS[k] ?? `Action #${k}`;
const tierLabel = (t: number) => CRM_AI_ACTION_TIER_LABELS[t] ?? `T${t}`;
import {
  DealStatsWidget,
  RevenueWidget,
  LeadFunnelWidget,
  ContactsWidget,
  ActivityWidget,
  VelocityWidget,
  PipelineWidget,
  NurtureWidget,
  SupportWidget,
  AiEffectivenessWidget,
  NpsWidget,
  ChurnRiskWidget,
  LeadScoreWidget,
  TeamPerformanceWidget,
  RecurringRevenueWidget,
} from '../components/analytics/widgets';
import type { AiActionFilter } from '../components/analytics/widgets';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToContactDetail, drillToLeadDetail, drillToDealDetail } from '@/shared/lib';
import type { DrillSpec } from '@/shared/lib';

// An AI action's subject → its detail page. Account (3) has no detail route, so
// those rows are not navigable. Keys off subjectKind/subjectId, which every
// action carries — new action kinds are clickable with no extra wiring.
function actionSubjectDrill(a: CrmAiActionDto): DrillSpec | null {
  switch (a.subjectKind) {
    case 1: return drillToLeadDetail(a.subjectId);
    case 2: return drillToContactDetail(a.subjectId);
    case 4: return drillToDealDetail(a.subjectId);
    default: return null;
  }
}

const statusLabel = (s: number) => CRM_AI_ACTION_STATUS_LABELS[s as CrmAiActionStatus] ?? `Status ${s}`;
const filterChipLabel = (f: AiActionFilter) =>
  [
    f.tier != null ? tierLabel(f.tier) : null,
    f.status != null ? statusLabel(f.status) : null,
    f.kind != null ? kindLabel(f.kind) : null,
  ]
    .filter(Boolean)
    .join(' · ');

function AnalyticsTab({ onViewAiActions }: { onViewAiActions: (filter?: AiActionFilter) => void }) {
  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl bg-brand/10" />
      <div className="pointer-events-none absolute top-40 right-0 w-80 h-80 rounded-full blur-3xl bg-[#00FFAA]/5" />
      <div className="relative space-y-8">
        <DealStatsWidget />
        <RevenueWidget />
        <RecurringRevenueWidget />
        <LeadFunnelWidget />
        <LeadScoreWidget />
        <ChurnRiskWidget />
        <NpsWidget />
        <ContactsWidget />
        <ActivityWidget />
        <VelocityWidget />
        <PipelineWidget />
        <SupportWidget />
        <TeamPerformanceWidget />
        <NurtureWidget />
        <AiEffectivenessWidget onViewActions={onViewAiActions} />
      </div>
    </div>
  );
}

function AiActionsTab({ filter, onClearFilter }: { filter?: AiActionFilter; onClearFilter?: () => void }) {
  const { data: rawPending } = usePendingAiActions();
  const { data: rawAll } = useAiActions();
  const approveAction = useApproveAiAction();
  const rejectAction = useRejectAiAction();
  const undoAction = useUndoAiAction();
  const drill = useDrillNavigate();

  const pendingActions: CrmAiActionDto[] =
    (rawPending as unknown as { items?: CrmAiActionDto[] } | undefined)?.items ??
    (rawPending as unknown as CrmAiActionDto[] | undefined) ??
    [];
  const allActionsRaw: CrmAiActionDto[] =
    (rawAll as unknown as { items?: CrmAiActionDto[] } | undefined)?.items ?? [];
  // Drill from the AI-effectiveness widget (tier / status / kind) filters the list
  // client-side — all three fields are on the wire (CrmAiActionDto).
  const hasFilter =
    filter != null && (filter.tier != null || filter.status != null || filter.kind != null);
  const allActions = allActionsRaw.filter(
    (a) =>
      (filter?.tier == null || a.tier === filter.tier) &&
      (filter?.status == null || a.status === filter.status) &&
      (filter?.kind == null || a.kind === filter.kind),
  );

  return (
    <div className="space-y-6">
      {pendingActions.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Pending Approval</h3>
          <div className="space-y-3">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="rounded-card border-thin border-border-subtle bg-glass-1 p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{kindLabel(action.kind)}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {tierLabel(action.tier)} &middot; {SUBJECT_LABELS[action.subjectKind] ?? 'Subject'} &middot;{' '}
                    {Math.round(action.confidenceScore * 100)}% confidence
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approveAction.mutate(action.id)}
                    disabled={approveAction.isPending}
                    className="text-xs px-3 py-1.5 rounded-sm bg-success-soft text-success border-thin border-border-success font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectAction.mutate(action.id)}
                    disabled={rejectAction.isPending}
                    className="text-xs px-3 py-1.5 rounded-sm bg-danger-soft text-danger border-thin border-border-subtle font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Recent Actions</h3>
          {hasFilter && (
            <button
              onClick={onClearFilter}
              className="inline-flex items-center gap-1.5 text-2xs font-semibold px-2.5 py-1 rounded-xs bg-brand-soft text-brand border-thin border-border-glow hover:bg-glass-2 transition-colors"
            >
              {filterChipLabel(filter!)}
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
        </div>
        {allActions.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            {hasFilter ? 'No actions match this filter.' : 'No AI actions yet.'}
          </p>
        ) : (
          <div className="rounded-card border-thin border-border-subtle bg-glass-1 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-thin border-border-subtle">
                  <th className="text-left px-4 py-3 text-2xs font-bold text-text-muted uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-2xs font-bold text-text-muted uppercase tracking-wider">Tier</th>
                  <th className="text-left px-4 py-3 text-2xs font-bold text-text-muted uppercase tracking-wider">Subject</th>
                  <th className="text-right px-4 py-3 text-2xs font-bold text-text-muted uppercase tracking-wider">Confidence</th>
                  <th className="text-left px-4 py-3 text-2xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-2xs font-bold text-text-muted uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {allActions.map((action) => {
                  const subjectDrill = actionSubjectDrill(action);
                  return (
                  <tr
                    key={action.id}
                    onClick={subjectDrill ? () => drill(subjectDrill) : undefined}
                    title={subjectDrill ? `Open ${SUBJECT_LABELS[action.subjectKind] ?? 'record'}` : undefined}
                    className={`border-b border-thin border-border-subtle last:border-0 ${
                      subjectDrill ? 'cursor-pointer hover:bg-glass-2 transition-colors' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{kindLabel(action.kind)}</td>
                    <td className="px-4 py-3 text-text-secondary">{tierLabel(action.tier)}</td>
                    <td className="px-4 py-3 text-text-secondary">{SUBJECT_LABELS[action.subjectKind] ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-text-secondary tabular-nums">{Math.round(action.confidenceScore * 100)}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-semibold border-thin ${CRM_AI_ACTION_STATUS_COLORS[action.status]}`}>
                        {CRM_AI_ACTION_STATUS_LABELS[action.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(action.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {action.status === CrmAiActionStatus.Executed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            undoAction.mutate(action.id);
                          }}
                          disabled={undoAction.isPending}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                          title="Undo"
                        >
                          <Undo2 className="w-3.5 h-3.5" strokeWidth={1.6} /> Undo
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function Component() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai-actions'>('analytics');
  // Set when a card/donut/row in the AI-effectiveness widget is clicked; filters the AI Actions list.
  const [aiActionFilter, setAiActionFilter] = useState<AiActionFilter | undefined>(undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-text-primary tracking-tight">CRM Analytics</h2>
      </div>

      <div className="flex gap-1 border-b border-thin border-border-subtle">
        {(['analytics', 'ai-actions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (tab === 'analytics') setAiActionFilter(undefined);
              setActiveTab(tab);
            }}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-brand text-brand'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab === 'analytics' ? 'Analytics' : 'AI Actions'}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' ? (
        <AnalyticsTab
          onViewAiActions={(filter) => {
            setAiActionFilter(filter);
            setActiveTab('ai-actions');
          }}
        />
      ) : (
        <AiActionsTab filter={aiActionFilter} onClearFilter={() => setAiActionFilter(undefined)} />
      )}
    </div>
  );
}
