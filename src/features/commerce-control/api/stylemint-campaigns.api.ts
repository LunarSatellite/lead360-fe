import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for campaigns — the hero placements on the storefront home and discover screens.
 *
 * Distinct from collections, which are curated product rails: a campaign is the banner above
 * them, with its own window, priority and calls to action. It can point at a collection, which
 * is why the two pages sit next to each other.
 *
 * Full CRUD plus publish and archive. No step-up MFA.
 */

export const CampaignState = { Draft: 1, Published: 2, Archived: 3 } as const;
export type CampaignStateValue = (typeof CampaignState)[keyof typeof CampaignState];
export const CAMPAIGN_STATE_LABEL: Record<number, string> = {
  1: 'Draft',
  2: 'Published',
  3: 'Archived',
};

export const CampaignPlacement = { Home: 1, Discover: 2 } as const;
export type CampaignPlacementValue = (typeof CampaignPlacement)[keyof typeof CampaignPlacement];
export const CAMPAIGN_PLACEMENT_LABEL: Record<number, string> = { 1: 'Home', 2: 'Discover' };

/** Where a call to action sends the shopper. Mirrors CampaignCtaTargetKind. */
export const CTA_TARGET_KIND_LABEL: Record<number, string> = {
  1: 'Collection',
  2: 'Reels',
  3: 'Creators',
  4: 'Category',
  5: 'Brand',
  6: 'Product',
  7: 'External',
};

export type CampaignCta = {
  label: string;
  targetKind: number;
  targetValue?: string | null;
  position?: number;
};

export type Campaign = {
  id: string;
  slug: string;
  placement: number;
  state: number;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  heroImageUrl: string;
  heroReelId?: string | null;
  priority: number;
  startsUtc: string;
  endsUtc: string;
  collectionId?: string | null;
  collectionSlug?: string | null;
  ctas: CampaignCta[];
  publishedUtc?: string | null;
  createdUtc: string;
  updatedUtc: string;
};

export type CampaignPage = {
  items: Campaign[];
  totalCount: number;
  nextCursor?: string | null;
  previousCursor?: string | null;
  pageSize: number;
};

export type UpsertCampaign = {
  slug: string;
  placement: number;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  heroImageUrl: string;
  heroReelId?: string | null;
  priority: number;
  startsUtc: string;
  endsUtc: string;
  collectionId?: string | null;
  ctas: CampaignCta[];
};

const BASE = 'v1/admin/campaigns';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ?? 'Managing campaigns takes a Stylemint operator role an administrator grants.',
    );
  }
  if (response.status === 409) {
    throw new Error(detail ?? 'That slug is already taken by another campaign.');
  }
  throw new Error(detail ?? `The campaigns surface returned HTTP ${response.status}.`);
}

/** A campaign is live only inside its own window, whatever its state says. */
export function isLiveNow(campaign: Campaign): boolean {
  if (campaign.state !== CampaignState.Published) return false;
  const now = Date.now();
  return new Date(campaign.startsUtc).getTime() <= now && new Date(campaign.endsUtc).getTime() > now;
}

export const stylemintCampaignsApi = {
  list: async (params: {
    state?: CampaignStateValue;
    placement?: CampaignPlacementValue;
    cursor?: string;
    pageSize?: number;
  }): Promise<CampaignPage> => {
    const query = new URLSearchParams();
    if (params.state) query.set('state', String(params.state));
    if (params.placement) query.set('placement', String(params.placement));
    if (params.cursor) query.set('cursor', params.cursor);
    query.set('pageSize', String(params.pageSize ?? 20));

    return unwrap<CampaignPage>(
      await stylemintOperationsApi.invoke({ method: 'GET', path: BASE, query: query.toString() }),
    );
  },

  get: async (campaignId: string): Promise<Campaign> =>
    unwrap<Campaign>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/${encodeURIComponent(campaignId)}`,
      }),
    ),

  create: async (vm: UpsertCampaign): Promise<Campaign> =>
    unwrap<Campaign>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: BASE,
        body: JSON.stringify(vm),
      }),
    ),

  update: async (campaignId: string, vm: UpsertCampaign): Promise<Campaign> =>
    unwrap<Campaign>(
      await stylemintOperationsApi.invoke({
        method: 'PUT',
        path: `${BASE}/${encodeURIComponent(campaignId)}`,
        body: JSON.stringify(vm),
      }),
    ),

  publish: async (campaignId: string): Promise<Campaign> =>
    unwrap<Campaign>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(campaignId)}/publish`,
      }),
    ),

  archive: async (campaignId: string): Promise<Campaign> =>
    unwrap<Campaign>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(campaignId)}/archive`,
      }),
    ),
};
