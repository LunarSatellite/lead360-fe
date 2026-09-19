import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildActionTimeline,
  clearSessionRefusals,
  currentStanding,
  recordSessionRefusal,
  sessionRefusalsFor,
} from './action-timeline';
import { actionFixture, approvedFixture } from './__fixtures__/governed-actions';
import { ActionStatus } from '../types/governance.types';

describe('what happened to an action', () => {
  it('starts with the proposal, naming the agent and the target', () => {
    const timeline = buildActionTimeline(actionFixture());
    expect(timeline).toHaveLength(1);
    expect(timeline[0].label).toBe('Proposed');
    expect(timeline[0].detail).toContain('pricing-agent');
    expect(timeline[0].detail).toContain('product/sku-4471');
  });

  it('records the decision, the window and the execution in time order', () => {
    const timeline = buildActionTimeline(
      approvedFixture('2026-09-19T10:06:00+00:00', {
        status: ActionStatus.Executed,
        approvalConsumedUtc: '2026-09-19T10:03:00+00:00',
        executedUtc: '2026-09-19T10:03:02+00:00',
      }),
    );
    expect(timeline.map((entry) => entry.label)).toEqual([
      'Proposed',
      'Approved',
      'Approval consumed',
      'Executed',
      'Approval window closes',
    ]);
  });

  it('distinguishes a rejection from an approval at the same decision point', () => {
    const timeline = buildActionTimeline(
      actionFixture({
        status: ActionStatus.Rejected,
        decidedUtc: '2026-09-19T10:02:00+00:00',
        approvedByAccountId: 'acc-2222',
      }),
    );
    const decision = timeline[1];
    expect(decision.label).toBe('Rejected');
    expect(decision.tone).toBe('bad');
    expect(decision.detail).toContain('acc-2222');
  });

  it('shows a failure with the server’s own reason, not a paraphrase', () => {
    const timeline = buildActionTimeline(
      approvedFixture('2026-09-19T10:06:00+00:00', {
        status: ActionStatus.Failed,
        executedUtc: '2026-09-19T10:04:00+00:00',
        failureReason: 'Upstream pricing service rejected the write.',
      }),
    );
    const failure = timeline.find((entry) => entry.label === 'Execution failed');
    expect(failure?.detail).toBe('Upstream pricing service rejected the write.');
  });

  it('says a grant was cleared rather than pretending it is still live', () => {
    const timeline = buildActionTimeline(
      approvedFixture('2026-09-19T10:06:00+00:00', { approvalGrantId: null }),
    );
    const window = timeline.find((entry) => entry.label === 'Approval window closes');
    expect(window?.detail).toContain('a halt voids approvals');
  });

  it('summarises where the action stands, carrying any failure reason', () => {
    expect(currentStanding(actionFixture())).toBe('Awaiting approval');
    expect(
      currentStanding(actionFixture({ status: ActionStatus.Failed, failureReason: 'Timed out.' })),
    ).toBe('Failed — Timed out.');
  });
});

describe('refusals this console saw', () => {
  beforeEach(() => clearSessionRefusals());

  it('keeps a refused attempt against the action it was made on', () => {
    recordSessionRefusal({
      actionId: 'a1',
      at: '2026-09-19T10:05:00Z',
      errorCode: 'governance.approval_expired',
      message: 'The approval has expired.',
      attempted: 'execute',
    });
    recordSessionRefusal({
      actionId: 'a2',
      at: '2026-09-19T10:06:00Z',
      errorCode: 'governance.approval_scope_changed',
      message: 'Scope changed.',
      attempted: 'execute',
    });

    expect(sessionRefusalsFor('a1')).toHaveLength(1);
    expect(sessionRefusalsFor('a1')[0].errorCode).toBe('governance.approval_expired');
    expect(sessionRefusalsFor('unknown')).toEqual([]);
  });

  it('does not grow without bound', () => {
    for (let index = 0; index < 60; index += 1) {
      recordSessionRefusal({
        actionId: 'a1',
        at: new Date(index).toISOString(),
        errorCode: 'governance.approval_expired',
        message: 'x',
        attempted: 'approve',
      });
    }
    expect(sessionRefusalsFor('a1')).toHaveLength(50);
  });
});
