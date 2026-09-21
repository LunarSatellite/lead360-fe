import { usePipelineAnalytics } from '../../../api/crm.queries';
import { type DealPipelineDto, type PipelineStageDto, CrmDealStatus } from '../../../types/crm.types';
import { useDrillNavigate } from '@/shared/hooks';
import { drillToDeals } from '@/shared/lib';
import { ChartCard, DataTable, formatCount, formatCurrency, type Column } from '..';

const COLUMNS: Column<PipelineStageDto>[] = [
  {
    header: 'Stage',
    accessor: 'stageName',
    render: (row) => (
      <span className="flex items-center gap-2">
        {row.color && <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ background: row.color }} />}
        <span className="font-medium text-text-primary truncate">{row.stageName}</span>
        {row.isWon && <span className="text-2xs font-bold text-success">WON</span>}
        {row.isClosed && !row.isWon && <span className="text-2xs font-bold text-danger">LOST</span>}
      </span>
    ),
  },
  { header: 'Deals', accessor: 'dealCount', align: 'right', sortable: true, format: (v) => formatCount(Number(v)) },
  { header: 'Value', accessor: 'totalValue', align: 'right', sortable: true, format: (v) => formatCurrency(Number(v)) },
];

/** TABLE family — declarative columns, numbers right-aligned. */
export function PipelineWidget() {
  const drill = useDrillNavigate();
  const { data, isLoading, isError, error, refetch } = usePipelineAnalytics();
  const pipeline = data as unknown as DealPipelineDto | undefined;
  const stages = pipeline?.stages ?? [];

  return (
    <ChartCard
      title="Pipeline stages"
      badge="TABLE"
      subtitle={
        pipeline
          ? `${formatCount(stages.length)} stages · ${formatCurrency(pipeline.totalOpenValue)} open · ${formatCurrency(pipeline.totalWonValueThisMonth)} won this month`
          : undefined
      }
      minBodyHeight={120}
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={stages.length === 0}
      onRetry={refetch}
    >
      <DataTable
        columns={COLUMNS}
        rows={stages}
        rowKey={(s) => s.stageId}
        onRowClick={(s) =>
          drill(
            drillToDeals({
              stageId: s.stageId,
              // Terminal stages hold closed deals, not open ones — drill to the matching status.
              status: s.isWon
                ? CrmDealStatus.ClosedWon
                : s.isClosed
                  ? CrmDealStatus.ClosedLost
                  : CrmDealStatus.Open,
            }),
          )
        }
      />
    </ChartCard>
  );
}
