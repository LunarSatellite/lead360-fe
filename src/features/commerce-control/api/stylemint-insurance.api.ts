import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Partnership insurance: the cover a partnership holds, the claims filed against it, and the
 * PayoutsOps decision on one claim.
 *
 * The review sits under `admin/insurance`, but the cover and the claims it is decided against are
 * readable only under `partnerships/{id}` — so the operator surface admits those two reads
 * specifically. Forwarding the decision without the facts behind it would put an operator in
 * front of a judgement with nothing to base it on.
 *
 * Everything is keyed on a partnership id, because the backend serves no queue of claims awaiting
 * review. The panel asks for the id rather than faking a picker over a list that does not exist.
 */

export type Report = Record<string, unknown>;

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  // An unmatched upstream route 404s with an empty body; a controller's own 404 carries one.
  if (response.status === 404) {
    const empty = response.body == null || response.body === '';
    throw new Error(empty ? 'NOT_DEPLOYED' : 'NOT_FOUND');
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(detail ?? 'Reviewing an insurance claim takes the PayoutsOps role.');
  }
  throw new Error(detail ?? `The insurance surface returned HTTP ${response.status}.`);
}

export const stylemintInsuranceApi = {
  /** The cover one partnership holds. */
  cover: async (partnershipId: string): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/partnerships/${encodeURIComponent(partnershipId)}/insurance`,
      }),
    ),

  /** Every claim filed against that cover. */
  claims: async (partnershipId: string): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `v1/partnerships/${encodeURIComponent(partnershipId)}/insurance/claims`,
      }),
    ),

  /**
   * The PayoutsOps decision on one claim.
   *
   * The settlement amount is optional and stays absent rather than defaulting to zero: an
   * approval with no figure means the amount is settled elsewhere, and sending 0 would record a
   * decision to pay nothing.
   */
  reviewClaim: async (
    claimId: string,
    decision: { approved: boolean; notes?: string; settlementAmount?: number },
  ): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/insurance/claims/${encodeURIComponent(claimId)}/review`,
        body: JSON.stringify({
          approved: decision.approved,
          notes: decision.notes?.trim() || null,
          settlementAmount:
            decision.settlementAmount === undefined ? null : decision.settlementAmount,
        }),
      }),
    ),
};
