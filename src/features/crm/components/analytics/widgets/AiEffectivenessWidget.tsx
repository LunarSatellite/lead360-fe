import { Bot, ThumbsUp, Undo2, AlertTriangle, Coins } from 'lucide-react';
import { useAiEffectivenessAnalytics } from '../../../api/crm.queries';
import type { AiEffectivenessAnalyticsDto } from '../../../types/crm-analytics.types';
import { CrmAiActionStatus } from '../../../types/crm.types';
import {
  KpiCard,
  ChartCard,
  DonutChart,
  LineChart,
  DataTable,
  type Column,
  type DonutDatum,
  type LinePoint,
  formatCount,
  formatPercent,
} from '..';

const TIER_META: Record<number, { label: string; color: string }> = {
  1: { label: 'T1 Autonomous', color: '#00D97E' },
  2: { label: 'T2 Notify', color: '#3B82F6' },
  3: { label: 'T3 Approve', color: '#F59E0B' },
  4: { label: 'T4 Escalate', color: '#F43F5E' },
};

const KIND_LABELS: Record<number, string> = {
  4: 'Deal stage advanced',
  5: 'Lead qualified',
  7: 'Nurture message sent',
  8: 'Churn intervention',
  9: 'Quote drafted',
  11: 'Proposal generated',
  21: 'Support draft',
  22: 'Support AI-resolved',
};
const kindLabel = (k: number) => KIND_LABELS[k] ?? `Kind ${k}`;

type KindRow = { kind: number; label: string; total: number; rejected: number; undone: number; undoRate: number };

/** Drill target for the AI Actions tab — any combination of tier / status / kind. */
export type AiActionFilter = { tier?: number; status?: number; kind?: number };

/** AI effectiveness — oversight (approval/undo), autonomy mix, volume trend, cost. */
export function AiEffectivenessWidget({ onViewActions }: { onViewActions?: (filter?: AiActionFilter) => void } = {}) {
  const { data: raw, isLoading } = useAiEffectivenessAnalytics();
  const data = raw as unknown as AiEffectivenessAnalyticsDto | undefined;

  // Build a click handler that drills into the AI Actions tab with the given filter.
  const go = (filter?: AiActionFilter) => (onViewActions ? () => onViewActions(filter) : undefined);

  const tierData: DonutDatum[] = (data?.byTier ?? []).map((t) => ({
    label: TIER_META[t.tier]?.label ?? `Tier ${t.tier}`,
    value: t.count,
    color: TIER_META[t.tier]?.color ?? '#7B61FF',
  }));

  const volume: LinePoint[] = (data?.weeklyTrend ?? []).map((w) => ({ label: w.weekLabel, value: w.count }));

  const kindRows: KindRow[] = [...(data?.byKind ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((k) => ({ kind: k.kind, label: kindLabel(k.kind), total: k.total, rejected: k.rejected, undone: k.undone, undoRate: k.undoRate }));

  const kindCols: Column<KindRow>[] = [
    { header: 'Action kind', accessor: 'label' },
    { header: 'Total', accessor: 'total', align: 'right' },
    { header: 'Rejected', accessor: 'rejected', align: 'right' },
    { header: 'Undone', accessor: 'undone', align: 'right' },
    { header: 'Undo rate', accessor: 'undoRate', align: 'right', format: (v) => formatPercent(Number(v)) },
  ];

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">AI effectiveness</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Actions" value={data ? formatCount(data.totalActions) : '—'} hint={data ? `${data.actionsLast7d} in last 7d` : undefined} icon={Bot} isLoading={isLoading} onClick={go()} />
        <KpiCard label="Approval rate" value={data ? formatPercent(data.approvalRate) : '—'} hint="rejected by a human" icon={ThumbsUp} accent="success" isLoading={isLoading} onClick={go({ status: CrmAiActionStatus.Rejected })} />
        <KpiCard label="Undo rate" value={data ? formatPercent(data.undoRate) : '—'} hint="reversed by a human" icon={Undo2} accent="warning" isLoading={isLoading} onClick={go({ status: CrmAiActionStatus.Undone })} />
        <KpiCard label="Escalated" value={data ? formatCount(data.escalatedCount) : '—'} hint={data ? `${data.pendingApprovalCount} pending — review` : undefined} icon={AlertTriangle} accent="danger" isLoading={isLoading} onClick={go({ status: CrmAiActionStatus.Escalated })} />
        <KpiCard label="Tokens" value={data ? formatCount(data.totalTokensAllTime) : '—'} hint="all operations" icon={Coins} accent="info" isLoading={isLoading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Autonomy mix" subtitle="actions by tier · click a tier to review them" badge="AI ESTIMATE" isLoading={isLoading} isEmpty={!data || data.totalActions === 0}>
          <DonutChart
            data={tierData}
            centerValue={data ? formatCount(data.totalActions) : '0'}
            centerLabel="actions"
            formatValue={formatCount}
            onCenterSelect={onViewActions ? () => onViewActions() : undefined}
            onSelect={onViewActions ? (_d, i) => onViewActions({ tier: data?.byTier[i]?.tier }) : undefined}
          />
        </ChartCard>
        <ChartCard title="Action volume" subtitle="last 8 weeks" isLoading={isLoading} isEmpty={!volume.length}>
          <LineChart data={volume} area showXAxis showYAxis showDots formatValue={formatCount} />
        </ChartCard>
      </div>
      <ChartCard title="By action type" subtitle="watch rejection & undo rates · click a row to review them" isLoading={isLoading} isEmpty={!kindRows.length}>
        <DataTable
          columns={kindCols}
          rows={kindRows}
          rowKey={(r) => String(r.kind)}
          onRowClick={onViewActions ? (r) => onViewActions({ kind: r.kind }) : undefined}
        />
      </ChartCard>
    </section>
  );
}
