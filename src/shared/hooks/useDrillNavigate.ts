import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildDrillUrl, type DrillSpec } from '@/shared/lib';

/**
 * Returns a `drill(spec)` navigator. Hand it a DrillSpec from one of the
 * `drillTo*` builders; it routes to the destination list page with the filter
 * applied. No-ops on null/undefined so non-drillable data passes through.
 *
 *   const drill = useDrillNavigate();
 *   <KpiCard onClick={() => drill(drillToLeads({ stage: LeadStage.Hot }))} … />
 */
export function useDrillNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (spec: DrillSpec | null | undefined) => {
      if (!spec) return;
      navigate(buildDrillUrl(spec));
    },
    [navigate],
  );
}
