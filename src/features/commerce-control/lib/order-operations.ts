export type VendorRejectionReasonCode = 1 | 2 | 3 | 4 | 5 | 6;

export function buildVendorRejection(
  reasonCode: number,
  note: string,
): { reasonCode: VendorRejectionReasonCode; note: string | null } {
  if (![1, 2, 3, 4, 5, 6].includes(reasonCode)) throw new Error('Motif de rejet invalide.');
  const cleanNote = note.trim();
  if (reasonCode === 6 && cleanNote.length < 3)
    throw new Error('Une explication est obligatoire pour le motif Autre.');
  if (cleanNote.length > 200) throw new Error('La note de rejet ne peut pas depasser 200 caracteres.');
  return { reasonCode: reasonCode as VendorRejectionReasonCode, note: cleanNote || null };
}

export function canSubmitVerifiedRefund(input: {
  paymentIntentId: string;
  amount: number;
  maximum: number;
  reason: string;
  confirmed: boolean;
  loading: boolean;
  failed: boolean;
}): boolean {
  return (
    !input.loading &&
    !input.failed &&
    input.paymentIntentId.trim().length > 0 &&
    Number.isFinite(input.amount) &&
    input.amount > 0 &&
    input.amount <= input.maximum &&
    input.reason.trim().length >= 5 &&
    input.confirmed
  );
}
