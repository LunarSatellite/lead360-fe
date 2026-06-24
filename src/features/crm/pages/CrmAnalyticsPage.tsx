import { useState } from 'react';
import { Loader2, TrendingUp, DollarSign, Users, Zap, Activity, BarChart3, Undo2 } from 'lucide-react';
import {
  useDealStatsAnalytics,
  useContactStatsAnalytics,
  useRevenueAnalytics,
  useActivityAnalytics,
  useVelocityAnalytics,
  usePipelineAnalytics,
  useNurtureAnalytics,
  useLeadFunnelAnalytics,
  useAiActions,
  usePendingAiActions,
  useApproveAiAction,
  useRejectAiAction,
  useUndoAiAction,
} from '../api/crm.queries';
import type {
  DealStatsDto,
  ContactStatsDto,
  RevenueAnalyticsDto,
  ActivityAnalyticsDto,
  VelocityAnalyticsDto,
  DealPipelineDto,
  CrmAiActionDto,
  NurtureAnalyticsDto,
  LeadFunnelAnalyticsDto,
} from '../types/crm.types';
import {
  CrmAiActionStatus,
  CRM_AI_ACTION_STATUS_LABELS,
  CRM_AI_ACTION_STATUS_COLORS,
} from '../types/crm.types';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-brand-soft border border-border-glow flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
        </div>
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-text-primary">{value}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

