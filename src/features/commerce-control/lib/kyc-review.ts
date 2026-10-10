import {
  ApplicantKind,
  KYC_REASON_CODES,
  KycDecision,
  type ApplicantKindName,
  type KycApplicationDetail,
  type KycApplicationDocument,
  type KycDecisionValue,
  type KycReasonCode,
} from '../api/stylemint-kyc.api';

/**
 * The rules behind the KYC review screen, kept out of the component so they can be pinned by
 * tests rather than read off a screenshot.
 *
 * EMI phase 1 puts buyers into the same queue as creators and vendors. A buyer's case file is a
 * person, not a business: a name, a date of birth, an ID number and three photographs. Three
 * things here exist so the screen gets that right:
 *
 * - the applicant kind reads whether the backend sends it as a number or a name;
 * - an ID number never reaches the screen in full, whatever the backend sends;
 * - the ID photos and the selfie are placed side by side, because that comparison is the
 *   check — a list of filenames is not.
 */

const KIND_NAMES = Object.keys(ApplicantKind) as ApplicantKindName[];

/** `2`, `"2"`, `"Vendor"` and `"vendor"` all read as Vendor; anything else as null. */
export function applicantKindName(
  kind: number | string | null | undefined,
): ApplicantKindName | null {
  if (kind === null || kind === undefined || kind === '') return null;
  if (typeof kind === 'string' && !/^\d+$/.test(kind)) {
    return KIND_NAMES.find((name) => name.toLowerCase() === kind.toLowerCase()) ?? null;
  }
  const value = Number(kind);
  return KIND_NAMES.find((name) => ApplicantKind[name] === value) ?? null;
}

export function applicantKindLabel(kind: number | string | null | undefined): string {
  return applicantKindName(kind) ?? 'Applicant';
}

export function isCustomerKyc(kind: number | string | null | undefined): boolean {
  return applicantKindName(kind) === 'Customer';
}

/**
 * Whether a queue row belongs under the chosen applicant filter.
 *
 * The filter is sent to the backend too. This is the second check, so a backend that ignored
 * the parameter would show a short page rather than vendors under "Customers".
 */
export function matchesApplicantKind(
  item: { applicantKind: number | string },
  filter: ApplicantKindName | undefined,
): boolean {
  return !filter || applicantKindName(item.applicantKind) === filter;
}

const MASK = '•';

/**
 * The ID number as a reviewer may see it: everything but the last four characters masked.
 *
 * Separators are kept, so a citizenship number like `12-01-75-01234` still reads as one. Takes
 * whichever of the three fields the backend filled; with only the last four, it says so with a
 * fixed-width mask rather than guessing the length.
 */
export function maskedDocumentNumber(
  detail: Pick<
    KycApplicationDetail,
    'documentNumber' | 'documentNumberMasked' | 'documentNumberLast4'
  >,
): string | null {
  const full = (detail.documentNumber ?? detail.documentNumberMasked ?? '').trim();
  if (full) {
    const alphanumeric = full.replace(/[^0-9a-z]/gi, '').length;
    let seen = 0;
    return full.replace(/[0-9a-z]/gi, (char) => {
      seen += 1;
      return seen > alphanumeric - 4 ? char : MASK;
    });
  }
  const last4 = (detail.documentNumberLast4 ?? '').trim();
  return last4 ? `${MASK.repeat(4)} ${last4.slice(-4)}` : null;
}

/**
 * Whole years from an ISO `YYYY-MM-DD` date of birth.
 *
 * Parsed by hand, not through `new Date(iso)`: a date-only string is read as UTC midnight, which
 * in Nepal's +05:45 is still the right day but west of Greenwich is the day before — enough to
 * turn an 18th birthday into seventeen.
 */
export function ageInYears(dateOfBirth: string | null | undefined, now = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth ?? '');
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  let age = now.getFullYear() - year;
  const beforeBirthday =
    now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

