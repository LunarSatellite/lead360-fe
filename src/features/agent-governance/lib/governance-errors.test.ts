import { describe, expect, it } from 'vitest';
import { DISTINCT_APPROVAL_FAILURES, describeRefusal } from './governance-errors';

describe('the three approval failures read differently', () => {
  const [expired, used, scopeChanged] = DISTINCT_APPROVAL_FAILURES.map((code) =>
    describeRefusal(code),
  );

  it('gives each one its own title, body and next step', () => {
    const titles = [expired.title, used.title, scopeChanged.title];
    const bodies = [expired.body, used.body, scopeChanged.body];
    const steps = [expired.nextStep, used.nextStep, scopeChanged.nextStep];

    expect(new Set(titles).size).toBe(3);
    expect(new Set(bodies).size).toBe(3);
    expect(new Set(steps).size).toBe(3);
  });

  it('tells an expired approval to be proposed again', () => {
    expect(expired.errorCode).toBe('governance.approval_expired');
    expect(expired.recovery).toEqual({ kind: 'propose-again' });
    expect(expired.nextStep.toLowerCase()).toContain('propose the action again');
    expect(expired.body.toLowerCase()).toContain('nothing was executed');
  });

  it('tells a reused approval that someone else already acted, and to refresh', () => {
    expect(used.errorCode).toBe('governance.approval_already_used');
    expect(used.recovery).toEqual({ kind: 'refresh' });
    expect(used.title.toLowerCase()).toContain('already acted');
    expect(used.nextStep.toLowerCase()).toContain('refresh');
    expect(used.body.toLowerCase()).toContain('single-use');
  });

  it('tells a changed scope that this is not the reviewed action, and to re-read it', () => {
    expect(scopeChanged.errorCode).toBe('governance.approval_scope_changed');
    expect(scopeChanged.recovery).toEqual({ kind: 're-read' });
    expect(scopeChanged.title.toLowerCase()).toContain('not the action you reviewed');
    expect(scopeChanged.nextStep.toLowerCase()).toContain('re-read');
    expect(scopeChanged.tone).toBe('danger');
  });

  it('never routes two of them to the same recovery affordance', () => {
    const recoveries = [expired.recovery.kind, used.recovery.kind, scopeChanged.recovery.kind];
    expect(new Set(recoveries).size).toBe(3);
  });
});

describe('the rest of the namespace', () => {
  it('states the halt authority asymmetry when a role is refused', () => {
    const refusal = describeRefusal('governance.halt_not_authorized');
    expect(refusal.body).toContain('SuperAdmin, PayoutsOps and ContentMod');
    expect(refusal.body).toContain('Clearing is SuperAdmin alone');
    expect(refusal.recovery).toEqual({ kind: 'none' });
  });

  it('treats a caller-supplied risk tier as a bug in this console, not a user error', () => {
    const refusal = describeRefusal('governance.risk_tier_caller_supplied');
    expect(refusal.body.toLowerCase()).toContain('derived server-side');
    expect(refusal.nextStep.toLowerCase()).toContain('report it');
  });

  it('keeps an unknown code visible rather than swallowing it', () => {
    const refusal = describeRefusal('governance.something_new', 'The server said no.');
    expect(refusal.errorCode).toBe('governance.something_new');
    expect(refusal.title).toBe('The server said no.');
  });

  it('still produces copy when there is no code at all', () => {
    const refusal = describeRefusal(undefined, null);
    expect(refusal.errorCode).toBe('unknown');
    expect(refusal.title.length).toBeGreaterThan(0);
  });
});
