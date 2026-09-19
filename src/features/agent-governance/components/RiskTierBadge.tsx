import { StatusBadge } from '@/shared/components';
import {
  ACTION_STATUS_LABEL,
  APPROVAL_WINDOW_MINUTES,
  RISK_TIER_LABEL,
  RiskTier,
  type ActionStatusValue,
  type RiskTierValue,
} from '../types/governance.types';

/**
 * The risk tier, read-only and always read-only.
 *
 * The tier is derived server-side from the action key; the propose endpoint
 * refuses any caller-supplied tier outright. There is deliberately no control
 * anywhere in this feature that lets a human pick, filter-by-setting or
 * override a tier — offering one would misrepresent where the decision is made.
 */
const TIER_VARIANT: Record<RiskTierValue, 'muted' | 'info' | 'warning' | 'danger'> = {
  [RiskTier.Low]: 'muted',
  [RiskTier.Medium]: 'info',
  [RiskTier.High]: 'warning',
  [RiskTier.Critical]: 'danger',
};

export function RiskTierBadge({ tier }: { tier: RiskTierValue }) {
  return (
    <span
      title={`Risk tier derived server-side. Approving opens a ${APPROVAL_WINDOW_MINUTES[tier]} minute window.`}
      data-testid="risk-tier"
      data-tier={tier}
    >
      <StatusBadge variant={TIER_VARIANT[tier] ?? 'muted'}>
        {RISK_TIER_LABEL[tier] ?? `Tier ${tier}`} risk
      </StatusBadge>
    </span>
  );
}

const STATUS_VARIANT: Record<number, 'muted' | 'info' | 'warning' | 'danger' | 'success' | 'brand'> =
  {
    1: 'warning',
    2: 'brand',
    3: 'muted',
    4: 'info',
    5: 'success',
    6: 'danger',
    7: 'info',
    8: 'muted',
    9: 'danger',
  };

export function ActionStatusBadge({ status }: { status: ActionStatusValue }) {
  return (
    <span data-testid="action-status">
      <StatusBadge variant={STATUS_VARIANT[status] ?? 'muted'}>
        {ACTION_STATUS_LABEL[status] ?? `Status ${status}`}
      </StatusBadge>
    </span>
  );
}
