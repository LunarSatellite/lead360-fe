import { describe, expect, it } from 'vitest';
import {
  blastRadius,
  EMPTY_HALT_FORM,
  haltFormBlocker,
  resolveHaltAuthority,
  SCOPE_CHOICES,
} from './halt-authority';
import { HaltScope } from '../types/governance.types';

describe('who may engage and who may clear', () => {
  it('lets all three engaging roles engage', () => {
    for (const role of ['SuperAdmin', 'PayoutsOps', 'ContentMod']) {
      expect(resolveHaltAuthority([role]).canEngage).toBe(true);
    }
  });

  it('offers clearing to SuperAdmin alone', () => {
    expect(resolveHaltAuthority(['SuperAdmin']).canClear).toBe(true);
    expect(resolveHaltAuthority(['PayoutsOps']).canClear).toBe(false);
    expect(resolveHaltAuthority(['ContentMod']).canClear).toBe(false);
    expect(resolveHaltAuthority(['PayoutsOps', 'ContentMod']).canClear).toBe(false);
    expect(resolveHaltAuthority(['Readonly']).canClear).toBe(false);
    expect(resolveHaltAuthority([]).canClear).toBe(false);
  });

  it('grants nothing when the roles are unknown', () => {
    expect(resolveHaltAuthority(null)).toEqual({
      canEngage: false,
      canClear: false,
      unknown: true,
    });
  });
});

describe('blast radius', () => {
  it('offers the narrowest scope first and never puts global at the top', () => {
    expect(SCOPE_CHOICES[0]).toBe(HaltScope.Capability);
    expect(SCOPE_CHOICES[SCOPE_CHOICES.length - 1]).toBe(HaltScope.Global);
    expect(SCOPE_CHOICES.map((scope) => blastRadius(scope, 'x').breadth)).toEqual([1, 2, 3]);
  });

  it('says what a global stop takes down and what survives it', () => {
    const radius = blastRadius(HaltScope.Global, '');
    expect(radius.stops).toContain('platform-wide');
    expect(radius.stops).toContain('voided');
    expect(radius.keepsWorking).toContain('Rejecting');
  });

  it('names the exact key that will be sent, lower-cased as the server stores it', () => {
    expect(blastRadius(HaltScope.Agent, '  Pricing-Agent ').stops).toContain('pricing-agent');
    expect(blastRadius(HaltScope.Capability, 'Catalog.Reprice').stops).toContain(
      'catalog.reprice',
    );
  });

  it('distinguishes what each narrower scope leaves running', () => {
    expect(blastRadius(HaltScope.Agent, 'a').keepsWorking).toContain('Every other agent');
    expect(blastRadius(HaltScope.Capability, 'c').keepsWorking).toContain('Every other capability');
  });
});

describe('the engage form cannot be walked into', () => {
  it('starts with nothing chosen — least of all the broadest scope', () => {
    expect(EMPTY_HALT_FORM.scope).toBeNull();
    expect(EMPTY_HALT_FORM.acknowledged).toBe(false);
    expect(EMPTY_HALT_FORM.reason).toBe('');
  });

  it('blocks confirmation until scope, key, reason and acknowledgement are all supplied by hand', () => {
    expect(haltFormBlocker(EMPTY_HALT_FORM)).toMatch(/choose what this stop covers/i);

    const scoped = { ...EMPTY_HALT_FORM, scope: HaltScope.Agent };
    expect(haltFormBlocker(scoped)).toMatch(/name the agent/i);

    const keyed = { ...scoped, scopeKey: 'pricing-agent' };
    expect(haltFormBlocker(keyed)).toMatch(/record why/i);

    const reasoned = { ...keyed, reason: 'Repricing loop suspected.' };
    expect(haltFormBlocker(reasoned)).toMatch(/confirm you have read/i);

    expect(haltFormBlocker({ ...reasoned, acknowledged: true })).toBeNull();
  });

  it('still demands a reason and an acknowledgement for a global stop, which needs no key', () => {
    const global = { ...EMPTY_HALT_FORM, scope: HaltScope.Global };
    expect(haltFormBlocker(global)).toMatch(/record why/i);
    expect(haltFormBlocker({ ...global, reason: 'Kill switch drill.' })).toMatch(
      /confirm you have read/i,
    );
    expect(
      haltFormBlocker({ ...global, reason: 'Kill switch drill.', acknowledged: true }),
    ).toBeNull();
  });

  it('holds the server limits so a refusal is not the first feedback', () => {
    const base = { ...EMPTY_HALT_FORM, scope: HaltScope.Agent, acknowledged: true };
    expect(
      haltFormBlocker({ ...base, scopeKey: 'a'.repeat(151), reason: 'because' }),
    ).toMatch(/150 characters/);
    expect(haltFormBlocker({ ...base, scopeKey: 'a', reason: 'r'.repeat(1001) })).toMatch(
      /1000 characters/,
    );
  });
});
