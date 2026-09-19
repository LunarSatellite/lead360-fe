import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * The three operator actions on a reel. ContentMod, no step-up MFA.
 *
 * All three take a reel id and nothing lists reels for an operator, so they live on the content
 * page beside the reel listing that already exists rather than on a page of their own — a
 * standalone page would be three buttons with no way to reach a reel.
 *
 * Pinning a reel to a drop party promotes it inside that event. Marking a reel
 * externally deleted records that the source platform removed it, which stops the platform
 * showing a link that no longer resolves.
 */

export type ReelAdminResult = Record<string, unknown>;

const BASE = 'v1/admin/reels';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ?? 'Reel operator actions take the Stylemint ContentMod role.',
    );
  }
  throw new Error(detail ?? `The reels surface returned HTTP ${response.status}.`);
}

export const stylemintReelsAdminApi = {
  pinToDropParty: async (reelId: string, dropPartyId: string): Promise<ReelAdminResult> =>
    unwrap<ReelAdminResult>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(reelId)}/drop-party/pin`,
        body: JSON.stringify({ dropPartyId }),
      }),
    ),

  unpinFromDropParty: async (reelId: string, dropPartyId: string): Promise<ReelAdminResult> =>
    unwrap<ReelAdminResult>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(reelId)}/drop-party/unpin`,
        body: JSON.stringify({ dropPartyId }),
      }),
    ),

  /** Records that the source platform removed the reel. Takes no body. */
  markExternalDeleted: async (reelId: string): Promise<ReelAdminResult> =>
    unwrap<ReelAdminResult>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(reelId)}/external-deleted`,
      }),
    ),
};
