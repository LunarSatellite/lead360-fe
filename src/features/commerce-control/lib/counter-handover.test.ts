import { describe, expect, it } from 'vitest';
import {
  collectionDestination,
  counterReference,
  HANDOVER_CONSEQUENCES,
  handoverReadiness,
  readHandoverResponse,
} from './counter-handover';

/**
 * Three defects this module exists to prevent, each of which has already
 * shipped somewhere in this codebase: a control that vanishes instead of
 * explaining a refusal, an empty address snapshot formatted into a place, and
 * an absent counter rendered as a plausible-looking stand-in.
 */

const collection = { state: 12, fulfillmentChannel: 2 };
const delivery = { state: 12, fulfillmentChannel: 1 };

describe('handoverReadiness', () => {
  it('is ready on a collection sub-order in a pre-shipping state', () => {
    expect(handoverReadiness(collection)).toEqual({ kind: 'ready' });
  });

  it.each([2, 3, 12, 13, 4, 5])('accepts state %s, matching the backend transition', (state) => {
    expect(handoverReadiness({ state, fulfillmentChannel: 2 }).kind).toBe('ready');
  });

  it('refuses a delivery sub-order and says why rather than hiding the control', () => {
    const result = handoverReadiness(delivery);

    expect(result.kind).toBe('refused');
    if (result.kind !== 'refused') throw new Error('unreachable');
    expect(result.reason).toMatch(/delivery sub-order/i);
    expect(result.reason).toMatch(/refused/i);
    expect(result.reason).toMatch(/courier/i);
  });

  it('never returns a bare refusal — every negative branch carries a reason', () => {
    const negatives = [
      handoverReadiness(delivery),
      handoverReadiness({ state: 8, fulfillmentChannel: 2 }),
      handoverReadiness({ state: 7, fulfillmentChannel: 2 }),
    ];

    for (const result of negatives) {
      expect(result.kind).not.toBe('ready');
      const reason = (result as { reason?: string }).reason;
      expect(reason).toBeTruthy();
      expect(reason!.length).toBeGreaterThan(20);
    }
  });

  it('reports an already-recorded handover instead of offering to repeat it', () => {
    const result = handoverReadiness({
      state: 7,
      fulfillmentChannel: 2,
      collectedUtc: '2026-09-19T10:00:00+00:00',
    });

    expect(result).toEqual({
      kind: 'alreadyCollected',
      collectedUtc: '2026-09-19T10:00:00+00:00',
    });
  });
});

describe('HANDOVER_CONSEQUENCES', () => {
  it('names what the action causes rather than asking whether the operator is sure', () => {
    const text = HANDOVER_CONSEQUENCES.join(' ').toLowerCase();

    expect(text).toContain('completes the order');
    expect(text).toContain('return window');
    expect(text).toContain('earnings');
    expect(text).toContain('cannot be undone');
    expect(text).not.toContain('are you sure');
  });
});

describe('counterReference', () => {
  it('returns the recorded collection point when the order names one', () => {
    expect(counterReference(' 6f9619ff-8b86-d011-b42d-00cf4fc964ff ')).toBe(
      '6f9619ff-8b86-d011-b42d-00cf4fc964ff',
    );
  });

  it.each([undefined, null, '', '   ', '00000000-0000-0000-0000-000000000000'])(
    'renders an absent counter as absent for %p — never a stand-in',
    (value) => {
      expect(counterReference(value)).toBeNull();
    },
  );

  it('never substitutes a generic word or the seller for a missing counter', () => {
    // App-placed collection orders carry no FulfillmentLocationId today. The
    // honest answer is null; "Store" and a seller name are both inventions.
    const rendered = counterReference(null);
    expect(rendered).toBeNull();
    expect(rendered).not.toBe('Store');
  });
});

describe('collectionDestination', () => {
  it('is null on a collection order, because nothing is shipped anywhere', () => {
    expect(collectionDestination(collection)).toBeNull();
  });

  it('does not bottom out as a fabricated place the way both mobile clients did', () => {
    // The snapshot on a collection sub-order is empty by design, and its
    // Country defaults to "NP" server-side — so "every field blank" is not a
    // safe test and the snapshot is never inspected at all.
    expect(collectionDestination(collection)).not.toBe('Location saved');
  });
});

describe('readHandoverResponse', () => {
  it('reads a completed handover and carries the instant the backend recorded', () => {
    expect(
      readHandoverResponse({
        status: 200,
        body: { id: 'x', state: 7, collectedUtc: '2026-09-20T09:15:00+00:00' },
      }),
    ).toEqual({ kind: 'completed', collectedUtc: '2026-09-20T09:15:00+00:00' });
  });

  it('does not invent a timestamp when the response carries none', () => {
    expect(readHandoverResponse({ status: 200, body: { id: 'x', state: 7 } })).toEqual({
      kind: 'completed',
      collectedUtc: null,
    });
  });

  it("surfaces the backend's refusal on a delivery sub-order verbatim", () => {
    const result = readHandoverResponse({
      status: 422,
      body: { title: 'Only a collection sub-order can be handed over at a counter.' },
    });

    expect(result).toEqual({
      kind: 'refused',
      message: 'Only a collection sub-order can be handed over at a counter.',
    });
  });

  it('explains a refusal that arrives without a message instead of printing a status code', () => {
    const result = readHandoverResponse({ status: 422, body: null });

    expect(result.kind).toBe('refused');
    if (result.kind === 'completed') throw new Error('unreachable');
    expect(result.message).toMatch(/collection sub-order/i);
    expect(result.message).not.toMatch(/422/);
  });

  it('separates a refusal from a failure so a retry is not suggested for the wrong one', () => {
    expect(readHandoverResponse({ status: 409, body: null }).kind).toBe('refused');
    expect(readHandoverResponse({ status: 403, body: null }).kind).toBe('failed');
    expect(readHandoverResponse({ status: 404, body: null }).kind).toBe('failed');
    expect(readHandoverResponse({ status: 500, body: null }).kind).toBe('failed');
  });

  it('names the missing role on a 403 rather than leaving the operator guessing', () => {
    const result = readHandoverResponse({ status: 403, body: null });
    if (result.kind === 'completed') throw new Error('unreachable');
    expect(result.message).toMatch(/operator role/i);
  });
});
