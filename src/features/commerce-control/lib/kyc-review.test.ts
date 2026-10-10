import { describe, expect, it } from 'vitest';
import { KycDecision, type KycApplicationDocument } from '../api/stylemint-kyc.api';
import {
  ageInYears,
  applicantKindName,
  arrangeForComparison,
  comparisonSlot,
  maskedDocumentNumber,
  matchesApplicantKind,
  missingSlots,
  reasonCodesFor,
} from './kyc-review';

/**
 * Buyers join creators and vendors in the KYC queue for EMI. What has to hold: the kind reads
 * whichever way the backend serialises it, an ID number never shows in full, and the photos
 * land beside the selfie they are compared against.
 */

let sequence = 0;

function doc(overrides: Partial<KycApplicationDocument>): KycApplicationDocument {
  return {
    id: `doc-${(sequence += 1)}`,
    documentType: 'Citizenship',
    status: 'Uploaded',
    contentType: 'image/jpeg',
    contentSizeBytes: 200_000,
    uploadedUtc: '2026-10-08T05:00:00+00:00',
    ...overrides,
  };
}

describe('applicantKindName', () => {
  it.each([
    [1, 'Creator'],
    [2, 'Vendor'],
    [3, 'Customer'],
    ['3', 'Customer'],
    ['Customer', 'Customer'],
    ['customer', 'Customer'],
  ])('reads %s as %s', (kind, name) => {
    expect(applicantKindName(kind)).toBe(name);
  });

  it('reads an unknown kind as unknown rather than guessing', () => {
    expect(applicantKindName(9)).toBeNull();
    expect(applicantKindName('Courier')).toBeNull();
    expect(applicantKindName(undefined)).toBeNull();
  });
});

describe('matchesApplicantKind', () => {
  it('keeps only customers under the Customer filter, whichever way the kind arrives', () => {
    expect(matchesApplicantKind({ applicantKind: 3 }, 'Customer')).toBe(true);
    expect(matchesApplicantKind({ applicantKind: 'Customer' }, 'Customer')).toBe(true);
    expect(matchesApplicantKind({ applicantKind: 2 }, 'Customer')).toBe(false);
  });

  it('keeps everything with no filter', () => {
    expect(matchesApplicantKind({ applicantKind: 1 }, undefined)).toBe(true);
  });
});

describe('maskedDocumentNumber', () => {
  it('masks all but the last four characters and keeps the separators', () => {
    expect(maskedDocumentNumber({ documentNumber: '12-01-75-01234' })).toBe('••-••-••-•1234');
  });

  it('never returns the full number', () => {
    const masked = maskedDocumentNumber({ documentNumber: 'PA1234567' })!;
    expect(masked).not.toContain('PA123');
    expect(masked.endsWith('4567')).toBe(true);
  });

  it('works from the last four alone, without inventing a length', () => {
    expect(maskedDocumentNumber({ documentNumberLast4: '0912' })).toBe('•••• 0912');
  });

  it('re-masks a backend-masked number rather than trusting its mask', () => {
    expect(maskedDocumentNumber({ documentNumberMasked: 'XXXXXX4321' })).toBe('••••••4321');
  });

  it('is null when no number came back', () => {
    expect(maskedDocumentNumber({})).toBeNull();
  });
});

describe('ageInYears', () => {
  const now = new Date(2026, 9, 9);

  it('counts whole years', () => {
    expect(ageInYears('1995-04-12', now)).toBe(31);
  });

  it('is seventeen the day before an eighteenth birthday, eighteen on it', () => {
    expect(ageInYears('2008-10-10', now)).toBe(17);
    expect(ageInYears('2008-10-09', now)).toBe(18);
  });

  it('is null for a missing or malformed date', () => {
    expect(ageInYears(null, now)).toBeNull();
    expect(ageInYears('12/04/1995', now)).toBeNull();
  });
});

describe('comparisonSlot', () => {
  it.each([
    [{ kind: 'CitizenshipFront' }, 'front'],
    [{ kind: 'NationalIdBack' }, 'back'],
    [{ kind: 'PassportBio', documentType: 'Passport' }, 'bio'],
    [{ kind: 'Selfie' }, 'selfie'],
    [{ documentType: 'SelfiePhoto' }, 'selfie'],
    [{ documentType: 'Citizenship', side: 'Back' }, 'back'],
    [{ documentType: 'NationalIdCard', side: 1 }, 'front'],
    [{ documentType: 'Passport' }, 'bio'],
  ] as const)('places %o as %s', (overrides, slot) => {
    expect(comparisonSlot(doc(overrides))).toBe(slot);
  });

  it('does not place a document that says neither its kind nor its side', () => {
    expect(comparisonSlot(doc({ documentType: 'ProofOfAddress' }))).toBeNull();
  });
});

describe('arrangeForComparison', () => {
  it('orders ID images before the selfie and keeps the newest of a re-upload', () => {
    const older = doc({ kind: 'CitizenshipFront', uploadedUtc: '2026-10-01T00:00:00Z' });
    const newer = doc({ kind: 'CitizenshipFront', uploadedUtc: '2026-10-08T00:00:00Z' });
    const selfie = doc({ kind: 'Selfie' });
    const back = doc({ kind: 'CitizenshipBack' });

    const { placed, unplaced } = arrangeForComparison([selfie, older, back, newer]);

    expect(placed.map((entry) => entry.slot)).toEqual(['front', 'back', 'selfie']);
    expect(placed[0].document.id).toBe(newer.id);
    expect(unplaced.map((entry) => entry.id)).toEqual([older.id]);
  });
});

describe('missingSlots', () => {
  it('asks a citizenship for front, back and selfie', () => {
    expect(missingSlots('Citizenship', [{ slot: 'front' }])).toEqual(['back', 'selfie']);
  });

  it('asks a passport for the bio page and selfie only', () => {
    expect(missingSlots('Passport', [{ slot: 'bio' }, { slot: 'selfie' }])).toEqual([]);
  });
});

describe('reasonCodesFor', () => {
  it('offers only retryable codes for "may reapply" and terminal ones for "final"', () => {
    expect(reasonCodesFor(KycDecision.RejectedRetryable, 2)).toContain('DOCS_UNCLEAR');
    expect(reasonCodesFor(KycDecision.RejectedRetryable, 2)).not.toContain('UNDERAGE');
    expect(reasonCodesFor(KycDecision.RejectedTerminal, 2)).toEqual([
      'FRAUD_SUSPECTED',
      'SANCTIONS_HIT',
      'UNDERAGE',
    ]);
  });

  it('does not offer a product category reason on a buyer identity check', () => {
    expect(reasonCodesFor(KycDecision.RejectedRetryable, 'Customer')).not.toContain(
      'CATEGORY_MISSING',
    );
    expect(reasonCodesFor(KycDecision.RejectedRetryable, 2)).toContain('CATEGORY_MISSING');
  });

  it('asks for no reason on an approval', () => {
    expect(reasonCodesFor(KycDecision.Approved, 3)).toEqual([]);
  });
});
