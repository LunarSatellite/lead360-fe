import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for the surfaces that decide what shoppers are shown before they search:
 *
 *  - popular searches — the curated suggestion chips, per region
 *  - featured matches — creator/brand pairings the matcher proposed, awaiting a human
 *  - fairness audit   — whether the matcher is distributing exposure evenly
 *  - reach            — the publish pipeline and the policy alerts against it
 *
 * They belong together because they are the same lever: what the platform promotes, and the
 * check on whether it is promoting fairly.
 */

export type PopularSearch = {
  id: string;
  label: string;
  query: string;
  displayOrder: number;
  regionCode?: string | null;
  isActive: boolean;
  createdUtc: string;
  updatedUtc: string;
  rowVersion: string;
};

export type UpsertPopularSearch = {
  label: string;
  query: string;
  displayOrder: number;
  regionCode?: string | null;
};

export const FeaturedMatchState = { Proposed: 1, Approved: 2, Rejected: 3, Pushed: 4 } as const;
export const FEATURED_STATE_LABEL: Record<number, string> = {
  1: 'Proposed',
  2: 'Approved',
  3: 'Rejected',
  4: 'Pushed',
};

export type FeaturedMatchCandidate = {
  id: string;
  matchSnapshotId: string;
  state: number;
  reviewedByAccountId?: string | null;
  reviewerNote?: string | null;
  reviewedUtc?: string | null;
  pushedUtc?: string | null;
  proposedUtc: string;
};

export type FeaturedPage = {
  items: FeaturedMatchCandidate[];
  totalCount: number;
  nextCursor?: string | null;
  pageSize: number;
};

/** Audit and alert shapes are open — they are reports, not forms. */
export type Report = Record<string, unknown>;

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 404) {
    // `fairness-audit/latest` 404s when no audit has ever been run, which is a state to
    // render, not an error to shout about.
    throw new Error(detail ?? 'NOT_FOUND');
  }
  if (response.status === 403) {
    throw new Error(
      detail ?? 'This discovery surface needs a Stylemint operator role an administrator grants.',
    );
  }
  if (response.status === 409) {
    throw new Error(detail ?? 'That entry conflicts with an existing one.');
  }
  throw new Error(detail ?? `The discovery surface returned HTTP ${response.status}.`);
}

export const stylemintDiscoveryApi = {
  popularSearches: async (region?: string): Promise<PopularSearch[]> => {
    const query = new URLSearchParams();
    if (region) query.set('region', region);
    return unwrap<PopularSearch[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/catalog/popular-searches',
        query: query.toString(),
      }),
    );
  },

  createPopularSearch: async (vm: UpsertPopularSearch): Promise<PopularSearch> =>
    unwrap<PopularSearch>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/catalog/popular-searches',
        body: JSON.stringify(vm),
      }),
    ),

  updatePopularSearch: async (id: string, vm: UpsertPopularSearch): Promise<PopularSearch> =>
    unwrap<PopularSearch>(
      await stylemintOperationsApi.invoke({
        method: 'PUT',
        path: `v1/admin/catalog/popular-searches/${encodeURIComponent(id)}`,
        body: JSON.stringify(vm),
      }),
    ),

  setPopularSearchActive: async (id: string, active: boolean): Promise<PopularSearch> =>
    unwrap<PopularSearch>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/catalog/popular-searches/${encodeURIComponent(id)}/${
          active ? 'activate' : 'deactivate'
        }`,
      }),
    ),

  deletePopularSearch: async (id: string): Promise<void> => {
    unwrap<void>(
      await stylemintOperationsApi.invoke({
        method: 'DELETE',
        path: `v1/admin/catalog/popular-searches/${encodeURIComponent(id)}`,
      }),
    );
  },

  featuredPending: async (pageSize = 50): Promise<FeaturedPage> =>
    unwrap<FeaturedPage>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/matchmaking/featured/pending',
        query: `pageSize=${pageSize}`,
      }),
    ),

  approveFeatured: async (id: string, note?: string): Promise<FeaturedMatchCandidate> =>
    unwrap<FeaturedMatchCandidate>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/matchmaking/featured/${encodeURIComponent(id)}/approve`,
        body: JSON.stringify({ note: note || null }),
      }),
    ),

  /** Rejecting requires a note — the matcher learns from it. */
  rejectFeatured: async (id: string, note: string): Promise<FeaturedMatchCandidate> =>
    unwrap<FeaturedMatchCandidate>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `v1/admin/matchmaking/featured/${encodeURIComponent(id)}/reject`,
        body: JSON.stringify({ note }),
      }),
    ),

  fairnessLatest: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/matchmaking/fairness-audit/latest',
      }),
    ),

  runFairnessAudit: async (): Promise<Report> =>
    unwrap<Report>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/matchmaking/fairness-audit/run',
      }),
    ),

  policyAlerts: async (): Promise<Report[]> =>
    unwrap<Report[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: 'v1/admin/reach/policy-alerts',
      }),
    ),

  /** Nudges the reach decision loop rather than waiting for its schedule. */
  reachTick: async (maxOwners = 100): Promise<number> =>
    unwrap<number>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/reach/decision-loop/tick',
        query: `maxOwners=${maxOwners}`,
      }),
    ),

  reachDrain: async (maxJobs = 50): Promise<number> =>
    unwrap<number>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: 'v1/admin/reach/publish/drain',
        query: `maxJobs=${maxJobs}`,
      }),
    ),
};