function AiActionsTab() {
  const { data: rawPending } = usePendingAiActions();
  const { data: rawAll } = useAiActions();
  const approveAction = useApproveAiAction();
  const rejectAction = useRejectAiAction();
  const undoAction = useUndoAiAction();

  const pendingActions: CrmAiActionDto[] = (rawPending as any)?.items ?? (rawPending as any) ?? [];
  const allActions: CrmAiActionDto[] = (rawAll as any)?.items ?? [];

  return (
    <div className="space-y-6">
      {pendingActions.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Pending Approval</h3>
          <div className="space-y-3">
            {pendingActions.map((action) => (
              <div key={action.id} className="rounded-2xl border border-border-subtle bg-bg-card p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{action.description}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {action.actionType}
                    {action.entityKind && <> &middot; {action.entityKind}</>}
                    {action.entityLabel && <> &middot; {action.entityLabel}</>}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approveAction.mutate(action.id)}
                    disabled={approveAction.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-success-soft text-success border border-[rgba(34,197,94,0.2)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectAction.mutate(action.id)}
                    disabled={rejectAction.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-danger-soft text-danger border border-[rgba(244,63,94,0.2)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
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
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Recent Actions</h3>
        {allActions.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No AI actions yet.</p>
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {allActions.map((action) => (
                  <tr key={action.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{action.description}</td>
                    <td className="px-4 py-3 text-text-secondary">{action.actionType}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {action.entityKind}
                      {action.entityLabel && <span className="text-text-muted ml-1">({action.entityLabel})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${CRM_AI_ACTION_STATUS_COLORS[action.status]}`}>
                        {CRM_AI_ACTION_STATUS_LABELS[action.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {new Date(action.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {action.status === CrmAiActionStatus.Executed && (
                        <button
                          onClick={() => undoAction.mutate(action.id)}
                          disabled={undoAction.isPending}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                          title="Undo"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Undo
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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

  const { data: rawDealStats, isLoading: loadingDeals } = useDealStatsAnalytics();
  const { data: rawContactStats, isLoading: loadingContacts } = useContactStatsAnalytics();
  const { data: rawRevenue, isLoading: loadingRevenue } = useRevenueAnalytics();
  const { data: rawActivity, isLoading: loadingActivity } = useActivityAnalytics();
  const { data: rawVelocity, isLoading: loadingVelocity } = useVelocityAnalytics();
  const { data: rawPipeline, isLoading: loadingPipeline } = usePipelineAnalytics();
  const { data: rawNurture, isLoading: loadingNurture } = useNurtureAnalytics();
  const { data: rawFunnel, isLoading: loadingFunnel } = useLeadFunnelAnalytics();

  const dealStats = rawDealStats as unknown as DealStatsDto | undefined;
  const contactStats = rawContactStats as unknown as ContactStatsDto | undefined;
  const revenue = rawRevenue as unknown as RevenueAnalyticsDto | undefined;
  const activity = rawActivity as unknown as ActivityAnalyticsDto | undefined;
  const velocity = rawVelocity as unknown as VelocityAnalyticsDto | undefined;
  const pipeline = rawPipeline as unknown as DealPipelineDto | undefined;
  const nurture = rawNurture as unknown as NurtureAnalyticsDto | undefined;
  const funnel = rawFunnel as unknown as LeadFunnelAnalyticsDto | undefined;

  const loading = loadingDeals || loadingContacts || loadingRevenue || loadingActivity || loadingVelocity || loadingPipeline || loadingNurture || loadingFunnel;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-text-primary tracking-tight">CRM Analytics</h2>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border-subtle">
        {(['analytics', 'ai-actions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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

      {activeTab === 'ai-actions' && <AiActionsTab />}

      {activeTab === 'analytics' && loading && (
        <div className="flex items-center justify-center h-64 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {activeTab === 'analytics' && !loading && (
      <div className="space-y-8">

      {/* Deal stats */}
      {dealStats && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Deals</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Open" value={dealStats.openCount} icon={Zap} />
            <StatCard label="Won" value={dealStats.closedWonCount} icon={TrendingUp} />
            <StatCard label="Win Rate" value={`${dealStats.winRate.toFixed(1)}%`} icon={BarChart3} />
            <StatCard
              label="Pipeline"
              value={`$${dealStats.totalPipelineValue.toLocaleString()}`}
              sub={`Avg $${dealStats.avgDealSize.toLocaleString()}`}
              icon={DollarSign}
            />
          </div>
        </section>
      )}

      {/* Lead Funnel */}
      {funnel && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Lead Funnel</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <StatCard label="Total Leads" value={funnel.totalLeads} icon={Users} />
            <StatCard label="Overall Conversion" value={`${funnel.overallConversionRate.toFixed(1)}%`} icon={TrendingUp} />
            <StatCard label="Avg Lead Score" value={funnel.avgLeadScore.toFixed(0)} sub="out of 100" icon={BarChart3} />
          </div>

          {funnel.funnel.length > 0 && (
            <div className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-3">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Stage Breakdown</p>
              {(() => {
                const maxCount = Math.max(...funnel.funnel.map(s => s.count), 1);
                const stageColors: Record<string, string> = {
                  New: 'bg-text-muted',
                  Warm: 'bg-warning',
                  Hot: 'bg-orange-400',
                  Nurturing: 'bg-brand',
                  Converted: 'bg-success',
                  Lost: 'bg-danger',
                };
                return funnel.funnel.map((stage) => (
                  <div key={stage.stageName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stageColors[stage.stageName] ?? 'bg-brand'}`} />
                        <span className="font-semibold text-text-primary">{stage.stageName}</span>
                        {stage.conversionFromPrev != null && (
                          <span className="text-[10px] text-text-muted">
                            ↓ {stage.conversionFromPrev.toFixed(0)}% from prev
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted text-xs">{stage.pctOfTotal.toFixed(1)}%</span>
                        <span className="font-bold text-text-primary w-10 text-right">{stage.count}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${stageColors[stage.stageName] ?? 'bg-brand'} opacity-70`}
                        style={{ width: `${(stage.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {funnel.scoreDistribution.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Score Distribution</p>
              {(() => {
                const maxBucket = Math.max(...funnel.scoreDistribution.map(b => b.count), 1);
                return (
                  <div className="flex items-end gap-2 h-16">
                    {funnel.scoreDistribution.map((bucket) => (
                      <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-text-muted">{bucket.count}</span>
                        <div
                          className="w-full bg-brand opacity-70 rounded-t"
                          style={{ height: `${Math.max((bucket.count / maxBucket) * 48, bucket.count > 0 ? 4 : 0)}px` }}
                        />
                        <span className="text-[10px] text-text-muted whitespace-nowrap">{bucket.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {funnel.byChannel.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Leads by Channel</p>
              <div className="space-y-2">
                {funnel.byChannel.map((ch) => (
                  <div key={ch.channel} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{ch.channel}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full opacity-70"
                          style={{ width: `${ch.percentage}%` }}
                        />
                      </div>
                      <span className="text-text-muted text-xs w-10 text-right">{ch.count}</span>
                      <span className="text-brand font-semibold text-xs w-10 text-right">{ch.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Revenue */}
      {revenue && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Revenue Forecast</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Weighted Forecast" value={`$${revenue.weightedForecast.toLocaleString()}`} icon={TrendingUp} />
            <StatCard label="This Month" value={`$${revenue.expectedThisMonth.toLocaleString()}`} icon={DollarSign} />
            <StatCard label="This Quarter" value={`$${revenue.expectedThisQuarter.toLocaleString()}`} icon={DollarSign} />
            <StatCard label="Won All Time" value={`$${revenue.totalWonAllTime.toLocaleString()}`} icon={TrendingUp} />
          </div>

          {revenue.monthlyTrend.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Monthly Won Revenue</p>
              <div className="flex items-end gap-2 h-24">
                {revenue.monthlyTrend.slice(-12).map((point) => {
                  const max = Math.max(...revenue.monthlyTrend.map((p) => Number(p.wonAmount)));
                  const height = max > 0 ? (Number(point.wonAmount) / max) * 100 : 0;
                  return (
                    <div
                      key={`${point.year}-${point.month}`}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${point.monthLabel}: $${Number(point.wonAmount).toLocaleString()}`}
                    >
                      <div
                        className="w-full bg-brand rounded-t-sm opacity-70 hover:opacity-100 transition-opacity"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <span className="text-[9px] text-text-muted">{point.monthLabel.slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Activity */}
      {activity && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Activity (Signals)</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Last 30 days" value={activity.totalSignals30d} icon={Activity} />
            <StatCard label="Last 7 days" value={activity.totalSignals7d} icon={Activity} />
          </div>

          {activity.topContacts.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-card p-5">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Top Engaged Contacts</p>
              <div className="space-y-2">
                {activity.topContacts.slice(0, 5).map((c) => (
                  <div key={c.contactId} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-text-primary">{c.fullName}</span>
                      {c.email && <span className="text-text-muted ml-2 text-xs">{c.email}</span>}
                    </div>
                    <span className="text-brand font-bold">{c.signalCount} signals</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Contact stats */}
      {contactStats && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Contacts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total" value={contactStats.total} icon={Users} />
            <StatCard label="This Month" value={contactStats.createdThisMonth} icon={Users} />
            <StatCard label="Last Month" value={contactStats.createdLastMonth} icon={Users} />
          </div>
        </section>
      )}

      {/* Velocity */}
      {velocity && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Deal Velocity</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Avg Days to Close" value={velocity.avgDaysToClose.toFixed(1)} sub="days" icon={TrendingUp} />
            <StatCard label="Median Days" value={velocity.medianDaysToClose.toFixed(1)} sub="days" icon={TrendingUp} />
            <StatCard label="Avg Open Deal Age" value={velocity.avgOpenDealAge.toFixed(1)} sub="days" icon={TrendingUp} />
          </div>
          {velocity.slowestStage && (
            <p className="text-xs text-text-muted mt-3">
              Slowest stage: <strong className="text-danger">{velocity.slowestStage}</strong>
              {velocity.fastestStage && (
                <> · Fastest: <strong className="text-success">{velocity.fastestStage}</strong></>
              )}
            </p>
          )}
        </section>
      )}

      {/* Pipeline breakdown */}
      {pipeline && pipeline.stages.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Pipeline Stages</h3>
          <div className="rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Stage</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Deals</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.stages.map((s) => (
                  <tr key={s.stageId} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.color && (
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        )}
                        <span className="font-medium text-text-primary">{s.stageName}</span>
                        {s.isWon && <span className="text-[10px] text-success font-bold">WON</span>}
                        {s.isClosed && !s.isWon && <span className="text-[10px] text-danger font-bold">LOST</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">{s.dealCount}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">${Number(s.totalValue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {/* Nurture performance */}
      {nurture && (
        <section>
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Nurture Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Enrolled" value={nurture.totalEnrollments} icon={Users} />
            <StatCard label="Active" value={nurture.activeEnrollments} sub={`${nurture.completedEnrollments} completed`} icon={Activity} />
            <StatCard label="Messages Sent" value={nurture.messagesSent} sub={`${nurture.customerReplies} replies`} icon={Zap} />
            <StatCard label="Response Rate" value={`${nurture.responseRatePercent.toFixed(1)}%`} icon={BarChart3} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <StatCard label="Converted from Nurture" value={nurture.convertedFromNurture} icon={TrendingUp} />
            <StatCard label="Conversion Rate" value={`${nurture.conversionRatePercent.toFixed(1)}%`} icon={TrendingUp} />
            <StatCard label="Exhausted → Lost" value={nurture.exhaustedAsLost} icon={BarChart3} />
          </div>

          {nurture.bySequence.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider px-4 pt-4 pb-3">Per Sequence</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Sequence</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Enrolled</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Sent</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Replies</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Response %</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Converted</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {nurture.bySequence.map((s) => (
                    <tr key={s.sequenceId} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3 font-medium text-text-primary">{s.sequenceName}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{s.enrollments}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{s.messagesSent}</td>
                      <td className="px-4 py-3 text-right text-text-secondary">{s.replies}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={s.responseRatePercent >= 20 ? 'text-success font-semibold' : 'text-text-secondary'}>
                          {s.responseRatePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">{s.conversions}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={s.conversionRatePercent >= 10 ? 'text-success font-semibold' : 'text-text-secondary'}>
                          {s.conversionRatePercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      </div>
      )}
    </div>
  );
}