/** "12 Apr 1995", without the timezone shift `ageInYears` explains. */
export function formatDateOfBirth(dateOfBirth: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth);
  if (!match) return dateOfBirth;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString(
    undefined,
    { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

export const IDENTITY_DOCUMENT_LABEL: Record<string, string> = {
  Citizenship: 'Citizenship certificate',
  NationalId: 'National ID card',
  Passport: 'Passport',
};

/** Where an uploaded image goes in the comparison view. */
export type ComparisonSlot = 'front' | 'back' | 'bio' | 'selfie';

export const COMPARISON_SLOT_LABEL: Record<ComparisonSlot, string> = {
  front: 'ID front',
  back: 'ID back',
  bio: 'Passport photo page',
  selfie: 'Selfie',
};

/** The photos the contract requires for each identity, in the order a reviewer reads them. */
export const REQUIRED_SLOTS: Record<string, ComparisonSlot[]> = {
  Citizenship: ['front', 'back', 'selfie'],
  NationalId: ['front', 'back', 'selfie'],
  Passport: ['bio', 'selfie'],
};

function sideOf(side: KycApplicationDocument['side']): 'front' | 'back' | null {
  if (side === 1 || (typeof side === 'string' && /^(front|1)$/i.test(side))) return 'front';
  if (side === 2 || (typeof side === 'string' && /^(back|2)$/i.test(side))) return 'back';
  return null;
}

/**
 * Places one uploaded document, from the buyer's upload kind (`CitizenshipFront`, `Selfie`, …)
 * when the backend echoes it, else from Identity's type and side. Null when neither says.
 */
export function comparisonSlot(
  document: Pick<KycApplicationDocument, 'documentType' | 'kind' | 'side'>,
): ComparisonSlot | null {
  const text = `${document.kind ?? ''} ${document.documentType}`.toLowerCase();
  if (text.includes('selfie')) return 'selfie';
  if (/passport/.test(text) && (/bio/.test(text) || sideOf(document.side) === null)) return 'bio';
  if (/front/.test(text)) return 'front';
  if (/back/.test(text)) return 'back';
  return sideOf(document.side);
}

/**
 * The documents to put side by side, one per slot — the newest if a kind was uploaded twice,
 * since a re-upload replaces the earlier one — plus everything that could not be placed.
 */
export function arrangeForComparison(documents: KycApplicationDocument[]): {
  placed: { slot: ComparisonSlot; document: KycApplicationDocument }[];
  unplaced: KycApplicationDocument[];
} {
  const bySlot = new Map<ComparisonSlot, KycApplicationDocument>();
  const unplaced: KycApplicationDocument[] = [];
  for (const document of documents) {
    const slot = comparisonSlot(document);
    if (!slot) {
      unplaced.push(document);
      continue;
    }
    const current = bySlot.get(slot);
    if (!current || Date.parse(document.uploadedUtc) > Date.parse(current.uploadedUtc)) {
      if (current) unplaced.push(current);
      bySlot.set(slot, document);
    } else {
      unplaced.push(document);
    }
  }
  const order: ComparisonSlot[] = ['front', 'bio', 'back', 'selfie'];
  return {
    placed: order.flatMap((slot) => {
      const document = bySlot.get(slot);
      return document ? [{ slot, document }] : [];
    }),
    unplaced,
  };
}

/** Required photos the buyer has not supplied for the identity they claimed. */
export function missingSlots(
  identity: string | null | undefined,
  placed: { slot: ComparisonSlot }[],
): ComparisonSlot[] {
  const required = REQUIRED_SLOTS[identity ?? ''] ?? ['selfie'];
  return required.filter((slot) => !placed.some((entry) => entry.slot === slot));
}

/**
 * The reason codes the backend accepts with a given rejection. A product category means
 * nothing on a buyer's identity check, so it is not offered there.
 */
export function reasonCodesFor(
  decision: KycDecisionValue,
  applicantKind: number | string,
): KycReasonCode[] {
  if (decision === KycDecision.Approved) return [];
  const codes: readonly KycReasonCode[] =
    decision === KycDecision.RejectedTerminal ? KYC_REASON_CODES.terminal : KYC_REASON_CODES.retryable;
  return isCustomerKyc(applicantKind) ? codes.filter((code) => code !== 'CATEGORY_MISSING') : [...codes];
}
