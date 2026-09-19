import { describe, expect, it } from 'vitest';
import { buildVendorRejection, canSubmitVerifiedRefund } from './order-operations';

describe('buildVendorRejection', () => {
  it.each([1, 2, 3, 4, 5])('preserves Stylemint reason code %s', (reasonCode) => {
    expect(buildVendorRejection(reasonCode, '  operator note  ')).toEqual({
      reasonCode,
      note: 'operator note',
    });
  });

  it('requires an explanation for Other', () => {
    expect(() => buildVendorRejection(6, '')).toThrow(/required/i);
    expect(buildVendorRejection(6, 'Cas exceptionnel')).toEqual({
      reasonCode: 6,
      note: 'Cas exceptionnel',
    });
  });

  it('rejects invalid reason codes and overlong notes', () => {
    expect(() => buildVendorRejection(7, 'note')).toThrow(/invalid/i);
    expect(() => buildVendorRejection(1, 'x'.repeat(201))).toThrow(/200/);
  });
});

describe('canSubmitVerifiedRefund', () => {
  const valid = {
    paymentIntentId: 'f4a31da1-9f5e-4c87-a6a8-a69525a6ecb8',
    amount: 25_000,
    maximum: 30_000,
    reason: 'Article retourne',
    confirmed: true,
    loading: false,
    failed: false,
  };

  it('accepts a confirmed refund within the verified maximum', () => {
    expect(canSubmitVerifiedRefund(valid)).toBe(true);
  });

  it.each([
    ['unconfirmed', { confirmed: false }],
    ['over maximum', { amount: 30_001 }],
    ['zero', { amount: 0 }],
    ['missing payment', { paymentIntentId: '' }],
    ['weak reason', { reason: 'bad' }],
    ['loading context', { loading: true }],
    ['failed context', { failed: true }],
  ])('rejects %s requests', (_name, change) => {
    expect(canSubmitVerifiedRefund({ ...valid, ...change })).toBe(false);
  });
});
