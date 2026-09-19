import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for reel recipes — the shot-by-shot templates a creator follows to make a reel.
 *
 * The whole admin surface is ContentMod-gated with no step-up MFA, so it works from Lead360.
 *
 * The one read is `llm-drafts-pending-review`: recipes the model drafted and left in Draft,
 * waiting for a human to promote or hide them. That queue is the point of this page — the other
 * four endpoints act on an id and were unreachable without it.
 */

export const RecipeState = { Draft: 1, Locked: 2, Retired: 3, Hidden: 4 } as const;
export const RECIPE_STATE_LABEL: Record<number, string> = {
  1: 'Draft',
  2: 'Locked',
  3: 'Retired',
  4: 'Hidden',
};

export const RecipeOrigin = {
  BrandAuthored: 1,
  PlatformCurated: 2,
  LlmDrafted: 3,
  CreatorFork: 4,
} as const;
export const RECIPE_ORIGIN_LABEL: Record<number, string> = {
  1: 'Brand authored',
  2: 'Platform curated',
  3: 'LLM drafted',
  4: 'Creator fork',
};

export type CaptionVariant = { text?: string; locale?: string } & Record<string, unknown>;

export type SceneBeat = {
  index?: number;
  seconds?: number;
  instruction?: string;
} & Record<string, unknown>;

export type ReelRecipe = {
  id: string;
  title: string;
  origin: number;
  authorVendorProfileId?: string | null;
  sourceBrandBriefId?: string | null;
  curatedByAdminAccountId?: string | null;
  musicTrackRefId: string;
  context?: Record<string, unknown>;
  segment?: Record<string, unknown>;
  captionVariants?: CaptionVariant[];
  platformAdaptations?: Array<Record<string, unknown>>;
  beats?: SceneBeat[];
  reasoning?: Record<string, unknown>;
  explanationByKey?: Record<string, string>;
  state: number;
  version: number;
  recipeVersion: string;
  createdUtc: string;
  updatedUtc: string;
  lockedUtc?: string | null;
  citedInReelCount: number;
};

const BASE = 'v1/admin/recipes';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 403) {
    throw new Error(
      detail ??
        'Curating recipes takes the Stylemint ContentMod role. An administrator grants it.',
    );
  }
  throw new Error(detail ?? `The recipes surface returned HTTP ${response.status}.`);
}

export const stylemintRecipesApi = {
  /** Recipes the model drafted, still in Draft, waiting on a human. */
  pendingReview: async (params: { skip?: number; take?: number } = {}): Promise<ReelRecipe[]> => {
    const query = new URLSearchParams();
    query.set('skip', String(params.skip ?? 0));
    query.set('take', String(params.take ?? 50));

    return unwrap<ReelRecipe[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/llm-drafts-pending-review`,
        query: query.toString(),
      }),
    );
  },

  /** Accepts a drafted recipe as platform-curated — it becomes usable by creators. */
  promote: async (recipeId: string): Promise<ReelRecipe> =>
    unwrap<ReelRecipe>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(recipeId)}/promote-to-curated`,
      }),
    ),

  /** Takes a recipe out of circulation. The reason is recorded. */
  hide: async (recipeId: string, reason: string): Promise<ReelRecipe> =>
    unwrap<ReelRecipe>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(recipeId)}/hide`,
        body: JSON.stringify({ reason }),
      }),
    ),

  unhide: async (recipeId: string): Promise<ReelRecipe> =>
    unwrap<ReelRecipe>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(recipeId)}/unhide`,
      }),
    ),
};
