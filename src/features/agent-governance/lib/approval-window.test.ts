import { describe, expect, it } from 'vitest';
import {
  actionAvailability,
  approvalClock,
  clockUrgency,
  describeClock,
  formatTimeRemaining,
  haltCovering,
} from './approval-window';
import { actionFixture, approvedFixture, haltFixture } from './__fixtures__/governed-actions';
import { ActionStatus, HaltScope, RiskTier } from '../types/governance.types';

const at = (iso: string) => new Date(iso);

describe('approvalClock', () => {
  it('reports no countdown for an action still awaiting approval, only the window it would open', () => {
    const clock = approvalClock(actionFixture(), at('2026-09-19T10:02:00Z'));
    expect(clock).toEqual({ kind: 'not-started', windowMinutes: 5 });
  });

  it('uses the tier window the backend stamps: Low 60, Medium 30, High 15, Critical 5', () => {
    const windows = [RiskTier.Low, RiskTier.Medium, RiskTier.High, RiskTier.Critical].map(
      (riskTier) => {
        const clock = approvalClock(actionFixture({ riskTier }), at('2026-09-19T10:02:00Z'));
        return clock.kind === 'not-started' ? clock.windowMinutes : null;
      },
    );
    expect(windows).toEqual([60, 30, 15, 5]);
  });

  it('counts down to the server timestamp, never to a locally guessed one', () => {
    const action = approvedFixture('2026-09-19T10:06:00+00:00');
    const clock = approvalClock(action, at('2026-09-19T10:04:30Z'));
    expect(clock.kind).toBe('live');
    if (clock.kind !== 'live') return;
    expect(clock.msRemaining).toBe(90_000);
    expect(clock.windowMinutes).toBe(5);
  });

  it('flips to expired the moment the window closes', () => {
    const action = approvedFixture('2026-09-19T10:06:00+00:00');
    expect(approvalClock(action, at('2026-09-19T10:05:59Z')).kind).toBe('live');
    expect(approvalClock(action, at('2026-09-19T10:06:00Z')).kind).toBe('expired');
    expect(approvalClock(action, at('2026-09-19T10:06:01Z')).kind).toBe('expired');
  });

  it('reports a consumed grant ahead of anything else — an approval is single use', () => {
    const action = approvedFixture('2026-09-19T10:06:00+00:00', {
      approvalConsumedUtc: '2026-09-19T10:03:00+00:00',
      status: ActionStatus.Executed,
    });
    expect(approvalClock(action, at('2026-09-19T10:04:00Z'))).toEqual({
      kind: 'consumed',
      consumedAtUtc: '2026-09-19T10:03:00+00:00',
    });
  });
});

describe('urgency and formatting', () => {
  it('reads urgency as a fraction of the window, so one minute of five is not one minute of sixty', () => {
    const critical = approvedFixture('2026-09-19T10:06:00+00:00');
    const low = approvedFixture('2026-09-19T11:01:00+00:00', { riskTier: RiskTier.Low });

    // 2 minutes left of a 5-minute window: under half, closing.
    expect(clockUrgency(approvalClock(critical, at('2026-09-19T10:04:00Z')))).toBe('closing');
    // 30 minutes left of a 60-minute window: exactly half, also closing.
    expect(clockUrgency(approvalClock(low, at('2026-09-19T10:31:00Z')))).toBe('closing');
    // 50 minutes left of 60: calm.
    expect(clockUrgency(approvalClock(low, at('2026-09-19T10:11:00Z')))).toBe('calm');
    // Final minute is loud in both.
    expect(clockUrgency(approvalClock(critical, at('2026-09-19T10:05:30Z')))).toBe('last-minute');
    expect(clockUrgency(approvalClock(critical, at('2026-09-19T10:07:00Z')))).toBe('gone');
  });

  it('formats without the digits jumping around', () => {
    expect(formatTimeRemaining(299_000)).toBe('4:59');
    expect(formatTimeRemaining(9_000)).toBe('0:09');
    expect(formatTimeRemaining(3_601_000)).toBe('1:00:01');
    expect(formatTimeRemaining(-5_000)).toBe('0:00');
  });

  it('describes each clock state differently', () => {
    const critical = approvedFixture('2026-09-19T10:06:00+00:00');
    expect(describeClock(approvalClock(actionFixture(), at('2026-09-19T10:00:00Z')))).toBe(
      'Approving opens a 5 min window',
    );
    expect(describeClock(approvalClock(critical, at('2026-09-19T10:05:00Z')))).toBe(
      '1:00 left to run it',
    );
    expect(describeClock(approvalClock(critical, at('2026-09-19T10:09:00Z')))).toBe(
      'Window closed — approval expired',
    );
  });
});

