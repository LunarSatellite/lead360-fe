import { describe, expect, it } from 'vitest';
import {
  AgreementKind,
  AgreementState,
  DelinquencyBucket,
  Guarantor,
  type CreditPortfolio,
} from '../api/stylemint-credit.api';
import {
  bookTotals,
  calendarDate,
  parseFactors,
  parseSignals,
  percent,
  reasonLabel,
} from './credit-console';

const slice = (
  state: number,
  kind: number,
  guarantor: number,
  count: number,
  outstandingPrincipal: number,
) => ({ state, kind, guarantor, count, outstandingPrincipal }) as CreditPortfolio['slices'][number];

describe('bookTotals', () => {
  const portfolio: CreditPortfolio = {
    asOf: '2026-10-10',
    slices: [
      slice(AgreementState.Active, AgreementKind.Instalment, Guarantor.Vendor, 3, 90_000),
      slice(AgreementState.Active, AgreementKind.PayLater, Guarantor.Platform, 2, 20_000),
      // A running prepay is the buyer paying ahead: nothing is owed to anyone.
      slice(AgreementState.Active, AgreementKind.Prepay, Guarantor.None, 1, 27_000),
      // Not yet started: principal that would be lent, not principal owed.
      slice(AgreementState.Approved, AgreementKind.Instalment, Guarantor.Vendor, 1, 48_000),
      slice(AgreementState.PendingApproval, AgreementKind.Instalment, Guarantor.Vendor, 4, 100_000),
      slice(AgreementState.Defaulted, AgreementKind.Instalment, Guarantor.Vendor, 1, 16_000),
    ],
    delinquency: [
      { bucket: DelinquencyBucket.Current, guarantor: Guarantor.Vendor, count: 2, outstandingPrincipal: 60_000 },
      { bucket: DelinquencyBucket.Days1To30, guarantor: Guarantor.Vendor, count: 1, outstandingPrincipal: 30_000 },
      { bucket: DelinquencyBucket.Days61To90, guarantor: Guarantor.Platform, count: 1, outstandingPrincipal: 10_000 },
      { bucket: DelinquencyBucket.Days1To30, guarantor: Guarantor.None, count: 1, outstandingPrincipal: 9_000 },
    ],
    unappliedPaymentCount: 0,
    unappliedPaymentAmount: 0,
  };

  it('counts as owed only running credit, split by who carries the loss', () => {
    const totals = bookTotals(portfolio);

    expect(totals.owed).toBe(110_000);
    expect(totals.runningCount).toBe(5);
    expect(totals.owedByGuarantor[Guarantor.Vendor]).toBe(90_000);
    expect(totals.owedByGuarantor[Guarantor.Platform]).toBe(20_000);
  });

  it('counts as late only credit with a payment past due', () => {
    const totals = bookTotals(portfolio);

    expect(totals.late).toBe(40_000);
    expect(totals.lateCount).toBe(2);
  });

  it('reports what was written off and what awaits a decision', () => {
    const totals = bookTotals(portfolio);

    expect(totals.writtenOff).toBe(16_000);
    expect(totals.awaitingDecision).toBe(4);
  });

  it('an empty book is zeros, and a share of nothing is not a percentage', () => {
    const totals = bookTotals({ ...portfolio, slices: [], delinquency: [] });

    expect(totals.owed).toBe(0);
    expect(percent(totals.late, totals.owed)).toBeNull();
    expect(percent(25, 200)).toBe('12.5%');
  });
});

describe('the recorded decision', () => {
  it('reads factors as the decision stored them', () => {
    const raw =
      '[{"code":"kyc_verified","points":60},{"code":"duplicate_identity","points":-200}]';

    expect(parseFactors(raw)).toEqual([
      { code: 'kyc_verified', points: 60 },
      { code: 'duplicate_identity', points: -200 },
    ]);
  });

  it('never throws on a malformed record', () => {
    expect(parseFactors('not json')).toEqual([]);
    expect(parseFactors('{"code":"x"}')).toEqual([]);
    expect(parseFactors('[{"code":1,"points":"a"}]')).toEqual([]);
    expect(parseFactors(null)).toEqual([]);
    expect(parseSignals('[1,2]')).toEqual([]);
    expect(parseSignals('nope')).toEqual([]);
  });

  it('turns signals into readable pairs', () => {
    const signals = parseSignals(
      '{"kycTier":2,"phoneVerified":true,"duplicateIdentitySuspected":false,"lastDeclineUtc":null}',
    );

    expect(signals).toEqual([
      { label: 'Kyc Tier', value: '2' },
      { label: 'Phone Verified', value: 'Yes' },
      { label: 'Duplicate Identity Suspected', value: 'No' },
      { label: 'Last Decline (UTC)', value: '—' },
    ]);
  });
});

describe('labels', () => {
  it('explains known reason codes, a default, and anything else as words', () => {
    expect(reasonLabel('reserve_insufficient')).toBe('Guarantee reserve too thin');
    expect(reasonLabel('days_past_due_91')).toBe('Defaulted at 91 days past due');
    expect(reasonLabel('out_of_stock')).toBe('Out of stock');
  });

  it('shows a due date as the calendar date it is, not shifted by the time zone', () => {
    expect(calendarDate('2026-04-02')).toContain('2');
    expect(calendarDate('2026-04-02')).toContain('2026');
    expect(calendarDate('2026-04-02')).not.toContain('Apr 1');
    expect(calendarDate('garbage')).toBe('garbage');
  });
});
