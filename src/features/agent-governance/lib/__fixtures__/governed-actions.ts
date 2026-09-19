import {
  ActionStatus,
  HaltScope,
  RiskTier,
  type AgentHaltView,
  type GovernedAgentActionView,
} from '../../types/governance.types';

/** Shapes copied from `GovernedAgentActionView` — camelCase, integer enums, ISO offsets. */
export function actionFixture(
  overrides: Partial<GovernedAgentActionView> = {},
): GovernedAgentActionView {
  return {
    id: '3f1b2c4d-0000-4000-8000-000000000001',
    actionKey: 'catalog.reprice',
    requestingAgent: 'pricing-agent',
    targetKind: 'product',
    targetId: 'sku-4471',
    riskTier: RiskTier.Critical,
    status: ActionStatus.AwaitingApproval,
    previewJson: '{"from":"12000 CDF","to":"9600 CDF"}',
    requestPayloadJson: '{"productId":"sku-4471","price":9600}',
    executionReceiptJson: null,
    rollbackReceiptJson: null,
    failureReason: null,
    requestedByAccountId: 'acc-1111',
    approvedByAccountId: null,
    requestedUtc: '2026-09-19T10:00:00+00:00',
    decidedUtc: null,
    executedUtc: null,
    rolledBackUtc: null,
    approvalGrantId: null,
    approvalExpiresUtc: null,
    approvalConsumedUtc: null,
    ...overrides,
  };
}

/** An approved Critical action whose five-minute window is still open. */
export function approvedFixture(
  expiresUtc: string,
  overrides: Partial<GovernedAgentActionView> = {},
): GovernedAgentActionView {
  return actionFixture({
    status: ActionStatus.Approved,
    decidedUtc: '2026-09-19T10:01:00+00:00',
    approvedByAccountId: 'acc-2222',
    approvalGrantId: 'grant-0001',
    approvalExpiresUtc: expiresUtc,
    ...overrides,
  });
}

export function haltFixture(overrides: Partial<AgentHaltView> = {}): AgentHaltView {
  return {
    id: 'halt-0001',
    scope: HaltScope.Agent,
    scopeKey: 'pricing-agent',
    isEngaged: true,
    reason: 'Repricing loop suspected.',
    engagedByAccountId: 'acc-9999',
    engagedUtc: '2026-09-19T09:55:00+00:00',
    clearedByAccountId: null,
    clearedUtc: null,
    clearedReason: null,
    voidedApprovalCount: 3,
    ...overrides,
  };
}