describe('actionAvailability', () => {
  it('offers approve and reject while awaiting, but never execute', () => {
    const availability = actionAvailability(actionFixture(), at('2026-09-19T10:01:00Z'));
    expect(availability.approve.enabled).toBe(true);
    expect(availability.reject.enabled).toBe(true);
    expect(availability.execute.enabled).toBe(false);
  });

  it('stops offering execute the moment the window closes on screen', () => {
    const action = approvedFixture('2026-09-19T10:06:00+00:00');
    expect(actionAvailability(action, at('2026-09-19T10:05:59Z')).execute.enabled).toBe(true);

    const after = actionAvailability(action, at('2026-09-19T10:06:01Z'));
    expect(after.execute.enabled).toBe(false);
    expect(after.execute.enabled === false && after.execute.reason).toMatch(/window has closed/i);
  });

  it('refuses a spent approval with its own reason, not the expiry one', () => {
    const action = approvedFixture('2026-09-19T10:06:00+00:00', {
      approvalConsumedUtc: '2026-09-19T10:02:00+00:00',
    });
    const availability = actionAvailability(action, at('2026-09-19T10:03:00Z'));
    expect(availability.execute.enabled).toBe(false);
    expect(availability.execute.enabled === false && availability.execute.reason).toMatch(
      /already been used/i,
    );
  });

  it('never offers approve for anything that is not awaiting approval', () => {
    const statuses = [
      ActionStatus.Approved,
      ActionStatus.Rejected,
      ActionStatus.Executing,
      ActionStatus.Executed,
      ActionStatus.Failed,
      ActionStatus.RolledBack,
    ];
    for (const status of statuses) {
      const availability = actionAvailability(
        actionFixture({ status }),
        at('2026-09-19T10:01:00Z'),
      );
      expect(availability.approve.enabled).toBe(false);
    }
  });

  it('blocks approve under a halt but keeps reject open, as the backend does', () => {
    const halts = [haltFixture()];
    const availability = actionAvailability(actionFixture(), at('2026-09-19T10:01:00Z'), halts);
    expect(availability.approve.enabled).toBe(false);
    expect(availability.reject.enabled).toBe(true);
  });
});

describe('haltCovering', () => {
  it('matches global first, then agent, then capability', () => {
    const action = actionFixture();
    const global = haltFixture({ id: 'g', scope: HaltScope.Global, scopeKey: '*' });
    const agent = haltFixture({ id: 'a', scope: HaltScope.Agent, scopeKey: 'pricing-agent' });
    const capability = haltFixture({
      id: 'c',
      scope: HaltScope.Capability,
      scopeKey: 'catalog.reprice',
    });

    expect(haltCovering(action, [capability, agent, global])?.id).toBe('g');
    expect(haltCovering(action, [capability, agent])?.id).toBe('a');
    expect(haltCovering(action, [capability])?.id).toBe('c');
  });

  it('ignores cleared halts and halts for other agents', () => {
    const action = actionFixture();
    expect(haltCovering(action, [haltFixture({ isEngaged: false })])).toBeNull();
    expect(haltCovering(action, [haltFixture({ scopeKey: 'other-agent' })])).toBeNull();
  });
});
