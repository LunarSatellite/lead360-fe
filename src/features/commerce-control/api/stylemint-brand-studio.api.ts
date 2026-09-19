import { stylemintOperationsApi } from './stylemint-operations.api';

/**
 * Typed client for brand-studio goal templates — the prompts the platform uses to draft a
 * campaign brief for each goal a vendor can pick.
 *
 * Versioned rather than edited in place: authoring a new prompt for a goal creates the next
 * version, superseding replaces the active one, retiring takes a goal out of use entirely. Only
 * one version per goal is ever Active, which is what `active` returns.
 *
 * The list is per goal, not global — `goal` is a required query parameter and omitting it is a
 * 400 ("Unknown goal"), not an empty list.
 */

export const CampaignGoal = {
  DriveFirstPurchase: 1,
  ReintroduceDormant: 2,
  LaunchNewVariant: 3,
  ClearSlowInventory: 4,
  BuildSeasonalAwareness: 5,
  EducateOnUse: 6,
  TestNewAudience: 7,
} as const;
export type CampaignGoalValue = (typeof CampaignGoal)[keyof typeof CampaignGoal];

export const CAMPAIGN_GOAL_LABEL: Record<number, string> = {
  1: 'Drive first purchase',
  2: 'Reintroduce dormant',
  3: 'Launch new variant',
  4: 'Clear slow inventory',
  5: 'Build seasonal awareness',
  6: 'Educate on use',
  7: 'Test new audience',
};

export const GoalTemplateState = { Active: 1, Superseded: 2, Retired: 3 } as const;
export const GOAL_TEMPLATE_STATE_LABEL: Record<number, string> = {
  1: 'Active',
  2: 'Superseded',
  3: 'Retired',
};

export type GoalTemplateVersion = {
  id: string;
  goal: number;
  version: number;
  promptText: string;
  notes?: string | null;
  state: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdUtc: string;
  updatedUtc: string;
  rowVersion: string;
};

const BASE = 'v1/admin/brand-studio/goal-templates';

function unwrap<T>(response: { status: number; body: unknown }): T {
  if (response.status >= 200 && response.status < 300) return response.body as T;

  const body = response.body as { title?: string; message?: string } | undefined;
  const detail = body?.title ?? body?.message;

  if (response.status === 404) throw new Error('NOT_FOUND');
  if (response.status === 403) {
    throw new Error(
      detail ?? 'Goal templates need a Stylemint operator role an administrator grants.',
    );
  }
  if (response.status === 409) {
    throw new Error(detail ?? 'That version has already been superseded or retired.');
  }
  throw new Error(detail ?? `The brand-studio surface returned HTTP ${response.status}.`);
}

export const stylemintBrandStudioApi = {
  /** Every version for one goal, newest first as the backend orders them. */
  versions: async (goal: CampaignGoalValue): Promise<GoalTemplateVersion[]> =>
    unwrap<GoalTemplateVersion[]>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: BASE,
        query: `goal=${goal}`,
      }),
    ),

  /** The one version currently in use for a goal. 404s when a goal has none. */
  active: async (goal: CampaignGoalValue): Promise<GoalTemplateVersion> =>
    unwrap<GoalTemplateVersion>(
      await stylemintOperationsApi.invoke({
        method: 'GET',
        path: `${BASE}/active`,
        query: `goal=${goal}`,
      }),
    ),

  /** Creates the next version for a goal. */
  author: async (
    goal: CampaignGoalValue,
    promptText: string,
    notes?: string,
  ): Promise<GoalTemplateVersion> =>
    unwrap<GoalTemplateVersion>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: BASE,
        body: JSON.stringify({ goal, promptText, notes: notes || null }),
      }),
    ),

  supersede: async (id: string): Promise<GoalTemplateVersion> =>
    unwrap<GoalTemplateVersion>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(id)}/supersede`,
      }),
    ),

  retire: async (id: string): Promise<GoalTemplateVersion> =>
    unwrap<GoalTemplateVersion>(
      await stylemintOperationsApi.invoke({
        method: 'POST',
        path: `${BASE}/${encodeURIComponent(id)}/retire`,
      }),
    ),
};
